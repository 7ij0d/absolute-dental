import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { Plus, Edit, Trash2, Archive, Check, X, FileEdit, PlusCircle, Search } from 'lucide-react';

export const Products = () => {
  const { t, lang } = useLanguage();

  const [products, setProducts] = useState([]);
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingProduct, setEditingProduct] = useState(null); // null if adding new
  const [showFormModal, setShowFormModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Field States
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [detailsAr, setDetailsAr] = useState('');
  const [detailsEn, setDetailsEn] = useState('');
  const [price, setPrice] = useState(0);
  const [comparePrice, setComparePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState(10);
  const [availability, setAvailability] = useState('available');
  const [yearId, setYearId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]); // multi-subject
  const [subjectId, setSubjectId] = useState(''); // kept for backward compat (primary)
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [extraImageUrls, setExtraImageUrls] = useState([]);
  const [usageVideoUrl, setUsageVideoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  // Audio recording/upload states
  const [audioUrl, setAudioUrl] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState('');

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
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
      const filePath = `products/${fileName}`;

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

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMain(true);
    const url = await uploadFile(file);
    setMainImageUrl(url);
    setUploadingMain(false);
  };

  const handleExtraImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingExtra(true);
    const urls = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    setExtraImageUrls((prev) => [...prev, ...urls]);
    setUploadingExtra(false);
  };

  const uploadAudioFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `audios/${fileName}`;

      const { data, error } = await supabase.storage
        .from('smylodent-assets')
        .upload(filePath, file, { contentType: file.type });

      if (error) {
        console.warn('Storage upload failed, trying to read as dataURL', error);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => resolve(e.target.result);
        });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('smylodent-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Audio upload error:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => resolve(e.target.result);
      });
    }
  };

  const handleAudioFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAudio(true);
    const url = await uploadAudioFile(file);
    if (url) {
      setAudioUrl(url);
    }
    setUploadingAudio(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        const blobUrl = URL.createObjectURL(blob);
        setRecordedBlobUrl(blobUrl);
        setAudioChunks(chunks);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setAudioChunks([]);
      setRecordedBlobUrl('');
    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert(lang === 'ar' ? 'فشل الوصول إلى الميكروفون. يرجى تفعيل الصلاحيات.' : 'Microphone access failed. Please enable permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const handleUploadRecordedAudio = async () => {
    if (audioChunks.length === 0) return;
    setUploadingAudio(true);
    try {
      const blob = new Blob(audioChunks, { type: 'audio/mp3' });
      const file = new File([blob], `audio-record-${Date.now()}.mp3`, { type: 'audio/mp3' });
      const url = await uploadAudioFile(file);
      if (url) {
        setAudioUrl(url);
        setRecordedBlobUrl('');
        setAudioChunks([]);
        alert(lang === 'ar' ? 'تم حفظ التسجيل الصوتي بنجاح!' : 'Audio recording saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload recorded audio');
    } finally {
      setUploadingAudio(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load products (all, including archived and inactive)
      const { data: prods } = await supabase
        .from('products')
        .select(`
          *,
          years (*),
          subjects!products_subject_id_fkey (*),
          product_subjects (
            subject_id,
            subjects!product_subjects_subject_id_fkey (id, name_ar, name_en, slug)
          )
        `)
        .order('created_at', { ascending: false });
      if (prods) setProducts(prods);

      // Load years and subjects for form dropdown selectors
      const { data: yrs } = await supabase.from('years').select('*');
      if (yrs) setYears(yrs);

      const { data: subs } = await supabase.from('subjects').select('*');
      if (subs) setSubjects(subs);

    } catch (err) {
      console.error('Error fetching admin product catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNameAr('');
    setNameEn('');
    setDescriptionAr('');
    setDescriptionEn('');
    setDetailsAr('');
    setDetailsEn('');
    setPrice(0);
    setComparePrice('');
    setStockQuantity(10);
    setAvailability('available');
    setYearId(years.length > 0 ? years[0].id : '');
    setSubjectId('');
    setSelectedSubjectIds([]);
    setMainImageUrl('');
    setExtraImageUrls([]);
    setUsageVideoUrl('');
    setIsFeatured(false);
    setIsActive(true);
    setAudioUrl('');
    setRecordedBlobUrl('');
    setAudioChunks([]);
    setShowFormModal(true);
  };

  const openEditModal = async (prod) => {
    setEditingProduct(prod);
    setNameAr(prod.name_ar || '');
    setNameEn(prod.name_en || '');
    setDescriptionAr(prod.description_ar || '');
    setDescriptionEn(prod.description_en || '');
    setDetailsAr(prod.details_ar || '');
    setDetailsEn(prod.details_en || '');
    setPrice(prod.price || 0);
    setComparePrice(prod.compare_at_price || '');
    setStockQuantity(prod.stock_quantity || 0);
    setAvailability(prod.availability || 'available');
    setYearId(prod.year_id || '');
    setSubjectId(prod.subject_id || '');

    // Fetch assigned subjects from junction table
    const { data: ps } = await supabase
      .from('product_subjects')
      .select('subject_id')
      .eq('product_id', prod.id);
    setSelectedSubjectIds(ps ? ps.map(r => r.subject_id) : (prod.subject_id ? [prod.subject_id] : []));

    setMainImageUrl(prod.image_url || '');
    setUsageVideoUrl(prod.usage_video_url || '');
    setIsFeatured(prod.is_featured || false);
    setIsActive(prod.is_active !== false);
    setAudioUrl(prod.audio_url || '');
    setRecordedBlobUrl('');
    setAudioChunks([]);

    // Fetch extra images
    const { data: extraImgs } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', prod.id)
      .order('sort_order', { ascending: true });
    
    if (extraImgs) {
      setExtraImageUrls(extraImgs.map((img) => img.image_url));
    } else {
      setExtraImageUrls([]);
    }

    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const nameArTrimmed = nameAr.trim();

    // Check name is provided
    if (!nameArTrimmed) {
      alert('يجب إدخال اسم المنتج!');
      return;
    }

    setSubmitting(true);

    const productPayload = {
      name_ar: nameArTrimmed,
      name_en: nameArTrimmed,
      description_ar: descriptionAr.trim() || null,
      description_en: descriptionEn.trim() || null,
      details_ar: detailsAr.trim() || null,
      details_en: detailsEn.trim() || null,
      price: parseFloat(price),
      compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
      stock_quantity: stockQuantity !== '' ? parseInt(stockQuantity) : 0,
      availability,
      year_id: yearId || null,
      subject_id: selectedSubjectIds[0] || null, // primary subject for backward compat
      image_url: mainImageUrl.trim(),
      usage_video_url: usageVideoUrl.trim() || null,
      audio_url: audioUrl.trim() || null,
      is_featured: isFeatured,
      is_active: isActive
    };

    try {
      let productId = null;

      if (editingProduct) {
        // Edit existing product
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        productId = editingProduct.id;
      } else {
        // Add new product
        const { data, error } = await supabase
          .from('products')
          .insert({ ...productPayload, is_archived: false })
          .select()
          .single();
        
        if (error) throw error;
        productId = data.id;
      }

      // Save multi-subject links in junction table
      if (productId) {
        await supabase.from('product_subjects').delete().eq('product_id', productId);
        if (selectedSubjectIds.length > 0) {
          await supabase.from('product_subjects').insert(
            selectedSubjectIds.map(sid => ({ product_id: productId, subject_id: sid }))
          );
        }
      }

      // Add supplementary images
      if (productId) {
        // Clear old ones first
        await supabase.from('product_images').delete().eq('product_id', productId);
        
        const extraUrls = extraImageUrls.filter(Boolean);

        if (extraUrls.length > 0) {
          const insertPayload = extraUrls.map((url, index) => ({
            product_id: productId,
            image_url: url,
            sort_order: index
          }));
          await supabase.from('product_images').insert(insertPayload);
        }
      }

      setShowFormModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التغييرات / Error saving product:\n' + (err.message || err.details || JSON.stringify(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (prod) => {
    const nextArchiveState = !prod.is_archived;
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: nextArchiveState })
        .eq('id', prod.id);
      
      if (!error) {
        setProducts((prev) =>
          prev.map((item) => (item.id === prod.id ? { ...item, is_archived: nextArchiveState } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟ / Confirm permanent delete?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', prodId);
      if (!error) {
        setProducts((prev) => prev.filter((item) => item.id !== prodId));
      } else {
        alert('لا يمكن حذف المنتج لأنه مرتبط بطلبات سابقة، يمكنك أرشفتة بدلاً من ذلك. / Cannot delete, product linked to orders. Try archiving.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products by year selection inside form
  const filteredSubjects = subjects.filter((sub) => sub.year_id === yearId);

  // Filter main products list by search query
  const getFilteredProducts = () => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name_ar.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q)
    );
  };

  const filteredList = getFilteredProducts();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('admin.products')}
        </h1>
        <button onClick={openAddModal} className="btn btn-secondary" style={{ gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <PlusCircle size={16} />
          {t('admin.add_new')}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="ابحث بالاسم عن أداة طبية..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
      </div>

      {/* Table list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
          <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-color)' }}>
          لا توجد منتجات مسجلة بالموقع حالياً.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                <th style={{ padding: '1rem 0.75rem' }}>الصورة</th>
                <th style={{ padding: '1rem 0.75rem' }}>الاسم بالعربية</th>
                <th style={{ padding: '1rem 0.75rem' }}>السعر</th>
                <th style={{ padding: '1rem 0.75rem' }}>المخزن</th>
                <th style={{ padding: '1rem 0.75rem' }}>الحالة</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>الخيارات</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: prod.is_archived ? 0.6 : 1 }}>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <img src={prod.image_url} alt="thumbnail" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <p style={{ fontWeight: 700 }}>{prod.name_ar}</p>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800 }}>{prod.price} د.ل</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>{prod.stock_quantity}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {prod.is_archived ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>أرشيف</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>نشط</span>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button onClick={() => openEditModal(prod)} className="action-btn" title="Edit"><Edit size={14} /></button>
                      <button onClick={() => handleToggleArchive(prod)} className="action-btn" title={prod.is_archived ? "Unarchive" : "Archive"} style={{ color: 'var(--secondary)' }}><Archive size={14} /></button>
                      <button onClick={() => handleDeleteProduct(prod.id)} className="action-btn" title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* -------------------------------------------------------------
          ADD / EDIT PRODUCT FORM MODAL
          ------------------------------------------------------------- */}
      {showFormModal && createPortal(
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
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--surface-color)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingProduct ? 'تعديل بيانات المنتج / Edit Product' : 'إضافة منتج جديد / Add Product'}</h3>
              <button onClick={() => setShowFormModal(false)} className="action-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label">اسم المنتج</label>
                <input type="text" className="form-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="اكتب اسم المنتج..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="modal-form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.price')} (د.ل) *</label>
                  <input type="number" step="0.1" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.compare_price')} (د.ل)</label>
                  <input type="number" step="0.1" className="form-input" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="modal-form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.stock')}</label>
                  <input type="number" className="form-input" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="0" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('subject.filter_availability')} *</label>
                  <select className="form-input" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                    <option value="available">متوفر / Available</option>
                    <option value="limited_quantity">كمية محدودة / Limited Qty</option>
                    <option value="coming_soon">قريباً / Coming Soon</option>
                    <option value="unavailable">غير متوفر / Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('admin.year')}</label>
                <select className="form-input" value={yearId} onChange={(e) => setYearId(e.target.value)}>
                  <option value="">اختر السنة الدراسية</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name_ar}</option>
                  ))}
                </select>
              </div>

              {/* Multi-subject checkboxes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">المواد الدراسية (يمكن اختيار أكثر من مادة)</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)'
                }}>
                  {subjects.map((s) => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: selectedSubjectIds.includes(s.id) ? 700 : 400 }}>
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjectIds(prev => [...prev, s.id]);
                          } else {
                            setSelectedSubjectIds(prev => prev.filter(id => id !== s.id));
                          }
                        }}
                        style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                      />
                      {s.name_ar}
                    </label>
                  ))}
                  {subjects.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>لا توجد مواد</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الصورة الرئيسية للمنتج *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={mainImageUrl}
                    onChange={(e) => setMainImageUrl(e.target.value)}
                    placeholder="رابط الصورة أو اختر ملفاً..."
                  />
                  <label className="btn btn-outline" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 0, display: 'inline-flex', alignItems: 'center' }}>
                    {uploadingMain ? 'جاري الرفع...' : 'اختر ملف'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMainImageChange} disabled={uploadingMain} />
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>صور إضافية للمنتج / Supplementary Images</label>
                  <label className="btn btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    {uploadingExtra ? 'جاري الرفع...' : 'رفع صور إضافية'}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleExtraImagesChange} disabled={uploadingExtra} />
                  </label>
                </div>
                
                {extraImageUrls.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', border: '1px dashed var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    {extraImageUrls.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={url} alt={`extra-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setExtraImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            backgroundColor: 'rgba(239, 68, 68, 0.85)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1
                          }}
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    لم يتم رفع أي صور إضافية لهذا المنتج بعد.
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('admin.video_url')}</label>
                <input type="url" className="form-input" value={usageVideoUrl} onChange={(e) => setUsageVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/XXXX" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>التسجيل الصوتي التوضيحي للمنتج / Audio Explanation (Optional)</span>
                  {audioUrl && (
                    <button
                      type="button"
                      onClick={() => setAudioUrl('')}
                      style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      حذف التسجيل الصوتي / Delete Audio
                    </button>
                  )}
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent)' }}>
                  
                  {/* Current Active Audio Preview */}
                  {audioUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>🎧 التسجيل الحالي / Active Audio:</span>
                      <audio src={audioUrl} controls style={{ width: '100%', height: '40px' }} />
                    </div>
                  )}

                  {/* Audio Controls (Record / Upload File) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    
                    {/* Native File Upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="رابط التسجيل الصوتي أو اختر/سجل ملفاً..."
                        style={{ fontSize: '0.85rem' }}
                      />
                      <label className="btn btn-outline" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 0, display: 'inline-flex', alignItems: 'center' }}>
                        {uploadingAudio ? 'جاري الرفع...' : 'رفع ملف صوتي'}
                        <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioFileChange} disabled={uploadingAudio} />
                      </label>
                    </div>

                    {/* Microphone Recorder Panel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {!recording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="btn btn-outline"
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '0.65rem 1rem', fontSize: '0.85rem', gap: '0.3rem', display: 'flex', alignItems: 'center' }}
                        >
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)', animation: 'pulse-smile 1s infinite' }}></span>
                          تسجيل صوتي مباشر
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="btn btn-secondary"
                          style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                        >
                          إيقاف التسجيل ⏹️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recorded Audio Preview before Uploading */}
                  {recordedBlobUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>🎙️ معاينة التسجيل الجديد / Preview:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <audio src={recordedBlobUrl} controls style={{ flexGrow: 1, height: '40px' }} />
                        <button
                          type="button"
                          onClick={handleUploadRecordedAudio}
                          disabled={uploadingAudio}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          {uploadingAudio ? 'جاري الحفظ...' : 'حفظ ومزامنة التسجيل'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecordedBlobUrl(''); setAudioChunks([]); }}
                          className="btn btn-outline"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'var(--border-color)' }}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }} className="modal-form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.description_ar')}</label>
                  <textarea className="form-input" rows="2" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} style={{ resize: 'none' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.description_en')}</label>
                  <textarea className="form-input" rows="2" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} style={{ resize: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }} className="modal-form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.details_ar')}</label>
                  <textarea className="form-input" rows="3" value={detailsAr} onChange={(e) => setDetailsAr(e.target.value)} placeholder="• مصنوع من الفولاذ&#10;• مقبض ملون" style={{ resize: 'none' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.details_en')}</label>
                  <textarea className="form-input" rows="3" value={detailsEn} onChange={(e) => setDetailsEn(e.target.value)} placeholder="• Stainless steel&#10;• Anodized handle" style={{ resize: 'none' }} />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ accentColor: 'var(--secondary)' }} />
                  <strong>منتج مميز (أكثر طلباً)</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: 'var(--secondary)' }} />
                  <strong>متاح للعرض بالمتجر</strong>
                </label>
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-outline">{t('admin.cancel')}</button>
                <button type="submit" disabled={submitting} className="btn btn-secondary">{submitting ? 'جاري الحفظ...' : t('admin.save')}</button>
              </div>

            </form>
          </div>
        </div>
      , document.body)}

      <style>{`
        @media (max-width: 768px) {
          .modal-form-row {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Products;
