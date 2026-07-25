import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import supabase from '../supabaseClient';

export const ProductCard = ({ product }) => {
  const { lang, t, isRtl } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('smylodent_favs') || '[]');
    setIsFav(favs.includes(product.id));
  }, [product.id]);

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = JSON.parse(localStorage.getItem('smylodent_favs') || '[]');
    const updated = isFav ? favs.filter(id => id !== product.id) : [...favs, product.id];
    localStorage.setItem('smylodent_favs', JSON.stringify(updated));
    setIsFav(!isFav);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, quantity: 1 });
  };

  const discountPercent = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const isUnavailable = product.availability === 'unavailable';
  const isLimited = product.availability === 'limited_quantity';
  const isComingSoon = product.availability === 'coming_soon';

  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card"
      style={{ opacity: isUnavailable ? 0.65 : 1 }}
    >
      {/* Image */}
      <div className="product-card-image">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format'}
          alt={lang === 'ar' ? product.name_ar : product.name_en}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format'; }}
        />

        {/* Badges */}
        <div className="product-card-badge">
          {discountPercent > 0 && <span className="badge badge-discount">-{discountPercent}%</span>}
          {isLimited && <span className="badge badge-limited">{lang === 'ar' ? 'محدود' : 'Limited'}</span>}
          {isComingSoon && <span className="badge badge-unavailable">{lang === 'ar' ? 'قريباً' : 'Soon'}</span>}
        </div>

        {/* Fav heart */}
        <button
          onClick={toggleFav}
          style={{
            position: 'absolute',
            top: '0.6rem',
            left: isRtl ? '0.6rem' : 'auto',
            right: isRtl ? 'auto' : '0.6rem',
            ...(discountPercent > 0 || isLimited || isComingSoon
              ? { top: '2.4rem' }
              : {}),
            width: 32, height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            color: isFav ? '#EF4444' : '#9CA3AF',
            transition: 'all 0.2s ease',
          }}
        >
          <Heart size={14} fill={isFav ? '#EF4444' : 'none'} />
        </button>

        {/* Hover Actions */}
        {!isUnavailable && !isComingSoon && (
          <div className="product-card-actions">
            <button
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              <ShoppingCart size={14} />
              {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); navigate(`/product/${product.id}`); }}
              style={{
                width: 38, height: 38, borderRadius: 8,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Eye size={15} />
            </button>
          </div>
        )}

        {isUnavailable && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="badge badge-unavailable" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              {lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="product-card-body">
        <h3 className="product-card-name">
          {lang === 'ar' ? product.name_ar : product.name_en}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: 'auto' }}>
          <span className="product-card-price">
            {product.price} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('cart.currency')}</span>
          </span>
          {product.compare_at_price && (
            <span className="product-card-compare">
              {product.compare_at_price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
