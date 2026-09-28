import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Search } from 'lucide-react';

const SEARCH_COLUMNS = 'id, name_ar, name_en, description_ar, description_en, price, compare_at_price, image_url, availability, stock_quantity, subject_id, year_id';

export const SearchPage = () => {
  const { lang, t } = useLanguage();
  const location = useLocation();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get('q') || '';
    setQuery(q);

    const performSearch = async () => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        let data = cacheGet('products:search_catalog');
        if (!data) {
          const res = await supabase
            .from('products')
            .select(SEARCH_COLUMNS)
            .eq('is_active', true)
            .eq('is_archived', false);
          data = res.data;
          if (data && data.length > 0) {
            cacheSet('products:search_catalog', data, 600);
          }
        }
        
        if (data) {
          const filtered = data.filter((p) => {
            const keyword = q.toLowerCase();
            return (
              (p.name_ar && p.name_ar.toLowerCase().includes(keyword)) ||
              (p.name_en && p.name_en.toLowerCase().includes(keyword)) ||
              (p.description_ar && p.description_ar.toLowerCase().includes(keyword)) ||
              (p.description_en && p.description_en.toLowerCase().includes(keyword))
            );
          });
          setResults(filtered);
        }
      } catch (err) {
        console.error('Error matching search terms', err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [location.search]);

  return (
    <div className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Search Header */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={22} style={{ color: 'var(--secondary)' }} />
          نتائج البحث عن: "{query}"
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {lang === 'ar' ? `تم العثور على ${results.length} نتيجة مطابقة.` : `Found ${results.length} search results.`}
        </p>
      </div>

      {/* Grid listing */}
      {loading ? (
        <SkeletonLoader type="card-grid" count={4} />
      ) : results.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>لم نجد أي نتائج مطابقة!</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>جرب البحث بكلمات أخرى أو تصفح المواد حسب السنة الدراسية مباشرة.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            الذهاب للرئيسية / Go Home
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
