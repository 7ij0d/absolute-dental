import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Phone, Mail, MapPin, MessageCircle, Send,
  Share2, ExternalLink, Heart
} from 'lucide-react';

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
        { label: 'تتبع طلبك',          to: '/track' },
      ]
    : [
        { label: 'Home',           to: '/' },
        { label: '1st Year',       to: '/year/1st-year' },
        { label: '2nd Year',       to: '/year/2nd-year' },
        { label: '3rd Year',       to: '/year/3rd-year' },
        { label: '4th Year',       to: '/year/4th-year' },
        { label: 'Track Order',    to: '/track' },
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
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, #CDBFA6, #A89A87)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 900, color: '#fff',
                boxShadow: '0 4px 12px rgba(205,191,166,0.4)',
              }}>
                S
              </div>
              <div className="footer-brand-name">سمايلودنت</div>
            </div>
            <p className="footer-desc">
              {lang === 'ar'
                ? 'متجرك الموثوق لجميع الأدوات والمستلزمات الطبية التي يحتاجها طلاب كلية طب الأسنان. جودة عالية، أسعار طلابية، توصيل سريع.'
                : 'Your trusted store for all medical tools and supplies needed by dental college students. High quality, student prices, fast delivery.'}
            </p>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.25rem' }}>
              <a
                href="https://wa.me/218911234567"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-dim)', fontSize: '0.85rem', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#25D366'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
              >
                <Phone size={14} /> 218-91-1234567+
              </a>
              <a
                href="mailto:smylodent@gmail.com"
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-dim)', fontSize: '0.85rem', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#CDBFA6'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
              >
                <Mail size={14} /> smylodent@gmail.com
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <MapPin size={14} /> {lang === 'ar' ? 'طرابلس، ليبيا' : 'Tripoli, Libya'}
              </span>
            </div>

            {/* Social Icons */}
            <div className="footer-social">
              <a href="https://wa.me/218911234567" target="_blank" rel="noreferrer" className="social-btn" title="WhatsApp"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                <MessageCircle size={16} />
              </a>
              <a href="https://t.me/smylodent_libya" target="_blank" rel="noreferrer" className="social-btn" title="Telegram"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0088cc'; e.currentTarget.style.borderColor = '#0088cc'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                <Send size={16} />
              </a>
              <a href="https://instagram.com/smylodent" target="_blank" rel="noreferrer" className="social-btn" title="Instagram"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E1306C'; e.currentTarget.style.borderColor = '#E1306C'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
              <ExternalLink size={16} />
              </a>
              <a href="https://facebook.com/smylodent" target="_blank" rel="noreferrer" className="social-btn" title="Facebook"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1877F2'; e.currentTarget.style.borderColor = '#1877F2'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
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
              background: 'rgba(205,191,166,0.15)',
              border: '1px solid rgba(205,191,166,0.3)',
              borderRadius: 'var(--radius-md)',
            }}>
              <p style={{ color: '#CDBFA6', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                🚚 {lang === 'ar' ? 'معلومات التوصيل' : 'Delivery Info'}
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', lineHeight: 1.6 }}>
                {lang === 'ar'
                  ? 'كلية الأسنان: مجاناً\nداخل طرابلس: 15 د.ل\nضواحي طرابلس: 20 د.ل'
                  : 'Dental College: Free\nWithin Tripoli: 15 LYD\nTripoli suburbs: 20 LYD'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} سمايلودنت — {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
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

