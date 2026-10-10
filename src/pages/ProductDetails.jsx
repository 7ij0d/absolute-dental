import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import supabase from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import { useStorageImage } from '../utils/storageImage';
import defaultProductsList from '../defaultProducts.json';
import {
  isBundleProduct,
  getBundleDefinition,
  calculateBundleAvailability,
  computeEffectiveStock,
  CANONICAL_MULTI_UNITS,
  getPhysicalStockBreakdown,
  getProductSizedConfig
} from '../utils/productInventoryEngine';
import {
  ShoppingCart, Heart, Check, Plus, Minus,
  ChevronLeft, ChevronRight, ArrowLeft, ArrowRight,
  Package, AlertCircle, CheckCircle2, Clock, XCircle,
  Sparkles, Layers, Box, Tag, ArrowLeftRight, ShieldAlert
} from 'lucide-react';

const DEFAULT_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى',  name_en: '1st Year', slug: '1st-year' },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year' },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year' },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year' }
];

const DEFAULT_SUBJECTS = [
  {
    id: '11000000-0000-0000-0000-000000000011',
    year_id: '10000000-0000-0000-0000-000000000001',
    name_ar: 'تشريح الأسنان',
    name_en: 'Dental Anatomy',
    slug: 'dental-anatomy',
  },
  {
    id: '11000000-0000-0000-0000-000000000012',
    year_id: '10000000-0000-0000-0000-000000000001',
    name_ar: 'مواد طب الأسنان',
    name_en: 'Dental Materials',
    slug: 'dental-materials',
  },
  {
    id: '22000000-0000-0000-0000-000000000021',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    slug: 'restorative-dentistry',
  },
  {
    id: '22000000-0000-0000-0000-000000000021-alt',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    slug: 'operative-dentistry',
  },
  {
    id: '22000000-0000-0000-0000-000000000022',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'صناعة الأسنان المتحركة',
    name_en: 'Removable Prosthodontics',
    slug: 'removable-prosthodontics',
  },
  {
    id: '22000000-0000-0000-0000-000000000023',
    year_id: '20000000-0000-0000-0000-000000000002',
    name_ar: 'صناعة الأسنان الثابتة',
    name_en: 'Fixed Prosthodontics',
    slug: 'fixed-prosthodontics',
  },
  {
    id: '33000000-0000-0000-0000-000000000031',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'علاج الأسنان التحفظي 2',
    name_en: 'Conservative Dentistry 2',
    slug: 'conservative-dentistry-2',
  },
  {
    id: '33000000-0000-0000-0000-000000000032',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'طب الأسنان الوقائي',
    name_en: 'Preventive Dentistry',
    slug: 'preventive-dentistry',
  },
  {
    id: '33000000-0000-0000-0000-000000000033',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'صناعة الأسنان الثابتة 2',
    name_en: 'Fixed Prosthodontics 2',
    slug: 'fixed-prosthodontics-2',
  },
  {
    id: '33000000-0000-0000-0000-000000000034',
    year_id: '30000000-0000-0000-0000-000000000003',
    name_ar: 'صناعة الأسنان المتحركة 2',
    name_en: 'Removable Prosthodontics 2',
    slug: 'removable-prosthodontics-2',
  },
];

