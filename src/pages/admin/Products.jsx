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

// Specialized Dental Specialty Icons matching reference mockup
const ToothSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.5 2 6 4 6 7c0 2.5 1 4 1.5 6.5.5 2.5.5 6.5 2 6.5 1.5 0 2-3 2.5-4 .5 1 1 4 2.5 4 1.5 0 1.5-4 2-6.5C17 11 18 9.5 18 7c0-3-2.5-5-6-5Z" />
  </svg>
);

const TwoTeethIcon = () => (
  <svg width="22" height="22" viewBox="0 0 28 24" fill="none" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 3C5.5 3 3.5 4.8 3.5 7.5c0 2.2.8 3.5 1.3 5.7.4 2.2.4 5.7 1.7 5.7 1.3 0 1.7-2.6 2.1-3.5.4.9.8 3.5 2.1 3.5 1.3 0 1.3-3.5 1.7-5.7.5-2.2 1.3-3.5 1.3-5.7C13.7 4.8 11.5 3 8.5 3Z" />
    <path d="M19.5 3C16.5 3 14.5 4.8 14.5 7.5c0 2.2.8 3.5 1.3 5.7.4 2.2.4 5.7 1.7 5.7 1.3 0 1.7-2.6 2.1-3.5.4.9.8 3.5 2.1 3.5 1.3 0 1.3-3.5 1.7-5.7.5-2.2 1.3-3.5 1.3-5.7C24.7 4.8 22.5 3 19.5 3Z" />
  </svg>
);

const CrownSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const MaterialsSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <path d="M8.12 8.12 12 12m0 0 3.88 3.88M12 12l3.88-3.88M12 12 8.12 15.88" />
    <circle cx="6" cy="18" r="3" />
    <path d="M14.8 14.8 20 20M14.8 9.2 20 4" />
  </svg>
);

const DenturesSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9c0-2.8 3.6-5 8-5s8 2.2 8 5v3c0 2.8-3.6 5-8 5s-8-2.2-8-5V9Z" />
    <path d="M7 9v3M10 8v5M14 8v5M17 9v3" />
    <path d="M4 11h16" />
  </svg>
);

const ShieldToothSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const BracesSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18" />
    <rect x="5" y="9" width="3" height="6" rx="1" />
    <rect x="10.5" y="9" width="3" height="6" rx="1" />
    <rect x="16" y="9" width="3" height="6" rx="1" />
  </svg>
);

const SurgerySvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 4 6 6-10 10H4v-6L14 4Z" />
    <path d="m17 7-3-3" />
  </svg>
);

const PediatricSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
    <path d="M9 10h.01M15 10h.01M9 15c1 1 5 1 6 0" />
  </svg>
);

const GumsSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C221E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18c3-3 6-3 9 0 3-3 6-3 9 0" />
    <path d="M12 4c-2 0-3.5 1.5-3.5 3.5 0 2 .5 3.5 1.5 5.5 1 2 2 5 2 5s1-3 2-5c1-2 1.5-3.5 1.5-5.5C15.5 5.5 14 4 12 4Z" />
  </svg>
);

