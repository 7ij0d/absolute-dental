import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { uploadProductImageToStorage } from '../../utils/storageImage';
import { clearSubjectCaches } from '../../cache';
import {
  isBundleProduct,
  calculateBundleAvailability,
  CANONICAL_MULTI_UNITS,
  getPhysicalStockBreakdown
} from '../../utils/productInventoryEngine';
import { Plus, Edit, Trash2, Archive, Check, X, FileEdit, PlusCircle, Search, Layers, Globe, Sparkles, BookOpen, AlertCircle, Info } from 'lucide-react';

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
  const [unitMultiplier, setUnitMultiplier] = useState(1);
  const [sharedInventoryProductId, setSharedInventoryProductId] = useState('');
  const [isUniversal, setIsUniversal] = useState(false);
  const [subjectSelectionMode, setSubjectSelectionMode] = useState('custom'); // 'all' or 'custom'
  const [subjectSearchInModal, setSubjectSearchInModal] = useState('');

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

  // Live calculation of product classification
  const classificationMeta = useMemo(() => {
    if (subjectSelectionMode === 'all') {
      return {
        type: 'universal',
        labelAr: 'مستلزم عام (Universal Supplies)',
        labelEn: 'Universal Supplies',
        badgeColor: '#059669',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        badgeBorder: 'rgba(16, 185, 129, 0.3)',
        icon: '🌐',
        sectionAr: 'قسم «مستلزمات مشتركة بين جميع السنوات»',
        descriptionAr: 'سيظهر المنتج تلقائياً في قسم المستلزمات العامة داخل صفحات كافة المواد والسنوات الدراسية (مثل: Gloves, Face Mask, Cover Sheet).'
      };
    }
    if (selectedSubjectIds.length === 1) {
      const sub = subjects.find(s => s.id === selectedSubjectIds[0]);
      const subName = sub ? sub.name_ar : 'المادة المحددة';
      return {
        type: 'specific',
        labelAr: 'منتج خاص بالمادة (Subject-Specific)',
        labelEn: 'Subject-Specific Tool',
        badgeColor: 'var(--secondary)',
        badgeBg: 'rgba(128, 0, 32, 0.08)',
        badgeBorder: 'rgba(128, 0, 32, 0.25)',
        icon: '📌',
        sectionAr: `«القسم الرئيسي للأدوات الخاصة» داخل صفحة [${subName}] فقط`,
        descriptionAr: `سيظهر المنتج في القسم الأساسي الخاص بمادة ${subName} فقط، ولن يظهر في قسم الأدوات المشتركة أو أي مادة أخرى.`
      };
    }
    if (selectedSubjectIds.length >= 2) {
      const selectedNames = selectedSubjectIds
        .map(id => subjects.find(s => s.id === id)?.name_ar)
        .filter(Boolean)
        .join(' و ');
      return {
        type: 'shared',
        labelAr: `منتج مشترك بين المواد (Shared Across ${selectedSubjectIds.length} Subjects)`,
        labelEn: `Shared Across ${selectedSubjectIds.length} Subjects`,
        badgeColor: '#0E7490',
        badgeBg: 'rgba(14, 116, 144, 0.12)',
        badgeBorder: 'rgba(14, 116, 144, 0.3)',
        icon: '🔄',
        sectionAr: `قسم «أدوات مشتركة بين المواد» داخل صفحات المواد المحددة فقط (${selectedSubjectIds.length} مواد)`,
        descriptionAr: `سيظهر المنتج تلقائياً في قسم الأدوات المشتركة داخل (${selectedNames})، ولن يظهر في القسم الرئيسي الخاص بأي منها أو في أي مادة غير محددة.`
      };
    }
    return {
      type: 'none',
      labelAr: 'غير مصنف (يرجى التحديد)',
      labelEn: 'Unclassified',
      badgeColor: '#D97706',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      icon: '⚠️',
      sectionAr: 'لم يتم تحديد مكان الظهور بعد',
      descriptionAr: 'يرجى تحديد مادة دراسية واحدة على الأقل أو تفعيل خيار «جميع المواد» ليتم تصنيف المنتج تلقائياً.'
    };
  }, [subjectSelectionMode, selectedSubjectIds, subjects]);

  // Group subjects by academic year for organized multi-select UI
  const groupedSubjects = useMemo(() => {
    const groups = [];
    const query = (subjectSearchInModal || '').trim().toLowerCase();
    const sortedYears = [...years].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    sortedYears.forEach(year => {
      let yearSubs = subjects.filter(s => String(s.year_id) === String(year.id));
      if (query) {
        yearSubs = yearSubs.filter(s => 
          (s.name_ar || '').toLowerCase().includes(query) ||
          (s.name_en || '').toLowerCase().includes(query)
        );
      }
      if (yearSubs.length > 0) {
        groups.push({
          year,
          subjects: yearSubs
        });
      }
    });

    let otherSubs = subjects.filter(s => !s.year_id || !years.some(y => String(y.id) === String(s.year_id)));
    if (query) {
      otherSubs = otherSubs.filter(s => 
        (s.name_ar || '').toLowerCase().includes(query) ||
        (s.name_en || '').toLowerCase().includes(query)
      );
    }
    if (otherSubs.length > 0) {
      groups.push({
        year: { id: 'other', name_ar: 'مواد عامة / أخرى', name_en: 'Other Subjects' },
        subjects: otherSubs
      });
    }

    return groups;
  }, [subjects, years, subjectSearchInModal]);

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
      return await uploadProductImageToStorage(file);
    } catch (err) {
      console.error('Supabase Storage upload error:', err);
      alert(lang === 'ar' ? `فشل رفع الصورة إلى السحابة: ${err.message}` : `Failed to upload image to Storage: ${err.message}`);
      return '';
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
      let loadedProds = null;

      // 1. Try comprehensive query with properly qualified joins
      const { data: prods, error: prodErr } = await supabase
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

      if (!prodErr && Array.isArray(prods)) {
        loadedProds = prods;
      } else {
        console.warn('Primary products query error, attempting secondary fallback:', prodErr);
        // 2. Secondary fallback with direct foreign key relations
        const { data: fallbackProds, error: fbErr } = await supabase
          .from('products')
          .select('*, years(*), subjects!products_subject_id_fkey(*)')
          .order('created_at', { ascending: false });

        if (!fbErr && Array.isArray(fallbackProds)) {
          loadedProds = fallbackProds;
        } else {
          console.warn('Secondary fallback error, attempting base select:', fbErr);
          // 3. Guaranteed base query fallback
          const { data: baseProds } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (Array.isArray(baseProds)) loadedProds = baseProds;
        }
      }

      if (loadedProds) {
        setProducts(loadedProds);
      }

      // Load years and subjects for form dropdown selectors
      const { data: yrs } = await supabase.from('years').select('*').order('slug');
      if (yrs) setYears(yrs);

      const { data: subs } = await supabase.from('subjects').select('*').order('slug');
      if (subs) setSubjects(subs);

    } catch (err) {
      console.error('Error fetching admin product catalog', err);
      try {
        const { data: fallbackProds } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (fallbackProds) setProducts(fallbackProds);
      } catch (_) {}
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
    setSubjectSelectionMode('custom');
    setSubjectSearchInModal('');
    setIsUniversal(false);
    setMainImageUrl('');
    setExtraImageUrls([]);
    setUsageVideoUrl('');
    setIsFeatured(false);
    setIsActive(true);
    setUnitMultiplier(1);
    setSharedInventoryProductId('');
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

    const isUniv = Boolean(prod.discount_label_en === 'universal' || prod.all_subjects === true || prod.is_universal === true);
    setIsUniversal(isUniv);
    setSubjectSelectionMode(isUniv ? 'all' : 'custom');
    setSubjectSearchInModal('');

    // Fetch assigned subjects from junction table
    const { data: ps } = await supabase
      .from('product_subjects')
      .select('subject_id')
      .eq('product_id', prod.id);

    let initialSubjectIds = [];
    if (ps && ps.length > 0) {
      initialSubjectIds = ps.map(r => r.subject_id);
    } else if (Array.isArray(prod.product_subjects) && prod.product_subjects.length > 0) {
      initialSubjectIds = prod.product_subjects.map(r => r.subject_id);
    } else {
      const sIds = new Set();
      if (prod.subject_id) sIds.add(prod.subject_id);
      if (Array.isArray(prod.extra_subject_ids)) prod.extra_subject_ids.forEach(id => sIds.add(id));
      initialSubjectIds = Array.from(sIds);
    }
    setSelectedSubjectIds(initialSubjectIds);

    setMainImageUrl(prod.image_url || '');
    setUsageVideoUrl(prod.usage_video_url || '');
    setIsFeatured(prod.is_featured || false);
    setIsActive(prod.is_active !== false);
    setUnitMultiplier(prod.unit_multiplier || 1);
    setSharedInventoryProductId(prod.shared_inventory_product_id || '');
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
      alert(lang === 'ar' ? 'يجب إدخال اسم المنتج!' : 'Product name is required!');
      return;
    }

    const isUniv = subjectSelectionMode === 'all';

    if (!isUniv && selectedSubjectIds.length === 0) {
      alert(lang === 'ar' ? 'يرجى تحديد مادة دراسية واحدة على الأقل أو اختيار «جميع المواد»!' : 'Please select at least one subject or choose "All Subjects"!');
      return;
    }

    setSubmitting(true);

    const primarySubjectId = isUniv ? null : (selectedSubjectIds[0] || null);
    const primarySubObj = subjects.find(s => s.id === primarySubjectId);
    const resolvedYearId = isUniv ? null : (primarySubObj?.year_id || yearId || null);

    const productPayload = {
      name_ar: nameArTrimmed,
      name_en: nameArTrimmed,
      description_ar: descriptionAr.trim() || null,
      description_en: descriptionEn.trim() || null,
      details_ar: detailsAr.trim() || null,
      details_en: detailsEn.trim() || null,
      price: parseFloat(price) || 0,
      compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
      stock_quantity: stockQuantity !== '' ? parseInt(stockQuantity) : 0,
      availability,
      year_id: resolvedYearId,
      subject_id: primarySubjectId,
      discount_label_en: isUniv ? 'universal' : (editingProduct?.discount_label_en === 'universal' ? null : (editingProduct?.discount_label_en || null)),
      image_url: mainImageUrl.trim(),
      usage_video_url: usageVideoUrl.trim() || null,
      audio_url: audioUrl.trim() || null,
      is_featured: isFeatured,
      is_active: isActive,
      unit_multiplier: parseInt(unitMultiplier) || 1,
      shared_inventory_product_id: sharedInventoryProductId || null,
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
        if (isUniv) {
          // If universal, link to all active subjects so relational joins find it everywhere
          if (subjects.length > 0) {
            await supabase.from('product_subjects').insert(
              subjects.map(s => ({ product_id: productId, subject_id: s.id }))
            );
          }
        } else if (selectedSubjectIds.length > 0) {
          await supabase.from('product_subjects').insert(
            selectedSubjectIds.map(sid => ({ product_id: productId, subject_id: sid }))
          );
        }
      }

      // Add supplementary images
      if (productId) {
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

      // Invalidate subject caches so storefront updates immediately
      clearSubjectCaches();

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
                    <p style={{ fontWeight: 700, margin: 0 }}>{prod.name_ar}</p>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                      {(prod.discount_label_en === 'universal' || prod.all_subjects || prod.is_universal) ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#047857', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          🌐 {lang === 'ar' ? 'مستلزمات عامة (كل السنوات)' : 'Universal Supplies'}
                        </span>
                      ) : ((Array.isArray(prod.product_subjects) && prod.product_subjects.length > 1) || (Array.isArray(prod.extra_subject_ids) && prod.extra_subject_ids.length > 0)) ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', backgroundColor: 'rgba(14, 116, 144, 0.12)', color: '#0E7490', borderRadius: '4px', border: '1px solid rgba(14, 116, 144, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          🔄 {lang === 'ar' ? `مشتركة (${(prod.product_subjects?.length || (prod.extra_subject_ids?.length + 1))} مواد)` : `Shared (${(prod.product_subjects?.length || (prod.extra_subject_ids?.length + 1))} subjects)`}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', backgroundColor: 'rgba(128, 0, 32, 0.08)', color: 'var(--secondary)', borderRadius: '4px', border: '1px solid rgba(128, 0, 32, 0.18)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          🎯 {lang === 'ar' ? 'خاصة بمادة واحدة' : 'Single Subject'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800 }}>{prod.price} د.ل</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>
                    {isBundleProduct(prod.id) ? (() => {
                      const bundleRes = calculateBundleAvailability(prod.id, products);
                      return (
                        <span
                          style={{ color: bundleRes.isAvailable ? '#059669' : '#DC2626' }}
                          title={`عرض مركب يعتمد على مكوناته: ${bundleRes.componentsStatus.map(c => `${c.nameEn}: ${c.currentStock}`).join(' | ')}`}
                        >
                          🎁 {bundleRes.availableCount} عرض
                        </span>
                      );
                    })() : CANONICAL_MULTI_UNITS[prod.id]?.isBase ? (() => {
                      const breakdown = getPhysicalStockBreakdown(prod, products);
                      return (
                        <span title={`المخزون الأساسي بالقطع: ${prod.stock_quantity}`}>
                          📦 {breakdown ? breakdown.displayAr : `${prod.stock_quantity} قطعة`}
                        </span>
                      );
                    })() : prod.shared_inventory_product_id ? (() => {
                      const master = products.find(p => p.id === prod.shared_inventory_product_id);
                      const mult = prod.unit_multiplier || 1;
                      const effective = master ? Math.floor(master.stock_quantity / mult) : '—';
                      return (
                        <span title={`مرتبط بالمنتج الأساسي: ${master?.name_ar || '?'} (${master?.stock_quantity || 0} قطعة ÷ ${mult})`}>
                          🔗 {effective} علبة
                        </span>
                      );
                    })() : (
                      <span>{prod.stock_quantity}</span>
                    )}
                  </td>
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

              {/* Shared Inventory */}
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: 'rgba(139,92,246,0.06)'
              }}>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', color: 'var(--primary)', fontWeight: 700 }}>
                  🔗 ربط المخزن (للمنتجات المرتبطة مثل البوكس والقطعة)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>ربط بمنتج آخر (المخزن الرئيسي)</label>
                    <select
                      className="form-input"
                      value={sharedInventoryProductId}
                      onChange={(e) => setSharedInventoryProductId(e.target.value)}
                    >
                      <option value="">— بدون ربط —</option>
                      {products
                        .filter(p => !editingProduct || p.id !== editingProduct.id)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name_ar}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>عدد القطع في الوحدة</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={unitMultiplier}
                      onChange={(e) => setUnitMultiplier(e.target.value)}
                      placeholder="1"
                      disabled={!sharedInventoryProductId}
                    />
                  </div>
                </div>
                {sharedInventoryProductId && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                    ✅ كل طلب من هذا المنتج سيطرح <strong>{unitMultiplier}</strong> قطعة من مخزن المنتج المرتبط تلقائياً
                  </p>
                )}
              </div>

              {/* =============================================================
                  SUBJECT SELECTION & AUTOMATIC CLASSIFICATION SYSTEM
                  ============================================================= */}
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.2rem', fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BookOpen size={16} style={{ color: 'var(--secondary)' }} />
                      <span>{lang === 'ar' ? 'المواد الدراسية المرتبط بها المنتج' : 'Subject(s) Associated with Product'} *</span>
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {lang === 'ar'
                        ? 'مادة واحدة = أداة خاصة بالمادة | مادتان فأكثر = أداة مشتركة | جميع المواد = مستلزم عام لكل السنوات'
                        : '1 Subject = Specific Tool | 2+ Subjects = Shared Tool | All Subjects = Universal Supplies'}
                    </p>
                  </div>
                </div>

                {/* Segmented Mode Selector Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {/* Mode Card 1: Specific / Custom Subjects */}
                  <div
                    onClick={() => {
                      setSubjectSelectionMode('custom');
                      setIsUniversal(false);
                    }}
                    style={{
                      border: subjectSelectionMode === 'custom' ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                      backgroundColor: subjectSelectionMode === 'custom' ? 'rgba(128, 0, 32, 0.05)' : 'var(--accent)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: subjectSelectionMode === 'custom' ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(128,0,32,0.1)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: subjectSelectionMode === 'custom' ? '5px solid var(--secondary)' : '2px solid var(--border-color)',
                      backgroundColor: 'var(--surface-color)',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: subjectSelectionMode === 'custom' ? 'var(--secondary)' : 'var(--text-main)' }}>
                        📚 {lang === 'ar' ? 'مواد دراسية محددة' : 'Specific Subjects'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {lang === 'ar' ? 'اختيار مادة واحدة أو عدة مواد' : 'Select one or more subjects'}
                      </div>
                    </div>
                  </div>

                  {/* Mode Card 2: Universal (All Subjects) */}
                  <div
                    onClick={() => {
                      setSubjectSelectionMode('all');
                      setIsUniversal(true);
                    }}
                    style={{
                      border: subjectSelectionMode === 'all' ? '2px solid #059669' : '1px solid var(--border-color)',
                      backgroundColor: subjectSelectionMode === 'all' ? 'rgba(16, 185, 129, 0.08)' : 'var(--accent)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: subjectSelectionMode === 'all' ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(16,185,129,0.15)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: subjectSelectionMode === 'all' ? '5px solid #059669' : '2px solid var(--border-color)',
                      backgroundColor: 'var(--surface-color)',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: subjectSelectionMode === 'all' ? '#047857' : 'var(--text-main)' }}>
                        🌐 {lang === 'ar' ? 'جميع المواد (مستلزم عام)' : 'All Subjects (Universal)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {lang === 'ar' ? 'قفازات، كمامات، كافر شيت لكافة السنوات' : 'Gloves, masks, covers for all years'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content when Universal is selected */}
                {subjectSelectionMode === 'all' && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem'
                  }}>
                    <Globe size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      <strong>{lang === 'ar' ? 'تم اختيار: مستلزم عام لجميع المواد والسنوات' : 'Selected: Universal Supplies'}</strong>
                      <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.45 }}>
                        {lang === 'ar'
                          ? 'سيتم تصنيف هذا المنتج تلقائياً وعرضه في «القسم الثالث: مستلزمات مشتركة بين جميع السنوات» داخل كافة صفحات المواد، مع توحيد المخزون والسعر دون تكرار في النظام.'
                          : 'This product will automatically appear in Section 3 across all subject pages with unified stock and pricing.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Content when Specific / Custom Subjects is selected */}
                {subjectSelectionMode === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Search and Action Toolbar */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={lang === 'ar' ? '🔍 ابحث في المواد الدراسية...' : '🔍 Search subjects...'}
                          value={subjectSearchInModal}
                          onChange={(e) => setSubjectSearchInModal(e.target.value)}
                          style={{ paddingInlineStart: '2.2rem', fontSize: '0.8rem', height: '36px' }}
                        />
                        <Search size={14} style={{ position: 'absolute', insetInlineStart: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectIds(subjects.map(s => s.id))}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', height: '36px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Check size={13} />
                        {lang === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectIds([])}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', height: '36px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <X size={13} />
                        {lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}
                      </button>
                    </div>

                    {/* Selected Subjects Chips */}
                    {selectedSubjectIds.length > 0 && (
                      <div style={{
                        backgroundColor: 'var(--accent)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {lang === 'ar' ? `المواد المحددة (${selectedSubjectIds.length}):` : `Selected Subjects (${selectedSubjectIds.length}):`}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {selectedSubjectIds.map(sid => {
                            const sub = subjects.find(s => s.id === sid);
                            if (!sub) return null;
                            return (
                              <span
                                key={sid}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: 'rgba(128, 0, 32, 0.08)',
                                  border: '1px solid rgba(128, 0, 32, 0.25)',
                                  color: 'var(--secondary)',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                {sub.name_ar}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubjectIds(prev => prev.filter(id => id !== sid))}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: 'var(--danger)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title={lang === 'ar' ? 'إلغاء المادة' : 'Remove subject'}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Grouped Checkboxes by Academic Year */}
                    <div style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent)',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      {groupedSubjects.map((grp) => {
                        const allGroupSelected = grp.subjects.every(s => selectedSubjectIds.includes(s.id));
                        return (
                          <div
                            key={grp.year.id}
                            style={{
                              backgroundColor: 'var(--surface-color)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Academic Year Header with quick toggle */}
                            <div style={{
                              padding: '0.45rem 0.75rem',
                              backgroundColor: 'var(--accent)',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                🎓 {grp.year.name_ar} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({grp.subjects.length} مواد)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (allGroupSelected) {
                                    const grpIds = new Set(grp.subjects.map(s => s.id));
                                    setSelectedSubjectIds(prev => prev.filter(id => !grpIds.has(id)));
                                  } else {
                                    const grpIds = grp.subjects.map(s => s.id);
                                    setSelectedSubjectIds(prev => Array.from(new Set([...prev, ...grpIds])));
                                  }
                                }}
                                className="btn btn-outline"
                                style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', height: 'auto', fontWeight: 600 }}
                              >
                                {allGroupSelected ? (lang === 'ar' ? 'إلغاء مواد السنة' : 'Deselect Year') : (lang === 'ar' ? 'تحديد مواد السنة' : 'Select Year')}
                              </button>
                            </div>

                            {/* Subjects checkboxes in this year */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                              gap: '0.4rem',
                              padding: '0.6rem'
                            }}>
                              {grp.subjects.map((s) => {
                                const isChecked = selectedSubjectIds.includes(s.id);
                                return (
                                  <label
                                    key={s.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.35rem 0.5rem',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: isChecked ? 'rgba(128, 0, 32, 0.05)' : 'transparent',
                                      border: isChecked ? '1px solid rgba(128, 0, 32, 0.25)' : '1px solid transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.82rem',
                                      fontWeight: isChecked ? 700 : 400,
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedSubjectIds(prev => [...prev, s.id]);
                                        } else {
                                          setSelectedSubjectIds(prev => prev.filter(id => id !== s.id));
                                        }
                                      }}
                                      style={{ accentColor: 'var(--secondary)', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span style={{ lineHeight: 1.2 }}>{s.name_ar}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {groupedSubjects.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {lang === 'ar' ? 'لا توجد مواد دراسية مطابقة للبحث' : 'No subjects matched your search'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    LIVE AUTO-CLASSIFICATION PREVIEW CARD
                    ------------------------------------------------------------- */}
                <div style={{
                  border: `1.5px solid ${classificationMeta.badgeBorder}`,
                  backgroundColor: classificationMeta.badgeBg,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{classificationMeta.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {lang === 'ar' ? 'التصنيف التلقائي الذكي للنظام' : 'Automatic System Classification'}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: classificationMeta.badgeColor }}>
                          {classificationMeta.labelAr}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: classificationMeta.badgeColor,
                      color: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                    }}>
                      {classificationMeta.type === 'universal' ? (lang === 'ar' ? 'القسم الثالث' : 'Section 3') :
                       classificationMeta.type === 'shared' ? (lang === 'ar' ? 'القسم الثاني' : 'Section 2') :
                       classificationMeta.type === 'specific' ? (lang === 'ar' ? 'القسم الأول' : 'Section 1') : (lang === 'ar' ? 'غير مصنف' : 'Pending')}
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-main)', flexWrap: 'wrap' }}>
                      <Layers size={14} style={{ color: classificationMeta.badgeColor, flexShrink: 0 }} />
                      <span>{lang === 'ar' ? 'مكان الظهور في الموقع:' : 'Storefront Display Location:'}</span>
                      <span style={{ color: classificationMeta.badgeColor }}>{classificationMeta.sectionAr}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      💡 {classificationMeta.descriptionAr}
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('admin.year')} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>({lang === 'ar' ? 'يتم تحديده تلقائياً من المادة المختارة' : 'Auto-detected from subject'})</span></label>
                <select className="form-input" value={yearId} onChange={(e) => setYearId(e.target.value)}>
                  <option value="">{lang === 'ar' ? 'اختر السنة الدراسية (تلقائي)' : 'Select Year (Auto)'}</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name_ar}</option>
                  ))}
                </select>
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
