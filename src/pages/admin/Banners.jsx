import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { invalidateSiteSectionsConfigCache } from '../../utils/siteSectionsEngine';
import { Edit, X, Upload, Check, RotateCcw, Image as ImageIcon, Layout, Layers } from 'lucide-react';

// Default built-in artworks for live preview when no custom image is set
import homeHeroBgPng from '../../assets/images/home-hero-bg.png';
import studyToolsPng from '../../assets/images/study-tools-faded.png';
import accessoriesCardPng from '../../assets/images/accessories-faded.png';
import dentalBoxesCardPng from '../../assets/images/dental-boxes-faded.png';
import otherSuppliesPng from '../../assets/images/other-supplies-artwork.png';
import accessoriesBannerArt from '../../assets/images/accessories-banner-art.png';
import dentalBoxesArtwork from '../../assets/images/dental-boxes-artwork.png';

export const DEFAULT_SITE_SECTIONS = {
  home_hero: {
    key: 'home_hero',
    group: 'الصفحة الرئيسية (Home Page)',
    name: 'خلفية وعنوان الهيرو الرئيسي (Home Hero)',
    title_ar: 'شن تبي تجهّز؟',
    title_en: 'What are you preparing for?',
    subtitle_ar: 'اختر القسم المناسب لاحتياجاتك.',
    subtitle_en: 'Choose the section that suits your needs.',
    image_url: '',
    default_img: homeHeroBgPng
  },
  home_card_study: {
    key: 'home_card_study',
    group: 'الصفحة الرئيسية (Home Page)',
    name: 'بطاقة قسم أدوات الدراسة (Study Tools Card)',
    title_ar: 'أدوات الدراسة',
    title_en: 'Study Tools',
    subtitle_ar: 'كل مستلزمات الدراسة في مكان واحد.',
    subtitle_en: 'All your dental study instruments and supplies in one place.',
    image_url: '',
    default_img: studyToolsPng
  },
  home_card_accessories: {
    key: 'home_card_accessories',
    group: 'الصفحة الرئيسية (Home Page)',
    name: 'بطاقة قسم الإكسسوارات (Accessories Card)',
    title_ar: 'الإكسسوارات',
    title_en: 'Accessories',
    subtitle_ar: 'لابكوت، يونيفورم، إكسسوارات طبية وشخصية.',
    subtitle_en: 'Lab coats, uniforms, personal & medical accessories.',
    image_url: '',
    default_img: accessoriesCardPng
  },
  home_card_boxes: {
    key: 'home_card_boxes',
    group: 'الصفحة الرئيسية (Home Page)',
    name: 'بطاقة قسم البوكسات (Boxes Card)',
    title_ar: 'البوكسات',
    title_en: 'Boxes',
    subtitle_ar: 'بوكسات تنظيم وحفظ لجميع أدواتك.',
    subtitle_en: 'Organizer & storage boxes for all your tools.',
    image_url: '',
    default_img: dentalBoxesCardPng
  },
  study_other_banner: {
    key: 'study_other_banner',
    group: 'صفحات الأقسام الرئيسية (Section Heroes)',
    name: 'هيرو وبانر قسم المستلزمات الأخرى (Other Supplies Hero)',
    title_ar: 'مستلزمات أخرى',
    title_en: 'Other Supplies',
    subtitle_ar: 'مستلزمات يحتاجها طلبة طب الأسنان في مختلف السنوات',
    subtitle_en: 'Supplies needed by dental students across different academic years',
    image_url: '',
    default_img: otherSuppliesPng
  },
  accessories_hero: {
    key: 'accessories_hero',
    group: 'صفحات الأقسام الرئيسية (Section Heroes)',
    name: 'هيرو صفحة الإكسسوارات (Accessories Page Hero)',
    title_ar: 'الإكسسوارات',
    title_en: 'Accessories',
    subtitle_ar: 'لايكوت، يونيفورم، ديكور وإكسسوارات طبية مخصصة لطلبة طب الأسنان',
    subtitle_en: 'Lab coats, uniforms, clinic decor, and medical accessories for dental students',
    image_url: '',
    default_img: accessoriesBannerArt
  },
  boxes_hero: {
    key: 'boxes_hero',
    group: 'صفحات الأقسام الرئيسية (Section Heroes)',
    name: 'هيرو صفحة البوكسات (Dental Boxes Page Hero)',
    title_ar: 'البوكسات',
    title_en: 'Dental Boxes',
    subtitle_ar: 'بوكسات تنظيم وحفظ متينة بأحجام وألوان متعددة لحفظ كافة أدواتك الدراسية والسريرية',
    subtitle_en: 'Durable organizer and storage boxes in multiple sizes and colors for your dental tools',
    image_url: '',
    default_img: dentalBoxesArtwork
  }
};

