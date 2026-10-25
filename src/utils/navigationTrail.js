/**
 * Navigation Trail & Context Engine — Absolute Dental Equipment
 * Tracks actual user browse journey across the storefront and decouples
 * breadcrumbs from static database hierarchies.
 */

export const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى',  name_en: '1st Year', slug: '1st-year' },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year' },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year' },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year' }
];

export const DEFAULT_SUBJECTS = [
  {
    id: '11000000-0000-0000-0000-000000000011',
    year_id: '10000000-0000-0000-0000-000000000001',
    name_ar: 'تشريح الأسنان',
    name_en: 'Dental Anatomy',
    slug: 'dental-anatomy',
  },
  {
    id: '11000000-0000-0000-0000-000000000012',
    year_id: '10000000-0000-0000-0000-000000000001',
    name_ar: 'مواد طب الأسنان',
    name_en: 'Dental Materials',
    slug: 'dental-materials',
  },
  {
    id: '22000000-0000-0000-0000-000000000021',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    slug: 'restorative-dentistry',
  },
  {
    id: '22000000-0000-0000-0000-000000000021-alt',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    slug: 'operative-dentistry',
  },
  {
    id: '22000000-0000-0000-0000-000000000022',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'صناعة الأسنان المتحركة',
    name_en: 'Removable Prosthodontics',
    slug: 'removable-prosthodontics',
  },
  {
    id: '22000000-0000-0000-0000-000000000023',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'صناعة الأسنان الثابتة',
    name_en: 'Fixed Prosthodontics',
    slug: 'fixed-prosthodontics',
  },
  {
    id: '33000000-0000-0000-0000-000000000031',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'علاج الأسنان التحفظي 2',
    name_en: 'Conservative Dentistry 2',
    slug: 'conservative-dentistry-2',
  },
  {
    id: '33000000-0000-0000-0000-000000000032',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'طب الأسنان الوقائي',
    name_en: 'Preventive Dentistry',
    slug: 'preventive-dentistry',
  },
  {
    id: '44000000-0000-0000-0000-000000000041',
    year_id: '40000000-0000-0000-0000-000000000004',
    name_ar: 'علاج الجذور',
    name_en: 'Endodontics',
    slug: 'endodontics',
  }
];

/**
 * Builds a deterministic product URL carrying origin query parameters.
 * Survives page reloads and cross-origin links.
 */
export function buildProductUrl(productId, origin = {}) {
  if (!productId) return '/';
  if (typeof origin === 'string') {
    return `/product/${productId}?from=${encodeURIComponent(origin)}`;
  }

  const params = new URLSearchParams();
  if (origin.from) params.set('from', origin.from);
  if (origin.sub || origin.subjectSlug) params.set('sub', origin.sub || origin.subjectSlug);
  if (origin.yr || origin.yearSlug) params.set('yr', origin.yr || origin.yearSlug);
  if (origin.q) params.set('q', origin.q);

  const qs = params.toString();
  return `/product/${productId}${qs ? `?${qs}` : ''}`;
}

/**
 * Persists browsing origin into sessionStorage safely.
 */
export function recordProductOrigin(productId, originData) {
  try {
    if (!productId || typeof window === 'undefined' || !window.sessionStorage) return;
    const payload = JSON.stringify({
      ...originData,
      timestamp: Date.now()
    });
    sessionStorage.setItem(`ad_prod_origin_${productId}`, payload);
    sessionStorage.setItem('ad_last_browse_origin', payload);
  } catch (_) {}
}

/**
 * Retrieves persisted browsing origin from sessionStorage.
 */
export function getSavedProductOrigin(productId) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = productId ? sessionStorage.getItem(`ad_prod_origin_${productId}`) : null;
    if (raw) return JSON.parse(raw);
    const lastRaw = sessionStorage.getItem('ad_last_browse_origin');
    if (lastRaw) return JSON.parse(lastRaw);
  } catch (_) {}
  return null;
}

/**
 * Helper to check if a product is an Accessory.
 */
