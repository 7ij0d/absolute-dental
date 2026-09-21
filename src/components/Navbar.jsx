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

  return (
    <>
      {/* ── NAVBAR ── */}
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner" style={{ direction: 'ltr' }}>

          {/* Logo + Brand */}
          <Link to="/" className="navbar-logo" style={{
            textDecoration: 'none',
            alignItems: 'center',
            display: 'flex',
            gap: '8px',
            flexShrink: 0,
          }}>
            <img
              src="https://vqrpodmnzubpcsvqohwj.supabase.co/storage/v1/object/public/smylodent-assets/brand/logo-icon.png"
              alt="Absolute Dental"
              style={{
                height: '42px',
                width: 'auto',
                maxHeight: '42px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            {/* BRAND TEXT */}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#ffffff',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}>Absolute</span>
              <span style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: 'var(--brand-gold)',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}>Dental</span>
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
              className="nav-icon-btn"
              title={lang === 'ar' ? 'السلة' : 'Cart'}
              style={{
                background: cartCount > 0 ? 'var(--secondary)' : 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '0.4rem 0.85rem',
                width: 'auto',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                boxShadow: cartCount > 0 ? '0 4px 12px rgba(205,191,166,0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingCart size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                {lang === 'ar' ? 'السلة' : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="nav-cart-badge" style={{ position: 'static', background: '#E53935', fontSize: '0.7rem', width: 18, height: 18 }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
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
          @media (min-width: 1200px) {
            #desktop-nav { display: flex !important; }
            #desktop-search { display: flex !important; }
            #mobile-menu-btn { display: none !important; }
            .navbar-actions { gap: 0.4rem; }
          }
          @media (max-width: 1199px) {
            #desktop-nav { display: none !important; }
            #desktop-search { display: none !important; }
            #mobile-menu-btn { display: flex !important; }
            .nav-icon-desktop-only { display: none !important; }
            .navbar-actions { gap: 0.35rem; flex-shrink: 0; }
          }
        `}</style>
      </header>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)} />
          <div className="mobile-menu-panel" style={{ marginRight: isRtl ? 'auto' : 0 }}>
            {/* Mobile Header */}
            <div className="mobile-menu-header">
              <span className="navbar-logo-text">Absolute Dental</span>
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
      )}
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

