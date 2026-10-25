import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import supabase from '../supabaseClient';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Maximize2,
  X,
  Check,
  Info,
  ShieldCheck,
  Shirt,
  Tag
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL || '/';

/* ─── DEFAULT ACCESSORIES CATALOG (First Star Item: FIGS Lab Coat) ─── */
const DEFAULT_ACCESSORY_PRODUCTS = [
  {
    id: '55000000-0000-0000-0000-000000000001',
    name_ar: 'لاب كوت ابيض FIGS محلي',
    name_en: 'White FIGS Lab Coat (Local)',
    price: 45,
    tag_ar: 'جديد ومميز 🔥',
    tag_en: 'New & Featured 🔥',
    desc_ar: 'بالطو طبي أبيض بتصميم FIGS محلي أنيق ومريح، مصنوع من خامة عملية وعالية الجودة لطلبة طب الأسنان والكوادر الطبية.',
    desc_en: 'White FIGS local medical lab coat, tailored with premium comfortable fabric for dental students and clinical sessions.',
    sizes: ['M', 'L', 'XL'],
    size_notice_ar: '💡 ملاحظة المقاس: زيد مقاس ديما على مقاسك العادي، وتقدر تقيس قبل الدفع.',
    size_notice_en: '💡 Sizing note: Always choose one size up from your regular size. Fitting available before payment.',
    images: [
      `${BASE}products/labcoat-figs-white-1.jpg`,
      `${BASE}products/labcoat-figs-white-2.jpg`,
      `${BASE}products/labcoat-figs-white-3.jpg`
    ]
  }
];

