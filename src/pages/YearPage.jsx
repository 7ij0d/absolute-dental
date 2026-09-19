import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import { cacheGet, cacheSet } from '../cache';
import { BookOpen, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Package } from 'lucide-react';

const SUBJECT_IMAGES = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&auto=format',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&auto=format',
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&auto=format',
  'https://images.unsplash.com/photo-1631563019676-dade0dbdb8fc?w=400&auto=format',
];

const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى',  name_en: '1st Year', slug: '1st-year', sort_order: 1, image_url: 'https://vqrpodmnzubpcsvqohwj.supabase.co/storage/v1/object/public/smylodent-assets/year-images/1st-year.jpg' },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year', sort_order: 2, image_url: 'https://vqrpodmnzubpcsvqohwj.supabase.co/storage/v1/object/public/smylodent-assets/year-images/2nd-year.jpg' },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year', sort_order: 3, image_url: 'https://vqrpodmnzubpcsvqohwj.supabase.co/storage/v1/object/public/smylodent-assets/year-images/3rd-year.jpg' },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year', sort_order: 4, image_url: 'https://vqrpodmnzubpcsvqohwj.supabase.co/storage/v1/object/public/smylodent-assets/year-images/4th-year.jpg' },
];

const DEFAULT_SUBJECTS = [
  { id: '11', year_id: '10000000-0000-0000-0000-000000000001', name_ar: 'تشريح الأسنان', name_en: 'Dental Anatomy', description_ar: 'دراسة تشريح الأسنان الطبيعي وأشكالها ورسمها ونحتها.', description_en: 'Study of tooth morphology, carving, and anatomical features.', slug: 'dental-anatomy' },
  { id: '12', year_id: '10000000-0000-0000-0000-000000000001', name_ar: 'مواد طب الأسنان', name_en: 'Dental Materials', description_ar: 'التعرف على المواد المستخدمة في عيادات ومعامل الأسنان وكيفية خلطها.', description_en: 'Introduction to materials used in clinical and lab setups.', slug: 'dental-materials' },
  { id: '21', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'علاج الأسنان التحفظي', name_en: 'Restorative Dentistry', description_ar: 'العمل العملي في المعمل على الرؤوس الوهمية وتجهيز الحفر السنية.', description_en: 'Pre-clinical practice on phantom heads and cavity preparations.', slug: 'restorative-dentistry' },
  { id: '22', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'صناعة الأسنان المتحركة', name_en: 'Removable Prosthodontics', description_ar: 'معمل الأطقم الكاملة والجزئية وكيفية صف الأسنان وتشميعها.', description_en: 'Complete and partial dentures, tooth arrangement, and waxing steps.', slug: 'removable-prosthodontics' },
  { id: '23', year_id: '20000000-0000-0000-0000-000000000002', name_ar: 'صناعة الأسنان الثابتة', name_en: 'Fixed Prosthodontics', description_ar: 'تجهيز الأسنان للتيجان والجسور السنية وصنع القوالب المؤقتة.', description_en: 'Crown and bridge preparation, temporary restorations, and impressions.', slug: 'fixed-prosthodontics' },
  { id: '31', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'علاج الجذور', name_en: 'Endodontics', description_ar: 'تنظيف وحشو قنوات الجذور لأسنان أحادية ومتعددة الجذور عمليًا.', description_en: 'Root canal treatment, cleaning, shaping, and obturation training.', slug: 'endodontics' },
  { id: '32', year_id: '30000000-0000-0000-0000-000000000003', name_ar: 'أمراض وجراحة اللثة', name_en: 'Periodontics', description_ar: 'أدوات تقليح الجير وتنعيم الجذور والتعامل مع النسج الداعمة.', description_en: 'Scaling and root planing instruments, periodontium health tools.', slug: 'periodontics' },
  { id: '41', year_id: '40000000-0000-0000-0000-000000000004', name_ar: 'جراحة الفم والتخدير', name_en: 'Oral Surgery & Anesthesia', description_ar: 'أدوات خلع الأسنان والمحاقن وحقن التخدير الموضعي.', description_en: 'Exodontia instruments, forceps, elevators, and local anesthesia tools.', slug: 'oral-surgery' },
  { id: '42', year_id: '40000000-0000-0000-0000-000000000004', name_ar: 'تقويم الأسنان', name_en: 'Orthodontics', description_ar: 'صنع الأجهزة المتحركة للتقويم وثني الأسلاك المعدنية.', description_en: 'Removable orthodontic appliance construction and wire bending.', slug: 'orthodontics' }
];

