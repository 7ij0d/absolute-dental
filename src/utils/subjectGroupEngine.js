/**
 * Subject Product Categorization & Display Engine for Absolute Dental
 * Organizes products in each academic subject into clean, cohesive, semantic groups.
 */

// Lucide icon identifiers for visual rendering
export const GROUP_ICONS = {
  burs: 'Disc',
  handpieces_casting: 'Wrench',
  examination: 'Search',
  artificial_teeth: 'Sparkles',
  consumables: 'Package',
  wax_lab: 'Flame',
  water_impression: 'Droplets',
  mixing_slabs: 'Layers',
  clinical_surgical: 'ShieldCheck',
  general: 'Box'
};

// Item classification helpers
const isBurProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  // Bur Holder is a consumable, not a rotary bur!
  if (s.includes('holder') || s.includes('علبة')) return false;
  return Boolean(p.isBurGroup) || s.includes('bur') || s.includes('بير') || (typeof p.id === 'string' && p.id.startsWith('bur-group'));
};

const isHandpieceOrCast = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return s.includes('handpiece') || s.includes('قبضة') || s.includes('cast') || s.includes('كاست') || s.includes('turbine') || s.includes('توربين');
};

const isExamProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  if (s.includes('glove') || s.includes('قفاز')) return false;
  return s.includes('probe') || s.includes('mirror') || s.includes('مرآة') || s.includes('بروب') || s.includes('فحص');
};

const isTeethProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return s.includes('artificial teeth') || s.includes('teeth') || s.includes('incisor') || s.includes('molar') || s.includes('أسنان صناعية');
};

const isConsumableProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return (
    s.includes('holder') ||
    s.includes('glove') ||
    s.includes('mask') ||
    s.includes('cover sheet') ||
    s.includes('قفاز') ||
    s.includes('كمام') ||
    s.includes('مفرش') ||
    s.includes('علبة')
  );
};

const isWaxOrLabProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return (
    s.includes('wax') ||
    s.includes('واكس') ||
    s.includes('lighter') ||
    s.includes('torch') ||
    s.includes('baseplate') ||
    s.includes('spatula') ||
    s.includes('carver') ||
    s.includes('نحت') ||
    s.includes('شمع')
  );
};

const isImpressionOrWaterProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return (
    s.includes('water gauge') ||
    s.includes('معيار') ||
    s.includes('alginate') ||
    s.includes('silaxil') ||
    s.includes('impression tray') ||
    s.includes('طبعة') ||
    s.includes('enersyl') ||
    s.includes('activator')
  );
};

const isMixingProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return s.includes('slab') || s.includes('bowl') || s.includes('شريحة') || s.includes('خلط');
};

const isClinicalSurgicalProduct = (p) => {
  const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
  return (
    s.includes('gauze') ||
    s.includes('شاش') ||
    s.includes('barrier') ||
    s.includes('gown') ||
    s.includes('جاون') ||
    s.includes('rubber dam') ||
    s.includes('blade') ||
    s.includes('شفر') ||
    s.includes('floss')
  );
};

// Priority sorting inside groups
const BUR_PREFERRED_ORDER = [
  'bur-group-tf-flat-end',
  'bur-group-round-bur',
  'bur-group-diamond-flame',
  'bur-group-fisher-bur',
  'bur-group-tc-needle',
  'bur-group-si-bur'
];

function sortBurs(items) {
  return [...items].sort((a, b) => {
    const aIdx = BUR_PREFERRED_ORDER.indexOf(a.id);
    const bIdx = BUR_PREFERRED_ORDER.indexOf(b.id);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });
}

function sortHandpiecesAndCasting(items) {
  // 1. Bundle (Study Cast + NSK Handpiece)
  // 2. Dental Cast
  // 3. NSK High-Speed Handpiece
  // 4. COXO High-Speed Handpiece
  // 5. Westcode High-Speed Handpiece
  const getWeight = (p) => {
    const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
    if (p.id === 'fa042791-6d8d-48c1-8f60-f1a103162a1e' || (s.includes('cast') && s.includes('handpiece'))) return 1;
    if (p.id === '8f344bd9-91ec-4787-8371-f489cccf635e' || (s.includes('dental cast') && !s.includes('handpiece'))) return 2;
    if (p.id === 'ad31f7c7-d710-4622-8e3f-377b9c657818' || s.includes('nsk')) return 3;
    if (p.id === '8806943f-d3bf-443b-b623-7002b354a355' || s.includes('coxo')) return 4;
    if (p.id === 'f325cfaa-c6b0-4330-966e-262cdced4635' || s.includes('westcode')) return 5;
    return 6;
  };
  return [...items].sort((a, b) => getWeight(a) - getWeight(b));
}

