import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import ProductCard from '../components/ProductCard';
import {
  Search, Sparkles, Layers, Package, ChevronLeft, ChevronRight,
  X, SlidersHorizontal, RotateCcw
} from 'lucide-react';

const SEARCH_COLUMNS = 'id, name_ar, name_en, description_ar, description_en, details_ar, details_en, price, compare_at_price, image_url, availability, stock_quantity, subject_id, year_id, is_bundle, discount_label_ar, discount_label_en, shared_inventory_product_id, unit_multiplier, created_at';

export const SearchPage = ({ categoryMode = null }) => {
  const { lang, isRtl } = useLanguage();
  const location = useLocation();
  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Unified in-page search, filter & sort states (matching SubjectPage)
  const [inPageSearch, setInPageSearch] = useState('');
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(250);
  const [maxPrice, setMaxPrice] = useState(250);
  const [selectedStock, setSelectedStock] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get('q') || '';
    setQuery(q);
    setInPageSearch('');
    setSelectedStock('all');
    setSortBy('recent');

    const performFetch = async () => {
      if (!categoryMode && !q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let data = cacheGet('products:search_catalog_v2');
        if (!data) {
          const res = await supabase
            .from('products')
            .select(SEARCH_COLUMNS)
            .eq('is_active', true)
            .eq('is_archived', false);
          data = res.data;
          if (data && data.length > 0) {
            cacheSet('products:search_catalog_v2', data, 120);
          }
        }

        if (data) {
          let matched = [];
          if (categoryMode === 'offers') {
            const offersList = data.filter((p) => {
              const hasDiscount = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
              const isBundle = Boolean(p.is_bundle) || (p.name_en && p.name_en.toLowerCase().includes('bundle')) || (p.name_ar && p.name_ar.includes('بكج'));
              return hasDiscount || isBundle;
            });
            const seen = new Set();
            matched = offersList.filter((p) => {
              if (!p || !p.id || seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
          } else if (categoryMode === 'other-supplies') {
            // Strictly include products enabled for "Other Supplies" ('other_supplies' or 'universal')
            // Removing a product from Other Supplies in Admin sets discount_label_en = null without deleting the product
            const suppliesList = data.filter((p) => {
              return (
                p.discount_label_en === 'other_supplies' ||
                p.discount_label_en === 'universal'
              );
            });
            const seen = new Set();
            matched = suppliesList.filter((p) => {
              if (!p || !p.id || seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
          } else {
            const keyword = q.toLowerCase();
            matched = data.filter((p) => (
              (p.name_ar && p.name_ar.toLowerCase().includes(keyword)) ||
              (p.name_en && p.name_en.toLowerCase().includes(keyword)) ||
              (p.description_ar && p.description_ar.toLowerCase().includes(keyword)) ||
              (p.description_en && p.description_en.toLowerCase().includes(keyword)) ||
              (p.details_ar && p.details_ar.toLowerCase().includes(keyword)) ||
              (p.details_en && p.details_en.toLowerCase().includes(keyword))
            ));
          }

          setResults(matched);
          if (matched.length > 0) {
            const highest = Math.ceil(Math.max(...matched.map(p => Number(p.price) || 0), 20));
            setDynamicMaxPrice(highest);
            setMaxPrice(highest);
          }
        }
      } catch (err) {
        console.error('Error matching catalog items', err);
      } finally {
        setLoading(false);
      }
    };

    performFetch();
  }, [location.search, categoryMode]);

  const filteredList = useMemo(() => {
    let list = [...results];

    if (inPageSearch.trim()) {
      const kw = inPageSearch.trim().toLowerCase();
      list = list.filter((p) =>
        (p.name_ar && p.name_ar.toLowerCase().includes(kw)) ||
        (p.name_en && p.name_en.toLowerCase().includes(kw)) ||
        (p.description_ar && p.description_ar.toLowerCase().includes(kw)) ||
        (p.description_en && p.description_en.toLowerCase().includes(kw)) ||
        (p.details_ar && p.details_ar.toLowerCase().includes(kw)) ||
        (p.details_en && p.details_en.toLowerCase().includes(kw))
      );
    }

    list = list.filter(p => Number(p.price) <= maxPrice);

    if (selectedStock !== 'all') {
      if (selectedStock === 'discount') {
        list = list.filter(p => p.compare_at_price && p.compare_at_price > p.price);
      } else if (selectedStock === 'available') {
        list = list.filter(p => p.availability === 'available' || p.availability === 'by_order' || !p.availability || p.availability === 'unavailable');
      } else {
        list = list.filter(p => p.availability === selectedStock);
      }
    }

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
  }, [results, inPageSearch, maxPrice, selectedStock, sortBy]);

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
          step="0.5"
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="subject-price-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8C7E72', marginTop: '0.35rem' }}>
          <span>0 د.ل</span>
          <span>{dynamicMaxPrice} د.ل</span>
        </div>
      </div>

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

  const getHeaderInfo = () => {
    if (categoryMode === 'offers') {
      return {
        titleAr: 'عروض خاصة وبكجات التوفير',
        titleEn: 'Special Offers & Bundles',
        subtitle: lang === 'ar'
          ? 'بكجات متكاملة وعروض مخفضة لطلبة طب الأسنان.'
          : 'Complete student bundles and discounted dental instruments.',
        searchPlaceholder: lang === 'ar' ? 'ابحث في العروض الخاصة...' : 'Search in Special Offers...'
      };
    }
    if (categoryMode === 'other-supplies') {
      return {
        titleAr: 'مستلزمات أخرى',
        titleEn: 'Other Supplies',
        subtitle: lang === 'ar'
          ? 'مستلزمات يحتاجها طلبة طب الأسنان في مختلف السنوات.'
          : 'Supplies needed by dental students across different years.',
        searchPlaceholder: lang === 'ar' ? 'ابحث في مستلزمات أخرى... (مثال: Mask, Gloves, Cover Sheet)' : 'Search in Other Supplies...'
      };
    }
    return {
      titleAr: lang === 'ar' ? `نتائج البحث عن: "${query}"` : `Search results for: "${query}"`,
      titleEn: '',
      subtitle: lang === 'ar' ? `تم العثور على ${filteredList.length} نتيجة مطابقة.` : `Found ${filteredList.length} matching products.`,
      searchPlaceholder: lang === 'ar' ? 'صفِّ نتائج البحث...' : 'Filter search results...'
    };
  };

  const headerInfo = getHeaderInfo();

  if (loading) {
    return (
      <div className="subject-listing-page" style={{ padding: '2rem 0 4rem' }}>
        <div className="container" style={{ maxWidth: '1180px', paddingInline: '1.25rem' }}>
          <div className="skeleton" style={{ height: '30px', width: '220px', borderRadius: '8px', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: '140px', borderRadius: '18px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subject-listing-page">
      <div className="container" style={{ maxWidth: '1180px', paddingInline: '1.25rem' }}>

        {/* ── 1. DYNAMIC BREADCRUMB (Matches SubjectPage) ── */}
        <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr', marginTop: '1.25rem' }}>
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to="/study-tools" className="breadcrumb-link">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {lang === 'ar' ? headerInfo.titleAr : (headerInfo.titleEn || headerInfo.titleAr)}
          </span>
        </nav>

        {/* ── 2. PAGE HEADER SECTION (Matches SubjectPage) ── */}
        <header className="subject-header-card" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <div className="subject-header-info">
            <h1 className="subject-title-arabic">{headerInfo.titleAr}</h1>
            {headerInfo.titleEn && (
              <h2 className="subject-title-english">{headerInfo.titleEn}</h2>
            )}
            <p className="subject-header-subtitle">{headerInfo.subtitle}</p>
          </div>

          <div className="subject-header-meta">
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
          <div className="subject-search-container">
            <Search size={16} className="subject-search-icon" />
            <input
              type="text"
              value={inPageSearch}
              onChange={(e) => setInPageSearch(e.target.value)}
              placeholder={headerInfo.searchPlaceholder}
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

        {/* ── 4. MAIN BROWSE LAYOUT (SIDEBAR + DIRECT UNIFIED GRID) ── */}
        <div className="subject-browse-layout" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <aside className="subject-desktop-sidebar">
            <FilterControls />
          </aside>

          <main className="subject-products-container">
            {filteredList.length === 0 ? (
              <div className="subject-empty-state">
                <Search size={44} strokeWidth={1.5} className="subject-empty-icon" />
                <h3 className="subject-empty-title">
                  {results.length === 0
                    ? (lang === 'ar' ? 'لا توجد منتجات مضافة في هذا القسم حالياً.' : 'No products in this section currently.')
                    : (lang === 'ar' ? 'لا توجد منتجات تطابق البحث أو الفلاتر المحددة' : 'No products match your search or filters')}
                </h3>
                <p className="subject-empty-desc">
                  {lang === 'ar'
                    ? 'جرب البحث بكلمات أخرى أو تصفح أدوات الدراسة حسب السنة الدراسية.'
                    : 'Try searching with different keywords or browse study tools by academic year.'}
                </p>
                {isFiltered ? (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="btn btn-outline"
                    style={{ marginTop: '1rem' }}
                  >
                    {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                  </button>
                ) : (
                  <Link to="/study-tools" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                    {lang === 'ar' ? 'العودة لأدوات الدراسة' : 'Back to Study Tools'}
                  </Link>
                )}
              </div>
            ) : (
              <div className="subject-products-grid">
                {filteredList.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── 5. MOBILE FILTERS DRAWER ── */}
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
                <X size={18} />
              </button>
            </div>
            <div className="mobile-filter-body">
              <FilterControls />
            </div>
            <div className="mobile-filter-footer">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.85rem' }}
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

export default SearchPage;
