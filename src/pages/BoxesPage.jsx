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

  // Extract color list preserving order
  const colorsList = Array.isArray(box.colors) && box.colors.length > 0
    ? box.colors
    : [{ id: 'default', hex_code: '#CDBFA6', label_en: 'Standard', label_ar: 'أساسي', image_url: box.main_image || box.image_url }];

  // Stable selected color state
  const [selectedColor, setSelectedColor] = useState(() => colorsList[0] || null);
  const [addedNotice, setAddedNotice] = useState(false);

  // Synchronize selection safely without disruptive jumps
  useEffect(() => {
    setSelectedColor(prev => {
      if (!prev) return colorsList[0] || null;
      const currentMatch = colorsList.find(c => 
        (c.id && c.id === prev.id) || 
        (c.color_id && c.color_id === prev.color_id) ||
        (c.label_en && c.label_en === prev.label_en)
      );
      return currentMatch || colorsList[0] || null;
    });
  }, [box.colors]);

  const activeImage = resolveBoxImg(selectedColor?.image_url || box.main_image || '/accessories/box17-colors.png');
  const effectivePrice = selectedColor?.price || box.price || 0;

  const handleSelectColor = (color) => {
    const isUnavailable = color.status === 'out_of_stock' || (color.available_stock !== undefined && color.available_stock <= 0 && color.status !== 'on_demand');
    if (isUnavailable) return;
    setSelectedColor(color);
  };

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
    <div className="dental-box-card">
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
            padding: '0.25rem',
            transition: 'opacity 0.25s ease'
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

      {/* ── 5. COLOR SELECTOR SECTION ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        margin: '0.15rem 0 0.85rem 0',
        direction: isRtl ? 'rtl' : 'ltr',
        minHeight: '72px'
      }}>
        {/* Label & Active Color Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#5A4232',
            fontFamily: "'Cairo', sans-serif"
          }}>
            {lang === 'ar' ? 'اختر اللون:' : 'Select Color:'}
          </span>

          {selectedColor && (
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#4A3326',
              backgroundColor: '#F5ECE1',
              padding: '0.15rem 0.6rem',
              borderRadius: '999px',
              fontFamily: "'Cairo', sans-serif"
            }}>
              {cleanColorLabel(selectedColor, lang)}
            </span>
          )}
        </div>

        {/* Swatches Flex Wrap */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          flexWrap: 'wrap'
        }}>
          {colorsList.map((c) => {
            const isSelected = selectedColor && (
              (selectedColor.id && selectedColor.id === c.id) ||
              (selectedColor.color_id && selectedColor.color_id === c.color_id) ||
              (selectedColor.label_en && selectedColor.label_en === c.label_en)
            );
            const isUnavailable = c.status === 'out_of_stock' || (c.available_stock !== undefined && c.available_stock <= 0 && c.status !== 'on_demand');

            return (
              <button
                key={c.id || c.color_id || c.label_en}
                type="button"
                onClick={() => handleSelectColor(c)}
                disabled={isUnavailable}
                title={`${cleanColorLabel(c, lang)}${isUnavailable ? (lang === 'ar' ? ' (غير متوفر حالياً)' : ' (Out of stock)') : ''}`}
                className="dental-box-swatch-btn"
                style={{
                  backgroundColor: c.hex_code || '#CDBFA6',
                  border: isSelected ? '2px solid #FFFFFF' : '1px solid rgba(0, 0, 0, 0.12)',
                  boxShadow: isSelected
                    ? '0 0 0 2.5px #4A3326, 0 2px 6px rgba(74, 51, 38, 0.22)'
                    : '0 1px 3px rgba(0,0,0,0.06)',
                  cursor: isUnavailable ? 'not-allowed' : 'pointer',
                  opacity: isUnavailable ? 0.38 : 1
                }}
              >
                {isUnavailable && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '12%',
                      right: '12%',
                      height: '1.5px',
                      backgroundColor: '#DC2626',
                      transform: 'rotate(45deg)',
                      borderRadius: '1px'
                    }}
                  />
                )}
              </button>
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

/* ─── CANONICAL REFERENCE BLUEPRINTS ─── */
const CANONICAL_ORDERED_BOXES = [
  // Index 0: Top-Right in RTL 2-column grid
  { ...FALLBACK_BOXES[2], name_en: 'Organizer Box 16.5"', name_ar: 'Organizer Box 16.5"', price: 85 },
  // Index 1: Top-Left in RTL 2-column grid
  { ...FALLBACK_BOXES[3], name_en: 'Professional Box — GT-MAX 17.5"', name_ar: 'Professional Box — GT-MAX 17.5"', price: 95 },
  // Index 2: Bottom-Right in RTL 2-column grid
  { ...FALLBACK_BOXES[0], name_en: 'Dental Tool Box 14"', name_ar: 'Dental Tool Box 14"', price: 45 },
  // Index 3: Bottom-Left in RTL 2-column grid
  { ...FALLBACK_BOXES[1], name_en: 'Dental Tool Box 16"', name_ar: 'Dental Tool Box 16"', price: 65 }
];

/* ─── MAIN DENTAL BOXES PAGE ─── */
export const BoxesPage = () => {
  const { lang, isRtl } = useLanguage();

  // Initialize with canonical ordered blueprints
  const [displayBoxes, setDisplayBoxes] = useState(CANONICAL_ORDERED_BOXES);
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

        const inventoryMap = boxInvRes.data?.value?.variants || {};
        setBoxInventory(inventoryMap);

        if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          const dbProducts = prodRes.data;

          // Reconcile database products into canonical templates without losing canonical data
          const reconciled = CANONICAL_ORDERED_BOXES.map(canonical => {
            // Find match in DB by size keyword
            const dbMatch = dbProducts.find(p => {
              const str = `${p.size || ''} ${p.name_en || ''} ${p.name_ar || ''}`.toLowerCase();
              if (canonical.size.includes('16.5')) return str.includes('16.5');
              if (canonical.size.includes('17')) return str.includes('17');
              if (canonical.size.includes('14')) return str.includes('14');
              if (canonical.size.includes('16')) return str.includes('16') && !str.includes('16.5');
              return false;
            });

            if (!dbMatch) return canonical;

            // Merge DB id for proper routing
            const realId = dbMatch.id || canonical.id;
            const realPrice = (typeof dbMatch.price === 'number' && dbMatch.price > 0)
              ? dbMatch.price
              : canonical.price;

            // Reconcile colors: start from canonical colors so all variants remain present
            const dbColors = Array.isArray(dbMatch.colors) ? dbMatch.colors : [];
            const reconciledColors = canonical.colors.map(c => {
              const matchedColor = dbColors.find(dbc => 
                (dbc.color_id && dbc.color_id.toLowerCase() === c.id.toLowerCase()) ||
                (dbc.color_id && dbc.color_id.toLowerCase() === (c.color_id || '').toLowerCase()) ||
                (dbc.label_en && dbc.label_en.toLowerCase() === c.label_en.toLowerCase())
              );

              const invKey = matchedColor?.id || c.id || c.color_id;
              const inv = inventoryMap[invKey] || inventoryMap[c.id] || inventoryMap[c.color_id];

              return {
                ...c,
                ...(matchedColor ? { db_color_id: matchedColor.id, hex_code: matchedColor.hex_code || c.hex_code } : {}),
                ...(inv ? { status: inv.status || c.status, available_stock: inv.available_stock ?? c.available_stock } : {})
              };
            });

            return {
              ...canonical,
              id: realId,
              price: realPrice,
              colors: reconciledColors
            };
          });

          setDisplayBoxes(reconciled);
        }
      } catch (err) {
        console.warn('Background boxes sync notice:', err);
      }
    };

    fetchBackgroundUpdates();
    return () => { isMounted = false; };
  }, []);

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

      {/* ── 3. PRODUCT CARDS GRID (EXACT 2x2 BALANCED LAYOUT) ── */}
      <div style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.25rem' }}>
        <div className="dental-boxes-grid-2x2">
          {displayBoxes.map(box => (
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