import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { Package, ChevronRight, ChevronLeft, MessageCircle, CheckCircle2, Info } from 'lucide-react';

/* ─── PRODUCT DATA ─────────────────────────────────────── */
const BASE = import.meta.env.BASE_URL; // '/absolute-dental/' on production, '/' on dev

const BOXES = [
  {
    id: 'box-16',
    size: '16"',
    name_ar: 'بوكس أدوات 16 إنش',
    name_en: '16" Tool Box',
    desc_ar: 'بوكس بلاستيك متين بغطاء ملون، صينية داخلية قابلة للإزالة لترتيب الأدوات، ومساحة تخزين واسعة في الأسفل.',
    desc_en: 'Durable plastic toolbox with a coloured lid, removable inner tray for organising tools, and wide storage space at the bottom.',
    features_ar: ['صينية قابلة للإزالة', 'قفلان جانبيان', 'مساحة إضافية أسفل الصينية', 'مقبض مريح للحمل'],
    features_en: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'],
    mainImage: `${BASE}accessories/box16-colors.png`,
    insideImage: `${BASE}accessories/box16-inside1.jpg`,
    colors: [
      { id: 'yellow', hex: '#F5C518', label_ar: 'أصفر',      label_en: 'Yellow',     image: `${BASE}accessories/box16-colors.png` },
      { id: 'maroon', hex: '#8B1A1A', label_ar: 'بردو',       label_en: 'Maroon',     image: `${BASE}accessories/box16-colors.png` },
      { id: 'red',    hex: '#E02020', label_ar: 'أحمر',       label_en: 'Red',        image: `${BASE}accessories/box16-colors.png` },
      { id: 'purple', hex: '#7B3FE4', label_ar: 'بنفسجي',    label_en: 'Purple',     image: `${BASE}accessories/box16-colors.png` },
      { id: 'blue',   hex: '#1565C0', label_ar: 'أزرق',       label_en: 'Blue',       image: `${BASE}accessories/box16-colors.png` },
    ],
  },
  {
    id: 'box-16-5',
    size: '16.5"',
    name_ar: 'بوكس تنظيم 16.5 إنش',
    name_en: '16.5" Organizer Box',
    desc_ar: 'بوكس ذو غطاء شفاف بالكامل مع 3 طبقات شفافة متدرجة قابلة للفتح، مثالي لتنظيم الإكسسوارات الصغيرة والخيوط والمواد.',
    desc_en: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for organising small accessories, threads, and materials.',
    features_ar: ['غطاء شفاف بالكامل', '3 طبقات تنظيم شفافة', 'قفل أمامي واحد', 'تقسيمات داخلية دقيقة'],
    features_en: ['Fully transparent lid', '3 clear organiser layers', 'Single front latch', 'Fine internal dividers'],
    mainImage: `${BASE}accessories/box16_5-colors.png`,
    insideImage: `${BASE}accessories/box16_5-inside.png`,
    colors: [
      { id: 'red',    hex: '#D32F2F', label_ar: 'أحمر',       label_en: 'Red',        image: `${BASE}accessories/box16_5-colors.png` },
      { id: 'orange', hex: '#F57C00', label_ar: 'برتقالي',    label_en: 'Orange',     image: `${BASE}accessories/box16_5-colors.png` },
      { id: 'teal',   hex: '#00ACC1', label_ar: 'تركواز',     label_en: 'Teal',       image: `${BASE}accessories/box16_5-colors.png` },
      { id: 'navy',   hex: '#1565C0', label_ar: 'أزرق غامق', label_en: 'Navy Blue',  image: `${BASE}accessories/box16_5-colors.png` },
      { id: 'blue',   hex: '#42A5F5', label_ar: 'أزرق فاتح', label_en: 'Light Blue', image: `${BASE}accessories/box16_5-colors.png` },
      { id: 'green',  hex: '#43A047', label_ar: 'أخضر',       label_en: 'Green',      image: `${BASE}accessories/box16_5-colors.png` },
    ],
  },
  {
    id: 'box-17',
    size: '17"',
    name_ar: 'بوكس احترافي 17 إنش — GT-MAX',
    name_en: '17" Professional Box — GT-MAX',
    desc_ar: 'بوكس احترافي من ماركة GT-MAX/BADC، بغطاء ملون يحتوي على منظم شفاف بـ 4 خانات، ومساحة تخزين رئيسية واسعة. مصنوع من بلاستيك عالي الجودة للاستخدام الاحترافي.',
    desc_en: 'Professional GT-MAX/BADC toolbox with a coloured lid featuring a 4-compartment clear organiser and wide main storage space. Made from high-quality plastic for professional use.',
    features_ar: ['منظم شفاف 4 خانات في الغطاء', 'مساحة تخزين رئيسية واسعة', 'قفلان جانبيان + مشبك أمامي', 'بلاستيك متين — Strong & Durable'],
    features_en: ['4-compartment clear lid organiser', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable high-quality plastic'],
    mainImage: `${BASE}accessories/box17-colors.png`,
    insideImage: `${BASE}accessories/box17-inside.png`,
    colors: [
      { id: 'beige',  hex: '#C8A882', label_ar: 'بيج',         label_en: 'Beige',      image: `${BASE}accessories/box17-colors.png` },
      { id: 'teal',   hex: '#00897B', label_ar: 'تركواز',      label_en: 'Teal',       image: `${BASE}accessories/box17-colors.png` },
      { id: 'pink',   hex: '#E91E8C', label_ar: 'وردي',        label_en: 'Pink',       image: `${BASE}accessories/box17-colors.png` },
      { id: 'blue',   hex: '#42A5F5', label_ar: 'أزرق فاتح',  label_en: 'Light Blue', image: `${BASE}accessories/box17-group.jpg`  },
      { id: 'red',    hex: '#E02020', label_ar: 'أحمر',        label_en: 'Red',        image: `${BASE}accessories/box17-group.jpg`  },
      { id: 'lime',   hex: '#7CB342', label_ar: 'أخضر ليموني', label_en: 'Lime Green', image: `${BASE}accessories/box17-colors.png` },
      { id: 'purple', hex: '#7B3FE4', label_ar: 'بنفسجي',     label_en: 'Purple',     image: `${BASE}accessories/box17-colors.png` },
    ],
  },
];

/* ─── BOX CARD COMPONENT ───────────────────────────────── */
const BoxCard = ({ box, lang, isRtl, whatsappNumber }) => {
  const [selectedColor, setSelectedColor] = useState(box.colors[0]);
  const [showInside, setShowInside] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;

  const buildWhatsappMsg = () => {
    const colorLabel = lang === 'ar' ? selectedColor.label_ar : selectedColor.label_en;
    const boxName    = lang === 'ar' ? box.name_ar : box.name_en;
    const msg = lang === 'ar'
      ? `مرحبا، أريد الاستفسار عن: ${boxName} — اللون: ${colorLabel} 🎨`
      : `Hi, I'd like to order: ${boxName} — Colour: ${colorLabel} 🎨`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const displayImage = showInside ? box.insideImage : selectedColor.image;

  return (
    <div style={{
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'box-shadow 0.3s',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── IMAGE AREA ── */}
      <div style={{ position: 'relative', background: 'var(--accent)', aspectRatio: '4/3', overflow: 'hidden' }}>
        {/* Fade transition */}
        <img
          key={displayImage}
          src={displayImage}
          alt={lang === 'ar' ? box.name_ar : box.name_en}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.35s ease',
            opacity: imgLoaded ? 1 : 0,
          }}
        />

        {/* Size badge */}
        <div style={{
          position: 'absolute', top: '0.75rem',
          ...(isRtl ? { left: '0.75rem' } : { right: '0.75rem' }),
          background: 'var(--secondary)', color: '#fff',
          fontSize: '0.75rem', fontWeight: 800,
          padding: '0.25rem 0.65rem', borderRadius: '999px',
          letterSpacing: '0.03em',
        }}>
          {box.size}
        </div>

        {/* Inside / Outside toggle */}
        <button
          onClick={() => { setShowInside(v => !v); setImgLoaded(false); }}
          style={{
            position: 'absolute', bottom: '0.75rem',
            ...(isRtl ? { right: '0.75rem' } : { left: '0.75rem' }),
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            color: '#fff', border: 'none', borderRadius: '999px',
            padding: '0.3rem 0.85rem', fontSize: '0.72rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}
        >
          <Info size={12} />
          {showInside
            ? (lang === 'ar' ? 'الخارج' : 'Outside')
            : (lang === 'ar' ? 'الداخل' : 'Inside')}
        </button>

        {/* Selected colour label */}
        <div style={{
          position: 'absolute', bottom: '0.75rem',
          ...(isRtl ? { left: '0.75rem' } : { right: '0.75rem' }),
          background: selectedColor.hex + 'cc',
          backdropFilter: 'blur(6px)',
          color: '#fff', borderRadius: '999px',
          padding: '0.3rem 0.85rem', fontSize: '0.72rem', fontWeight: 800,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}>
          {lang === 'ar' ? selectedColor.label_ar : selectedColor.label_en}
        </div>
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Title */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
            {lang === 'ar' ? box.name_ar : box.name_en}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {lang === 'ar' ? box.desc_ar : box.desc_en}
          </p>
        </div>

        {/* ── COLOR PICKER ── */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {lang === 'ar' ? 'اختر اللون' : 'Choose Colour'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {box.colors.map(color => (
              <button
                key={color.id}
                title={lang === 'ar' ? color.label_ar : color.label_en}
                onClick={() => { setSelectedColor(color); setShowInside(false); setImgLoaded(false); }}
                style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: color.hex,
                  border: selectedColor.id === color.id
                    ? '3px solid var(--secondary)'
                    : '3px solid transparent',
                  outline: selectedColor.id === color.id
                    ? '2px solid var(--secondary)'
                    : '2px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: selectedColor.id === color.id ? 'scale(1.18)' : 'scale(1)',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {selectedColor.id === color.id && (
                  <CheckCircle2
                    size={14}
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#fff',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {lang === 'ar'
              ? `اللون المختار: ${selectedColor.label_ar}`
              : `Selected: ${selectedColor.label_en}`}
          </p>
        </div>

        {/* ── FEATURES ── */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {(lang === 'ar' ? box.features_ar : box.features_en).map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--secondary)', flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* ── ORDER BUTTON ── */}
        <a
          href={buildWhatsappMsg()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem',
            background: '#25D366', color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '0.8rem 1.25rem',
            fontWeight: 800, fontSize: '0.9rem',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            marginTop: 'auto',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <MessageCircle size={18} />
          {lang === 'ar' ? 'اطلب عبر واتساب' : 'Order via WhatsApp'}
          <ChevronFwd size={15} />
        </a>
      </div>
    </div>
  );
};

/* ─── MAIN PAGE ─────────────────────────────────────────── */
export const AccessoriesPage = () => {
  const { lang, isRtl } = useLanguage();
  const [whatsappNumber, setWhatsappNumber] = useState('218911234567');

  /* Load WhatsApp number from DB settings (same as ContactPage) */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'contact_links')
          .single();
        if (data?.value?.whatsapp) {
          // Extract number from URL like https://wa.me/218XXXXXXXXX
          const match = String(data.value.whatsapp).match(/\d+/);
          if (match) setWhatsappNumber(match[0]);
        }
      } catch (_) {}
    };
    fetchSettings();
  }, []);

  const ChevronFwd = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{
        background: 'var(--gradient-dark)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '3.5rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(205,191,166,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(86,79,69,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.45)' }}>
            <Link to="/" style={{ color: 'inherit' }}>
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronFwd size={14} />
            <span style={{ color: '#CDBFA6', fontWeight: 700 }}>
              {lang === 'ar' ? 'اكسسوارات الأسنان' : 'Dental Accessories'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0,
            }}>🧰</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              {lang === 'ar' ? 'اكسسوارات الأسنان' : 'Dental Accessories'}
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', maxWidth: 520 }}>
            {lang === 'ar'
              ? 'بوكسات تخزين احترافية بألوان متعددة — اختر اللون المناسب لك واطلب مباشرة عبر واتساب'
              : 'Professional storage boxes in multiple colours — pick your colour and order directly via WhatsApp'}
          </p>
        </div>
      </div>

      {/* ── BOXES GRID ── */}
      <div className="container" style={{ padding: '3rem 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem',
        }}>
          {BOXES.map(box => (
            <BoxCard
              key={box.id}
              box={box}
              lang={lang}
              isRtl={isRtl}
              whatsappNumber={whatsappNumber}
            />
          ))}
        </div>

        {/* Info note */}
        <div style={{
          marginTop: '2.5rem',
          background: 'var(--accent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        }}>
          <Package size={20} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            {lang === 'ar'
              ? 'هذه البوكسات متوفرة للبيع المباشر — تواصل معنا عبر واتساب لتأكيد التوفر والسعر. يمكن التوصيل مجاناً لطلاب كلية الأسنان.'
              : 'These boxes are available for direct purchase — contact us via WhatsApp to confirm availability and pricing. Free delivery for dental college students.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessoriesPage;
