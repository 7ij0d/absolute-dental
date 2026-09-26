import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight } from 'lucide-react';

export const Home = () => {
  const { lang } = useLanguage();

  return (
    <div className="home-gateway-page">
      <div className="container home-gateway-container">
        
        {/* ── 1. MINIMAL HERO SECTION ── */}
        <section className="home-hero" aria-labelledby="hero-question">
          <h1 id="hero-question" className="home-hero-title">
            {lang === 'ar' ? 'شن تبي تجهّز؟' : 'What are you preparing for?'}
          </h1>
          <p className="home-hero-subtitle">
            {lang === 'ar' ? 'اختر القسم المناسب لاحتياجاتك.' : 'Choose the section that suits your needs.'}
          </p>
        </section>

        {/* ── 2. TWO GATEWAY CARDS ── */}
        <section className="home-gateway-grid" aria-label="Main Sections">

          {/* CARD 01: أدوات الدراسة */}
          <Link
            to="/year/1st-year"
            className="gateway-card"
            aria-label={lang === 'ar' ? 'أدوات الدراسة - اختر سنتك الدراسية' : 'Study Tools - Choose your academic year'}
          >
            <div className="gateway-card-content">
              <div className="gateway-card-text">
                <h2 className="gateway-card-title">
                  {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
                </h2>
                <p className="gateway-card-desc">
                  {lang === 'ar'
                    ? 'اختر سنتك الدراسية لتصفح المواد والأدوات المطلوبة في مكان واحد.'
                    : 'Choose your academic year to browse required subjects and tools in one place.'}
                </p>
              </div>

              <div className="gateway-card-action">
                <div className="gateway-circle-btn" aria-hidden="true">
                  <ArrowRight size={17} strokeWidth={2.5} />
                </div>
                <span className="gateway-cta-text">
                  {lang === 'ar' ? 'ابدأ الآن' : 'Start Now'}
                </span>
              </div>
            </div>

            <div className="gateway-card-artwork">
              <picture>
                <source srcSet="/images/study-tools-faded.webp" type="image/webp" />
                <img
                  src="/images/study-tools-faded.png"
                  alt={lang === 'ar' ? 'أدوات دراسة طب الأسنان' : 'Dental Study Tools'}
                  loading="eager"
                  className="gateway-art-img"
                />
              </picture>
            </div>
          </Link>

          {/* CARD 02: إكسسوارات الأسنان */}
          <Link
            to="/accessories"
            className="gateway-card"
            aria-label={lang === 'ar' ? 'إكسسوارات الأسنان - بوكسات، حقائب، أدوات تنظيم ومستلزمات إضافية' : 'Dental Accessories - Boxes, bags, organization gear'}
          >
            <div className="gateway-card-content">
              <div className="gateway-card-text">
                <h2 className="gateway-card-title">
                  {lang === 'ar' ? 'إكسسوارات الأسنان' : 'Dental Accessories'}
                </h2>
                <p className="gateway-card-desc">
                  {lang === 'ar'
                    ? 'بوكسات، حقائب، أدوات تنظيم ومستلزمات إضافية.'
                    : 'Boxes, bags, organization gear and extra student supplies.'}
                </p>
              </div>

              <div className="gateway-card-action">
                <div className="gateway-circle-btn" aria-hidden="true">
                  <ArrowRight size={17} strokeWidth={2.5} />
                </div>
                <span className="gateway-cta-text">
                  {lang === 'ar' ? 'تصفح الآن' : 'Browse Now'}
                </span>
              </div>
            </div>

            <div className="gateway-card-artwork">
              <picture>
                <source srcSet="/images/dental-boxes-faded.webp" type="image/webp" />
                <img
                  src="/images/dental-boxes-faded.png"
                  alt={lang === 'ar' ? 'بوكسات وإكسسوارات الأسنان' : 'Dental Boxes and Accessories'}
                  loading="eager"
                  className="gateway-art-img"
                />
              </picture>
            </div>
          </Link>

        </section>

      </div>
    </div>
  );
};

export default Home;
