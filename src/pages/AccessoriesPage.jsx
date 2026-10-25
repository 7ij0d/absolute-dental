import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

import {
  Shirt,
  Heart,
  ShoppingCart,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import accessoriesBannerArt from '../assets/images/accessories-banner-art.png';

const BASE = import.meta.env.BASE_URL || '/';

export const AccessoriesPage = () => {
  const { lang, isRtl } = useLanguage();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isFav, setIsFav] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('ad_favorites') || '[]');
      return favs.includes('55000000-0000-0000-0000-000000000001');
    } catch (_) { return false; }
  });

  // Star Lab Coat Product Data
  const product = {
    id: '55000000-0000-0000-0000-000000000001',
    name_ar: 'لاب كوت أبيض FIGS محلي',
    name_en: 'White FIGS Lab Coat (Local)',
    price: 45,
    availability_ar: 'متوفر وجاهز للتوصيل',
    availability_en: 'In Stock & Ready',
    images: [
      `${BASE}products/labcoat-figs-white-1.jpg`,
      `${BASE}products/labcoat-figs-white-collar.jpg`,
      `${BASE}products/labcoat-figs-white-3.jpg`,
      `${BASE}products/labcoat-figs-white-2.jpg`
    ]
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = product.images[activeImageIndex] || product.images[0];
  

  const handleToggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(prev => {
      const next = !prev;
      try {
        const favs = JSON.parse(localStorage.getItem('ad_favorites') || '[]');
        const updated = next
          ? Array.from(new Set([...favs, product.id]))
          : favs.filter(id => id !== product.id);
        localStorage.setItem('ad_favorites', JSON.stringify(updated));
      } catch (_) {}
      return next;
    });
  };

  return (
    <div
      className="accessories-showcase-page"
      style={{
        direction: isRtl ? 'rtl' : 'ltr',
        backgroundColor: '#FDFBF7',
        minHeight: '85vh',
        paddingBottom: '4rem'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', paddingInline: '1.25rem' }}>

        {/* ── 1. BREADCRUMBS (الرئيسية › الإكسسوارات) ── */}
        <nav
          aria-label="breadcrumb"
          style={{
            paddingBlock: '1.1rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: '#7A6556'
          }}
        >
          <Link
            to="/"
            style={{
              color: '#7A6556',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
          >
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <span style={{ color: '#B3A293', fontSize: '0.8rem' }}>›</span>
          <span style={{ color: '#2C1A11', fontWeight: 800 }}>
            {lang === 'ar' ? 'الإكسسوارات' : 'Accessories'}
          </span>
        </nav>

        {/* ── 2. SECTION BANNER (MATCHING REFERENCE MOCKUP EXACTLY) ── */}
        <section
          className="section-reference-banner animate-fade-in"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '124px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #F3ECE2 0%, #EBE1D3 100%)',
            border: '1px solid rgba(138, 108, 82, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflow: 'hidden',
            marginBottom: '1.75rem',
            boxShadow: '0 4px 18px rgba(36, 23, 15, 0.04)'
          }}
        >
          {/* Banner Text & Icon (Right side in RTL) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.1rem',
              padding: '1.5rem 2rem',
              zIndex: 2,
              flex: '1 1 auto'
            }}
          >
            {/* Rounded Icon Badge */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(180, 155, 130, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4A3525',
                flexShrink: 0
              }}
            >
              <Shirt size={28} strokeWidth={2} />
            </div>

            {/* Title & Subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                  fontWeight: 900,
                  color: '#2C1A11',
                  lineHeight: 1.2
                }}
              >
                {lang === 'ar' ? 'الإكسسوارات' : 'Accessories'}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: 'clamp(0.85rem, 1.8vw, 0.98rem)',
                  fontWeight: 600,
                  color: '#6B5344',
                  lineHeight: 1.45
                }}
              >
                {lang === 'ar'
                  ? 'لايكوت، يونيفورم، ديكور وإكسسوارات طبية مخصصة لطلبة طب الأسنان'
                  : 'Lab coats, uniforms, clinic decor, and medical accessories for dental students'}
              </p>
            </div>
          </div>

          {/* Contextual Banner Graphic (Left side in RTL) */}
          <div
            className="section-banner-art-wrap"
            style={{
              position: 'relative',
              height: '100%',
              minHeight: '124px',
              width: '42%',
              maxWidth: '460px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <img
              src={accessoriesBannerArt}
              alt=""
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: isRtl ? 'left center' : 'right center',
                maskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>
        </section>

        {/* ── 3. PRODUCT COUNT HEADER (1 منتج) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginBottom: '1rem'
          }}
        >
          <span
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#3E271D'
            }}
          >
            {lang === 'ar' ? '1 منتج' : '1 product'}
          </span>
        </div>

        {/* ── 4. PRODUCT SHOWCASE GRID (Starts naturally from the RIGHT in RTL) ── */}
        <div
          className="accessories-products-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 330px))',
            gap: '1.75rem',
            justifyContent: 'start'
          }}
        >
          {/* ── SINGLE PRODUCT CARD (FIGS LAB COAT) ── */}
          <article
            className="product-reference-card animate-fade-in"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #ECE4DA',
              boxShadow: '0 4px 20px rgba(35, 24, 16, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}
          >
            {/* Top Media Area with Floating Heart Favorite */}
            <div style={{ position: 'relative', background: '#F9F7F4' }}>
              {/* Floating Favorite Button (Top-Left in RTL) */}
              <button
                type="button"
                onClick={handleToggleFav}
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  position: 'absolute',
                  top: '12px',
                  [isRtl ? 'left' : 'right']: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3,
                  transition: 'transform 0.15s ease'
                }}
              >
                <Heart
                  size={18}
                  fill={isFav ? '#E11D48' : 'none'}
                  color={isFav ? '#E11D48' : '#3E271D'}
                  strokeWidth={2.2}
                />
              </button>

              {/* Main Image */}
              <div
                onClick={() => navigate(`/product/${product.id}`)}
                style={{
                  width: '100%',
                  aspectRatio: '4/3.4',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={activeImage}
                  alt={product.name_ar}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 20%',
                    display: 'block',
                    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </div>

              {/* 4 Thumbnails Underneath Main Image */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 0.85rem',
                  background: '#FFFFFF',
                  borderTop: '1px solid #F1EBE4'
                }}
              >
                {product.images.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #3E271D' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                        padding: 0,
                        cursor: 'pointer',
                        background: '#F8F6F2',
                        opacity: isActive ? 1 : 0.7,
                        transform: isActive ? 'scale(1.04)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Content */}
            <div
              style={{
                padding: '1.15rem 1.25rem 1.35rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
                flex: 1
              }}
            >
              {/* Product Title */}
              <h2
                onClick={() => navigate(`/product/${product.id}`)}
                style={{
                  margin: 0,
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: '1.18rem',
                  fontWeight: 900,
                  color: '#2C1A11',
                  cursor: 'pointer',
                  lineHeight: 1.3
                }}
              >
                {lang === 'ar' ? product.name_ar : product.name_en}
              </h2>

              {/* Price */}
              <div
                style={{
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#2C1A11'
                }}
              >
                {product.price} {lang === 'ar' ? 'د.ل' : 'LYD'}
              </div>

              {/* In Stock Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#16A34A',
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  marginTop: '0.15rem'
                }}
              >
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>{lang === 'ar' ? product.availability_ar : product.availability_en}</span>
              </div>

              {/* Action Button: عرض التفاصيل 🛒 */}
              <Link
                to={`/product/${product.id}`}
                style={{
                  marginTop: '0.75rem',
                  width: '100%',
                  background: '#3E271D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.72rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, transform 0.15s ease',
                  boxShadow: '0 3px 10px rgba(62, 39, 29, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2A180E';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3E271D';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
                <ShoppingCart size={17} strokeWidth={2.2} />
              </Link>
            </div>
          </article>
        </div>

      </div>
    </div>
  );
};

export default AccessoriesPage;
