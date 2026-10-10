import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useStorageImage } from '../utils/storageImage';
import { isBundleProduct, getBundleDefinition, getProductSizedConfig } from '../utils/productInventoryEngine';
import { ShoppingCart, Check, Heart, Sparkles } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { lang, t, isRtl } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [isFav, setIsFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizePrompt, setSizePrompt] = useState(false);
  const sizedConfig = getProductSizedConfig(product.id);
  const currentImageUrl = (sizedConfig && selectedSize && sizedConfig.sizes.find(s => s.size === selectedSize)?.image) || product.image_url;
  const resolvedImageSrc = useStorageImage(currentImageUrl);

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

  const isOffer = isBundleProduct(product.id);
  const isByOrder = product.availability === 'by_order';
  const isOutOfStock = !isByOrder && (product.effectiveStock !== undefined
    ? product.effectiveStock <= 0
    : (!isOffer && product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0 && !product.shared_inventory_product_id));
  const isUnavailable = !isByOrder && (product.availability === 'unavailable' || isOutOfStock);
  const isComingSoon = product.availability === 'coming_soon';
  const isLimited = !isByOrder && !isUnavailable && (product.availability === 'limited_quantity' || (!isOffer && product.stock_quantity > 0 && product.stock_quantity <= 5));

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnavailable || isComingSoon) return;

    if (sizedConfig && !selectedSize) {
      setSizePrompt(true);
      setTimeout(() => setSizePrompt(false), 2200);
      return;
    }

    if (sizedConfig && selectedSize) {
      const sizeDef = sizedConfig.sizes.find(s => s.size === selectedSize);
      const variantNameEn = sizeDef?.labelEn ? `${product.name_en} (${sizeDef.labelEn})` : `${product.name_en} (Size ${selectedSize})`;
      const variantNameAr = sizeDef?.labelAr ? `${product.name_ar} (${sizeDef.labelAr})` : `${product.name_ar} (مقاس ${selectedSize})`;
      addToCart({
        ...product,
        id: `${product.id}-${selectedSize}`,
        base_product_id: product.id,
        name_en: variantNameEn,
        name_ar: variantNameAr,
        selected_size: sizeDef?.code || selectedSize,
        selected_color: sizeDef?.color || product.color,
        image_url: sizeDef?.image || product.image_url,
        quantity: 1,
        stock_quantity: sizeDef ? sizeDef.stock : 24,
        effectiveStock: sizeDef ? sizeDef.stock : 24
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
      return;
    }

    addToCart({ ...product, quantity: 1, isOffer });
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
          {isByOrder && <span className="badge badge-by-order" style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', color: '#fff', boxShadow: '0 2px 6px rgba(79,70,229,0.35)' }}>{lang === 'ar' ? 'بالطلب' : 'By Order'}</span>}
          {isOffer && !isUnavailable && <span className="badge badge-discount" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>{lang === 'ar' ? 'عرض خاص' : 'Special Offer'}</span>}
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

        {/* Size Selection Row for Sized Products (Mandatory Selection) */}
        {sizedConfig && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.4rem',
              marginBottom: '0.65rem',
              padding: '0.35rem 0.6rem',
              borderRadius: '8px',
              background: sizePrompt ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 0, 0, 0.03)',
              border: sizePrompt ? '1.5px solid #EF4444' : '1px solid var(--border-card, #e2e8f0)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: sizePrompt ? '#DC2626' : 'var(--text-muted)' }}>
              {sizePrompt
                ? (lang === 'ar' ? (sizedConfig.optionsPromptAr || (sizedConfig.hasColorAndSize ? '⚠️ حدد الخيار أولاً:' : '⚠️ حدد المقاس أولاً:')) : (sizedConfig.optionsPromptEn || (sizedConfig.hasColorAndSize ? '⚠️ Select option:' : '⚠️ Select size:')))
                : (lang === 'ar' ? (sizedConfig.optionsLabelAr || (sizedConfig.hasColorAndSize ? 'الخيارات:' : 'المقاس:')) : (sizedConfig.optionsLabelEn || (sizedConfig.hasColorAndSize ? 'Options:' : 'Size:')))}
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {sizedConfig.sizes.map(s => {
                const isSelected = selectedSize === s.size;
                return (
                  <button
                    key={s.size}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(s.size);
                      setSizePrompt(false);
                    }}
                    style={{
                      minWidth: '32px',
                      height: '26px',
                      padding: '0 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      border: isSelected ? '1px solid #3D352E' : '1px solid #CBD5E1',
                      background: isSelected ? '#3D352E' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isSelected ? 'scale(1.05)' : 'none',
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    {s.colorHex && (
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: s.colorHex,
                        display: 'inline-block',
                        border: '1px solid rgba(255,255,255,0.7)'
                      }} />
                    )}
                    <span>{s.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
              : sizePrompt
              ? '#DC2626'
              : (isUnavailable || isComingSoon ? '#E5E0D8' : '#684835'),
            color: (isUnavailable || (isComingSoon && !justAdded)) ? '#8C7E72' : '#FFFFFF',
            boxShadow: justAdded
              ? '0 2px 8px rgba(46,125,50,0.3)'
              : sizePrompt
              ? '0 2px 8px rgba(220,38,38,0.3)'
              : '0 2px 6px rgba(104,72,53,0.2)',
            transition: 'background-color 0.2s ease, transform 0.15s ease',
          }}
        >
          {justAdded ? (
            <>
              <Check size={16} strokeWidth={2.8} />
              <span>{lang === 'ar' ? (selectedSize ? `تمت إضافة (${selectedSize})` : 'تمت الإضافة') : (selectedSize ? `Added (${selectedSize})` : 'Added')}</span>
            </>
          ) : isUnavailable ? (
            <span>{lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>
          ) : isComingSoon ? (
            <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
          ) : sizePrompt ? (
            <span>{lang === 'ar' ? (sizedConfig?.optionsPromptAr || (sizedConfig?.hasColorAndSize ? '⚠️ يرجى تحديد الخيار المطلوب أولاً' : '⚠️ يرجى اختيار المقاس (M أو L)')) : (sizedConfig?.optionsPromptEn || (sizedConfig?.hasColorAndSize ? '⚠️ Please select an option first' : '⚠️ Please select size (M or L)'))}</span>
          ) : sizedConfig && !selectedSize ? (
            <>
              <ShoppingCart size={15} strokeWidth={2.2} />
              <span>{lang === 'ar' ? (sizedConfig.buttonPromptAr || (sizedConfig.hasColorAndSize ? 'اختر الخيار وأضف' : 'اختر المقاس وأضف')) : (sizedConfig.buttonPromptEn || (sizedConfig.hasColorAndSize ? 'Select Option & Add' : 'Select Size & Add'))}</span>
            </>
          ) : sizedConfig && selectedSize ? (
            <>
              <ShoppingCart size={15} strokeWidth={2.2} />
              <span>{lang === 'ar' ? `أضف للسلة (${sizedConfig.sizes.find(s => s.size === selectedSize)?.shortLabel || selectedSize})` : `Add to Cart (${sizedConfig.sizes.find(s => s.size === selectedSize)?.shortLabel || selectedSize})`}</span>
            </>
          ) : isByOrder ? (
            <>
              <ShoppingCart size={15} strokeWidth={2.2} />
              <span>{lang === 'ar' ? 'أضف للسلة (بالطلب)' : 'Add to Cart (By Order)'}</span>
            </>
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