function sortExamination(items) {
  // Periodontal Probe first, then Dental Mouth Mirror
  const getWeight = (p) => {
    const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
    if (s.includes('probe') || s.includes('بروب')) return 1;
    if (s.includes('mirror') || s.includes('مرآة')) return 2;
    return 3;
  };
  return [...items].sort((a, b) => getWeight(a) - getWeight(b));
}

function sortConsumables(items) {
  // 1. Bur Holder, 2. Gloves, 3. Masks, 4. Mask & Gloves Set, 5. Cover Sheets, 6. Medical Alcohol
  const orderWeight = (p) => {
    const s = ((p.name_en || '') + ' ' + (p.name_ar || '')).toLowerCase();
    if (s.includes('holder') || s.includes('علبة')) return 1;
    if (s.includes('glove') && !s.includes('set') && !s.includes('طقم')) return 2;
    if (s.includes('mask') && !s.includes('set') && !s.includes('طقم')) return 3;
    if (s.includes('set') || s.includes('طقم')) return 4;
    if (s.includes('cover sheet') || s.includes('مفرش')) return 5;
    if (s.includes('alcohol') || s.includes('كحول')) return 6;
    return 7;
  };

  return [...items].sort((a, b) => orderWeight(a) - orderWeight(b));
}

/**
 * Organizes a list of products (already processed by groupProductsList)
 * into semantic visual groups based on subject slug and product characteristics.
 *
 * @param {string} subjectSlug - The slug of the subject (e.g. 'fixed-prosthodontics')
 * @param {Array} products - Grouped products list
 * @returns {Array} List of non-empty group objects with id, titleEn, titleAr, icon, items
 */
