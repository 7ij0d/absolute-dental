import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight, ArrowRight, Lock } from 'lucide-react';

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
    titleEn: 'السنة الثانية',
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
        </section>

      </div>
    </div>
  );
};

export default StudyToolsPage;
