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

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';

export const FALLBACK_BOXES = [
  {
    id: 'box-14',
    size: '14 inch',
    name_ar: '14" Dental Tool Box',
    name_en: '14" Dental Tool Box',
    price: 45,
    stock_quantity: 1,
    desc_ar: 'Compact Arradent dental toolbox with a colored lid, top organizer compartments, and durable carry handle.',
    desc_en: 'Compact Arradent dental toolbox with a colored lid, top organizer compartments, and durable carry handle.',
    features_ar: ['Top organizer compartments', 'Single front latch', 'Compact portable size', 'Comfortable carry handle'],
    features_en: ['Top organizer compartments', 'Single front latch', 'Compact portable size', 'Comfortable carry handle'],
    main_image: `${BASE}accessories/box14-pink.jpg`,
    inside_image: `${BASE}accessories/box14-pink.jpg`,
    colors: [
      { id: 'pink', hex_code: '#F48FB1', label_ar: 'وردي', label_en: 'Pink', status: 'in_stock', available_stock: 1, physical_stock: 1, reserved_stock: 0, image_url: `${BASE}accessories/box14-pink.jpg` }
    ]
  },
  {
    id: 'box-16',
    size: '16 inch',
    name_ar: '16" Dental Tool Box',
    name_en: '16" Dental Tool Box',
    price: 65,
    stock_quantity: 12,
    desc_ar: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    desc_en: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    features_ar: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    features_en: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    main_image: `${BASE}accessories/box16-purple.jpg`,
    inside_image: `${BASE}accessories/box16-inside-blue.jpg`,
    colors: [
      { id: 'purple', hex_code: '#7B3FE4', label_ar: 'بنفسجي', label_en: 'Purple', status: 'in_stock', available_stock: 6, physical_stock: 6, reserved_stock: 0, image_url: `${BASE}accessories/box16-purple.jpg`, inside_image_url: `${BASE}accessories/box16-inside-purple.jpg`, base_image_url: `${BASE}accessories/box16-base-purple.jpg` },
      { id: 'pink', hex_code: '#F48FB1', label_ar: 'وردي', label_en: 'Pink', status: 'in_stock', available_stock: 6, physical_stock: 6, reserved_stock: 0, image_url: `${BASE}accessories/box16-pink.jpg`, inside_image_url: `${BASE}accessories/box16-inside-purple.jpg`, base_image_url: `${BASE}accessories/box16-base-purple.jpg` },
      { id: 'maroon', hex_code: '#800020', label_ar: 'خمري / عنابي', label_en: 'Maroon', status: 'in_stock', available_stock: 1, physical_stock: 1, reserved_stock: 0, image_url: `${BASE}accessories/box16-maroon.jpg`, inside_image_url: `${BASE}accessories/box16-inside-maroon.jpg`, base_image_url: `${BASE}accessories/box16-base-maroon.jpg` },
      { id: 'blue', hex_code: '#1565C0', label_ar: 'أزرق [out_of_stock]', label_en: 'Blue [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16-blue.jpg`, inside_image_url: `${BASE}accessories/box16-inside-blue.jpg`, base_image_url: `${BASE}accessories/box16-base-blue.jpg` },
      { id: 'red', hex_code: '#E02020', label_ar: 'أحمر [out_of_stock]', label_en: 'Red [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16-red.jpg`, inside_image_url: `${BASE}accessories/box16-inside-red.jpg`, base_image_url: `${BASE}accessories/box16-base-red.jpg` },
      { id: 'yellow', hex_code: '#F5C518', label_ar: 'أصفر [out_of_stock]', label_en: 'Yellow [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16-yellow.jpg`, inside_image_url: `${BASE}accessories/box16-inside-yellow.jpg`, base_image_url: `${BASE}accessories/box16-base-yellow.jpg` },
    ]
  },
  {
    id: 'box-16-5',
    size: '16.5 inch',
    name_ar: '16.5" Organizer Box',
    name_en: '16.5" Organizer Box',
    price: 85,
    stock_quantity: 4,
    desc_ar: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    desc_en: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    features_ar: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    features_en: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    main_image: `${BASE}accessories/box16_5-real.jpg`,
    inside_image: `${BASE}accessories/box16_5-inside.png`,
    colors: [
      { id: 'black', hex_code: '#1F2937', label_ar: 'أسود', label_en: 'Black', status: 'in_stock', available_stock: 4, physical_stock: 4, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-black.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside.png` },
      { id: 'red', hex_code: '#D32F2F', label_ar: 'أحمر [out_of_stock]', label_en: 'Red [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-red.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-red.jpg` },
      { id: 'blue', hex_code: '#2196F3', label_ar: 'أزرق فاتح [out_of_stock]', label_en: 'Light Blue [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-blue.png`, inside_image_url: `${BASE}accessories/box16_5-inside-blue.jpg` },
      { id: 'navy', hex_code: '#0D47A1', label_ar: 'أزرق داكن [out_of_stock]', label_en: 'Dark Navy Blue [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-blue.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-blue.jpg` },
      { id: 'purple', hex_code: '#6A3093', label_ar: 'بنفسجي [out_of_stock]', label_en: 'Purple [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-purple.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-purple.jpg` },
      { id: 'teal', hex_code: '#00ACC1', label_ar: 'تركوازي [out_of_stock]', label_en: 'Teal [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-teal.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-teal.jpg` },
      { id: 'green', hex_code: '#7CB342', label_ar: 'أخضر [out_of_stock]', label_en: 'Lime Green [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-green.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-green.jpg` },
      { id: 'orange', hex_code: '#F57C00', label_ar: 'برتقالي [out_of_stock]', label_en: 'Orange [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box16_5-orange.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-orange.jpg` },
    ]
  },
  {
    id: 'box-17',
    size: '17.5 inch',
    name_ar: '17.5" Professional Box — GT-MAX',
    name_en: '17.5" Professional Box — GT-MAX',
    price: 95,
    stock_quantity: 10,
    desc_ar: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a clear organizer and wide main storage.',
    desc_en: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a clear organizer and wide main storage.',
    features_ar: ['Clear lid organizer', 'Wide main storage space', 'Two side + front latches', 'Strong & Durable plastic'],
    features_en: ['Clear lid organizer', 'Wide main storage space', 'Two side + front latches', 'Strong & Durable plastic'],
    main_image: `${BASE}accessories/box17_5-dark-blue.jpg`,
    inside_image: `${BASE}accessories/box17-inside-black.jpg`,
    colors: [
      { id: 'blue', hex_code: '#0D47A1', label_ar: 'أزرق داكن', label_en: 'Dark Blue', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: `${BASE}accessories/box17_5-dark-blue.jpg`, inside_image_url: `${BASE}accessories/box17-inside-blue.jpg` },
      { id: 'black', hex_code: '#111111', label_ar: 'أسود [out_of_stock]', label_en: 'Black [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-black.jpg`, inside_image_url: `${BASE}accessories/box17-inside-black.jpg` },
      { id: 'purple', hex_code: '#A880C8', label_ar: 'بنفسجي [out_of_stock]', label_en: 'Purple [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-purple.jpg`, inside_image_url: `${BASE}accessories/box17-inside-purple.jpg` },
      { id: 'red', hex_code: '#E02020', label_ar: 'أحمر [out_of_stock]', label_en: 'Red [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-red.jpg`, inside_image_url: `${BASE}accessories/box17-inside-red.jpg` },
      { id: 'pink', hex_code: '#F48FB1', label_ar: 'وردي [out_of_stock]', label_en: 'Pink [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-pink.jpg`, inside_image_url: `${BASE}accessories/box17-inside-pink.jpg` },
      { id: 'beige', hex_code: '#C8A882', label_ar: 'بيج [out_of_stock]', label_en: 'Beige [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-beige.jpg`, inside_image_url: `${BASE}accessories/box17-inside-beige.jpg` },
      { id: 'teal', hex_code: '#00897B', label_ar: 'تركوازي [out_of_stock]', label_en: 'Teal [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'lime', hex_code: '#7CB342', label_ar: 'أخضر فسفوري [out_of_stock]', label_en: 'Lime Green [out_of_stock]', status: 'out_of_stock', available_stock: 0, physical_stock: 0, reserved_stock: 0, image_url: `${BASE}accessories/box17-colors.png` },
    ]
  }
];

export function getBoxProductById(id) {
  if (!id) return null;
  const strId = String(id).toLowerCase().trim();
  return FALLBACK_BOXES.find(b =>
    String(b.id).toLowerCase() === strId ||
    (b.size && b.size.toLowerCase() === strId) ||
    (b.name_en && b.name_en.toLowerCase().includes(strId)) ||
    (b.name_ar && b.name_ar.includes(strId))
  ) || null;
}
