/**
 * ABSOLUTE DENTAL — UNIFIED PRODUCT, INVENTORY & BUNDLE ENGINE
 * Canonical single source of truth for:
 * 1. Bundles / Commercial Offers (No independent physical stock; dynamic component calculation)
 * 2. Multi-Selling-Unit Products (Base inventory unit: Piece, physical stock in pieces, box breakdown)
 * 3. Idempotent inventory deductions across Storefront, Storefront Admin, and ERP
 */

export const CANONICAL_BUNDLES = {
  'fa042791-6d8d-48c1-8f60-f1a103162a1e': {
    id: 'fa042791-6d8d-48c1-8f60-f1a103162a1e',
    nameAr: 'عرض كاست تدريب + قبضة NSK توربين سرعة عالية',
    nameEn: 'Study cast + high-speed NSK hand piece',
    bundlePrice: 250,
    components: [
      {
        productId: 'ad31f7c7-d710-4622-8e3f-377b9c657818',
        nameAr: 'قبضة NSK توربين سرعة عالية',
        nameEn: 'NSK High speed handpiece',
        quantity: 1,
        normalPrice: 135
      },
      {
        productId: '8f344bd9-91ec-4787-8371-f489cccf635e',
        nameAr: 'كاست تدريب (Dental Cast)',
        nameEn: 'dental cast',
        quantity: 1,
        normalPrice: 125
      }
    ]
  },
  '22000000-0000-0000-0000-000000000201': {
    id: '22000000-0000-0000-0000-000000000201',
    nameAr: 'بكج بيرات الفكسد (Fixed Prosthodontics Burs Bundle)',
    nameEn: 'Fixed Prosthodontics Burs Bundle',
    bundlePrice: 10,
    components: [
      {
        productId: '627bdb62-3364-497b-8aa6-3b911ad78f26',
        nameAr: 'niddle bur - TC 10 (Blue)',
        nameEn: 'TC 10 (Blue) — Needle Bur',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/627bdb62-3364-497b-8aa6-3b911ad78f26.jpg'
      },
      {
        productId: 'c78f57a0-54d0-4602-aa05-d92a82398a2f',
        nameAr: 'Long taper with flat end - TF12 (blue)',
        nameEn: 'TF12 (Blue) — Long Taper with Flat End',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/c78f57a0-54d0-4602-aa05-d92a82398a2f.jpg'
      },
      {
        productId: '36e0d204-3613-44b0-b74e-0ba7869420c4',
        nameAr: 'Long taper with flat end - TF12 (yellow)',
        nameEn: 'TF12 (Yellow) — Long Taper with Flat End',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/36e0d204-3613-44b0-b74e-0ba7869420c4.jpg'
      },
      {
        productId: '187f6429-fee1-4f50-8edc-2a18bac1de35',
        nameAr: 'diamond flame bur - FO 32 (yellow)',
        nameEn: 'FO 32 (Yellow) — Diamond Flame Bur',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/187f6429-fee1-4f50-8edc-2a18bac1de35.jpg'
      },
      {
        productId: 'd2a56c58-bf46-47aa-b803-6546aa7491c5',
        nameAr: 'Wheel Round Bur - WR 13',
        nameEn: 'WR 13 — Wheel Round Bur',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/d2a56c58-bf46-47aa-b803-6546aa7491c5.jpg'
      }
    ]
  },
  '22000000-0000-0000-0000-000000000202': {
    id: '22000000-0000-0000-0000-000000000202',
    nameAr: 'بكج بيرات علاج الأسنان التحفظي (Conservative Dentistry Burs Bundle)',
    nameEn: 'Conservative Dentistry Burs Bundle',
    bundlePrice: 8,
    components: [
      {
        productId: 'e625888c-c1b0-4479-9117-76a1215a75f4',
        nameAr: 'Fissure bur - CD 52F (red)',
        nameEn: 'CD 52F (Red) — Fissure Bur',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/e625888c-c1b0-4479-9117-76a1215a75f4.jpg'
      },
      {
        productId: '76f62cd7-df40-4e85-97d1-6fb63b09e2f1',
        nameAr: 'Round bur - BR 49',
        nameEn: 'BR 49 (Blue) — Round Bur',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://api.kurofangs.id.ly/storage/v1/object/public/pdf-sheets/smylodent-products/76f62cd7-df40-4e85-97d1-6fb63b09e2f1.jpg'
      },
      {
        productId: 'c78f57a0-54d0-4602-aa05-d92a82398a2f',
        nameAr: 'Long taper with flat end - TF12 (blue)',
        nameEn: 'TF12 (Blue) — Long Taper with Flat End',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/c78f57a0-54d0-4602-aa05-d92a82398a2f.jpg'
      },
      {
        productId: '2ebc663e-0967-4d6a-b8be-b07b9e84659c',
        nameAr: 'Inverted cone bur - SI 46',
        nameEn: 'SI 46 (Blue) — Inverted Cone Bur',
        quantity: 1,
        normalPrice: 2,
        imageUrl: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/2ebc663e-0967-4d6a-b8be-b07b9e84659c.jpg'
      }
    ]
  }
};