export function isAccessoryProduct(product) {
  if (!product) return false;
  const pId = String(product.id || '');
  if (pId === '55000000-0000-0000-0000-000000000001') return true;
  const text = `${product.name_ar || ''} ${product.name_en || ''} ${product.description_ar || ''}`.toLowerCase();
  return (
    text.includes('لاب كوت') ||
    text.includes('lab coat') ||
    text.includes('يونيفورم') ||
    text.includes('uniform') ||
    text.includes('scrub') ||
    text.includes('figs')
  );
}

/**
 * Helper to check if a product is a Box product.
 */
export function isBoxProductEntity(product) {
  if (!product) return false;
  const text = `${product.name_ar || ''} ${product.name_en || ''} ${product.sku || ''}`.toLowerCase();
  return text.includes('box') || text.includes('بوكس') || text.includes('علبة');
}

/**
 * Resolves the active breadcrumb trail and back button based on actual user browsing path.
 */
export function resolveNavigationContext({
  product,
  subject,
  year,
  searchParams,
  locationState,
  lang = 'ar'
}) {
  const isRtl = lang === 'ar';
  const prodId = product?.id;
  const savedOrigin = getSavedProductOrigin(prodId);

  // 1. Identify origin source from searchParams, locationState, or sessionStorage
  const fromParam = searchParams?.get('from') || locationState?.fromCategory || savedOrigin?.from || null;
  const subParam = searchParams?.get('sub') || locationState?.subjectSlug || savedOrigin?.sub || null;
  const yrParam = searchParams?.get('yr') || locationState?.yearSlug || savedOrigin?.yr || null;
  const queryParam = searchParams?.get('q') || locationState?.searchQuery || savedOrigin?.q || null;
  const stateReturnPath = locationState?.returnPath || savedOrigin?.returnPath || null;

  const displayName = isRtl
    ? (product?.name_ar || product?.name_en || 'أداة طبية')
    : (product?.name_en || product?.name_ar || 'Dental Tool');

  // ── BRANCH A: User arrived from Accessories ──
  if (fromParam === 'accessories' || locationState?.from === '/accessories' || stateReturnPath === '/accessories') {
    return {
      originType: 'accessories',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'الإكسسوارات' : 'Accessories', path: '/accessories' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى الإكسسوارات' : 'Back to Accessories',
        path: '/accessories'
      }
    };
  }

  // ── BRANCH B: User arrived from Boxes ──
  if (fromParam === 'boxes' || fromParam === 'dental-boxes' || locationState?.from === '/boxes' || stateReturnPath === '/boxes') {
    return {
      originType: 'boxes',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'البوكسات' : 'Dental Boxes', path: '/boxes' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى البوكسات' : 'Back to Dental Boxes',
        path: '/boxes'
      }
    };
  }

  // ── BRANCH C: User arrived from Other Supplies ──
  if (fromParam === 'other-supplies' || stateReturnPath === '/other-supplies') {
    return {
      originType: 'other-supplies',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'مستلزمات أخرى' : 'Other Supplies', path: '/other-supplies' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى مستلزمات أخرى' : 'Back to Other Supplies',
        path: '/other-supplies'
      }
    };
  }

  // ── BRANCH D: User arrived from Offers ──
  if (fromParam === 'offers' || stateReturnPath === '/offers') {
    return {
      originType: 'offers',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'العروض والتخفيضات' : 'Offers', path: '/offers' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى العروض' : 'Back to Offers',
        path: '/offers'
      }
    };
  }

  // ── BRANCH E: User arrived from Search ──
  if (fromParam === 'search' || (stateReturnPath && stateReturnPath.startsWith('/search'))) {
    const searchTarget = stateReturnPath || (queryParam ? `/search?q=${encodeURIComponent(queryParam)}` : '/search');
    return {
      originType: 'search',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'البحث' : 'Search', path: searchTarget },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى نتائج البحث' : 'Back to Search Results',
        path: searchTarget
      }
    };
  }

  // ── BRANCH F: User arrived from Favorites ──
  if (fromParam === 'favorites' || stateReturnPath === '/favorites') {
    return {
      originType: 'favorites',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'المفضلة' : 'Favorites', path: '/favorites' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى المفضلة' : 'Back to Favorites',
        path: '/favorites'
      }
    };
  }

  // ── BRANCH G: User arrived from Cart ──
  if (fromParam === 'cart' || stateReturnPath === '/cart') {
    return {
      originType: 'cart',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'سلة المشتريات' : 'Shopping Cart', path: '/cart' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى سلة المشتريات' : 'Back to Shopping Cart',
        path: '/cart'
      }
    };
  }

  // ── BRANCH H: User arrived from a Subject Page or has Subject parameter ──
  const activeSubSlug = subParam || subject?.slug;
  if (fromParam === 'subject' || activeSubSlug) {
    const resolvedSubject = DEFAULT_SUBJECTS.find(s => s.slug === activeSubSlug || s.id === subject?.id) || subject;
    const resolvedYearId = resolvedSubject?.year_id || year?.id;
    const resolvedYear = DEFAULT_YEARS.find(y => y.slug === yrParam || y.id === resolvedYearId) || year;

    const yearLabel = isRtl
      ? (resolvedYear?.name_ar || 'السنة الدراسية')
      : (resolvedYear?.name_en || 'Academic Year');
    const yearSlug = resolvedYear?.slug || '1st-year';

    const subLabel = isRtl
      ? (resolvedSubject?.name_ar || 'المادة الدراسية')
      : (resolvedSubject?.name_en || 'Subject Tools');
    const subSlug = resolvedSubject?.slug || activeSubSlug || 'dental-anatomy';

    return {
      originType: 'subject',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'أدوات الدراسة' : 'Study Tools', path: '/study-tools' },
        { label: yearLabel, path: `/year/${yearSlug}` },
        { label: subLabel, path: `/subject/${subSlug}` },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? `العودة إلى ${subLabel}` : `Back to ${subLabel}`,
        path: `/subject/${subSlug}`
      }
    };
  }

  // ── BRANCH I: Direct Entry Fallback (No previous browsing state) ──
  // Check if product is inherently an Accessory
  if (isAccessoryProduct(product)) {
    return {
      originType: 'accessories',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'الإكسسوارات' : 'Accessories', path: '/accessories' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى الإكسسوارات' : 'Back to Accessories',
        path: '/accessories'
      }
    };
  }

  // Check if product is inherently a Box
  if (isBoxProductEntity(product)) {
    return {
      originType: 'boxes',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'البوكسات' : 'Dental Boxes', path: '/boxes' },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? 'العودة إلى البوكسات' : 'Back to Dental Boxes',
        path: '/boxes'
      }
    };
  }

  // Check if product belongs to a Subject in database
  if (subject || product?.subject_id) {
    const resolvedSubject = DEFAULT_SUBJECTS.find(s => s.id === product?.subject_id || s.slug === subject?.slug) || subject;
    const resolvedYear = DEFAULT_YEARS.find(y => y.id === resolvedSubject?.year_id || y.id === year?.id) || year;

    const yearLabel = isRtl
      ? (resolvedYear?.name_ar || 'السنة الدراسية')
      : (resolvedYear?.name_en || 'Academic Year');
    const yearSlug = resolvedYear?.slug || '1st-year';

    const subLabel = isRtl
      ? (resolvedSubject?.name_ar || 'المادة الدراسية')
      : (resolvedSubject?.name_en || 'Subject Tools');
    const subSlug = resolvedSubject?.slug || 'dental-anatomy';

    return {
      originType: 'subject',
      breadcrumbs: [
        { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
        { label: isRtl ? 'أدوات الدراسة' : 'Study Tools', path: '/study-tools' },
        { label: yearLabel, path: `/year/${yearSlug}` },
        { label: subLabel, path: `/subject/${subSlug}` },
        { label: displayName, path: null, current: true }
      ],
      backButton: {
        label: isRtl ? `العودة إلى ${subLabel}` : `Back to ${subLabel}`,
        path: `/subject/${subSlug}`
      }
    };
  }

  // Generic fallback: Study Tools
  return {
    originType: 'study-tools',
    breadcrumbs: [
      { label: isRtl ? 'الرئيسية' : 'Home', path: '/' },
      { label: isRtl ? 'أدوات الدراسة' : 'Study Tools', path: '/study-tools' },
      { label: displayName, path: null, current: true }
    ],
    backButton: {
      label: isRtl ? 'العودة إلى أدوات الدراسة' : 'Back to Study Tools',
      path: '/study-tools'
    }
  };
}
