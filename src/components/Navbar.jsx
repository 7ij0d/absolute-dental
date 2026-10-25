import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, User, Menu, X, Search, Globe,
  ChevronDown, LayoutDashboard, LogOut, ClipboardList,
  Heart, ChevronRight, ChevronLeft, BookOpen,
  Home, GraduationCap, PackageCheck, Box, MessageSquare, HeartHandshake,
  Sparkles, Layers, Shirt
} from 'lucide-react';
import supabase from '../supabaseClient';
import brandLogoTrimmed from '../assets/images/brand-logo-trimmed.png';

const DEFAULT_NAV_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى',  name_en: '1st Year', slug: '1st-year', sort_order: 1 },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year', sort_order: 2 },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year', sort_order: 3 },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year', sort_order: 4 },
];

const DEFAULT_NAV_SUBJECTS = [
  { id: '11', year_id: '10000000-0000-0000-0000-000000000001', name_ar: 'تشريح الأسنان', name_en: 'Dental Anatomy', slug: 'dental-anatomy' },
  { id: '12', year_id: '10000000-0000-0000-0000-000000000001', name_ar: 'مواد طب الأسنان', name_en: 'Dental Materials', slug: 'dental-materials' },
  { id: '21', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'علاج الأسنان التحفظي', name_en: 'Restorative Dentistry', slug: 'restorative-dentistry' },
  { id: '22', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'صناعة الأسنان المتحركة', name_en: 'Removable Prosthodontics', slug: 'removable-prosthodontics' },
  { id: '23', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'صناعة الأسنان الثابتة', name_en: 'Fixed Prosthodontics', slug: 'fixed-prosthodontics' },
  { id: '31', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'علاج الأسنان التحفظي 2', name_en: 'Conservative Dentistry 2', slug: 'conservative-dentistry-2' },
  { id: '32', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'طب الأسنان الوقائي', name_en: 'Preventive Dentistry', slug: 'preventive-dentistry' },
  { id: '33', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'صناعة الأسنان الثابتة 2', name_en: 'Fixed Prosthodontics 2', slug: 'fixed-prosthodontics-2' },
  { id: '34', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'صناعة الأسنان المتحركة 2', name_en: 'Removable Prosthodontics 2', slug: 'removable-prosthodontics-2' },
  { id: '41', year_id: '40000000-0000-0000-0000-000000000004', name_ar: 'جراحة الفم والتخدير', name_en: 'Oral Surgery', slug: 'oral-surgery' },
  { id: '42', year_id: '40000000-0000-0000-0000-000000000004', name_ar: 'تقويم الأسنان', name_en: 'Orthodontics', slug: 'orthodontics' }
];

