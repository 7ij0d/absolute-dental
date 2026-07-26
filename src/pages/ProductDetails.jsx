import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import ReviewSection from '../components/ReviewSection';
import QRModal from '../components/QRModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ProductCard from '../components/ProductCard';
import { ShoppingCart, Heart, Share2, QrCode, Check, Copy, Play, Pause, Volume2, VolumeX, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const AudioPlayer = ({ src }) => {
  const { lang, isRtl } = useLanguage();
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    // If source changes, reset player state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => console.error("Error playing audio", err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = parseFloat(e.target.value);
    setCurrentTime(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'var(--surface-color)',
        border: '1.5px solid var(--secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '0.8rem 1rem',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        boxShadow: 'var(--shadow-sm)',
        direction: isRtl ? 'rtl' : 'ltr'
      }}
      className="audio-explanation-player"
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Circle Button */}
      <button
        onClick={togglePlay}
        type="button"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: 'var(--secondary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 4px 8px rgba(var(--secondary-rgb), 0.25)',
          transition: 'transform 0.15s ease'
        }}
        className="play-audio-btn"
      >
        {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: isRtl ? '0' : '2px', marginRight: isRtl ? '2px' : '0' }} />}
      </button>

      {/* Progress slider & Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexGrow: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lang === 'ar' ? '🎧 استمع إلى الشرح الصوتي للمنتج' : '🎧 Listen to Audio Explanation'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--border-color)',
            outline: 'none',
            cursor: 'pointer',
            accentColor: 'var(--secondary)'
          }}
        />
      </div>

      {/* Volume control */}
      <button
        onClick={toggleMute}
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Bouncing audio wave simulation (only shown when playing) */}
      {isPlaying && (
        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '18px', flexShrink: 0, marginLeft: isRtl ? '0' : '0.25rem', marginRight: isRtl ? '0.25rem' : '0' }}>
          <div className="audio-wave-bar" style={{ width: '2px', height: '8px', backgroundColor: 'var(--secondary)', borderRadius: '1px', animation: 'bounceAudio 0.8s infinite alternate' }}></div>
          <div className="audio-wave-bar" style={{ width: '2px', height: '14px', backgroundColor: 'var(--secondary)', borderRadius: '1px', animation: 'bounceAudio 1.2s infinite alternate 0.2s' }}></div>
          <div className="audio-wave-bar" style={{ width: '2px', height: '6px', backgroundColor: 'var(--secondary)', borderRadius: '1px', animation: 'bounceAudio 0.9s infinite alternate 0.1s' }}></div>
          <div className="audio-wave-bar" style={{ width: '2px', height: '11px', backgroundColor: 'var(--secondary)', borderRadius: '1px', animation: 'bounceAudio 1.1s infinite alternate 0.3s' }}></div>
        </div>
      )}
    </div>
  );
};

