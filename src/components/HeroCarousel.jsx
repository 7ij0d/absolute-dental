import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

const DEFAULT_SLIDES = [
  {
    id: '1',
    tag_ar: '🦷 متجر طب الأسنان الأول في ليبيا',
    tag_en: '🦷 Libya\'s #1 Dental Store',
    title_ar: 'كل ما يحتاجه\nطالب طب الأسنان',
    title_en: 'Everything a\nDental Student Needs',
    desc_ar: 'أدوات طبية أصلية ومعتمدة، بأسعار خاصة لطلاب كلية الأسنان بجامعة طرابلس.',
    desc_en: 'Certified dental tools at special prices for Tripoli University dental students.',
    cta_ar: 'تسوق الآن',
    cta_en: 'Shop Now',
    cta_link: '/year/1st-year',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format',
    accent: '#7C3AED',
  },
  {
    id: '2',
    tag_ar: '⭐ الأكثر طلباً هذا الموسم',
    tag_en: '⭐ Best Sellers This Season',
    title_ar: 'أدوات السنة الثانية\nبأفضل الأسعار',
    title_en: 'Year 2 Tools\nAt Best Prices',
    desc_ar: 'مجموعة كاملة من أدوات العلاج التحفظي وصناعة الأسنان الثابتة والمتحركة.',
    desc_en: 'Complete set of restorative, fixed, and removable prosthodontic tools.',
    cta_ar: 'تصفح المجموعة',
    cta_en: 'Browse Collection',
    cta_link: '/year/2nd-year',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format',
    accent: '#2563EB',
  },
  {
    id: '3',
    tag_ar: '🚚 توصيل مجاني',
    tag_en: '🚚 Free Delivery',
    title_ar: 'توصيل مجاني\nلكلية الأسنان',
    title_en: 'Free Delivery\nto Dental College',
    desc_ar: 'وصل طلبك لكلية طب الأسنان مجاناً، أو توصيل سريع لأي مكان في طرابلس.',
    desc_en: 'Free delivery to Dental College, or fast delivery anywhere in Tripoli.',
    cta_ar: 'اطلب الآن',
    cta_en: 'Order Now',
    cta_link: '/year/1st-year',
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&auto=format',
    accent: '#059669',
  },
];

export const HeroCarousel = () => {
  const { lang, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Load banners from DB if available
  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('sort_order');
      if (data && data.length > 0) {
        // Map banners to slide format
        const mapped = data.map((b, i) => ({
          id: b.id,
          tag_ar: b.subtitle_ar || DEFAULT_SLIDES[i % 3]?.tag_ar,
          tag_en: b.subtitle_en || DEFAULT_SLIDES[i % 3]?.tag_en,
          title_ar: b.title_ar || DEFAULT_SLIDES[i % 3]?.title_ar,
          title_en: b.title_en || DEFAULT_SLIDES[i % 3]?.title_en,
          desc_ar: '',
          desc_en: '',
          cta_ar: 'تسوق الآن',
          cta_en: 'Shop Now',
          cta_link: b.link_url || '/',
          image: b.image_url,
          accent: DEFAULT_SLIDES[i % 3]?.accent || '#7C3AED',
        }));
        setSlides(mapped);
      }
    };
    loadBanners();
  }, []);

  // Auto-cycle
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => goNext(), 6000);
    return () => clearInterval(interval);
  }, [slides.length, active]);

  const goTo = (idx) => {
    if (animating || idx === active) return;
    setAnimating(true);
    setActive(idx);
    setTimeout(() => setAnimating(false), 500);
  };

  const goNext = () => goTo((active + 1) % slides.length);
  const goPrev = () => goTo((active - 1 + slides.length) % slides.length);

  const slide = slides[active];
  if (!slide) return null;

  const titleLines = (lang === 'ar' ? slide.title_ar : slide.title_en)?.split('\n') || [];

  return (
    <div className="hero-section">
      {/* Background Decoration */}
      <div className="hero-bg-decoration">
        <div className="hero-orb hero-orb-1" style={{ background: `radial-gradient(circle, ${slide.accent}, transparent 70%)` }} />
        <div className="hero-orb hero-orb-2" />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Content */}
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-slide" key={slide.id} style={{ opacity: animating ? 0 : 1, transition: 'opacity 0.4s ease' }}>

          {/* Text */}
          <div className="hero-slide-text">
            <div className="hero-tag">
              <Sparkles size={12} />
              {lang === 'ar' ? slide.tag_ar : slide.tag_en}
            </div>

            <h1 className="hero-title">
              {titleLines.map((line, i) => (
                <React.Fragment key={i}>
                  {i === 0 ? line : <><br /><span className="highlight">{line}</span></>}
                </React.Fragment>
              ))}
            </h1>

            <p className="hero-desc">
              {lang === 'ar' ? slide.desc_ar : slide.desc_en}
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate(slide.cta_link)}
                style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}
              >
                <ShoppingBag size={18} />
                {lang === 'ar' ? slide.cta_ar : slide.cta_en}
              </button>
              <Link to="/track" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
                {lang === 'ar' ? 'تتبع طلبك' : 'Track Order'}
              </Link>
            </div>

            {/* Slide counter */}
            <div style={{ marginTop: '2.5rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 600 }}>
              {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </div>
          </div>

          {/* Image */}
          <div className="hero-image-wrapper">
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: '-20px',
                background: `radial-gradient(circle, ${slide.accent}40, transparent 70%)`,
                borderRadius: '50%',
                filter: 'blur(30px)',
              }} />
              <img
                src={slide.image}
                alt={lang === 'ar' ? slide.title_ar : slide.title_en}
                className="hero-image animate-float"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format'; }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Nav Arrows */}
      {slides.length > 1 && (
        <>
          <button className="hero-nav-btn hero-nav-prev" onClick={isRtl ? goNext : goPrev}>
            {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button className="hero-nav-btn hero-nav-next" onClick={isRtl ? goPrev : goNext}>
            {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </>
      )}

      {/* Dot Pagination */}
      <div className="hero-controls">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === active ? 'active' : ''}`} onClick={() => goTo(i)} />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
