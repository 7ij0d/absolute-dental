import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import { ChevronLeft, ArrowRight, Clock } from 'lucide-react';

const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى', name_en: '1st Year', slug: '1st-year', sort_order: 1, is_coming_soon: false },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year', sort_order: 2, is_coming_soon: false },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year', sort_order: 3, is_coming_soon: true },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year', sort_order: 4, is_coming_soon: true },
];

const YEAR_2_SUBJECTS = [
  {
    slug: 'fixed-prosthodontics',
    title: 'Fixed Prosthodontics',
    titleLine1: 'Fixed',
    titleLine2: 'Prosthodontics',
    href: '/subject/fixed-prosthodontics',
    webp: '/images/fixed-prosthodontics-faded.webp',
    png: '/images/fixed-prosthodontics-faded.png',
  },
  {
    slug: 'removable-prosthodontics',
    title: 'Removable Prosthodontics',
    titleLine1: 'Removable',
    titleLine2: 'Prosthodontics',
    href: '/subject/removable-prosthodontics',
    webp: '/images/removable-prosthodontics-faded.webp',
    png: '/images/removable-prosthodontics-faded.png',
  },
  {
    slug: 'operative-dentistry',
    title: 'Operative Dentistry',
    titleLine1: 'Operative',
    titleLine2: 'Dentistry',
    href: '/subject/restorative-dentistry',
    webp: '/images/operative-dentistry-faded.webp',
    png: '/images/operative-dentistry-faded.png',
  },
];

const YEAR_1_SUBJECTS = [
  {
    slug: 'dental-anatomy',
    title: 'Dental Anatomy',
    titleLine1: 'Dental',
    titleLine2: 'Anatomy',
    href: '/subject/dental-anatomy',
    webp: '/images/dental-anatomy-faded.webp',
    png: '/images/dental-anatomy-faded.png',
  },
  {
    slug: 'dental-materials',
    title: 'Dental Materials',
    titleLine1: 'Dental',
    titleLine2: 'Materials',
    href: '/subject/dental-materials',
    webp: '/images/dental-materials-faded.webp',
    png: '/images/dental-materials-faded.png',
  },
];

export const YearPage = () => {
  const { slug } = useParams();
  const { lang, isRtl } = useLanguage();

  const [yearData, setYearData] = useState(() => DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0]);

  useEffect(() => {
    const CACHE_KEY = `year_v2:${slug}`;
    const fetchYear = async () => {
      try {
        const { data: yearRes } = await supabase
          .from('years').select('*').eq('slug', slug).single();
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
  }, [slug]);

  // ── COMING SOON VIEW (Year 3 & 4) ──
  if (yearData.is_coming_soon) {
    return (
      <div className="choose-subject-page">
        <div className="container choose-subject-container" style={{ maxWidth: '580px', paddingInline: '1rem' }}>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="subject-breadcrumb">
            <Link to="/" className="breadcrumb-link">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <ChevronLeft size={13} className="breadcrumb-separator" style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
            <Link to="/year/2nd-year" className="breadcrumb-link">{lang === 'ar' ? yearData.name_ar : yearData.name_en}</Link>
            <ChevronLeft size={13} className="breadcrumb-separator" style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
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
            <Link to="/year/2nd-year" className="btn btn-secondary">
              {lang === 'ar' ? 'تصفح السنة الثانية' : 'Browse 2nd Year'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Choose the dedicated subjects array
  const currentSubjects = slug === '2nd-year'
    ? YEAR_2_SUBJECTS
    : (slug === '1st-year' ? YEAR_1_SUBJECTS : YEAR_2_SUBJECTS);

  const yearDisplayName = lang === 'ar'
    ? (yearData?.name_ar || (slug === '2nd-year' ? 'السنة الثانية' : 'السنة الأولى'))
    : (yearData?.name_en || (slug === '2nd-year' ? '2nd Year' : '1st Year'));

  return (
    <div className="choose-subject-page">
      <div className="container choose-subject-container" style={{ maxWidth: '580px', paddingInline: '1.25rem' }}>

        {/* ── 1. BREADCRUMB (Calm, Subtle & RTL-Balanced) ── */}
        <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronLeft size={13} className="breadcrumb-separator" style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
          <Link to={`/year/${slug}`} className="breadcrumb-link" style={{ color: '#8C7E72' }}>
            {yearDisplayName}
          </Link>
          <ChevronLeft size={13} className="breadcrumb-separator" style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
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

        {/* ── 3. EXACT SUBJECT CARDS (VERTICAL MOBILE-FIRST CANVASES) ── */}
        <section className="year2-subject-list" aria-label="Subjects List">
          {currentSubjects.map((sub) => (
            <Link
              key={sub.slug}
              to={sub.href}
              className="year2-subject-card"
              aria-label={sub.title}
            >
              {/* Left Side: English Title Only + Solid Brown Circle Button */}
              <div className="year2-card-left">
                <h2 className="year2-card-title">
                  {sub.titleLine1}
                  <br />
                  {sub.titleLine2}
                </h2>
                <div className="year2-circle-btn" aria-hidden="true">
                  <ArrowRight size={18} strokeWidth={2.5} />
                </div>
              </div>

              {/* Right Side: High-Resolution Photographic Artwork with Smooth Alpha Fade */}
              <div className="year2-card-art">
                <picture>
                  <source srcSet={sub.webp} type="image/webp" />
                  <img
                    src={sub.png}
                    alt={sub.title}
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