export const ProductDetails = () => {
  const { id } = useParams();
  const { lang, t, isRtl } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [subject, setSubject] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sharing states
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [effectiveStock, setEffectiveStock] = useState(null); // null = no limit / not a linked product

  // Load product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const { data: prod } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (prod) {
          setProduct(prod);
          
          // Effective stock: handle shared inventory
          if (prod.shared_inventory_product_id) {
            const { data: master } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', prod.shared_inventory_product_id)
              .single();
            const mult = prod.unit_multiplier || 1;
            const eff = master ? Math.floor(master.stock_quantity / mult) : 0;
            setEffectiveStock(eff);
          } else {
            setEffectiveStock(prod.stock_quantity ?? null);
          }

          // Image gallery setups (main photo + any supplementary product_images)
          const imgList = [prod.image_url];
          const { data: extraImgs } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', prod.id)
            .order('sort_order', { ascending: true });
          
          if (extraImgs) {
            extraImgs.forEach((img) => imgList.push(img.image_url));
          }
          setImages(imgList.filter(Boolean));
          setActiveImage(prod.image_url);

          // Subject & year name loading
          if (prod.subject_id) {
            const { data: sub } = await supabase
              .from('subjects')
              .select('*')
              .eq('id', prod.subject_id)
              .single();
            if (sub) setSubject(sub);

            // Similar recommendations
            const { data: similar } = await supabase
              .from('products')
              .select('*')
              .eq('subject_id', prod.subject_id)
              .eq('is_active', true)
              .eq('is_archived', false)
              .not('id', 'eq', prod.id)
              .limit(3);
            if (similar) setSimilarProducts(similar);
          }

          // Save to Recently Viewed in LocalStorage
          saveRecentlyViewed(prod);
        }
      } catch (err) {
        console.error('Error fetching product specs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const saveRecentlyViewed = (prod) => {
    const stored = localStorage.getItem('smylodent_recent_viewed');
    let list = stored ? JSON.parse(stored) : [];
    // Filter duplicates
    list = list.filter((item) => item.id !== prod.id);
    list.unshift({
      id: prod.id,
      name_ar: prod.name_ar,
      name_en: prod.name_en,
      price: prod.price,
      compare_at_price: prod.compare_at_price,
      image_url: prod.image_url,
      availability: prod.availability
    });
    localStorage.setItem('smylodent_recent_viewed', JSON.stringify(list.slice(0, 4)));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCart = () => {
    if (!product) return;
    // Linked product stock check
    if (effectiveStock !== null && quantity > effectiveStock) {
      alert(
        effectiveStock === 0
          ? `❌ "${product.name_ar}" غير متوفر حالياً.`
          : `❌ الكمية المطلوبة (${quantity}) تتجاوز المتاح (${effectiveStock} وحدة فقط).`
      );
      return;
    }
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
        <SkeletonLoader type="details" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h2>عذراً، هذا المنتج غير متوفر حالياً.</h2>
        <p style={{ color: 'var(--text-muted)' }}>Sorry, this product was not found.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          {t('nav.home')}
        </Link>
      </div>
    );
  }

  const discountPercent = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* Breadcrumb Hero */}
      <div style={{
        background: 'var(--gradient-dark)',
        padding: '2rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'inherit' }}>{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <span>/</span>
            {subject && (
              <>
                <Link to={`/subject/${subject.slug}`} style={{ color: 'inherit' }}>
                  {lang === 'ar' ? subject.name_ar : subject.name_en}
                </Link>
                <span>/</span>
              </>
            )}
            <span style={{ color: 'var(--purple-300)', fontWeight: 700 }}>
              {lang === 'ar' ? product.name_ar : product.name_en}
            </span>
          </div>
        </div>
      </div>

      {/* 1. PRODUCT METADATA BLOCK */}
      <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3rem' }} className="details-main-grid">
        
        {/* Left Side: Photo Album */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Main Photo viewport */}
          <div
            className="card"
            style={{
              position: 'relative',
              height: '380px',
              backgroundColor: 'var(--accent)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <img
              src={activeImage || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format'}
              alt={product.name_en}
              style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' }}
              className="zoom-image"
            />
            
            {/* Carousel navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const currentIdx = images.indexOf(activeImage);
                    const prevIdx = (currentIdx - 1 + images.length) % images.length;
                    setActiveImage(images[prevIdx]);
                  }}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                  title={isRtl ? 'الصورة السابقة' : 'Previous image'}
                >
                  {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const currentIdx = images.indexOf(activeImage);
                    const nextIdx = (currentIdx + 1) % images.length;
                    setActiveImage(images[nextIdx]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                  title={isRtl ? 'الصورة التالية' : 'Next image'}
                >
                  {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </>
            )}

            {discountPercent > 0 && (
              <span className="badge badge-discount" style={{ position: 'absolute', top: '1rem', left: isRtl ? 'auto' : '1rem', right: isRtl ? '1rem' : 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Mini Album pre-views */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.4rem', justifyContent: 'center' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '65px',
                    height: '65px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImage === img ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                    backgroundColor: 'var(--accent)',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Text details and selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Subject tag link */}
          {subject && (
            <Link
              to={`/subject/${subject.slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--secondary)',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <Sparkles size={16} />
              {subject.name_en}
            </Link>
          )}

          {/* Title */}
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {product.name_en}
          </h1>

          {/* Pricing tag row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {product.price} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t('cart.currency')}</span>
            </span>
            {product.compare_at_price && (
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {product.compare_at_price} {t('cart.currency')}
              </span>
            )}
          </div>

          {/* Short description */}
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
            {lang === 'ar' ? product.description_ar : product.description_en}
          </p>

          {/* Audio Explanation Player */}
          {product.audio_url && (
            <AudioPlayer src={product.audio_url} />
          )}

          {/* Bullet specifications list */}
          {(lang === 'ar' ? product.details_ar : product.details_en) && (
            <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyle: 'none' }}>
                {(lang === 'ar' ? product.details_ar : product.details_en).split('\n').map((point, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--secondary)' }}>•</span>
                    {point.trim().replace(/^•\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity selector & Actions */}
          {(product.availability !== 'unavailable' && (effectiveStock === null || effectiveStock > 0)) ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
              
              {/* Qty count control */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '0.5rem 1rem', fontWeight: 'bold' }}>-</button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                <button
                  onClick={() => {
                    const maxQ = effectiveStock !== null ? effectiveStock : (product.stock_quantity || 99);
                    setQuantity(Math.min(maxQ, quantity + 1));
                  }}
                  style={{ padding: '0.5rem 1rem', fontWeight: 'bold' }}
                  disabled={effectiveStock !== null && quantity >= effectiveStock}
                >+</button>
              </div>

              {/* Add to Cart */}
              <button onClick={handleAddToCart} className="btn btn-outline" style={{ flexGrow: 1, padding: '0.75rem 1.5rem' }}>
                <ShoppingCart size={18} />
                {t('product.add_to_cart')}
              </button>

              {/* Checkout / Order now */}
              <button onClick={handleBuyNow} className="btn btn-secondary" style={{ flexGrow: 1, padding: '0.75rem 1.5rem' }}>
                {t('product.buy_now')}
              </button>

            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontWeight: 700, marginTop: '1rem' }}>
              {t('subject.unavailable')}
            </div>
          )}

          {/* Share links */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button onClick={handleCopyLink} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', gap: '0.3rem' }}>
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              {copied ? t('product.link_copied') : t('product.share')}
            </button>
            <button onClick={() => setQrOpen(true)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', gap: '0.3rem' }}>
              <QrCode size={14} />
              {t('product.qr_code')}
            </button>
          </div>

        </div>

      </div>

      {/* 2. DEMO VIDEO OR MANUAL DIAGRAMS */}
      {product.usage_video_url && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Play size={18} style={{ color: 'var(--secondary)' }} />
              {t('product.usage_video')}
            </h3>
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', width: '100%', paddingTop: '56.25%', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <iframe
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              src={product.usage_video_url}
              title="Usage demonstration video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>
      )}

      {/* 3. REVIEW SECTION */}
      <ReviewSection productId={product.id} />

      {/* 4. SIMILAR RECOMMENDATIONS */}
      {similarProducts.length > 0 && (
        <section>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.25rem' }}>
            {t('product.similar_products')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {similarProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* QR Code sharing popup */}
      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        productUrl={window.location.href}
        productName={product.name_en}
      />

      <style>{`
        .zoom-image:hover {
          transform: scale(1.08);
        }
        @keyframes bounceAudio {
          0% { height: 4px; }
          100% { height: 16px; }
        }
        @media (max-width: 768px) {
          .details-main-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
      </div>{/* /container */}
    </div>
  );
};

export default ProductDetails;
