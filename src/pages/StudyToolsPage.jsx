import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Lock, Sparkles } from 'lucide-react';

// Direct Vite Asset Imports (independent project assets in src/assets/images/)
import year1ArtWebp from '../assets/images/year-1-artwork.webp';
import year1ArtPng from '../assets/images/year-1-artwork.png';
import year2ArtWebp from '../assets/images/year-2-artwork.webp';
import year2ArtPng from '../assets/images/year-2-artwork.png';
import year3ArtWebp from '../assets/images/year-3-artwork.webp';
import year3ArtPng from '../assets/images/year-3-artwork.png';
import year4ArtWebp from '../assets/images/year-4-artwork.webp';
import year4ArtPng from '../assets/images/year-4-artwork.png';
import otherSuppliesWebp from '../assets/images/other-supplies-artwork.webp';
import otherSuppliesPng from '../assets/images/other-supplies-artwork.png';

const STUDY_YEARS = [
  {
    id: '1st-year',
    slug: '1st-year',
    stepNum: '01',
    badgeAr: 'السنة الدراسية الأولى',
    badgeEn: 'Academic Year 01',
    titleAr: 'السنة الأولى',
    titleEn: '1st Year',
    descAr: 'المواد والأدوات الأساسية لبداية رحلتك في طب الأسنان.',
    descEn: 'Essential materials & tools to begin your dental journey.',
    ctaAr: 'تصفح المواد',
    ctaEn: 'Browse Subjects',
    href: '/year/1st-year',
    isComingSoon: false,
    webp: year1ArtWebp,
    png: year1ArtPng,
  },
  {
    id: '2nd-year',
    slug: '2nd-year',
    stepNum: '02',
    badgeAr: 'السنة الدراسية الثانية',
    badgeEn: 'Academic Year 02',
    titleAr: 'السنة الثانية',
    titleEn: '2nd Year',
    descAr: 'الأدوات والمواد المتقدمة لمواصلة رحلتك في طب الأسنان.',
    descEn: 'Advanced tools & materials to continue your dental journey.',
    ctaAr: 'تصفح المواد',
    ctaEn: 'Browse Subjects',
    href: '/year/2nd-year',
    isComingSoon: false,
    webp: year2ArtWebp,
    png: year2ArtPng,
  },
  {
    id: '3rd-year',
    slug: '3rd-year',
    stepNum: '03',
    badgeAr: 'السنة الدراسية الثالثة',
    badgeEn: 'Academic Year 03',
    titleAr: 'السنة الثالثة',
    titleEn: '3rd Year',
    descAr: 'الأدوات والمواد السريرية والمعملية لمواصلة دراستك في طب الأسنان.',
    descEn: 'Clinical & laboratory tools and supplies for 3rd Year dental students.',
    ctaAr: 'تصفح المواد',
    ctaEn: 'Browse Subjects',
    href: '/year/3rd-year',
    isComingSoon: false,
    webp: year3ArtWebp,
    png: year3ArtPng,
  },
  {
    id: '4th-year',
    slug: '4th-year',
    stepNum: '04',
    badgeAr: 'السنة الدراسية الرابعة',
    badgeEn: 'Academic Year 04',
    titleAr: 'السنة الرابعة',
    titleEn: '4th Year',
    subtitleAr: 'قريباً',
    subtitleEn: 'Coming Soon',
    descAr: 'سيتم إضافة المواد والأدوات الخاصة بالسنة الرابعة قريباً.',
    descEn: 'Subjects and supplies for 4th Year will be added soon.',
    href: '/year/4th-year',
    isComingSoon: true,
    webp: year4ArtWebp,
    png: year4ArtPng,
  },
];

