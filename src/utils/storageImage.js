import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

const MEDIA_CACHE_NAME = 'smylodent-storage-media-v1';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format';
const blobMemoryCache = new Map(); // rawUrl -> blobUrl
const inflightRequests = new Map();

export function isPdfSheetsStorageImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('/storage/v1/object/public/pdf-sheets/smylodent-products/') ||
    (url.includes('/storage/v1/object/public/pdf-sheets/') && /\.(jpg|jpeg|png|webp|gif)$/i.test(url));
}

export async function resolveStorageImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return FALLBACK_IMAGE;
  if (!isPdfSheetsStorageImageUrl(rawUrl)) return rawUrl;

  if (blobMemoryCache.has(rawUrl)) {
    return blobMemoryCache.get(rawUrl);
  }
  if (inflightRequests.has(rawUrl)) {
    return inflightRequests.get(rawUrl);
  }

  const promise = (async () => {
    try {
      let arrayBuffer = null;

      // 1. Check persistent CacheStorage first (0 network egress on repeat visits)
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open(MEDIA_CACHE_NAME);
          const cachedRes = await cache.match(rawUrl);
          if (cachedRes && cachedRes.ok) {
            arrayBuffer = await cachedRes.arrayBuffer();
          }
        } catch (_) {}
      }

      // 2. Fetch from Cloudflare CDN / Supabase Storage
      if (!arrayBuffer) {
        const res = await fetch(rawUrl, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open(MEDIA_CACHE_NAME);
            await cache.put(rawUrl, res.clone());
          } catch (_) {}
        }
        arrayBuffer = await res.arrayBuffer();
      }

      const lower = rawUrl.toLowerCase();
      const mime = lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

      const blob = new Blob([arrayBuffer], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      blobMemoryCache.set(rawUrl, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn('[Smylodent Storage] Failed to resolve storage image:', rawUrl, err);
      return FALLBACK_IMAGE;
    } finally {
      inflightRequests.delete(rawUrl);
    }
  })();

  inflightRequests.set(rawUrl, promise);
  return promise;
}

export function useStorageImage(rawUrl, fallback = FALLBACK_IMAGE) {
  const initial = (!rawUrl || isPdfSheetsStorageImageUrl(rawUrl))
    ? (blobMemoryCache.get(rawUrl) || '')
    : rawUrl;

  const [resolvedSrc, setResolvedSrc] = useState(initial || fallback);

  useEffect(() => {
    let active = true;
    if (!rawUrl) {
      setResolvedSrc(fallback);
      return;
    }
    if (!isPdfSheetsStorageImageUrl(rawUrl)) {
      setResolvedSrc(rawUrl);
      return;
    }
    if (blobMemoryCache.has(rawUrl)) {
      setResolvedSrc(blobMemoryCache.get(rawUrl));
      return;
    }

    resolveStorageImageUrl(rawUrl).then((url) => {
      if (active && url) {
        setResolvedSrc(url);
      }
    });

    return () => {
      active = false;
    };
  }, [rawUrl, fallback]);

  return resolvedSrc;
}

/**
 * Compress and upload a product image directly to Supabase Storage.
 * Never returns Base64 strings to be saved in `products.image_url`.
 */
export async function uploadProductImageToStorage(file) {
  const compressImageToBlob = (inputFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas compression failed'));
            },
            'image/jpeg',
            0.78
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(inputFile);
    });

  const blob = await compressImageToBlob(file);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;

  // 1. Try dedicated `smylodent-assets` bucket first
  const primaryPath = `products/${fileName}`;
  const { error: primaryErr } = await supabase.storage
    .from('smylodent-assets')
    .upload(primaryPath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true
    });

  if (!primaryErr) {
    const { data: { publicUrl } } = supabase.storage
      .from('smylodent-assets')
      .getPublicUrl(primaryPath);
    return publicUrl;
  }

  // 2. Upload to verified `pdf-sheets/smylodent-products/` Storage path (never fall back to Base64 in DB!)
  const storagePath = `smylodent-products/${fileName}`;
  const { error: fallbackErr } = await supabase.storage
    .from('pdf-sheets')
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      cacheControl: '31536000',
      upsert: true
    });

  if (fallbackErr) {
    throw new Error(`Supabase Storage upload failed: ${fallbackErr.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('pdf-sheets')
    .getPublicUrl(storagePath);

  // Pre-warm in-memory blob cache so admin sees preview immediately
  blobMemoryCache.set(publicUrl, URL.createObjectURL(blob));
  return publicUrl;
}

// Automatically upgrade any <img src=".../storage/v1/object/public/pdf-sheets/..."> in the DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const upgradeImgElement = (img) => {
    if (!img || img.tagName !== 'IMG') return;
    const rawAttr = img.getAttribute('src');
    if (isPdfSheetsStorageImageUrl(rawAttr) && img.dataset.resolvedFrom !== rawAttr) {
      img.dataset.resolvedFrom = rawAttr;
      resolveStorageImageUrl(rawAttr).then((blobUrl) => {
        if (blobUrl && img.getAttribute('src') === rawAttr) {
          img.src = blobUrl;
        }
      });
    }
  };

  const setupObserver = () => {
    if (!document.body) return;
    document.querySelectorAll('img').forEach(upgradeImgElement);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'src') {
          upgradeImgElement(m.target);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.tagName === 'IMG') upgradeImgElement(node);
              else if (node.querySelectorAll) node.querySelectorAll('img').forEach(upgradeImgElement);
            }
          });
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
}