export const CANONICAL_MULTI_UNITS = {
  // Wax single piece (Base physical unit: Piece)
  '106ad65c-3074-4cfb-8643-840f36f833f5': {
    isBase: true,
    baseUnitNameAr: 'قطعة',
    baseUnitNameEn: 'Piece',
    boxSize: 3,
    packProductId: '6c359465-a522-4654-933f-a64c627c6b38'
  },
  // Wax full box (Pack of 3 pieces)
  '6c359465-a522-4654-933f-a64c627c6b38': {
    isBase: false,
    baseProductId: '106ad65c-3074-4cfb-8643-840f36f833f5',
    unitMultiplier: 3,
    unitNameAr: 'علبة (3 قطع)',
    unitNameEn: 'Box (3 Pieces)'
  }
};

export const CANONICAL_SIZED_PRODUCTS = {
  '33000000-0000-0000-0000-000000000101': {
    productId: '33000000-0000-0000-0000-000000000101',
    nameAr: 'قالب طبعة الأسنان (Dental impression tray) - أزرق',
    nameEn: 'Dental impression tray (Blue)',
    color: 'Blue',
    colorAr: 'أزرق',
    optionsLabelAr: 'اختر المقاس',
    optionsLabelEn: 'Select Size',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-impression-tray-blue.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-impression-tray-blue-angle.png'
    ],
    sizes: [
      {
        size: 'M',
        code: 'M',
        labelAr: 'مقاس M (متوسط)',
        labelEn: 'Size M (Medium)',
        shortLabel: 'M',
        stock: 24,
        costPrice: 1,
        price: 2
      },
      {
        size: 'L',
        code: 'L',
        labelAr: 'مقاس L (كبير)',
        labelEn: 'Size L (Large)',
        shortLabel: 'L',
        stock: 24,
        costPrice: 1,
        price: 2
      }
    ]
  },
  '33000000-0000-0000-0000-000000000109': {
    productId: '33000000-0000-0000-0000-000000000109',
    nameAr: 'قفازات نايتريل طبية فاحصة OverseasGlove (غير معقمة)',
    nameEn: 'OverseasGlove Disposable Nitrile Gloves (Non-Sterile)',
    hasColorAndSize: true,
    optionsLabelAr: 'اختر اللون والمقاس المتوفر',
    optionsLabelEn: 'Select Available Color & Size',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/overseasglove-nitrile-gloves-black-s.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/overseasglove-nitrile-gloves-blue-m.png'
    ],
    sizes: [
      {
        size: 'black-s',
        code: 'S',
        color: 'Black',
        colorAr: 'أسود',
        colorHex: '#1E293B',
        labelAr: 'أسود (مقاس S)',
        labelEn: 'Black (Size S)',
        shortLabel: 'Black S',
        stock: 50,
        costPrice: 0.56,
        price: 1.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/overseasglove-nitrile-gloves-black-s.png'
      },
      {
        size: 'blue-m',
        code: 'M',
        color: 'Blue',
        colorAr: 'أزرق',
        colorHex: '#2563EB',
        labelAr: 'أزرق (مقاس M)',
        labelEn: 'Blue (Size M)',
        shortLabel: 'Blue M',
        stock: 50,
        costPrice: 0.56,
        price: 1.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/overseasglove-nitrile-gloves-blue-m.png'
      }
    ]
  },
  '33000000-0000-0000-0000-000000000112': {
    productId: '33000000-0000-0000-0000-000000000112',
    nameAr: 'حاجز مطاطي عيادي Rubber Dam 6×6 (موديلات وألوان متعددة)',
    nameEn: 'Dental Rubber Dam Sheets 6×6 (Multiple Models & Colors)',
    hasColorAndSize: true,
    optionsLabelAr: 'اختر الموديل واللون المتوفر',
    optionsLabelEn: 'Select Model & Color',
    optionsPromptAr: '⚠️ يرجى تحديد الموديل واللون أولاً',
    optionsPromptEn: '⚠️ Please select model & color',
    buttonPromptAr: 'اختر الموديل واللون وأضف',
    buttonPromptEn: 'Select Model & Color',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/rubber-dam-heavy-blue.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/rubber-dam-mid-green.png'
    ],
    sizes: [
      {
        size: 'heavy-blue',
        code: 'Heavy',
        color: 'Blue',
        colorAr: 'أزرق',
        colorHex: '#2563EB',
        labelAr: 'موديل هيفي - Heavy (أزرق)',
        labelEn: 'Heavy Model (Blue)',
        shortLabel: 'Heavy (أزرق)',
        stock: 35,
        costPrice: 2.285,
        price: 2.50,
        unitNameAr: 'شيت',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/rubber-dam-heavy-blue.png'
      },
      {
        size: 'mid-green',
        code: 'Mid',
        color: 'Green',
        colorAr: 'أخضر',
        colorHex: '#10B981',
        labelAr: 'موديل ميد - Mid (أخضر)',
        labelEn: 'Mid Model (Green)',
        shortLabel: 'Mid (أخضر)',
        stock: 36,
        costPrice: 2.285,
        price: 2.50,
        unitNameAr: 'شيت',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/rubber-dam-mid-green.png'
      }
    ]
  },
  '99000000-0000-0000-0000-000000000001': {
    productId: '99000000-0000-0000-0000-000000000001',
    nameAr: 'كمامات طبية جراحية MedProtect (أزرق وأسود)',
    nameEn: 'MedProtect Disposable Surgical Face Masks (Blue & Black)',
    hasColorAndSize: true,
    optionsLabelAr: 'اختر اللون المتوفر',
    optionsLabelEn: 'Select Color',
    optionsPromptAr: '⚠️ يرجى تحديد لون الكمامة أولاً',
    optionsPromptEn: '⚠️ Please select mask color',
    buttonPromptAr: 'اختر اللون وأضف للسلة',
    buttonPromptEn: 'Select Color & Add',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/mask-medprotect-blue.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/mask-disposable-black.png'
    ],
    sizes: [
      {
        size: 'blue',
        code: 'Blue',
        color: 'Blue',
        colorAr: 'أزرق',
        colorHex: '#3B82F6',
        labelAr: 'أزرق (Blue)',
        labelEn: 'Blue',
        shortLabel: 'أزرق (Blue)',
        stock: 50,
        costPrice: 0.12,
        price: 0.50,
        unitNameAr: 'قطعة',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/mask-medprotect-blue.png'
      },
      {
        size: 'black',
        code: 'Black',
        color: 'Black',
        colorAr: 'أسود',
        colorHex: '#1E293B',
        labelAr: 'أسود (Black)',
        labelEn: 'Black',
        shortLabel: 'أسود (Black)',
        stock: 100,
        costPrice: 0.13,
        price: 0.50,
        unitNameAr: 'قطعة',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/mask-disposable-black.png'
      }
    ]
  },
  '33000000-0000-0000-0000-000000000103': {
    productId: '33000000-0000-0000-0000-000000000103',
    nameAr: 'مفرش عيادة أسنان طبي واقي وعازل - Cover Sheet (وردي وأزرق)',
    nameEn: 'Cover Sheet Disposable Waterproof Dental Bib (Pink & Blue)',
    hasColorAndSize: true,
    optionsLabelAr: 'اختر اللون المتوفر',
    optionsLabelEn: 'Select Color',
    optionsPromptAr: '⚠️ يرجى تحديد لون المفرش أولاً',
    optionsPromptEn: '⚠️ Please select cover sheet color',
    buttonPromptAr: 'اختر اللون وأضف للسلة',
    buttonPromptEn: 'Select Color & Add',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-bib-cover-sheet-pink.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-bib-cover-sheet-blue.png'
    ],
    sizes: [
      {
        size: 'pink',
        code: 'Pink',
        color: 'Pink',
        colorAr: 'وردي',
        colorHex: '#EC4899',
        labelAr: 'وردي (Pink)',
        labelEn: 'Pink',
        shortLabel: 'وردي (Pink)',
        stock: 375,
        costPrice: 0.11,
        price: 0.50,
        unitNameAr: 'قطعة',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-bib-cover-sheet-pink.png'
      },
      {
        size: 'blue',
        code: 'Blue',
        color: 'Blue',
        colorAr: 'أزرق',
        colorHex: '#3B82F6',
        labelAr: 'أزرق (Blue)',
        labelEn: 'Blue',
        shortLabel: 'أزرق (Blue)',
        stock: 125,
        costPrice: 0.11,
        price: 0.50,
        unitNameAr: 'قطعة',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-bib-cover-sheet-blue.png'
      }
    ]
  }
};

