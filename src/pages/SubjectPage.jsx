import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import { cacheGet, cacheSet } from '../cache';
import defaultProductsList from '../defaultProducts.json';
import {
  SlidersHorizontal, ChevronLeft, ChevronRight,
  Package, Search, X, RotateCcw, Layers, Sparkles
} from 'lucide-react';

const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى', name_en: '1st Year', slug: '1st-year' },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year' },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year' },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year' }
];

const DEFAULT_SUBJECTS = [
  {
    id: '11000000-0000-0000-0000-000000000011',
    year_id: '10000000-0000-0000-0000-000000000001',
    name_ar: 'تشريح الأسنان',
    name_en: 'Dental Anatomy',
    description_ar: 'الأدوات والمواد المطلوبة للمادة',
    description_en: 'Required tools and materials for Dental Anatomy',
    slug: 'dental-anatomy',
  },
  {
    id: '11000000-0000-0000-0000-000000000012',
    year_id: '10000000-0000-0000-0000-000000000001',
    name_ar: 'مواد طب الأسنان',
    name_en: 'Dental Materials',
    description_ar: 'الأدوات والمواد المطلوبة للمادة',
    description_en: 'Required tools and supplies for Dental Materials',
    slug: 'dental-materials',
  },
  {
    id: '22000000-0000-0000-0000-000000000021',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    description_ar: 'الأدوات والمواد المطلوبة للمادة',
    description_en: 'Required tools and instruments for Operative Dentistry',
    slug: 'restorative-dentistry',
  },
  {
    id: '22000000-0000-0000-0000-000000000021-alt',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    description_ar: 'الأدوات والمواد المطلوبة للمادة',
    description_en: 'Required tools and instruments for Operative Dentistry',
    slug: 'operative-dentistry',
  },
  {
    id: '22000000-0000-0000-0000-000000000022',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'صناعة الأسنان المتحركة',
    name_en: 'Removable Prosthodontics',
    description_ar: 'الأدوات والمواد المطلوبة للمادة',
    description_en: 'Required tools and gear for Removable Prosthodontics',
    slug: 'removable-prosthodontics',
  },
  {
    id: '22000000-0000-0000-0000-000000000023',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'صناعة الأسنان الثابتة',
    name_en: 'Fixed Prosthodontics',
    description_ar: 'الأدوات والمواد المطلوبة للمادة',
    description_en: 'Required tools and burs for Fixed Prosthodontics',
    slug: 'fixed-prosthodontics',
  },
  {
    id: '33000000-0000-0000-0000-000000000031',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'علاج الأسنان التحفظي 2',
    name_en: 'Conservative Dentistry 2',
    description_ar: 'الأدوات والمواد المطلوبة لمادة كونسيرفتف 2',
    description_en: 'Required tools and materials for Conservative Dentistry 2',
    slug: 'conservative-dentistry-2',
  },
  {
    id: '33000000-0000-0000-0000-000000000032',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'طب الأسنان الوقائي',
    name_en: 'Preventive Dentistry',
    description_ar: 'الأدوات والمستلزمات المطلوبة لمادة بريفنشن',
    description_en: 'Required tools and supplies for Preventive Dentistry',
    slug: 'preventive-dentistry',
  },
  {
    id: '33000000-0000-0000-0000-000000000033',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'صناعة الأسنان الثابتة 2',
    name_en: 'Fixed Prosthodontics 2',
    description_ar: 'الأدوات والمواد المطلوبة لمادة فكسد برستودونتيك 2',
    description_en: 'Required tools and burs for Fixed Prosthodontics 2',
    slug: 'fixed-prosthodontics-2',
  },
  {
    id: '33000000-0000-0000-0000-000000000034',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'صناعة الأسنان المتحركة 2',
    name_en: 'Removable Prosthodontics 2',
    description_ar: 'الأدوات والمواد المطلوبة لمادة ريموفبل برستودونتيك 2',
    description_en: 'Required tools and gear for Removable Prosthodontics 2',
    slug: 'removable-prosthodontics-2',
  },
];

