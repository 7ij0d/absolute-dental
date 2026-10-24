import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Search, Sparkles, Layers } from 'lucide-react';

const SEARCH_COLUMNS = 'id, name_ar, name_en, description_ar, description_en, price, compare_at_price, image_url, availability, stock_quantity, subject_id, year_id, is_bundle, discount_label_ar, discount_label_en';

export const SearchPage = ({ categoryMode = null }) => {
  const { lang } = useLanguage();
  const location = useLocation();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get('q') || '';
    setQuery(q);

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
            cacheSet('products:search_catalog_v2', data, 600);
          }
        }
        
        if (data) {
          if (categoryMode === 'offers') {
            const offersList = data.filter((p) => {
              const hasDiscount = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
              const isBundle = Boolean(p.is_bundle) || (p.name_en && p.name_en.toLowerCase().includes('bundle')) || (p.name_ar && p.name_ar.includes('بكج'));
              return hasDiscount || isBundle;
            });
            // Deduplicate by name_en/name_ar
            const seen = new Set();
            const uniqueOffers = offersList.filter((p) => {
              const key = (p.name_en || p.name_ar || p.id).trim().toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setResults(uniqueOffers);
          } else if (categoryMode === 'other-supplies') {
            const suppliesList = data.filter((p) => {
              const isUniversal = p.discount_label_en === 'universal';
              const nameEn = (p.name_en || '').toLowerCase();
              const isConsumableOrGeneral =
                isUniversal ||
                nameEn.includes('gloves') ||
                nameEn.includes('mask') ||
                nameEn.includes('gown') ||
                nameEn.includes('glasses') ||
                nameEn.includes('cap') ||
                nameEn.includes('napkin') ||
                nameEn.includes('mirror') ||
                nameEn.includes('probe') ||
                nameEn.includes('tweezers') ||
                nameEn.includes('explorer') ||
                nameEn.includes('holder') ||
                nameEn.includes('ruler');
              return isConsumableOrGeneral;
            });
            const seen = new Set();
            const uniqueSupplies = suppliesList.filter((p) => {
              const key = (p.name_en || p.name_ar || p.id).trim().toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
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
          ? 'مستلزمات الحماية الشخصية، الأدوات العامة، ومستهلكات العيادة والمعمل.'
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
    <div className="container" style={{ padding: '2rem 0 3.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.9rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {headerInfo.icon}
          <span>{headerInfo.title}</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {headerInfo.subtitle}
        </p>
      </div>

      {/* Grid listing */}
      {loading ? (
        <SkeletonLoader type="card-grid" count={4} />
      ) : results.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>{lang === 'ar' ? 'لم نجد أي نتائج مطابقة!' : 'No matching items found!'}</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {lang === 'ar'
              ? 'جرب البحث بكلمات أخرى أو تصفح المواد حسب السنة الدراسية مباشرة.'
              : 'Try searching with different keywords or browse directly by academic year.'}
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {results.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}

    </div>
  );
};

export default SearchPage;
