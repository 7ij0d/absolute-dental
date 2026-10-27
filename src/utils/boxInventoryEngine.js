import supabase from '../supabaseClient.js';

/**
 * ABSOLUTE DENTAL — UNIFIED BOX INVENTORY & COLOR VARIANT ENGINE
 * Single canonical source of truth for:
 * 1. Dental Box Products (14", 16", 16.5", 17" GT-MAX)
 * 2. Independent Color Variant Stock & 3-Tier Status Model:
 *    - 'in_stock': متوفر وجاهز للطلب الفوري
 *    - 'on_demand': متوفر على الطلب (نوفرهولك)
 *    - 'discontinued': غير متوفر نهائياً (مخفي مؤقتاً)
 * 3. Guaranteed valid image paths with single-slash normalization
 */

export const BOX_VARIANT_STATUS = {
  IN_STOCK: 'in_stock',
  ON_DEMAND: 'on_demand',
  DISCONTINUED: 'discontinued'
};

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

/**
 * Resolves box image paths safely, ensuring a clean single leading slash
 * to prevent protocol-relative '//' domain resolution errors in browsers.
 */
export function resolveBoxImg(path) {
  if (!path) return '/accessories/box17-colors.png';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  return `/${clean}`;
}

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
    size: '17 inch',
    nameAr: '17" Professional Box — GT-MAX',
    nameEn: 'Professional Box — GT-MAX 17"',
    defaultPrice: 95
  }
};

