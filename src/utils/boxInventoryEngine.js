import supabase from '../supabaseClient.js';

/**
 * ABSOLUTE DENTAL — UNIFIED BOX INVENTORY & COLOR VARIANT ENGINE
 * Single canonical source of truth for:
 * 1. Dental Box Products (16", 16.5", 17" GT-MAX)
 * 2. Independent Color Variant Stock (Physical, Reserved, Available)
 * 3. Dual-Row Availability Segregation:
 *    - Row A: "الألوان المتوفرة" (availableStock > 0)
 *    - Row B: "الألوان غير المتوفرة حالياً" (availableStock <= 0)
 * 4. Zero-stock enforcement across Storefront, Cart, Checkout, and Admin
 */

export const BOX_PRODUCT_IDS = {
  BOX_14: 'e4efb7b3-d329-4dbc-970b-3943c8abb96b',
  BOX_16: 'd521fc29-f29c-472f-ad22-1a94cd985cd1',
  BOX_16_5: '6249dd01-8b62-4dfa-a043-b619c30df688',
  BOX_17: 'ef85fc7a-c8bd-4fb3-9b5a-a2449bf891a2',
  FALLBACK_14: 'box-14',
  FALLBACK_16: 'box-16',
  FALLBACK_16_5: 'box-16-5',
  FALLBACK_17: 'box-17'
};

export const CANONICAL_BOXES = {
  [BOX_PRODUCT_IDS.BOX_14]: {
    id: BOX_PRODUCT_IDS.BOX_14,
    fallbackId: 'box-14',
    size: '14 inch',
    nameAr: '14" Dental Tool Box',
    nameEn: '14" Dental Tool Box',
    defaultPrice: 45
  },
  [BOX_PRODUCT_IDS.BOX_16]: {
    id: BOX_PRODUCT_IDS.BOX_16,
    fallbackId: 'box-16',
    size: '16 inch',
    nameAr: '16" Dental Tool Box',
    nameEn: '16" Dental Tool Box',
    defaultPrice: 65
  },
  [BOX_PRODUCT_IDS.BOX_16_5]: {
    id: BOX_PRODUCT_IDS.BOX_16_5,
    fallbackId: 'box-16-5',
    size: '16.5 inch',
    nameAr: '16.5" Organizer Box',
    nameEn: '16.5" Organizer Box',
    defaultPrice: 85
  },
  [BOX_PRODUCT_IDS.BOX_17]: {
    id: BOX_PRODUCT_IDS.BOX_17,
    fallbackId: 'box-17',
    size: '17.5 inch',
    nameAr: '17.5" Professional Box — GT-MAX',
    nameEn: '17.5" Professional Box — GT-MAX',
    defaultPrice: 95
  }
};

/**
 * Checks if a given product ID or product object is a dental box.
 */
export function isBoxProduct(productOrId) {
  if (!productOrId) return false;
  const id = typeof productOrId === 'object' ? (productOrId.id || productOrId.product_id || '') : String(productOrId);
  const nameEn = typeof productOrId === 'object' ? (productOrId.name_en || '') : '';
  const nameAr = typeof productOrId === 'object' ? (productOrId.name_ar || '') : '';
  const slug = typeof productOrId === 'object' ? (productOrId.slug || productOrId.category_slug || '') : '';

  if (Object.values(BOX_PRODUCT_IDS).includes(id)) return true;
  if (slug === 'dental-boxes') return true;
  if (/Dental Tool Box|Organizer Box|GT-MAX/i.test(nameEn)) return true;
  if (/بوكسات الأسنان|بوكس الأدوات/i.test(nameAr)) return true;
  return false;
}

/**
 * Strips bracketed status tags from Arabic or English color labels.
 */
export function cleanColorLabel(color, lang = 'ar') {
  if (!color) return '';
  const text = lang === 'ar'
    ? (color.label_ar || color.color_name_ar || color.label_en || color.color_name_en || '')
    : (color.label_en || color.color_name_en || color.label_ar || color.color_name_ar || '');
  return text.replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]|نفذت الكمية|غير متوفر/g, '').trim();
}

