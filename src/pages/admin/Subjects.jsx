import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { Plus, Edit, Trash2, X, PlusCircle } from 'lucide-react';

export const Subjects = () => {
  const { t } = useLanguage();

  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Forms State
  const [activeTab, setActiveTab] = useState('subjects');
  const [editingSubject, setEditingSubject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingYear, setEditingYear] = useState(null);
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearNameAr, setYearNameAr] = useState('');
  const [yearNameEn, setYearNameEn] = useState('');
  const [yearImageUrl, setYearImageUrl] = useState('');
  const [uploadingYearImg, setUploadingYearImg] = useState(false);

  // Form fields for subjects
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [slug, setSlug] = useState('');
  const [yearId, setYearId] = useState('');

  // Image upload helpers for Year backgrounds
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 500;
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
      const filePath = `years/${fileName}`;

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

  const handleYearImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingYearImg(true);
    const url = await uploadFile(file);
    setYearImageUrl(url);
    setUploadingYearImg(false);
  };

  const openEditYearModal = (y) => {
    setEditingYear(y);
    setYearNameAr(y.name_ar || '');
    setYearNameEn(y.name_en || '');
    setYearImageUrl(y.image_url || '');
    setShowYearModal(true);
  };

  const handleYearFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name_ar: yearNameAr.trim(),
      name_en: yearNameEn.trim(),
      image_url: yearImageUrl.trim()
    };
    try {
      const { error } = await supabase.from('years').update(payload).eq('id', editingYear.id);
      if (error) throw error;
      setShowYearModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحفظ. / Error saving.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: yrs } = await supabase.from('years').select('*').order('slug', { ascending: true });
      if (yrs) setYears(yrs);

      const { data: subs } = await supabase.from('subjects').select('*, years(*)').order('created_at', { ascending: false });
      if (subs) setSubjects(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setNameAr('');
    setNameEn('');
    setDescAr('');
    setDescEn('');
    setSlug('');
    setYearId(years.length > 0 ? years[0].id : '');
    setShowModal(true);
  };

  const openEditModal = (sub) => {
    setEditingSubject(sub);
    setNameAr(sub.name_ar || '');
    setNameEn(sub.name_en || '');
    setDescAr(sub.description_ar || '');
    setDescEn(sub.description_en || '');
    setSlug(sub.slug || '');
    setYearId(sub.year_id || '');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name_ar: nameAr.trim(),
      name_en: nameEn.trim(),
      description_ar: descAr.trim(),
      description_en: descEn.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      year_id: yearId
    };

    try {
      if (editingSubject) {
        // Update
        await supabase.from('subjects').update(payload).eq('id', editingSubject.id);
      } else {
        // Insert
        await supabase.from('subjects').insert(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحفظ. / Error saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المادة نهائياً؟ سيتم إلغاء ربط جميع منتجاتها. / Confirm delete?')) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subId);
      if (!error) {
        setSubjects((prev) => prev.filter((item) => item.id !== subId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Header Tab Bar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.2rem' }}>
        <button
          onClick={() => setActiveTab('subjects')}
          style={{
            padding: '0.6rem 1.2rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            borderBottom: activeTab === 'subjects' ? '3px solid var(--secondary)' : 'none',
            color: activeTab === 'subjects' ? 'var(--secondary)' : 'var(--text-muted)'
          }}
        >
          المواد الدراسية / Subjects
        </button>
        <button
          onClick={() => setActiveTab('years')}
          style={{
            padding: '0.6rem 1.2rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            borderBottom: activeTab === 'years' ? '3px solid var(--secondary)' : 'none',
            color: activeTab === 'years' ? 'var(--secondary)' : 'var(--text-muted)'
          }}
        >
          السنوات الدراسية / Academic Years
        </button>
      </div>

      {activeTab === 'subjects' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              إدارة المواد الدراسية / Manage Subjects
            </h1>
            <button onClick={openAddModal} className="btn btn-secondary" style={{ gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <PlusCircle size={16} />
              إضافة مادة جديدة
            </button>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
          ) : (
            <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                    <th style={{ padding: '1rem' }}>اسم المادة بالعربية</th>
                    <th style={{ padding: '1rem' }}>اسم المادة بالإنجليزية</th>
                    <th style={{ padding: '1rem' }}>السنة الدراسية</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>الخيارات</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{sub.name_ar}</td>
                      <td style={{ padding: '1rem' }}>{sub.name_en}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{sub.years?.name_ar || sub.years?.name_en}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button onClick={() => openEditModal(sub)} className="action-btn" title="Edit"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteSubject(sub.id)} className="action-btn" title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              إدارة السنوات الدراسية / Manage Years
            </h1>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
          ) : (
            <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                    <th style={{ padding: '1rem' }}>الخلفية</th>
                    <th style={{ padding: '1rem' }}>السنة (عربي)</th>
                    <th style={{ padding: '1rem' }}>السنة (إنجليزي)</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>الخيارات</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        {y.image_url ? (
                          <img src={y.image_url} alt="bg" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>لا توجد صورة</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{y.name_ar}</td>
                      <td style={{ padding: '1rem' }}>{y.name_en}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button onClick={() => openEditYearModal(y)} className="action-btn" title="Edit"><Edit size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* SUBJECT EDIT MODAL */}
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{editingSubject ? 'تعديل بيانات المادة' : 'إضافة مادة دراسية جديدة'}</h3>
              <button onClick={() => setShowModal(false)} className="action-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الاسم بالعربية *</label>
                <input type="text" className="form-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الاسم بالإنجليزية *</label>
                <input type="text" className="form-input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الرابط الفريد (Slug) *</label>
                <input type="text" className="form-input" placeholder="dental-anatomy" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">السنة الدراسية المرتبطة *</label>
                <select className="form-input" value={yearId} onChange={(e) => setYearId(e.target.value)}>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">شرح بسيط بالعربية</label>
                <textarea className="form-input" rows="2" value={descAr} onChange={(e) => setDescAr(e.target.value)} style={{ resize: 'none' }} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">شرح بسيط بالإنجليزية</label>
                <textarea className="form-input" rows="2" value={descEn} onChange={(e) => setDescEn(e.target.value)} style={{ resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('admin.cancel')}</button>
                <button type="submit" disabled={submitting} className="btn btn-secondary">{submitting ? 'جاري الحفظ...' : t('admin.save')}</button>
              </div>

            </form>
          </div>
        </div>
      , document.body)}

      {/* YEAR EDIT MODAL */}
      {showYearModal && createPortal(
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>تعديل بيانات السنة الدراسية</h3>
              <button onClick={() => setShowYearModal(false)} className="action-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleYearFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الاسم بالعربية *</label>
                <input type="text" className="form-input" value={yearNameAr} onChange={(e) => setYearNameAr(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الاسم بالإنجليزية *</label>
                <input type="text" className="form-input" value={yearNameEn} onChange={(e) => setYearNameEn(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">خلفية السنة الدراسية</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={yearImageUrl}
                    onChange={(e) => setYearImageUrl(e.target.value)}
                    placeholder="رابط الصورة أو اختر ملفاً..."
                  />
                  <label className="btn btn-outline" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 0, display: 'inline-flex', alignItems: 'center' }}>
                    {uploadingYearImg ? 'جاري الرفع...' : 'اختر ملف'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleYearImageChange} disabled={uploadingYearImg} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowYearModal(false)} className="btn btn-outline">{t('admin.cancel')}</button>
                <button type="submit" disabled={submitting} className="btn btn-secondary">{submitting ? 'جاري الحفظ...' : t('admin.save')}</button>
              </div>

            </form>
          </div>
        </div>
      , document.body)}

    </div>
  );
};

export default Subjects;
