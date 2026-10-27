import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recordProductOrigin } from '../utils/navigationTrail';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import supabase from '../supabaseClient';
import {
  Box,
  ShoppingCart,
  Check
} from 'lucide-react';
import dentalBoxesArtwork from '../assets/images/dental-boxes-artwork.png';
import {
  splitBoxColorsByAvailability,
  cleanColorLabel,
  FALLBACK_BOXES,
  resolveBoxImg
} from '../utils/boxInventoryEngine';

/* ─── SINGLE DENTAL BOX PRODUCT CARD (MATCHING REFERENCE IMAGE) ─── */
const BoxProductCard = ({ box, inventoryMap = {} }) => {
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
      : [{ id: 'default', hex_code: '#CDBFA6', label_en: 'Standard', label_ar: 'أساسي', image_url: box.main_image || box.image_url }],
    inventoryMap
  );

  const colorsList = [...availableColors, ...unavailableColors];

  const [selectedColor, setSelectedColor] = useState(
    availableColors[0] || unavailableColors[0] || colorsList[0] || null
  );
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

  const activeImage = resolveBoxImg(selectedColor?.image_url || box.main_image || '/accessories/box17-colors.png');
  const effectivePrice = selectedColor?.price || box.price || 0;

  const handleAddToCart = () => {
    if (!selectedColor) return;

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
      image_url: activeImage,
      availableStock: selectedColor.available_stock || 10,
      stock_quantity: selectedColor.available_stock || 10
    }, 1);

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 4px 20px rgba(44, 26, 17, 0.03)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
      }}
    >
      {/* ── 1. IMAGE CONTAINER ── */}
      <div
        onClick={handleOpenDetails}
        style={{
          backgroundColor: '#F8F5EE',
          borderRadius: '16px',
          height: '270px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative'
        }}
        title={lang === 'ar' ? 'عرض تفاصيل البوكس' : 'View box details'}
      >
        <img
          src={activeImage}
          alt={box.name_en || box.size}
          draggable={false}
          onError={(e) => {
            e.currentTarget.src = resolveBoxImg('accessories/box17-colors.png');
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '0.75rem',
            transition: 'opacity 0.2s ease'
          }}
        />
      </div>

      {/* ── 2. PRODUCT NAME ── */}
      <h3
        onClick={handleOpenDetails}
        style={{
          fontSize: '1.15rem',
          fontWeight: 900,
          color: '#1E140E',
          margin: '0.4rem 0 0 0',
          cursor: 'pointer',
          fontFamily: "'Inter', 'Cairo', sans-serif",
          lineHeight: 1.3
        }}
      >
        {box.name_en || box.name_ar}
      </h3>

      {/* ── 3. PRICE ── */}
      <div style={{
        fontSize: '1.35rem',
        fontWeight: 900,
        color: '#1E140E',
        margin: '0.15rem 0',
        fontFamily: "'Cairo', 'Inter', sans-serif"
      }}>
        {effectivePrice} <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{lang === 'ar' ? 'د.ل' : 'LYD'}</span>
      </div>

      {/* ── 4. THIN HORIZONTAL DIVIDER ── */}
      <div style={{ height: '1px', backgroundColor: '#EFE8DE', width: '100%', margin: '0.2rem 0 0.5rem 0' }} />

      {/* ── 5. COLOR SELECTOR ROW ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '0.1rem 0 0.65rem 0',
        direction: isRtl ? 'rtl' : 'ltr'
      }}>
        <span style={{
          fontSize: '0.92rem',
          fontWeight: 700,
          color: '#5A4232',
          fontFamily: "'Cairo', sans-serif"
        }}>
          {lang === 'ar' ? 'اختر اللون:' : 'Select Color:'}
        </span>

        {/* Color Swatch Circles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          {colorsList.map((c) => {
            const isSelected = selectedColor && (selectedColor.id === c.id || selectedColor.color_id === c.color_id);
            return (
              <button
                key={c.id || c.color_id}
                type="button"
                onClick={() => setSelectedColor(c)}
                title={cleanColorLabel(c, lang)}
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: '50%',
                  backgroundColor: c.hex_code || '#CDBFA6',
                  border: isSelected ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                  boxShadow: isSelected ? '0 0 0 2.5px #FFFFFF, 0 0 0 4.5px #2C1A11' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── 6. ACTION BUTTONS ROW ── */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        marginTop: 'auto',
        direction: isRtl ? 'rtl' : 'ltr'
      }}>
        {/* DETAILS BUTTON (التفاصيل) */}
        <button
          type="button"
          onClick={handleOpenDetails}
          style={{
            backgroundColor: '#F5EFE6',
            color: '#3E2718',
            fontSize: '0.92rem',
            fontWeight: 800,
            borderRadius: '12px',
            border: 'none',
            padding: '0.75rem 1.4rem',
            cursor: 'pointer',
            fontFamily: "'Cairo', sans-serif",
            transition: 'background-color 0.15s ease, transform 0.1s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {lang === 'ar' ? 'التفاصيل' : 'Details'}
        </button>

        {/* ADD TO CART BUTTON (أضف إلى السلة) */}
        <button
          type="button"
          onClick={handleAddToCart}
          style={{
            flex: 1,
            backgroundColor: addedNotice ? '#059669' : '#4A3326',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 800,
            borderRadius: '12px',
            border: 'none',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            cursor: 'pointer',
            fontFamily: "'Cairo', sans-serif",
            transition: 'background-color 0.2s ease, transform 0.1s ease',
            boxShadow: '0 4px 12px rgba(74, 51, 38, 0.18)'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {addedNotice ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              <span>{lang === 'ar' ? 'تمت الإضافة للسلة ✓' : 'Added to Cart ✓'}</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} strokeWidth={2.2} />
              <span>{lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ─── MAIN DENTAL BOXES PAGE ─── */
export const BoxesPage = () => {
  const { lang, isRtl } = useLanguage();

  // 4 canonical boxes matching user reference
  const [boxesProducts, setBoxesProducts] = useState(FALLBACK_BOXES);
  const [boxInventory, setBoxInventory] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchBackgroundUpdates = async () => {
      try {
        const [prodRes, boxInvRes] = await Promise.all([
          supabase.from('accessory_products').select('*, colors:accessory_product_colors(*)').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('settings').select('value').eq('key', 'box_variants_inventory').maybeSingle()
        ]);

        if (!isMounted) return;

        if (boxInvRes.data?.value?.variants) {
          setBoxInventory(boxInvRes.data.value.variants);
        }

        if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
          // Exactly the 4 dental box sizes
          const boxList = prodRes.data.filter(p => {
            const name = `${p.name_ar || ''} ${p.name_en || ''} ${p.size || ''}`.toLowerCase();
            return (name.includes('box') || name.includes('بوكس') || name.includes('inch')) &&
                   !name.includes('لاب كوت');
          });

          // Match reference order: 16.5" and 17.5" in row 1, 14" and 16" in row 2
          const getRank = (b) => {
            const s = `${b.size || ''} ${b.name_en || ''} ${b.name_ar || ''}`;
            if (s.includes('16.5')) return 1;
            if (s.includes('17')) return 2;
            if (s.includes('14')) return 3;
            if (s.includes('16')) return 4;
            return 5;
          };

          if (boxList.length >= 4) {
            boxList.sort((a, b) => getRank(a) - getRank(b));
            setBoxesProducts(boxList.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn('Background boxes sync notice:', err);
      }
    };

    fetchBackgroundUpdates();
    return () => { isMounted = false; };
  }, []);

  // Standard ordered fallback: [16.5", 17.5", 14", 16"]
  const orderedDisplayBoxes = React.useMemo(() => {
    const box16_5 = boxesProducts.find(b => (b.size && b.size.includes('16.5')) || (b.name_en && b.name_en.includes('16.5'))) || FALLBACK_BOXES[2];
    const box17 = boxesProducts.find(b => (b.size && b.size.includes('17')) || (b.name_en && b.name_en.includes('17'))) || FALLBACK_BOXES[3];
    const box14 = boxesProducts.find(b => (b.size && b.size.includes('14')) || (b.name_en && b.name_en.includes('14'))) || FALLBACK_BOXES[0];
    const box16 = boxesProducts.find(b => (b.size && (b.size === '16 inch' || (b.size.includes('16') && !b.size.includes('16.5')))) || (b.name_en && b.name_en.includes('16') && !b.name_en.includes('16.5'))) || FALLBACK_BOXES[1];

    // In RTL 2-column grid:
    // Index 0: Top-Right (Organizer Box 16.5")
    // Index 1: Top-Left  (Professional Box — GT-MAX 17.5")
    // Index 2: Bottom-Right (Dental Tool Box 14")
    // Index 3: Bottom-Left  (Dental Tool Box 16")
    return [box16_5, box17, box14, box16];
  }, [boxesProducts]);

  return (
    <div style={{
      minHeight: '85vh',
      backgroundColor: '#FAF7F2',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '4rem'
    }}>
      
      {/* ── 1. BREADCRUMBS ── */}
      <div style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '1.25rem 1.25rem 0.65rem 1.25rem' }}>
        <nav
          aria-label="breadcrumb"
          style={{
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
      </div>

      {/* ── 2. SECTION REFERENCE HERO BANNER ── */}
      <div style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.25rem 2rem 1.25rem' }}>
        <section
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '210px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #F3ECE2 0%, #EDE3D5 100%)',
            border: '1px solid rgba(180, 155, 130, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(44, 26, 17, 0.04)',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {/* Banner Text & Icon (Right side in RTL) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1.75rem 2.25rem',
              zIndex: 2,
              flex: '1 1 auto'
            }}
          >
            {/* Box Icon Square */}
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'rgba(180, 155, 130, 0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2C1A11',
                flexShrink: 0
              }}
            >
              <Box size={28} strokeWidth={1.8} />
            </div>

            {/* Title & Subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                  fontWeight: 900,
                  color: '#1E140E',
                  lineHeight: 1.15
                }}
              >
                {lang === 'ar' ? 'البوكسات' : 'Dental Boxes'}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: 'clamp(0.85rem, 1.8vw, 0.96rem)',
                  fontWeight: 600,
                  color: '#6B5344',
                  lineHeight: 1.45,
                  maxWidth: '380px'
                }}
              >
                {lang === 'ar'
                  ? 'بوكسات تنظيم وحفظ لجميع أدواتك الطبية بأحجام وألوان متعددة'
                  : 'Organizer & storage boxes for all your dental tools and gear in multiple sizes & colors'}
              </p>
            </div>
          </div>

          {/* Banner Artwork on Left (Stacked dental boxes) */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              minHeight: '210px',
              width: '45%',
              maxWidth: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <img
              src={dentalBoxesArtwork}
              alt="Dental Boxes Collection"
              style={{
                height: '100%',
                maxHeight: '210px',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: isRtl ? 'left center' : 'right center',
                maskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: isRtl
                  ? 'linear-gradient(to right, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>
        </section>
      </div>

      {/* ── 3. PRODUCT CARDS GRID (2x2 LAYOUT) ── */}
      <div style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem'
          }}
        >
          {orderedDisplayBoxes.map(box => (
            <BoxProductCard
              key={box.id}
              box={box}
              inventoryMap={boxInventory}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

export default BoxesPage;
