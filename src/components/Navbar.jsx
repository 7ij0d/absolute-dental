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

  if (isLightHeader) {
    return (
      <>
        {/* ── LIGHT NAVBAR (STOREFRONT INNER PAGES) ── */}
        <header className={`navbar navbar-light-theme ${scrolled ? 'scrolled' : ''}`}>
          <div className="container navbar-inner navbar-light-inner" style={{ direction: 'ltr' }}>

            {/* Left: Menu Hamburger + Brand (AD Monogram + Absolute Dental) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                className="nav-icon-btn nav-light-menu-btn"
                onClick={() => setMobileOpen(true)}
                aria-label="Menu"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1E140E',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                <Menu size={22} strokeWidth={2.2} />
              </button>

              <Link
                to="/"
                className="navbar-logo"
                style={{
                  textDecoration: 'none',
                  alignItems: 'center',
                  display: 'flex',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={brandLogoTrimmed}
                  alt="Absolute Dental"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    letterSpacing: '0.01em',
                    color: '#1E140E',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Absolute Dental
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links (>= 1080px) */}
            <nav className="navbar-nav navbar-light-nav" style={{ display: 'none' }} id="desktop-nav-light">
              <Link to="/" className="nav-link nav-light-link">
                {lang === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <Link to="/study-tools" className={`nav-link nav-light-link ${location.pathname.startsWith('/study-tools') || location.pathname.startsWith('/years') ? 'active' : ''}`}>
                {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
              </Link>
              <Link to="/year/1st-year" className={`nav-link nav-light-link ${location.pathname === '/year/1st-year' ? 'active' : ''}`}>
                {lang === 'ar' ? 'السنة الأولى' : '1st Year'}
              </Link>
              <Link to="/year/2nd-year" className={`nav-link nav-light-link ${location.pathname === '/year/2nd-year' ? 'active' : ''}`}>
                {lang === 'ar' ? 'السنة الثانية' : '2nd Year'}
              </Link>
              <Link to="/accessories" className={`nav-link nav-light-link ${location.pathname === '/accessories' ? 'active' : ''}`}>
                {lang === 'ar' ? 'إكسسوارات الأسنان' : 'Accessories'}
              </Link>
              <Link to="/donations" className={`nav-link nav-light-link ${location.pathname === '/donations' ? 'active' : ''}`}>
                {lang === 'ar' ? 'التبرعات' : 'Donations'}
              </Link>
            </nav>

            {/* Right: Search + Language + Favorites + Cart (Brown Badge) + Account */}
            <div className="navbar-actions navbar-light-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                onClick={() => navigate('/search')}
                className="nav-icon-btn nav-light-btn"
                title={lang === 'ar' ? 'بحث' : 'Search'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1E140E',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                <Search size={20} strokeWidth={2} />
              </button>

              <button
                onClick={toggleLanguage}
                className="nav-icon-btn nav-light-btn nav-icon-desktop-only"
                title={lang === 'ar' ? 'English' : 'العربية'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1E140E',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                <Globe size={19} strokeWidth={2} />
              </button>

              <Link
                to="/favorites"
                className="nav-icon-btn nav-light-btn nav-icon-desktop-only"
                title={lang === 'ar' ? 'المفضلة' : 'Favorites'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1E140E',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  borderRadius: '8px',
                }}
              >
                <Heart size={19} strokeWidth={2} />
              </Link>

              <Link
                to="/cart"
                className="nav-icon-btn nav-light-btn"
                title={lang === 'ar' ? 'السلة' : 'Cart'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1E140E',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  position: 'relative',
                  borderRadius: '8px',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={21} strokeWidth={2} />
                  <span
                    className="tabular-nums"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      backgroundColor: '#684835',
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
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    {cartCount}
                  </span>
                </div>
              </Link>

              <Link
                to={user && user.email !== 'admin@smylodent.com' ? '/profile' : '/signin'}
                className="nav-icon-btn nav-light-btn"
                title={lang === 'ar' ? 'حسابي' : 'Account'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1E140E',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                <User size={20} strokeWidth={2} />
              </Link>
            </div>

          </div>

          <style>{`
            @media (min-width: 1080px) {
              #desktop-nav-light { display: flex !important; }
            }
            @media (max-width: 1079px) {
              #desktop-nav-light { display: none !important; }
              .nav-icon-desktop-only { display: none !important; }
            }
          `}</style>
        </header>

        {renderSideDrawer()}
      </>
    );
  }

  return (
    <>
      {/* ── DARK BROWN NAVBAR (MATCHING REFERENCE MOCKUP ON LAPTOP, IPAD & PHONE) ── */}
      <header className={`navbar navbar-reference-brown ${scrolled ? 'scrolled' : ''} no-print`}>
        <div
          className="container navbar-inner"
          style={{
            direction: isRtl ? 'rtl' : 'ltr',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
            height: '66px'
          }}
        >
          {/* Start Group: Logo + Brand + Hamburger Button (☰) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
            <Link
              to="/"
              className="navbar-logo"
              style={{
                textDecoration: 'none',
                alignItems: 'center',
                display: 'flex',
                gap: '9px',
                flexShrink: 0,
                margin: 0
              }}
            >
              <img
                src={brandLogoTrimmed}
                alt="Absolute Dental"
                style={{
                  width: 34,
                  height: 34,
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-ar)",
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  letterSpacing: '0.01em',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                }}
              >
                Absolute Dental
              </span>
            </Link>

            {/* Hamburger Menu Button (☰) — works on Phone, iPad, and Laptop */}
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setMobileOpen(true)}
              aria-label={lang === 'ar' ? 'فتح القائمة الجانبية' : 'Open side menu'}
              title={lang === 'ar' ? 'القائمة الجانبية' : 'Menu'}
              style={{
                color: '#FFFFFF',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Menu size={20} strokeWidth={2.2} />
            </button>
          </div>

          {/* Center: Pill Search Input (visible on Laptop & iPad) */}
          <form
            onSubmit={handleSearch}
            className="navbar-search navbar-center-search"
            style={{
              flex: '1 1 420px',
              maxWidth: '460px',
              marginInline: 'auto'
            }}
          >
            <Search size={15} className="navbar-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن أداة طبية...' : 'Search dental tools...'}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                height: '38px',
                fontSize: '0.85rem'
              }}
            />
          </form>

          {/* End Group: Mobile Search Icon + Cart with Counter + Account Icon */}
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {/* Phone Quick Search Icon */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="nav-icon-btn nav-phone-search-btn"
              title={lang === 'ar' ? 'بحث' : 'Search'}
              style={{ color: '#FFFFFF' }}
            >
              <Search size={19} />
            </button>

            {/* Cart Icon with Counter Badge */}
            <Link
              to="/cart"
              className="nav-icon-btn nav-cart-btn"
              title={lang === 'ar' ? 'سلة التسوق' : 'Cart'}
              style={{
                background: 'transparent',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '0.35rem 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={21} />
                <span
                  className="nav-cart-badge-circle tabular-nums"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-7px',
                    backgroundColor: '#D4A853',
                    color: '#1E140E',
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
                    boxShadow: '0 2px 5px rgba(0,0,0,0.35)'
                  }}
                >
                  {cartCount}
                </span>
              </div>
            </Link>

            {/* User Account Menu / Icon */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              {user && user.email !== 'admin@smylodent.com' ? (
                <button
                  type="button"
                  className="nav-user-pill-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label={lang === 'ar' ? 'حساب المستخدم' : 'User Account'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.22rem 0.65rem 0.22rem 0.25rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
                    {profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture}
                        alt="Avatar"
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: '#684835',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
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
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        border: '1.5px solid #231810',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'Cairo, sans-serif',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      maxWidth: 85,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {(profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '').split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="nav-icon-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label={lang === 'ar' ? 'حساب المستخدم' : 'User Account'}
                  style={{ color: '#FFFFFF' }}
                >
                  <User size={20} />
                </button>
              )}

              {profileOpen && (
                <div
                  className="animate-slide-down"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    insetInlineEnd: 0,
                    width: 240,
                    maxWidth: 'calc(100vw - 1rem)',
                    background: '#2A1D15',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 40px rgba(0,0,0,0.45)',
                    overflow: 'hidden',
                    zIndex: 9999,
                  }}
                >
                  {user && user.email !== 'admin@smylodent.com' ? (
                    <>
                      <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>
                          {profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                        </p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>{user.email}</p>
                        {profile?.phone && (
                          <p style={{ color: '#CDBFA6', fontSize: '0.74rem', margin: '0.15rem 0 0 0', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                            📱 {profile.phone}
                          </p>
                        )}
                      </div>

                      {(!profile?.phone || !profile.phone.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            if (openProfileCompletion) openProfileCompletion();
                          }}
                          style={{
                            ...dropItemStyle,
                            width: '100%',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#FBBF24',
                            fontWeight: 800,
                          }}
                        >
                          <Phone size={15} /> {lang === 'ar' ? 'إضافة رقم الواتساب' : 'Add WhatsApp'}
                        </button>
                      )}

                      <Link to="/profile" style={dropItemStyle} onClick={() => setProfileOpen(false)}>
                        <User size={15} /> {lang === 'ar' ? 'حسابي وبياناتي' : 'My Profile'}
                      </Link>
                      <Link to="/track" style={dropItemStyle} onClick={() => setProfileOpen(false)}>
                        <ClipboardList size={15} /> {lang === 'ar' ? 'طلباتي' : 'My Orders'}
                      </Link>
                      <button
                        style={{ ...dropItemStyle, width: '100%', color: '#FCA5A5', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        onClick={() => { signOut(); setProfileOpen(false); }}
                      >
                        <LogOut size={15} /> {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/signin" style={dropItemStyle} onClick={() => setProfileOpen(false)}>
                        <User size={15} /> {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                      </Link>
                      <Link to="/signin?tab=register" style={{ ...dropItemStyle, color: '#CDBFA6' }} onClick={() => setProfileOpen(false)}>
                        <ClipboardList size={15} /> {lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .navbar-reference-brown {
            background: linear-gradient(90deg, #24170F 0%, #382519 50%, #24170F 100%) !important;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          @media (min-width: 680px) {
            .navbar-center-search { display: block !important; }
            .nav-phone-search-btn { display: none !important; }
          }
          @media (max-width: 679px) {
            .navbar-center-search { display: none !important; }
            .nav-phone-search-btn { display: flex !important; }
          }
        `}</style>
      </header>

      {/* ── SIDE DRAWER MENU (CLOSED BY DEFAULT, OPENS ON ☰) ── */}
      {renderSideDrawer()}
    </>
  );
};

const dropItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.7rem 1rem',
  color: 'rgba(255,255,255,0.82)',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'all 0.15s ease',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'start',
  textDecoration: 'none',
};

export default Navbar;