export function getSubjectProductGroups(subjectSlug, products = []) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  const slug = (subjectSlug || '').toLowerCase().trim();

  // Helper tracking sets to prevent duplicates
  const placedIds = new Set();
  const groups = [];

  const addGroup = (id, titleEn, titleAr, icon, items) => {
    if (items && items.length > 0) {
      groups.push({
        id,
        key: id,
        titleEn,
        titleAr,
        icon: icon || GROUP_ICONS[id] || 'Box',
        items
      });
      items.forEach(p => placedIds.add(p.id));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. FIXED PROSTHODONTICS (Year 2)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'fixed-prosthodontics') {
    // 1. Dental Burs
    const burs = sortBurs(products.filter(p => isBurProduct(p)));
    addGroup('burs', 'Dental Burs', 'البارات', 'Disc', burs);

    // 2. Handpieces & Casting
    const hp = sortHandpiecesAndCasting(products.filter(p => !placedIds.has(p.id) && isHandpieceOrCast(p)));
    addGroup('handpieces_casting', 'Handpieces & Casting', 'الهاندبيج والقطع الصينية والمجسمات', 'Wrench', hp);

    // 3. Examination Instruments
    const exam = sortExamination(products.filter(p => !placedIds.has(p.id) && isExamProduct(p)));
    addGroup('examination', 'Examination Instruments', 'أدوات الفحص', 'Search', exam);

    // 4. Artificial Teeth
    const teeth = products.filter(p => !placedIds.has(p.id) && isTeethProduct(p));
    addGroup('artificial_teeth', 'Artificial Teeth', 'الأسنان الصناعية', 'Sparkles', teeth);

    // 5. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CONSERVATIVE DENTISTRY (Year 2)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'restorative-dentistry' || slug === 'conservative-dentistry') {
    // 1. Dental Burs & Rotary
    const burs = sortBurs(products.filter(p => isBurProduct(p)));
    addGroup('burs', 'Dental Burs & Rotary', 'البارات والأدوات الدوارة', 'Disc', burs);

    // 2. Handpieces & Equipment
    const hp = sortHandpiecesAndCasting(products.filter(p => !placedIds.has(p.id) && isHandpieceOrCast(p)));
    addGroup('handpieces_casting', 'Handpieces & Equipment', 'الهاندبيج ومعدات العمل', 'Wrench', hp);

    // 3. Examination Instruments
    const exam = products.filter(p => !placedIds.has(p.id) && isExamProduct(p));
    addGroup('examination', 'Examination Instruments', 'أدوات الفحص', 'Search', exam);

    // 4. Artificial Teeth
    const teeth = products.filter(p => !placedIds.has(p.id) && isTeethProduct(p));
    addGroup('artificial_teeth', 'Artificial Teeth', 'الأسنان الصناعية', 'Sparkles', teeth);

    // 5. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. REMOVABLE PROSTHODONTICS (Year 2)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'removable-prosthodontics') {
    // 1. Waxing & Lab Instruments
    const wax = products.filter(p => isWaxOrLabProduct(p));
    addGroup('wax_lab', 'Waxing & Lab Instruments', 'أدوات التشميع والمعمل', 'Flame', wax);

    // 2. Water Measurement & Impression Tools
    const water = products.filter(p => !placedIds.has(p.id) && isImpressionOrWaterProduct(p));
    addGroup('water_impression', 'Water Measurement & Impression', 'أدوات القياس وأخذ الطبعات', 'Droplets', water);

    // 3. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. DENTAL ANATOMY (Year 1)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'dental-anatomy') {
    // 1. Tooth Carving Wax & Knives
    const wax = products.filter(p => isWaxOrLabProduct(p));
    addGroup('wax_lab', 'Tooth Carving Wax & Knives', 'شمع النحت وأدوات تشريح الأسنان', 'Flame', wax);

    // 2. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DENTAL MATERIALS (Year 1)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'dental-materials') {
    // 1. Mixing Instruments & Glass Slabs
    const mixing = products.filter(p => isMixingProduct(p) || isWaxOrLabProduct(p));
    addGroup('mixing_slabs', 'Mixing Instruments & Slabs', 'أدوات الخلط والشرائح الزجاجية', 'Layers', mixing);

    // 2. Water Measurement
    const water = products.filter(p => !placedIds.has(p.id) && isImpressionOrWaterProduct(p));
    addGroup('water_impression', 'Water Measurement', 'أدوات القياس ومعايير الماء', 'Droplets', water);

    // 3. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FIXED PROSTHODONTICS 2 (Year 3)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'fixed-prosthodontics-2') {
    // 1. Handpieces & Turbine Equipment
    const hp = products.filter(p => isHandpieceOrCast(p));
    addGroup('handpieces_casting', 'Handpieces & Turbine Equipment', 'قبضة التوربين ومعدات العيادة', 'Wrench', hp);

    // 2. Impression Materials & Trays
    const imp = products.filter(p => !placedIds.has(p.id) && isImpressionOrWaterProduct(p));
    addGroup('water_impression', 'Impression Materials & Trays', 'مواد الطبعة وقوالب السيليكون', 'Droplets', imp);

    // 3. Clinical & Surgical Instruments
    const clin = products.filter(p => !placedIds.has(p.id) && (isClinicalSurgicalProduct(p) || isExamProduct(p)));
    addGroup('clinical_surgical', 'Clinical & Surgical Instruments', 'الأدوات الجراحية والعزل العيادي', 'ShieldCheck', clin);

    // 4. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 7. REMOVABLE PROSTHODONTICS 2 (Year 3)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'removable-prosthodontics-2') {
    // 1. Impression Materials & Trays
    const imp = products.filter(p => isImpressionOrWaterProduct(p) && !p.name_en?.toLowerCase().includes('water gauge'));
    addGroup('water_impression', 'Impression Materials & Trays', 'مواد الطبعة وقوالب الألجينات', 'Droplets', imp);

    // 2. Water Measurement
    const water = products.filter(p => !placedIds.has(p.id) && isImpressionOrWaterProduct(p));
    addGroup('water_gauge', 'Water Measurement', 'معايير قياس الماء', 'Droplets', water);

    // 3. Clinical & Surgical Instruments
    const clin = products.filter(p => !placedIds.has(p.id) && (isClinicalSurgicalProduct(p) || isExamProduct(p)));
    addGroup('clinical_surgical', 'Clinical & Surgical Instruments', 'الأدوات الجراحية والعزل العيادي', 'ShieldCheck', clin);

    // 4. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 8. CONSERVATIVE DENTISTRY 2 (Year 3)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'conservative-dentistry-2') {
    // 1. Handpieces & Equipment
    const hp = products.filter(p => isHandpieceOrCast(p));
    addGroup('handpieces_casting', 'Handpieces & Equipment', 'قبضة التوربين ومعدات العيادة', 'Wrench', hp);

    // 2. Isolation & Clinical Examination
    const clin = products.filter(p => !placedIds.has(p.id) && (isClinicalSurgicalProduct(p) || isExamProduct(p)));
    addGroup('clinical_surgical', 'Isolation & Clinical Examination', 'أدوات العزل والفحص العيادي', 'ShieldCheck', clin);

    // 3. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 9. PREVENTIVE DENTISTRY (Year 3)
  // ─────────────────────────────────────────────────────────────
  if (slug === 'preventive-dentistry') {
    // 1. Clinical Supplies & Gauze
    const clin = products.filter(p => isClinicalSurgicalProduct(p));
    addGroup('clinical_surgical', 'Clinical Supplies & Gauze', 'مستلزمات العيادة والشاش الطبي', 'ShieldCheck', clin);

    // 2. Consumables & Accessories
    const cons = sortConsumables(products.filter(p => !placedIds.has(p.id)));
    addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

    return groups;
  }

  // ─────────────────────────────────────────────────────────────
  // 10. UNIVERSAL ADAPTIVE FALLBACK (Any other or new subject)
  // ─────────────────────────────────────────────────────────────
  // 1. Burs
  const burs = sortBurs(products.filter(p => isBurProduct(p)));
  addGroup('burs', 'Dental Burs & Rotary', 'البارات والأدوات الدوارة', 'Disc', burs);

  // 2. Handpieces & Casting
  const hp = sortHandpiecesAndCasting(products.filter(p => !placedIds.has(p.id) && isHandpieceOrCast(p)));
  addGroup('handpieces_casting', 'Handpieces & Clinical Equipment', 'الهاندبيج ومعدات العمل', 'Wrench', hp);

  // 3. Examination
  const exam = products.filter(p => !placedIds.has(p.id) && isExamProduct(p));
  addGroup('examination', 'Diagnostic & Examination Instruments', 'أدوات الفحص والتشخيص', 'Search', exam);

  // 4. Teeth & Models
  const teeth = products.filter(p => !placedIds.has(p.id) && isTeethProduct(p));
  addGroup('artificial_teeth', 'Artificial Teeth & Models', 'الأسنان والمجسمات التعليمية', 'Sparkles', teeth);

  // 5. Wax & Lab
  const wax = products.filter(p => !placedIds.has(p.id) && isWaxOrLabProduct(p));
  addGroup('wax_lab', 'Waxing & Lab Instruments', 'أدوات التشميع والمعمل', 'Flame', wax);

  // 6. Impression & Materials
  const imp = products.filter(p => !placedIds.has(p.id) && isImpressionOrWaterProduct(p));
  addGroup('water_impression', 'Impression Materials & Tools', 'مواد الطبعات وأدوات القياس', 'Droplets', imp);

  // 7. Clinical & Surgical
  const clin = products.filter(p => !placedIds.has(p.id) && isClinicalSurgicalProduct(p));
  addGroup('clinical_surgical', 'Clinical & Surgical Instruments', 'الأدوات الجراحية والعيادية', 'ShieldCheck', clin);

  // 8. Consumables
  const cons = sortConsumables(products.filter(p => !placedIds.has(p.id) && isConsumableProduct(p)));
  addGroup('consumables', 'Consumables & Accessories', 'المستهلكات والإكسسوارات', 'Package', cons);

  // 9. Remaining General Supplies
  const rem = products.filter(p => !placedIds.has(p.id));
  addGroup('general', 'General Supplies & Tools', 'أدوات ومستلزمات دراسية عامة', 'Box', rem);

  return groups;
}
