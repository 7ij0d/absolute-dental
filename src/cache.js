/**
 * Simple two-layer cache:
 * 1. In-memory (Map) – fastest, resets on full page reload
 * 2. sessionStorage  – survives React navigation, resets when tab closes
 *
 * Usage:
 *   import { cacheGet, cacheSet } from '../cache';
 *   const cached = cacheGet('subjects:dental-anatomy');
 *   cacheSet('subjects:dental-anatomy', data, 5 * 60); // 5 min TTL
 */

const memCache = new Map();

export function cacheGet(key) {
  // Check memory first (fastest)
  if (memCache.has(key)) return memCache.get(key);

  // Fall back to sessionStorage
  try {
    const raw = sessionStorage.getItem(`smyl:${key}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (expiresAt && Date.now() > expiresAt) {
      sessionStorage.removeItem(`smyl:${key}`);
      return null;
    }
    memCache.set(key, value); // warm the memory cache
    return value;
  } catch {
    return null;
  }
}

export function cacheSet(key, value, ttlSeconds = 300) {
  memCache.set(key, value);
  try {
    sessionStorage.setItem(
      `smyl:${key}`,
      JSON.stringify({ value, expiresAt: Date.now() + ttlSeconds * 1000 })
    );
  } catch {
    // sessionStorage full or unavailable – memory cache still works
  }
}

export function cacheDelete(key) {
  memCache.delete(key);
  try { sessionStorage.removeItem(`smyl:${key}`); } catch {}
}
