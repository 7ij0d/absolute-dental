/**
 * Two-layer cache: in-memory (Map) + sessionStorage
 * Prefix: 'ad:' (absolute-dental) — changing this prefix from 'smyl:'
 * instantly invalidates ALL old cached data from the previous branding.
 */

const CACHE_PREFIX = 'ad:';
const memCache = new Map();

/**
 * Called once on app startup — purges any stale keys from the old 'smyl:' prefix
 * and any old mock_ localStorage entries from the Smylodent era.
 */
export function clearStaleCache() {
  try {
    // Remove old sessionStorage keys with 'smyl:' prefix
    const keysToDelete = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('smyl:')) keysToDelete.push(k);
    }
    keysToDelete.forEach(k => sessionStorage.removeItem(k));

    // Remove old mock_ localStorage keys (Smylodent era)
    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('mock_') || k === 'mock_user_session')) lsKeys.push(k);
    }
    lsKeys.forEach(k => localStorage.removeItem(k));

    // Sanitize any stored donations or student requests in localStorage to replace "ملازم" with "شيتات"
    ['ad_donations', 'ad_student_requests'].forEach(lsKey => {
      const raw = localStorage.getItem(lsKey);
      if (raw && raw.includes('ملازم')) {
        const cleaned = raw.replace(/ملازم ومذكرات/g, 'شيتات ومذكرات')
                           .replace(/الملازم/g, 'الشيتات')
                           .replace(/ملازم/g, 'شيتات');
        localStorage.setItem(lsKey, cleaned);
      }
    });
  } catch (_) {}
}

export function cacheGet(key) {
  if (memCache.has(key)) return memCache.get(key);
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (expiresAt && Date.now() > expiresAt) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    memCache.set(key, value);
    return value;
  } catch {
    return null;
  }
}

export function cacheSet(key, value, ttlSeconds = 1800) {
  memCache.set(key, value);
  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ value, expiresAt: Date.now() + ttlSeconds * 1000 })
    );
  } catch {
    // sessionStorage full — memory cache still works
  }
}

export function cacheDelete(key) {
  memCache.delete(key);
  try { sessionStorage.removeItem(`${CACHE_PREFIX}${key}`); } catch {}
}