export const YearPage = () => {
  const { slug } = useParams();
  const { lang, t, isRtl } = useLanguage();

  const [yearData, setYearData] = useState(() => DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0]);
  const [subjects, setSubjects] = useState(() => DEFAULT_SUBJECTS.filter(s => String(s.year_id) === String(DEFAULT_YEARS.find(y => y.slug === slug)?.id || '10000000-0000-0000-0000-000000000001')));
  const [loading, setLoading] = useState(false);
  const [allYears, setAllYears] = useState(DEFAULT_YEARS);

  useEffect(() => {
    const CACHE_KEY = `year:${slug}`;

    const applyData = ({ year, subs, yrs }) => {
      setYearData(year);
      setSubjects(subs || []);
      setAllYears(yrs || DEFAULT_YEARS);
    };

    const fetchAndCache = async (showLoader) => {
      if (showLoader) setLoading(false);
      try {
        // Fetch year first
        const { data: yearRes } = await supabase
          .from('years').select('*').eq('slug', slug).single();

        const year = yearRes || DEFAULT_YEARS.find(y => y.slug === slug);

        if (!year) {
          setLoading(false);
          return;
        }

        // Fetch subjects + all years IN PARALLEL
        const [{ data: subsRes }, { data: yrsRes }] = await Promise.all([
          supabase.from('subjects').select('*').eq('year_id', year.id),
          supabase.from('years').select('*').order('sort_order', { ascending: true })
        ]);

        const matchedSubs = (subsRes && subsRes.length > 0)
          ? subsRes
          : DEFAULT_SUBJECTS.filter(s => String(s.year_id) === String(year.id) || String(year.slug).includes(s.slug.split('-')[0]));

        const bundle = {
          year,
          subs: matchedSubs.length > 0 ? matchedSubs : DEFAULT_SUBJECTS.filter(s => s.slug.includes(slug.split('-')[0])),
          yrs: (yrsRes && yrsRes.length > 0) ? yrsRes : DEFAULT_YEARS
        };

        cacheSet(CACHE_KEY, bundle, 5 * 60);
        applyData(bundle);
      } catch (err) {
        console.warn('YearPage fetch warning, using defaults:', err);
        const fallbackYear = DEFAULT_YEARS.find(y => y.slug === slug) || DEFAULT_YEARS[0];
        const fallbackSubs = DEFAULT_SUBJECTS.filter(s => String(s.year_id) === String(fallbackYear.id));
        applyData({ year: fallbackYear, subs: fallbackSubs, yrs: DEFAULT_YEARS });
      } finally {
        setLoading(false);
      }
    };

    // Instant load from cache, then refresh silently
    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      applyData(cached);
      setLoading(false);
      fetchAndCache(false);
    } else {
      fetchAndCache(true);
    }
  }, [slug]);


  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;
  const ArrowFwd = isRtl ? ArrowLeft : ArrowRight;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh' }}>
        {/* Hero skeleton */}
        <div className="skeleton" style={{ height: '200px', borderRadius: 0 }} />
        <div className="container" style={{ padding: '3rem 0' }}>
          <div className="grid-3" style={{ gap: '1.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!yearData) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>لم يتم العثور على هذه السنة الدراسية</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sorry, this year was not found.</p>
        <Link to="/" className="btn btn-primary">
          {lang === 'ar' ? 'الرئيسية' : 'Go Home'}
        </Link>
      </div>
    );
  }

  // Coming Soon year — show banner instead of subjects
  if (yearData.is_coming_soon) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🕐</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
          {lang === 'ar' ? `${yearData.name_ar} — قريباً` : `${yearData.name_en} — Coming Soon`}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '420px', lineHeight: 1.7, marginBottom: '2rem' }}>
          {lang === 'ar'
            ? 'نعمل على توفير أدوات هذه السنة. تابعنا على واتساب وتليجرام لتعرف أول ما نطلق المنتجات.'
            : "We're working on sourcing tools and supplies for this year. Follow us on WhatsApp or Telegram to be the first to know when we launch."
          }
        </p>
        <Link to="/" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>
          {lang === 'ar' ? '← الرئيسية' : '← Back Home'}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── YEAR HERO ── */}
      <div style={{
        background: 'var(--gradient-dark)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '3rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decoration */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(205,191,166,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 100% at 50% 100%, rgba(30,25,20,0.45) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(86,79,69,0.15) 0%, transparent 50%, rgba(40,34,28,0.18) 100%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.45)' }}>
            <Link to="/" style={{ color: 'inherit', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#CDBFA6'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}>
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronFwd size={14} />
            <span style={{ color: '#CDBFA6', fontWeight: 700 }}>
              {lang === 'ar' ? yearData.name_ar : yearData.name_en}
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>
            {lang === 'ar' ? yearData.name_ar : yearData.name_en}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
            {lang === 'ar'
              ? `${subjects.length} مادة دراسية متاحة — اختر المادة لتصفح أدواتها`
              : `${subjects.length} subjects available — choose a subject to browse its tools`}
          </p>
        </div>
      </div>

      {/* ── YEAR TABS ── */}
      <div style={{ background: 'var(--brand-brown)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap' }}>
            {allYears.map(yr => (
              <Link
                key={yr.id}
                to={`/year/${yr.slug}`}
                style={{
                  padding: '0.8rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: yr.slug === slug ? '#fff' : 'rgba(255,255,255,0.45)',
                  borderBottom: yr.slug === slug ? '2px solid var(--secondary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  display: 'inline-block',
                }}
              >
                {lang === 'ar' ? yr.name_ar : yr.name_en}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUBJECTS GRID ── */}
      <div className="container" style={{ padding: '3rem 0' }}>
        {subjects.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
          }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              {lang === 'ar' ? 'لا توجد مواد دراسية حالياً' : 'No subjects available yet'}
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              {lang === 'ar' ? 'تابعنا لمزيد من المواد قريباً' : 'Stay tuned for more subjects soon'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {subjects.map((sub, idx) => (
              <Link
                key={sub.id}
                to={`/subject/${sub.slug}`}
                style={{
                  display: 'block',
                  background: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.borderColor = '#E6DAC6';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Subject Image */}
                <div style={{ position: 'relative', aspectRatio: '16/7', overflow: 'hidden', background: 'var(--purple-50)' }}>
                  <img
                    src={sub.image_url || SUBJECT_IMAGES[idx % SUBJECT_IMAGES.length]}
                    alt={lang === 'ar' ? sub.name_ar : sub.name_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onError={e => { e.target.src = SUBJECT_IMAGES[idx % SUBJECT_IMAGES.length]; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,7,32,0.6) 0%, transparent 60%)' }} />
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--secondary)', flexShrink: 0,
                    }}>
                      <BookOpen size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                        {lang === 'ar' ? sub.name_ar : sub.name_en}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {lang === 'ar' ? sub.description_ar : sub.description_en}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', color: 'var(--secondary)', fontSize: '0.82rem', fontWeight: 700 }}>
                    {lang === 'ar' ? 'تصفح الأدوات' : 'Browse tools'}
                    <ArrowFwd size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YearPage;

