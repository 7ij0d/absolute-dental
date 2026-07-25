import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import SkeletonLoader from '../components/SkeletonLoader';
import { cacheGet, cacheSet } from '../cache';
import {
  Truck, ShieldCheck, Award, Headphones,
  ArrowRight, ArrowLeft, Star, Users, Package, Clock,
  ChevronRight, BookOpen
} from 'lucide-react';

/* ── YEAR images (fallback images per year) ── */
const YEAR_IMAGES = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=500&auto=format',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format',
];

const WHY_ITEMS_AR = [
  { icon: <Truck size={22} />,        title: 'توصيل سريع',         desc: 'توصيل مجاني لكلية الأسنان وتوصيل سريع لجميع مناطق طرابلس خلال 24 ساعة.' },
  { icon: <ShieldCheck size={22} />,  title: 'جودة مضمونة',        desc: 'جميع الأدوات الطبية أصلية ومعتمدة وتحمل ضمان الجودة والأصالة.' },
  { icon: <Award size={22} />,        title: 'أسعار طلابية',       desc: 'أسعار خاصة ومخفضة صُممت خصيصاً لتناسب ميزانية طلاب طب الأسنان.' },
  { icon: <Headphones size={22} />,   title: 'دعم متواصل',          desc: 'فريق دعم متاح عبر واتساب وتليجرام للإجابة على جميع استفساراتك.' },
];

const WHY_ITEMS_EN = [
  { icon: <Truck size={22} />,        title: 'Fast Delivery',       desc: 'Free delivery to the Dental College and fast delivery all over Tripoli within 24 hours.' },
  { icon: <ShieldCheck size={22} />,  title: 'Certified Quality',   desc: 'All medical tools are original, certified, and come with quality guarantees.' },
  { icon: <Award size={22} />,        title: 'Student Prices',      desc: 'Special discounted prices designed specifically for dental students\' budgets.' },
  { icon: <Headphones size={22} />,   title: 'Continuous Support',  desc: 'Support team available via WhatsApp and Telegram to answer all your queries.' },
];

const MOCK_REVIEWS = [
  { name_ar: 'سارة الأمين',    name_en: 'Sara Al-Amin',    rating: 5, comment_ar: 'جودة الأدوات ممتازة والتوصيل كان سريع جداً. نوصي به لكل طلاب الكلية!',         comment_en: 'Excellent quality tools and very fast delivery. Highly recommend to all college students!', subject_ar: 'طالبة - سنة ثانية',  subject_en: '2nd Year Student' },
  { name_ar: 'محمد الترهوني',  name_en: 'Mohamed Al-Tarhuni', rating: 5, comment_ar: 'أسعار مناسبة جداً مقارنة بالسوق وكل شيء أصلي. متجر موثوق 100%.',          comment_en: 'Very reasonable prices compared to the market and everything is genuine. 100% trustworthy store.', subject_ar: 'طالب - سنة رابعة',   subject_en: '4th Year Student' },
  { name_ar: 'رقية البوسيفي',  name_en: 'Ruqayya Al-Busaifi', rating: 5, comment_ar: 'استخدمت الأدوات في المعمل وكانت ذات جودة عالية. خدمة العملاء ممتازة.',      comment_en: 'Used the tools in the lab and they were high quality. Customer service is excellent.',        subject_ar: 'طالبة - سنة ثالثة', subject_en: '3rd Year Student' },
  { name_ar: 'عمر الزروق',     name_en: 'Omar Al-Zarouq',   rating: 4, comment_ar: 'توصيل الكلية مجاني وهذا يوفر علينا كثيراً. المنتجات ممتازة والتغليف جيد.',    comment_en: 'College delivery is free which saves us a lot. Products are excellent and packaging is good.', subject_ar: 'طالب - سنة أولى',   subject_en: '1st Year Student' },
];

