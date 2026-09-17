import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
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
  Layers,
  Sparkles,
  Box
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
    desc_ar: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    desc_en: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space at the bottom.',
    features_ar: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    features_en: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    main_image: `${BASE}accessories/box16-colors.png`,
    inside_image: `${BASE}accessories/box16-inside1.jpg`,
    colors: [
      { id: 'yellow', hex_code: '#F5C518', label_ar: 'Yellow', label_en: 'Yellow', image_url: `${BASE}accessories/box16-colors.png` },
      { id: 'maroon', hex_code: '#8B1A1A', label_ar: 'Maroon', label_en: 'Maroon', image_url: `${BASE}accessories/box16-colors.png` },
      { id: 'red',    hex_code: '#E02020', label_ar: 'Red',    label_en: 'Red',    image_url: `${BASE}accessories/box16-colors.png` },
      { id: 'purple', hex_code: '#7B3FE4', label_ar: 'Purple', label_en: 'Purple', image_url: `${BASE}accessories/box16-colors.png` },
      { id: 'blue',   hex_code: '#1565C0', label_ar: 'Blue',   label_en: 'Blue',   image_url: `${BASE}accessories/box16-colors.png` },
    ]
  },
  {
    id: 'box-16-5',
    size: '16.5 inch',
    name_ar: '16.5" Organizer Box',
    name_en: '16.5" Organizer Box',
    desc_ar: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    desc_en: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organizing small accessories.',
    features_ar: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    features_en: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'],
    main_image: `${BASE}accessories/box16_5-colors.png`,
    inside_image: `${BASE}accessories/box16_5-inside.png`,
    colors: [
      { id: 'red',    hex_code: '#D32F2F', label_ar: 'Red',        label_en: 'Red',        image_url: `${BASE}accessories/box16_5-colors.png` },
      { id: 'orange', hex_code: '#F57C00', label_ar: 'Orange',     label_en: 'Orange',     image_url: `${BASE}accessories/box16_5-colors.png` },
      { id: 'teal',   hex_code: '#00ACC1', label_ar: 'Teal',       label_en: 'Teal',       image_url: `${BASE}accessories/box16_5-colors.png` },
      { id: 'navy',   hex_code: '#1565C0', label_ar: 'Navy Blue',  label_en: 'Navy Blue',  image_url: `${BASE}accessories/box16_5-colors.png` },
      { id: 'blue',   hex_code: '#42A5F5', label_ar: 'Light Blue', label_en: 'Light Blue', image_url: `${BASE}accessories/box16_5-colors.png` },
      { id: 'green',  hex_code: '#43A047', label_ar: 'Green',      label_en: 'Green',      image_url: `${BASE}accessories/box16_5-colors.png` },
    ]
  },
  {
    id: 'box-17',
    size: '17 inch',
    name_ar: '17" Professional Box — GT-MAX',
    name_en: '17" Professional Box — GT-MAX',
    desc_ar: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a 4-compartment clear organizer and wide main storage.',
    desc_en: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a 4-compartment clear organizer and wide main storage.',
    features_ar: ['4-compartment clear lid organizer', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable plastic'],
    features_en: ['4-compartment clear lid organizer', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable plastic'],
    main_image: `${BASE}accessories/box17-colors.png`,
    inside_image: `${BASE}accessories/box17-inside.png`,
    colors: [
      { id: 'beige',  hex_code: '#C8A882', label_ar: 'Beige',      label_en: 'Beige',      image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'teal',   hex_code: '#00897B', label_ar: 'Teal',       label_en: 'Teal',       image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'pink',   hex_code: '#E91E8C', label_ar: 'Pink',       label_en: 'Pink',       image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'blue',   hex_code: '#42A5F5', label_ar: 'Light Blue', label_en: 'Light Blue', image_url: `${BASE}accessories/box17-group.jpg` },
      { id: 'red',    hex_code: '#E02020', label_ar: 'Red',        label_en: 'Red',        image_url: `${BASE}accessories/box17-group.jpg` },
      { id: 'lime',   hex_code: '#7CB342', label_ar: 'Lime Green', label_en: 'Lime Green', image_url: `${BASE}accessories/box17-colors.png` },
      { id: 'purple', hex_code: '#7B3FE4', label_ar: 'Purple',     label_en: 'Purple',     image_url: `${BASE}accessories/box17-colors.png` },
    ]
  }
];

/* ─── SINGLE DENTAL BOX PRODUCT CARD ────────────────────── */
const BoxProductCard = ({ box, whatsappNumber }) => {
  const colorsList = box.colors && box.colors.length > 0
    ? box.colors
    : [{ id: 'default', hex_code: '#CDBFA6', label_en: 'Standard', image_url: box.main_image || box.image_url }];

  const [selectedColor, setSelectedColor] = useState(colorsList[0]);
  const [showInside, setShowInside] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(true);

  // Synchronize when box changes
  useEffect(() => {
    if (box.colors && box.colors.length > 0) {
      setSelectedColor(box.colors[0]);
    }
  }, [box]);

  const activeImage = showInside
    ? (box.inside_image || box.main_image)
    : (selectedColor.image_url || box.main_image || `${BASE}accessories/box17-colors.png`);

  const buildWhatsappUrl = () => {
    const colorLabel = selectedColor.label_en || selectedColor.label_ar || 'Standard';
    const productName = box.name_en || box.name_ar || `Dental Box ${box.size}`;
    const msg = `Hi, I'd like to order: ${productName} (${box.size}) — Color: ${colorLabel} 🎨`;
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
      {/* ── IMAGE WRAPPER ── */}
      <div style={{ position: 'relative', background: 'var(--accent)', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img
          key={activeImage}
          src={activeImage}
          alt={box.name_en || box.size}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.35s ease',
            opacity: imgLoaded ? 1 : 0.4
          }}
        />

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

        {/* Inside / Outside View Toggle Button */}
        {box.inside_image && (
          <button
            type="button"
            onClick={() => { setShowInside(v => !v); setImgLoaded(false); }}
            style={{
              position: 'absolute',
              bottom: '0.85rem',
              left: '0.85rem',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '0.4rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              minHeight: '36px'
            }}
          >
            <Info size={14} />
            {showInside ? 'Outside View' : 'Inside View'}
          </button>
        )}

        {/* Selected Color Badge */}
        <div style={{
          position: 'absolute',
          bottom: '0.85rem',
          right: '0.85rem',
          background: (selectedColor.hex_code || '#333') + 'dd',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          borderRadius: '999px',
          padding: '0.35rem 0.85rem',
          fontSize: '0.75rem',
          fontWeight: 800,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)'
        }}>
          {selectedColor.label_en || selectedColor.label_ar || 'Default'}
        </div>
      </div>

      {/* ── CARD CONTENT BODY ── */}
      <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        
        {/* Title & Size */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              {box.size}
            </h3>
            {box.price > 0 && (
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)' }}>
                {box.price} LYD
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {box.desc_en || box.desc_ar}
          </p>
        </div>

        {/* ── COLOR SELECTOR ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
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
                  onClick={() => {
                    setSelectedColor(color);
                    setShowInside(false);
                    setImgLoaded(false);
                  }}
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
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--secondary)', fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ── WHATSAPP ORDER BUTTON ── */}
        <a
          href={buildWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '0.6rem',
            background: '#25D366',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.92rem',
            textDecoration: 'none',
            marginTop: 'auto',
            boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            minHeight: '44px'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <MessageCircle size={19} />
          <span>Order via WhatsApp</span>
          <ChevronRight size={16} />
        </a>
      </div>
    </div>
  );
};

/* ─── MAIN ACCESSORIES PAGE COMPONENT ─────────────────────── */
export const AccessoriesPage = () => {
  const { lang, isRtl } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [boxesProducts, setBoxesProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('218911234567');
  const [accessoriesBg, setAccessoriesBg] = useState('');
  const [dentalBoxesBg, setDentalBoxesBg] = useState('');

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  // 1. Fetch categories, products, color variants & page settings
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch WhatsApp contact from settings
        const { data: contactSetting } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'contact_links')
          .single();

        if (contactSetting?.value?.whatsapp) {
          const match = String(contactSetting.value.whatsapp).match(/\d+/);
          if (match && isMounted) setWhatsappNumber(match[0]);
        }

        // Fetch Background Images settings
        const { data: bgSetting } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'accessories_bgs')
          .single();

        if (bgSetting?.value && isMounted) {
          if (bgSetting.value.accessories_page_bg) setAccessoriesBg(bgSetting.value.accessories_page_bg);
          if (bgSetting.value.dental_boxes_page_bg) setDentalBoxesBg(bgSetting.value.dental_boxes_page_bg);
        }

        // Fetch Categories
        const { data: catData, error: catErr } = await supabase
          .from('accessory_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!catErr && catData && catData.length > 0 && isMounted) {
          setCategories(catData);
        } else if (isMounted) {
          setCategories(FALLBACK_CATEGORIES);
        }

        // Fetch Dental Boxes Products + Colors
        const { data: prodData, error: prodErr } = await supabase
          .from('accessory_products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!prodErr && prodData && prodData.length > 0 && isMounted) {
          // Fetch color variants for each product
          const prodsWithColors = await Promise.all(
            prodData.map(async (prod) => {
              const { data: colorsData } = await supabase
                .from('accessory_product_colors')
                .select('*')
                .eq('product_id', prod.id)
                .order('sort_order', { ascending: true });
              return {
                ...prod,
                colors: colorsData || []
              };
            })
          );
          setBoxesProducts(prodsWithColors);
        } else if (isMounted) {
          setBoxesProducts(FALLBACK_BOXES);
        }
      } catch (err) {
        console.warn('Using fallback accessories data:', err);
        if (isMounted) {
          setCategories(FALLBACK_CATEGORIES);
          setBoxesProducts(FALLBACK_BOXES);
        }
      } finally {
        if (isMounted) setLoading(false);
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
            
            {selectedCategory ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  {lang === 'ar' ? 'اكسسوارات الأسنان' : 'Accessories'}
                </button>
                <ChevronFwd size={14} />
                <span style={{ color: '#CDBFA6', fontWeight: 800 }}>
                  {selectedCategory.name_en || selectedCategory.name_ar}
                </span>
              </>
            ) : (
              <span style={{ color: '#CDBFA6', fontWeight: 800 }}>
                {lang === 'ar' ? 'اكسسوارات الأسنان' : 'Accessories'}
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
                  : (lang === 'ar' ? 'اكسسوارات الأسنان' : 'Dental Accessories')}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)', margin: '0.35rem 0 0 0', maxWidth: 620 }}>
                {selectedCategory
                  ? (selectedCategory.description_en || selectedCategory.description_ar || 'Professional dental equipment boxes in multiple sizes and colors.')
                  : (lang === 'ar'
                      ? 'تصفح أقسام المستلزمات والبوكسات الاحترافية بالأحجام والألوان المخصصة'
                      : 'Explore specialized categories, boxes, and accessories engineered for dental students')}
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
                />
              ))}
            </div>

            {/* Bottom Info Note */}
            <div style={{
              marginTop: '3rem',
              background: 'var(--accent)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem 1.6rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem'
            }}>
              <Package size={22} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                {lang === 'ar'
                  ? 'جميع البوكسات متوفرة للبيع المباشر — اختر اللون والحجم المناسب واطلب مباشرة عبر واتساب لتأكيد التوفر والتوصيل المجاني إلى كلية طب الأسنان.'
                  : 'All boxes are available for direct student orders — select your preferred size and color, then click Order via WhatsApp for instant confirmation.'}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AccessoriesPage;
