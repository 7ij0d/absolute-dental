import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import fixedProsthoFaded from '../assets/images/fixed-prosthodontics-faded.png';
import operativeFaded from '../assets/images/operative-dentistry-faded.png';
import removableFaded from '../assets/images/removable-prosthodontics-faded.png';
import anatomyFaded from '../assets/images/dental-anatomy-faded.png';
import materialsFaded from '../assets/images/dental-materials-faded.png';
import preventiveFaded from '../assets/images/preventive-dentistry-faded.png';
import studyToolsFaded from '../assets/images/study-tools-faded.png';

const getSubjectArtwork = (slug) => {
  const s = String(slug || '').toLowerCase();
  if (s.includes('fixed')) return fixedProsthoFaded;
  if (s.includes('restorative') || s.includes('operative') || s.includes('conservative')) return operativeFaded;
  if (s.includes('removable')) return removableFaded;
  if (s.includes('anatomy')) return anatomyFaded;
  if (s.includes('materials')) return materialsFaded;
  if (s.includes('preventive')) return preventiveFaded;
  return studyToolsFaded;
};

import { cacheGet, cacheSet } from '../cache';
import defaultProductsList from '../defaultProducts.json';
import { groupProductsList } from '../utils/burGroupingEngine';
import { getSubjectProductGroups } from '../utils/subjectGroupEngine';
import {
  SlidersHorizontal, ChevronLeft, ChevronRight,
  Package, Search, X, RotateCcw, Layers, Sparkles,
  Disc, Wrench, Flame, Droplets, ShieldCheck, Box
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
    const CACHE_KEY = `subject_v32:${slug}`;

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

        // 4. Merge Universal Supplies for this subject (only products marked 'universal', not 'other_supplies' only)
        const junctionIdSet = new Set((junctionLinks || []).map(r => r.product_id));

        if (Array.isArray(universalProds)) {
          for (const up of universalProds) {
            const isRelevant =
              up.discount_label_en === 'universal' ||
              up.is_universal === true ||
              up.all_subjects === true ||
              up.all_years === true ||
              junctionIdSet.has(up.id) ||
              up.subject_id === subject.id;
            if (isRelevant) {
              allProds.push(up);
            }
          }
        }

        // 5. Ensure seeded default products for this subject are merged if not already present in DB
        const existingIds = new Set(allProds.map(p => p.id));
        const defaultsForSub = defaultProductsList.filter(p =>
          p.subject_id === subject.id ||
          p.all_subjects === true ||
          p.discount_label_en === 'universal' ||
          (Array.isArray(p.extra_subject_ids) && p.extra_subject_ids.includes(subject.id))
        );
        // Check if any of these default IDs exist in DB with updated relationships before falling back
        const missingDefaultIds = defaultsForSub.map(d => d.id).filter(id => !existingIds.has(id));
        let dbOverriddenIds = new Set();
        if (missingDefaultIds.length > 0) {
          const { data: dbExistingRows } = await supabase
            .from('products')
            .select('id')
            .in('id', missingDefaultIds);
          if (dbExistingRows) {
            dbOverriddenIds = new Set(dbExistingRows.map(r => r.id));
          }
        }
        for (const dp of defaultsForSub) {
          if (!existingIds.has(dp.id) && !dbOverriddenIds.has(dp.id)) {
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
            p.all_years === true
          );
          if (isUniv) return true;
          return (
            p.subject_id === subject.id ||
            junctionIdSet.has(p.id) ||
            (Array.isArray(p.assigned_subject_ids) && p.assigned_subject_ids.includes(subject.id))
          );
        });

        const bundle = { subject, year: year || null, prods: allProds };
        cacheSet(CACHE_KEY, bundle, 60);
        applyData(bundle);
      } catch (err) {
        console.warn('SubjectPage fetch fallback:', err);
        const fallbackSub = DEFAULT_SUBJECTS.find(s => s.slug === slug || s.slug === lookupSlug) || DEFAULT_SUBJECTS[0];
        const fallbackYear = DEFAULT_YEARS.find(y => String(y.id) === String(fallbackSub.year_id)) || DEFAULT_YEARS[0];
        const fallbackProds = defaultProductsList.filter(p =>
          p.subject_id === fallbackSub.id ||
          p.all_subjects === true ||
          p.discount_label_en === 'universal' ||
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

  // Real-time filtering and sorting calculation (direct unified product list)
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
        list = list.filter(p => p.availability === 'available' || p.availability === 'by_order' || !p.availability || p.availability === 'unavailable');
      } else {
        list = list.filter(p => p.availability === selectedStock);
      }
    }

    // Sorting (prioritizing direct subject tools before universal consumables when in default view)
    if (sortBy === 'recent') {
      list.sort((a, b) => {
        const aUniv = a.discount_label_en === 'universal' ? 1 : 0;
        const bUniv = b.discount_label_en === 'universal' ? 1 : 0;
        if (aUniv !== bUniv) return aUniv - bUniv;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return groupProductsList(list);
  }, [products, inPageSearch, maxPrice, selectedStock, sortBy]);

  const productGroups = useMemo(() => {
    return getSubjectProductGroups(slug || lookupSlug, filteredList);
  }, [slug, lookupSlug, filteredList]);

  const renderGroupIcon = (iconName) => {
    switch (iconName) {
      case 'Disc': return <Disc size={18} strokeWidth={2.4} />;
      case 'Wrench': return <Wrench size={18} strokeWidth={2.4} />;
      case 'Search': return <Search size={18} strokeWidth={2.4} />;
      case 'Sparkles': return <Sparkles size={18} strokeWidth={2.4} />;
      case 'Flame': return <Flame size={18} strokeWidth={2.4} />;
      case 'Droplets': return <Droplets size={18} strokeWidth={2.4} />;
      case 'ShieldCheck': return <ShieldCheck size={18} strokeWidth={2.4} />;
      case 'Layers': return <Layers size={18} strokeWidth={2.4} />;
      case 'Package': return <Package size={18} strokeWidth={2.4} />;
      default: return <Box size={18} strokeWidth={2.4} />;
    }
  };

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
          <Link to="/study-tools" className="breadcrumb-link">
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

        {/* ── 2. SECTION REFERENCE BANNER ── */}
        <section
          className="section-reference-banner animate-fade-in"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '124px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #F3ECE2 0%, #EBE1D3 100%)',
            border: '1px solid rgba(138, 108, 82, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflow: 'hidden',
            marginBottom: '1.75rem',
            boxShadow: '0 4px 18px rgba(36, 23, 15, 0.04)',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {/* Banner Text & Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.1rem',
              padding: '1.35rem 1.75rem',
              zIndex: 2,
              flex: '1 1 auto'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(180, 155, 130, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4A3525',
                flexShrink: 0
              }}
            >
              <Package size={26} strokeWidth={2} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "'Cairo', sans-serif",
                    fontSize: 'clamp(1.4rem, 2.8vw, 1.95rem)',
                    fontWeight: 900,
                    color: '#2C1A11',
                    lineHeight: 1.2
                  }}
                >
                  {subjectTitleAr}
                </h1>
                <span
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#7A6556'
                  }}
                >
                  ({subjectTitleEn})
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: 'clamp(0.82rem, 1.6vw, 0.94rem)',
                  fontWeight: 600,
                  color: '#6B5344',
                  lineHeight: 1.45
                }}
              >
                {lang === 'ar'
                  ? (subjectData?.description_ar || 'الأدوات والمستلزمات الدراسية المخصصة للمادة')
                  : (subjectData?.description_en || 'Required tools and supplies for this subject')}
              </p>
            </div>
          </div>

          {/* Banner Artwork on Left */}
          <div
            className="section-banner-art-wrap"
            style={{
              position: 'relative',
              height: '100%',
              minHeight: '124px',
              width: '38%',
              maxWidth: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <img
              src={getSubjectArtwork(slug || lookupSlug)}
              alt=""
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: isRtl ? 'left center' : 'right center',
                maskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>
        </section>

        {/* ── 3. PRODUCT COUNT HEADER ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          <span
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#3E271D'
            }}
          >
            {filteredList.length} {lang === 'ar' ? 'منتج' : 'products'}
          </span>
        </div>

        {/* ── 4. FULL-WIDTH PRODUCT GROUPS (NO SIDEBAR / NO FILTERS) ── */}
        <main
          className="subject-products-fullwidth"
          style={{
            width: '100%',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {filteredList.length === 0 || productGroups.length === 0 ? (
            <div className="subject-empty-state">
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
            </div>
          ) : (
            <div className="subject-grouped-stack">
              {productGroups.map((group) => (
                <section key={group.id} className="subject-group-section">
                  {/* Visual Semantic Header */}
                  <div className="subject-group-header">
                    <div className="subject-group-icon-badge">
                      {renderGroupIcon(group.icon)}
                    </div>
                    <div className="subject-group-titles">
                      <h2 className="subject-group-title-en">{group.titleEn}</h2>
                      <span className="subject-group-title-ar">{group.titleAr}</span>
                    </div>
                    <span className="subject-group-pill">
                      {group.items.length} {lang === 'ar' ? 'منتج' : 'items'}
                    </span>
                  </div>

                  {/* Products Grid for this Group */}
                  <div className="subject-products-grid">
                    {group.items.map((product) => (
                      <ProductCard key={product.id} product={product} subjectContext={{ subjectSlug: subjectData?.slug || slug, yearSlug: yearData?.slug }} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default SubjectPage;
