/**
 * Bur Grouping Engine for Absolute Dental
 * Organizes similar dental burs into 6 unified display groups with options popups.
 */

export const BUR_GROUPS = [
  {
    groupId: 'bur-group-tc-needle',
    name_en: 'TC Needle',
    name_ar: 'بير إبرة TC Needle',
    base_image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/627bdb62-3364-497b-8aa6-3b911ad78f26.jpg',
    base_price: 2,
    productIds: [
      '22000000-0000-0000-0000-000000000211', // TC 9
      '627bdb62-3364-497b-8aa6-3b911ad78f26'  // TC 10
    ],
    options: [
      {
        productId: '22000000-0000-0000-0000-000000000211',
        code: 'TC 9',
        color: null,
        label_en: 'TC 9',
        label_ar: 'TC 9',
        image: null
      },
      {
        productId: '627bdb62-3364-497b-8aa6-3b911ad78f26',
        code: 'TC 10',
        color: 'Blue',
        colorHex: '#2563EB',
        label_en: 'TC 10',
        label_ar: 'TC 10',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/627bdb62-3364-497b-8aa6-3b911ad78f26.jpg'
      }
    ]
  },
  {
    groupId: 'bur-group-tf-flat-end',
    name_en: 'Tapered Fissure with Flat End',
    name_ar: 'Tapered Fissure with Flat End',
    base_image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/c78f57a0-54d0-4602-aa05-d92a82398a2f.jpg',
    base_price: 2,
    productIds: [
      'c78f57a0-54d0-4602-aa05-d92a82398a2f', // TF 12 – Blue
      '36e0d204-3613-44b0-b74e-0ba7869420c4'  // TF 12 – Yellow
    ],
    options: [
      {
        productId: 'c78f57a0-54d0-4602-aa05-d92a82398a2f',
        code: 'TF 12',
        color: 'Blue',
        colorHex: '#2563EB',
        label_en: 'TF 12 – Blue',
        label_ar: 'TF 12 – Blue',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/c78f57a0-54d0-4602-aa05-d92a82398a2f.jpg'
      },
      {
        productId: '36e0d204-3613-44b0-b74e-0ba7869420c4',
        code: 'TF 12',
        color: 'Yellow',
        colorHex: '#EAB308',
        label_en: 'TF 12 – Yellow',
        label_ar: 'TF 12 – Yellow',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/36e0d204-3613-44b0-b74e-0ba7869420c4.jpg'
      }
    ]
  },
  {
    groupId: 'bur-group-diamond-flame',
    name_en: 'Diamond Flame Bur',
    name_ar: 'Diamond Flame Bur',
    base_image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-fo-32-blue.png',
    base_price: 2,
    productIds: [
      '22000000-0000-0000-0000-000000000212', // FO 32 – Blue
      '187f6429-fee1-4f50-8edc-2a18bac1de35'  // FO 32 – Yellow
    ],
    options: [
      {
        productId: '22000000-0000-0000-0000-000000000212',
        code: 'FO 32',
        color: 'Blue',
        colorHex: '#2563EB',
        label_en: 'FO 32 – Blue',
        label_ar: 'FO 32 – Blue',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-fo-32-blue.png'
      },
      {
        productId: '187f6429-fee1-4f50-8edc-2a18bac1de35',
        code: 'FO 32',
        color: 'Yellow',
        colorHex: '#EAB308',
        label_en: 'FO 32 – Yellow',
        label_ar: 'FO 32 – Yellow',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/187f6429-fee1-4f50-8edc-2a18bac1de35.jpg'
      }
    ]
  },
  {
    groupId: 'bur-group-fisher-bur',
    name_en: 'Fisher Bur',
    name_ar: 'Fisher Bur',
    base_image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-sf-41-blue.png',
    base_price: 2,
    productIds: [
      '22000000-0000-0000-0000-000000000213', // SF 41 – Blue
      '8a2c351d-359c-4f5e-8c37-3d4ecb1eba19', // SF 46 – Blue
      'e625888c-c1b0-4479-9117-76a1215a75f4'  // CD 52 – Red
    ],
    options: [
      {
        productId: '22000000-0000-0000-0000-000000000213',
        code: 'SF 41',
        color: 'Blue',
        colorHex: '#2563EB',
        label_en: 'SF 41 – Blue',
        label_ar: 'SF 41 – Blue',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-sf-41-blue.png'
      },
      {
        productId: '8a2c351d-359c-4f5e-8c37-3d4ecb1eba19',
        code: 'SF 46',
        color: 'Blue',
        colorHex: '#2563EB',
        label_en: 'SF 46 – Blue',
        label_ar: 'SF 46 – Blue',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/8a2c351d-359c-4f5e-8c37-3d4ecb1eba19.jpg'
      },
      {
        productId: 'e625888c-c1b0-4479-9117-76a1215a75f4',
        code: 'CD 52',
        color: 'Red',
        colorHex: '#DC2626',
        label_en: 'CD 52 – Red',
        label_ar: 'CD 52 – Red',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/e625888c-c1b0-4479-9117-76a1215a75f4.jpg'
      }
    ]
  },
  {
    groupId: 'bur-group-round-bur',
    name_en: 'Round Bur',
    name_ar: 'Round Bur',
    base_image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-br-41.png',
    base_price: 2,
    productIds: [
      '22000000-0000-0000-0000-000000000214', // BR 41
      '4caab5ef-1c9c-411e-8b6e-76781a07fd97'  // BR 46
    ],
    options: [
      {
        productId: '22000000-0000-0000-0000-000000000214',
        code: 'BR 41',
        color: null,
        label_en: 'BR 41',
        label_ar: 'BR 41',
        image: 'https://api.kurofangs.id.ly/storage/v1/object/public/smylodent-assets/products/bur-br-41.png'
      },
      {
        productId: '4caab5ef-1c9c-411e-8b6e-76781a07fd97',
        code: 'BR 46',
        color: null,
        label_en: 'BR 46',
        label_ar: 'BR 46',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/4caab5ef-1c9c-411e-8b6e-76781a07fd97.jpg'
      }
    ]
  },
  {
    groupId: 'bur-group-si-bur',
    name_en: 'SI Bur',
    name_ar: 'SI Bur',
    base_image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/2ebc663e-0967-4d6a-b8be-b07b9e84659c.jpg',
    base_price: 2,
    productIds: [
      '2ebc663e-0967-4d6a-b8be-b07b9e84659c'  // SI 46 – Blue
    ],
    options: [
      {
        productId: '2ebc663e-0967-4d6a-b8be-b07b9e84659c',
        code: 'SI 46',
        color: 'Blue',
        colorHex: '#2563EB',
        label_en: 'SI 46 – Blue',
        label_ar: 'SI 46 – Blue',
        image: 'https://102-203-202-115.sslip.io/storage/v1/object/public/pdf-sheets/smylodent-products/2ebc663e-0967-4d6a-b8be-b07b9e84659c.jpg'
      }
    ]
  }
];

