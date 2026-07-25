import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { Plus, Edit, Trash2, X, PlusCircle } from 'lucide-react';

export const Banners = () => {
  const { t } = useLanguage();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingBanner, setEditingBanner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subtitleAr, setSubtitleAr] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Larger for banner images
          const MAX_HEIGHT = 600;
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

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const uploadFile = async (file) => {
    try {
      const compressedDataUrl = await compressImage(file);
      const arr = compressedDataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { data, error } = await supabase.storage
        .from('smylodent-assets')
        .upload(filePath, blob, { contentType: mime });

      if (error) {
        console.warn('Storage upload failed, falling back to base64', error);
        return compressedDataUrl;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('smylodent-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Upload process error, falling back to base64', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => resolve(e.target.result);
      });
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const url = await uploadFile(file);
    setImageUrl(url);
    setUploadingImage(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (data) setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setTitleAr('');
    setTitleEn('');
    setSubtitleAr('');
    setSubtitleEn('');
    setImageUrl('');
    setLinkUrl('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (ban) => {
    setEditingBanner(ban);
    setTitleAr(ban.title_ar || '');
    setTitleEn(ban.title_en || '');
    setSubtitleAr(ban.subtitle_ar || '');
    setSubtitleEn(ban.subtitle_en || '');
    setImageUrl(ban.image_url || '');
    setLinkUrl(ban.link_url || '');
    setIsActive(ban.is_active !== false);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title_ar: titleAr.trim(),
      title_en: titleEn.trim(),
      subtitle_ar: subtitleAr.trim(),
      subtitle_en: subtitleEn.trim(),
      image_url: imageUrl.trim(),
      link_url: linkUrl.trim() || null,
      is_active: isActive
    };

    try {
      if (editingBanner) {
        await supabase.from('banners').update(payload).eq('id', editingBanner.id);
      } else {
        await supabase.from('banners').insert(payload);
      }
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحفظ. / Error saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (banId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البانر؟ / Confirm delete banner?')) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', banId);
      if (!error) {
        setBanners((prev) => prev.filter((item) => item.id !== banId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('admin.banners')}
        </h1>
        <button onClick={openAddModal} className="btn btn-secondary" style={{ gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <PlusCircle size={16} />
          إضافة بانر جديد
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '180px', width: '100%' }}></div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                <th style={{ padding: '1rem' }}>الصورة</th>
                <th style={{ padding: '1rem' }}>العنوان بالعربية</th>
                <th style={{ padding: '1rem' }}>الحالة</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>الخيارات</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((ban) => (
                <tr key={ban.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem 1rem' }}>
                    <img src={ban.image_url} alt="slide preview" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{ban.title_ar}</td>
                  <td style={{ padding: '1rem' }}>
                    {ban.is_active ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>نشط</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>مخفي</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button onClick={() => openEditModal(ban)} className="action-btn" title="Edit"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteBanner(ban.id)} className="action-btn" title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BANNER EDIT MODAL */}
      {showModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--surface-color)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{editingBanner ? 'تعديل البانر الإعلاني' : 'إضافة بانر إعلاني جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="action-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">العنوان الرئيسي (عربي) *</label>
                <input type="text" className="form-input" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">العنوان الرئيسي (إنجليزي) *</label>
                <input type="text" className="form-input" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">العنوان الفرعي (عربي)</label>
                <input type="text" className="form-input" value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">العنوان الفرعي (إنجليزي)</label>
                <input type="text" className="form-input" value={subtitleEn} onChange={(e) => setSubtitleEn(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">خلفية البانر *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="رابط الصورة أو اختر ملفاً..."
                  />
                  <label className="btn btn-outline" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 0, display: 'inline-flex', alignItems: 'center' }}>
                    {uploadingImage ? 'جاري الرفع...' : 'اختر ملف'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">رابط التوجيه (Link URL)</label>
                <input type="text" className="form-input" placeholder="/subject/dental-anatomy" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: 'var(--secondary)' }} />
                <strong>تفعيل البانر بالصفحة الرئيسية</strong>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('admin.cancel')}</button>
                <button type="submit" disabled={submitting} className="btn btn-secondary">{submitting ? 'جاري الحفظ...' : t('admin.save')}</button>
              </div>

            </form>
          </div>
        </div>
      , document.body)}

    </div>
  );
};

export default Banners;