/**
 * Checks if a given product ID is a product with mandatory sizing.
 */
export function isSizedProduct(productId) {
  return Boolean(productId && CANONICAL_SIZED_PRODUCTS[productId]);
}

/**
 * Returns sized product configuration.
 */
export function getProductSizedConfig(productId) {
  if (!productId) return null;
  return CANONICAL_SIZED_PRODUCTS[productId] || null;
}

/**
 * Normalizes input products into a Map keyed by id.
 */
export function toProductMap(products) {
  const map = new Map();
  if (!products) return map;
  if (Array.isArray(products)) {
    products.forEach(p => {
      if (p && p.id) map.set(p.id, p);
    });
  } else if (typeof products === 'object') {
    Object.values(products).forEach(p => {
      if (p && p.id) map.set(p.id, p);
    });
  }
  return map;
}

/**
 * Checks if a given product ID is a commercial bundle/offer.
 */
export function isBundleProduct(productId) {
  return Boolean(productId && CANONICAL_BUNDLES[productId]);
}

/**
 * Returns bundle configuration if product is a bundle.
 */
export function getBundleDefinition(productId) {
  return CANONICAL_BUNDLES[productId] || null;
}

/**
 * Dynamically calculates bundle availability based on component physical stock.
 * Formula: min( Math.floor( component_stock / required_qty ) )
 */
