import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, ShoppingCart, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export const BottomNav = () => {
  const { lang, isRtl } = useLanguage();
  const { cartCount } = useCart();
  const location = useLocation();

  // Don't show in admin dashboard
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      label: lang === 'ar' ? 'الرئيسية' : 'Home',
      icon: Home,
      to: '/',
      isActive: location.pathname === '/'
    },
    {
      id: 'subjects',
      label: lang === 'ar' ? 'المواد' : 'Subjects',
      icon: BookOpen,
      to: '/year/1st-year',
      isActive: location.pathname.startsWith('/year') || location.pathname.startsWith('/subject')
    },
    {
      id: 'cart',
      label: lang === 'ar' ? 'السلة' : 'Cart',
      icon: ShoppingCart,
      to: '/cart',
      isActive: location.pathname === '/cart',
      badge: cartCount
    },
    {
      id: 'track',
      label: lang === 'ar' ? 'تتبع الطلب' : 'Track Order',
      icon: Truck,
      to: '/track',
      isActive: location.pathname === '/track'
    }
  ];

  return (
    <nav
      className="mobile-bottom-nav no-print"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        backgroundColor: '#231810',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderTopLeftRadius: '22px',
        borderTopRightRadius: '22px',
        boxShadow: '0 -4px 28px rgba(0, 0, 0, 0.35)',
        padding: '0.45rem 0.85rem calc(env(safe-area-inset-bottom, 8px) + 0.45rem) 0.85rem',
        direction: isRtl ? 'rtl' : 'ltr'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          maxWidth: '520px',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              to={item.to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                minWidth: '68px',
                padding: '0.4rem 0.6rem',
                borderRadius: '14px',
                textDecoration: 'none',
                color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                backgroundColor: active ? '#38281D' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
                {item.id === 'cart' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: isRtl ? 'auto' : '-9px',
                      left: isRtl ? '-9px' : 'auto',
                      backgroundColor: '#FFFFFF',
                      color: '#231810',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {item.badge ?? 0}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: active ? 800 : 500,
                  letterSpacing: '0.01em',
                  lineHeight: 1.2
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
