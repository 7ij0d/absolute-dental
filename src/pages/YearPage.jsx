import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import { ChevronLeft, ChevronRight, ArrowRight, Clock } from 'lucide-react';

// Direct Vite Asset Imports (guarantees correct base URL on GitHub Pages & localhost)
import dentalAnatomyWebp from '../assets/images/dental-anatomy-faded.webp';
import dentalAnatomyPng from '../assets/images/dental-anatomy-faded.png';
import dentalMaterialsWebp from '../assets/images/dental-materials-faded.webp';
import dentalMaterialsPng from '../assets/images/dental-materials-faded.png';

import fixedProsthoWebp from '../assets/images/fixed-prosthodontics-faded.webp';
import fixedProsthoPng from '../assets/images/fixed-prosthodontics-faded.png';
import removableProsthoWebp from '../assets/images/removable-prosthodontics-faded.webp';
import removableProsthoPng from '../assets/images/removable-prosthodontics-faded.png';
import operativeDentWebp from '../assets/images/operative-dentistry-faded.webp';
import operativeDentPng from '../assets/images/operative-dentistry-faded.png';

const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى', name_en: '1st Year', slug: '1st-year', sort_order: 1, is_coming_soon: false },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year', sort_order: 2, is_coming_soon: false },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year', sort_order: 3, is_coming_soon: true },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year', sort_order: 4, is_coming_soon: true },
];

const YEAR_1_SUBJECTS = [
  {
    slug: 'dental-anatomy',
    titleAr: 'تشريح الأسنان',
    titleEn: 'Dental Anatomy',
    href: '/subject/dental-anatomy',
    webp: dentalAnatomyWebp,
    png: dentalAnatomyPng,
  },
  {
    slug: 'dental-materials',
    titleAr: 'مواد طب الأسنان',
    titleEn: 'Dental Materials',
    href: '/subject/dental-materials',
    webp: dentalMaterialsWebp,
    png: dentalMaterialsPng,
  },
];

const YEAR_2_SUBJECTS = [
  {
    slug: 'fixed-prosthodontics',
    titleAr: 'صناعة الأسنان الثابتة',
    titleEn: 'Fixed Prosthodontics',
    href: '/subject/fixed-prosthodontics',
    webp: fixedProsthoWebp,
    png: fixedProsthoPng,
  },
  {
    slug: 'removable-prosthodontics',
    titleAr: 'صناعة الأسنان المتحركة',
    titleEn: 'Removable Prosthodontics',
    href: '/subject/removable-prosthodontics',
    webp: removableProsthoWebp,
    png: removableProsthoPng,
  },
  {
    slug: 'operative-dentistry',
    titleAr: 'علاج الأسنان التحفظي',
    titleEn: 'Operative Dentistry',
    href: '/subject/restorative-dentistry',
    webp: operativeDentWebp,
    png: operativeDentPng,
  },
];