export const StudyToolsPage = () => {
  const { lang, isRtl } = useLanguage();
  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="study-tools-page" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container study-tools-container">

        {/* ── 1. CENTERED BREADCRUMB ── */}
        <nav aria-label="breadcrumb" className="study-tools-breadcrumb">
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </span>
        </nav>

        {/* ── 2. PAGE HEADER ── */}
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

        {/* ── 3. FOUR UNIFORM ACADEMIC YEAR CARDS (2x2 Grid on Desktop/iPad, 1-Col on Mobile) ── */}
        <section
          className="study-years-grid"
          aria-label={lang === 'ar' ? 'السنوات الدراسية' : 'Academic Years'}
        >
          {STUDY_YEARS.map((year) => {
            const innerCard = (
              <>
                {/* Dedicated Text Column — Strictly separated from image container */}
                <div className="study-year-card__body">
                  <div className="study-year-card__top">
                    <div className="study-year-card__meta">
                      <span className="study-year-card__step-badge">
                        {lang === 'ar' ? year.badgeAr : year.badgeEn}
                      </span>
                      {year.isComingSoon && (
                        <span className="study-year-card__soon-tag">
                          {lang === 'ar' ? year.subtitleAr : year.subtitleEn}
                        </span>
                      )}
                    </div>

                    <h2 className="study-year-card__title">
                      {lang === 'ar' ? year.titleAr : year.titleEn}
                    </h2>

                    <p className="study-year-card__desc">
                      {lang === 'ar' ? year.descAr : year.descEn}
                    </p>
                  </div>

                  <div className="study-year-card__footer">
                    {year.isComingSoon ? (
                      <div className="study-year-card__locked-pill" aria-hidden="true">
                        <Lock size={13} strokeWidth={2.3} />
                        <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                      </div>
                    ) : (
                      <div className="study-year-card__cta" aria-hidden="true">
                        <span className="study-year-card__cta-label">
                          {lang === 'ar' ? year.ctaAr : year.ctaEn}
                        </span>
                        <span className="study-year-card__cta-icon">
                          <ActionArrow size={16} strokeWidth={2.5} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dedicated Framed Image Column — Fixed aspect ratio, never overlaps text */}
                <div className="study-year-card__media">
                  <picture className="study-year-card__picture">
                    <source srcSet={year.webp} type="image/webp" />
                    <img
                      src={year.png}
                      alt={lang === 'ar' ? year.titleAr : year.titleEn}
                      loading="eager"
                      className="study-year-card__img"
                    />
                  </picture>
                </div>
              </>
            );

            if (year.isComingSoon) {
              return (
                <Link
                  key={year.id}
                  to={year.href || '/year/4th-year'}
                  className="study-year-card study-year-card--disabled"
                  aria-label={`${lang === 'ar' ? year.titleAr : year.titleEn} - ${lang === 'ar' ? 'قريباً' : 'Coming Soon'}`}
                  style={{ textDecoration: 'none' }}
                >
                  {innerCard}
                </Link>
              );
            }

            return (
              <Link
                key={year.id}
                to={year.href}
                className="study-year-card"
                aria-label={`${lang === 'ar' ? year.titleAr : year.titleEn} - ${lang === 'ar' ? year.descAr : year.descEn}`}
              >
                {innerCard}
              </Link>
            );
          })}
        </section>

        {/* ── 4. REDESIGNED «مستلزمات أخرى» BANNER (Cohesive Full-Width Banner Below Years) ── */}
        <section
          className="study-other-banner-section"
          aria-label={lang === 'ar' ? 'مستلزمات أخرى' : 'Other Supplies'}
        >
          <Link
            to="/other-supplies"
            className="study-other-banner"
            aria-label={
              lang === 'ar'
                ? 'مستلزمات أخرى - مستلزمات يحتاجها طلبة طب الأسنان في مختلف السنوات - عرض جميع المستلزمات'
                : 'Other Supplies - Supplies needed by dental students across different years - View All Supplies'
            }
          >
            {/* Text & CTA Column */}
            <div className="study-other-banner__body">
              <div className="study-other-banner__top">
                <div className="study-other-banner__badges">
                  <span className="study-other-banner__eyebrow">
                    <Sparkles size={13} strokeWidth={2.4} />
                    <span>{lang === 'ar' ? 'قسم عام لجميع السنوات' : 'General Supplies for All Years'}</span>
                  </span>
                  <div className="study-other-banner__pills" aria-hidden="true">
                    <span className="study-other-banner__pill">
                      {lang === 'ar' ? 'قفازات طبية' : 'Gloves'}
                    </span>
                    <span className="study-other-banner__pill">
                      {lang === 'ar' ? 'ماسك طبي' : 'Face Masks'}
                    </span>
                    <span className="study-other-banner__pill">
                      Cover Sheet
                    </span>
                  </div>
                </div>

                <h2 className="study-other-banner__title">
                  {lang === 'ar' ? 'مستلزمات أخرى' : 'Other Supplies'}
                </h2>

                <p className="study-other-banner__desc">
                  {lang === 'ar'
                    ? 'مستلزمات يحتاجها طلبة طب الأسنان في مختلف السنوات'
                    : 'Supplies needed by dental students across different academic years'}
                </p>
              </div>

              <div className="study-other-banner__actions">
                <span className="study-other-banner__btn">
                  <span>{lang === 'ar' ? 'عرض جميع المستلزمات' : 'View All Supplies'}</span>
                  <ActionArrow size={17} strokeWidth={2.5} />
                </span>
              </div>
            </div>

            {/* Dedicated Framed Studio Image Column */}
            <div className="study-other-banner__media">
              <picture className="study-other-banner__picture">
                <source srcSet={otherSuppliesWebp} type="image/webp" />
                <img
                  src={otherSuppliesPng}
                  alt={lang === 'ar' ? 'مستلزمات أخرى - قفازات وماسك و Cover Sheet' : 'Other Supplies - Gloves, Masks, and Cover Sheets'}
                  loading="eager"
                  className="study-other-banner__img"
                />
              </picture>
            </div>
          </Link>
        </section>

      </div>
    </div>
  );
};

export default StudyToolsPage;
