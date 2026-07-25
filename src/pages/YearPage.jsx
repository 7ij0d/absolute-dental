import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import { BookOpen, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Package } from 'lucide-react';

const SUBJECT_IMAGES = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&auto=format',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&auto=format',
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&auto=format',
  'https://images.unsplash.com/photo-1631563019676-dade0dbdb8fc?w=400&auto=format',
];

export const YearPage = () => {
  const { slug } = useParams();
  const { lang, t, isRtl } = useLanguage();

  const [yearData, setYearData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allYears, setAllYears] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: year } = await supabase.from('years').select('*').eq('slug', slug).single();
        if (year) {
          setYearData(year);
          const { data: subs } = await supabase.from('subjects').select('*').eq('year_id', year.id);
          if (subs) setSubjects(subs);
        }
        const { data: yrs } = await supabase.from('years').select('*').order('slug', { ascending: true });
        if (yrs) setAllYears(yrs);
      } catch (err) {
        console.error('Error loading year info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)', borderRadius: '50%' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.45)' }}>
            <Link to="/" style={{ color: 'inherit', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--purple-300)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}>
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronFwd size={14} />
            <span style={{ color: 'var(--purple-300)', fontWeight: 700 }}>
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
      <div style={{ background: 'var(--purple-900)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
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
                  e.currentTarget.style.borderColor = 'var(--purple-200)';
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