/**
 * Normalizes a variant identifier for reliable lookup across DB UUIDs and slug codes.
 */
export function getVariantLookupKey(color) {
  if (!color) return '';
  return color.id || color.variant_id || color.color_id || '';
}

/**
 * Computes available stock from physical and reserved stock safely.
 * Available = Math.max(0, physical - reserved)
 */
export function computeVariantAvailableStock(physicalStock = 0, reservedStock = 0) {
  const phys = Math.max(0, parseInt(physicalStock, 10) || 0);
  const res = Math.max(0, parseInt(reservedStock, 10) || 0);
  return Math.max(0, phys - res);
}

/**
 * Fetches the canonical box variants inventory from the database (settings table).
 * Returns a Map and Object keyed by variant ID and (product_id + color_id).
 */
export async function fetchCanonicalBoxInventory() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'box_variants_inventory')
      .maybeSingle();

    if (error || !data?.value?.variants) {
      return { variants: {}, raw: null };
    }

    const variants = data.value.variants;
    return {
      variants,
      raw: data.value,
      updatedAt: data.value.updated_at
    };
  } catch (err) {
    console.warn('Could not fetch canonical box inventory, using safe zero fallback:', err);
    return { variants: {}, raw: null };
  }
}

/**
 * Saves or updates a color variant's stock, price, dimensions, or image in the canonical database store.
 * Idempotent, safe, and keeps physical, reserved, and available stock synchronized.
 */
export async function saveBoxVariantInventoryRecord(variantId, updates) {
  if (!variantId) throw new Error('Variant ID is required to update inventory');

  // 1. Fetch current canonical state
  const { data: currentSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'box_variants_inventory')
    .maybeSingle();

  const currentVariants = currentSetting?.value?.variants || {};
  const existingRecord = currentVariants[variantId] || {};

  const physicalStock = updates.physical_stock !== undefined
    ? Math.max(0, parseInt(updates.physical_stock, 10) || 0)
    : (existingRecord.physical_stock || 0);

  const reservedStock = updates.reserved_stock !== undefined
    ? Math.max(0, parseInt(updates.reserved_stock, 10) || 0)
    : (existingRecord.reserved_stock || 0);

  const availableStock = computeVariantAvailableStock(physicalStock, reservedStock);
  const status = availableStock > 0 ? 'in_stock' : 'out_of_stock';

  const updatedVariant = {
    ...existingRecord,
    ...updates,
    id: variantId,
    physical_stock: physicalStock,
    reserved_stock: reservedStock,
    available_stock: availableStock,
    status,
    updated_at: new Date().toISOString()
  };

  currentVariants[variantId] = updatedVariant;

  const payload = {
    key: 'box_variants_inventory',
    value: {
      ...(currentSetting?.value || {}),
      updated_at: new Date().toISOString(),
      variants: currentVariants
    }
  };

  const { error: upsertErr } = await supabase
    .from('settings')
    .upsert(payload);

  if (upsertErr) {
    throw upsertErr;
  }

  // 2. Also keep accessory_product_colors table aligned (status label suffix & images)
  try {
    const cleanAr = cleanColorLabel(updatedVariant, 'ar');
    const cleanEn = cleanColorLabel(updatedVariant, 'en');
    const statusSuffix = availableStock > 0 ? '' : ' [out_of_stock]';

    const colorUpdates = {
      label_ar: cleanAr + statusSuffix,
      label_en: cleanEn + statusSuffix
    };
    if (updates.image_url) colorUpdates.image_url = updates.image_url;
    if (updates.hex_code) colorUpdates.hex_code = updates.hex_code;

    await supabase
      .from('accessory_product_colors')
      .update(colorUpdates)
      .eq('id', variantId);
  } catch (syncErr) {
    console.warn('Syncing accessory_product_colors row notice:', syncErr);
  }

  return updatedVariant;
}

/**
 * Splits a list of box color variants into:
 * 1. Available Colors (available_stock > 0)
 * 2. Currently Unavailable Colors (available_stock <= 0)
 *
 * Implements strict inventory-driven segregation.
 */
