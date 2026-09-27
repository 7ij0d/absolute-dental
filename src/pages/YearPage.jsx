import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import { GraduationCap, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Clock, Lock } from 'lucide-react';

const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى', name_en: '1st Year', slug: '1st-year', sort_order: 1, is_coming_soon: false },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year', sort_order: 2, is_coming_soon: false },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year', sort_order: 3, is_coming_soon: true },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year', sort_order: 4, is_coming_soon: true },
];

const SUBJECT_METADATA = {
  'dental-anatomy': {
    name_ar: 'تشريح الأسنان',
    name_en: 'Dental Anatomy',
    webp: '/images/dental-anatomy-faded.webp',
    png: '/images/dental-anatomy-faded.png',
  },
  'dental-materials': {
    name_ar: 'مواد طب الأسنان',
    name_en: 'Dental Materials',
    webp: '/images/dental-materials-faded.webp',
    png: '/images/dental-materials-faded.png',
  },
  'fixed-prosthodontics': {
    name_ar: 'صناعة الأسنان الثابتة',
    name_en: 'Fixed Prosthodontics',
    webp: '/images/fixed-prosthodontics-faded.webp',
    png: '/images/fixed-prosthodontics-faded.png',
  },
  'removable-prosthodontics': {
    name_ar: 'صناعة الأسنان المتحركة',
    name_en: 'Removable Prosthodontics',
    webp: '/images/removable-prosthodontics-faded.webp',
    png: '/images/removable-prosthodontics-faded.png',
  },
  'restorative-dentistry': {
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    webp: '/images/operative-dentistry-faded.webp',
    png: '/images/operative-dentistry-faded.png',
  },
};

const DEFAULT_SUBJECTS = [
  { id: '11', year_id: '10000000-0000-0000-0000-000000000001', name_ar: 'تشريح الأسنان', name_en: 'Dental Anatomy', slug: 'dental-anatomy', sort_order: 1 },
  { id: '12', year_id: '10000000-0000-0000-0000-000000000001', name_ar: 'مواد طب الأسنان', name_en: 'Dental Materials', slug: 'dental-materials', sort_order: 2 },
  { id: '21', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'علاج الأسنان التحفظي', name_en: 'Operative Dentistry', slug: 'restorative-dentistry', sort_order: 1 },
  { id: '22', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'صناعة الأسنان المتحركة', name_en: 'Removable Prosthodontics', slug: 'removable-prosthodontics', sort_order: 2 },
  { id: '23', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'صناعة الأسنان الثابتة', name_en: 'Fixed Prosthodontics', slug: 'fixed-prosthodontics', sort_order: 3 },
];

