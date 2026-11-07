import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { cacheGet, cacheSet } from '../cache';
import {
  ACADEMIC_YEARS_LIST,
  mergeCoursesWithDb,
  sanitizeCourseBannerUrl
} from '../utils/courseBannersEngine';
import { ChevronLeft, ChevronRight, ArrowRight, Clock } from 'lucide-react';

export const YearPage = () => {
  const { slug } = useParams();
  const { lang, isRtl } = useLanguage();

  const isYear4 = slug === '4th-year' || slug === '4th' || slug?.startsWith('4');
  const isYear3 = !isYear4 && (slug === '3rd-year' || slug === '3rd' || slug?.startsWith('3'));
  const isYear2 = !isYear4 && !isYear3 && (slug === '2nd-year' || slug === '2nd' || slug?.startsWith('2'));

  const targetSlug = isYear4 ? '4th-year' : (isYear3 ? '3rd-year' : (isYear2 ? '2nd-year' : '1st-year'));
  const defaultYear = isYear4
    ? ACADEMIC_YEARS_LIST[3]
    : (isYear3 ? ACADEMIC_YEARS_LIST[2] : (isYear2 ? ACADEMIC_YEARS_LIST[1] : ACADEMIC_YEARS_LIST[0]));

  const [yearData, setYearData] = useState(
    () => ACADEMIC_YEARS_LIST.find((y) => y.slug === slug || y.slug === targetSlug) || defaultYear
  );

  const [dbSubjects, setDbSubjects] = useState(() => cacheGet('subjects:year:' + defaultYear.id) || null);
  const [bannerOverrides, setBannerOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('ad_course_banners_config');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (isYear4) {
      setYearData(ACADEMIC_YEARS_LIST[3]);
      setDbSubjects(null);
      return;
    }

    let mounted = true;
    const CACHE_KEY = `year_v5:${targetSlug}`;
    const cachedSubs = cacheGet('subjects:year:' + defaultYear.id);
    if (cachedSubs) setDbSubjects(cachedSubs);

    const fetchYear = async () => {
      try {
        const [{ data: yearRes }, { data: subsRes }, { data: settingsRes }] = await Promise.all([
          supabase.from('years').select('*').eq('slug', targetSlug).maybeSingle(),
          supabase.from('subjects').select('*').eq('year_id', defaultYear.id).order('sort_order', { ascending: true }),
          supabase.from('settings').select('value').eq('key', 'course_banners_config').maybeSingle()
        ]);
        if (!mounted) return;
        if (yearRes) {
          setYearData(yearRes);
          cacheSet(CACHE_KEY, yearRes, 5 * 60);
        }
        if (settingsRes?.value) {
          setBannerOverrides(settingsRes.value);
          try {
            localStorage.setItem('ad_course_banners_config', JSON.stringify(settingsRes.value));
          } catch (_) {}
        }
        if (Array.isArray(subsRes) && subsRes.length > 0) {
          setDbSubjects(subsRes);
          cacheSet('subjects:year:' + defaultYear.id, subsRes, 300);
        } else if (!cachedSubs) {
          setDbSubjects(null);
        }
      } catch (err) {
        console.warn('YearPage fetch warning, using defaults:', err);
      }
    };

    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      setYearData(cached);
    }
    fetchYear();

    return () => {
      mounted = false;
    };
  }, [slug, targetSlug, isYear4, defaultYear.id]);

  // ── COMING SOON VIEW (Year 4 only) ──
  if (isYear4 || yearData?.is_coming_soon) {
    const yr = yearData || ACADEMIC_YEARS_LIST[3];
    return (
      <div className="choose-subject-page">
        <div className="container choose-subject-container">
          <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <Link to="/" className="breadcrumb-link">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <ChevronSep size={13} className="breadcrumb-separator" />
            <Link to="/study-tools" className="breadcrumb-link">{lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}</Link>
            <ChevronSep size={13} className="breadcrumb-separator" />
            <span className="breadcrumb-current">{lang === 'ar' ? yr.name_ar : yr.name_en}</span>
          </nav>

          <div className="coming-soon-card">
            <div className="coming-soon-icon-box">
              <Clock size={36} />
            </div>
            <h1 className="coming-soon-title">
              {lang === 'ar' ? `${yr.name_ar} — قريباً` : `${yr.name_en} — Coming Soon`}
            </h1>
            <p className="coming-soon-desc">
              {lang === 'ar'
                ? 'نعمل حالياً على تجهيز وفهرسة كافة الأدوات والمواد المطلوبة لهذه السنة الدراسية.'
                : 'We are currently preparing and indexing all required tools and supplies for this academic year.'}
            </p>
            <Link to="/study-tools" className="btn btn-secondary">
              {lang === 'ar' ? 'العودة لأدوات الدراسة' : 'Back to Study Tools'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Merge canonical courses for this academic year with live DB rows & banner overrides
  const mergedAll = mergeCoursesWithDb(dbSubjects || [], bannerOverrides);
  const currentSubjects = mergedAll
    .filter((c) => c.year_id === defaultYear.id)
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

  const yearDisplayName = lang === 'ar'
    ? (yearData?.name_ar || (isYear3 ? 'السنة الثالثة' : (isYear2 ? 'السنة الثانية' : 'السنة الأولى')))
    : (yearData?.name_en || (isYear3 ? '3rd Year' : (isYear2 ? '2nd Year' : '1st Year')));

  return (
    <div className="choose-subject-page">
      <div className="container choose-subject-container">

        {/* ── 1. BREADCRUMB (Calm, Subtle & RTL-Balanced) ── */}
        <nav aria-label="breadcrumb" className="subject-breadcrumb" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to="/study-tools" className="breadcrumb-link">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">
            {yearDisplayName}
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

        {/* ── 3. EXACT SUBJECT CARDS (INDEPENDENT BANNER PER COURSE) ── */}
        <section className="year-subject-list" aria-label="Subjects List">
          {currentSubjects.map((sub, idx) => {
            const isAboveFold = idx < 2;
            const customBannerUrl = sanitizeCourseBannerUrl(sub.image_url);
            return (
              <Link
                key={sub.id || sub.slug}
                to={`/subject/${sub.slug}`}
                className="year-subject-card"
                aria-label={`${sub.name_ar} - ${sub.name_en}`}
              >
                {/* Left Side: Arabic Title + English Title + Solid Brown Circle Button */}
                <div className="year-card-left">
                  <div className="year-card-titles">
                    <h3 className="year-card-title-ar">{sub.name_ar}</h3>
                    <h2 className="year-card-title-en">{sub.name_en}</h2>
                  </div>
                  <div className="year-circle-btn" aria-hidden="true">
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Right Side: Independent Course Banner (Custom or Default Studio Artwork) */}
                <div className="year-card-art">
                  {customBannerUrl ? (
                    <img
                      src={customBannerUrl}
                      alt={sub.name_en}
                      loading={isAboveFold ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ) : (
                    <picture>
                      <source srcSet={sub.default_webp} type="image/webp" />
                      <img
                        src={sub.default_png}
                        alt={sub.name_en}
                        loading={isAboveFold ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </picture>
                  )}
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
