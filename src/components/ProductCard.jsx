import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStorageImage } from '../utils/storageImage';
import { isBundleProduct, getBundleDefinition, getProductSizedConfig, getStudentGuideInfo } from '../utils/productInventoryEngine';
import { ShoppingCart, Check, Heart, Sparkles, BookOpen, AlertCircle, Layers } from 'lucide-react';
import { BurGroupModal } from './BurGroupModal';

export const ProductCard = ({ product }) => {
  const { lang, t, isRtl } = useLanguage();
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
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();

  // Live cart quantity calculation (synchronized across all subject appearances)
  const currentCartQuantity = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems
      .filter(item => 
        item.id === product.id || 
        item.base_product_id === product.id || 
        (typeof item.id === 'string' && item.id.startsWith(`${product.id}-`))
      )
      .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  }, [cartItems, product.id]);

  const [isFav, setIsFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizePrompt, setSizePrompt] = useState(false);
  const sizedConfig = getProductSizedConfig(product);
  const currentImageUrl = (sizedConfig && selectedSize && sizedConfig.sizes.find(s => s.size === selectedSize)?.image) || product.image_url;
  const resolvedImageSrc = useStorageImage(currentImageUrl);

  useEffect(() => {
    setSelectedSize(null);
    setSizePrompt(false);
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

  const guideInfo = getStudentGuideInfo(product.id);
  const isGuide = Boolean(guideInfo);
  const isOffer = isBundleProduct(product.id);
  const isByOrder = product.availability === 'by_order';
  // Per store directive: Keep catalog items available even if stock is zero, except special student guides
  const isUnavailable = false;
  const isComingSoon = false;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuide) {
      navigate(`/product/${product.id}`);
      return;
    }
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
        stock_quantity: 9999,
        effectiveStock: 9999
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
      return;
    }

    addToCart({ ...product, quantity: 1, isOffer, stock_quantity: 9999, effectiveStock: 9999 });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const [showBurModal, setShowBurModal] = useState(false);
  const isBurGroup = Boolean(product?.isBurGroup);

  if (isBurGroup) {
    return (
      <>
        <div
          onClick={() => setShowBurModal(true)}
          className="product-card bur-group-card"
          style={{ cursor: 'pointer' }}
        >
          {/* ── IMAGE AREA ── */}
          <div className="product-card-image" onContextMenu={e => e.preventDefault()}>
            <img
              src={resolvedImageSrc || product.image_url}
              alt={displayName}
              loading="lazy"
              decoding="async"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format'; }}
            />

            {/* Group Options Count Badge */}
            <div className="product-card-badge">
              <span
                className="badge"
                style={{
                  background: 'linear-gradient(135deg, #684835, #4A3325)',
                  color: '#fff',
                  boxShadow: '0 2px 6px rgba(104,72,53,0.3)',
                  gap: '0.25rem'
                }}
              >
                <Layers size={11} />
                <span>{lang === 'ar' ? `${product.resolvedOptions?.length || 2} خيارات` : `${product.resolvedOptions?.length || 2} Options`}</span>
              </span>
            </div>
          </div>

          {/* ── BODY AREA: Name + Price + Select Bur Button ── */}
          <div className="product-card-body">
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
              <span className="product-card-price tabular-nums">
                {product.price}{' '}
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {t('cart.currency') || 'د.ل'}
                </span>
              </span>
            </div>

            {/* Select Bur CTA Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowBurModal(true);
              }}
              className="product-card-cta-btn"
              style={{
                background: 'linear-gradient(135deg, var(--secondary, #684835), #4A3325)',
                color: '#FFFFFF',
                boxShadow: '0 3px 10px rgba(104, 72, 53, 0.28)'
              }}
            >
              <Layers size={15} strokeWidth={2.2} />
              <span>{lang === 'ar' ? 'اختيار البير' : 'Select Bur'}</span>
            </button>
          </div>
        </div>

        {/* Bur Options Modal */}
        <BurGroupModal
          isOpen={showBurModal}
          onClose={() => setShowBurModal(false)}
          groupItem={product}
        />
      </>
    );
  }

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
      <div className="product-card-image" onContextMenu={e => e.preventDefault()}>
        <img
          src={resolvedImageSrc}
          alt={displayName}
          loading="lazy"
          decoding="async"
          draggable={false}
          onContextMenu={e => e.preventDefault()}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format'; }}
        />

        {/* Status Badges */}
        <div className="product-card-badge">
          {isGuide && (
            <span className="badge" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', boxShadow: '0 2px 6px rgba(217,119,6,0.35)', gap: '0.25rem' }}>
              <BookOpen size={11} />
              <span>{lang === 'ar' ? 'إرشاد للطلبة' : 'Student Guide'}</span>
            </span>
          )}
          {isByOrder && <span className="badge badge-by-order" style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', color: '#fff', boxShadow: '0 2px 6px rgba(79,70,229,0.35)' }}>{lang === 'ar' ? 'بالطلب' : 'By Order'}</span>}
          {isOffer && !isUnavailable && <span className="badge badge-discount" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>{lang === 'ar' ? 'عرض خاص' : 'Special Offer'}</span>}
          {discountPercent > 0 && <span className="badge badge-discount tabular-nums">-{discountPercent}%</span>}
          {isUnavailable && <span className="badge badge-unavailable">{lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>}
          {isComingSoon && <span className="badge badge-unavailable">{lang === 'ar' ? 'قريباً' : 'Soon'}</span>}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={toggleFav}
          aria-label="Favorite"
          className="product-fav-btn"
          style={{ color: isFav ? '#EF4444' : '#8C7E72' }}
        >
          <Heart size={15} fill={isFav ? '#EF4444' : 'none'} />
        </button>

        {/* Live Cart Quantity Pill (Visible when item is in cart) */}
        {currentCartQuantity > 0 && (
          <div
            className="product-in-cart-pill"
            title={lang === 'ar' ? `${currentCartQuantity} في السلة` : `${currentCartQuantity} in cart`}
          >
            <ShoppingCart size={11} strokeWidth={2.5} />
            <span>{currentCartQuantity}</span>
            <span style={{ fontSize: '0.66rem', opacity: 0.92 }}>{lang === 'ar' ? 'بالسلة' : 'in cart'}</span>
          </div>
        )}

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
          <span className="product-card-price tabular-nums">
            {product.price}{' '}
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('cart.currency') || 'د.ل'}
            </span>
          </span>
          {product.compare_at_price && (
            <span className="product-card-compare tabular-nums">
              {product.compare_at_price}
            </span>
          )}
        </div>

        {/* Size Selection Row for Sized Products (Mandatory Selection) */}
        {sizedConfig && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`product-size-selector-bar ${sizePrompt ? 'has-error' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.4rem',
            }}
          >
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: sizePrompt ? '#DC2626' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              {sizePrompt && <AlertCircle size={12} />}
              {sizePrompt
                ? (lang === 'ar' ? (sizedConfig.optionsPromptAr || (sizedConfig.hasColorAndSize ? 'حدد الخيار أولاً:' : 'حدد المقاس أولاً:')) : (sizedConfig.optionsPromptEn || (sizedConfig.hasColorAndSize ? 'Select option:' : 'Select size:')))
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
                    className={`product-size-pill ${isSelected ? 'selected' : ''}`}
                  >
                    {s.colorHex && (
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: s.colorHex,
                        display: 'inline-block',
                        border: '1px solid rgba(255,255,255,0.75)'
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
        {isGuide ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            className="product-card-cta-btn guide-state"
          >
            <BookOpen size={15} strokeWidth={2.2} />
            <span>{lang === 'ar' ? 'عرض توجيه وإرشاد الطلبة' : 'View Student Guide'}</span>
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isUnavailable || isComingSoon}
            className={`product-card-cta-btn ${justAdded ? 'just-added' : ''} ${sizePrompt ? 'error-state' : ''}`}
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
              <>
                <AlertCircle size={15} strokeWidth={2.3} />
                <span>{lang === 'ar' ? (sizedConfig?.optionsPromptAr || (sizedConfig?.hasColorAndSize ? 'يرجى تحديد الخيار المطلوب أولاً' : 'يرجى اختيار المقاس (M أو L)')) : (sizedConfig?.optionsPromptEn || (sizedConfig?.hasColorAndSize ? 'Please select an option first' : 'Please select size (M or L)'))}</span>
              </>
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

            {currentCartQuantity > 0 && !isUnavailable && !isComingSoon && (
              <span
                className="tabular-nums"
                style={{
                  marginInlineStart: 'auto',
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  color: '#FFFFFF',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  lineHeight: 1.2
                }}
                title={lang === 'ar' ? `${currentCartQuantity} في السلة` : `${currentCartQuantity} in cart`}
              >
                {currentCartQuantity}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
