import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  Image,
  Inbox,
  Settings,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Lock,
  Users
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, profile, signIn, signOut, loading } = useAuth();
  const { isRtl } = useLanguage();
  const location = useLocation();

  // PIN stored in sessionStorage only — clears when browser closes
  const [passcode, setPasscode] = useState(() => sessionStorage.getItem('admin_pin') || '');
  const [inputCode, setInputCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);


  // Auto sign-in to Supabase when PIN already stored (e.g. page refresh)
  useEffect(() => {
    if (passcode === '9922' && !user && !loading) {
      signIn('admin@smylodent.com', 'admin123').catch(() => {});
    }
  }, [passcode, user, loading]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    if (inputCode === '9922') {
      sessionStorage.setItem('admin_pin', '9922');
      localStorage.removeItem('admin_passcode');
      setPasscode('9922');
      // Sign into Supabase so admin DB queries work (RLS requires auth)
      try { await signIn('admin@smylodent.com', 'admin123'); } catch (_) {}
      setLoginLoading(false);
    } else {
      setLoginError(isRtl ? 'الرمز الذي أدخلته غير صحيح!' : 'Incorrect access code!');
      setLoginLoading(false);
    }
  };

  const handleLock = async () => {
    sessionStorage.removeItem('admin_pin');
    localStorage.removeItem('admin_passcode');
    try { await signOut(); } catch (_) {}
    setPasscode('');
    setInputCode('');
  };

  // Passcode Lock Guard Screen
  if (passcode !== '9922') {
    return (
      <div className="container animate-fade-in" style={{ padding: '6rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: '380px',
            padding: '2.5rem 2rem',
            backgroundColor: 'var(--surface-color)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ backgroundColor: 'var(--accent)', padding: '1.2rem', borderRadius: '50%', color: 'var(--secondary)' }}>
              <Lock size={40} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              {isRtl ? 'لوحة تحكم المشرف' : 'Admin Portal'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRtl ? 'يرجى إدخال رمز الوصول للمتابعة' : 'Please enter the access code to proceed'}
            </p>
          </div>

          {loginError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', padding: '0.6rem 0' }}
                maxLength={8}
                autoFocus
              />
            </div>

            <button type="submit" disabled={loginLoading} className="btn btn-primary" style={{ padding: '0.75rem', width: '100%' }}>
              {loginLoading ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'دخول' : 'Enter')}
            </button>
          </form>

          <Link to="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'العودة للموقع الرئيسي' : 'Return to Storefront'}
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/admin', label: isRtl ? 'الرئيسية' : 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/orders', label: isRtl ? 'الطلبات' : 'Orders', icon: ShoppingCart },
    { path: '/admin/products', label: isRtl ? 'المنتجات' : 'Products', icon: Package },
    { path: '/admin/subjects', label: isRtl ? 'المواد' : 'Subjects', icon: BookOpen },
    { path: '/admin/users', label: isRtl ? 'إدارة المستخدمين' : 'User Management', icon: Users },
    { path: '/admin/banners', label: isRtl ? 'البانرات' : 'Banners', icon: Image },
    { path: '/admin/messages', label: isRtl ? 'الرسائل' : 'Messages', icon: Inbox },
    { path: '/admin/settings', label: isRtl ? 'الإعدادات' : 'Settings', icon: Settings }
  ];

  return (
    <div className="container" style={{ padding: '2rem 0', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2.5rem' }} className="admin-grid-layout">
      
      {/* Sidebar Navigation */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="admin-sidebar-pane no-print">
        
        {/* Admin identifier */}
        <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <UserCheck size={20} style={{ color: 'var(--secondary)' }} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{isRtl ? 'مدير النظام' : 'Admin User'}</p>
            <span style={{ fontSize: '0.65rem', padding: '1px 6px', backgroundColor: 'var(--secondary)', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>ADMIN</span>
          </div>
        </div>

        {/* Links list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  backgroundColor: isActive ? 'var(--secondary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-main)',
                  transition: 'var(--transition-fast)'
                }}
                className={isActive ? '' : 'admin-nav-item'}
              >
                <IconComponent size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Lock + Back */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={handleLock}
            className="btn btn-outline"
            style={{ padding: '0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            <Lock size={14} />
            <span style={{ margin: '0 0.2rem' }}>{isRtl ? 'قفل لوحة التحكم' : 'Lock Admin'}</span>
          </button>
          <Link
            to="/"
            className="btn btn-outline"
            style={{ padding: '0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', justifyContent: 'center' }}
          >
            {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span style={{ margin: '0 0.2rem' }}>عرض المتجر / Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Pages pane */}
      <main style={{ minHeight: '500px' }} className="admin-main-pane">
        <Outlet />
      </main>

      <style>{`
        .admin-nav-item:hover {
          background-color: var(--accent);
          color: var(--secondary);
        }
        @media (max-width: 860px) {
          .admin-grid-layout {
            grid-template-columns: 1fr !important;
          }
          .admin-sidebar-pane {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 1rem !important;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
            margin-bottom: 1rem;
          }
          .admin-sidebar-pane nav {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