export function calculateBundleAvailability(bundleId, allProducts) {
  const bundle = CANONICAL_BUNDLES[bundleId];
  if (!bundle) return { availableCount: 0, isAvailable: false, componentsStatus: [] };

  const map = allProducts instanceof Map ? allProducts : toProductMap(allProducts);

  let minPossible = Infinity;
  let normalTotalPrice = 0;
  const componentsStatus = [];

  for (const comp of bundle.components) {
    const compProd = map.get(comp.productId);
    const currentStock = compProd ? (Number(compProd.stock_quantity ?? compProd.stock) || 0) : 0;
    const possibleFromThisComp = Math.floor(currentStock / comp.quantity);
    if (possibleFromThisComp < minPossible) {
      minPossible = possibleFromThisComp;
    }

    normalTotalPrice += (comp.normalPrice || (compProd ? (compProd.price || compProd.sellingPrice || 0) : 0)) * comp.quantity;

    componentsStatus.push({
      productId: comp.productId,
      nameAr: comp.nameAr,
      nameEn: comp.nameEn,
      required: comp.quantity,
      currentStock,
      possibleBundles: possibleFromThisComp,
      isAvailable: currentStock >= comp.quantity
    });
  }

  const availableCount = minPossible === Infinity ? 0 : Math.max(0, minPossible);
  const isAvailable = availableCount > 0;
  const savings = Math.max(0, normalTotalPrice - bundle.bundlePrice);

  return {
    bundleId,
    nameAr: bundle.nameAr,
    nameEn: bundle.nameEn,
    bundlePrice: bundle.bundlePrice,
    normalTotalPrice,
    savings,
    availableCount,
    availableQuantity: availableCount,
    isAvailable,
    componentsStatus
  };
}

