import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Phone, Mail, MapPin, MessageCircle, Send,
  Share2, ExternalLink, Heart, Truck
} from 'lucide-react';
import brandLogoTrimmed from '../assets/images/brand-logo-trimmed.png';

export const Footer = () => {
  const { lang, t, isRtl } = useLanguage();

  const currentYear = new Date().getFullYear();

  const quickLinks = lang === 'ar'
    ? [
        { label: 'الرئيسية',           to: '/' },
        { label: 'السنة الأولى',       to: '/year/1st-year' },
        { label: 'السنة الثانية',      to: '/year/2nd-year' },
        { label: 'السنة الثالثة',     to: '/year/3rd-year' },
        { label: 'السنة الرابعة',      to: '/year/4th-year' },
        { label: 'الإكسسوارات',       to: '/accessories' },
        { label: 'البوكسات',          to: '/boxes' },
        { label: 'التبرعات ونواقص الطلاب', to: '/donations' },
        { label: 'تتبع طلبك',          to: '/track' },
      ]
    : [
        { label: 'Home',                    to: '/' },
        { label: '1st Year',               to: '/year/1st-year' },
        { label: '2nd Year',               to: '/year/2nd-year' },
        { label: '3rd Year',               to: '/year/3rd-year' },
        { label: '4th Year',               to: '/year/4th-year' },
        { label: 'Accessories',            to: '/accessories' },
        { label: 'Boxes',                  to: '/boxes' },
        { label: 'Donations & Need Requests', to: '/donations' },
        { label: 'Track Order',            to: '/track' },
      ];

  const policyLinks = lang === 'ar'
    ? [
        { label: 'من نحن',            to: '/about' },
        { label: 'الأسئلة الشائعة',  to: '/faq' },
        { label: 'الشحن والإرجاع',   to: '/shipping-returns' },
        { label: 'تواصل معنا',        to: '/contact' },
      ]
    : [
        { label: 'About Us',          to: '/about' },
        { label: 'FAQ',               to: '/faq' },
        { label: 'Shipping & Returns', to: '/shipping-returns' },
        { label: 'Contact',           to: '/contact' },
      ];

  return (
    <footer className="footer no-print">
      <div className="container">
        <div className="footer-grid">

          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <img
                src={brandLogoTrimmed}
                alt="ابسلوت دنتال | Absolute Dental Logo"
                style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }}
              />
              <div className="footer-brand-name">Absolute Dental</div>
            </div>
            <p className="footer-desc">
              {lang === 'ar'
                ? 'ابسلوت دنتال (Absolute Dental) — متجرك الموثوق لجميع الأدوات والمستلزمات الطبية التي يحتاجها طلاب كلية طب الأسنان. جودة عالية، أسعار طلابية، توصيل سريع.'
                : 'Your trusted store for all medical tools and supplies needed by dental college students. High quality, student prices, fast delivery.'}
            </p>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.25rem' }}>
              <a
                href="https://wa.me/218946859163"
                target="_blank"
                rel="noreferrer"
                className="footer-nav-link tabular-nums"
              >
                <Phone size={14} /> 094-6859163 (واتساب وهاتف)
              </a>
              <a
                href="tel:0925813109"
                className="footer-nav-link tabular-nums"
              >
                <Phone size={14} /> 092-5813109 (احتياطي)
              </a>
              <a
                href="mailto:absolutedental.ly@gmail.com"
                className="footer-nav-link"
              >
                <Mail size={14} /> absolutedental.ly@gmail.com
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <MapPin size={14} /> {lang === 'ar' ? 'طرابلس، ليبيا' : 'Tripoli, Libya'}
              </span>
            </div>

            {/* Social Icons */}
            <div className="footer-social">
              <a href="https://wa.me/218946859163" target="_blank" rel="noreferrer" className="footer-social-btn" title="WhatsApp">
                <MessageCircle size={16} />
              </a>
              <a href="https://t.me/absolutedental_ly" target="_blank" rel="noreferrer" className="footer-social-btn" title="Telegram">
                <Send size={16} />
              </a>
              <a href="https://instagram.com/absolutedental.ly" target="_blank" rel="noreferrer" className="footer-social-btn" title="Instagram">
                <ExternalLink size={16} />
              </a>
              <a href="https://facebook.com/absolutedental.ly" target="_blank" rel="noreferrer" className="footer-social-btn" title="Facebook">
                <Share2 size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-heading">
              {lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <div className="footer-links">
              {quickLinks.map((link, i) => (
                <Link key={i} to={link.to} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Policy Links */}
          <div>
            <h4 className="footer-heading">
              {lang === 'ar' ? 'المساعدة والدعم' : 'Help & Support'}
            </h4>
            <div className="footer-links">
              {policyLinks.map((link, i) => (
                <Link key={i} to={link.to} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Delivery Info Box */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(205,191,166,0.12)',
              border: '1px solid rgba(205,191,166,0.28)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
            }}>
              <p style={{ color: '#CDBFA6', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Truck size={15} />
                <span>{lang === 'ar' ? 'معلومات التوصيل' : 'Delivery Info'}</span>
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {lang === 'ar'
                  ? 'كلية الأسنان: مجاناً\nداخل طرابلس: 15 د.ل\nضواحي طرابلس: 20 د.ل'
                  : 'Dental College: Free\nWithin Tripoli: 15 LYD\nTripoli suburbs: 20 LYD'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copy tabular-nums">
            © {currentYear} {lang === 'ar' ? 'ابسلوت دنتال | Absolute Dental — جميع الحقوق محفوظة' : 'Absolute Dental — All rights reserved'}
          </p>
          <p className="footer-copy" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {lang === 'ar' ? 'صُنع بـ' : 'Made with'}
            <Heart size={12} style={{ color: 'var(--secondary)' }} fill="var(--secondary)" />
            {lang === 'ar' ? 'لطلاب طب الأسنان في ليبيا' : 'for dental students in Libya'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

