import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import supabase from '../supabaseClient';
import {
  Package,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  CheckCircle2,
  Info,
  ArrowLeft,
  ArrowRight,
  Box,
  ShoppingCart,
  Maximize2,
  X,
  Check
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL || '/';



/* ─── HARDCODED FALLBACKS (Used only if DB returns 0 rows) ─── */
const FALLBACK_CATEGORIES = [
  {
    id: 'cat-1',
    name_ar: 'بوكسات الأسنان',
    name_en: 'Dental Boxes',
    slug: 'dental-boxes',
    description_ar: 'بوكسات تخزين وتنظيم الأدوات الطبية بأحجام وألوان متعددة',
    description_en: 'Professional storage & organizer boxes in various sizes & colors',
    image_url: `${BASE}accessories/box17-colors.png`
  }
];

const FALLBACK_BOXES = [
  {
    id: 'box-16',
    size: '16 inch',
    name_ar: '16" Dental Tool Box',
    name_en: '16" Dental Tool Box',
    price: 65,
    desc_ar: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    desc_en: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    features_ar: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    features_en: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    main_image: `${BASE}accessories/box16-maroon.jpg`,
    inside_image: `${BASE}accessories/box16-inside-maroon.jpg`,
    colors: [
      { id: 'maroon', hex_code: '#800020', label_ar: 'خمري / عنابي', label_en: 'Maroon', image_url: `${BASE}accessories/box16-maroon.jpg`, inside_image_url: `${BASE}accessories/box16-inside-maroon.jpg`, base_image_url: `${BASE}accessories/box16-base-maroon.jpg` },
      { id: 'yellow', hex_code: '#F5C518', label_ar: 'أصفر', label_en: 'Yellow', image_url: `${BASE}accessories/box16-yellow.jpg`, inside_image_url: `${BASE}accessories/box16-inside-yellow.jpg`, base_image_url: `${BASE}accessories/box16-base-yellow.jpg` },
      { id: 'red',    hex_code: '#E02020', label_ar: 'أحمر', label_en: 'Red', image_url: `${BASE}accessories/box16-red.jpg`, inside_image_url: `${BASE}accessories/box16-inside-red.jpg`, base_image_url: `${BASE}accessories/box16-base-red.jpg` },
      { id: 'purple', hex_code: '#7B3FE4', label_ar: 'بنفسجي', label_en: 'Purple', image_url: `${BASE}accessories/box16-purple.jpg`, inside_image_url: `${BASE}accessories/box16-inside-purple.jpg`, base_image_url: `${BASE}accessories/box16-base-purple.jpg` },
      { id: 'blue',   hex_code: '#1565C0', label_ar: 'أزرق', label_en: 'Blue', image_url: `${BASE}accessories/box16-blue.jpg`, inside_image_url: `${BASE}accessories/box16-inside-blue.jpg`, base_image_url: `${BASE}accessories/box16-base-blue.jpg` },
    ]
  },
  {
    id: 'box-16-5',
    size: '16.5 inch',
    name_ar: '16.5" Organizer Box',
    name_en: '16.5" Organizer Box',
    price: 75,
    desc_ar: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    desc_en: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    features_ar: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    features_en: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    main_image: `${BASE}accessories/box16_5-colors.png`,
    inside_image: `${BASE}accessories/box16_5-inside.png`,
    colors: [
      { id: 'blue',   hex_code: '#2196F3', label_ar: 'أزرق فاتح',   label_en: 'Light Blue', image_url: `${BASE}accessories/box16_5-blue.png`,   inside_image_url: `${BASE}accessories/box16_5-inside-blue.jpg` },
      { id: 'green',  hex_code: '#7CB342', label_ar: 'أخضر',        label_en: 'Lime Green', image_url: `${BASE}accessories/box16_5-green.jpg`,  inside_image_url: `${BASE}accessories/box16_5-inside-green.jpg` },
      { id: 'teal',   hex_code: '#00ACC1', label_ar: 'تركوازي',     label_en: 'Teal',       image_url: `${BASE}accessories/box16_5-teal.jpg`,   inside_image_url: `${BASE}accessories/box16_5-inside-teal.jpg` },
      { id: 'red',    hex_code: '#D32F2F', label_ar: 'أحمر',        label_en: 'Red',        image_url: `${BASE}accessories/box16_5-red.jpg`,    inside_image_url: `${BASE}accessories/box16_5-inside-red.jpg` },
      { id: 'orange', hex_code: '#F57C00', label_ar: 'برتقالي',     label_en: 'Orange',     image_url: `${BASE}accessories/box16_5-orange.jpg`, inside_image_url: `${BASE}accessories/box16_5-inside-orange.jpg` },
      { id: 'navy',   hex_code: '#0D47A1', label_ar: 'أزرق داكن',   label_en: 'Navy Blue',  image_url: `${BASE}accessories/box16_5-blue.jpg`,   inside_image_url: `${BASE}accessories/box16_5-inside-blue.jpg` },
    ]
  },
  {
    id: 'box-17',
    size: '17 inch',
    name_ar: '17" Professional Box — GT-MAX',
    name_en: '17" Professional Box — GT-MAX',
    price: 95,
    desc_ar: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a 4-compartment clear organizer and wide main storage.',
    desc_en: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a 4-compartment clear organizer and wide main storage.',
    features_ar: ['4-compartment clear lid organizer', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable plastic'],
    features_en: ['4-compartment clear lid organizer', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable plastic'],
    main_image: `${BASE}accessories/box17-purple.jpg`,
    inside_image: `${BASE}accessories/box17-inside-purple.jpg`,
    colors: [
      { id: 'purple', hex_code: '#A880C8', label_ar: 'بنفسجي',     label_en: 'Purple',     image_url: `${BASE}accessories/box17-purple.jpg`, inside_image_url: `${BASE}accessories/box17-inside-purple.jpg` },
      { id: 'blue',   hex_code: '#1565C0', label_ar: 'أزرق',       label_en: 'Blue',       image_url: `${BASE}accessories/box17-blue.jpg`, inside_image_url: `${BASE}accessories/box17-inside-blue.jpg` },
      { id: 'red',    hex_code: '#E02020', label_ar: 'أحمر',        label_en: 'Red',        image_url: `${BASE}accessories/box17-red.jpg`, inside_image_url: `${BASE}accessories/box17-inside-red.jpg` },
      { id: 'maroon', hex_code: '#800020', label_ar: 'عنابي / خمري', label_en: 'Maroon',     image_url: `${BASE}accessories/box17-maroon.jpg`, inside_image_url: `${BASE}accessories/box17-inside-maroon.jpg` },
      { id: 'beige',  hex_code: '#C8A882', label_ar: 'بيج',        label_en: 'Beige',      image_url: `${BASE}accessories/box17-beige.jpg`, inside_image_url: `${BASE}accessories/box17-inside-beige.jpg` },
      { id: 'teal',   hex_code: '#00897B', label_ar: 'تركوازي',     label_en: 'Teal',       image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'pink',   hex_code: '#E91E8C', label_ar: 'وردي',        label_en: 'Pink',       image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'lime',   hex_code: '#7CB342', label_ar: 'أخضر فسفوري', label_en: 'Lime Green', image_url: `${BASE}accessories/box17-colors.png` },
    ]
  }
];

/* ─── SINGLE DENTAL BOX PRODUCT CARD ────────────────────── */
const BoxProductCard = ({ box, whatsappNumber, onZoomImage }) => {
  const { addToCart } = useCart();
  const { lang } = useLanguage();
  const colorsList = box.colors && box.colors.length > 0
    ? box.colors
    : [{ id: 'default', hex_code: '#CDBFA6', label_en: 'Standard', image_url: box.main_image || box.image_url }];

  const [selectedColor, setSelectedColor] = useState(colorsList[0]);
  const [viewMode, setViewMode] = useState('outside'); // 'outside', 'inside', 'base'
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (box.colors && box.colors.length > 0) {
      setSelectedColor(box.colors[0]);
    }
  }, [box]);

  // ── Preload all color variant images silently into memory for 0ms instant switching ──
  useEffect(() => {
    colorsList.forEach(color => {
      const colorId = (color.color_id || color.id || 'maroon').toLowerCase();
      const urls = [
        color.image_url,
        color.inside_image_url || (box.size?.includes('17') ? `${BASE}accessories/box17-inside-${colorId}.jpg` : box.size?.includes('16.5') ? `${BASE}accessories/box16_5-inside-${colorId}.jpg` : `${BASE}accessories/box16-inside-${colorId}.jpg`),
        color.base_image_url || `${BASE}accessories/box16-base-${colorId}.jpg`
      ];
      urls.forEach(url => {
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    });
  }, [box, colorsList]);

  const getActiveViewImage = () => {
    const colorId = (selectedColor?.color_id || selectedColor?.id || 'maroon').toLowerCase();

    if (viewMode === 'base') {
      if (selectedColor?.base_image_url) return selectedColor.base_image_url;
      if (box.size === '16 inch' || (box.name_en && box.name_en.includes('16'))) {
        return `${BASE}accessories/box16-base-${colorId}.jpg`;
      }
      return box.inside_image || box.main_image;
    }

    if (viewMode === 'inside') {
      if (selectedColor?.inside_image_url) return selectedColor.inside_image_url;
      if (box.size === '17 inch' || (box.name_en && box.name_en.includes('17'))) {
        return `${BASE}accessories/box17-inside-${colorId}.jpg`;
      }
      if (box.size === '16.5 inch' || (box.name_en && box.name_en.includes('16.5'))) {
        return `${BASE}accessories/box16_5-inside-${colorId}.jpg`;
      }
      if (box.size === '16 inch' || (box.name_en && box.name_en.includes('16'))) {
        return `${BASE}accessories/box16-inside-${colorId}.jpg`;
      }
      return box.inside_image || box.main_image;
    }

    return selectedColor?.image_url || box.main_image || `${BASE}accessories/box17-colors.png`;
  };

  const activeImage = getActiveViewImage();

  const handleAddToCart = () => {
    const colorLabel = selectedColor.label_en || selectedColor.label_ar || 'Standard';
    const productName = `${box.name_en || box.name_ar || 'Dental Box'} (${box.size}) — ${colorLabel}`;
    
    addToCart({
      id: `${box.id}-${selectedColor.id || 'std'}`,
      name_ar: productName,
      name_en: productName,
      price: parseFloat(box.price || 0),
      image_url: activeImage,
      stock_quantity: 100
    }, 1);

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const buildWhatsappUrl = () => {
    const colorLabel = selectedColor.label_en || selectedColor.label_ar || 'Standard';
    const productName = box.name_en || box.name_ar || `Dental Box ${box.size}`;
    const msg = `Hi, I'd like to inquire about: ${productName} (${box.size}) — Color: ${colorLabel} 🎨`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const features = Array.isArray(box.features_en)
    ? box.features_en
    : (Array.isArray(box.features_ar) ? box.features_ar : []);

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
      {/* ── IMAGE WRAPPER WITH 3-VIEW SELECTOR ── */}
      <div style={{ position: 'relative', background: 'var(--accent)', aspectRatio: '4/3', overflow: 'hidden', cursor: 'pointer' }} onClick={() => onZoomImage(activeImage, box.name_en || box.size)}>
        <img
          src={activeImage}
          alt={box.name_en || box.size}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 1
          }}
        />

        {/* Zoom Hint */}
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

        {/* Size Badge */}
        <div style={{
          position: 'absolute',
          top: '0.85rem',
          right: '0.85rem',
          background: 'var(--secondary)',
          color: '#ffffff',
          fontSize: '0.8rem',
          fontWeight: 800,
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
          letterSpacing: '0.04em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {box.size}
        </div>

        {/* Multi-View Selector Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '0.65rem',
            left: '0.65rem',
            right: '0.65rem',
            display: 'flex',
            gap: '0.3rem',
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            borderRadius: '999px',
            padding: '3px',
            zIndex: 11,
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('outside')}
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              border: 'none',
              borderRadius: '999px',
              background: viewMode === 'outside' ? 'var(--secondary)' : 'transparent',
              color: viewMode === 'outside' ? '#ffffff' : 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {lang === 'ar' ? '📦 مغلق' : '📦 Closed'}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('inside')}
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              border: 'none',
              borderRadius: '999px',
              background: viewMode === 'inside' ? 'var(--secondary)' : 'transparent',
              color: viewMode === 'inside' ? '#ffffff' : 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {lang === 'ar' ? '📥 الرف الداخلي' : '📥 Tray View'}
          </button>

          {(box.size === '16 inch' || box.name_en?.includes('16"')) && (
            <button
              type="button"
              onClick={() => setViewMode('base')}
              style={{
                flex: 1,
                padding: '0.35rem 0.4rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: 'none',
                borderRadius: '999px',
                background: viewMode === 'base' ? 'var(--secondary)' : 'transparent',
                color: viewMode === 'base' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {lang === 'ar' ? '🗃️ بدون رف' : '🗃️ Base'}
            </button>
          )}
        </div>
      </div>

      {/* ── CARD CONTENT BODY ── */}
      <div style={{ padding: 'clamp(1rem, 3vw, 1.4rem)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem', minWidth: 0 }}>
        
        {/* Title & Size */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              {box.size}
            </h3>
            {box.price > 0 && (
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--secondary)', flexShrink: 0 }}>
                {box.price} LYD
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {box.desc_en || box.desc_ar}
          </p>
        </div>

        {/* ── COLOR SELECTOR ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Colors:
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
              {selectedColor.label_en || selectedColor.label_ar}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {colorsList.map(color => {
              const isSelected = selectedColor.id === color.id;
              return (
                <button
                  key={color.id || color.color_id}
                  type="button"
                  title={color.label_en || color.label_ar}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: color.hex_code || '#888',
                    border: isSelected ? '3px solid var(--secondary)' : '2px solid transparent',
                    boxShadow: isSelected ? '0 0 0 2px var(--secondary)' : '0 1px 3px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isSelected && (
                    <CheckCircle2
                      size={16}
                      style={{
                        color: '#ffffff',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FEATURES LIST ── */}
        {features.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {features.map((feat, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                <span style={{ color: 'var(--secondary)', fontWeight: 900, flexShrink: 0, marginTop: '2px' }}>✓</span>
                <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{feat}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ── ORDER BUTTONS (DIRECT SITE CHECKOUT + WHATSAPP) ── */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          
          {/* Direct Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              minHeight: '44px'
            }}
          >
            {addedNotice ? (
              <>
                <Check size={18} />
                <span>{lang === 'ar' ? 'تمت الإضافة للسلة!' : 'Added to Cart!'}</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span>{lang === 'ar' ? 'إضافة إلى السلة والطلب مباشرة' : 'Add to Cart / Order'}</span>
              </>
            )}
          </button>

          {/* Optional WhatsApp Inquiry */}
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '0.5rem',
              background: 'transparent',
              color: '#25D366',
              border: '1px solid #25D366',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 1rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              transition: 'background 0.2s ease'
            }}
          >
            <MessageCircle size={16} />
            <span>{lang === 'ar' ? 'استفسار عبر واتساب' : 'Inquire via WhatsApp'}</span>
          </a>

        </div>

      </div>
    </div>
  );
};

/* ─── MAIN ACCESSORIES PAGE COMPONENT ─────────────────────── */
export const AccessoriesPage = () => {
  const { lang, isRtl } = useLanguage();
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [boxesProducts, setBoxesProducts] = useState(FALLBACK_BOXES);
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('218911234567');
  const [accessoriesBg, setAccessoriesBg] = useState('');
  const [dentalBoxesBg, setDentalBoxesBg] = useState('');

  // Lightbox Zoom Modal State
  const [lightboxImg, setLightboxImg] = useState(null);

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [contactRes, bgRes, catRes, prodRes] = await Promise.all([
          supabase.from('settings').select('value').eq('key', 'contact_links').single(),
          supabase.from('settings').select('value').eq('key', 'accessories_bgs').single(),
          supabase.from('accessory_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('accessory_products').select('*, colors:accessory_product_colors(*)').eq('is_active', true).order('sort_order', { ascending: true })
        ]);

        if (!isMounted) return;

        if (contactRes.data?.value?.whatsapp) {
          const match = String(contactRes.data.value.whatsapp).match(/\d+/);
          if (match) setWhatsappNumber(match[0]);
        }

        if (bgRes.data?.value) {
          if (bgRes.data.value.accessories_page_bg) setAccessoriesBg(bgRes.data.value.accessories_page_bg);
          if (bgRes.data.value.dental_boxes_page_bg) setDentalBoxesBg(bgRes.data.value.dental_boxes_page_bg);
        }

        if (!catRes.error && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }

        if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
          const prodsWithColors = prodRes.data.map(prod => ({
            ...prod,
            colors: (prod.colors && prod.colors.length > 0) ? prod.colors : []
          }));
          setBoxesProducts(prodsWithColors);
        }
      } catch (err) {
        console.warn('Background accessories sync fallback active:', err);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  const activeHeroBg = selectedCategory
    ? (dentalBoxesBg || 'var(--gradient-dark)')
    : (accessoriesBg || 'var(--gradient-dark)');

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HERO SECTION ── */}
      <div
        style={{
          background: activeHeroBg.startsWith('http') || activeHeroBg.startsWith('/')
            ? `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.92)), url("${activeHeroBg}") center/cover no-repeat`
            : 'var(--gradient-dark)',
          borderBottom: '1px solid var(--border-color)',
          paddingBlock: 'clamp(2.5rem, 5vw, 4.5rem)',
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
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              {lang === 'ar' ? 'السنوات الدراسية' : 'Academic Years'}
            </span>
            <ChevronFwd size={14} />
            
            {selectedCategory ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  {lang === 'ar' ? 'إكسسوارات الأسنان' : 'Accessories'}
                </button>
                <ChevronFwd size={14} />
                <span style={{ color: '#CDBFA6', fontWeight: 800 }}>
                  {selectedCategory.name_en || selectedCategory.name_ar}
                </span>
              </>
            ) : (
              <span style={{ color: '#CDBFA6', fontWeight: 800 }}>
                {lang === 'ar' ? 'إكسسوارات الأسنان' : 'Accessories'}
              </span>
            )}
          </div>

          {/* Hero Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: 42,
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  flexShrink: 0
                }}
                title={lang === 'ar' ? 'الرجوع للأقسام' : 'Back to Categories'}
              >
                <BackArrow size={20} />
              </button>
            )}

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
              {selectedCategory ? <Box size={26} /> : <Package size={26} />}
            </div>

            <div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                {selectedCategory
                  ? (selectedCategory.name_en || selectedCategory.name_ar)
                  : (lang === 'ar' ? 'إكسسوارات الأسنان' : 'Dental Accessories')}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)', margin: '0.35rem 0 0 0', maxWidth: 620 }}>
                {selectedCategory
                  ? (selectedCategory.description_en || selectedCategory.description_ar || 'Professional dental equipment boxes in multiple sizes and colors.')
                  : (lang === 'ar'
                      ? 'قسم الإكسسوارات الشامل لجميع السنوات الدراسية — بوكسات وحقائب أدوات احترافية'
                      : 'Comprehensive accessories section covering all academic years — professional tool boxes & gear')}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="container" style={{ paddingBlock: '3rem', flex: 1 }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
            <p>{lang === 'ar' ? 'جاري تحميل المحتوى...' : 'Loading accessories...'}</p>
          </div>
        ) : !selectedCategory ? (

          /* ── LEVEL 1: CATEGORIES OVERVIEW GRID ── */
          <div>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  {lang === 'ar' ? 'أقسام الإكسسوارات' : 'Accessories Categories'}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {lang === 'ar' ? 'اختر القسم لعرض المنتجات والأحجام المتوفرة' : 'Select a category to view available sizes & options'}
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem'
            }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className="card animate-fade-in"
                  style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{ position: 'relative', background: 'var(--accent)', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img
                      src={cat.image_url || `${BASE}accessories/box17-colors.png`}
                      alt={cat.name_en || cat.name_ar}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '1.25rem'
                    }}>
                      <span style={{
                        background: 'var(--secondary)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase'
                      }}>
                        {cat.slug === 'dental-boxes' ? 'Featured' : 'Category'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                        {lang === 'ar' ? cat.name_ar : (cat.name_en || cat.name_ar)}
                      </h3>
                      <ChevronFwd size={18} style={{ color: 'var(--secondary)' }} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {lang === 'ar' ? cat.description_ar : (cat.description_en || cat.description_ar)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ── LEVEL 2: DENTAL BOXES / CATEGORY PRODUCTS VIEW ── */
          <div>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--secondary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                    padding: 0
                  }}
                >
                  <BackArrow size={16} />
                  <span>{lang === 'ar' ? 'الرجوع لجميع الأقسام' : 'Back to Categories'}</span>
                </button>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  Dental Boxes Selection
                </h2>
              </div>
            </div>

            {/* 3 Product Cards Grid (17 inch, 16.5 inch, 16 inch) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {boxesProducts.map(box => (
                <BoxProductCard
                  key={box.id}
                  box={box}
                  whatsappNumber={whatsappNumber}
                  onZoomImage={(url, title) => setLightboxImg({ url, title })}
                />
              ))}
            </div>

          </div>
        )}

      </div>

      {/* ── LIGHTBOX ZOOM MODAL WITH WATERMARK ── */}
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

            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              style={{
                width: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />

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
