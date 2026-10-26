import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recordProductOrigin } from '../utils/navigationTrail';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import supabase from '../supabaseClient';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Box,
  ShoppingCart,
  Maximize2,
  X,
  Check,
  Ban
} from 'lucide-react';
import BoxColorVariantSelector from '../components/BoxColorVariantSelector';
import dentalBoxesFaded from '../assets/images/dental-boxes-faded.png';
import {
  splitBoxColorsByAvailability,
  cleanColorLabel,
  fetchCanonicalBoxInventory,
  FALLBACK_BOXES,
  getBoxProductById
} from '../utils/boxInventoryEngine';

const BASE = import.meta.env.BASE_URL || '/';

/* ─── SINGLE DENTAL BOX PRODUCT CARD ────────────────────── */
const BoxProductCard = ({ box, whatsappNumber, onZoomImage, inventoryMap = {} }) => {
  const { addToCart } = useCart();
  const { lang, isRtl } = useLanguage();
  const navigate = useNavigate();

  const handleOpenDetails = () => {
    recordProductOrigin(box.id, { from: 'boxes', returnPath: '/boxes' });
    navigate(`/product/${box.id}?from=boxes`, {
      state: { from: '/boxes', returnPath: '/boxes' }
    });
  };

  const { availableColors, unavailableColors } = splitBoxColorsByAvailability(
    box.colors && box.colors.length > 0
      ? box.colors
      : [{ id: 'default', hex_code: '#CDBFA6', label_en: 'Standard', image_url: box.main_image || box.image_url }],
    inventoryMap
  );

  const colorsList = [...availableColors, ...unavailableColors];

  const [selectedColor, setSelectedColor] = useState(
    availableColors[0] || unavailableColors[0] || colorsList[0] || null
  );
  const [viewMode, setViewMode] = useState('outside');
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (availableColors.length > 0) {
      setSelectedColor(prev => {
        const stillAvailable = prev && availableColors.find(c => c.id === prev.id || c.color_id === prev.color_id);
        return stillAvailable || availableColors[0];
      });
    } else if (unavailableColors.length > 0) {
      setSelectedColor(prev => {
        const stillMatch = prev && unavailableColors.find(c => c.id === prev.id || c.color_id === prev.color_id);
        return stillMatch || unavailableColors[0];
      });
    }
  }, [box, inventoryMap]);

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

  const isSelectedColorAvailable = Boolean(
    selectedColor && selectedColor.available_stock > 0
  );

  const effectivePrice = selectedColor?.price || box.price || 0;

  const handleAddToCart = () => {
    if (!selectedColor || !isSelectedColorAvailable) return;

    const variantColorLabel = cleanColorLabel(selectedColor, 'ar');
    const variantColorLabelEn = cleanColorLabel(selectedColor, 'en');

    addToCart({
      ...box,
      id: `${box.id}-${selectedColor.color_id || selectedColor.id}`,
      base_product_id: box.id,
      name_ar: `${box.name_ar} (${variantColorLabel})`,
      name_en: `${box.name_en} (${variantColorLabelEn})`,
      price: effectivePrice,
      is_box: true,
      selected_color: variantColorLabel,
      image_url: selectedColor.image_url || activeImage,
      availableStock: selectedColor.available_stock,
      stock_quantity: selectedColor.available_stock
    }, 1);

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
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
      {/* ── IMAGE WRAPPER WITH 3-VIEW SELECTOR ── */}
      <div
        className="ad-watermarked-container product-card-image"
        style={{ position: 'relative', background: 'var(--accent)', aspectRatio: '4/3', overflow: 'hidden', cursor: 'pointer' }}
        onClick={handleOpenDetails}
        title={lang === 'ar' ? 'انقر لفتح تفاصيل البوكس' : 'Click to view box details'}
        onContextMenu={e => e.preventDefault()}
      >
        <img
          src={activeImage}
          alt={box.name_en || box.size}
          draggable={false}
          onContextMenu={e => e.preventDefault()}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 1
          }}
        />

        {/* Zoom Button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onZoomImage(activeImage, box.name_en || box.size);
          }}
          title={lang === 'ar' ? 'تكبير الصورة' : 'Zoom Image'}
          style={{
            position: 'absolute',
            top: '0.85rem',
            left: '0.85rem',
            background: 'rgba(0,0,0,0.6)',
            color: '#ffffff',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4,
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
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
          padding: '0.25rem 0.65rem',
          borderRadius: '999px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
          {box.size || 'Pro Box'}
        </div>

        {/* View Switcher Chips */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '0.65rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.35rem',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: '3px',
            borderRadius: '999px',
            zIndex: 3
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('outside')}
            style={{
              border: 'none',
              background: viewMode === 'outside' ? 'var(--secondary)' : 'transparent',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              cursor: 'pointer'
            }}
          >
            {lang === 'ar' ? 'الخارجي' : 'Outside'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('inside')}
            style={{
              border: 'none',
              background: viewMode === 'inside' ? 'var(--secondary)' : 'transparent',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              cursor: 'pointer'
            }}
          >
            {lang === 'ar' ? 'الداخلي' : 'Inside'}
          </button>
          {(box.size === '16 inch' || (box.name_en && box.name_en.includes('16'))) && (
            <button
              type="button"
              onClick={() => setViewMode('base')}
              style={{
                border: 'none',
                background: viewMode === 'base' ? 'var(--secondary)' : 'transparent',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                cursor: 'pointer'
              }}
            >
              {lang === 'ar' ? 'القاع' : 'Base'}
            </button>
          )}
        </div>
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3
            onClick={handleOpenDetails}
            style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, cursor: 'pointer', transition: 'color 0.15s ease' }}
            title={lang === 'ar' ? 'عرض تفاصيل البوكس' : 'View Box Details'}
          >
            {lang === 'ar' ? box.name_ar : (box.name_en || box.name_ar)}
          </h3>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--secondary)', whiteSpace: 'nowrap' }}>
            {effectivePrice} <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{lang === 'ar' ? 'د.ل' : 'LYD'}</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
          {lang === 'ar' ? (box.desc_ar || box.description_ar) : (box.desc_en || box.description_en || box.desc_ar)}
        </p>

        {/* Color Variant Selector */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <BoxColorVariantSelector
            box={box}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            inventoryMap={inventoryMap}
          />
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '0.55rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleOpenDetails}
            className="btn btn-outline"
            style={{
              padding: '0.65rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              borderColor: '#D5C7B8',
              backgroundColor: '#FAF7F2',
              color: '#3E271D',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap'
            }}
            title={lang === 'ar' ? 'فتح صفحة تفاصيل البوكس' : 'View full box details'}
          >
            <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
            {isRtl ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>

          <button
            type="button"
            disabled={!isSelectedColorAvailable}
            onClick={handleAddToCart}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: addedNotice
                ? '#10B981'
                : isSelectedColorAvailable
                  ? 'var(--primary)'
                  : 'rgba(100, 116, 139, 0.2)',
              color: isSelectedColorAvailable ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: isSelectedColorAvailable ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s ease, transform 0.15s ease'
            }}
          >
            {addedNotice ? (
              <>
                <Check size={18} />
                <span>{lang === 'ar' ? 'تمت الإضافة للسلة ✓' : 'Added to Cart ✓'}</span>
              </>
            ) : isSelectedColorAvailable ? (
              <>
                <ShoppingCart size={18} />
                <span>{lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
              </>
            ) : (
              <>
                <Ban size={18} />
                <span>{lang === 'ar' ? 'اللون غير متوفر' : 'Out of Stock'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN BOXES PAGE COMPONENT ───────────────────────────── */
export const BoxesPage = () => {
  const { lang, isRtl } = useLanguage();
  const [boxesProducts, setBoxesProducts] = useState(FALLBACK_BOXES);
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('218946859163');
  const [boxInventory, setBoxInventory] = useState({});
  const [lightboxImg, setLightboxImg] = useState(null);

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [contactRes, prodRes, boxInvRes] = await Promise.all([
          supabase.from('settings').select('value').eq('key', 'contact_links').single(),
          supabase.from('accessory_products').select('*, colors:accessory_product_colors(*)').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('settings').select('value').eq('key', 'box_variants_inventory').maybeSingle()
        ]);

        if (!isMounted) return;

        if (contactRes.data?.value?.whatsapp) {
          const match = String(contactRes.data.value.whatsapp).match(/\d+/);
          if (match) setWhatsappNumber(match[0]);
        }

        if (boxInvRes.data?.value?.variants) {
          setBoxInventory(boxInvRes.data.value.variants);
        }

        if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
          // Filter products that belong to boxes
          const boxList = prodRes.data.filter(p => {
            const name = `${p.name_ar || ''} ${p.name_en || ''} ${p.size || ''}`.toLowerCase();
            return name.includes('box') || name.includes('بوكس') || name.includes('inch');
          });
          if (boxList.length > 0) {
            setBoxesProducts(boxList);
          }
        }
      } catch (err) {
        console.warn('Background boxes sync notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── 1. BREADCRUMBS ── */}
      <div className="container" style={{ maxWidth: '1280px', paddingInline: '1.25rem' }}>
        <nav
          aria-label="breadcrumb"
          style={{
            paddingBlock: '1.1rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: '#7A6556',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          <Link to="/" style={{ color: '#7A6556', textDecoration: 'none' }}>
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <span style={{ color: '#B3A293', fontSize: '0.8rem' }}>›</span>
          <span style={{ color: '#2C1A11', fontWeight: 800 }}>
            {lang === 'ar' ? 'البوكسات' : 'Boxes'}
          </span>
        </nav>

        {/* ── 2. SECTION REFERENCE BANNER ── */}
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
            boxShadow: '0 4px 18px rgba(36, 23, 15, 0.04)',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {/* Banner Text & Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.1rem',
              padding: '1.35rem 1.75rem',
              zIndex: 2,
              flex: '1 1 auto'
            }}
          >
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
              <Box size={28} strokeWidth={2} />
            </div>

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
                {lang === 'ar' ? 'البوكسات' : 'Dental Boxes'}
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
                  ? 'بوكسات تنظيم وحفظ لجميع أدواتك ومعداتك الطبية بأحجام وألوان متعددة'
                  : 'Organizer & storage boxes for all your dental tools and gear in multiple sizes & colors'}
              </p>
            </div>
          </div>

          {/* Banner Artwork on Left */}
          <div
            className="section-banner-art-wrap"
            style={{
              position: 'relative',
              height: '100%',
              minHeight: '124px',
              width: '40%',
              maxWidth: '420px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <img
              src={dentalBoxesFaded}
              alt=""
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: isRtl ? 'left center' : 'right center',
                maskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>
        </section>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="container" style={{ paddingBlock: '3rem', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
            <p>{lang === 'ar' ? 'جاري تحميل البوكسات...' : 'Loading boxes...'}</p>
          </div>
        ) : (
          <div>
            {/* Available Direct Order Info Banner */}
            <div className="card animate-fade-in" style={{
              padding: '1.15rem 1.45rem',
              background: 'linear-gradient(135deg, #FAF7F2 0%, #F5ECE1 100%)',
              border: '1.5px solid #E6DDD2',
              borderRadius: '16px',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.1rem',
              boxShadow: '0 4px 16px rgba(35, 24, 16, 0.04)'
            }}>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                background: '#F0E5D8',
                color: '#684835',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0
              }}>
                📦
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: '#2C1A11', fontFamily: 'Cairo, sans-serif' }}>
                  {lang === 'ar' ? 'بوكسات تنظيم وحفظ الأدوات الطبية — متوفرة للطلب المباشر' : 'Dental Tool Boxes & Organizers — Available for Direct Order'}
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: '#684835', lineHeight: 1.5 }}>
                  {lang === 'ar'
                    ? 'اختر الحجم المناسب واضغط على أي بوكس لعرض تفاصيله الكاملة واختيار اللون المطلوب وإضافته إلى سلتك.'
                    : 'Choose your desired size, click any box to view full specifications, select available color, and add to your cart.'}
                </p>
              </div>
            </div>

            {/* Boxes Products Grid */}
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
                  inventoryMap={boxInventory}
                  onZoomImage={(url, title) => setLightboxImg({ url, title })}
                />
              ))}
            </div>
          </div>
        )}
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

export default BoxesPage;
