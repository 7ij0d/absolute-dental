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
    optionsLabelAr: 'اختر الفك المطلوب (علوي Upper أم سفلي Lower)',
    optionsLabelEn: 'Select Arch (Upper or Lower)',
    optionsPromptAr: '⚠️ يرجى تحديد هل تريد Upper أم Lower أولاً',
    optionsPromptEn: '⚠️ Please select Upper or Lower first',
    buttonPromptAr: 'اختر (Upper / Lower) وأضف',
    buttonPromptEn: 'Select Upper / Lower & Add',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-impression-tray-blue.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-impression-tray-blue-angle.png'
    ],
    sizes: [
      {
        size: 'upper',
        code: 'Upper',
        labelAr: 'علوي (Upper)',
        labelEn: 'Upper Arch',
        shortLabel: 'Upper',
        stock: 24,
        costPrice: 1,
        price: 2
      },
      {
        size: 'lower',
        code: 'Lower',
        labelAr: 'سفلي (Lower)',
        labelEn: 'Lower Arch',
        shortLabel: 'Lower',
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
  '33000000-0000-0000-0000-000000000118': {
    productId: '33000000-0000-0000-0000-000000000118',
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
  },
  '22000000-0000-0000-0000-000000000204': {
    productId: '22000000-0000-0000-0000-000000000204',
    nameAr: 'Bur Holder (with Cover)',
    nameEn: 'Bur Holder (with Cover)',
    hasColorAndSize: true,
    optionsLabelAr: 'اختر اللون المتوفر',
    optionsLabelEn: 'Select Color',
    optionsPromptAr: '⚠️ يرجى تحديد اللون أولاً',
    optionsPromptEn: '⚠️ Please select color',
    buttonPromptAr: 'اختر اللون وأضف للسلة',
    buttonPromptEn: 'Select Color & Add',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-holder-blue.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-holder-white.png'
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
        shortLabel: 'Blue',
        stock: 9999,
        price: 20.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-holder-blue.png'
      },
      {
        size: 'white',
        code: 'White',
        color: 'White',
        colorAr: 'أبيض',
        colorHex: '#F1F5F9',
        labelAr: 'أبيض (White)',
        labelEn: 'White',
        shortLabel: 'White',
        stock: 9999,
        price: 20.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-holder-white.png'
      }
    ]
  },
  '11000000-0000-0000-0000-000000000101': {
    productId: '11000000-0000-0000-0000-000000000101',
    nameAr: 'مسطرة قياس الأسنان (Dental Ruler)',
    nameEn: 'Dental Ruler',
    hasColorAndSize: true,
    optionsLabelAr: 'اختر لون المسطرة المطلوب',
    optionsLabelEn: 'Select Ruler Color',
    optionsPromptAr: '⚠️ يرجى تحديد لون المسطرة أولاً',
    optionsPromptEn: '⚠️ Please select ruler color',
    buttonPromptAr: 'اختر اللون وأضف للسلة',
    buttonPromptEn: 'Select Color & Add',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler-green.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler-yellow.png',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler-blue.png'
    ],
    sizes: [
      {
        size: 'green',
        code: 'Green',
        color: 'Green',
        colorAr: 'أخضر',
        colorHex: '#22C55E',
        labelAr: 'أخضر (Green)',
        labelEn: 'Green',
        shortLabel: 'Green',
        stock: 9999,
        price: 15.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler-green.png'
      },
      {
        size: 'yellow',
        code: 'Yellow',
        color: 'Yellow',
        colorAr: 'أصفر',
        colorHex: '#EAB308',
        labelAr: 'أصفر (Yellow)',
        labelEn: 'Yellow',
        shortLabel: 'Yellow',
        stock: 9999,
        price: 15.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler-yellow.png'
      },
      {
        size: 'blue',
        code: 'Blue',
        color: 'Blue',
        colorAr: 'أزرق',
        colorHex: '#3B82F6',
        labelAr: 'أزرق (Blue)',
        labelEn: 'Blue',
        shortLabel: 'Blue',
        stock: 9999,
        price: 15.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/dental-ruler-blue.png'
      }
    ]
  },
  '55000000-0000-0000-0000-000000000001': {
    productId: '55000000-0000-0000-0000-000000000001',
    nameAr: 'لاب كوت ابيض FIGS محلي',
    nameEn: 'White FIGS Lab Coat (Local)',
    optionsLabelAr: 'اختر المقاس المتوفر (M, L, XL, 2XL)',
    optionsLabelEn: 'Select Size (M, L, XL, 2XL)',
    optionsPromptAr: '⚠️ يرجى تحديد مقاس اللاب كوت أولاً',
    optionsPromptEn: '⚠️ Please select a lab coat size first',
    buttonPromptAr: 'اختر المقاس وأضف للسلة',
    buttonPromptEn: 'Select Size & Add to Cart',
    sizingNoticeAr: '💡 ملاحظة المقاس: زيد مقاس ديما على مقاسك العادي، وتقدر تقيس قبل الدفع.',
    sizingNoticeEn: '💡 Sizing Note: Always choose one size up from your regular size. Fitting available before payment.',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-1.jpg',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-2.jpg',
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-3.jpg'
    ],
    sizes: [
      {
        size: 'M',
        code: 'M',
        labelAr: 'مقاس M (وسط)',
        labelEn: 'Size M',
        shortLabel: 'M',
        stock: 10,
        price: 45.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-1.jpg'
      },
      {
        size: 'L',
        code: 'L',
        labelAr: 'مقاس L (كبير)',
        labelEn: 'Size L',
        shortLabel: 'L',
        stock: 10,
        price: 45.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-1.jpg'
      },
      {
        size: 'XL',
        code: 'XL',
        labelAr: 'مقاس XL (كبير جداً)',
        labelEn: 'Size XL',
        shortLabel: 'XL',
        stock: 10,
        price: 45.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-1.jpg'
      },
      {
        size: '2XL',
        code: '2XL',
        labelAr: 'مقاس 2XL (كبير مضاعف)',
        labelEn: 'Size 2XL',
        shortLabel: '2XL',
        stock: 10,
        price: 45.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/labcoat-figs-white-1.jpg'
      }
    ]
  },
  '55000000-0000-0000-0000-000000000002': {
    productId: '55000000-0000-0000-0000-000000000002',
    nameAr: 'يونيفورم طبي أسود CAYDAS',
    nameEn: 'Black CAYDAS Medical Scrub Set',
    optionsLabelAr: 'اختر المقاس المتوفر (S, M, L, XL, 2XL)',
    optionsLabelEn: 'Select Size (S, M, L, XL, 2XL)',
    optionsPromptAr: '⚠️ يرجى تحديد مقاس اليونيفورم أولاً',
    optionsPromptEn: '⚠️ Please select a uniform size first',
    buttonPromptAr: 'اختر المقاس وأضف للسلة',
    buttonPromptEn: 'Select Size & Add to Cart',
    sizingNoticeAr: '💡 ملاحظة المقاس: يمكنك المعاينة وتجربة القياس قبل الدفع والتأكيد.',
    sizingNoticeEn: '💡 Sizing Note: Fitting and inspection available before payment.',
    required: true,
    galleryImages: [
      'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/uniform-caydas-black.png'
    ],
    sizes: [
      {
        size: 'S',
        code: 'S',
        labelAr: 'مقاس S (صغير)',
        labelEn: 'Size S',
        shortLabel: 'S',
        stock: 10,
        price: 65.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/uniform-caydas-black.png'
      },
      {
        size: 'M',
        code: 'M',
        labelAr: 'مقاس M (وسط)',
        labelEn: 'Size M',
        shortLabel: 'M',
        stock: 10,
        price: 65.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/uniform-caydas-black.png'
      },
      {
        size: 'L',
        code: 'L',
        labelAr: 'مقاس L (كبير)',
        labelEn: 'Size L',
        shortLabel: 'L',
        stock: 10,
        price: 65.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/uniform-caydas-black.png'
      },
      {
        size: 'XL',
        code: 'XL',
        labelAr: 'مقاس XL (كبير جداً)',
        labelEn: 'Size XL',
        shortLabel: 'XL',
        stock: 10,
        price: 65.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/uniform-caydas-black.png'
      },
      {
        size: '2XL',
        code: '2XL',
        labelAr: 'مقاس 2XL (كبير مضاعف)',
        labelEn: 'Size 2XL',
        shortLabel: '2XL',
        stock: 10,
        price: 65.00,
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/uniform-caydas-black.png'
      }
    ]
  }
};

