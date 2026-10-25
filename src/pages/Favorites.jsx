import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react';

export const Favorites = () => {
  const { t, isRtl } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user favorites list
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          product_id,
          products (*)
        `)
        .eq('user_id', user.id);

      if (data) {
        // Map elements out
        const items = data.map((fav) => fav.products).filter(Boolean);
        setProducts(items);
      }
    } catch (err) {
      console.error('Error fetching favorites list', err);
    } finally {
      setLoading(false);
    }
  };

  // Guard routing: Wait for authLoading to complete before any redirect decision
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const hasLocal = typeof window !== 'undefined' && (
        localStorage.getItem('ad_cached_user') ||
        localStorage.getItem('ad_auth_session')
      );
      if (!hasLocal) {
        navigate('/signin?redirect=/favorites');
      }
      return;
    }
    fetchFavorites();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="skeleton" style={{ height: '35px', width: '200px', marginBottom: '2rem' }}></div>
        <SkeletonLoader type="card-grid" count={4} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={24} fill="var(--danger)" stroke="var(--danger)" />
          {t('nav.favorites')}
        </h1>
      </div>

      {products.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--accent)', padding: '1.5rem', borderRadius: '50%', color: 'var(--danger)' }}>
            <Heart size={48} />
          </div>
          <div>
            <h3>قائمة المفضلة فارغة</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>احفظ الأدوات والمستلزمات الطبية التي تحتاجها للعودة إليها لاحقاً.</p>
          </div>
          <Link to="/" className="btn btn-primary">
            {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span style={{ margin: '0 0.4rem' }}>تصفح المنتجات / Browse Products</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} onFavChanged={fetchFavorites} />
          ))}
        </div>
      )}

    </div>
  );
};

export default Favorites;
