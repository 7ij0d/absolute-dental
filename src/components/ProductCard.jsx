import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useStorageImage } from '../utils/storageImage';
import { ShoppingCart, Check, Heart } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { lang, t, isRtl } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [isFav, setIsFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const resolvedImageSrc = useStorageImage(product.image_url);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('smylodent_favs') || '[]');
      setIsFav(favs.includes(product.id));
    } catch {
      // ignore
    }
  }, [product.id]);

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const favs = JSON.parse(localStorage.getItem('smylodent_favs') || '[]');
      const updated = isFav ? favs.filter(id => id !== product.id) : [...favs, product.id];
      localStorage.setItem('smylodent_favs', JSON.stringify(updated));
      setIsFav(!isFav);
    } catch {
      // ignore
    }
  };

  const isOutOfStock = (product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0 && !product.shared_inventory_product_id);
  const isUnavailable = product.availability === 'unavailable' || isOutOfStock;
  const isComingSoon = product.availability === 'coming_soon';
  const isLimited = !isUnavailable && (product.availability === 'limited_quantity' || (product.stock_quantity > 0 && product.stock_quantity <= 5));

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnavailable || isComingSoon) return;
    addToCart({ ...product, quantity: 1 });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // Strict requirement: English name ONLY inside the card
  const displayName = product.name_en || product.name_ar || 'Dental Tool';

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="product-card"
      style={{
        opacity: isUnavailable ? 0.72 : 1,
        cursor: 'pointer',
      }}
    >
      {/* ── IMAGE AREA ── */}
      <div className="product-card-image">
        <img
          src={resolvedImageSrc}
          alt={displayName}
          loading="lazy"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format'; }}
        />

        {/* Status Badges */}
        <div className="product-card-badge">
          {discountPercent > 0 && <span className="badge badge-discount">-{discountPercent}%</span>}
          {isUnavailable && <span className="badge badge-unavailable">{lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>}
          {isLimited && <span className="badge badge-limited">{lang === 'ar' ? 'كمية محدودة' : 'Limited'}</span>}
          {isComingSoon && <span className="badge badge-unavailable">{lang === 'ar' ? 'قريباً' : 'Soon'}</span>}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={toggleFav}
          aria-label="Favorite"
          className="product-fav-btn"
          style={{
            position: 'absolute',
            top: '0.6rem',
            left: isRtl ? '0.6rem' : 'auto',
            right: isRtl ? 'auto' : '0.6rem',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            color: isFav ? '#EF4444' : '#9CA3AF',
            cursor: 'pointer',
            zIndex: 3,
            transition: 'transform 0.15s ease',
          }}
        >
          <Heart size={15} fill={isFav ? '#EF4444' : 'none'} />
        </button>

        {isUnavailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}>
            <span className="badge badge-unavailable" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', fontWeight: 800 }}>
              {lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* ── BODY AREA: English Name + Price + Add to Cart ── */}
      <div className="product-card-body">
        {/* English Name ONLY */}
        <h3
          className="product-card-name"
          style={{
            direction: 'ltr',
            textAlign: isRtl ? 'right' : 'left',
          }}
        >
          {displayName}
        </h3>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: 'auto', marginBottom: '0.75rem' }}>
          <span className="product-card-price">
            {product.price}{' '}
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('cart.currency') || 'د.ل'}
            </span>
          </span>
          {product.compare_at_price && (
            <span className="product-card-compare">
              {product.compare_at_price}
            </span>
          )}
        </div>

        {/* Add to Cart Button (Touch-Friendly & Always Accessible) */}
        <button
          onClick={handleAddToCart}
          disabled={isUnavailable || isComingSoon}
          className={`product-add-cart-btn ${justAdded ? 'added' : ''}`}
          style={{
            width: '100%',
            padding: '0.6rem 0.8rem',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            cursor: (isUnavailable || isComingSoon) ? 'not-allowed' : 'pointer',
            backgroundColor: justAdded
              ? '#2E7D32'
              : (isUnavailable || isComingSoon ? '#E5E0D8' : '#684835'),
            color: (isUnavailable || (isComingSoon && !justAdded)) ? '#8C7E72' : '#FFFFFF',
            boxShadow: justAdded ? '0 2px 8px rgba(46,125,50,0.3)' : '0 2px 6px rgba(104,72,53,0.2)',
            transition: 'background-color 0.2s ease, transform 0.15s ease',
          }}
        >
          {justAdded ? (
            <>
              <Check size={16} strokeWidth={2.8} />
              <span>{lang === 'ar' ? 'تمت الإضافة' : 'Added'}</span>
            </>
          ) : isUnavailable ? (
            <span>{lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>
          ) : isComingSoon ? (
            <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
          ) : (
            <>
              <ShoppingCart size={15} strokeWidth={2.2} />
              <span>{lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