export const Home = () => {
  const { lang, t, isRtl } = useLanguage();

  const [years, setYears]                   = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts]   = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Serve from cache instantly
      const cachedYears = cacheGet('home:years');
      const cachedFeatured = cacheGet('home:featured');
      if (cachedYears) setYears(cachedYears);
      if (cachedFeatured) { setFeaturedProducts(cachedFeatured); setLoadingProducts(false); }

      // Fetch in parallel (background if cached, foreground if not)
      const [{ data: yrs }, { data: featured }] = await Promise.all([
        supabase.from('years').select('*').order('slug', { ascending: true }),
        supabase.from('products').select('*')
          .eq('is_featured', true).eq('is_active', true).eq('is_archived', false).limit(8)
      ]);

      if (yrs)      { setYears(yrs);                   cacheSet('home:years',     yrs,      5 * 60); }
      if (featured) { setFeaturedProducts(featured);    cacheSet('home:featured',  featured, 5 * 60); }
      else          { setFeaturedProducts([]); }
      setLoadingProducts(false);
    };
    loadData();
  }, []);

  const whyItems = lang === 'ar' ? WHY_ITEMS_AR : WHY_ITEMS_EN;
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div style={{ padding: 0 }}>

      {/* ── 1. HERO CAROUSEL ── */}
      <HeroCarousel />

      {/* ── 2. STATS STRIP ── */}
      <div className="stats-strip">
        <div className="stats-strip-inner">
          {[
            { icon: <Users size={20} />,  num: '+500',  label: lang === 'ar' ? 'طالب سعيد' : 'Happy Students' },
            { icon: <Package size={20} />, num: '+100', label: lang === 'ar' ? 'منتج طبي' : 'Medical Products' },
            { icon: <Truck size={20} />,  num: '24h',   label: lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery' },
            { icon: <Star size={20} />,   num: '4.9',   label: lang === 'ar' ? 'تقييم الطلاب' : 'Student Rating' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-icon">{s.icon}</div>
              <div>
                <div className="stat-number">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. BROWSE BY YEAR ── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="section-title">{lang === 'ar' ? 'تصفح حسب السنة الدراسية' : 'Browse by Academic Year'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {lang === 'ar' ? 'اختر سنتك الدراسية واحصل على جميع الأدوات التي تحتاجها' : 'Choose your academic year and get all the tools you need'}
              </p>
            </div>
            <Link
              to="/year/1st-year"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontWeight: 700, fontSize: '0.9rem' }}
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
              <ChevronIcon size={16} />
            </Link>
          </div>

          <div className="grid-4">
            {years.length > 0
              ? years.map((year, idx) => (
                  <Link key={year.id} to={`/year/${year.slug}`} className="year-card">
                    <img
                      src={year.image_url || YEAR_IMAGES[idx % YEAR_IMAGES.length]}
                      alt={lang === 'ar' ? year.name_ar : year.name_en}
                      onError={e => { e.target.src = YEAR_IMAGES[idx % YEAR_IMAGES.length]; }}
                    />
                    <div className="year-card-body">
                      <div className="year-card-title">{lang === 'ar' ? year.name_ar : year.name_en}</div>
                      <div className="year-card-subtitle">
                        {lang === 'ar' ? 'اضغط للتصفح' : 'Browse products'}
                      </div>
                      <div className="year-card-arrow">
                        {lang === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                        <ChevronIcon size={13} />
                      </div>
                    </div>
                  </Link>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }} />
                ))
            }
          </div>
        </div>
      </section>

      {/* ── 4. FEATURED PRODUCTS ── */}
      <section className="section section-purple">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="section-title-light">
                {lang === 'ar' ? '⭐ الأكثر طلباً' : '⭐ Best Sellers'}
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {lang === 'ar' ? 'المنتجات الأكثر شراءً من قِبل طلاب كلية الأسنان' : 'The most purchased products by dental college students'}
              </p>
            </div>
            <Link
              to="/year/1st-year"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--purple-300)', fontWeight: 700, fontSize: '0.9rem' }}
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
              <ChevronIcon size={16} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid-4">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '3rem',
              color: 'var(--text-dim)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>{lang === 'ar' ? 'لم يتم تحديد منتجات مميزة بعد.' : 'No featured products set yet.'}</p>
              <Link to="/year/1st-year" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                {lang === 'ar' ? 'تصفح جميع المنتجات' : 'Browse All Products'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. WHY US ── */}
      <section className="section section-dark">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title-light" style={{ display: 'inline-block' }}>
              {lang === 'ar' ? 'لماذا سمايلودنت؟' : 'Why Smylodent?'}
            </h2>
            <p style={{ color: 'var(--text-dim)', marginTop: '0.75rem', fontSize: '0.95rem' }}>
              {lang === 'ar'
                ? 'متجرك الموثوق لجميع احتياجاتك كطالب طب أسنان'
                : 'Your trusted store for all your dental student needs'}
            </p>
          </div>
          <div className="grid-4">
            {whyItems.map((item, i) => (
              <div key={i} className="why-card">
                <div className="why-icon">{item.icon}</div>
                <h3 className="why-title">{item.title}</h3>
                <p className="why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. REVIEWS ── */}
      <section className="section section-purple">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="section-title-light" style={{ display: 'inline-block' }}>
              {lang === 'ar' ? 'ماذا يقول طلابنا؟' : 'What Students Say'}
            </h2>
            <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {lang === 'ar' ? 'آراء حقيقية من طلاب كلية طب الأسنان' : 'Real reviews from dental college students'}
            </p>
          </div>

          <div className="h-scroll" style={{ padding: '0.5rem 0 1.5rem' }}>
            {MOCK_REVIEWS.map((review, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#F59E0B" />
                  ))}
                </div>
                <p className="review-comment">
                  {lang === 'ar' ? review.comment_ar : review.comment_en}
                </p>
                <div>
                  <div className="review-author">{lang === 'ar' ? review.name_ar : review.name_en}</div>
                  <div className="review-subject">{lang === 'ar' ? review.subject_ar : review.subject_en}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. BOTTOM CTA BANNER ── */}
      <section style={{
        background: 'var(--gradient-primary)',
        padding: '4rem 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🦷</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem' }}>
            {lang === 'ar' ? 'جاهز تبدأ تسوق؟' : 'Ready to Start Shopping?'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1rem' }}>
            {lang === 'ar'
              ? 'اطلب أدواتك الطبية الآن واستقبلها على باب كليتك مجاناً'
              : 'Order your medical tools now and receive them at your college door for free'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/year/1st-year"
              className="btn"
              style={{ background: '#fff', color: 'var(--secondary)', fontWeight: 800, padding: '0.9rem 2rem' }}
            >
              {lang === 'ar' ? 'تسوق الآن' : 'Shop Now'}
              <ArrowIcon size={16} />
            </Link>
            <Link
              to="/track"
              className="btn btn-ghost"
              style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', padding: '0.9rem 2rem' }}
            >
              {lang === 'ar' ? 'تتبع طلبي' : 'Track My Order'}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
