/**
 * Two-layer persistent cache: in-memory (Map) + localStorage (with sessionStorage fallback)
 * Prefix: 'ad_cache_v2:'
 * Guarantees 0ms instant data availability on app opening and page navigation.
 */

const CACHE_PREFIX = 'ad_cache_v2:';
const memCache = new Map();

/**
 * Called once on app startup — purges any stale keys from previous cache prefixes
 * and old mock_ products entries from localStorage.
 */
export function clearStaleCache() {
  try {
    // Purge old cache prefixes from localStorage
    const lsKeysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && ((k.startsWith('smyl:') || k.startsWith('ad:') || k.startsWith('ad16:')) && !k.startsWith(CACHE_PREFIX))) {
        lsKeysToDelete.push(k);
      }
    }
    lsKeysToDelete.forEach(k => localStorage.removeItem(k));

    // Remove old sessionStorage keys with legacy prefixes
    const keysToDelete = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && ((k.startsWith('smyl:') || k.startsWith('ad')) && !k.startsWith(CACHE_PREFIX))) {
        keysToDelete.push(k);
      }
    }
    keysToDelete.forEach(k => sessionStorage.removeItem(k));

    // Remove mock_products from localStorage
    localStorage.removeItem('mock_products');

    // Remove old mock_ localStorage keys & legacy Supabase tokens
    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('mock_') || k === 'mock_user_session' || k.includes('vqrpodmnzubpcsvqohwj') || k.includes('sb-vqrpodmnzubpcsvqohwj-auth-token'))) {
        lsKeys.push(k);
      }
    }
    lsKeys.forEach(k => localStorage.removeItem(k));

    // Purge legacy dummy test items from localStorage
    ['ad_donations', 'ad_student_requests'].forEach(lsKey => {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        try {
          const items = JSON.parse(raw);
          if (Array.isArray(items)) {
            const cleaned = items.filter(item => 
              item.id !== 'd1' && item.id !== 'd2' && item.id !== 'd3' && 
              item.id !== 'req_1' && item.id !== 'req_2'
            );
            localStorage.setItem(lsKey, JSON.stringify(cleaned));
          }
        } catch (_) {
          localStorage.removeItem(lsKey);
        }
      }
    });
  } catch (_) {}
}

export function cacheGet(key) {
  if (memCache.has(key)) return memCache.get(key);
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`) || sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (expiresAt && Date.now() > expiresAt) {
      try { localStorage.removeItem(`${CACHE_PREFIX}${key}`); } catch {}
      try { sessionStorage.removeItem(`${CACHE_PREFIX}${key}`); } catch {}
      return null;
    }
    memCache.set(key, value);
    return value;
  } catch {
    return null;
  }
}

export function cacheSet(key, value, ttlSeconds = 86400) {
  memCache.set(key, value);
  try {
    const payload = JSON.stringify({ value, expiresAt: Date.now() + ttlSeconds * 1000 });
    localStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
  } catch {
    try {
      sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ value, expiresAt: Date.now() + ttlSeconds * 1000 }));
    } catch {}
  }
}

export function cacheDelete(key) {
  memCache.delete(key);
  try { localStorage.removeItem(`${CACHE_PREFIX}${key}`); } catch {}
  try { sessionStorage.removeItem(`${CACHE_PREFIX}${key}`); } catch {}
}

export function clearSubjectCaches() {
  for (const k of memCache.keys()) {
    if (k.startsWith('subj:') || k.includes('subj') || k.includes('products:') || k.includes('year') || k.includes('subject_v')) {
      memCache.delete(k);
    }
  }
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes('subj:') || k.includes('subj') || k.includes('products:') || k.includes('year') || k.includes('subject_v'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.includes('subj:') || k.includes('subj') || k.includes('products:') || k.includes('year') || k.includes('subject_v'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => sessionStorage.removeItem(k));
  } catch {}
}
