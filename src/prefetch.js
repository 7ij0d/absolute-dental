/**
 * prefetch.js — Shared deduplicated data fetchers & deferred background prefetch
 * Eliminates duplicate startup requests and defers heavy catalog warm-up until idle.
 */
import { supabase } from './supabaseClient';
import { cacheGet, cacheSet } from './cache';
import { syncLiveProductStates, isProductHiddenFromStore } from './utils/productInventoryEngine';

const TTL = 86400; // 24 hours

let yearsPromise = null;
let subjectsPromise = null;
let productsPromise = null;

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
    .select('id, year_id, name_ar, name_en, slug, sort_order, image_url')
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

export function fetchSharedActiveProducts() {
  const cached = cacheGet('products:all');
  if (cached) {
    return Promise.resolve(cached.filter((p) => !isProductHiddenFromStore(p)));
  }
  if (productsPromise) return productsPromise;

  productsPromise = supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .then(({ data, error }) => {
      productsPromise = null;
      if (!error && data?.length) {
        syncLiveProductStates(data);
        const activeList = data.filter((p) => p.is_active !== false && !p.is_archived);
        cacheSet('products:all', activeList, 300);
        const featured = activeList.filter((p) => p.is_featured);
        cacheSet('products:featured', featured, 300);
        return activeList;
      }
      return [];
    })
    .catch(() => {
      productsPromise = null;
      return [];
    });

  return productsPromise;
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
      fetchSharedActiveProducts();
    }, 1000);
  });
}