/**
 * Computes the authoritative effective stock available for sale.
 * - For bundles: dynamic component-based availability
 * - For multi-unit packs: floor(master_stock / unit_multiplier)
 * - For base physical products & standard products: stock_quantity
 */
export function computeEffectiveStock(product, allProducts) {
  if (!product) return 0;

  const productId = product.id;
  const map = allProducts instanceof Map ? allProducts : toProductMap(allProducts);

  // 1. Check if product is a Bundle/Offer
  if (isBundleProduct(productId)) {
    const bundleRes = calculateBundleAvailability(productId, map);
    return bundleRes.availableCount;
  }

  // 2. Check if product is a multi-unit linked to master
  const multiUnitMeta = CANONICAL_MULTI_UNITS[productId];
  const sharedMasterId = product.shared_inventory_product_id || (multiUnitMeta && !multiUnitMeta.isBase ? multiUnitMeta.baseProductId : null);

  if (sharedMasterId) {
    const master = map.get(sharedMasterId);
    const multiplier = Number(product.unit_multiplier) || (multiUnitMeta ? multiUnitMeta.unitMultiplier : 1) || 1;
    const masterStock = master ? (Number(master.stock_quantity ?? master.stock) || 0) : 0;
    return Math.floor(masterStock / multiplier);
  }

  // 3. Base or standard physical product
  const rawStock = product.stock_quantity !== undefined ? product.stock_quantity : product.stock;
  return Number(rawStock) || 0;
}

/**
 * Formats physical stock breakdown for products with multiple selling units (like Wax).
 * Returns: { totalPieces, fullBoxes, loosePieces, displayAr, displayEn }
 */
export function getPhysicalStockBreakdown(product, allProducts) {
  if (!product) return null;

  const map = allProducts instanceof Map ? allProducts : toProductMap(allProducts);
  const meta = CANONICAL_MULTI_UNITS[product.id];

  let baseProduct = null;
  let boxSize = 3;

  if (meta) {
    if (meta.isBase) {
      baseProduct = product;
      boxSize = meta.boxSize || 3;
    } else {
      baseProduct = map.get(meta.baseProductId);
      boxSize = meta.unitMultiplier || 3;
    }
  } else if (product.shared_inventory_product_id) {
    baseProduct = map.get(product.shared_inventory_product_id);
    boxSize = Number(product.unit_multiplier) || 3;
  }

  if (!baseProduct) return null;

  const totalPieces = Number(baseProduct.stock_quantity ?? baseProduct.stock) || 0;
  const fullBoxes = Math.floor(totalPieces / boxSize);
  const loosePieces = totalPieces % boxSize;

  let displayAr = '';
  let displayEn = '';

  if (loosePieces === 0) {
    displayAr = `${fullBoxes} علبة (${totalPieces} قطعة)`;
    displayEn = `${fullBoxes} Boxes (${totalPieces} Pieces)`;
  } else {
    displayAr = `${fullBoxes} علبة و ${loosePieces} قطعة فرط (${totalPieces} قطعة إجمالي)`;
    displayEn = `${fullBoxes} Boxes + ${loosePieces} Loose Pieces (${totalPieces} Total Pieces)`;
  }

  return {
    totalPieces,
    fullBoxes,
    loosePieces,
    boxSize,
    displayAr,
    displayEn
  };
}