export const ProductDetails = () => {
  const { id } = useParams();
  const { lang, t, isRtl } = useLanguage();
  const auth = useAuth();
  const isAdmin = auth?.isAdmin;
  const isUserAdmin = Boolean(
    isAdmin ||
    (typeof window !== 'undefined' && (
      localStorage.getItem('admin_pin') === '9922' ||
      sessionStorage.getItem('admin_pin') === '9922' ||
      localStorage.getItem('admin_passcode') === '9922'
    ))
  );

  const sanitizeDetailsText = (text) => {
    if (!text || isUserAdmin) return text;
    return text
      .split('\n')
      .filter(line => {
        const l = line.toLowerCase();
        return !line.includes('سعر التكلفة') &&
               !line.includes('سعر المخزون') &&
               !line.includes('سعر الشراء') &&
               !line.includes('الكمية في المخزون') &&
               !line.includes('إجمالي المخزون') &&
               !line.includes('سعر البيع') &&
               !l.includes('cost price') &&
               !l.includes('selling price') &&
               !l.includes('purchase price') &&
               !l.includes('quantity in stock') &&
               !l.includes('total stock');
      })
      .join('\n');
  };

  const { cartItems, addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [subject, setSubject] = useState(null);
  const [year, setYear] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [effectiveStock, setEffectiveStock] = useState(null);
  const [bundleInfo, setBundleInfo] = useState(null);
  const [physicalBreakdown, setPhysicalBreakdown] = useState(null);
  const [siblingProduct, setSiblingProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const sizedConfig = getProductSizedConfig(product?.id || id);
  const resolvedActiveImage = useStorageImage(
    activeImage,
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format'
  );

  const ChevronSep = isRtl ? ChevronLeft : ChevronRight;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  // Scroll to top whenever ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setJustAdded(false);
  }, [id]);

  // Main data fetching
  useEffect(() => {
    let isMounted = true;

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        let fetchedProd = null;
        let fetchedSubject = null;
        let fetchedYear = null;
        let fetchedImages = [];

        // 1. Attempt Supabase fetch
        try {
          const { data: prod } = await supabase
            .from('products')
            .select('*, subjects(id, name_ar, name_en, slug, year_id, years(id, name_ar, name_en, slug))')
            .eq('id', id)
            .maybeSingle();

          if (prod) {
            fetchedProd = prod;
            if (prod.subjects) {
              fetchedSubject = prod.subjects;
              fetchedYear = prod.subjects.years;
            }

            // 1.1 Dynamic Inventory Resolution via Unified Engine
            if (isBundleProduct(prod.id)) {
              const bundleDef = getBundleDefinition(prod.id);
              const compIds = bundleDef.components.map(c => c.productId);
              const { data: compProds } = await supabase
                .from('products')
                .select('id, name_ar, name_en, price, stock_quantity, availability')
                .in('id', compIds);

              const bundleRes = calculateBundleAvailability(prod.id, compProds || defaultProductsList);
              setEffectiveStock(bundleRes.availableCount);
              setBundleInfo(bundleRes);
            } else if (prod.shared_inventory_product_id) {
              const { data: master } = await supabase
                .from('products')
                .select('id, name_ar, name_en, stock_quantity, price, availability')
                .eq('id', prod.shared_inventory_product_id)
                .maybeSingle();
              const mult = prod.unit_multiplier || 1;
              const eff = master ? Math.floor(master.stock_quantity / mult) : 0;
              setEffectiveStock(eff);
              setSiblingProduct(master);
              if (master) {
                setPhysicalBreakdown(getPhysicalStockBreakdown(prod, [prod, master]));
              }
            } else if (CANONICAL_MULTI_UNITS[prod.id]?.isBase) {
              const childUnitId = CANONICAL_MULTI_UNITS[prod.id].packProductId;
              const { data: childProd } = await supabase
                .from('products')
                .select('id, name_ar, name_en, price, unit_multiplier, availability')
                .eq('id', childUnitId)
                .maybeSingle();
              setEffectiveStock(prod.stock_quantity ?? null);
              setSiblingProduct(childProd);
              setPhysicalBreakdown(getPhysicalStockBreakdown(prod, [prod, childProd || {}]));
            } else {
              setEffectiveStock(prod.stock_quantity ?? null);
            }

            // Gallery images
            const { data: extraImgs } = await supabase
              .from('product_images')
              .select('image_url')
              .eq('product_id', prod.id)
              .order('sort_order', { ascending: true });

            const allImgs = [prod.image_url];
            if (extraImgs && extraImgs.length > 0) {
              extraImgs.forEach(item => {
                if (item.image_url && !allImgs.includes(item.image_url)) {
                  allImgs.push(item.image_url);
                }
              });
            }
            fetchedImages = allImgs.filter(Boolean);
          }
        } catch (dbErr) {
          console.warn('Supabase fetch failed, falling back to local dataset:', dbErr);
        }

        // 2. Fallback to local defaultProductsList if not found in DB
        if (!fetchedProd) {
          const localProd = defaultProductsList.find(p => String(p.id) === String(id) || p.slug === id);
          if (localProd) {
            fetchedProd = localProd;
            fetchedImages = [localProd.image_url].filter(Boolean);
            if (isBundleProduct(localProd.id)) {
              const bundleRes = calculateBundleAvailability(localProd.id, defaultProductsList);
              setEffectiveStock(bundleRes.availableCount);
              setBundleInfo(bundleRes);
            } else {
              setEffectiveStock(computeEffectiveStock(localProd, defaultProductsList));
              const breakdown = getPhysicalStockBreakdown(localProd, defaultProductsList);
              if (breakdown) setPhysicalBreakdown(breakdown);
            }
          }
        }

        if (!fetchedProd) {
          if (isMounted) {
            setProduct(null);
            setLoading(false);
          }
          return;
        }

        // 3. Resolve Subject & Year if not joined
        if (!fetchedSubject && fetchedProd.subject_id) {
          fetchedSubject = DEFAULT_SUBJECTS.find(s => s.id === fetchedProd.subject_id) || null;
        }
        if (fetchedSubject && !fetchedYear) {
          fetchedYear = DEFAULT_YEARS.find(y => y.id === fetchedSubject.year_id) || DEFAULT_YEARS[0];
        }
        if (!fetchedYear) {
          fetchedYear = DEFAULT_YEARS[0];
        }

        // 4. Fetch Related Products strictly from same subject
        let related = [];
        if (fetchedProd.subject_id) {
          try {
            const { data: relDb } = await supabase
              .from('products')
              .select('*')
              .eq('subject_id', fetchedProd.subject_id)
              .eq('is_active', true)
              .eq('is_archived', false)
              .neq('id', fetchedProd.id)
              .limit(4);

            if (relDb && relDb.length > 0) {
              related = relDb;
            }
          } catch (relErr) {
            console.warn('Error fetching related products:', relErr);
          }

          if (related.length === 0) {
            related = defaultProductsList
              .filter(p => p.subject_id === fetchedProd.subject_id && String(p.id) !== String(fetchedProd.id))
              .slice(0, 4);
          }
        }

        if (isMounted) {
          setProduct(fetchedProd);
          setSubject(fetchedSubject);
          setYear(fetchedYear);
          const pSized = getProductSizedConfig(fetchedProd.id);
          const finalImages = (pSized && pSized.galleryImages) || (fetchedImages.length > 0 ? fetchedImages : [fetchedProd.image_url]);
          setImages(finalImages);
          setActiveImage(finalImages[0] || fetchedProd.image_url || '');
          setRelatedProducts(related);
          setLoading(false);

          // Save to recently viewed
          try {
            const stored = JSON.parse(localStorage.getItem('smylodent_recent_viewed') || '[]');
            const filtered = stored.filter(item => item.id !== fetchedProd.id);
            filtered.unshift({
              id: fetchedProd.id,
              name_en: fetchedProd.name_en,
              price: fetchedProd.price,
              compare_at_price: fetchedProd.compare_at_price,
              image_url: fetchedProd.image_url,
              availability: fetchedProd.availability
            });
            localStorage.setItem('smylodent_recent_viewed', JSON.stringify(filtered.slice(0, 4)));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // SEO / document title
  useEffect(() => {
    if (product) {
      const prodName = product.name_en || product.name_ar || 'Dental Tool';
      document.title = `${prodName} | Absolute Dental`;
    }
    return () => {
      document.title = 'Absolute Dental';
    };
  }, [product]);

  // Favorites state sync
  useEffect(() => {
    if (!product) return;
    try {
      const favs = JSON.parse(localStorage.getItem('smylodent_favs') || '[]');
      setIsFav(favs.includes(product.id));
    } catch {
      // ignore
    }
  }, [product?.id]);

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    try {
      const favs = JSON.parse(localStorage.getItem('smylodent_favs') || '[]');
      const updated = isFav ? favs.filter(favId => favId !== product.id) : [...favs, product.id];
      localStorage.setItem('smylodent_favs', JSON.stringify(updated));
      setIsFav(!isFav);
    } catch {
      // ignore
    }
  };

  // Availability computations
  const isByOrder = product?.availability === 'by_order';
  const isUnavailable = !isByOrder && (product?.availability === 'unavailable' || (effectiveStock !== null && effectiveStock <= 0));
  const isLimited = isUserAdmin && !isByOrder && product?.availability === 'limited_quantity';
  const isComingSoon = product?.availability === 'coming_soon';
  const isOrderable = !isUnavailable && !isComingSoon;

  const selectedSizeDef = (sizedConfig && selectedSize) ? sizedConfig.sizes.find(s => s.size === selectedSize) : null;
  const maxStockLimit = selectedSizeDef
    ? selectedSizeDef.stock
    : (isByOrder ? 99 : (effectiveStock !== null ? Math.max(1, effectiveStock) : (product?.stock_quantity || 99)));

  const handleQtyChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxStockLimit) return maxStockLimit;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!product || !isOrderable) return;

    if (sizedConfig && !selectedSize) {
      setSizeError(true);
      const el = document.getElementById('productSizeSelectorBox');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (sizedConfig && selectedSize) {
      const sizeDef = sizedConfig.sizes.find(s => s.size === selectedSize);
      const variantNameEn = sizeDef?.labelEn ? `${product.name_en} (${sizeDef.labelEn})` : `${product.name_en} (Size ${selectedSize})`;
      const variantNameAr = sizeDef?.labelAr ? `${product.name_ar} (${sizeDef.labelAr})` : `${product.name_ar} (مقاس ${selectedSize})`;
      addToCart({
        ...product,
        id: `${product.id}-${selectedSize}`,
        base_product_id: product.id,
        name_en: variantNameEn,
        name_ar: variantNameAr,
        selected_size: sizeDef?.code || selectedSize,
        selected_color: sizeDef?.color || product.color,
        image_url: sizeDef?.image || product.image_url,
        stock_quantity: sizeDef ? sizeDef.stock : 24,
        effectiveStock: sizeDef ? sizeDef.stock : 24
      }, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
      return;
    }

    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  // Cart item awareness (Requirement 11)
  const inCartItem = cartItems.find(item => String(item.id) === String(product?.id));

  // Loading skeleton
  if (loading) {
    return (
      <div className="product-details-page">
        <div className="container" style={{ maxWidth: '1140px', padding: '2rem 1.25rem' }}>
          <div className="skeleton" style={{ height: '24px', width: '280px', borderRadius: '6px', marginBottom: '1.25rem' }} />
          <div className="skeleton" style={{ height: '38px', width: '150px', borderRadius: '12px', marginBottom: '1.75rem' }} />
          <div className="product-details-grid">
            <div className="skeleton" style={{ height: '420px', borderRadius: '20px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="skeleton" style={{ height: '28px', width: '170px', borderRadius: '999px' }} />
              <div className="skeleton" style={{ height: '46px', width: '75%', borderRadius: '10px' }} />
              <div className="skeleton" style={{ height: '36px', width: '130px', borderRadius: '8px' }} />
              <div className="skeleton" style={{ height: '52px', width: '100%', borderRadius: '12px', marginTop: '0.5rem' }} />
              <div className="skeleton" style={{ height: '140px', borderRadius: '16px', marginTop: '1rem' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 404 / Invalid product state (Requirement 27)
  if (!product) {
    return (
      <div className="product-details-page">
        <div className="container" style={{ maxWidth: '640px', textAlign: 'center', padding: '5rem 1.5rem' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#FAF5F0',
              border: '1px solid rgba(104, 72, 53, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#684835',
              marginBottom: '1.5rem',
            }}
          >
            <Package size={36} strokeWidth={1.75} />
          </div>
          <h1
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '1.9rem',
              fontWeight: 900,
              color: '#1A130E',
              marginBottom: '0.6rem',
            }}
          >
            {lang === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
          </h1>
          <p
            style={{
              color: '#8C7E72',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            {lang === 'ar'
              ? 'عذراً، لم نتمكن من العثور على هذا المنتج. قد يكون الرابط خاطئاً أو تم نقل المنتج.'
              : 'Sorry, the requested product could not be found or has been moved.'}
          </p>
          <Link
            to="/year/1st-year"
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '12px',
              fontWeight: 800,
            }}
          >
            {lang === 'ar' ? 'العودة إلى أدوات الدراسة' : 'Back to Study Tools'}
          </Link>
        </div>
      </div>
    );
  }

  const yearDisplayName = lang === 'ar'
    ? (year?.name_ar || 'السنة الدراسية')
    : (year?.name_en || 'Academic Year');

  const subjectTitleAr = subject?.name_ar || 'المادة الدراسية';
  const subjectTitleEn = subject?.name_en || 'Subject Tools';

  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // Strict English name requirement
  const displayName = product.name_en || product.name_ar || 'Dental Tool';

  return (
    <div className="product-details-page">
      <div className="container" style={{ maxWidth: '1140px', paddingInline: '1.25rem' }}>

        {/* ── 1. DYNAMIC BREADCRUMB (Requirement 2) ── */}
        <nav
          aria-label="breadcrumb"
          className="product-breadcrumb"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          <Link to="/" className="breadcrumb-link">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to={`/year/${year?.slug || '1st-year'}`} className="breadcrumb-link">
            {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to={`/year/${year?.slug || '1st-year'}`} className="breadcrumb-link">
            {yearDisplayName}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <Link to={`/subject/${subject?.slug || 'dental-anatomy'}`} className="breadcrumb-link">
            {subjectTitleEn}
          </Link>
          <ChevronSep size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current" style={{ direction: 'ltr', display: 'inline-block' }}>
            {displayName}
          </span>
        </nav>

        {/* ── 2. BACK BUTTON (Requirement 3) ── */}
        <div style={{ marginTop: '0.75rem', marginBottom: '1.25rem', direction: isRtl ? 'rtl' : 'ltr' }}>
          <button
            type="button"
            onClick={() => {
              if (subject?.slug) {
                navigate(`/subject/${subject.slug}`);
              } else {
                navigate(-1);
              }
            }}
            className="product-back-btn"
          >
            <BackArrow size={16} />
            <span>
              {lang === 'ar'
                ? `العودة إلى ${subjectTitleAr}`
                : `Back to ${subjectTitleEn}`}
            </span>
          </button>
        </div>

        {/* ── 3. MAIN PRODUCT DETAILS GRID (Requirements 4, 5, 6, 7, 8, 9, 10, 11) ── */}
        <div className="product-details-grid" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

          {/* ── LEFT COLUMN: PRODUCT IMAGE CARD ── */}
          <div className="product-image-container">
            <div className="product-image-card">
              {/* Favorite Heart Button */}
              <button
                type="button"
                onClick={toggleFav}
                aria-label="Favorite"
                className="product-fav-floating-btn"
                style={{
                  left: isRtl ? '1rem' : 'auto',
                  right: isRtl ? 'auto' : '1rem',
                }}
              >
                <Heart
                  size={19}
                  strokeWidth={2}
                  fill={isFav ? '#E11D48' : 'none'}
                  color={isFav ? '#E11D48' : '#8C7E72'}
                />
              </button>

              {/* Discount Badge */}
              {discountPercent > 0 && (
                <span
                  className="badge badge-discount"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: isRtl ? 'auto' : '1rem',
                    right: isRtl ? '1rem' : 'auto',
                    zIndex: 2,
                    fontSize: '0.85rem',
                    padding: '0.35rem 0.75rem',
                  }}
                >
                  -{discountPercent}%
                </span>
              )}

              {/* Main Image */}
              <img
                src={resolvedActiveImage}
                alt={displayName}
                className="product-image-main"
                onError={e => {
                  e.target.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format';
                }}
              />
            </div>

            {/* Thumbnail Strip (if multiple images exist in DB) */}
            {images.length > 1 && (
              <div className="product-thumbs-strip">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(img);
                      if (sizedConfig) {
                        const matchSize = sizedConfig.sizes.find(s => s.image === img);
                        if (matchSize) {
                          setSelectedSize(matchSize.size);
                          setSizeError(false);
                        }
                      }
                    }}
                    className={`product-thumb-btn ${activeImage === img ? 'active' : ''}`}
                  >
                    <img
                      src={img}
                      alt={`View ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: PRODUCT INFO & PURCHASE CONTROLS ── */}
          <div className="product-info-panel">

            {/* Subject Tag Pill */}
            {subject && (
              <div className="product-subject-pill">
                <Link
                  to={`/subject/${subject.slug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <Sparkles size={13} />
                  <span>{subject.name_en}</span>
                </Link>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{yearDisplayName}</span>
              </div>
            )}

            {/* Product Title (English ONLY) */}
            <h1 className="product-detail-title">
              {displayName}
            </h1>

            {/* Pricing Row */}
            <div className="product-price-row">
              <span className="product-price-current">
                {product.price}
                <span className="product-price-currency">
                  {lang === 'ar' ? 'د.ل' : 'LYD'}
                </span>
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="product-price-compare">
                  {product.compare_at_price} {lang === 'ar' ? 'د.ل' : 'LYD'}
                </span>
              )}
            </div>

            {/* Availability Status Badge (Requirement 8) */}
            <div className="product-status-row">
              {isComingSoon ? (
                <span className="product-status-badge status-coming-soon">
                  <Clock size={14} />
                  <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                </span>
              ) : isByOrder ? (
                <span className="product-status-badge status-by-order" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', border: '1px solid rgba(79, 70, 229, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 800, fontSize: '0.82rem' }}>
                  <Clock size={14} />
                  <span>{lang === 'ar' ? 'متوفر بالطلب (يتم تأكيده وتوفيره عبر الإدارة)' : 'Available By Order (Confirmed Upon Request)'}</span>
                </span>
              ) : isUnavailable ? (
                <span className="product-status-badge status-unavailable">
                  <XCircle size={14} />
                  <span>{lang === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock'}</span>
                </span>
              ) : isLimited ? (
                <span className="product-status-badge status-limited">
                  <AlertCircle size={14} />
                  <span>{lang === 'ar' ? 'كمية محدودة' : 'Limited Quantity'}</span>
                </span>
              ) : (
                <span className="product-status-badge status-available">
                  <CheckCircle2 size={14} />
                  <span>{lang === 'ar' ? 'متوفر' : 'In Stock'}</span>
                </span>
              )}
            </div>

            {/* Admin-Only Inventory Indicator */}
            {isUserAdmin && (
              <div style={{
                marginTop: '0.65rem',
                padding: '0.65rem 0.9rem',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#92400e',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldAlert size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>
                  <strong>{lang === 'ar' ? 'لوحة الإدارة (خاص بالمسؤول): ' : 'Admin Only: '}</strong>
                  {lang === 'ar'
                    ? `حالة المخزون: ${product?.availability === 'limited_quantity' ? 'كمية محدودة' : (product?.availability === 'by_order' ? 'بالطلب' : 'متوفر')} | الكمية المسجلة: ${product?.stock_quantity ?? 'غير محدد'}`
                    : `Stock State: ${product?.availability} | Quantity: ${product?.stock_quantity ?? 'N/A'}`}
                </span>
              </div>
            )}

            {/* Bundle / Offer Breakdown Card */}
            {bundleInfo && (
              <div style={{
                margin: '1rem 0',
                padding: '1.25rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.03))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#065F46', fontSize: '0.95rem' }}>
                    <Sparkles size={18} color="#10B981" />
                    <span>{lang === 'ar' ? 'عرض خاص توفيري — حزمة متكاملة' : 'Special Value Bundle Offer'}</span>
                  </div>
                  {bundleInfo.savings > 0 && (
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      background: '#10B981',
                      color: '#fff',
                      padding: '3px 10px',
                      borderRadius: '999px'
                    }}>
                      {lang === 'ar' ? `توفير ${bundleInfo.savings} د.ل` : `Save ${bundleInfo.savings} LYD`}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: 600 }}>
                  {lang === 'ar' ? 'محتويات الحزمة المشمولة بالعرض:' : 'Included in this bundle:'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {bundleInfo.componentsStatus.map((comp, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      fontSize: '0.85rem'
                    }}>
                      <span style={{ fontWeight: 700, color: '#1F2937' }}>{comp.nameEn} (×{comp.required})</span>
                      <span style={{ color: comp.isAvailable ? '#059669' : '#DC2626', fontWeight: 700, fontSize: '0.8rem' }}>
                        {comp.isAvailable ? (lang === 'ar' ? '✓ متوفر بالمخزن' : '✓ In Stock') : (lang === 'ar' ? 'غير متوفر' : 'Out of Stock')}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px dashed rgba(16, 185, 129, 0.35)',
                  paddingTop: '0.6rem',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? `السعر المنفصل: ${bundleInfo.normalTotalPrice} د.ل` : `Separate Total: ${bundleInfo.normalTotalPrice} LYD`}
                  </span>
                  <span style={{ fontWeight: 800, color: '#065F46', fontSize: '0.95rem' }}>
                    {lang === 'ar' ? `المتوفر كعروض: ${bundleInfo.availableCount}` : `Available Offers: ${bundleInfo.availableCount}`}
                  </span>
                </div>
              </div>
            )}

            {/* Multiple Selling Units & Physical Stock Breakdown */}
            {(siblingProduct || physicalBreakdown) && (
              <div style={{
                margin: '1rem 0',
                padding: '1rem 1.15rem',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.88rem', color: '#92400E' }}>
                    <Box size={16} color="#D97706" />
                    <span>{lang === 'ar' ? 'خيارات الوحدات ومخزون القطع:' : 'Selling Units & Stock:'}</span>
                  </div>
                  {physicalBreakdown && (
                    <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      {lang === 'ar' ? physicalBreakdown.displayAr : physicalBreakdown.displayEn}
                    </span>
                  )}
                </div>

                {siblingProduct && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${siblingProduct.id}`)}
                      className="btn btn-outline"
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.4rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderColor: 'rgba(217, 119, 6, 0.35)',
                        color: '#B45309',
                        backgroundColor: '#FFFBEB'
                      }}
                    >
                      <ArrowLeftRight size={14} />
                      <span>
                        {lang === 'ar'
                          ? `الانتقال إلى: ${siblingProduct.name_ar || siblingProduct.name_en} (${siblingProduct.price} د.ل)`
                          : `Switch to: ${siblingProduct.name_en} (${siblingProduct.price} LYD)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Already in Cart Indicator (Requirement 11) */}
            {inCartItem && (
              <div className="product-in-cart-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <Check size={16} strokeWidth={2.5} />
                  <span>
                    {lang === 'ar'
                      ? `موجود في سلتك (${inCartItem.quantity} قطعة)`
                      : `In your cart (${inCartItem.quantity} pcs)`}
                  </span>
                </div>
                <Link
                  to="/cart"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: '#047857',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>{lang === 'ar' ? 'عرض السلة' : 'View Cart'}</span>
                  <ChevronSep size={13} />
                </Link>
              </div>
            )}

            {/* Quantity Selector & Add to Cart Controls (Requirements 9, 10, 28, 29) */}
            {isComingSoon ? (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  backgroundColor: '#FAF5F0',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                }}
              >
                <p style={{ fontWeight: 800, color: '#684835', margin: '0 0 0.25rem 0' }}>
                  {lang === 'ar' ? 'قريباً — سيتوفر هذا المنتج قريباً للطلب' : 'Coming Soon — Will be available soon for ordering'}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#8C7E72', margin: 0 }}>
                  {lang === 'ar' ? 'تابع الموقع لمعرفة مواعيد الوصول والتسليم' : 'Check back for arrival and delivery schedule'}
                </p>
              </div>
            ) : isUnavailable ? (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                }}
              >
                {lang === 'ar' ? 'عذراً، هذا المنتج غير متوفر حالياً' : 'Sorry, this product is currently out of stock'}
              </div>
            ) : (
              <>
                {/* Mandatory Size Selection Box for Sized Dental Products */}
                {sizedConfig && (
                  <div
                    id="productSizeSelectorBox"
                    style={{
                      margin: '1.25rem 0',
                      padding: '1.25rem',
                      borderRadius: '16px',
                      background: sizeError ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface, #F8FAFC)',
                      border: sizeError ? '2px solid #EF4444' : '1px solid var(--border-card, #e2e8f0)',
                      boxShadow: sizeError ? '0 0 0 4px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{sizedConfig.hasColorAndSize ? '🎨' : '📐'}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main, #1E293B)' }}>
                          {lang === 'ar' ? (sizedConfig.optionsLabelAr ? `${sizedConfig.optionsLabelAr} (اختيار إلزامي):` : (sizedConfig.hasColorAndSize ? 'اللون والمقاس المتوفر (اختيار إلزامي):' : 'المقاس المطلوب (اختيار إلزامي):')) : (sizedConfig.optionsLabelEn ? `${sizedConfig.optionsLabelEn} (Mandatory):` : (sizedConfig.hasColorAndSize ? 'Available Color & Size (Mandatory):' : 'Required Size (Mandatory):'))}
                        </span>
                      </div>
                      {sizeError ? (
                        <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '0.82rem', animation: 'pulse 1s infinite' }}>
                          {lang === 'ar' ? (sizedConfig.optionsPromptAr || (sizedConfig.hasColorAndSize ? '⚠️ يرجى اختيار اللون والمقاس أولاً' : '⚠️ يرجى اختيار المقاس (M أو L) أولاً')) : (sizedConfig.optionsPromptEn || (sizedConfig.hasColorAndSize ? '⚠️ Please select color & size first' : '⚠️ Please select size (M or L) first'))}
                        </span>
                      ) : selectedSize ? (
                        <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                          ✓ {lang === 'ar' ? `تم تحديد: ${selectedSizeDef?.labelAr || selectedSize}` : `Selected: ${selectedSizeDef?.labelEn || selectedSize}`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {lang === 'ar' ? (sizedConfig.optionsLabelAr ? `اضغط لتحديد ${sizedConfig.optionsLabelAr}` : (sizedConfig.hasColorAndSize ? 'اضغط لتحديد اللون والمقاس' : 'اضغط لتحديد المقاس')) : (sizedConfig.optionsLabelEn ? `Click to select ${sizedConfig.optionsLabelEn}` : (sizedConfig.hasColorAndSize ? 'Click to select option' : 'Click to select size'))}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      {sizedConfig.sizes.map(s => {
                        const isSelected = selectedSize === s.size;
                        return (
                          <button
                            key={s.size}
                            type="button"
                            onClick={() => {
                              setSelectedSize(s.size);
                              if (s.image) setActiveImage(s.image);
                              setSizeError(false);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.9rem 1rem',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid var(--primary, #3D352E)' : '1px solid #CBD5E1',
                              background: isSelected ? 'var(--primary, #3D352E)' : '#FFFFFF',
                              color: isSelected ? '#FFFFFF' : '#1E293B',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: isSelected ? '0 4px 12px rgba(61, 53, 46, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                              transform: isSelected ? 'scale(1.02)' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {s.colorHex && (
                                <span style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: s.colorHex,
                                  display: 'inline-block',
                                  border: '1.5px solid rgba(255,255,255,0.8)'
                                }} />
                              )}
                              <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{s.shortLabel}</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>
                                {lang === 'ar' ? s.labelAr : s.labelEn}
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#64748B'
                            }}>
                              {lang === 'ar' ? `المتوفر: ${s.stock} ${s.unitNameAr || (s.size.includes('s') || s.size.includes('m') ? 'زوج' : 'قطعة')}` : `Stock: ${s.stock} ${s.size.includes('s') || s.size.includes('m') ? 'pairs' : 'pcs'}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="product-action-row">
                  {/* Quantity Selector */}
                  <div className="product-qty-selector">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(-1)}
                      disabled={quantity <= 1}
                      className="qty-btn"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="qty-display">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(1)}
                      disabled={quantity >= maxStockLimit}
                      className="qty-btn"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Primary Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`product-detail-add-cart-btn ${justAdded ? 'just-added' : ''}`}
                    style={{
                      background: sizeError ? '#DC2626' : undefined,
                      boxShadow: sizeError ? '0 4px 14px rgba(220, 38, 38, 0.35)' : undefined
                    }}
                  >
                    {justAdded ? (
                      <>
                        <Check size={18} strokeWidth={2.5} />
                        <span>{lang === 'ar' ? (selectedSize ? `تمت إضافة (${selectedSize}) للسلة ✓` : 'تمت الإضافة للسلة ✓') : (selectedSize ? `Added (${selectedSize}) to Cart ✓` : 'Added to Cart ✓')}</span>
                      </>
                    ) : sizeError ? (
                      <>
                        <AlertCircle size={18} />
                        <span>{lang === 'ar' ? '⚠️ اختر المقاس (M أو L) أولاً' : '⚠️ Select Size (M or L) First'}</span>
                      </>
                    ) : sizedConfig && !selectedSize ? (
                      <>
                        <ShoppingCart size={18} />
                        <span>{lang === 'ar' ? 'حدد المقاس للإضافة للسلة' : 'Select Size to Add'}</span>
                      </>
                    ) : sizedConfig && selectedSize ? (
                      <>
                        <ShoppingCart size={18} />
                        <span>{lang === 'ar' ? `أضف للسلة (مقاس ${selectedSize})` : `Add to Cart (Size ${selectedSize})`}</span>
                      </>
                    ) : isByOrder ? (
                      <>
                        <ShoppingCart size={18} />
                        <span>{lang === 'ar' ? 'أضف للسلة (متوفر بالطلب)' : 'Add to Cart (By Order)'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        <span>{lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>
                </div>

                {isByOrder && (
                  <div style={{
                    marginTop: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(79, 70, 229, 0.06)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.83rem',
                    color: '#4338CA',
                    lineHeight: 1.45
                  }}>
                    <Clock size={16} style={{ flexShrink: 0 }} />
                    <span>
                      {lang === 'ar'
                        ? '📦 هذا المنتج متوفر بالطلب: يمكنك إضافته للسلة وإكمال طلبك بشكل طبيعي، وسيقوم فريق الإدارة بالتأكيد وتوفير المنتج فور استلام الطلب.'
                        : '📦 This product is available by order: add it to your cart and complete checkout, and our management team will confirm and fulfill it promptly.'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Product Description (Requirement 12) */}
            {(product.description_en || product.description_ar) && (
              <div className="product-desc-box">
                <h3 className="product-section-heading">
                  {lang === 'ar' ? 'وصف المنتج' : 'Product Description'}
                </h3>
                <p className="product-desc-text">
                  {lang === 'ar'
                    ? sanitizeDetailsText(product.description_ar || product.description_en)
                    : sanitizeDetailsText(product.description_en || product.description_ar)}
                </p>
              </div>
            )}

            {/* Product Specifications / Details (sanitized) */}
            {((product.details_ar && sanitizeDetailsText(product.details_ar).trim()) || (product.details_en && sanitizeDetailsText(product.details_en).trim())) && (
              <div className="product-desc-box" style={{ marginTop: '1rem' }}>
                <h3 className="product-section-heading">
                  {lang === 'ar' ? 'المواصفات الفنية' : 'Technical Specifications'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  {sanitizeDetailsText(lang === 'ar' ? (product.details_ar || product.details_en) : (product.details_en || product.details_ar))
                    .split('\n')
                    .map(l => l.trim())
                    .filter(Boolean)
                    .map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>•</span>
                        <span>{item.replace(/^[•\-*]\s*/, '')}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Product Information Box (Requirement 13 & 14 - Strictly factual, no fake fields) */}
            <div className="product-specs-box">
              <h3 className="product-section-heading">
                {lang === 'ar' ? 'معلومات المنتج' : 'Product Information'}
              </h3>
              <div className="product-specs-grid">
                <div className="product-spec-row">
                  <span className="spec-label">{lang === 'ar' ? 'اسم الأداة' : 'Product Name'}</span>
                  <span className="spec-value" style={{ direction: 'ltr' }}>{displayName}</span>
                </div>
                <div className="product-spec-row">
                  <span className="spec-label">{lang === 'ar' ? 'المادة الدراسية' : 'Subject'}</span>
                  <span className="spec-value" style={{ direction: 'ltr' }}>{subjectTitleEn}</span>
                </div>
                <div className="product-spec-row">
                  <span className="spec-label">{lang === 'ar' ? 'السنة الدراسية' : 'Academic Year'}</span>
                  <span className="spec-value">{yearDisplayName}</span>
                </div>
                <div className="product-spec-row">
                  <span className="spec-label">{lang === 'ar' ? 'حالة التوفر' : 'Availability'}</span>
                  <span className="spec-value">
                    {isByOrder
                      ? (lang === 'ar' ? 'متوفر بالطلب (By Order)' : 'Available By Order')
                      : isLimited
                      ? (lang === 'ar' ? 'كمية محدودة' : 'Limited Quantity')
                      : isComingSoon
                      ? (lang === 'ar' ? 'قريباً' : 'Coming Soon')
                      : isUnavailable
                      ? (lang === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock')
                      : (lang === 'ar' ? 'متوفر للطلب المباشر' : 'In Stock')}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── 4. RELATED PRODUCTS SECTION (Requirements 16 & 17 - Same Subject ONLY) ── */}
        {relatedProducts.length > 0 && (
          <section className="product-related-section" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <div className="product-related-header">
              <h2 className="product-related-title">
                {lang === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}
              </h2>
              <p className="product-related-subtitle">
                {lang === 'ar'
                  ? `أدوات ومستلزمات أخرى لمادة ${subjectTitleEn}`
                  : `Other tools and supplies for ${subjectTitleEn}`}
              </p>
            </div>
            <div className="product-related-grid">
              {relatedProducts.map(relProd => (
                <ProductCard key={relProd.id} product={relProd} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ProductDetails;
