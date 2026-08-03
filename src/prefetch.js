/**
 * prefetch.js — Background data prefetch on app startup
 * Warms the cache so pages render instantly on navigation.
 */
import { supabase } from './supabaseClient';
import { cacheGet, cacheSet } from './cache';

const TTL = 1800; // 30 min

async function prefetchYears() {
  if (cacheGet('years')) return;
  try {
    const { data, error } = await supabase.from('years').select('*').order('id');
    if (!error && data?.length) cacheSet('years', data, TTL);
  } catch (_) {}
}

async function prefetchBanners() {
  if (cacheGet('banners')) return;
  try {
    const { data, error } = await supabase
      .from('banners').select('*').eq('is_active', true).order('sort_order');
    if (!error && data?.length) cacheSet('banners', data, TTL);
  } catch (_) {}
}

async function prefetchSubjects() {
  if (cacheGet('subjects:all')) return;
  try {
    const { data, error } = await supabase
      .from('subjects').select('*').order('sort_order');
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
    }
  } catch (_) {}
}

async function prefetchFeaturedProducts() {
  if (cacheGet('products:featured')) return;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('sort_order')
      .limit(8);
    if (!error && data?.length) cacheSet('products:featured', data, TTL);
  } catch (_) {}
}

export function runPrefetch() {
  Promise.all([
    prefetchYears(),
    prefetchBanners(),
    prefetchSubjects(),
    prefetchFeaturedProducts(),
  ]).catch(() => {});
}