/* ─── LAB COAT & ACCESSORY CARD COMPONENT ─── */
const AccessoryProductCard = ({ product, onZoomImage }) => {
  const { lang } = useLanguage();
  const { addToCart } = useCart();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'L');
  const [addedNotice, setAddedNotice] = useState(false);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : [product.main_image || product.image_url || `${BASE}products/labcoat-figs-white-1.jpg`];

  const currentImage = images[selectedImgIndex] || images[0];

  const handleAddToCart = () => {
    const sizeSuffix = selectedSize ? ` (مقاس ${selectedSize})` : '';
    const sizeSuffixEn = selectedSize ? ` (Size ${selectedSize})` : '';

    addToCart({
      id: `${product.id}-${selectedSize}`,
      base_product_id: product.id,
      name_ar: `${product.name_ar}${sizeSuffix}`,
      name_en: `${product.name_en || product.name_ar}${sizeSuffixEn}`,
      price: product.price,
      selected_size: selectedSize,
      image_url: currentImage,
      stock_quantity: 10,
      is_accessory: true
    }, 1);

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  return (
    <div
      className="card animate-fade-in"
      style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* ── IMAGE SECTION WITH WATERMARK & THUMBNAILS ── */}
      <div style={{ position: 'relative', background: '#F8F6F2' }}>
        <div
          className="ad-watermarked-container product-card-image"
          style={{ position: 'relative', aspectRatio: '4/4.2', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => onZoomImage(currentImage, product.name_ar)}
          onContextMenu={e => e.preventDefault()}
        >
          <img
            src={currentImage}
            alt={product.name_ar}
            draggable={false}
            onContextMenu={e => e.preventDefault()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              display: 'block'
            }}
          />

          {/* Badge Tag */}
          <div style={{
            position: 'absolute',
            top: '0.85rem',
            right: '0.85rem',
            background: 'linear-gradient(135deg, #4B3324 0%, #2F1E14 100%)',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
          }}>
            {lang === 'ar' ? (product.tag_ar || 'إكسسوار طبي') : (product.tag_en || 'Medical Gear')}
          </div>

          {/* Zoom Button */}
          <div style={{
            position: 'absolute',
            top: '0.85rem',
            left: '0.85rem',
            background: 'rgba(0,0,0,0.55)',
            color: '#ffffff',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Maximize2 size={15} />
          </div>
        </div>

        {/* Thumbnail Selector (if multiple photos) */}
        {images.length > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.75rem',
            background: '#FFFFFF',
            borderTop: '1px solid rgba(0,0,0,0.06)'
          }}>
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImgIndex(idx)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '8px',
                  border: selectedImgIndex === idx ? '2px solid #4B3324' : '1px solid #E2E8F0',
                  overflow: 'hidden',
                  padding: 0,
                  cursor: 'pointer',
                  opacity: selectedImgIndex === idx ? 1 : 0.65,
                  transform: selectedImgIndex === idx ? 'scale(1.05)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.85rem' }}>
        {/* Title and Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              {lang === 'ar' ? product.name_ar : (product.name_en || product.name_ar)}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <ShieldCheck size={14} /> {lang === 'ar' ? 'متوفر وجاهز للتوصيل' : 'In Stock & Ready'}
            </span>
          </div>

          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--secondary)', whiteSpace: 'nowrap' }}>
            {product.price} <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{lang === 'ar' ? 'د.ل' : 'LYD'}</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {lang === 'ar' ? product.desc_ar : (product.desc_en || product.desc_ar)}
        </p>

        {/* Sizing Notice Box */}
        {(product.size_notice_ar || product.size_notice_en) && (
          <div style={{
            padding: '0.7rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.22)',
            color: '#92400E',
            fontSize: '0.82rem',
            fontWeight: 700,
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <Info size={16} style={{ flexShrink: 0, color: '#D97706' }} />
            <span>{lang === 'ar' ? product.size_notice_ar : (product.size_notice_en || product.size_notice_ar)}</span>
          </div>
        )}

        {/* Size Selection Chips */}
        {product.sizes && product.sizes.length > 0 && (
          <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              {lang === 'ar' ? 'المقاس المطلوب:' : 'Select Size:'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {product.sizes.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  style={{
                    flex: 1,
                    minWidth: '60px',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: selectedSize === sz ? '2px solid #4B3324' : '1px solid #CBD5E1',
                    background: selectedSize === sz ? '#4B3324' : '#FFFFFF',
                    color: selectedSize === sz ? '#FFFFFF' : '#1E293B',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: selectedSize === sz ? '0 2px 8px rgba(75, 51, 36, 0.25)' : 'none'
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Add to Cart + View Details */}
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.4rem' }}>
          <button
            type="button"
            onClick={handleAddToCart}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: addedNotice ? '#10B981' : 'linear-gradient(135deg, #4B3324 0%, #2F1E14 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(47, 30, 20, 0.2)'
            }}
          >
            {addedNotice ? (
              <>
                <Check size={18} />
                <span>{lang === 'ar' ? `تمت الإضافة (${selectedSize}) ✓` : `Added (${selectedSize}) ✓`}</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span>{lang === 'ar' ? `أضف للسلة (مقاس ${selectedSize})` : `Add (Size ${selectedSize})`}</span>
              </>
            )}
          </button>

          <Link
            to={`/product/${product.id}`}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--accent)',
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            {lang === 'ar' ? 'التفاصيل' : 'Details'}
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN ACCESSORIES PAGE ─── */
export const AccessoriesPage = () => {
  const { lang, isRtl } = useLanguage();
  const [products, setProducts] = useState(DEFAULT_ACCESSORY_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    let isMounted = true;

    const fetchAccessories = async () => {
      try {
        const { data: accList, error } = await supabase
          .from('accessory_products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!isMounted) return;

        if (!error && accList && accList.length > 0) {
          // Filter products that are NOT boxes (e.g., lab coats, uniforms, scrubs, decor)
          const nonBoxes = accList.filter(p => {
            const name = `${p.name_ar || ''} ${p.name_en || ''} ${p.size || ''}`.toLowerCase();
            return !name.includes('tool box') && !name.includes('organizer box') && !name.includes('gt-max') && !name.includes('inch');
          });

          if (nonBoxes.length > 0) {
            const mapped = nonBoxes.map(p => ({
              id: p.id,
              name_ar: p.name_ar,
              name_en: p.name_en,
              price: p.price,
              tag_ar: 'إكسسوار طبي',
              tag_en: 'Medical Gear',
              desc_ar: p.desc_ar,
              desc_en: p.desc_en,
              sizes: p.size ? p.size.split(/[/,]/).map(s => s.trim()).filter(Boolean) : ['M', 'L', 'XL'],
              size_notice_ar: '💡 ملاحظة المقاس: زيد مقاس ديما على مقاسك العادي، وتقدر تقيس قبل الدفع.',
              size_notice_en: '💡 Sizing note: Always choose one size up from your regular size. Fitting available before payment.',
              images: [
                p.main_image,
                p.inside_image,
                `${BASE}products/labcoat-figs-white-3.jpg`
              ].filter(Boolean)
            }));
            setProducts(mapped);
          }
        }
      } catch (err) {
        console.warn('Accessories fetch notice:', err);
      }
    };

    fetchAccessories();

    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E140E 0%, #38281D 50%, #24170F 100%)',
          borderBottom: '1px solid rgba(138, 108, 82, 0.25)',
          paddingBlock: 'clamp(2.5rem, 5vw, 4rem)',
          paddingInline: '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Breadcrumb Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronFwd size={14} />
            <span style={{ color: '#CDBFA6', fontWeight: 800 }}>
              {lang === 'ar' ? 'الإكسسوارات' : 'Accessories'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary)',
              flexShrink: 0
            }}>
              <Shirt size={28} />
            </div>

            <div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                {lang === 'ar' ? 'الإكسسوارات' : 'Accessories'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.85rem, 1.8vw, 1rem)', margin: '0.35rem 0 0 0', maxWidth: 650 }}>
                {lang === 'ar'
                  ? 'لابكوت، يونيفورم، ديكور وإكسسوارات طبية وشخصية لطلبة طب الأسنان'
                  : 'Lab coats, uniforms, clinic decor, and medical accessories for dental students.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="container" style={{ paddingBlock: '3rem', flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))',
          gap: '2rem'
        }}>
          {products.map(prod => (
            <AccessoryProductCard
              key={prod.id}
              product={prod}
              onZoomImage={(url, title) => setLightboxImg({ url, title })}
            />
          ))}
        </div>
      </div>

      {/* ── LIGHTBOX ZOOM MODAL ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.5rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: 'var(--surface-color)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20
              }}
            >
              <X size={20} />
            </button>

            <div
              className="ad-watermarked-container"
              onContextMenu={e => e.preventDefault()}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src={lightboxImg.url}
                alt={lightboxImg.title}
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                style={{
                  width: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <div className="ad-watermark-overlay">
                <div className="ad-watermark-logo" />
                <div className="ad-watermark-text">Absolute Dental</div>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: 'var(--accent)', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>
              {lightboxImg.title}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccessoriesPage;
