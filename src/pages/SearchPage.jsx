import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Search, Sparkles, Layers, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';

const SEARCH_COLUMNS = 'id, name_ar, name_en, description_ar, description_en, price, compare_at_price, image_url, availability, stock_quantity, subject_id, year_id, is_bundle, discount_label_ar, discount_label_en, shared_inventory_product_id';

export const SearchPage = ({ categoryMode = null }) => {
  const { lang, isRtl } = useLanguage();
  const location = useLocation();
  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [inPageFilter, setInPageFilter] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get('q') || '';
    setQuery(q);
    setInPageFilter('');

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
          if (categoryMode === 'offers') {
            const offersList = data.filter((p) => {
              const hasDiscount = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
              const isBundle = Boolean(p.is_bundle) || (p.name_en && p.name_en.toLowerCase().includes('bundle')) || (p.name_ar && p.name_ar.includes('بكج'));
              return hasDiscount || isBundle;
            });
            const seen = new Set();
            const uniqueOffers = offersList.filter((p) => {
              if (!p || !p.id || seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            setResults(uniqueOffers);
          } else if (categoryMode === 'other-supplies') {
            // Strictly include products enabled for "Other Supplies" ('other_supplies' or 'universal' or unlinked general supplies)
            const suppliesList = data.filter((p) => {
              return (
                p.discount_label_en === 'other_supplies' ||
                p.discount_label_en === 'universal' ||
                !p.subject_id
              );
            });
            const seen = new Set();
            const uniqueSupplies = suppliesList.filter((p) => {
              if (!p || !p.id || seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            setResults(uniqueSupplies);
          } else {
            const keyword = q.toLowerCase();
            const filtered = data.filter((p) => (
              (p.name_ar && p.name_ar.toLowerCase().includes(keyword)) ||
              (p.name_en && p.name_en.toLowerCase().includes(keyword)) ||
              (p.description_ar && p.description_ar.toLowerCase().includes(keyword)) ||
              (p.description_en && p.description_en.toLowerCase().includes(keyword))
            ));
            setResults(filtered);
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

  const displayedResults = useMemo(() => {
    if (!inPageFilter.trim()) return results;
    const kw = inPageFilter.trim().toLowerCase();
    return results.filter((p) =>
      (p.name_ar && p.name_ar.toLowerCase().includes(kw)) ||
      (p.name_en && p.name_en.toLowerCase().includes(kw)) ||
      (p.description_ar && p.description_ar.toLowerCase().includes(kw)) ||
      (p.description_en && p.description_en.toLowerCase().includes(kw))
    );
  }, [results, inPageFilter]);

  const getHeaderInfo = () => {
    if (categoryMode === 'offers') {
      return {
        icon: <Sparkles size={24} style={{ color: 'var(--secondary)' }} />,
        title: lang === 'ar' ? 'عروض خاصة وبكجات التوفير' : 'Special Offers & Bundles',
        subtitle: lang === 'ar'
          ? 'بكجات متكاملة وعروض مخفضة لطلبة طب الأسنان.'
          : 'Complete student bundles and discounted dental instruments.'
      };
    }
    if (categoryMode === 'other-supplies') {
      return {
        icon: <Layers size={24} style={{ color: 'var(--secondary)' }} />,
        title: lang === 'ar' ? 'مستلزمات أخرى' : 'Other Supplies',
        subtitle: lang === 'ar'
          ? 'المستلزمات الطبية العامة، القفازات، الكمامات، الشاش، ومستهلكات العيادة والمعمل.'
          : 'Personal protective equipment, general instruments, and lab/clinic consumables.'
      };
    }
    return {
      icon: <Search size={22} style={{ color: 'var(--secondary)' }} />,
      title: lang === 'ar' ? `نتائج البحث عن: "${query}"` : `Search results for: "${query}"`,
      subtitle: lang === 'ar' ? `تم العثور على ${results.length} نتيجة مطابقة.` : `Found ${results.length} matching products.`
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="container" style={{ padding: '1.5rem 1.25rem 3.5rem', maxWidth: '1180px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Breadcrumb for Other Supplies / Offers */}
      {categoryMode && (
        <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr', margin: 0 }}>
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to="/study-tools" className="breadcrumb-link">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {headerInfo.title}
          </span>
        </nav>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.55rem', margin: 0 }}>
            {headerInfo.icon}
            <span>{headerInfo.title}</span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
            {headerInfo.subtitle}
          </p>
        </div>

        <div className="subject-count-pill">
          <Package size={15} />
          <span>
            {displayedResults.length}{' '}
            {lang === 'ar' ? 'منتج' : (displayedResults.length === 1 ? 'product' : 'products')}
          </span>
        </div>
      </div>

      {/* Live Filter Bar for Category Modes */}
      {categoryMode && results.length > 0 && (
        <div className="subject-search-container" style={{ maxWidth: '480px' }}>
          <Search size={16} className="subject-search-icon" />
          <input
            type="text"
            value={inPageFilter}
            onChange={(e) => setInPageFilter(e.target.value)}
            placeholder={lang === 'ar' ? `ابحث داخل ${headerInfo.title}...` : `Search in ${headerInfo.title}...`}
            className="subject-search-input"
          />
          {inPageFilter && (
            <button
              type="button"
              onClick={() => setInPageFilter('')}
              className="subject-search-clear"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Grid listing */}
      {loading ? (
        <SkeletonLoader type="card-grid" count={4} />
      ) : displayedResults.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>{lang === 'ar' ? 'لم نجد أي نتائج مطابقة!' : 'No matching items found!'}</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {lang === 'ar'
              ? 'جرب البحث بكلمات أخرى أو تصفح المواد حسب السنة الدراسية مباشرة.'
              : 'Try searching with different keywords or browse directly by academic year.'}
          </p>
          <Link to="/study-tools" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            {lang === 'ar' ? 'تصفح أدوات الدراسة' : 'Browse Study Tools'}
          </Link>
        </div>
      ) : (
        <div className="subject-products-grid">
          {displayedResults.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}

    </div>
  );
};

export default SearchPage;
