/**
 * prefetch.js — Shared deduplicated data fetchers & deferred background prefetch
 * Eliminates duplicate startup requests and defers heavy catalog warm-up until idle.
 */
import { supabase } from './supabaseClient';
import { cacheGet, cacheSet } from './cache';
import { syncLiveProductStates, isProductHiddenFromStore } from './utils/productInventoryEngine';

const TTL = 86400; // 24 hours

// Lightweight catalog columns for storefront listing & search (avoids downloading long details/audio/video on every page)
export const STOREFRONT_PRODUCT_COLUMNS =
  'id, name_ar, name_en, description_ar, description_en, price, compare_at_price, image_url, availability, stock_quantity, is_active, is_archived, is_featured, subject_id, year_id, is_bundle, is_universal, all_subjects, all_years, discount_label_ar, discount_label_en, shared_inventory_product_id, unit_multiplier, sort_order, created_at';

let yearsPromise = null;
let subjectsPromise = null;
let productsPromise = null;
let junctionsPromise = null;

export function fetchSharedYears() {
  const cached = cacheGet('years');
  if (cached) return Promise.resolve(cached);
  if (yearsPromise) return yearsPromise;

  yearsPromise = supabase
    .from('years')
    .select('id, name_ar, name_en, slug, sort_order, is_coming_soon, image_url')
    .order('sort_order', { ascending: true })
    .then(({ data, error }) => {
      yearsPromise = null;
      if (!error && data?.length) {
        cacheSet('years', data, TTL);
        return data;
      }
      return [];
    })
    .catch(() => {
      yearsPromise = null;
      return [];
    });

  return yearsPromise;
}

export function fetchSharedSubjects() {
  const cached = cacheGet('subjects:all');
  if (cached) return Promise.resolve(cached);
  if (subjectsPromise) return subjectsPromise;

  subjectsPromise = supabase
    .from('subjects')
    .select('id, year_id, name_ar, name_en, description_ar, description_en, slug, sort_order, image_url')
    .order('sort_order', { ascending: true })
    .then(({ data, error }) => {
      subjectsPromise = null;
      if (!error && data?.length) {
        cacheSet('subjects:all', data, TTL);
        const byYear = {};
        for (const s of data) {
          if (!byYear[s.year_id]) byYear[s.year_id] = [];
          byYear[s.year_id].push(s);
        }
        for (const [yearId, subjects] of Object.entries(byYear)) {
          cacheSet('subjects:year:' + yearId, subjects, TTL);
        }
        return data;
      }
      return [];
    })
    .catch(() => {
      subjectsPromise = null;
      return [];
    });

  return subjectsPromise;
}

/**
 * Shared deduplicated fetcher for all DB products (including hidden/archived flags for accurate sync).
 * Cached for 3 minutes and invalidated immediately whenever Admin updates a product.
 */
export function fetchSharedCatalogProducts(forceRefresh = false) {
  if (!forceRefresh) {
    const cachedRaw = cacheGet('products:raw_all_v2');
    if (Array.isArray(cachedRaw) && cachedRaw.length > 0) {
      return Promise.resolve(cachedRaw);
    }
  }
  if (productsPromise && !forceRefresh) return productsPromise;

  productsPromise = supabase
    .from('products')
    .select(STOREFRONT_PRODUCT_COLUMNS)
    .order('sort_order', { ascending: true })
    .then(({ data, error }) => {
      productsPromise = null;
      if (!error && Array.isArray(data) && data.length > 0) {
        syncLiveProductStates(data);
        cacheSet('products:raw_all_v2', data, 180);
        const activeList = data.filter((p) => p.is_active !== false && !p.is_archived);
        cacheSet('products:all', activeList, 180);
        const featured = activeList.filter((p) => p.is_featured);
        cacheSet('products:featured', featured, 180);
        return data;
      }
      return cacheGet('products:raw_all_v2') || [];
    })
    .catch(() => {
      productsPromise = null;
      return cacheGet('products:raw_all_v2') || [];
    });

  return productsPromise;
}

/**
 * Shared deduplicated fetcher for `product_subjects` junction table.
 */
export function fetchSharedProductJunctions(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheGet('products:junctions_v2');
    if (Array.isArray(cached)) return Promise.resolve(cached);
  }
  if (junctionsPromise && !forceRefresh) return junctionsPromise;

  junctionsPromise = supabase
    .from('product_subjects')
    .select('product_id, subject_id')
    .then(({ data, error }) => {
      junctionsPromise = null;
      if (!error && Array.isArray(data)) {
        cacheSet('products:junctions_v2', data, 180);
        return data;
      }
      return cacheGet('products:junctions_v2') || [];
    })
    .catch(() => {
      junctionsPromise = null;
      return cacheGet('products:junctions_v2') || [];
    });

  return junctionsPromise;
}

export function fetchSharedActiveProducts() {
  const cached = cacheGet('products:all');
  if (cached) {
    return Promise.resolve(cached.filter((p) => !isProductHiddenFromStore(p)));
  }
  return fetchSharedCatalogProducts().then((raw) =>
    (raw || []).filter((p) => p.is_active !== false && !p.is_archived && !isProductHiddenFromStore(p))
  );
}

export function runPrefetch() {
  // Schedule background warm-up when the main thread & network are idle
  const scheduleIdle =
    typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
      ? (cb) => window.requestIdleCallback(cb, { timeout: 2500 })
      : (cb) => setTimeout(cb, 1200);

  scheduleIdle(() => {
    fetchSharedYears();
    fetchSharedSubjects();
    // Defer full product catalog warm-up slightly further so initial navigation is unblocked
    setTimeout(() => {
      fetchSharedCatalogProducts();
      fetchSharedProductJunctions();
    }, 900);
  });
}
