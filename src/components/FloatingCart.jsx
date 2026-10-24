import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export const FloatingCart = () => {
  const { cartCount, subtotal } = useCart();
  const { lang, isRtl } = useLanguage();
  const location = useLocation();

  // Don't show on home '/', /cart or /checkout pages to avoid duplicate CTA
  if (location.pathname === '/' || location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div
      className="floating-cart-wrapper no-print"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        insetInlineStart: '1.5rem',
        zIndex: 9990,
        pointerEvents: 'none'
      }}
    >
      <Link to="/cart" className="floating-cart-pill">
        {/* Cart Icon Wrapper with Badge */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--secondary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 2px 8px rgba(205, 191, 166, 0.45)'
            }}
          >
            <ShoppingCart size={18} />
          </div>
          {cartCount > 0 && (
            <span
              className="tabular-nums"
              style={{
                position: 'absolute',
                top: -4,
                insetInlineEnd: -4,
                background: '#E53935',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                minWidth: 19,
                height: 19,
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #1F1A16',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              {cartCount}
            </span>
          )}
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}</span>
            {cartCount > 0 && (
              <span className="tabular-nums" style={{ background: 'rgba(205, 191, 166, 0.2)', padding: '0.08rem 0.4rem', borderRadius: '6px', fontSize: '0.74rem', color: '#ffffff' }}>
                {cartCount}
              </span>
            )}
          </div>
          <div className="tabular-nums" style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.82)', fontWeight: 600 }}>
            {cartCount > 0 ? (
              <span>{lang === 'ar' ? `الإجمالي: ${subtotal} د.ل` : `Total: ${subtotal} LYD`}</span>
            ) : (
              <span>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</span>
            )}
          </div>
        </div>

        {/* Arrow Action Icon */}
        <div style={{ marginInlineStart: '0.35rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowIcon size={16} />
        </div>
      </Link>
    </div>
  );
};

export default FloatingCart;
