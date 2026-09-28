import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, User, Menu, X, Search, Globe,
  ChevronDown, LayoutDashboard, LogOut, ClipboardList,
  Heart, ChevronRight, ChevronLeft, BookOpen
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
  { id: '31', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'علاج الجذور', name_en: 'Endodontics', slug: 'endodontics' },
  { id: '32', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'أمراض وجراحة اللثة', name_en: 'Periodontics', slug: 'periodontics' },
  { id: '41', year_id: '40000000-0000-0000-0000-000000000004', name_ar: 'جراحة الفم والتخدير', name_en: 'Oral Surgery', slug: 'oral-surgery' },
  { id: '42', year_id: '40000000-0000-0000-0000-000000000004', name_ar: 'تقويم الأسنان', name_en: 'Orthodontics', slug: 'orthodontics' }
];

export const Navbar = () => {
  const { lang, t, toggleLanguage, isRtl } = useLanguage();
  const { cartCount } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();

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
  }, [location.pathname]);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getSubjectsForYear = (yearId) => subjects.filter(s => s.year_id === yearId);

  const isLightHeader = location.pathname.startsWith('/year') || location.pathname.startsWith('/subject') || location.pathname.startsWith('/product');

  const renderMobileDrawer = () => {
    if (!mobileOpen) return null;
    return (
      <div className="mobile-menu">
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)} />
        <div className="mobile-menu-panel" style={{ marginRight: isRtl ? 'auto' : 0 }}>
          {/* Mobile Header */}
          <div className="mobile-menu-header">
            <span className="navbar-logo-text" style={{ color: '#fff' }}>Absolute Dental</span>
            <button className="nav-icon-btn" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Mobile Search */}
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: isRtl ? 'auto' : '0.75rem', right: isRtl ? '0.75rem' : 'auto', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث...' : 'Search...'}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-full)',
                  padding: isRtl ? '0.55rem 2.5rem 0.55rem 1rem' : '0.55rem 1rem 0.55rem 2.5rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </form>

          {/* Mobile Links */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Link to="/" className="mobile-nav-link">
              {lang === 'ar' ? '🏠 الرئيسية' : '🏠 Home'}
            </Link>
            {years.map(year => (
              <Link key={year.id} to={`/year/${year.slug}`} className="mobile-nav-link">
                📚 {lang === 'ar' ? year.name_ar : year.name_en}
              </Link>
            ))}
            <Link to="/cart" className="mobile-nav-link">
              🛒 {lang === 'ar' ? 'سلة التسوق' : 'Cart'} {cartCount > 0 && `(${cartCount})`}
            </Link>
            <Link to="/favorites" className="mobile-nav-link">
              ❤️ {lang === 'ar' ? 'المفضلة' : 'Favorites'}
            </Link>
            <Link to="/track" className="mobile-nav-link">
              📦 {lang === 'ar' ? 'تتبع الطلب' : 'Track Order'}
            </Link>
            <Link to="/accessories" className="mobile-nav-link">
              🧰 {lang === 'ar' ? 'اكسسوارات الأسنان' : 'Dental Accessories'}
            </Link>
            <Link to="/contact" className="mobile-nav-link">
              💬 {lang === 'ar' ? 'تواصل معنا' : 'Contact'}
            </Link>
            <Link to="/donations" className="mobile-nav-link">
              🎁 {lang === 'ar' ? 'التبرعات ونواقص الطلاب' : 'Donations & Need Requests'}
            </Link>
          </div>

          {/* Mobile Footer */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
            {user ? (
              <button
                className="btn btn-outline"
                style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => { signOut(); setMobileOpen(false); }}
              >
                <LogOut size={15} /> {lang === 'ar' ? 'خروج' : 'Sign Out'}
              </button>
            ) : (
              <Link to="/signin" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                <User size={15} /> {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )}
            <button className="btn btn-ghost" onClick={toggleLanguage} style={{ flexShrink: 0 }}>
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
        {/* ── LIGHT NAVBAR (MATCHING REFERENCE MOCKUP) ── */}
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

            {/* Desktop Navigation Links (>= 900px) */}
            <nav className="navbar-nav navbar-light-nav" style={{ display: 'none' }} id="desktop-nav-light">
              <Link to="/" className="nav-link nav-light-link">
                {lang === 'ar' ? 'الرئيسية' : 'Home'}
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

            {/* Right: Search + Cart (Brown Badge 0) + Account */}
            <div className="navbar-actions navbar-light-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Search Button */}
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
                  borderRadius: '50%',
                }}
              >
                <Search size={21} strokeWidth={2} />
              </button>

              {/* Cart Button with Brown Badge Circle */}
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
                  borderRadius: '50%',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} strokeWidth={2} />
                  <span
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

              {/* Account Button */}
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
                  borderRadius: '50%',
                  textDecoration: 'none',
                }}
              >
                <User size={21} strokeWidth={2} />
              </Link>
            </div>

          </div>

          <style>{`
            @media (min-width: 900px) {
              #desktop-nav-light { display: flex !important; }
            }
          `}</style>
        </header>

        {/* Reusable Mobile Drawer */}
        {renderMobileDrawer()}
      </>
    );
  }

  return (
    <>
      {/* ── NAVBAR ── */}
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

          {/* Logo + Brand */}
          <Link to="/" className="navbar-logo" style={{
            textDecoration: 'none',
            alignItems: 'center',
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}>
            <img
              src={brandLogoTrimmed}
              alt="Absolute Dental"
              style={{
                width: 38,
                height: 38,
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
            <span style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '0.03em',
              color: '#ffffff',
              whiteSpace: 'nowrap',
            }}>
              Absolute Dental
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="navbar-nav" style={{ display: 'none' }} id="desktop-nav">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>

            {/* Mega Menu Trigger */}
            <div ref={megaRef} className="mega-menu-wrapper">
              <button
                className="nav-link"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => setMegaOpen(!megaOpen)}
              >
                <BookOpen size={14} />
                {lang === 'ar' ? 'المنتجات' : 'Products'}
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: megaOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {megaOpen && (
                <div className="mega-menu">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
                      {lang === 'ar' ? 'تصفح حسب السنة الدراسية' : 'Browse by Year'}
                    </span>
                    <Link
                      to="/year/1st-year"
                      style={{ color: '#CDBFA6', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setMegaOpen(false)}
                    >
                      {lang === 'ar' ? 'عرض الكل' : 'View all'}
                    </Link>
                  </div>
                  <div className="mega-menu-grid">
                    {years.map(year => (
                      <Link
                        key={year.id}
                        to={`/year/${year.slug}`}
                        className="mega-menu-year"
                        onClick={() => setMegaOpen(false)}
                      >
                        <div className="mega-menu-year-name">
                          {lang === 'ar' ? year.name_ar : year.name_en}
                        </div>
                        <div className="mega-menu-subjects">
                          {getSubjectsForYear(year.id).slice(0, 3).map(sub => (
                            <span
                              key={sub.id}
                              className="mega-menu-subject-tag"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/subject/${sub.slug}`); setMegaOpen(false); }}
                            >
                              {lang === 'ar' ? sub.name_ar : sub.name_en}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ))}

                    {/* Accessories Mega Menu Card */}
                    <Link
                      to="/accessories"
                      className="mega-menu-year"
                      style={{ borderInlineStart: '3px solid var(--secondary)', background: 'rgba(205,191,166,0.06)' }}
                      onClick={() => setMegaOpen(false)}
                    >
                      <div className="mega-menu-year-name" style={{ color: '#CDBFA6', fontWeight: 900 }}>
                        🧰 {lang === 'ar' ? 'إكسسوارات الأسنان' : 'Dental Accessories'}
                      </div>
                      <div className="mega-menu-subjects">
                        <span className="mega-menu-subject-tag" style={{ color: '#ffffff' }}>
                          {lang === 'ar' ? 'بوكسات أدوات، حقائب، مستلزمات عامة' : 'Tool boxes, bags & general gear'}
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/track" className={`nav-link ${location.pathname === '/track' ? 'active' : ''}`}>
              {lang === 'ar' ? 'تتبع الطلب' : 'Track Order'}
            </Link>
            <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
              {lang === 'ar' ? 'تواصل معنا' : 'Contact'}
            </Link>
            <Link to="/donations" className={`nav-link ${location.pathname === '/donations' ? 'active' : ''}`}>
              {lang === 'ar' ? 'التبرعات ونواقص الطلاب' : 'Donations & Need Requests'}
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="navbar-search" style={{ display: 'none' }} id="desktop-search">
            <Search size={15} className="navbar-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن أداة طبية...' : 'Search products...'}
            />
          </form>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Language Toggle — hidden on tablet, accessible via ☰ */}
            <button
              onClick={toggleLanguage}
              className="nav-icon-btn nav-icon-desktop-only"
              title={lang === 'ar' ? 'English' : 'العربية'}
            >
              <Globe size={18} />
            </button>

            {/* Favorites — hidden on tablet, accessible via ☰ */}
            <Link to="/favorites" className="nav-icon-btn nav-icon-desktop-only" title={lang === 'ar' ? 'المفضلة' : 'Favorites'}>
              <Heart size={18} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="nav-icon-btn nav-cart-btn"
              title={lang === 'ar' ? 'السلة' : 'Cart'}
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
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={22} />
                <span className="nav-cart-badge-circle" style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-7px',
                  backgroundColor: '#FFFFFF',
                  color: '#231810',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px',
                  lineHeight: 1,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}>
                  {cartCount}
                </span>
              </div>
              <span className="nav-cart-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                {lang === 'ar' ? 'السلة' : 'Cart'}
              </span>
            </Link>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="nav-icon-desktop-only" style={{ position: 'relative' }}>
              <button className="nav-icon-btn" onClick={() => setProfileOpen(!profileOpen)}>
                <User size={18} />
              </button>
              {profileOpen && (
                <div
                  className="animate-slide-down"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    left: 'auto',
                    width: 220,
                    maxWidth: 'calc(100vw - 1rem)',
                    background: 'var(--brand-brown)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    zIndex: 9999,
                  }}
                >
                  {user && user.email !== 'admin@smylodent.com' ? (
                    <>
                      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                          {profile?.full_name || user.email}
                        </p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{user.email}</p>
                      </div>
                      <Link to="/profile" style={dropItemStyle} onClick={() => setProfileOpen(false)}>
                        <User size={15} /> {lang === 'ar' ? 'حسابي' : 'My Account'}
                      </Link>
                      <Link to="/track" style={dropItemStyle} onClick={() => setProfileOpen(false)}>
                        <ClipboardList size={15} /> {lang === 'ar' ? 'طلباتي' : 'My Orders'}
                      </Link>
                      <button
                        style={{ ...dropItemStyle, width: '100%', color: 'var(--danger)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
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

            {/* Hamburger */}
            <button className="nav-icon-btn" onClick={() => setMobileOpen(true)} id="mobile-menu-btn">
              <Menu size={20} />
            </button>
          </div>
        </div>

        <style>{`
          @media (min-width: 900px) {
            #desktop-nav { display: flex !important; }
            #desktop-search { display: flex !important; }
            #mobile-menu-btn { display: none !important; }
            .navbar-actions { gap: 0.4rem; }
          }
          /* All mobile & tablet under 900px: hide desktop-only icons and cart text label */
          @media (max-width: 899px) {
            .nav-icon-desktop-only { display: none !important; }
            .nav-cart-label { display: none !important; }
            .navbar-actions { gap: 0.25rem; flex-shrink: 0; }
          }
        `}</style>
      </header>

      {/* ── MOBILE MENU ── */}
      {renderMobileDrawer()}
    </>
  );
};

const dropItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.7rem 1rem',
  color: 'rgba(255,255,255,0.75)',
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

