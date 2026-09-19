import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export const FloatingCart = () => {
  const { cartCount, subtotal } = useCart();
  const { lang, isRtl } = useLanguage();
  const location = useLocation();

  // Don't show on /cart or /checkout pages to avoid duplicate CTA
  if (location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: isRtl ? '1.5rem' : 'auto',
        left: isRtl ? 'auto' : '1.5rem',
        zIndex: 9990,
        pointerEvents: 'none'
      }}
    >
      <Link
        to="/cart"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2A241F 100%)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '999px',
          textDecoration: 'none',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 2px rgba(205, 191, 166, 0.4)',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 2px var(--secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 2px rgba(205, 191, 166, 0.4)';
        }}
      >
        {/* Cart Icon Wrapper with Badge */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--secondary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(205, 191, 166, 0.5)'
            }}
          >
            <ShoppingCart size={19} />
          </div>
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#E53935',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 900,
                minWidth: 20,
                height: 20,
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #1A1A1A',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                animation: 'pulse 2s infinite'
              }}
            >
              {cartCount}
            </span>
          )}
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}</span>
            {cartCount > 0 && (
              <span style={{ background: 'rgba(205, 191, 166, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '6px', fontSize: '0.75rem', color: '#ffffff' }}>
                {cartCount}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
            {cartCount > 0 ? (
              <span>{lang === 'ar' ? `الإجمالي: ${subtotal} د.ل` : `Total: ${subtotal} LYD`}</span>
            ) : (
              <span>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</span>
            )}
          </div>
        </div>

        {/* Arrow Action Icon */}
        <div style={{ marginInlineStart: '0.4rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowIcon size={16} />
        </div>
      </Link>
    </div>
  );
};

export default FloatingCart;
