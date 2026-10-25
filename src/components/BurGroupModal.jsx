import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useStorageImage } from '../utils/storageImage';
import { X, ShoppingCart, Check, Plus, Minus, Layers, AlertCircle } from 'lucide-react';

export const BurGroupModal = ({ isOpen, onClose, groupItem }) => {
  const { lang, t, isRtl } = useLanguage();
  const { addToCart, cartItems } = useCart();
  const [quantities, setQuantities] = useState({});
  const [justAddedIds, setJustAddedIds] = useState(new Set());

  if (!isOpen || !groupItem) return null;

  const { groupDef, resolvedOptions = [] } = groupItem;
  const displayName = isRtl ? (groupItem.name_ar || groupItem.name_en) : (groupItem.name_en || groupItem.name_ar);

  const getQty = (productId) => quantities[productId] || 1;

  const updateQty = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (e, opt) => {
    e.preventDefault();
    e.stopPropagation();

    const productRecord = opt.product || {
      id: opt.productId,
      name_en: opt.label_en || `${groupDef.name_en} (${opt.code})`,
      name_ar: opt.label_ar || `${groupDef.name_ar} (${opt.code})`,
      price: opt.price || groupDef.base_price,
      image_url: opt.image || groupDef.base_image,
      stock_quantity: 9999
    };

    const addQty = getQty(opt.productId);

    addToCart({
      ...productRecord,
      quantity: addQty,
      effectiveStock: 9999
    });

    setJustAddedIds(prev => new Set([...prev, opt.productId]));
    setTimeout(() => {
      setJustAddedIds(prev => {
        const next = new Set(prev);
        next.delete(opt.productId);
        return next;
      });
    }, 1800);
  };

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 12, 10, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        direction: isRtl ? 'rtl' : 'ltr'
      }}
      onClick={onClose}
    >
      <div
        className="animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'var(--surface-color, #FFFFFF)',
          borderRadius: 'var(--radius-lg, 18px)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl, 0 20px 45px rgba(0,0,0,0.22))',
          border: '1px solid var(--border-color, #E2DAD0)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--border-color, #E2DAD0)',
          background: 'linear-gradient(to bottom, #FFFFFF, var(--surface-color, #FAF8F4))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent, rgba(104, 72, 53, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary, #684835)'
            }}>
              <Layers size={17} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main, #231810)' }}>
                {groupDef.name_en}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #8C7E72)', fontWeight: 600 }}>
                {groupDef.name_ar}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted, #8C7E72)',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── MODAL BODY: Split into Preview & Options ── */}
        <div style={{
          overflowY: 'auto',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>

          {/* Group Header Hero Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md, 12px)',
            background: 'var(--accent, #FAF8F4)',
            border: '1px solid var(--border-color, #E2DAD0)'
          }}>
            <div
              className="ad-watermarked-container product-card-image"
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#FFFFFF',
                border: '1px solid rgba(226, 218, 208, 0.7)',
                flexShrink: 0
              }}
            >
              <img
                src={groupDef.base_image}
                alt={displayName}
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.35rem' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(104, 72, 53, 0.1)', color: 'var(--secondary, #684835)', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                <span>{resolvedOptions.length} {lang === 'ar' ? 'خيارات متوفرة' : 'Available Options'}</span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main, #231810)' }}>
                {groupDef.name_en}
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted, #8C7E72)', lineHeight: 1.4 }}>
                {lang === 'ar'
                  ? 'اختر المقاس أو اللون المطلوب وأضفه مباشرة إلى سلتك بكل سهولة.'
                  : 'Select your preferred size or color and add it directly to your cart.'}
              </p>
            </div>
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted, #8C7E72)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'ar' ? 'الخيارات والمقاسات المتوفرة:' : 'Available Sizes & Colors:'}
            </div>

            {resolvedOptions.map((opt) => {
              const qty = getQty(opt.productId);
              const isJustAdded = justAddedIds.has(opt.productId);
              const isAvailable = opt.isAvailable;
              const optImg = opt.image || groupDef.base_image;

              return (
                <div
                  key={opt.productId}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.9rem 1.1rem',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: '1px solid var(--border-color, #E2DAD0)',
                    background: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Left: Thumbnail & Name / Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div
                      className="ad-watermarked-container product-card-image"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        background: '#FAF8F4',
                        border: '1px solid rgba(226, 218, 208, 0.6)',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {optImg ? (
                        <img
                          src={optImg}
                          alt={opt.code}
                          draggable={false}
                          onContextMenu={e => e.preventDefault()}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.2rem' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                          {opt.code}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main, #231810)' }}>
                          {opt.label_en || opt.code}
                        </span>

                        {opt.color && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '999px',
                              background: opt.colorHex ? `${opt.colorHex}18` : 'rgba(0,0,0,0.06)',
                              color: opt.colorHex || 'var(--text-main)',
                              border: opt.colorHex ? `1px solid ${opt.colorHex}40` : '1px solid rgba(0,0,0,0.1)'
                            }}
                          >
                            ● {opt.color}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--secondary, #684835)' }}>
                          {opt.price} {lang === 'ar' ? 'د.ل' : 'LYD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Add to Cart Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    {isAvailable ? (
                      <>
                        {/* Quantity controls */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid var(--border-color, #E2DAD0)',
                          borderRadius: 'var(--radius-sm, 8px)',
                          background: '#FAF8F4',
                          overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            onClick={() => updateQty(opt.productId, -1)}
                            disabled={qty <= 1}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: '0.35rem 0.5rem',
                              cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                              color: qty <= 1 ? 'rgba(0,0,0,0.2)' : 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="tabular-nums" style={{ minWidth: '22px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800 }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(opt.productId, 1)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: '0.35rem 0.5rem',
                              cursor: 'pointer',
                              color: 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Add button */}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, opt)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: 'var(--radius-sm, 8px)',
                            border: 'none',
                            background: isJustAdded ? '#059669' : 'var(--secondary, #684835)',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: isJustAdded ? '0 2px 8px rgba(5, 150, 105, 0.35)' : '0 2px 6px rgba(104, 72, 53, 0.25)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        >
                          {isJustAdded ? <Check size={14} /> : <ShoppingCart size={14} />}
                          <span>{isJustAdded ? (lang === 'ar' ? 'تمت الإضافة' : 'Added') : (lang === 'ar' ? 'إضافة للسلة' : 'Add')}</span>
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#DC2626', background: 'rgba(239, 68, 68, 0.08)', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                        {lang === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ── MODAL FOOTER ── */}
        <div style={{
          padding: '0.85rem 1.4rem',
          borderTop: '1px solid var(--border-color, #E2DAD0)',
          background: 'var(--surface-color, #FAF8F4)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{
              padding: '0.45rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md, 8px)'
            }}
          >
            {lang === 'ar' ? 'إغلاق ومتابعة التسوق' : 'Close & Continue'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default BurGroupModal;