/**
 * Calculates atomic stock deductions for an array of order items.
 * Guarantees that:
 * - Bundles deduct from components (0 deduction on the virtual bundle item itself)
 * - Multi-unit packs deduct multiplier * qty base units from the base product
 * - Standard items deduct their qty
 *
 * @param {Array} orderItems - Array of { id, qty, price, name }
 * @param {Array|Map} currentProducts - Current products catalog
 * @returns {Array} deductions - Array of { productId, deductUnits, isBundleComponent, isMultiUnit, reason }
 */
export function calculateOrderDeductions(orderItems, currentProducts) {
  const map = currentProducts instanceof Map ? currentProducts : toProductMap(currentProducts);
  const deductionsMap = new Map(); // productId -> totalUnitsToDeduct

  const recordDeduction = (pId, units, reason) => {
    if (!pId || units <= 0) return;
    const existing = deductionsMap.get(pId) || { productId: pId, deductUnits: 0, reasons: [] };
    existing.deductUnits += units;
    existing.reasons.push(reason);
    deductionsMap.set(pId, existing);
  };

  (orderItems || []).forEach(item => {
    const rawId = item.id || item.productId;
    const qty = Number(item.qty || item.quantity) || 1;

    // A. Check if item is a commercial bundle/offer
    const bundleId = (item.is_bundle && item.bundle_id) ||
      (isBundleProduct(rawId) ? rawId :
      (isBundleProduct(item.bundle_id) ? item.bundle_id :
      (isBundleProduct(item.productId) ? item.productId : null)));

    if (bundleId && isBundleProduct(bundleId)) {
      const bundle = CANONICAL_BUNDLES[bundleId];
      bundle.components.forEach(comp => {
        const componentDeductUnits = comp.quantity * qty;
        recordDeduction(
          comp.productId,
          componentDeductUnits,
          `مكون عرض: ${bundle.nameEn} (×${qty}) -> ${comp.nameEn} ×${componentDeductUnits}`
        );
      });
      return;
    }

    const pId = rawId;

    // B. Check if item is a multi-unit pack (e.g. Wax Full Box)
    const multiMeta = CANONICAL_MULTI_UNITS[pId];
    const prod = map.get(pId);
    const sharedBaseId = (multiMeta && !multiMeta.isBase ? multiMeta.baseProductId : null) || (prod && prod.shared_inventory_product_id);
    const multiplier = (multiMeta && !multiMeta.isBase ? multiMeta.unitMultiplier : null) || (prod && Number(prod.unit_multiplier)) || 1;

    if (sharedBaseId && multiplier > 1) {
      const baseUnitsToDeduct = qty * multiplier;
      recordDeduction(
        sharedBaseId,
        baseUnitsToDeduct,
        `عبوة متعددة الوحدات: ${item.name || prod?.name_en} (×${qty} علبة = ×${baseUnitsToDeduct} قطعة أساسية)`
      );
      return;
    }

    // C. Check if item is a sized product variant
    const basePId = item.base_product_id || (typeof pId === 'string' && (pId.endsWith('-M') || pId.endsWith('-L')) ? pId.slice(0, -2) : pId);
    if (basePId && CANONICAL_SIZED_PRODUCTS[basePId]) {
      recordDeduction(
        basePId,
        qty,
        `منتج بمقاسات: ${item.name || prod?.name_en || 'Dental impression tray'} (${item.selected_size || 'M/L'}) ×${qty}`
      );
      return;
    }

    // D. Standard physical product or base product
    recordDeduction(
      pId,
      qty,
      `بيع مباشر: ${item.name || prod?.name_en} (×${qty})`
    );
  });

  return Array.from(deductionsMap.values());
}