export function splitBoxColorsByAvailability(colors = [], inventoryMap = {}) {
  if (!Array.isArray(colors)) {
    return { availableColors: [], unavailableColors: [], allUnavailable: true };
  }

  const availableColors = [];
  const unavailableColors = [];

  colors.forEach((color) => {
    const idKey = color.id;
    const colorIdKey = color.color_id;
    const inv = inventoryMap[idKey] || inventoryMap[colorIdKey] || null;

    let availableStock = 0;
    let physicalStock = 0;
    let reservedStock = 0;

    if (inv) {
      physicalStock = inv.physical_stock ?? 0;
      reservedStock = inv.reserved_stock ?? 0;
      availableStock = inv.available_stock ?? computeVariantAvailableStock(physicalStock, reservedStock);
    } else if (color.available_stock !== undefined) {
      availableStock = color.available_stock;
      physicalStock = color.physical_stock ?? availableStock;
      reservedStock = color.reserved_stock ?? 0;
    } else {
      // Default initial state: Zero stock
      const rawLabel = `${color.label_ar || ''} ${color.label_en || ''}`;
      if (rawLabel.includes('[out_of_stock]') || color.status === 'out_of_stock') {
        availableStock = 0;
      } else if (color.stock_quantity !== undefined && color.stock_quantity > 0) {
        availableStock = color.stock_quantity;
      } else {
        availableStock = 0;
      }
    }

    const decorated = {
      ...color,
      physical_stock: physicalStock,
      reserved_stock: reservedStock,
      available_stock: availableStock,
      isAvailable: availableStock > 0,
      price: (inv && inv.price) ? inv.price : (color.price || null),
      size: (inv && inv.size) ? inv.size : (color.size || null),
      image_url: (inv && inv.image_url) ? inv.image_url : (color.image_url || null)
    };

    if (availableStock > 0) {
      availableColors.push(decorated);
    } else {
      unavailableColors.push(decorated);
    }
  });

  return {
    availableColors,
    unavailableColors,
    allUnavailable: availableColors.length === 0,
    totalColors: colors.length
  };
}

/**
 * Safely resets all dental box products and variants to zero stock.
 * Fully idempotent, preserves all product definitions, color variants, image URLs,
 * and historic order records.
 */
export async function resetAllBoxStockToZero() {
  // 1. Fetch current canonical state
  const { data: currentSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'box_variants_inventory')
    .maybeSingle();

  const currentVariants = currentSetting?.value?.variants || {};
  const updatedVariants = {};

  // 2. Fetch all accessory_product_colors to ensure every variant is captured
  const { data: allColors, error: colorsErr } = await supabase
    .from('accessory_product_colors')
    .select('*');

  if (colorsErr) throw colorsErr;

  if (Array.isArray(allColors)) {
    for (const color of allColors) {
      if (!isBoxProduct(color.product_id)) continue;
      const cleanAr = cleanColorLabel(color, 'ar');
      const cleanEn = cleanColorLabel(color, 'en');
      const existing = currentVariants[color.id] || {};

      updatedVariants[color.id] = {
        ...existing,
        id: color.id,
        product_id: color.product_id,
        color_id: color.color_id,
        label_ar: cleanAr,
        label_en: cleanEn,
        hex_code: color.hex_code,
        image_url: color.image_url,
        sort_order: color.sort_order,
        physical_stock: 0,
        reserved_stock: 0,
        available_stock: 0,
        status: 'out_of_stock',
        updated_at: new Date().toISOString()
      };

      // Also ensure suffix in accessory_product_colors table
      try {
        await supabase
          .from('accessory_product_colors')
          .update({
            label_ar: `${cleanAr} [out_of_stock]`,
            label_en: `${cleanEn} [out_of_stock]`
          })
          .eq('id', color.id);
      } catch (e) {
        console.warn('Syncing color row notice:', e);
      }
    }
  }

  // 3. Upsert canonical setting
  const payload = {
    key: 'box_variants_inventory',
    value: {
      ...(currentSetting?.value || {}),
      updated_at: new Date().toISOString(),
      variants: updatedVariants
    }
  };

  const { error: upsertErr } = await supabase
    .from('settings')
    .upsert(payload);

  if (upsertErr) throw upsertErr;

  return updatedVariants;
}