const renderSubjectSpecialtyIcon = (sub) => {
  const text = `${sub?.slug || ''} ${sub?.name_ar || ''} ${sub?.name_en || ''}`.toLowerCase();
  if (text.includes('fixed') || text.includes('ثابتة') || text.includes('crown') || text.includes('تعويضات')) return <CrownSvg />;
  if (text.includes('material') || text.includes('مواد')) return <MaterialsSvg />;
  if (text.includes('removable') || text.includes('متحركة') || text.includes('denture')) return <DenturesSvg />;
  if (text.includes('prevent') || text.includes('وقائي')) return <ShieldToothSvg />;
  if (text.includes('ortho') || text.includes('تقويم')) return <BracesSvg />;
  if (text.includes('surg') || text.includes('جراحة') || text.includes('خلع')) return <SurgerySvg />;
  if (text.includes('ped') || text.includes('أطفال')) return <PediatricSvg />;
  if (text.includes('perio') || text.includes('لثة')) return <GumsSvg />;
  return <ToothSvg />;
};

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
    const sortedYears = [...years].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

    sortedYears.forEach(year => {
      let yearSubs = subjects
        .filter(s => String(s.year_id) === String(year.id))
        .sort((a, b) => {
          const orderA = a.sort_order != null ? Number(a.sort_order) : 999;
          const orderB = b.sort_order != null ? Number(b.sort_order) : 999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.name_ar || '').localeCompare(b.name_ar || '', 'ar');
        });

      if (query) {
        yearSubs = yearSubs.filter(s => 
          (s.name_ar || '').toLowerCase().includes(query) ||
          (s.name_en || '').toLowerCase().includes(query)
        );
      }

      // Always display all academic years when not filtering by search, or when search matches
      if (!query || yearSubs.length > 0) {
        groups.push({
          year,
          subjects: yearSubs
        });
      }
    });

    let otherSubs = subjects
      .filter(s => !s.year_id || !years.some(y => String(y.id) === String(s.year_id)))
      .sort((a, b) => {
        const orderA = a.sort_order != null ? Number(a.sort_order) : 999;
        const orderB = b.sort_order != null ? Number(b.sort_order) : 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name_ar || '').localeCompare(b.name_ar || '', 'ar');
      });

    if (query) {
      otherSubs = otherSubs.filter(s => 
        (s.name_ar || '').toLowerCase().includes(query) ||
        (s.name_en || '').toLowerCase().includes(query)
      );
    }
    if (otherSubs.length > 0) {
      groups.push({
        year: { id: 'other', name_ar: 'مواد عامة / غير مصنفة', name_en: 'General / Other Subjects' },
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

      // Load years ordered by academic progression
      const { data: yrs, error: yrsErr } = await supabase
        .from('years')
        .select('*')
        .order('sort_order', { ascending: true });
      if (yrs && !yrsErr && yrs.length > 0) {
        setYears(yrs);
      } else {
        const { data: fallbackYrs } = await supabase.from('years').select('*').order('slug');
        if (fallbackYrs) setYears(fallbackYrs);
      }

      // Load all subjects ordered by sort_order
      const { data: subs, error: subsErr } = await supabase
        .from('subjects')
        .select('*')
        .order('sort_order', { ascending: true });
      if (subs && !subsErr && subs.length > 0) {
        setSubjects(subs);
      } else {
        const { data: fallbackSubs } = await supabase.from('subjects').select('*').order('name_ar');
        if (fallbackSubs) setSubjects(fallbackSubs);
      }

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

  const ensureMetadataLoaded = async () => {
    try {
      if (years.length === 0 || subjects.length === 0) {
        const [{ data: liveYrs }, { data: liveSubs }] = await Promise.all([
          supabase.from('years').select('*').order('sort_order', { ascending: true }),
          supabase.from('subjects').select('*').order('sort_order', { ascending: true })
        ]);
        if (liveYrs && liveYrs.length > 0) setYears(liveYrs);
        if (liveSubs && liveSubs.length > 0) setSubjects(liveSubs);
        return { years: liveYrs || years, subjects: liveSubs || subjects };
      }
    } catch (e) {
      console.warn('Could not re-verify academic metadata:', e);
    }
    return { years, subjects };
  };

  const openAddModal = async () => {
    const meta = await ensureMetadataLoaded();
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
    const availableYears = meta.years || years;
    setYearId(availableYears.length > 0 ? availableYears[0].id : '');
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
    const meta = await ensureMetadataLoaded();
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

    // Fetch assigned subjects from junction table and combine with legacy fields
    const { data: ps } = await supabase
      .from('product_subjects')
      .select('subject_id')
      .eq('product_id', prod.id);

    const sIds = new Set();
    if (ps && ps.length > 0) {
      ps.forEach(r => { if (r.subject_id) sIds.add(r.subject_id); });
    }
    if (Array.isArray(prod.product_subjects) && prod.product_subjects.length > 0) {
      prod.product_subjects.forEach(r => { if (r.subject_id) sIds.add(r.subject_id); });
    }
    if (prod.subject_id) {
      sIds.add(prod.subject_id);
    }
    if (isUniv && sIds.size === 0) {
      const allSubList = (meta.subjects && meta.subjects.length > 0) ? meta.subjects : subjects;
      setSelectedSubjectIds(allSubList.map(s => s.id));
    } else {
      setSelectedSubjectIds(Array.from(sIds));
    }

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
              maxWidth: 'min(94vw, 840px)',
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
                  (Redesigned to precisely match the reference UI mockup)
                  ============================================================= */}
              <div style={{
                marginTop: '0.25rem',
                padding: '1.25rem',
                backgroundColor: '#FAF7F2',
                borderRadius: '18px',
                border: '1.5px solid #EADBCE',
                boxShadow: '0 2px 10px rgba(44, 34, 30, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingBottom: '0.85rem',
                  borderBottom: '1px solid #ECE2D5'
                }}>
                  {/* Right: Section Title & Subtitle */}
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#2C221E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}>
                      {lang === 'ar' ? 'المواد الدراسية المرتبطة بالمنتج' : 'Subjects Associated with Product'}
                    </h4>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.82rem',
                      color: '#7A6E65',
                      lineHeight: 1.35
                    }}>
                      {lang === 'ar'
                        ? 'اختر السنة أو السنوات والمواد التي يظهر فيها هذا المنتج'
                        : 'Choose the year(s) and subjects where this product appears'}
                    </p>
                  </div>

                  {/* Left: Top Actions (مسح الكل & جميع المواد) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Button: مسح الكل */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubjectIds([]);
                        setSubjectSelectionMode('custom');
                        setIsUniversal(false);
                      }}
                      className="btn btn-outline"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        height: '38px',
                        fontWeight: 700,
                        backgroundColor: '#FFFFFF',
                        borderColor: '#D8CCA8',
                        color: '#5C4E43',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={lang === 'ar' ? 'إلغاء جميع التحديدات الحالية' : 'Clear all selections'}
                    >
                      <Trash2 size={15} style={{ color: '#8C7E72' }} />
                      <span>{lang === 'ar' ? 'مسح الكل' : 'Clear All'}</span>
                    </button>

                    {/* Button: جميع المواد */}
                    <button
                      type="button"
                      onClick={() => {
                        if (subjectSelectionMode === 'all') {
                          setSubjectSelectionMode('custom');
                          setIsUniversal(false);
                        } else {
                          setSubjectSelectionMode('all');
                          setIsUniversal(true);
                          setSelectedSubjectIds(subjects.map(s => s.id));
                        }
                      }}
                      style={{
                        padding: '0.4rem 0.95rem',
                        fontSize: '0.8rem',
                        height: '38px',
                        fontWeight: 800,
                        backgroundColor: subjectSelectionMode === 'all' ? 'rgba(16, 185, 129, 0.15)' : '#FFFFFF',
                        border: subjectSelectionMode === 'all' ? '2px solid #059669' : '1px solid #D8CCA8',
                        color: subjectSelectionMode === 'all' ? '#047857' : '#5C4E43',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        boxShadow: subjectSelectionMode === 'all' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      title={lang === 'ar' ? 'ربط المنتج بجميع المواد المسجلة في النظام' : 'Associate product with all subjects'}
                    >
                      <Globe size={16} style={{ color: subjectSelectionMode === 'all' ? '#059669' : '#8C7E72' }} />
                      <span>{lang === 'ar' ? 'جميع المواد' : 'All Subjects'}</span>
                      {subjectSelectionMode === 'all' && (
                        <span style={{
                          fontSize: '0.68rem',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          borderRadius: '9999px',
                          padding: '1px 6px',
                          marginInlineStart: '2px'
                        }}>
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Search bar */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={lang === 'ar' ? '🔍 ابحث في أسماء المواد الدراسية (عربي / English)...' : '🔍 Search subjects...'}
                    value={subjectSearchInModal}
                    onChange={(e) => setSubjectSearchInModal(e.target.value)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2D7C7',
                      borderRadius: '10px',
                      paddingInlineStart: '2.4rem',
                      paddingInlineEnd: subjectSearchInModal ? '2.2rem' : '1rem',
                      height: '40px',
                      fontSize: '0.84rem'
                    }}
                  />
                  <Search size={15} style={{ position: 'absolute', insetInlineStart: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.45, pointerEvents: 'none' }} />
                  {subjectSearchInModal && (
                    <button
                      type="button"
                      onClick={() => setSubjectSearchInModal('')}
                      style={{ position: 'absolute', insetInlineEnd: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#8C7E72' }}
                      title={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Year Cards List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: 'min(460px, 52vh)',
                  overflowY: 'auto',
                  paddingInlineEnd: '0.25rem',
                  overscrollBehavior: 'contain'
                }}>
                  {groupedSubjects.map((grp) => {
                    const grpSubjectIds = grp.subjects.map(s => s.id);
                    const selectedInGroup = grp.subjects.filter(s => selectedSubjectIds.includes(s.id)).length;
                    const allGroupSelected = grp.subjects.length > 0 && selectedInGroup === grp.subjects.length;

                    return (
                      <div
                        key={grp.year.id}
                        style={{
                          backgroundColor: '#FCF9F4',
                          border: '1.5px solid #E8DFD3',
                          borderRadius: '16px',
                          padding: '0.9rem 1rem',
                          boxShadow: '0 2px 6px rgba(44, 34, 30, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        {/* Year Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.65rem',
                          paddingBottom: '0.65rem',
                          borderBottom: '1px solid #EFE6DA'
                        }}>
                          {/* Title & Count */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>🎓</span>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2C221E' }}>
                              {grp.year.name_ar}
                            </span>
                            <span style={{
                              fontSize: '0.84rem',
                              fontWeight: 800,
                              color: '#800020',
                              backgroundColor: 'rgba(128, 0, 32, 0.06)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(128, 0, 32, 0.15)'
                            }}>
                              ({grp.subjects.length} {lang === 'ar' ? 'مواد' : 'subjects'})
                            </span>
                            {selectedInGroup > 0 && selectedInGroup < grp.subjects.length && (
                              <span style={{ fontSize: '0.74rem', color: '#7A6E65', fontWeight: 600 }}>
                                ({lang === 'ar' ? `محدد: ${selectedInGroup}` : `${selectedInGroup} selected`})
                              </span>
                            )}
                          </div>

                          {/* Year Action Buttons */}
                          {grp.subjects.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              {/* Deselect All Year Subjects */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (subjectSelectionMode === 'all') {
                                    setSubjectSelectionMode('custom');
                                    setIsUniversal(false);
                                  }
                                  setSelectedSubjectIds(prev => prev.filter(id => !grpSubjectIds.includes(id)));
                                }}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.25rem 0.65rem',
                                  fontSize: '0.75rem',
                                  height: '32px',
                                  fontWeight: 600,
                                  backgroundColor: '#FFFFFF',
                                  borderColor: '#D5C9B8',
                                  color: '#6B5E54',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  cursor: 'pointer'
                                }}
                                title={lang === 'ar' ? 'إلغاء تحديد مواد هذه السنة فقط' : 'Deselect this year subjects'}
                              >
                                <Trash2 size={13} style={{ color: '#8C7E72' }} />
                                <span>{lang === 'ar' ? 'إلغاء تحديد جميع المواد' : 'Deselect Year'}</span>
                              </button>

                              {/* Select All Year Subjects */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (subjectSelectionMode === 'all') {
                                    setSubjectSelectionMode('custom');
                                    setIsUniversal(false);
                                  }
                                  setSelectedSubjectIds(prev => Array.from(new Set([...prev, ...grpSubjectIds])));
                                }}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  height: '32px',
                                  fontWeight: 700,
                                  backgroundColor: allGroupSelected ? 'rgba(128, 0, 32, 0.08)' : '#FFFFFF',
                                  borderColor: '#800020',
                                  color: '#800020',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  cursor: 'pointer'
                                }}
                                title={lang === 'ar' ? 'تحديد كافة مواد هذه السنة' : 'Select all subjects for this year'}
                              >
                                <Check size={13} strokeWidth={2.5} />
                                <span>{lang === 'ar' ? 'تحديد جميع مواد السنة' : 'Select All Year'}</span>
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {/* Subjects Grid */}
                        {grp.subjects.length === 0 ? (
                          <div style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            color: '#8C7E72',
                            fontSize: '0.82rem',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px dashed #DCCFBF'
                          }}>
                            <span>{lang === 'ar' ? 'لا توجد مواد مسجلة لهذه السنة حالياً في قاعدة البيانات' : 'No subjects registered under this academic year yet'}</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
                            gap: '0.65rem'
                          }}>
                            {grp.subjects.map((s) => {
                              const isChecked = selectedSubjectIds.includes(s.id);

                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    if (subjectSelectionMode === 'all') {
                                      setSubjectSelectionMode('custom');
                                      setIsUniversal(false);
                                    }
                                    setSelectedSubjectIds(prev =>
                                      prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                    );
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.65rem',
                                    padding: '0.7rem 0.85rem',
                                    borderRadius: '12px',
                                    backgroundColor: isChecked ? '#FFF9F7' : '#FFFFFF',
                                    border: isChecked ? '1.5px solid #800020' : '1px solid #E6DAC8',
                                    boxShadow: isChecked ? '0 2px 8px rgba(128, 0, 32, 0.09)' : '0 1px 3px rgba(44, 34, 30, 0.02)',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                                  }}
                                >
                                  {/* Right side: Icon + Names */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                    <div style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '10px',
                                      backgroundColor: isChecked ? 'rgba(128, 0, 32, 0.08)' : '#FAF4EC',
                                      border: isChecked ? '1px solid rgba(128, 0, 32, 0.2)' : '1px solid #EDE2D3',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      {renderSubjectSpecialtyIcon(s)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{
                                        fontSize: '0.88rem',
                                        fontWeight: 800,
                                        color: isChecked ? '#800020' : '#2C221E',
                                        lineHeight: 1.25,
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word'
                                      }}>
                                        {s.name_ar}
                                      </div>
                                      {s.name_en && (
                                        <div style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 500,
                                          color: '#7C6E65',
                                          lineHeight: 1.2,
                                          marginTop: '2px',
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-word'
                                        }}>
                                          {s.name_en}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Left side: Custom Checkbox */}
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '5px',
                                    border: isChecked ? '1.5px solid #800020' : '1.5px solid #C8BCAC',
                                    backgroundColor: isChecked ? '#800020' : '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease'
                                  }}>
                                    {isChecked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {groupedSubjects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.75rem', color: '#8C7E72', fontSize: '0.85rem' }}>
                      <p style={{ margin: 0 }}>{lang === 'ar' ? 'لا توجد مواد دراسية مطابقة للبحث' : 'No subjects matched your search'}</p>
                      {subjectSearchInModal && (
                        <button
                          type="button"
                          onClick={() => setSubjectSearchInModal('')}
                          className="btn btn-outline"
                          style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {lang === 'ar' ? 'إعادة ضبط البحث' : 'Reset search'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* =============================================================
                    BOTTOM 3 EXPLANATORY CARDS (As shown in reference mockup)
                    ============================================================= */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  {/* Box 1: مادة واحدة فقط */}
                  {(() => {
                    const isSpecificActive = !isUniversal && subjectSelectionMode !== 'all' && selectedSubjectIds.length === 1;
                    return (
                      <div style={{
                        backgroundColor: isSpecificActive ? '#EFF6FF' : 'rgba(239, 246, 255, 0.55)',
                        border: isSpecificActive ? '2px solid #2563EB' : '1.5px solid #BFDBFE',
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        boxShadow: isSpecificActive ? '0 4px 14px rgba(37, 99, 235, 0.15)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ToothSvg />
                        </div>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color: '#1D4ED8'
                          }}>
                            <span>{lang === 'ar' ? 'مادة واحدة فقط' : 'Single Subject'}</span>
                            {isSpecificActive && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#2563EB', color: '#FFFFFF', padding: '1px 6px', borderRadius: '9999px' }}>
                                ✓ {lang === 'ar' ? 'نشط' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p style={{
                            margin: '0.25rem 0 0 0',
                            fontSize: '0.78rem',
                            color: '#4B5563',
                            lineHeight: 1.35
                          }}>
                            {lang === 'ar' ? 'يظهر المنتج في قسم الأدوات الخاصة بهذه المادة فقط' : 'Appears in specific tools section for this subject only'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Box 2: مادتين أو أكثر */}
                  {(() => {
                    const isSharedActive = !isUniversal && subjectSelectionMode !== 'all' && selectedSubjectIds.length >= 2;
                    return (
                      <div style={{
                        backgroundColor: isSharedActive ? '#FFF7ED' : 'rgba(255, 247, 237, 0.65)',
                        border: isSharedActive ? '2px solid #EA580C' : '1.5px solid #FED7AA',
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        boxShadow: isSharedActive ? '0 4px 14px rgba(234, 88, 12, 0.15)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(234, 88, 12, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <TwoTeethIcon />
                        </div>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color: '#C2410C'
                          }}>
                            <span>{lang === 'ar' ? 'مادتين أو أكثر' : 'Two or More Subjects'}</span>
                            {isSharedActive && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#EA580C', color: '#FFFFFF', padding: '1px 6px', borderRadius: '9999px' }}>
                                ✓ {lang === 'ar' ? `نشط (${selectedSubjectIds.length})` : `Active (${selectedSubjectIds.length})`}
                              </span>
                            )}
                          </div>
                          <p style={{
                            margin: '0.25rem 0 0 0',
                            fontSize: '0.78rem',
                            color: '#4B5563',
                            lineHeight: 1.35
                          }}>
                            {lang === 'ar' ? 'يظهر المنتج في قسم الأدوات المشتركة بين المواد' : 'Appears in shared tools section across selected subjects'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Box 3: جميع المواد */}
                  {(() => {
                    const isUniversalActive = isUniversal || subjectSelectionMode === 'all';
                    return (
                      <div
                        onClick={() => {
                          if (subjectSelectionMode === 'all') {
                            setSubjectSelectionMode('custom');
                            setIsUniversal(false);
                          } else {
                            setSubjectSelectionMode('all');
                            setIsUniversal(true);
                            setSelectedSubjectIds(subjects.map(s => s.id));
                          }
                        }}
                        style={{
                          backgroundColor: isUniversalActive ? '#ECFDF5' : 'rgba(236, 253, 245, 0.65)',
                          border: isUniversalActive ? '2px solid #059669' : '1.5px solid #A7F3D0',
                          borderRadius: '14px',
                          padding: '0.85rem 1rem',
                          boxShadow: isUniversalActive ? '0 4px 14px rgba(5, 150, 105, 0.15)' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Globe size={19} style={{ color: '#059669' }} />
                        </div>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color: '#047857'
                          }}>
                            <span>{lang === 'ar' ? 'جميع المواد' : 'All Subjects'}</span>
                            {isUniversalActive && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#059669', color: '#FFFFFF', padding: '1px 6px', borderRadius: '9999px' }}>
                                ✓ {lang === 'ar' ? 'نشط (عام)' : 'Active (Universal)'}
                              </span>
                            )}
                          </div>
                          <p style={{
                            margin: '0.25rem 0 0 0',
                            fontSize: '0.78rem',
                            color: '#4B5563',
                            lineHeight: 1.35
                          }}>
                            {lang === 'ar' ? 'يظهر المنتج في قسم المستلزمات المشتركة بين جميع السنوات' : 'Appears in universal supplies section across all years'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
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
