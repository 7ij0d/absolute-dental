import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { cacheGet, cacheSet } from '../cache';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Package, X } from 'lucide-react';

export const SubjectPage = () => {
  const { slug } = useParams();
  const { lang, t, isRtl } = useLanguage();

  const [subjectData, setSubjectData] = useState(null);
  const [yearData, setYearData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedStock, setSelectedStock] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const CACHE_KEY = `subject:${slug}`;

    const applyData = ({ subject, year, prods }) => {
      setSubjectData(subject);
      setYearData(year);
      setProducts(prods || []);
      if (prods && prods.length > 0) {
        setMaxPrice(Math.ceil(Math.max(...prods.map(p => p.price))));
      }
    };

    const fetchAndCache = async (showLoader) => {
      if (showLoader) setLoading(true);
      try {
        const { data: subject } = await supabase
          .from('subjects').select('*').eq('slug', slug).single();
        if (!subject) { setLoading(false); return; }

        // Fetch year + primary products + junction products IN PARALLEL
        const [{ data: year }, { data: primaryProds }, { data: junctionLinks }] = await Promise.all([
          supabase.from('years').select('*').eq('id', subject.year_id).single(),
          // Products where subject_id = this subject (primary)
          supabase.from('products').select('*')
            .eq('is_active', true).eq('is_archived', false)
            .eq('subject_id', subject.id),
          // Products linked via product_subjects junction table
          supabase.from('product_subjects').select('product_id').eq('subject_id', subject.id)
        ]);

        // Get extra product IDs from junction table (exclude already fetched)
        const primaryIds = new Set((primaryProds || []).map(p => p.id));
        const extraIds = (junctionLinks || [])
          .map(r => r.product_id)
          .filter(id => !primaryIds.has(id));

        // Fetch extra products if any
        let extraProds = [];
        if (extraIds.length > 0) {
          const { data: ep } = await supabase.from('products').select('*')
            .in('id', extraIds)
            .eq('is_active', true).eq('is_archived', false);
          extraProds = ep || [];
        }

        // Merge + deduplicate
        const allProds = [...(primaryProds || []), ...extraProds];

        const bundle = { subject, year: year || null, prods: allProds };
        cacheSet(CACHE_KEY, bundle, 60); // 60 sec TTL — products update fast
        applyData(bundle);
      } catch (err) {
        console.error('SubjectPage fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    // Show cached data instantly, refresh silently in background
    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      applyData(cached);
      setLoading(false);
      fetchAndCache(false); // background refresh
    } else {
      fetchAndCache(true);
    }
  }, [slug]);


  const getFiltered = () => {
    let list = [...products].filter(p => p.price <= maxPrice);
    if (selectedStock !== 'all') {
      if (selectedStock === 'discount') list = list.filter(p => p.compare_at_price !== null);
      else list = list.filter(p => p.availability === selectedStock);
    }
    if (sortBy === 'recent')     list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'price_asc')  list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'popular')    list.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    return list;
  };

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh' }}>
        <div className="skeleton" style={{ height: '180px', borderRadius: 0 }} />
        <div className="container" style={{ padding: '3rem 0' }}>
          <div className="browse-layout">
            <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
            <div className="grid-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subjectData) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>المادة المطلوبة غير موجودة</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          {lang === 'ar' ? 'الرئيسية' : 'Go Home'}
        </Link>
      </div>
    );
  }

  const filteredList = getFiltered();

  const filterOptions = lang === 'ar'
    ? [
        { key: 'all',            label: 'الكل' },
        { key: 'available',      label: 'متوفر' },
        { key: 'limited_quantity', label: 'كمية محدودة' },
        { key: 'coming_soon',   label: 'قريباً' },
        { key: 'discount',       label: 'عليه خصم' },
      ]
    : [
        { key: 'all',            label: 'All' },
        { key: 'available',      label: 'Available' },
        { key: 'limited_quantity', label: 'Limited Qty' },
        { key: 'coming_soon',   label: 'Coming Soon' },
        { key: 'discount',       label: 'On Sale' },
      ];

  const sortOptions = lang === 'ar'
    ? [
        { key: 'recent',     label: 'الأحدث' },
        { key: 'popular',    label: 'الأكثر طلباً' },
        { key: 'price_asc',  label: 'السعر: الأقل' },
        { key: 'price_desc', label: 'السعر: الأعلى' },
      ]
    : [
        { key: 'recent',     label: 'Newest' },
        { key: 'popular',    label: 'Most Popular' },
        { key: 'price_asc',  label: 'Price: Low to High' },
        { key: 'price_desc', label: 'Price: High to Low' },
      ];

  const SidebarContent = () => (
    <>
      <div className="filter-title">
        <SlidersHorizontal size={16} style={{ display: 'inline', marginInlineEnd: '0.4rem' }} />
        {lang === 'ar' ? 'التصفية والترتيب' : 'Filter & Sort'}
      </div>

      {/* Sort */}
      <div className="filter-section">
        <div className="filter-section-label">{lang === 'ar' ? 'الترتيب' : 'Sort By'}</div>
        {sortOptions.map(opt => (
          <div
            key={opt.key}
            className={`filter-option ${sortBy === opt.key ? 'selected' : ''}`}
            onClick={() => setSortBy(opt.key)}
          >
            <span className="filter-dot" />
            {opt.label}
          </div>
        ))}
      </div>

      {/* Availability */}
      <div className="filter-section">
        <div className="filter-section-label">{lang === 'ar' ? 'التوفر' : 'Availability'}</div>
        {filterOptions.map(opt => (
          <div
            key={opt.key}
            className={`filter-option ${selectedStock === opt.key ? 'selected' : ''}`}
            onClick={() => setSelectedStock(opt.key)}
          >
            <span className="filter-dot" />
            {opt.label}
          </div>
        ))}
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <div className="filter-section-label">{lang === 'ar' ? 'نطاق السعر' : 'Price Range'}</div>
        <input
          type="range" min="0" max="1000" step="10"
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--secondary)', marginBottom: '0.5rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>0</span>
          <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
            {maxPrice} {lang === 'ar' ? 'د.ل' : 'LYD'}
          </span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        className="btn btn-outline"
        style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.82rem' }}
        onClick={() => { setMaxPrice(1000); setSelectedStock('all'); setSortBy('recent'); }}
      >
        {lang === 'ar' ? 'إعادة الضبط' : 'Reset Filters'}
      </button>
    </>
  );

  return (
    <div>
      {/* ── SUBJECT HERO ── */}
      <div style={{
        background: 'var(--gradient-dark)',
        padding: '2.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'inherit' }}>{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <ChevronFwd size={13} />
            {yearData && (
              <>
                <Link to={`/year/${yearData.slug}`} style={{ color: 'inherit' }}>
                  {lang === 'ar' ? yearData.name_ar : yearData.name_en}
                </Link>
                <ChevronFwd size={13} />
              </>
            )}
            <span style={{ color: 'var(--purple-300)', fontWeight: 700 }}>
              {lang === 'ar' ? subjectData.name_ar : subjectData.name_en}
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.4rem' }}>
            {lang === 'ar' ? subjectData.name_ar : subjectData.name_en}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {lang === 'ar' ? subjectData.description_ar : subjectData.description_en}
          </p>

          {/* Product Count + Mobile Filter Button */}
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              {filteredList.length} {lang === 'ar' ? 'منتج' : 'products'}
            </span>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem' }}
              onClick={() => setShowMobileFilters(true)}
              id="mobile-filter-btn"
            >
              <SlidersHorizontal size={15} />
              {lang === 'ar' ? 'تصفية وترتيب' : 'Filter & Sort'}
            </button>
          </div>
        </div>
        <style>{`@media(min-width:900px){#mobile-filter-btn{display:none!important;}}`}</style>
      </div>

      {/* ── CONTENT ── */}
      <div className="container" style={{ padding: '2.5rem 0' }}>
        <div className="browse-layout">

          {/* Desktop Sidebar */}
          <aside className="filter-sidebar" style={{ display: 'none' }} id="desktop-sidebar">
            <SidebarContent />
          </aside>
          <style>{`@media(min-width:900px){#desktop-sidebar{display:block!important;}}`}</style>

          {/* Products Grid */}
          <div>
            {filteredList.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '5rem 2rem',
                border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)',
              }}>
                <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  {lang === 'ar' ? 'لا توجد منتجات تطابق هذه الفلاتر' : 'No products match these filters'}
                </p>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: '1rem' }}
                  onClick={() => { setMaxPrice(1000); setSelectedStock('all'); setSortBy('recent'); }}
                >
                  {lang === 'ar' ? 'إعادة الضبط' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              <div className="grid-4">
                {filteredList.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMobileFilters(false)} />
          <div style={{
            position: 'relative',
            width: 300, maxWidth: '90vw', height: '100%',
            background: 'var(--surface-color)',
            padding: '1.5rem',
            overflowY: 'auto',
            marginLeft: isRtl ? 'auto' : 0,
            marginRight: isRtl ? 0 : 'auto',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
                {lang === 'ar' ? 'التصفية والترتيب' : 'Filter & Sort'}
              </h3>
              <button className="icon-btn" onClick={() => setShowMobileFilters(false)}>
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