// Map from productId to group definition
const PRODUCT_TO_GROUP_MAP = new Map();
BUR_GROUPS.forEach(g => {
  g.productIds.forEach(pid => {
    PRODUCT_TO_GROUP_MAP.set(pid, g);
  });
});

/**
 * Checks if a product belongs to any bur group
 */
export function isBurGroupProduct(productId) {
  return PRODUCT_TO_GROUP_MAP.has(productId);
}

/**
 * Gets the bur group definition for a product ID
 */
export function getBurGroup(productId) {
  return PRODUCT_TO_GROUP_MAP.get(productId) || null;
}

/**
 * Resolves a product record by ID from a loaded products array or default fallback
 */
export function resolveBurProduct(productId, pool = []) {
  const foundInPool = pool.find(p => p.id === productId);
  if (foundInPool) return foundInPool;
  return defaultProductsList.find(p => p.id === productId) || null;
}

/**
 * Groups a flat array of products so that similar burs are collapsed into
 * a single group card. Leaves all other non-bur products untouched.
 *
 * @param {Array} products - List of products from DB or search filter
 * @returns {Array} - List with grouped bur cards + unchanged normal products
 */
export function groupProductsList(products = []) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  const result = [];
  const handledGroupIds = new Set();
  const groupItemsMap = new Map();

  // First pass: index products by ID for quick lookup
  const allProdsMap = new Map();
  products.forEach(p => allProdsMap.set(p.id, p));

  for (const prod of products) {
    const groupDef = PRODUCT_TO_GROUP_MAP.get(prod.id);

    if (!groupDef) {
      // Regular non-bur product, pass through unchanged
      result.push(prod);
      continue;
    }

    if (handledGroupIds.has(groupDef.groupId)) {
      // Group card already placed in result; add this product to group's member pool
      const groupCard = groupItemsMap.get(groupDef.groupId);
      if (groupCard && !groupCard.matchedProductIds.includes(prod.id)) {
        groupCard.matchedProductIds.push(prod.id);
        groupCard.matchedProducts.push(prod);
      }
      continue;
    }

    // First time seeing this bur group: create the unified display card
    handledGroupIds.add(groupDef.groupId);

    // Build the resolved options list with actual DB records
    const resolvedOptions = groupDef.options.map(opt => {
      const dbProd = allProdsMap.get(opt.productId) || resolveBurProduct(opt.productId, products);
      return {
        ...opt,
        product: dbProd,
        price: dbProd?.price ?? groupDef.base_price,
        // Availability: strictly available unless specifically marked otherwise or out of stock
        isAvailable: dbProd ? (dbProd.availability === 'available' || dbProd.availability === 'by_order' || (dbProd.stock_quantity != null && dbProd.stock_quantity > 0)) : true
      };
    });

    const groupCard = {
      id: groupDef.groupId,
      isBurGroup: true,
      groupDef,
      name_en: groupDef.name_en,
      name_ar: groupDef.name_ar,
      price: resolvedOptions[0]?.price ?? groupDef.base_price,
      image_url: groupDef.base_image,
      subject_id: prod.subject_id,
      year_id: prod.year_id,
      matchedProductIds: [prod.id],
      matchedProducts: [prod],
      resolvedOptions,
      sort_order: prod.sort_order ?? 0,
      // Search keywords helper so user queries match the group
      searchKeywords: `${groupDef.name_en} ${groupDef.name_ar} ${groupDef.options.map(o => `${o.code} ${o.color || ''} ${o.label_en}`).join(' ')}`
    };

    groupItemsMap.set(groupDef.groupId, groupCard);
    result.push(groupCard);
  }

  return result;
}
