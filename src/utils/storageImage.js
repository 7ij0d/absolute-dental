import supabase from '../supabaseClient';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format';
const blobMemoryCache = new Map();

export function isPdfSheetsStorageImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('/storage/v1/object/public/pdf-sheets/smylodent-products/') ||
    (url.includes('/storage/v1/object/public/pdf-sheets/') && /\.(jpg|jpeg|png|webp|gif)$/i.test(url));
}

/**
 * Resolves storage image URL instantly with 0ms delay.
 * Allows native browser progressive rendering, HTTP caching, and HTTP/2 multiplexing.
 */
export function resolveStorageImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return FALLBACK_IMAGE;
  return rawUrl;
}

/**
 * Synchronous hook returning the image URL immediately.
 * No state flip, no blank placeholder, no JS fetch queuing.
 */
export function useStorageImage(rawUrl, fallback = FALLBACK_IMAGE) {
  return rawUrl || fallback;
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

  // 2. Upload to verified `pdf-sheets/smylodent-products/` Storage path
  const storagePath = `smylodent-products/${fileName}`;
  const { error: fallbackErr } = await supabase.storage
    .from('pdf-sheets')
    .upload(storagePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true
    });

  if (fallbackErr) {
    throw new Error(`Supabase Storage upload failed: ${fallbackErr.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('pdf-sheets')
    .getPublicUrl(storagePath);

  return publicUrl;
}
