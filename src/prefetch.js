/**
 * prefetch.js — Background data prefetch on app startup
 * Warms the cache so pages render instantly on navigation.
 */
import { supabase } from './supabaseClient';
import { cacheGet, cacheSet } from './cache';

const TTL = 86400; // 24 hours

async function prefetchYears() {
  if (cacheGet('years')) return;
  try {
    const { data, error } = await supabase.from('years').select('*').order('sort_order', { ascending: true });
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
      .from('subjects').select('*').order('sort_order', { ascending: true });
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

async function prefetchAllActiveProducts() {
  if (cacheGet('products:all')) return;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });
    if (!error && data?.length) {
      cacheSet('products:all', data, TTL);
      const featured = data.filter(p => p.is_featured);
      cacheSet('products:featured', featured, TTL);
    }
  } catch (_) {}
}

export function runPrefetch() {
  Promise.all([
    prefetchYears(),
    prefetchBanners(),
    prefetchSubjects(),
    prefetchAllActiveProducts(),
  ]).catch(() => {});
}