export const SubjectPage = () => {
  const { slug } = useParams();
  const { lang, isRtl } = useLanguage();
  const auth = useAuth();
  const isAdmin = auth?.isAdmin;
  const isUserAdmin = Boolean(
    isAdmin ||
    (typeof window !== 'undefined' && (
      localStorage.getItem('admin_pin') === '9922' ||
      sessionStorage.getItem('admin_pin') === '9922' ||
      localStorage.getItem('admin_passcode') === '9922'
    ))
  );

  const lookupSlug = slug === 'operative-dentistry' ? 'restorative-dentistry' : slug;

  const [subjectData, setSubjectData] = useState(() =>
    DEFAULT_SUBJECTS.find(s => s.slug === slug || s.slug === lookupSlug) || DEFAULT_SUBJECTS[0]
  );
  const [yearData, setYearData] = useState(() => DEFAULT_YEARS[0]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // In-page search, sorting & filtering states
  const [inPageSearch, setInPageSearch] = useState('');
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(250);
  const [maxPrice, setMaxPrice] = useState(250);
  const [selectedStock, setSelectedStock] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const CACHE_KEY = `subject_v26:${slug}`;

    const applyData = ({ subject, year, prods }) => {
      setSubjectData(subject);
      setYearData(year);
      setProducts(prods || []);
      if (prods && prods.length > 0) {
        const highest = Math.ceil(Math.max(...prods.map(p => Number(p.price) || 0), 20));
        setDynamicMaxPrice(highest);
        setMaxPrice(highest);
      }
    };

    const fetchAndCache = async (showLoader) => {
      if (showLoader) setLoading(true);
      try {
        // 1. Fetch Subject
        const { data: subjectRes } = await supabase
          .from('subjects')
          .select('*')
          .or(`slug.eq.${slug},slug.eq.${lookupSlug}`)
          .maybeSingle();

        const subject = subjectRes ||
          DEFAULT_SUBJECTS.find(s => s.slug === slug || s.slug === lookupSlug) ||
          DEFAULT_SUBJECTS[0];

        // 2. Fetch Year + Primary Products + Junction Products + Universal Supplies
        const [{ data: yearRes }, { data: primaryProds }, { data: junctionLinks }, { data: universalProds }] = await Promise.all([
          supabase.from('years').select('*').eq('id', subject.year_id).maybeSingle(),
          supabase.from('products').select('*')
            .eq('is_active', true).eq('is_archived', false)
            .eq('subject_id', subject.id),
          supabase.from('product_subjects').select('product_id').eq('subject_id', subject.id),
          supabase.from('products').select('*')
            .eq('is_active', true).eq('is_archived', false)
            .eq('discount_label_en', 'universal')
        ]);

        const year = yearRes ||
          DEFAULT_YEARS.find(y => String(y.id) === String(subject.year_id)) ||
          DEFAULT_YEARS[0];

        // 3. Extra products linked through junction table
        const primaryIds = new Set((primaryProds || []).map(p => p.id));
        const extraIds = (junctionLinks || [])
          .map(r => r.product_id)
          .filter(id => !primaryIds.has(id));

        let extraProds = [];
        if (extraIds.length > 0) {
          const { data: ep } = await supabase.from('products').select('*')
            .in('id', extraIds)
            .eq('is_active', true).eq('is_archived', false);
          extraProds = ep || [];
        }

        let allProds = [...(primaryProds || []), ...extraProds];

        // 4. Merge Universal Supplies for this subject
        const junctionIdSet = new Set((junctionLinks || []).map(r => r.product_id));
        const CANONICAL_UNIVERSAL_IDS = new Set([
          '99000000-0000-0000-0000-000000000001',
          '99000000-0000-0000-0000-000000000002',
          '33000000-0000-0000-0000-000000000103',
          '33000000-0000-0000-0000-000000000104',
          '33000000-0000-0000-0000-000000000109'
        ]);

        if (Array.isArray(universalProds)) {
          for (const up of universalProds) {
            const isRelevant = 
              up.discount_label_en === 'universal' ||
              up.is_universal === true ||
              up.all_subjects === true ||
              up.all_years === true ||
              junctionIdSet.has(up.id) || 
              up.subject_id === subject.id || 
              CANONICAL_UNIVERSAL_IDS.has(up.id);
            if (isRelevant) {
              allProds.push(up);
            }
          }
        }

        // 5. Ensure seeded default products for this subject are merged if not already present
        const existingIds = new Set(allProds.map(p => p.id));
        const defaultsForSub = defaultProductsList.filter(p => 
          p.subject_id === subject.id || 
          p.all_subjects === true || 
          p.discount_label_en === 'universal' ||
          CANONICAL_UNIVERSAL_IDS.has(p.id) ||
          (Array.isArray(p.extra_subject_ids) && p.extra_subject_ids.includes(subject.id))
        );
        for (const dp of defaultsForSub) {
          if (!existingIds.has(dp.id)) {
            allProds.push(dp);
            existingIds.add(dp.id);
          }
        }

        // Strictly deduplicate by product id
        const seenIds = new Set();
        allProds = allProds.filter(p => {
          if (!p || !p.id || seenIds.has(p.id)) return false;
          seenIds.add(p.id);
          return true;
        });

        // 6. Gather all junction links for loaded products to determine accurate multi-subject mapping
        const allLoadedIds = allProds.map(p => p.id);
        const junctionMap = {};
        if (allLoadedIds.length > 0) {
          const { data: allJunctions } = await supabase
            .from('product_subjects')
            .select('product_id, subject_id')
            .in('product_id', allLoadedIds);

          if (allJunctions) {
            for (const j of allJunctions) {
              if (!junctionMap[j.product_id]) junctionMap[j.product_id] = new Set();
              junctionMap[j.product_id].add(j.subject_id);
            }
          }
        }

        // Populate assigned_subject_ids for each product (junction table is authoritative if configured)
        for (const p of allProds) {
          const junctionSubs = junctionMap[p.id];
          let subsSet;
          if (junctionSubs && junctionSubs.size > 0) {
            subsSet = new Set(junctionSubs);
          } else {
            subsSet = new Set();
            if (p.subject_id) subsSet.add(p.subject_id);
            if (Array.isArray(p.extra_subject_ids)) {
              p.extra_subject_ids.forEach(id => subsSet.add(id));
            }
          }
          p.assigned_subject_ids = Array.from(subsSet);
        }

        // Strictly keep only products that are universal OR explicitly assigned to this subject
        allProds = allProds.filter(p => {
          const isUniv = Boolean(
            p.is_universal === true ||
            p.discount_label_en === 'universal' ||
            p.all_subjects === true ||
            p.all_years === true ||
            CANONICAL_UNIVERSAL_IDS.has(p.id)
          );
          if (isUniv) return true;
          return Array.isArray(p.assigned_subject_ids) && p.assigned_subject_ids.includes(subject.id);
        });

        const bundle = { subject, year: year || null, prods: allProds };
        cacheSet(CACHE_KEY, bundle, 60);
        applyData(bundle);
      } catch (err) {
        console.warn('SubjectPage fetch fallback:', err);
        const fallbackSub = DEFAULT_SUBJECTS.find(s => s.slug === slug || s.slug === lookupSlug) || DEFAULT_SUBJECTS[0];
        const fallbackYear = DEFAULT_YEARS.find(y => String(y.id) === String(fallbackSub.year_id)) || DEFAULT_YEARS[0];
        const CANONICAL_UNIVERSAL_IDS = new Set([
          '99000000-0000-0000-0000-000000000001',
          '99000000-0000-0000-0000-000000000002',
          '33000000-0000-0000-0000-000000000103',
          '33000000-0000-0000-0000-000000000104',
          '33000000-0000-0000-0000-000000000109'
        ]);
        const fallbackProds = defaultProductsList.filter(p => 
          p.subject_id === fallbackSub.id || 
          p.all_subjects === true || 
          p.discount_label_en === 'universal' ||
          CANONICAL_UNIVERSAL_IDS.has(p.id) ||
          (Array.isArray(p.extra_subject_ids) && p.extra_subject_ids.includes(fallbackSub.id))
        );
        for (const p of fallbackProds) {
          const subsSet = new Set();
          if (p.subject_id) subsSet.add(p.subject_id);
          if (Array.isArray(p.extra_subject_ids)) p.extra_subject_ids.forEach(id => subsSet.add(id));
          p.assigned_subject_ids = Array.from(subsSet);
        }
        applyData({ subject: fallbackSub, year: fallbackYear, prods: fallbackProds });
      } finally {
        setLoading(false);
      }
    };

    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      applyData(cached);
      setLoading(false);
      fetchAndCache(false);
    } else {
      fetchAndCache(true);
    }
  }, [slug, lookupSlug]);

  // Real-time filtering and sorting calculation
  const filteredList = useMemo(() => {
    let list = [...products];

    // Live search filter
    if (inPageSearch.trim()) {
      const q = inPageSearch.trim().toLowerCase();
      list = list.filter(p =>
        (p.name_en && p.name_en.toLowerCase().includes(q)) ||
        (p.name_ar && p.name_ar.toLowerCase().includes(q))
      );
    }

    // Dynamic price slider filter
    list = list.filter(p => Number(p.price) <= maxPrice);

    // Stock availability filter
    if (selectedStock !== 'all') {
      if (selectedStock === 'discount') {
        list = list.filter(p => p.compare_at_price && p.compare_at_price > p.price);
      } else if (selectedStock === 'available') {
        list = list.filter(p => p.availability === 'available');
      } else {
        list = list.filter(p => p.availability === selectedStock);
      }
    }

    // Sorting
    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return list;
  }, [products, inPageSearch, maxPrice, selectedStock, sortBy]);

  // Categorize filtered products into 3 distinct sections:
  // 1. Subject-Specific Tools & Materials (الأدوات والمواد الخاصة بالمادة)
  // 2. Shared Instruments & Materials (أدوات مشتركة بين المواد)
  // 3. Universal Dental Supplies across all years (مستلزمات مشتركة بين جميع السنوات)
  const categorizedSections = useMemo(() => {
    const CANONICAL_UNIVERSAL_IDS = new Set([
      '99000000-0000-0000-0000-000000000001',
      '99000000-0000-0000-0000-000000000002',
      '33000000-0000-0000-0000-000000000103',
      '33000000-0000-0000-0000-000000000104',
      '33000000-0000-0000-0000-000000000109'
    ]);

    const specific = [];
    const shared = [];
    const universal = [];

    for (const p of filteredList) {
      const isUniv = Boolean(
        p.is_universal === true ||
        p.discount_label_en === 'universal' ||
        p.all_subjects === true ||
        p.all_years === true ||
        CANONICAL_UNIVERSAL_IDS.has(p.id)
      );

      if (isUniv) {
        universal.push(p);
      } else if (
        (Array.isArray(p.assigned_subject_ids) && p.assigned_subject_ids.length > 1) ||
        (Array.isArray(p.extra_subject_ids) && p.extra_subject_ids.length > 0)
      ) {
        shared.push(p);
      } else {
        specific.push(p);
      }
    }

    return { specific, shared, universal };
  }, [filteredList]);

  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;

  const filterOptions = [
    { key: 'all', label_ar: 'الكل', label_en: 'All' },
    { key: 'available', label_ar: 'متوفر', label_en: 'Available' },
    { key: 'coming_soon', label_ar: 'قريباً', label_en: 'Coming Soon' },
    { key: 'discount', label_ar: 'عليه خصم', label_en: 'On Sale' },
  ];

  const sortOptions = [
    { key: 'recent', label_ar: 'الأحدث', label_en: 'Newest' },
    { key: 'popular', label_ar: 'الأكثر طلباً', label_en: 'Most Popular' },
    { key: 'price_asc', label_ar: 'السعر: من الأقل للأعلى', label_en: 'Price: Low to High' },
    { key: 'price_desc', label_ar: 'السعر: من الأعلى للأقل', label_en: 'Price: High to Low' },
  ];

  const resetAllFilters = () => {
    setInPageSearch('');
    setMaxPrice(dynamicMaxPrice);
    setSelectedStock('all');
    setSortBy('recent');
  };

  const isFiltered = inPageSearch.trim() !== '' || maxPrice < dynamicMaxPrice || selectedStock !== 'all' || sortBy !== 'recent';

  // Shared Sidebar / Drawer Content
  const FilterControls = () => (
    <div className="filter-controls-inner">
      <div className="filter-header-title">
        <SlidersHorizontal size={16} />
        <span>{lang === 'ar' ? 'التصفية والترتيب' : 'Filter & Sort'}</span>
      </div>

      {/* Sorting */}
      <div className="filter-group">
        <label className="filter-group-label">{lang === 'ar' ? 'الترتيب حسب' : 'Sort By'}</label>
        <div className="filter-options-stack">
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`filter-pill-btn ${sortBy === opt.key ? 'active' : ''}`}
              onClick={() => setSortBy(opt.key)}
            >
              <span className="filter-radio-dot" />
              <span>{lang === 'ar' ? opt.label_ar : opt.label_en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="filter-group">
        <label className="filter-group-label">{lang === 'ar' ? 'حالة التوفر' : 'Availability'}</label>
        <div className="filter-options-stack">
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`filter-pill-btn ${selectedStock === opt.key ? 'active' : ''}`}
              onClick={() => setSelectedStock(opt.key)}
            >
              <span className="filter-radio-dot" />
              <span>{lang === 'ar' ? opt.label_ar : opt.label_en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Slider */}
      <div className="filter-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label className="filter-group-label" style={{ margin: 0 }}>{lang === 'ar' ? 'أعلى سعر' : 'Max Price'}</label>
          <span style={{ fontWeight: 800, color: '#684835', fontSize: '0.88rem' }}>
            {maxPrice} {lang === 'ar' ? 'د.ل' : 'LYD'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={dynamicMaxPrice}
          step="1"
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="subject-price-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8C7E72', marginTop: '0.35rem' }}>
          <span>0 د.ل</span>
          <span>{dynamicMaxPrice} د.ل</span>
        </div>
      </div>

      {/* Reset button */}
      {isFiltered && (
        <button
          type="button"
          onClick={resetAllFilters}
          className="filter-reset-btn"
        >
          <RotateCcw size={14} />
          <span>{lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="subject-listing-page" style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          <div className="skeleton" style={{ height: '30px', width: '220px', borderRadius: '8px', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: '140px', borderRadius: '18px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const yearDisplayName = lang === 'ar'
    ? (yearData?.name_ar || 'السنة الدراسية')
    : (yearData?.name_en || 'Academic Year');

  const subjectTitleAr = subjectData?.name_ar || 'المادة الدراسية';
  const subjectTitleEn = subjectData?.name_en || 'Subject Tools';

  return (
    <div className="subject-listing-page">
      <div className="container" style={{ maxWidth: '1180px', paddingInline: '1.25rem' }}>

        {/* ── 1. DYNAMIC BREADCRUMB (Calm, RTL-Balanced) ── */}
        <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr', marginTop: '1.25rem' }}>
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to={`/year/${yearData?.slug || '1st-year'}`} className="breadcrumb-link">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to={`/year/${yearData?.slug || '1st-year'}`} className="breadcrumb-link" style={{ color: '#8C7E72' }}>
            {yearDisplayName}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current" style={{ direction: 'ltr', display: 'inline-block' }}>
            {subjectTitleEn}
          </span>
        </nav>

        {/* ── 2. PAGE HEADER SECTION ── */}
        <header className="subject-header-card" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <div className="subject-header-info">
            {/* Arabic Name (Large & Bold) */}
            <h1 className="subject-title-arabic">{subjectTitleAr}</h1>

            {/* English Name */}
            <h2 className="subject-title-english">{subjectTitleEn}</h2>

            {/* Subtitle */}
            <p className="subject-header-subtitle">
              {lang === 'ar'
                ? 'الأدوات والمواد المطلوبة للمادة'
                : `Required tools and supplies for ${subjectTitleEn}`}
            </p>
          </div>

          <div className="subject-header-meta">
            {/* Dynamic Product Count */}
            <div className="subject-count-pill">
              <Package size={15} />
              <span>
                {filteredList.length}{' '}
                {lang === 'ar' ? 'منتج' : (filteredList.length === 1 ? 'product' : 'products')}
              </span>
            </div>
          </div>
        </header>

        {/* ── 3. IN-PAGE LIVE SEARCH & MOBILE CONTROLS BAR ── */}
        <div className="subject-tools-toolbar" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {/* In-page live search */}
          <div className="subject-search-container">
            <Search size={16} className="subject-search-icon" />
            <input
              type="text"
              value={inPageSearch}
              onChange={(e) => setInPageSearch(e.target.value)}
              placeholder={lang === 'ar' ? `ابحث في أدوات ${subjectTitleEn}... (مثال: Wax, Carver, Spatula)` : `Search in ${subjectTitleEn}...`}
              className="subject-search-input"
            />
            {inPageSearch && (
              <button
                type="button"
                onClick={() => setInPageSearch('')}
                className="subject-search-clear"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="subject-mobile-filter-trigger"
          >
            <SlidersHorizontal size={16} />
            <span>{lang === 'ar' ? 'التصفية والترتيب' : 'Filter & Sort'}</span>
            {isFiltered && <span className="filter-active-indicator" />}
          </button>
        </div>

        {/* ── 4. MAIN BROWSE LAYOUT (SIDEBAR + GRID) ── */}
        <div className="subject-browse-layout" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

          {/* Desktop Filter Sidebar (RTL start) */}
          <aside className="subject-desktop-sidebar">
            <FilterControls />
          </aside>

          {/* Product Grid Area */}
          <main className="subject-products-container">
            {filteredList.length === 0 ? (
              <div className="subject-empty-state">
                {products.length === 0 ? (
                  <>
                    <Package size={52} strokeWidth={1.5} className="subject-empty-icon" />
                    <h3 className="subject-empty-title">
                      {lang === 'ar' ? 'لا توجد أدوات متاحة حالياً لهذه المادة.' : 'No tools available for this subject currently.'}
                    </h3>
                    <p className="subject-empty-desc">
                      {lang === 'ar' ? 'سيتم تزويد وفهرسة كافة الأدوات المطلوبة لهذه المادة قريباً.' : 'All required tools for this subject will be stocked soon.'}
                    </p>
                    <Link to={`/year/${yearData?.slug || '1st-year'}`} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                      {lang === 'ar' ? 'العودة للمواد' : 'Back to Subjects'}
                    </Link>
                  </>
                ) : (
                  <>
                    <Search size={44} strokeWidth={1.5} className="subject-empty-icon" />
                    <h3 className="subject-empty-title">
                      {lang === 'ar' ? 'لا توجد أدوات تطابق البحث أو الفلاتر المحددة' : 'No tools match your search or filters'}
                    </h3>
                    <p className="subject-empty-desc">
                      {lang === 'ar' ? 'جرب البحث باسم أداة أخرى أو قم بإعادة ضبط نطاق السعر والتوفر.' : 'Try searching for another tool or reset price and stock filters.'}
                    </p>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="btn btn-outline"
                      style={{ marginTop: '1rem' }}
                    >
                      {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="subject-sections-stack">
                {/* 1. القسم الأول: الأدوات والمواد الخاصة بالمادة */}
                {categorizedSections.specific.length > 0 && (
                  <section className="subject-section-block" aria-label="Specific Tools">
                    <div className="subject-section-header">
                      <div className="subject-section-title-wrap">
                        <span className="subject-section-pill specific">
                          {lang === 'ar' ? 'خاص بالمادة' : 'Subject Specific'}
                        </span>
                        <h2 className="subject-section-title">
                          {lang === 'ar' ? 'الأدوات والمواد الخاصة بالمادة' : 'Subject-Specific Tools & Materials'}
                        </h2>
                      </div>
                      <span className="subject-section-count">
                        {categorizedSections.specific.length} {lang === 'ar' ? 'أداة' : 'tools'}
                      </span>
                    </div>
                    <div className="subject-products-grid">
                      {categorizedSections.specific.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. القسم الثاني: الأدوات المشتركة بين المواد */}
                {categorizedSections.shared.length > 0 && (
                  <section className={`subject-section-block ${categorizedSections.specific.length > 0 ? 'subject-section-divider' : ''}`} aria-label="Shared Instruments">
                    <div className="subject-section-header">
                      <div className="subject-section-title-wrap">
                        <span className="subject-section-pill shared">
                          <Layers size={13} />
                          {lang === 'ar' ? 'مشترك بين المواد' : 'Shared Tools'}
                        </span>
                        <h2 className="subject-section-title">
                          {lang === 'ar' ? 'أدوات مشتركة بين المواد' : 'Shared Instruments & Materials'}
                        </h2>
                      </div>
                      <span className="subject-section-count">
                        {categorizedSections.shared.length} {lang === 'ar' ? 'أداة' : 'tools'}
                      </span>
                    </div>
                    <p className="subject-section-subtitle">
                      {lang === 'ar'
                        ? 'أدوات مطلوبة لهذه المادة وتُستخدم أيضاً في مادة دراسية أخرى أو أكثر.'
                        : 'Instruments required for this subject and also utilized across other courses.'}
                    </p>
                    <div className="subject-products-grid">
                      {categorizedSections.shared.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. القسم الثالث: المستلزمات المشتركة بين جميع السنوات */}
                {categorizedSections.universal.length > 0 && (
                  <section className={`subject-section-block ${(categorizedSections.specific.length > 0 || categorizedSections.shared.length > 0) ? 'subject-section-divider' : ''}`} aria-label="Universal Supplies">
                    <div className="subject-section-header">
                      <div className="subject-section-title-wrap">
                        <span className="subject-section-pill universal">
                          <Sparkles size={13} />
                          {lang === 'ar' ? 'مستلزمات عامة' : 'Universal'}
                        </span>
                        <h2 className="subject-section-title">
                          {lang === 'ar' ? 'مستلزمات مشتركة بين جميع السنوات' : 'Universal Dental Supplies'}
                        </h2>
                      </div>
                      <span className="subject-section-count">
                        {categorizedSections.universal.length} {lang === 'ar' ? 'مستلزم' : 'supplies'}
                      </span>
                    </div>
                    <p className="subject-section-subtitle">
                      {lang === 'ar'
                        ? 'المستلزمات والوقائيات الطبية الأساسية المشتركة في مختلف السنوات والعيادات السنية.'
                        : 'Essential clinical consumables and PPE used across all academic years.'}
                    </p>
                    <div className="subject-products-grid">
                      {categorizedSections.universal.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>

        </div>

      </div>

      {/* ── 5. MOBILE FILTERS DRAWER / BOTTOM SHEET ── */}
      {showMobileFilters && (
        <div className="mobile-filter-drawer-portal">
          <div
            className="mobile-filter-backdrop"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="mobile-filter-panel" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <div className="mobile-filter-topbar">
              <h3 className="mobile-filter-title">
                {lang === 'ar' ? 'التصفية والترتيب' : 'Filter & Sort'}
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="mobile-filter-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-filter-scroll-body">
              <FilterControls />
            </div>

            <div className="mobile-filter-footer">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800 }}
              >
                {lang === 'ar' ? `عرض النتائج (${filteredList.length})` : `Show Results (${filteredList.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