export const YearPage = () => {
  const { slug } = useParams();
  const { lang, isRtl } = useLanguage();

  const isYear2 = slug === '2nd-year' || slug === '2nd' || slug?.startsWith('2');
  const isYear1 = !isYear2;

  const defaultYear = isYear2 ? DEFAULT_YEARS[1] : DEFAULT_YEARS[0];
  const [yearData, setYearData] = useState(() => DEFAULT_YEARS.find(y => y.slug === slug) || defaultYear);

  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    const targetSlug = isYear2 ? '2nd-year' : '1st-year';
    const CACHE_KEY = `year_v3:${targetSlug}`;

    const fetchYear = async () => {
      try {
        const { data: yearRes } = await supabase
          .from('years').select('*').eq('slug', targetSlug).single();
        if (yearRes) {
          setYearData(yearRes);
          cacheSet(CACHE_KEY, yearRes, 5 * 60);
        }
      } catch (err) {
        console.warn('YearPage fetch warning, using defaults:', err);
      }
    };

    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      setYearData(cached);
      fetchYear();
    } else {
      fetchYear();
    }
  }, [slug, isYear2]);

  // ── COMING SOON VIEW (Year 3 & 4) ──
  if (yearData.is_coming_soon) {
    return (
      <div className="choose-subject-page">
        <div className="container choose-subject-container">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <Link to="/" className="breadcrumb-link">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <ChevronSep size={13} className="breadcrumb-separator" />
            <Link to="/year/1st-year" className="breadcrumb-link">{lang === 'ar' ? yearData.name_ar : yearData.name_en}</Link>
            <ChevronSep size={13} className="breadcrumb-separator" />
            <span className="breadcrumb-current">
              {lang === 'ar' ? 'اختر المادة' : 'Choose Subject'}
            </span>
          </nav>

          <div className="coming-soon-card">
            <div className="coming-soon-icon-box">
              <Clock size={36} />
            </div>
            <h1 className="coming-soon-title">
              {lang === 'ar' ? `${yearData.name_ar} — قريباً` : `${yearData.name_en} — Coming Soon`}
            </h1>
            <p className="coming-soon-desc">
              {lang === 'ar'
                ? 'نعمل حالياً على تجهيز وفهرسة كافة الأدوات والمواد المطلوبة لهذه السنة الدراسية.'
                : 'We are currently preparing and indexing all required tools and supplies for this academic year.'}
            </p>
            <Link to="/year/1st-year" className="btn btn-secondary">
              {lang === 'ar' ? 'تصفح السنة الأولى' : 'Browse 1st Year'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSubjects = isYear2 ? YEAR_2_SUBJECTS : YEAR_1_SUBJECTS;

  const yearDisplayName = lang === 'ar'
    ? (yearData?.name_ar || (isYear2 ? 'السنة الثانية' : 'السنة الأولى'))
    : (yearData?.name_en || (isYear2 ? '2nd Year' : '1st Year'));

  return (
    <div className="choose-subject-page">
      <div className="container choose-subject-container">

        {/* ── 1. BREADCRUMB (Calm, Subtle & RTL-Balanced) ── */}
        <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to={`/year/${isYear2 ? '2nd-year' : '1st-year'}`} className="breadcrumb-link" style={{ color: '#8C7E72' }}>
            {yearDisplayName}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {lang === 'ar' ? 'اختر المادة' : 'Choose Subject'}
          </span>
        </nav>

        {/* ── 2. HERO HEADING ── */}
        <header className="subject-hero-header" style={{ textAlign: isRtl ? 'right' : 'left', direction: isRtl ? 'rtl' : 'ltr' }}>
          <h1 className="subject-page-title">
            {lang === 'ar' ? 'اختر المادة' : 'Choose Subject'}
          </h1>
          <p className="subject-page-subtitle">
            {lang === 'ar'
              ? 'لتصفح الأدوات المطلوبة لكل مادة.'
              : 'Browse required tools and supplies for each subject.'}
          </p>
        </header>

        {/* ── 3. EXACT SUBJECT CARDS (LARGE FULL-WIDTH MOBILE-FIRST CANVASES) ── */}
        <section className="year-subject-list" aria-label="Subjects List">
          {currentSubjects.map((sub) => (
            <Link
              key={sub.slug}
              to={sub.href}
              className="year-subject-card"
              aria-label={`${sub.titleAr} - ${sub.titleEn}`}
            >
              {/* Left Side: Arabic Title + English Title + Solid Brown Circle Button */}
              <div className="year-card-left">
                <div className="year-card-titles">
                  <h3 className="year-card-title-ar">{sub.titleAr}</h3>
                  <h2 className="year-card-title-en">{sub.titleEn}</h2>
                </div>
                <div className="year-circle-btn" aria-hidden="true">
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
              </div>

              {/* Right Side: High-Resolution Photographic Artwork with Smooth Alpha Fade */}
              <div className="year-card-art">
                <picture>
                  <source srcSet={sub.webp} type="image/webp" />
                  <img
                    src={sub.png}
                    alt={sub.titleEn}
                    loading="eager"
                  />
                </picture>
              </div>
            </Link>
          ))}
        </section>

      </div>
    </div>
  );
};

export default YearPage;