export const Banners = () => {
  const { t } = useLanguage();

  const [sectionsConfig, setSectionsConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('ad_site_sections_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = { ...DEFAULT_SITE_SECTIONS };
        Object.keys(merged).forEach(k => {
          if (parsed[k]) merged[k] = { ...merged[k], ...parsed[k] };
        });
        return merged;
      }
    } catch (_) {}
    return DEFAULT_SITE_SECTIONS;
  });

  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [formState, setFormState] = useState({
    title_ar: '',
    title_en: '',
    subtitle_ar: '',
    subtitle_en: '',
    image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1400;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        };
      };
    });
  };

  const uploadFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error } = await supabase.storage
        .from('smylodent-assets')
        .upload(filePath, file, { contentType: file.type || 'image/png' });

      if (error) {
        console.warn('Storage upload failed, falling back to compressed dataUrl', error);
        return await compressImage(file);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('smylodent-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Upload process error, falling back to base64', err);
      return await compressImage(file);
    }
  };

  useEffect(() => {
    fetchSectionsConfig();
  }, []);

  const fetchSectionsConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'site_sections_config')
        .maybeSingle();

      if (data?.value) {
        const merged = { ...DEFAULT_SITE_SECTIONS };
        Object.keys(merged).forEach(k => {
          if (data.value[k]) {
            merged[k] = { ...merged[k], ...data.value[k] };
          }
        });
        setSectionsConfig(merged);
        try {
          localStorage.setItem('ad_site_sections_config', JSON.stringify(data.value));
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditSection = (key) => {
    const sec = sectionsConfig[key];
    if (!sec) return;
    setEditingKey(key);
    setFormState({
      title_ar: sec.title_ar || '',
      title_en: sec.title_en || '',
      subtitle_ar: sec.subtitle_ar || '',
      subtitle_en: sec.subtitle_en || '',
      image_url: sec.image_url || ''
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadFile(file);
    setFormState(prev => ({ ...prev, image_url: url }));
    setUploadingImage(false);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    setSubmitting(true);

    const updatedConfig = {
      ...sectionsConfig,
      [editingKey]: {
        ...sectionsConfig[editingKey],
        title_ar: formState.title_ar.trim(),
        title_en: formState.title_en.trim(),
        subtitle_ar: formState.subtitle_ar.trim(),
        subtitle_en: formState.subtitle_en.trim(),
        image_url: formState.image_url.trim()
      }
    };

    // Strip default_img before saving to DB
    const dbValue = {};
    Object.keys(updatedConfig).forEach(k => {
      dbValue[k] = {
        title_ar: updatedConfig[k].title_ar,
        title_en: updatedConfig[k].title_en,
        subtitle_ar: updatedConfig[k].subtitle_ar,
        subtitle_en: updatedConfig[k].subtitle_en,
        image_url: updatedConfig[k].image_url || ''
      };
    });

    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'site_sections_config',
        value: dbValue
      });
      if (error) throw error;

      // Also sync accessories_bgs if accessories_hero or boxes_hero was updated
      if (editingKey === 'accessories_hero' || editingKey === 'boxes_hero') {
        await supabase.from('settings').upsert({
          key: 'accessories_bgs',
          value: {
            accessories_page_bg: dbValue.accessories_hero?.image_url || '',
            dental_boxes_page_bg: dbValue.boxes_hero?.image_url || ''
          }
        });
      }

      setSectionsConfig(updatedConfig);
      invalidateSiteSectionsConfigCache(dbValue);

      setEditingKey(null);
      setSavedNotice('تم حفظ تعديلات الهيرو والقسم بنجاح وتطبيقها في الموقع!');
      setTimeout(() => setSavedNotice(''), 4000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ / Error saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const sectionList = Object.values(sectionsConfig);
  const homeGroup = sectionList.filter(s => s.group.includes('الصفحة الرئيسية'));
  const pagesGroup = sectionList.filter(s => !s.group.includes('الصفحة الرئيسية'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem' }}>
            إدارة الهيرو وبانرات الأقسام الرئيسية / Site Heroes & Banners
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            تحكم كامل في صور الهيرو، البطاقات الرئيسية، والعناوين التوضيحية لجميع أقسام المتجر.
          </p>
        </div>
        <Link
          to="/admin/course-banners"
          className="btn btn-secondary"
          style={{ padding: '0.6rem 1.15rem', fontSize: '0.84rem', fontWeight: 800, gap: '0.45rem' }}
        >
          <ImageIcon size={16} />
          <span>Manage Course Banners / بانرات المواد الدراسية</span>
        </Link>
      </div>

      {savedNotice && (
        <div style={{
          padding: '0.85rem 1.1rem',
          backgroundColor: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid #10B981',
          color: '#047857',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* GROUP 1: HOME PAGE HERO & GATEWAY CARDS */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Layout size={20} style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>1. الصفحة الرئيسية (الهيرو والبطاقات الثلاث الرئيسية)</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
          {homeGroup.map((sec) => {
            const activeImg = sec.image_url || sec.default_img;
            return (
              <div
                key={sec.key}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1rem',
                  backgroundColor: '#FAF7F2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <div style={{
                    width: '78px',
                    height: '64px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#EFE8DD',
                    border: '1px solid rgba(0,0,0,0.08)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src={activeImg} alt={sec.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary)', display: 'block', marginBottom: '2px' }}>
                      {sec.name}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#2C1A11' }}>{sec.title_ar}</h4>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#6B5344', lineHeight: 1.35 }}>
                      {sec.subtitle_ar}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E8DFD3', paddingTop: '0.65rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: sec.image_url ? 'rgba(16, 185, 129, 0.14)' : 'rgba(138, 108, 82, 0.12)',
                    color: sec.image_url ? '#047857' : '#6B5344'
                  }}>
                    {sec.image_url ? 'صورة مخصصة نشطة' : 'الصورة الافتراضية'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditSection(sec.key)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                  >
                    <Edit size={14} />
                    <span>تعديل الهيرو / النص</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GROUP 2: SECTION HERO BANNERS */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Layers size={20} style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>2. هيرو صفحات الأقسام (المستلزمات الأخرى، الإكسسوارات، البوكسات)</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
          {pagesGroup.map((sec) => {
            const activeImg = sec.image_url || sec.default_img;
            return (
              <div
                key={sec.key}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1rem',
                  backgroundColor: '#FAF7F2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <div style={{
                    width: '78px',
                    height: '64px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#EFE8DD',
                    border: '1px solid rgba(0,0,0,0.08)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src={activeImg} alt={sec.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary)', display: 'block', marginBottom: '2px' }}>
                      {sec.name}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#2C1A11' }}>{sec.title_ar}</h4>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#6B5344', lineHeight: 1.35 }}>
                      {sec.subtitle_ar}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E8DFD3', paddingTop: '0.65rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: sec.image_url ? 'rgba(16, 185, 129, 0.14)' : 'rgba(138, 108, 82, 0.12)',
                    color: sec.image_url ? '#047857' : '#6B5344'
                  }}>
                    {sec.image_url ? 'صورة مخصصة نشطة' : 'الصورة الافتراضية'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditSection(sec.key)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                  >
                    <Edit size={14} />
                    <span>تعديل الهيرو / النص</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingKey && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--surface-color)',
              padding: '1.75rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                  {sectionsConfig[editingKey]?.group}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0 0' }}>
                  {sectionsConfig[editingKey]?.name}
                </h3>
              </div>
              <button onClick={() => setEditingKey(null)} className="action-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">العنوان الرئيسي (عربي) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formState.title_ar}
                    onChange={(e) => setFormState(prev => ({ ...prev, title_ar: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">العنوان الرئيسي (إنجليزي)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.title_en}
                    onChange={(e) => setFormState(prev => ({ ...prev, title_en: e.target.value }))}
                    style={{ direction: 'ltr' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الوصف / العنوان الفرعي (عربي)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formState.subtitle_ar}
                  onChange={(e) => setFormState(prev => ({ ...prev, subtitle_ar: e.target.value }))}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الوصف / العنوان الفرعي (إنجليزي)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formState.subtitle_en}
                  onChange={(e) => setFormState(prev => ({ ...prev, subtitle_en: e.target.value }))}
                  style={{ resize: 'none', direction: 'ltr' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">صورة الهيرو / البطاقة</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.image_url}
                    onChange={(e) => setFormState(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="رابط الصورة أو ارفع صورة من جهازك (اتركه فارغاً للصورة الافتراضية)..."
                  />
                  <label className="btn btn-outline" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Upload size={15} />
                    <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صورة'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} disabled={uploadingImage} />
                  </label>
                </div>

                {/* Live Preview */}
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#FAF7F2',
                  borderRadius: '10px',
                  border: '1px solid #E5D9C8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={formState.image_url || sectionsConfig[editingKey]?.default_img}
                      alt="Preview"
                      style={{ width: '90px', height: '62px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', color: '#2C1A11' }}>
                        {formState.image_url ? 'صورة مخصصة جديدة' : 'الصورة الافتراضية الحالية'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#7A6556' }}>
                        تظهر مباشرة في واجهة المتجر
                      </span>
                    </div>
                  </div>

                  {formState.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, image_url: '' }))}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)', gap: '0.3rem' }}
                    >
                      <RotateCcw size={13} />
                      <span>استعادة الافتراضية</span>
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.4rem' }}>
                <button type="button" onClick={() => setEditingKey(null)} className="btn btn-outline">{t('admin.cancel')}</button>
                <button type="submit" disabled={submitting} className="btn btn-secondary">
                  {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Banners;
