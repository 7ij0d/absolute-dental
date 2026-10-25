import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight, ArrowRight, Lock, Layers } from 'lucide-react';

// Direct Vite Asset Imports (guarantees correct asset URLs on GitHub Pages & localhost)
import year1ArtWebp from '../assets/images/year-1-artwork.webp';
import year1ArtPng from '../assets/images/year-1-artwork.png';
import year2ArtWebp from '../assets/images/year-2-artwork.webp';
import year2ArtPng from '../assets/images/year-2-artwork.png';
import year3ArtWebp from '../assets/images/year-3-artwork.webp';
import year3ArtPng from '../assets/images/year-3-artwork.png';
import year4ArtWebp from '../assets/images/year-4-artwork.webp';
import year4ArtPng from '../assets/images/year-4-artwork.png';

const STUDY_YEARS = [
  {
    id: '1st-year',
    slug: '1st-year',
    titleAr: 'السنة الأولى',
    titleEn: '1st Year',
    descAr: 'المواد والأدوات الأساسية لبداية رحلتك في طب الأسنان.',
    descEn: 'Essential materials & tools to begin your dental journey.',
    href: '/year/1st-year',
    isComingSoon: false,
    webp: year1ArtWebp,
    png: year1ArtPng,
  },
  {
    id: '2nd-year',
    slug: '2nd-year',
    titleAr: 'السنة الثانية',
    titleEn: '2nd Year',
    descAr: 'الأدوات والمواد المتقدمة لمواصلة رحلتك في طب الأسنان.',
    descEn: 'Advanced tools & materials to continue your dental journey.',
    href: '/year/2nd-year',
    isComingSoon: false,
    webp: year2ArtWebp,
    png: year2ArtPng,
  },
  {
    id: '3rd-year',
    slug: '3rd-year',
    titleAr: 'السنة الثالثة',
    titleEn: '3rd Year',
    descAr: 'الأدوات والمواد السريرية والمعملية لمواصلة دراستك في طب الأسنان.',
    descEn: 'Clinical & laboratory tools and supplies for 3rd Year dental students.',
    href: '/year/3rd-year',
    isComingSoon: false,
    webp: year3ArtWebp,
    png: year3ArtPng,
  },
  {
    id: '4th-year',
    slug: '4th-year',
    titleAr: 'السنة الرابعة',
    titleEn: '4th Year',
    subtitleAr: 'قريباً...',
    subtitleEn: 'Coming Soon...',
    descAr: 'سيتم إضافة المواد قريباً.',
    descEn: 'Subjects and supplies will be added soon.',
    href: null,
    isComingSoon: true,
    webp: year4ArtWebp,
    png: year4ArtPng,
  },
];

export const StudyToolsPage = () => {
  const { lang, isRtl } = useLanguage();
  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="study-tools-page">
      <div className="container study-tools-container">

        {/* ── 1. SUBTLE CENTERED BREADCRUMB ── */}
        <nav aria-label="breadcrumb" className="study-tools-breadcrumb">
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </span>
        </nav>

        {/* ── 2. CENTERED HERO TITLE & SUBTITLE ── */}
        <header className="study-tools-header">
          <h1 className="study-tools-title">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </h1>
          <p className="study-tools-subtitle">
            {lang === 'ar'
              ? 'اختر سنتك الدراسية لتصفح المواد والأدوات المطلوبة.'
              : 'Choose your academic year to browse required subjects and tools.'}
          </p>
        </header>

        {/* ── 3. FOUR HIGH-FIDELITY YEAR CARDS ── */}
        <section className="study-tools-list" aria-label={lang === 'ar' ? 'قائمة السنوات الدراسية' : 'Academic Years'}>
          {STUDY_YEARS.map((year) => {
            const cardContent = (
              <>
                {/* Left Side: Title + Subtitle + Description + Action */}
                <div className="study-card-left">
                  <div className="study-card-text">
                    <div className="study-card-title-row">
                      <h2 className="study-card-title">
                        {lang === 'ar' ? year.titleAr : year.titleEn}
                      </h2>
                      {year.isComingSoon && (
                        <span className="study-card-soon-hint">
                          {lang === 'ar' ? year.subtitleAr : year.subtitleEn}
                        </span>
                      )}
                    </div>
                    <p className="study-card-desc">
                      {lang === 'ar' ? year.descAr : year.descEn}
                    </p>
                  </div>

                  {/* Action Element */}
                  <div className="study-card-action">
                    {year.isComingSoon ? (
                      <div className="study-pill-btn" aria-hidden="true">
                        <Lock size={13} strokeWidth={2.4} />
                        <span>Coming Soon</span>
                      </div>
                    ) : (
                      <div className="study-circle-btn" aria-hidden="true">
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: High-Resolution Photographic Artwork */}
                <div className="study-card-art">
                  <picture>
                    <source srcSet={year.webp} type="image/webp" />
                    <img
                      src={year.png}
                      alt={lang === 'ar' ? year.titleAr : year.titleEn}
                      loading="eager"
                      className="study-card-img"
                    />
                  </picture>
                </div>
              </>
            );

            if (year.isComingSoon) {
              return (
                <div
                  key={year.id}
                  className="study-year-card study-year-card-disabled"
                  aria-label={`${lang === 'ar' ? year.titleAr : year.titleEn} - Coming Soon`}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={year.id}
                to={year.href}
                className="study-year-card"
                aria-label={`${lang === 'ar' ? year.titleAr : year.titleEn} - ${lang === 'ar' ? year.descAr : year.descEn}`}
              >
                {cardContent}
              </Link>
            );
          })}

          {/* ── 4. OTHER SUPPLIES SECTION LINK (مستلزمات أخرى) ── */}
          <Link
            to="/other-supplies"
            className="study-other-supplies-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1.15rem 1.4rem',
              marginTop: '0.35rem',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #FFFDF9 0%, #F5EFE6 100%)',
              border: '1.5px solid #E5D9CA',
              boxShadow: '0 6px 20px rgba(74, 47, 29, 0.06)',
              textDecoration: 'none',
              direction: isRtl ? 'rtl' : 'ltr',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '13px',
                  backgroundColor: '#5B3A24',
                  color: '#FFF8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(91, 58, 36, 0.22)'
                }}
              >
                <Layers size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#3E2515' }}>
                  {lang === 'ar' ? 'مستلزمات أخرى' : 'Other Supplies'}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#786657', lineHeight: 1.4 }}>
                  {lang === 'ar'
                    ? 'القفازات، الكمامات، المستهلكات الطبية، والأدوات العامة للعيادة والمعمل.'
                    : 'Gloves, masks, clinical consumables, and general dental instruments.'}
                </p>
              </div>
            </div>

            <div className="study-circle-btn" aria-hidden="true" style={{ flexShrink: 0 }}>
              <ArrowRight size={18} strokeWidth={2.5} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
            </div>
          </Link>
        </section>

      </div>
    </div>
  );
};

export default StudyToolsPage;
