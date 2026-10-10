import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { isBundleProduct, getBundleDefinition } from '../utils/productInventoryEngine';

export const CartPage = () => {
  const { t, isRtl } = useLanguage();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    removeBundleComponent,
    subtotal,
    totalComparePrice,
    totalDiscount,
    isEditingOrder,
    editingOrder,
    cancelEditingOrder
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--accent)', padding: '1.5rem', borderRadius: '50%', color: 'var(--secondary)' }}>
          <ShoppingBag size={48} />
        </div>
        <div>
          <h2>{t('cart.title')}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t('cart.empty')}</p>
        </div>
        <Link to="/" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          <span style={{ margin: '0 0.4rem' }}>مواصلة التسوق / Continue Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('cart.title')}
        </h1>
      </div>

      {/* Editing Order Alert Banner */}
      {isEditingOrder && editingOrder && (
        <div
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
          className="animate-fade-in"
        >
          <div>
            <p style={{ fontWeight: 800, color: '#2563eb', margin: 0, fontSize: '1rem' }}>
              ✏️ {isRtl ? 'أنت في وضع تعديل الطلبية' : 'Editing Order Mode'} #{editingOrder.order_number?.replace(/-/g, '').slice(0, 8)}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              {isRtl
                ? 'يمكنك إضافة أدوات جديدة من المتجر، حذف أدوات، أو تعديل الكميات. عند الانتهاء اضغط "مراجعة وإرسال التعديل".'
                : 'Modify items, adjust quantities, or add new tools. Click "Review & Submit Changes" when finished.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={cancelEditingOrder}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
            </button>
            <Link
              to="/study-tools"
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
            >
              {isRtl ? '+ إضافة منتجات أخرى' : '+ Add More Products'}
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }} className="cart-grid">
        
        {/* Items List Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => {
            const originalPrice = item.compare_at_price || item.price;
            const itemKey = item.cart_line_id || item.id;
            const isOffer = item.is_bundle || isBundleProduct(item.bundle_id || item.id);
            const bundleDef = isOffer ? getBundleDefinition(item.bundle_id || item.id) : null;
            const bundleComponents = item.bundle_components || bundleDef?.components || [];

            return (
              <div
                key={itemKey}
                className="card cart-item-row"
                style={{
                  padding: '1.2rem',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  alignItems: 'start',
                  gap: '1rem',
                  backgroundColor: 'var(--surface-color)',
                  border: isOffer ? '1.5px solid rgba(128, 0, 32, 0.35)' : undefined
                }}
              >
                
                {/* Product Image */}
                <Link to={`/product/${item.id}`} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--border-color)', flexShrink: 0 }}>
                  <img src={item.image_url} alt={item.name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>

                {/* Info and Quantity count */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/product/${item.id}`} style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }} className="product-title-link">
                      {isRtl ? item.name_ar : item.name_en}
                    </Link>
                    {isOffer && (
                      <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(128, 0, 32, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(128, 0, 32, 0.25)', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                        🎁 {isRtl ? 'بكج متكامل' : 'Complete Bundle'}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 800, margin: 0 }}>
                    {item.price} {t('cart.currency')}
                    {item.compare_at_price && (
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                        {item.compare_at_price} {t('cart.currency')}
                      </span>
                    )}
                  </p>
                  {item.availability === 'by_order' && (
                    <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', border: '1px solid rgba(79, 70, 229, 0.25)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, width: 'fit-content' }}>
                      {isRtl ? '📦 متوفر بالطلب' : '📦 By Order'}
                    </span>
                  )}

                  {/* Quantity adjuster */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: 'fit-content', marginTop: '0.2rem' }}>
                    <button onClick={() => updateQuantity(itemKey, item.quantity - 1)} style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem', fontWeight: 'bold' }}>-</button>
                    <span style={{ width: '34px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 800 }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(itemKey, item.quantity + 1)} style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem', fontWeight: 'bold' }}>+</button>
                  </div>

                  {/* Bundle Components List with Individual Removal */}
                  {isOffer && bundleComponents.length > 0 && (
                    <div style={{
                      marginTop: '0.6rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--accent)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)' }}>
                          📦 {isRtl ? `محتويات البكج المشمولة (${bundleComponents.length} بيرات):` : `Included in bundle (${bundleComponents.length} burs):`}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.quantity > 1 ? (isRtl ? `(×${item.quantity} لكل بير)` : `(×${item.quantity} each)`) : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {bundleComponents.map((comp) => (
                          <div
                            key={comp.productId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              padding: '0.3rem 0.4rem',
                              backgroundColor: 'var(--surface-color)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(0,0,0,0.05)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {comp.imageUrl && (
                                <img src={comp.imageUrl} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '3px' }} />
                              )}
                              <span style={{ fontWeight: 600 }}>{isRtl ? (comp.nameAr || comp.nameEn) : comp.nameEn}</span>
                              <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.75rem' }}>
                                × {comp.quantity * item.quantity}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeBundleComponent(itemKey, comp.productId)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: 'var(--danger)',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: 700,
                                transition: 'all 0.15s ease'
                              }}
                              title={isRtl ? 'حذف هذا البير وتفكيك البكج إلى منتجات منفردة' : 'Remove this bur from bundle'}
                            >
                              ✕ {isRtl ? 'حذف من البكج' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                        💡 {isRtl
                          ? 'عند إزالة أي بير، يتم فك ارتباط البكج وتبقى البيرات المتبقية في السلة كمنتجات منفردة بأسعارها الطبيعية.'
                          : 'Removing any bur will dissolve the bundle, keeping the remaining burs in the cart at their individual prices.'}
                      </p>
                    </div>
                  )}

                </div>

                {/* Price total and Trash delete */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                  <button onClick={() => removeFromCart(itemKey)} style={{ color: 'var(--danger)', opacity: 0.8 }} title={isRtl ? 'حذف كامل البكج' : 'Remove entire item'}>
                    <Trash2 size={18} />
                  </button>
                  <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {(item.price * item.quantity).toFixed(2)} {t('cart.currency')}
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Cart Summary Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              ملخص السلة / Cart Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('cart.subtotal')}:</span>
                <span style={{ fontWeight: 600 }}>{totalComparePrice.toFixed(2)} {t('cart.currency')}</span>
              </div>

              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>{t('cart.discounts')}:</span>
                  <span style={{ fontWeight: 600 }}>-{totalDiscount.toFixed(2)} {t('cart.currency')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--secondary)', paddingTop: '0.8rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                <span>{t('cart.total')}:</span>
                <span>{subtotal.toFixed(2)} {t('cart.currency')}</span>
              </div>

            </div>

            {/* Proceed to checkout */}
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 800 }}
            >
              {isEditingOrder
                ? (isRtl ? 'مراجعة وإرسال التعديل ➔' : 'Review & Submit Modified Order ➔')
                : t('cart.checkout')}
            </button>

          </div>

          <Link to="/" style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
            مواصلة التسوق / Continue Shopping
          </Link>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .cart-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .cart-item-row {
            grid-template-columns: 70px 1fr auto !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