export const Navbar = () => {
  const { lang, t, toggleLanguage, isRtl } = useLanguage();
  const { cartCount } = useCart();
  const { user, profile, isAdmin, signOut, openProfileCompletion } = useAuth();

  // Side Drawer closed by default
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [years, setYears] = useState(DEFAULT_NAV_YEARS);
  const [subjects, setSubjects] = useState(DEFAULT_NAV_SUBJECTS);

  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const megaRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setMegaOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const loadNavData = async () => {
      try {
        const { data: yrs } = await supabase.from('years').select('*').order('sort_order', { ascending: true });
        if (yrs && yrs.length > 0) setYears(yrs);
        const { data: subs } = await supabase.from('subjects').select('id, name_ar, name_en, year_id, slug');
        if (subs && subs.length > 0) setSubjects(subs);
      } catch (err) {
        console.warn('Using fallback navbar data:', err);
      }
    };
    loadNavData();
  }, []);

  // Close dropdowns on outside click & Escape key
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
    };
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setProfileOpen(false);
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Unified dark brown header across all pages (Home, Study Tools, Years, Subjects, Other Supplies, Product Details)
  const isLightHeader = false;

  const renderSideDrawer = () => {
    if (!mobileOpen) return null;
    return (
      <div className="mobile-menu" style={{ zIndex: 10000 }} role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'القائمة الجانبية' : 'Navigation Menu'}>
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)} />
        <div className="mobile-menu-panel" style={{ width: '320px', maxWidth: '86vw', background: '#2A1D15', borderInlineEnd: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Drawer Header */}
          <div className="mobile-menu-header" style={{ background: '#231810', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img src={brandLogoTrimmed} alt="Absolute Dental" style={{ width: 30, height: 30, objectFit: 'contain' }} />
              <span className="navbar-logo-text" style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>Absolute Dental</span>
            </div>
            <button
              className="nav-icon-btn"
              onClick={() => setMobileOpen(false)}
              aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close Menu'}
              style={{ color: '#fff' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Student Profile Info in Mobile Drawer */}
          {user && user.email !== 'admin@smylodent.com' && (
            <div
              style={{
                padding: '0.85rem 1.15rem',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
                {profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                  <img
                    src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture}
                    alt="Avatar"
                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: '#684835',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      fontFamily: 'Cairo, sans-serif',
                    }}
                  >
                    {(profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'ط')[0].toUpperCase()}
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    insetInlineEnd: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid #231810',
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                </p>
                {profile?.phone ? (
                  <p style={{ color: '#CDBFA6', fontSize: '0.74rem', margin: '0.15rem 0 0 0', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                    📱 {profile.phone}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); if (openProfileCompletion) openProfileCompletion(); }}
                    style={{
                      marginTop: '0.2rem',
                      fontSize: '0.72rem',
                      color: '#FBBF24',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontWeight: 700,
                      textDecoration: 'underline'
                    }}
                  >
                    {lang === 'ar' ? '⚠️ إضافة رقم الواتساب' : '⚠️ Add WhatsApp'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Drawer Search */}
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', insetInlineStart: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.55)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن أداة طبية...' : 'Search dental tools...'}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 'var(--radius-full)',
                  paddingBlock: '0.55rem',
                  paddingInlineStart: '2.45rem',
                  paddingInlineEnd: '1rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </form>

          {/* Drawer Links */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBlock: '0.35rem' }}>
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Home size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>

            <Link to="/study-tools" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <BookOpen size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}</span>
            </Link>

            {years.map(year => (
              <Link key={year.id} to={`/year/${year.slug}`} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                <GraduationCap size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
                <span>{lang === 'ar' ? year.name_ar : year.name_en}</span>
              </Link>
            ))}

            <Link to="/accessories" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Box size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'إكسسوارات الأسنان' : 'Dental Accessories'}</span>
            </Link>

            <Link to="/offers" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Sparkles size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'عروض خاصة' : 'Special Offers'}</span>
            </Link>

            <Link to="/other-supplies" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Layers size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'مستلزمات أخرى' : 'Other Supplies'}</span>
            </Link>

            <Link to="/cart" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <ShoppingCart size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'سلة التسوق' : 'Cart'} {cartCount > 0 && `(${cartCount})`}</span>
            </Link>

            <Link to="/favorites" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <Heart size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'المفضلة' : 'Favorites'}</span>
            </Link>

            <Link to="/track" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <PackageCheck size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'تتبع الطلب' : 'Track Order'}</span>
            </Link>

            <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <MessageSquare size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
            </Link>

            <Link to="/donations" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <HeartHandshake size={17} strokeWidth={2} style={{ color: 'var(--brand-gold)', flexShrink: 0 }} />
              <span>{lang === 'ar' ? 'التبرعات ونواقص الطلاب' : 'Donations & Need Requests'}</span>
            </Link>
          </div>

          {/* Drawer Footer */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.75rem', background: '#231810' }}>
            {user && user.email !== 'admin@smylodent.com' ? (
              <button
                className="btn btn-outline"
                style={{ flex: 1, color: '#FCA5A5', borderColor: 'rgba(252,165,165,0.4)' }}
                onClick={() => { signOut(); setMobileOpen(false); }}
              >
                <LogOut size={15} /> {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              </button>
            ) : (
              <Link to="/signin" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                <User size={15} /> {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )}
            <button
              className="btn btn-ghost"
              onClick={toggleLanguage}
              style={{ flexShrink: 0, color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Globe size={15} /> {lang === 'ar' ? 'EN' : 'ع'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      {/* ── LIGHT CREAM NAVBAR (MATCHING REFERENCE MOCKUP IN ARABIC RTL) ── */}
      <header className={`navbar navbar-reference-light ${scrolled ? 'scrolled' : ''} no-print`}>
        <div
          className="container navbar-inner"
          style={{
            direction: isRtl ? 'rtl' : 'ltr',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            height: '74px',
            paddingInline: '1.25rem'
          }}
        >
          {/* 1. RIGHT (in RTL): Menu Button + Logo + Brand Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {/* Hamburger Menu Button */}
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setMobileOpen(true)}
              aria-label={lang === 'ar' ? 'فتح القائمة الجانبية' : 'Open side menu'}
              title={lang === 'ar' ? 'القائمة الجانبية' : 'Menu'}
              style={{
                color: '#2C1A11',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0
              }}
            >
              <Menu size={24} strokeWidth={2.2} />
            </button>

            {/* Brand Logo & Name */}
            <Link
              to="/"
              className="navbar-logo"
              style={{
                textDecoration: 'none',
                alignItems: 'center',
                display: 'flex',
                gap: '10px',
                flexShrink: 0,
                margin: 0
              }}
            >
              <img
                src={brandLogoTrimmed}
                alt="Absolute Dental"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Cairo', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '0.01em',
                  color: '#2C1A11',
                  whiteSpace: 'nowrap',
                }}
              >
                Absolute Dental
              </span>
            </Link>
          </div>

          {/* 2. CENTER: Pill Search Input */}
          <form
            onSubmit={handleSearch}
            className="navbar-search navbar-center-search"
            style={{
              flex: '1 1 440px',
              maxWidth: '480px',
              marginInline: 'auto',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F0E9DF',
                borderRadius: '999px',
                border: '1px solid rgba(138, 108, 82, 0.16)',
                paddingInline: '1rem',
                height: '44px',
                width: '100%',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <Search size={18} style={{ color: '#7A6556', flexShrink: 0, marginInlineEnd: '0.65rem' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن أداة طبية...' : 'Search for dental instruments...'}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: '0.9rem',
                  color: '#2C1A11',
                  fontWeight: 600
                }}
              />
            </div>
          </form>

          {/* 3. LEFT (in RTL): Shopping Cart + Account with vertical labels */}
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.35rem', flexShrink: 0 }}>
            {/* Cart with Counter Badge + Label */}
            <Link
              to="/cart"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#2C1A11',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
              title={lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={22} strokeWidth={2} style={{ color: '#2C1A11' }} />
                <span
                  className="tabular-nums"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    backgroundColor: '#4A3525',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    minWidth: '17px',
                    height: '17px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                    lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                  }}
                >
                  {cartCount}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3E271D', marginTop: '3px' }}>
                {lang === 'ar' ? 'سلة المشتريات' : 'Cart'}
              </span>
            </Link>

            {/* Account with Label */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              {user && user.email !== 'admin@smylodent.com' ? (
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: '#2C1A11',
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                  title={lang === 'ar' ? 'حسابي' : 'Account'}
                >
                  <User size={22} strokeWidth={2} style={{ color: '#2C1A11' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3E271D', marginTop: '3px' }}>
                    {lang === 'ar' ? 'حسابي' : 'Account'}
                  </span>
                </button>
              ) : (
                <Link
                  to="/signin"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: '#2C1A11',
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                  title={lang === 'ar' ? 'حسابي' : 'Sign In'}
                >
                  <User size={22} strokeWidth={2} style={{ color: '#2C1A11' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3E271D', marginTop: '3px' }}>
                    {lang === 'ar' ? 'حسابي' : 'Account'}
                  </span>
                </Link>
              )}

              {/* Profile Dropdown */}
              {profileOpen && (
                <div
                  className="profile-dropdown-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    [isRtl ? 'left' : 'right']: 0,
                    width: 240,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #ECE4DA',
                    borderRadius: '14px',
                    boxShadow: '0 12px 32px rgba(35, 24, 16, 0.12)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    direction: isRtl ? 'rtl' : 'ltr'
                  }}
                >
                  <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid #F1EBE4', background: '#FAF7F2' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2C1A11' }}>
                      {profile?.full_name || user?.user_metadata?.full_name || user?.email}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7A6556', marginTop: '2px' }}>
                      {user?.email}
                    </div>
                  </div>
                  <div style={{ padding: '0.4rem' }}>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#2C1A11',
                        textDecoration: 'none',
                        borderRadius: '8px'
                      }}
                    >
                      <User size={16} /> {lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => { signOut(); setProfileOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#DC2626',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        textAlign: isRtl ? 'right' : 'left'
                      }}
                    >
                      <LogOut size={16} /> {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {renderSideDrawer()}
    </>
  );
};

export default Navbar;