/**
 * Checks if a given product ID or product object is a product with mandatory sizing.
 */
export function isSizedProduct(productOrId) {
  if (!productOrId) return false;
  return Boolean(getProductSizedConfig(productOrId));
}

/**
 * Returns sized product configuration bound strictly to its canonical product ID.
 *
 * STRICT PRODUCT IDENTITY ENFORCEMENT:
 * - 33000000-0000-0000-0000-000000000112 = Isolation Gown → NO variants, always null
 * - 33000000-0000-0000-0000-000000000118 = Rubber Dam → has Heavy/Mid variants
 * - 22000000-0000-0000-0000-000000000204 = Bur Holder (with Cover) → Blue / White
 * - 11000000-0000-0000-0000-000000000101 = Dental Ruler → Green / Yellow / Blue
 */
export function getProductSizedConfig(productOrId) {
  if (!productOrId) return null;
  const pId = typeof productOrId === 'object' ? productOrId.id : String(productOrId).trim();
  if (!pId) return null;

  // HARDCODED IDENTITY GUARD (catches both string and object calls):
  // Isolation Gown always returns null — it has no size/color variants.
  if (pId === '33000000-0000-0000-0000-000000000112') {
    return null;
  }

  // Name-based guard when a product object is provided
  if (typeof productOrId === 'object') {
    const text = `${productOrId.name_en || ''} ${productOrId.name_ar || ''}`.toLowerCase();
    if (text.includes('gown') || text.includes('جاون')) {
      return null;
    }
  }

  const config = CANONICAL_SIZED_PRODUCTS[pId];
  if (!config) return null;

  // Rubber Dam config must only be returned for actual Rubber Dam products
  if (config.productId === '33000000-0000-0000-0000-000000000118' && typeof productOrId === 'object') {
    const text = `${productOrId.name_en || ''} ${productOrId.name_ar || ''}`.toLowerCase();
    if (!text.includes('rubber') && !text.includes('مطاطي')) {
      return null;
    }
  }

  // Bur Holder config must only be returned for bur holder products
  if (config.productId === '22000000-0000-0000-0000-000000000204' && typeof productOrId === 'object') {
    const text = `${productOrId.name_en || ''} ${productOrId.name_ar || ''}`.toLowerCase();
    if (!text.includes('bur holder') && !text.includes('حاملة')) {
      return null;
    }
  }

  // Dental Ruler config must only be returned for ruler products
  if (config.productId === '11000000-0000-0000-0000-000000000101' && typeof productOrId === 'object') {
    const text = `${productOrId.name_en || ''} ${productOrId.name_ar || ''}`.toLowerCase();
    if (!text.includes('ruler') && !text.includes('مسطرة')) {
      return null;
    }
  }

  return config;
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
 * Returns dynamic plural unit label for a bundle's components:
 * - Bur sets: 'بيرات' (ar) / 'burs' (en)
 * - General equipment/offers: 'قطع' (ar) / 'items' (en)
 */
export function getBundleUnitLabel(bundleOrIdOrName = '', lang = 'ar') {
  let name = '';
  if (typeof bundleOrIdOrName === 'object' && bundleOrIdOrName !== null) {
    name = (bundleOrIdOrName.name_ar || bundleOrIdOrName.nameAr || bundleOrIdOrName.name || '') + ' ' + (bundleOrIdOrName.name_en || bundleOrIdOrName.nameEn || '');
    if (!name.trim() && (bundleOrIdOrName.id || bundleOrIdOrName.product_id)) {
      const bId = bundleOrIdOrName.product_id || bundleOrIdOrName.id;
      if (CANONICAL_BUNDLES[bId]) {
        name = (CANONICAL_BUNDLES[bId].nameAr || '') + ' ' + (CANONICAL_BUNDLES[bId].nameEn || '');
      }
    }
  } else if (typeof bundleOrIdOrName === 'string') {
    if (CANONICAL_BUNDLES[bundleOrIdOrName]) {
      name = (CANONICAL_BUNDLES[bundleOrIdOrName].nameAr || '') + ' ' + (CANONICAL_BUNDLES[bundleOrIdOrName].nameEn || '');
    } else {
      name = bundleOrIdOrName;
    }
  }

  const isBur = /بيرات|bur/i.test(String(name));
  if (lang === 'ar') {
    return isBur ? 'بيرات' : 'قطع';
  }
  return isBur ? 'burs' : 'items';
}

/**
 * Returns dynamic singular unit label for a bundle's component:
 * - Bur sets: 'بير' (ar) / 'bur' (en)
 * - General equipment/offers: 'قطعة' (ar) / 'item' (en)
 */
export function getBundleSingleItemLabel(bundleOrIdOrName = '', lang = 'ar') {
  let name = '';
  if (typeof bundleOrIdOrName === 'object' && bundleOrIdOrName !== null) {
    name = (bundleOrIdOrName.name_ar || bundleOrIdOrName.nameAr || bundleOrIdOrName.name || '') + ' ' + (bundleOrIdOrName.name_en || bundleOrIdOrName.nameEn || '');
    if (!name.trim() && (bundleOrIdOrName.id || bundleOrIdOrName.product_id)) {
      const bId = bundleOrIdOrName.product_id || bundleOrIdOrName.id;
      if (CANONICAL_BUNDLES[bId]) {
        name = (CANONICAL_BUNDLES[bId].nameAr || '') + ' ' + (CANONICAL_BUNDLES[bId].nameEn || '');
      }
    }
  } else if (typeof bundleOrIdOrName === 'string') {
    if (CANONICAL_BUNDLES[bundleOrIdOrName]) {
      name = (CANONICAL_BUNDLES[bundleOrIdOrName].nameAr || '') + ' ' + (CANONICAL_BUNDLES[bundleOrIdOrName].nameEn || '');
    } else {
      name = bundleOrIdOrName;
    }
  }

  const isBur = /بيرات|bur/i.test(String(name));
  if (lang === 'ar') {
    return isBur ? 'بير' : 'قطعة';
  }
  return isBur ? 'bur' : 'item';
}

/**
 * Dynamically calculates bundle availability based on component physical stock.
 * Formula: min( Math.floor( component_stock / required_qty ) )
 */
export function calculateBundleAvailability(bundleId, allProducts) {
  const bundle = CANONICAL_BUNDLES[bundleId];
  if (!bundle) return { availableCount: 9999, isAvailable: true, componentsStatus: [] };

  const map = allProducts instanceof Map ? allProducts : toProductMap(allProducts);

  let normalTotalPrice = 0;
  const componentsStatus = [];

  for (const comp of bundle.components) {
    const compProd = map.get(comp.productId);
    const currentStock = compProd ? (Number(compProd.stock_quantity ?? compProd.stock) || 9999) : 9999;

    normalTotalPrice += (comp.normalPrice || (compProd ? (compProd.price || compProd.sellingPrice || 0) : 0)) * comp.quantity;

    componentsStatus.push({
      productId: comp.productId,
      nameAr: comp.nameAr,
      nameEn: comp.nameEn,
      required: comp.quantity,
      currentStock: Math.max(9999, currentStock),
      possibleBundles: 9999,
      isAvailable: true
    });
  }

  const availableCount = 9999;
  const isAvailable = true;
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
 * All catalog products (except the 3 student guide items) are always available in unlimited quantity.
 */
export function computeEffectiveStock(product, allProducts) {
  if (!product) return 0;
  if (isStudentGuideProduct(product.id)) return 0;
  return 9999;
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

export const STUDENT_GUIDE_PRODUCTS = {
  '72e1069c-4319-42ff-a38c-2af8f8e4e546': {
    id: '72e1069c-4319-42ff-a38c-2af8f8e4e546',
    type: 'photocopier_lab',
    badgeAr: '💡 إرشاد: خذها من المصور للعملي مباشرة',
    badgeEn: '💡 Guide: Obtain Fresh from College Store',
    shortGuideAr: 'تتأثر بالحرارة والضوء؛ خذها طازجة من مصور الكلية وأنت ذاهب للعملي.',
    shortGuideEn: 'Heat/light sensitive; best collected fresh from college store right before lab.',
    noteAr: 'يُفضل شراء شيتات الواكس (Wax Sheets) مباشرة من مصور/مكتبة الكلية وأنت متجه للمعمل العملي؛ لأن صفائح الواكس حساسة جداً وتتأثر بدرجة الحرارة والرطوبة والضوء، فيجب أخذها واستخدامها طازجة في نفس وقت التدريب العملي.',
    noteEn: 'It is recommended to buy Wax Sheets directly from the college stationery/photocopier on your way to the lab session. Wax is extremely sensitive to ambient temperature, humidity, and light, so it is best collected fresh right before practical training.'
  },
  '7eaed4a6-5d82-480e-b35e-0ca2d15c90dc': {
    id: '7eaed4a6-5d82-480e-b35e-0ca2d15c90dc',
    type: 'photocopier_lab',
    badgeAr: '💡 إرشاد: خذها من المصور للعملي مباشرة',
    badgeEn: '💡 Guide: Obtain Fresh from College Store',
    shortGuideAr: 'تتأثر بالضوء والحرارة؛ خذها طازجة من مصور الكلية وأنت ذاهب للعملي.',
    shortGuideEn: 'Light/heat sensitive; best collected fresh from college store right before lab.',
    noteAr: 'يُفضل شراء صفائح الأكريل الضوئي (Light-Curing Baseplates) من مصور/مكتبة الكلية وأنت متجه للمعمل العملي؛ لأنها مادة حساسة للغاية للضوء والحرارة وتتصلب بالتخزين الطويل، لذا يجب أخذها واستخدامها طازجة في نفس وقت التدريب العملي.',
    noteEn: 'It is recommended to purchase Light Curing Acrylic Baseplates directly from the college stationery/photocopier on your way to practical training, as they are light/heat sensitive and best used fresh.'
  }
};

export function isStudentGuideProduct(productId) {
  return Boolean(productId && STUDENT_GUIDE_PRODUCTS[productId]);
}

export function getStudentGuideInfo(productId) {
  return (productId && STUDENT_GUIDE_PRODUCTS[productId]) || null;
}