export const YearPage = () => {
  const { slug } = useParams();
  const { lang, isRtl } = useLanguage();

  const [yearData, setYearData] = useState(() => DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0]);
  const [subjects, setSubjects] = useState(() => {
    const yr = DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0];
    return DEFAULT_SUBJECTS.filter(s => s.year_id === yr.id);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const CACHE_KEY = `year_v2:${slug}`;

    const applyData = ({ year, subs }) => {
      if (year) setYearData(year);
      if (subs && subs.length > 0) {
        setSubjects(subs);
      }
    };

    const fetchAndCache = async () => {
      try {
        const { data: yearRes } = await supabase
          .from('years').select('*').eq('slug', slug).single();

        const year = yearRes || DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0];

        const { data: subsRes } = await supabase
          .from('subjects')
          .select('*')
          .eq('year_id', year.id)
          .order('sort_order', { ascending: true });

        const matchedSubs = (subsRes && subsRes.length > 0)
          ? subsRes
          : DEFAULT_SUBJECTS.filter(s => s.year_id === year.id);

        const bundle = { year, subs: matchedSubs };
        cacheSet(CACHE_KEY, bundle, 5 * 60);
        applyData(bundle);
      } catch (err) {
        console.warn('YearPage fetch warning, using defaults:', err);
        const fallbackYear = DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0];
        const fallbackSubs = DEFAULT_SUBJECTS.filter(s => s.year_id === fallbackYear.id);
        applyData({ year: fallbackYear, subs: fallbackSubs });
      } finally {
        setLoading(false);
      }
    };

    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      applyData(cached);
      fetchAndCache();
    } else {
      fetchAndCache();
    }
  }, [slug]);

  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;
  const ArrowIcon = ArrowRight; // Always points into the card action like the reference design

  // ── COMING SOON VIEW ──
  if (yearData.is_coming_soon) {
    return (
      <div className="choose-subject-page">
        <div className="container choose-subject-container">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="subject-breadcrumb">
            <Link to="/">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <ChevronSep size={13} className="breadcrumb-separator" />
            <Link to="/year/1st-year">{lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}</Link>
            <ChevronSep size={13} className="breadcrumb-separator" />
            <span className="breadcrumb-current">
              {lang === 'ar' ? yearData.name_ar : yearData.name_en}
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

  return (
    <div className="choose-subject-page">
      <div className="container choose-subject-container">

        {/* ── 1. BREADCRUMB (Calm & Subtle) ── */}
        <nav aria-label="breadcrumb" className="subject-breadcrumb">
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to="/year/1st-year" className="breadcrumb-link">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {lang === 'ar' ? yearData.name_ar : yearData.name_en}
          </span>
        </nav>

        {/* ── 2. YEAR BADGE PILL ── */}
        <div className="subject-year-badge">
          <GraduationCap size={15} />
          <span>{lang === 'ar' ? yearData.name_ar : yearData.name_en}</span>
        </div>

        {/* ── 3. HERO HEADING ── */}
        <header className="subject-hero-header">
          <h1 className="subject-page-title">
            {lang === 'ar' ? 'اختر المادة' : 'Choose Subject'}
          </h1>
          <p className="subject-page-subtitle">
            {lang === 'ar'
              ? 'لتصفح الأدوات المطلوبة لكل مادة.'
              : 'Browse required tools and supplies for each subject.'}
          </p>
        </header>

        {/* ── 4. SUBJECTS GATEWAY CARDS GRID ── */}
        <section className="choose-subject-grid" aria-label="Subjects List">
          {subjects.map((sub) => {
            const meta = SUBJECT_METADATA[sub.slug] || {};
            const titleAr = meta.name_ar || sub.name_ar || 'المادة الدراسية';
            const titleEn = meta.name_en || sub.name_en || 'Subject';
            const artworkWebp = meta.webp || '/images/dental-anatomy-faded.webp';
            const artworkPng = meta.png || '/images/dental-anatomy-faded.png';

            return (
              <Link
                key={sub.id || sub.slug}
                to={`/subject/${sub.slug}`}
                className="gateway-card subject-card"
                aria-label={`${titleAr} - ${titleEn}`}
              >
                {/* Content Side (Text & Action Button) */}
                <div className="gateway-card-content subject-card-content">
                  <div className="gateway-card-text">
                    <h2 className="gateway-card-title subject-title-ar">
                      {lang === 'ar' ? titleAr : titleEn}
                    </h2>
                    <span className="subject-title-en">
                      {lang === 'ar' ? titleEn : titleAr}
                    </span>
                  </div>

                  <div className="gateway-card-action">
                    <div className="gateway-circle-btn" aria-hidden="true">
                      <ArrowIcon size={17} strokeWidth={2.5} />
                    </div>
                    <span className="gateway-cta-text">
                      {lang === 'ar' ? 'تصفح الآن' : 'Browse Now'}
                    </span>
                  </div>
                </div>

                {/* Artwork Side (Pruned Studio Photography with Soft Alpha Fade) */}
                <div className="gateway-card-artwork subject-card-artwork">
                  <picture>
                    <source srcSet={artworkWebp} type="image/webp" />
                    <img
                      src={artworkPng}
                      alt={titleAr}
                      loading="eager"
                      className="gateway-art-img"
                    />
                  </picture>
                </div>
              </Link>
            );
          })}
        </section>

      </div>
    </div>
  );
};

export default YearPage;