export const FALLBACK_BOXES = [
  {
    id: 'box-14',
    size: '14 inch',
    name_ar: 'Dental Tool Box 14"',
    name_en: 'Dental Tool Box 14"',
    price: 45,
    stock_quantity: 10,
    desc_ar: 'بوكس Arradent المدمج ذو الغطاء الملون والمقبض المتين، مع أقسام علوية لترتيب الأدوات الأساسية وسهولة الحمل.',
    desc_en: 'Compact Arradent dental toolbox with a colored lid, top organizer compartments, and durable carry handle.',
    features_ar: ['أقسام تنظيم علوية بالغطاء', 'قفل أمامي محكم', 'حجم خفيف وعملي', 'مقبض حمل مريح وقوي'],
    features_en: ['Top organizer compartments', 'Single front latch', 'Compact portable size', 'Comfortable carry handle'],
    main_image: '/accessories/box14-colors.png',
    inside_image: '/accessories/box14-pink.jpg',
    colors: [
      { id: 'pink', hex_code: '#F48FB1', label_ar: 'وردي', label_en: 'Pink', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box14-pink.jpg', inside_image_url: '/accessories/box14-colors.png' },
      { id: 'purple', hex_code: '#7B3FE4', label_ar: 'بنفسجي', label_en: 'Purple', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box14-colors.png', inside_image_url: '/accessories/box14-pink.jpg' },
      { id: 'blue', hex_code: '#42A5F5', label_ar: 'أزرق فاتح', label_en: 'Light Blue', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box14-colors.png', inside_image_url: '/accessories/box14-pink.jpg' },
      { id: 'red', hex_code: '#D32F2F', label_ar: 'أحمر', label_en: 'Red', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box14-colors.png', inside_image_url: '/accessories/box14-pink.jpg' },
      { id: 'black', hex_code: '#111111', label_ar: 'أسود', label_en: 'Black', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box14-colors.png', inside_image_url: '/accessories/box14-pink.jpg' }
    ]
  },
  {
    id: 'box-16',
    size: '16 inch',
    name_ar: 'Dental Tool Box 16"',
    name_en: 'Dental Tool Box 16"',
    price: 65,
    stock_quantity: 12,
    desc_ar: 'بوكس أسنان متين مع رف داخلي قابل للإزالة لتنظيم الأدوات الدقيقة ومساحة تخزين سفلية واسعة.',
    desc_en: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    features_ar: ['رف داخلي مقسم قابل للإزالة', 'قفلان جانبيان قويان', 'مساحة تخزين سفلية واسعة', 'مقبض حمل مريح ومتين'],
    features_en: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    main_image: '/accessories/box16-black.jpg',
    inside_image: '/accessories/box16-inside1.jpg',
    colors: [
      { id: 'black', hex_code: '#111111', label_ar: 'أسود', label_en: 'Black', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16-black.jpg', inside_image_url: '/accessories/box16-inside1.jpg' },
      { id: 'blue', hex_code: '#1976D2', label_ar: 'أزرق', label_en: 'Blue', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16-blue.jpg', inside_image_url: '/accessories/box16-inside-blue.jpg', base_image_url: '/accessories/box16-base-blue.jpg' },
      { id: 'maroon', hex_code: '#4A1525', label_ar: 'خمري / داكن', label_en: 'Dark / Maroon', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16-maroon.jpg', inside_image_url: '/accessories/box16-inside-maroon.jpg', base_image_url: '/accessories/box16-base-maroon.jpg' },
      { id: 'purple', hex_code: '#8B5CF6', label_ar: 'بنفسجي', label_en: 'Purple', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16-purple.jpg', inside_image_url: '/accessories/box16-inside-purple.jpg', base_image_url: '/accessories/box16-base-purple.jpg' },
      { id: 'yellow', hex_code: '#FBC02D', label_ar: 'أصفر', label_en: 'Yellow', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16-yellow.jpg', inside_image_url: '/accessories/box16-inside-yellow.jpg', base_image_url: '/accessories/box16-base-yellow.jpg' },
      { id: 'pink', hex_code: '#F48FB1', label_ar: 'وردي', label_en: 'Pink', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16-pink.jpg', inside_image_url: '/accessories/box16-inside-purple.jpg', base_image_url: '/accessories/box16-base-purple.jpg' }
    ]
  },
  {
    id: 'box-16-5',
    size: '16.5 inch',
    name_ar: 'Organizer Box 16.5"',
    name_en: 'Organizer Box 16.5"',
    price: 85,
    stock_quantity: 12,
    desc_ar: 'بوكس مميز بغطاء شفاف بالكامل و3 طبقات تنظيم شفافة منزلقة لتنظيم أدوات وإكسسوارات الأسنان بدقة فائقة.',
    desc_en: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    features_ar: ['غطاء علوي شفاف بالكامل', '3 طبقات تنظيم منزلقة', 'فواصل داخلية دقيقة', 'قفل أمامي وقاعدة متينة'],
    features_en: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    main_image: '/accessories/box16_5-blue.png',
    inside_image: '/accessories/box16_5-inside.png',
    colors: [
      { id: 'blue', hex_code: '#1976D2', label_ar: 'أزرق', label_en: 'Blue', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-blue.png', inside_image_url: '/accessories/box16_5-inside-blue.jpg' },
      { id: 'red', hex_code: '#D32F2F', label_ar: 'أحمر', label_en: 'Red', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-red.jpg', inside_image_url: '/accessories/box16_5-inside-red.jpg' },
      { id: 'black', hex_code: '#1F2937', label_ar: 'أسود', label_en: 'Black', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-black.jpg', inside_image_url: '/accessories/box16_5-inside.png' },
      { id: 'purple', hex_code: '#8B5CF6', label_ar: 'بنفسجي', label_en: 'Purple', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-purple.jpg', inside_image_url: '/accessories/box16_5-inside-purple.jpg' },
      { id: 'teal', hex_code: '#00ACC1', label_ar: 'تركوازي', label_en: 'Teal', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-teal.jpg', inside_image_url: '/accessories/box16_5-inside-teal.jpg' },
      { id: 'green', hex_code: '#7CB342', label_ar: 'أخضر', label_en: 'Lime Green', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-green.jpg', inside_image_url: '/accessories/box16_5-inside-green.jpg' },
      { id: 'orange', hex_code: '#F57C00', label_ar: 'برتقالي', label_en: 'Orange', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box16_5-orange.jpg', inside_image_url: '/accessories/box16_5-inside-orange.jpg' }
    ]
  },
  {
    id: 'box-17',
    size: '17 inch',
    name_ar: 'Professional Box — GT-MAX 17"',
    name_en: 'Professional Box — GT-MAX 17"',
    price: 95,
    stock_quantity: 12,
    desc_ar: 'البوكس الاحترافي الأوسع GT-MAX/BADC بغطاء ملون مزود بأقسام تنظيم شفافة ومساحة تخزين سفلية عملاقة.',
    desc_en: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a clear organizer and wide main storage.',
    features_ar: ['أقسام تنظيم شفافة مدمجة بالغطاء', 'مساحة تخزين عملاقة', 'أقفال جانبية وأمامية محكمة', 'بلاستيك مقوى عالي التحمل'],
    features_en: ['Clear lid organizer', 'Wide main storage space', 'Two side + front latches', 'Strong & Durable plastic'],
    main_image: '/accessories/box17-black.jpg',
    inside_image: '/accessories/box17-inside-black.jpg',
    colors: [
      { id: 'black', hex_code: '#111111', label_ar: 'أسود', label_en: 'Black', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17-black.jpg', inside_image_url: '/accessories/box17-inside-black.jpg' },
      { id: 'red', hex_code: '#D32F2F', label_ar: 'أحمر', label_en: 'Red', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17-red.jpg', inside_image_url: '/accessories/box17-inside-red.jpg' },
      { id: 'blue', hex_code: '#0D47A1', label_ar: 'أزرق داكن', label_en: 'Dark Blue', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17_5-dark-blue.jpg', inside_image_url: '/accessories/box17-inside-blue.jpg' },
      { id: 'purple', hex_code: '#8B5CF6', label_ar: 'بنفسجي', label_en: 'Purple', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17-purple.jpg', inside_image_url: '/accessories/box17-inside-purple.jpg' },
      { id: 'beige', hex_code: '#C8A882', label_ar: 'بيج', label_en: 'Beige', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17-beige.jpg', inside_image_url: '/accessories/box17-inside-beige.jpg' },
      { id: 'teal', hex_code: '#00897B', label_ar: 'تركوازي', label_en: 'Teal', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17-colors.png', inside_image_url: '/accessories/box17-inside.png' },
      { id: 'lime', hex_code: '#7CB342', label_ar: 'أخضر فسفوري', label_en: 'Lime Green', status: 'in_stock', available_stock: 10, physical_stock: 10, reserved_stock: 0, image_url: '/accessories/box17-colors.png', inside_image_url: '/accessories/box17-inside.png' }
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

export function cleanColorLabel(color, lang = 'ar') {
  if (!color) return '';
  const text = lang === 'ar'
    ? (color.label_ar || color.color_name_ar || color.label_en || color.color_name_en || '')
    : (color.label_en || color.color_name_en || color.label_ar || color.color_name_ar || '');
  return text.replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]|نفذت الكمية|غير متوفر/g, '').trim();
}

export function getVariantLookupKey(color) {
  if (!color) return '';
  return color.id || color.variant_id || color.color_id || '';
}

export function computeVariantAvailableStock(physicalStock = 0, reservedStock = 0) {
  return Math.max(0, physicalStock - reservedStock);
}

export async function fetchCanonicalBoxInventory() {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'box_variants_inventory')
      .maybeSingle();

    return data?.value?.variants || {};
  } catch (err) {
    console.warn('Could not load canonical box variants inventory:', err);
    return {};
  }
}

export async function saveBoxVariantInventoryRecord(variantId, updates = {}) {
  if (!variantId) return null;
  const { data: currentSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'box_variants_inventory')
    .maybeSingle();

  const currentVariants = currentSetting?.value?.variants || {};
  const existingRecord = currentVariants[variantId] || {};

  const physicalStock = updates.physical_stock !== undefined
    ? Math.max(0, parseInt(updates.physical_stock, 10) || 0)
    : (existingRecord.physical_stock ?? 10);

  const reservedStock = updates.reserved_stock !== undefined
    ? Math.max(0, parseInt(updates.reserved_stock, 10) || 0)
    : (existingRecord.reserved_stock ?? 0);

  const availableStock = updates.available_stock !== undefined
    ? updates.available_stock
    : computeVariantAvailableStock(physicalStock, reservedStock);
  const status = updates.status || (availableStock > 0 ? 'in_stock' : 'out_of_stock');

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

  await supabase.from('settings').upsert(payload);
  return updatedVariant;
}

export async function resetAllBoxStockToZero() {
  const { data: currentSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'box_variants_inventory')
    .maybeSingle();

  const currentVariants = currentSetting?.value?.variants || {};
  const updatedVariants = {};

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

  const payload = {
    key: 'box_variants_inventory',
    value: {
      ...(currentSetting?.value || {}),
      updated_at: new Date().toISOString(),
      variants: updatedVariants
    }
  };

  const { error: upsertErr } = await supabase.from('settings').upsert(payload);
  if (upsertErr) throw upsertErr;

  return updatedVariants;
}

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

    let status = color.status || 'in_stock';
    if (inv && inv.status) status = inv.status;

    // Discontinued or hidden colors are completely omitted from customer storefront
    if (status === 'discontinued' || color.status === 'discontinued' || color.is_hidden === true) {
      return;
    }

    let availableStock = 10;
    let physicalStock = 10;
    let reservedStock = 0;

    if (inv) {
      physicalStock = inv.physical_stock ?? 10;
      reservedStock = inv.reserved_stock ?? 0;
      availableStock = inv.available_stock ?? computeVariantAvailableStock(physicalStock, reservedStock);
    } else if (color.available_stock !== undefined) {
      availableStock = color.available_stock;
      physicalStock = color.physical_stock ?? availableStock;
      reservedStock = color.reserved_stock ?? 0;
    }

    // Support on_demand
    const isOnDemand = status === 'on_demand';
    const isImmediate = availableStock > 0 && !isOnDemand;
    const isAvailable = isImmediate || isOnDemand;

    const cleanAr = cleanColorLabel(color, 'ar');
    const cleanEn = cleanColorLabel(color, 'en');

    const decorated = {
      ...color,
      label_ar: cleanAr,
      label_en: cleanEn,
      physical_stock: physicalStock,
      reserved_stock: reservedStock,
      available_stock: isAvailable ? Math.max(availableStock, 1) : 0,
      isAvailable,
      isOnDemand,
      status,
      price: (inv && inv.price) ? inv.price : (color.price || null),
      size: (inv && inv.size) ? inv.size : (color.size || null),
      image_url: resolveBoxImg((inv && inv.image_url) ? inv.image_url : (color.image_url || null))
    };

    if (isAvailable) {
      availableColors.push(decorated);
    } else {
      unavailableColors.push(decorated);
    }
  });

  return {
    availableColors,
    unavailableColors,
    allUnavailable: availableColors.length === 0
  };
}
