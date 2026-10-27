import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import {
  Box,
  Plus,
  Upload,
  Check,
  CheckCircle2,
  Clock,
  EyeOff,
  Trash2,
  Edit2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Image as ImageIcon,
  ChevronDown,
  X
} from 'lucide-react';
import {
  BOX_PRODUCT_IDS,
  resolveBoxImg,
  cleanColorLabel,
  saveBoxVariantInventoryRecord,
  fetchCanonicalBoxInventory
} from '../../utils/boxInventoryEngine';

/* ── PRESET STANDARD SIZES ── */
const STANDARD_BOX_SIZES = [
  {
    id: BOX_PRODUCT_IDS.BOX_14,
    sizeKey: '14 inch',
    labelAr: 'بوكس 14 إنش',
    labelEn: '14" Box',
    descAr: 'حجم مدمج خفيف وعملي',
    defaultPrice: 45,
    sampleImg: '/accessories/box14-pink.jpg'
  },
  {
    id: BOX_PRODUCT_IDS.BOX_16,
    sizeKey: '16 inch',
    labelAr: 'بوكس 16 إنش',
    labelEn: '16" Box',
    descAr: 'رف داخلي وقفلان جانبيان',
    defaultPrice: 65,
    sampleImg: '/accessories/box16-purple.jpg'
  },
  {
    id: BOX_PRODUCT_IDS.BOX_16_5,
    sizeKey: '16.5 inch',
    labelAr: 'بوكس 16.5 إنش',
    labelEn: '16.5" Box',
    descAr: 'أقسام علوية شفافة متعددة',
    defaultPrice: 85,
    sampleImg: '/accessories/box16_5-green.jpg'
  },
  {
    id: BOX_PRODUCT_IDS.BOX_17,
    sizeKey: '17 inch',
    labelAr: 'بوكس 17 إنش GT-MAX',
    labelEn: '17" GT-MAX',
    descAr: 'بوكس احترافي واسع للأدوات الثقيلة',
    defaultPrice: 95,
    sampleImg: '/accessories/box17-black.jpg'
  }
];

/* ── PRESET COLOR PALETTE ── */
const COLOR_PRESETS = [
  { labelAr: 'وردي', labelEn: 'Pink', hex: '#F48FB1', key: 'pink' },
  { labelAr: 'بنفسجي', labelEn: 'Purple', hex: '#7B3FE4', key: 'purple' },
  { labelAr: 'أزرق داكن', labelEn: 'Dark Blue', hex: '#0D47A1', key: 'dark-blue' },
  { labelAr: 'أحمر', labelEn: 'Red', hex: '#D32F2F', key: 'red' },
  { labelAr: 'أصفر', labelEn: 'Yellow', hex: '#FBC02D', key: 'yellow' },
  { labelAr: 'تركوازي', labelEn: 'Teal', hex: '#00897B', key: 'teal' },
  { labelAr: 'أخضر فسفوري', labelEn: 'Lime Green', hex: '#7CB342', key: 'lime' },
  { labelAr: 'أسود', labelEn: 'Black', hex: '#111111', key: 'black' },
  { labelAr: 'بيج', labelEn: 'Beige', hex: '#C8A882', key: 'beige' },
  { labelAr: 'برتقالي', labelEn: 'Orange', hex: '#FF9800', key: 'orange' },
  { labelAr: 'أزرق فاتح', labelEn: 'Sky Blue', hex: '#2196F3', key: 'sky-blue' },
  { labelAr: 'مارون / عودي', labelEn: 'Maroon', hex: '#880E4F', key: 'maroon' }
];

/* ── PRELOADED LOCAL GALLERY ── */
const GALLERY_SHORTCUTS = [
  { path: '/accessories/box14-pink.jpg', name: '14" وردي' },
  { path: '/accessories/box14-colors.png', name: '14" تشكيلة ألوان' },
  { path: '/accessories/box16-black.jpg', name: '16" أسود' },
  { path: '/accessories/box16-purple.jpg', name: '16" بنفسجي' },
  { path: '/accessories/box16-blue.jpg', name: '16" أزرق' },
  { path: '/accessories/box16-yellow.jpg', name: '16" أصفر' },
  { path: '/accessories/box16-pink.jpg', name: '16" وردي' },
  { path: '/accessories/box16-maroon.jpg', name: '16" عودي' },
  { path: '/accessories/box16_5-green.jpg', name: '16.5" أخضر فسفوري' },
  { path: '/accessories/box16_5-teal.jpg', name: '16.5" تركوازي' },
  { path: '/accessories/box16_5-orange.jpg', name: '16.5" برتقالي' },
  { path: '/accessories/box16_5-blue.jpg', name: '16.5" أزرق داكن' },
  { path: '/accessories/box16_5-red.jpg', name: '16.5" أحمر' },
  { path: '/accessories/box16_5-black.jpg', name: '16.5" أسود' },
  { path: '/accessories/box17_5-dark-blue.jpg', name: '17" أزرق داكن' },
  { path: '/accessories/box17-black.jpg', name: '17" أسود' },
  { path: '/accessories/box17-purple.jpg', name: '17" بنفسجي' },
  { path: '/accessories/box17-red.jpg', name: '17" أحمر' },
  { path: '/accessories/box17-beige.jpg', name: '17" بيج' },
  { path: '/accessories/box17-colors.png', name: '17" ملون' }
];

export const AdminQuickBoxes = () => {
  const { isRtl, lang } = useLanguage();

  // State
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_box_prods');
      if (cached) {
        const p = JSON.parse(cached);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (_) {}
    return [];
  });
  const [colors, setColors] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_box_colors');
      if (cached) {
        const c = JSON.parse(cached);
        if (Array.isArray(c) && c.length > 0) return c;
      }
    } catch (_) {}
    return [];
  });
  const [inventoryMap, setInventoryMap] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_box_inv');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return {};
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_box_prods');
      if (cached && JSON.parse(cached).length > 0) return false;
    } catch (_) {}
    return true;
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedFilterSize, setSelectedFilterSize] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Form State
  const [selectedSizeId, setSelectedSizeId] = useState(BOX_PRODUCT_IDS.BOX_16);
  const [colorLabelAr, setColorLabelAr] = useState('');
  const [colorLabelEn, setColorLabelEn] = useState('');
  const [colorHex, setColorHex] = useState('#7B3FE4');
  const [colorIdKey, setColorIdKey] = useState('');
  const [imageUrl, setImageUrl] = useState('/accessories/box16-purple.jpg');
  const [status, setStatus] = useState('in_stock'); // 'in_stock' | 'on_demand' | 'discontinued'
  const [price, setPrice] = useState(65);
  const [editingVariantId, setEditingVariantId] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: '', type: 'success' }), 4000);
  };

  // 1. Load Data
  const loadBoxesData = async () => {
    if (products.length === 0) setLoading(true);
    try {
      const [prodsRes, colorsRes, invData] = await Promise.all([
        supabase.from('accessory_products').select('*').order('sort_order', { ascending: true }),
        supabase.from('accessory_product_colors').select('*').order('sort_order', { ascending: true }),
        fetchCanonicalBoxInventory()
      ]);

      if (prodsRes.data) {
        setProducts(prodsRes.data);
        try { localStorage.setItem('abs_admin_cached_box_prods', JSON.stringify(prodsRes.data)); } catch (_) {}
      }
      if (colorsRes.data) {
        setColors(colorsRes.data);
        try { localStorage.setItem('abs_admin_cached_box_colors', JSON.stringify(colorsRes.data)); } catch (_) {}
      }
      if (invData?.variants || invData) {
        const vars = invData?.variants || invData || {};
        setInventoryMap(vars);
        try { localStorage.setItem('abs_admin_cached_box_inv', JSON.stringify(vars)); } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to load boxes manager data:', err);
      showToast(isRtl ? 'حدث خطأ في تحميل البيانات' : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxesData();
  }, []);

  // Sync default price and sample image when size selection changes
  const handleSelectSize = (sizeObj) => {
    setSelectedSizeId(sizeObj.id);
    if (!editingVariantId) {
      setPrice(sizeObj.defaultPrice);
      if (sizeObj.sampleImg) setImageUrl(sizeObj.sampleImg);
    }
  };

  // Preset color clicked
  const handleSelectColorPreset = (preset) => {
    setColorLabelAr(preset.labelAr);
    setColorLabelEn(preset.labelEn);
    setColorHex(preset.hex);
    setColorIdKey(preset.key);
  };

  // Upload file from device
  const handleDeviceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const fileName = `accessories/box_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('smylodent-assets')
        .upload(fileName, file);

      if (!error && data) {
        const { data: pubUrl } = supabase.storage
          .from('smylodent-assets')
          .getPublicUrl(fileName);
        setImageUrl(pubUrl.publicUrl);
        showToast(isRtl ? 'تم رفع الصورة بنجاح!' : 'Image uploaded successfully!');
      } else {
        const reader = new FileReader();
        reader.onload = (uploadEv) => {
          setImageUrl(uploadEv.target.result);
          showToast(isRtl ? 'تم تجهيز معاينة الصورة' : 'Image preview ready');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      showToast(isRtl ? 'فشل رفع الصورة' : 'Upload failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // SUBMIT FORM (Save & Publish Instantly)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!colorLabelAr.trim()) {
      showToast(isRtl ? 'يرجى كتابة اسم اللون' : 'Please provide a color name', 'error');
      return;
    }
    if (!imageUrl.trim()) {
      showToast(isRtl ? 'يرجى اختيار أو رفع صورة للبوكس' : 'Please provide a box image', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const cleanAr = cleanColorLabel({ label_ar: colorLabelAr }, 'ar');
      const cleanEn = colorLabelEn.trim() || cleanAr;
      const keyId = colorIdKey.trim() || cleanEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cleanImg = resolveBoxImg(imageUrl);

      const chosenSizeObj = STANDARD_BOX_SIZES.find(s => s.id === selectedSizeId) || {
        sizeKey: 'Box',
        labelAr: 'بوكس طبي'
      };

      let statusSuffix = '';
      if (status === 'discontinued') statusSuffix = ' [out_of_stock]';

      const colorRowPayload = {
        product_id: selectedSizeId,
        color_id: keyId,
        label_ar: cleanAr + statusSuffix,
        label_en: cleanEn + statusSuffix,
        hex_code: colorHex,
        image_url: cleanImg,
        sort_order: 0
      };

      let targetId = editingVariantId;

      if (editingVariantId) {
        // Update existing row
        await supabase
          .from('accessory_product_colors')
          .update(colorRowPayload)
          .eq('id', editingVariantId);
      } else {
        // Insert new row
        const { data: insData, error: insErr } = await supabase
          .from('accessory_product_colors')
          .insert(colorRowPayload)
          .select()
          .single();
        if (insErr) throw insErr;
        targetId = insData.id;
      }

      // Sync canonical inventory record in settings
      const availableStock = status === 'in_stock' ? 10 : (status === 'on_demand' ? 1 : 0);
      const physicalStock = status === 'in_stock' ? 10 : 0;

      await saveBoxVariantInventoryRecord(targetId, {
        product_id: selectedSizeId,
        color_id: keyId,
        label_ar: cleanAr,
        label_en: cleanEn,
        hex_code: colorHex,
        image_url: cleanImg,
        status: status,
        available_stock: availableStock,
        physical_stock: physicalStock,
        reserved_stock: 0,
        price: parseFloat(price) || chosenSizeObj.defaultPrice,
        size: chosenSizeObj.sizeKey
      });

      showToast(
        editingVariantId
          ? (isRtl ? '✨ تم تحديث بيانات البوكس واللون في الموقع بنجاح!' : 'Box variant updated successfully!')
          : (isRtl ? '✨ تمت إضافة البوكس وعرضه في الموقع تلقائياً بنجاح!' : 'Box variant published live successfully!'),
        'success'
      );

      // Reset form
      setEditingVariantId(null);
      setColorLabelAr('');
      setColorLabelEn('');
      setColorIdKey('');

      // Reload
      await loadBoxesData();
    } catch (err) {
      console.error('Error saving box variant:', err);
      showToast(err.message || 'Error saving variant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick 1-click status switcher right on the card
  const handleQuickStatusChange = async (colorItem, newStatus) => {
    setUpdatingId(colorItem.id);
    try {
      const cleanAr = cleanColorLabel(colorItem, 'ar');
      const cleanEn = cleanColorLabel(colorItem, 'en');
      const inv = inventoryMap[colorItem.id] || inventoryMap[colorItem.color_id] || {};

      let statusSuffix = '';
      if (newStatus === 'discontinued') statusSuffix = ' [out_of_stock]';

      // 1. Update colors table
      await supabase
        .from('accessory_product_colors')
        .update({
          label_ar: cleanAr + statusSuffix,
          label_en: cleanEn + statusSuffix
        })
        .eq('id', colorItem.id);

      // 2. Update canonical inventory setting
      const availableStock = newStatus === 'in_stock' ? 10 : (newStatus === 'on_demand' ? 1 : 0);
      const physicalStock = newStatus === 'in_stock' ? 10 : 0;

      await saveBoxVariantInventoryRecord(colorItem.id, {
        product_id: colorItem.product_id,
        color_id: colorItem.color_id,
        label_ar: cleanAr,
        label_en: cleanEn,
        hex_code: colorItem.hex_code,
        image_url: colorItem.image_url,
        status: newStatus,
        available_stock: availableStock,
        physical_stock: physicalStock,
        reserved_stock: 0
      });

      // Update local state instantly with zero reload
      setInventoryMap(prev => ({
        ...prev,
        [colorItem.id]: {
          ...(prev[colorItem.id] || {}),
          status: newStatus,
          available_stock: availableStock
        }
      }));

      showToast(
        isRtl
          ? (newStatus === 'in_stock' ? 'تم ضبط اللون كـ (متوفر فوراً) ✅' : newStatus === 'on_demand' ? 'تم ضبط اللون كـ (متوفر على الطلب) ⏳' : 'تم إخفاء اللون من المتجر مؤقتاً 🔒')
          : `Status changed to ${newStatus}`,
        'success'
      );
    } catch (err) {
      console.error('Status update failed:', err);
      showToast(err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Edit existing variant
  const handleStartEdit = (colorItem) => {
    const inv = inventoryMap[colorItem.id] || inventoryMap[colorItem.color_id] || {};
    const cleanAr = cleanColorLabel(colorItem, 'ar');
    const cleanEn = cleanColorLabel(colorItem, 'en');

    setEditingVariantId(colorItem.id);
    setSelectedSizeId(colorItem.product_id);
    setColorLabelAr(cleanAr);
    setColorLabelEn(cleanEn);
    setColorHex(colorItem.hex_code || '#7B3FE4');
    setColorIdKey(colorItem.color_id || '');
    setImageUrl(colorItem.image_url || '');
    setStatus(inv.status || 'in_stock');
    setPrice(inv.price || 65);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete variant
  const handleDeleteVariant = async (colorItem) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا اللون نهائياً؟' : 'Delete this color permanently?')) return;
    try {
      await supabase.from('accessory_product_colors').delete().eq('id', colorItem.id);
      showToast(isRtl ? 'تم حذف اللون بنجاح' : 'Deleted successfully');
      loadBoxesData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter colors
  const filteredColorsList = useMemo(() => {
    return colors.filter(c => {
      if (selectedFilterSize !== 'all' && c.product_id !== selectedFilterSize) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameAr = (c.label_ar || '').toLowerCase();
        const nameEn = (c.label_en || '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(query);
      }
      return true;
    });
  }, [colors, selectedFilterSize, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* ── TOP HEADER ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #4A3525 0%, #2C1A11 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(44, 26, 17, 0.2)'
          }}>
            <Box size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
              {isRtl ? '⚡ مدير البوكسات والألوان السريع' : 'Quick Box & Variant Studio'}
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRtl
                ? 'نظام مبسط لإضافة صور البوكس، اختيار المقاس واللون وحالة التوفر وتنزيلها تلقائياً فالموقع'
                : 'Simplified system to set box images, size, color, availability, and sync live to the storefront'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadBoxesData}
            disabled={loading}
            className="btn btn-outline"
            style={{
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.84rem',
              borderRadius: '10px'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
          </button>

          <Link
            to="/boxes"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              borderRadius: '10px'
            }}
          >
            <ExternalLink size={15} />
            <span>{isRtl ? 'معاينة صفحة البوكسات الحية' : 'View Live Store'}</span>
          </Link>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast.show && (
        <div
          className="animate-fade-in"
          style={{
            padding: '0.9rem 1.4rem',
            borderRadius: '12px',
            backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toast.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontSize: '0.92rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ── SECTION 1: QUICK ADD / EDIT STUDIO CARD ── */}
      <section
        className="card"
        style={{
          padding: '1.75rem',
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} style={{ color: 'var(--secondary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: 'var(--primary)' }}>
              {editingVariantId
                ? (isRtl ? 'تعديل بيانات اللون المختار' : 'Edit Color Variant')
                : (isRtl ? 'إضافة لون / بوكس جديد للموقع مباشرة' : 'Quick Add Box Variant')}
            </h2>
          </div>

          {editingVariantId && (
            <button
              onClick={() => {
                setEditingVariantId(null);
                setColorLabelAr('');
                setColorLabelEn('');
                setColorIdKey('');
              }}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              {isRtl ? 'إلغاء التعديل والعودة للإضافة' : 'Cancel Edit'}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
          
          {/* STEP 1: SIZE / MODEL SELECTION */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.6rem' }}>
              {isRtl ? '1. اختر حجم / مقاس البوكس:' : '1. Select Box Size:'}
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '0.85rem'
            }}>
              {STANDARD_BOX_SIZES.map((sizeObj) => {
                const isSelected = selectedSizeId === sizeObj.id;
                return (
                  <button
                    key={sizeObj.id}
                    type="button"
                    onClick={() => handleSelectSize(sizeObj)}
                    style={{
                      padding: '0.9rem 1.1rem',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface-color)',
                      textAlign: isRtl ? 'right' : 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(180, 155, 130, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--primary)' }}>
                        {sizeObj.labelAr}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--secondary)' : 'rgba(0,0,0,0.06)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-muted)'
                      }}>
                        {sizeObj.defaultPrice} د.ل
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {sizeObj.descAr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: IMAGE SELECTION & UPLOAD */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.6rem' }}>
              {isRtl ? '2. صورة البوكس (رفع أو اختيار فوري):' : '2. Box Image (Upload or Pick):'}
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 130px',
              gap: '1.25rem',
              alignItems: 'start'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <label
                    className="btn btn-outline"
                    style={{
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderRadius: '10px'
                    }}
                  >
                    <Upload size={16} />
                    <span>{isRtl ? 'رفع صورة من جهازك / الكاميرا' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDeviceUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowGalleryModal(true)}
                    className="btn btn-outline"
                    style={{
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderRadius: '10px'
                    }}
                  >
                    <ImageIcon size={16} />
                    <span>{isRtl ? 'اختيار من معرض صور البوكسات الجاهزة' : 'Pick from Box Gallery'}</span>
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder={isRtl ? 'أو ألصق مسار الصورة هنا مباشرة (مثلاً: /accessories/box16-black.jpg)' : 'Or paste image URL here'}
                    className="form-input"
                    style={{
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      direction: 'ltr',
                      textAlign: 'left',
                      padding: '0.65rem 0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Live Image Thumbnail Preview */}
              <div style={{
                width: 130,
                height: 110,
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#F8F4EE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}>
                {imageUrl ? (
                  <img
                    src={resolveBoxImg(imageUrl)}
                    alt="Preview"
                    onError={(e) => { e.currentTarget.src = '/accessories/box17-colors.png'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                    {isRtl ? 'معاينة الصورة' : 'Preview'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: COLOR SELECTION & PALETTE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.6rem' }}>
              {isRtl ? '3. اختر اللون المتاح أو اكتب اسمه:' : '3. Pick Color Name & Swatch:'}
            </label>

            {/* Quick Color Swatches */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.9rem'
            }}>
              {COLOR_PRESETS.map((preset) => {
                const isSelected = colorHex.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleSelectColorPreset(preset)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '999px',
                      border: isSelected ? '2px solid #2C1A11' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? '#FFFFFF' : 'var(--surface-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <span style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      backgroundColor: preset.hex,
                      border: '1px solid rgba(0,0,0,0.15)',
                      display: 'inline-block'
                    }} />
                    <span>{preset.labelAr}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Inputs Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {isRtl ? 'اسم اللون بالعربي (مطلوب)' : 'Arabic Color Label (Required)'}
                </label>
                <input
                  type="text"
                  required
                  value={colorLabelAr}
                  onChange={(e) => setColorLabelAr(e.target.value)}
                  placeholder="مثال: وردي، بنفسجي، أحمر..."
                  className="form-input"
                  style={{ padding: '0.6rem 0.85rem', fontSize: '0.88rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {isRtl ? 'اسم اللون بالإنجليزي (اختياري)' : 'English Color Label'}
                </label>
                <input
                  type="text"
                  value={colorLabelEn}
                  onChange={(e) => setColorLabelEn(e.target.value)}
                  placeholder="e.g. Pink, Purple, Red..."
                  className="form-input"
                  style={{ padding: '0.6rem 0.85rem', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {isRtl ? 'كود اللون المرئي (Hex)' : 'Color Hex'}
                </label>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    style={{
                      width: 42,
                      height: 38,
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      padding: 2
                    }}
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: AVAILABILITY STATUS (3-TIER MODEL) & PRICE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            background: 'var(--accent)',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid rgba(180, 155, 130, 0.25)'
          }}>
            {/* Status Options */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {isRtl ? '4. حالة توفر هذا اللون بالموقع:' : '4. Availability Status:'}
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* 1. In Stock */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: status === 'in_stock' ? '#FFFFFF' : 'transparent',
                  border: status === 'in_stock' ? '2px solid #059669' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#065F46'
                }}>
                  <input
                    type="radio"
                    name="box_status"
                    checked={status === 'in_stock'}
                    onChange={() => setStatus('in_stock')}
                  />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#059669' }} />
                  <span>{isRtl ? 'متوفر وجاهز للطلب الفوري (In Stock)' : 'In Stock (Direct Order)'}</span>
                </label>

                {/* 2. On Demand */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: status === 'on_demand' ? '#FFFFFF' : 'transparent',
                  border: status === 'on_demand' ? '2px solid #D97706' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#92400E'
                }}>
                  <input
                    type="radio"
                    name="box_status"
                    checked={status === 'on_demand'}
                    onChange={() => setStatus('on_demand')}
                  />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#D97706' }} />
                  <span>{isRtl ? 'متوفر على الطلب (On Demand — نقدر نوفروهولك)' : 'On Demand (Orderable)'}</span>
                </label>

                {/* 3. Discontinued / Hidden */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: status === 'discontinued' ? '#FFFFFF' : 'transparent',
                  border: status === 'discontinued' ? '2px solid #DC2626' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#991B1B'
                }}>
                  <input
                    type="radio"
                    name="box_status"
                    checked={status === 'discontinued'}
                    onChange={() => setStatus('discontinued')}
                  />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#DC2626' }} />
                  <span>{isRtl ? 'غير متوفر نهائياً / إخفاء مؤقت من الموقع' : 'Discontinued (Hidden)'}</span>
                </label>
              </div>
            </div>

            {/* Price Option */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {isRtl ? 'سعر البيع (د.ل):' : 'Selling Price (LYD):'}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="form-input"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  padding: '0.65rem 0.9rem',
                  backgroundColor: '#FFFFFF',
                  width: '100%',
                  maxWidth: '200px'
                }}
              />
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {isRtl ? 'يتعبأ تلقائياً حسب حجم البوكس ويمكنك تغييره بحرية.' : 'Pre-filled by size, customizable.'}
              </p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                fontWeight: 900,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 6px 18px rgba(180, 155, 130, 0.4)'
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>{isRtl ? 'جاري الحفظ والتنزيل...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <Check size={20} strokeWidth={3} />
                  <span>
                    {editingVariantId
                      ? (isRtl ? 'حفظ التعديلات وتحديث الموقع فوراً' : 'Save & Update Live')
                      : (isRtl ? '✨ إضافة وعرض البوكس في الموقع تلقائياً الآن' : 'Publish Box to Storefront Now')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION 2: LIVE CATALOG OF BOXES & ONE-CLICK STATUS CONTROLS ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>
              {isRtl ? 'ألوان وبوكسات المتجر الحالية' : 'Current Boxes & Color Variants in Store'}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isRtl
                ? 'يمكنك تغيير حالة أي لون فوراً بنقرة واحدة (متوفر فوراً / على الطلب / مخفي) دون الحاجة لفتح أي نافذة'
                : '1-click quick status toggles directly on any color variant'}
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedFilterSize('all')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedFilterSize === 'all' ? 'var(--secondary)' : 'rgba(0,0,0,0.06)',
                color: selectedFilterSize === 'all' ? '#FFFFFF' : 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isRtl ? 'الكل' : 'All'} ({colors.length})
            </button>

            {STANDARD_BOX_SIZES.map(s => {
              const count = colors.filter(c => c.product_id === s.id).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedFilterSize(s.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: selectedFilterSize === s.id ? 'var(--secondary)' : 'rgba(0,0,0,0.06)',
                    color: selectedFilterSize === s.id ? '#FFFFFF' : 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {s.labelAr} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', maxWidth: '350px' }}>
          <Search size={16} style={{ position: 'absolute', [isRtl ? 'right' : 'left']: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'ابحث باللون...' : 'Search by color...'}
            className="form-input"
            style={{
              paddingInlineStart: '2.4rem',
              paddingBlock: '0.55rem',
              fontSize: '0.85rem',
              borderRadius: '10px'
            }}
          />
        </div>

        {/* Colors Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredColorsList.map((colorItem) => {
            const inv = inventoryMap[colorItem.id] || inventoryMap[colorItem.color_id] || {};
            const cleanAr = cleanColorLabel(colorItem, 'ar');
            const cleanEn = cleanColorLabel(colorItem, 'en');
            const currentStatus = inv.status || 'in_stock';
            const matchedSize = STANDARD_BOX_SIZES.find(s => s.id === colorItem.product_id);
            const isUpdating = updatingId === colorItem.id;

            return (
              <div
                key={colorItem.id}
                className="card"
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--surface-color)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  opacity: isUpdating ? 0.6 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              >
                {/* Header: Thumbnail + Title + Actions */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#F8F4EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={resolveBoxImg(colorItem.image_url)}
                      alt={cleanAr}
                      onError={(e) => { e.currentTarget.src = '/accessories/box17-colors.png'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: colorItem.hex_code || '#7B3FE4',
                        border: '1px solid rgba(0,0,0,0.2)',
                        flexShrink: 0
                      }} />
                      <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cleanAr}
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {matchedSize?.labelAr || 'بوكس'} {inv.price ? `• ${inv.price} د.ل` : ''}
                    </span>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(colorItem)}
                      title={isRtl ? 'تعديل' : 'Edit'}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-main)'
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVariant(colorItem)}
                      title={isRtl ? 'حذف' : 'Delete'}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#EF4444'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 3-WAY QUICK STATUS CONTROLLER */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  padding: '0.35rem',
                  borderRadius: '10px'
                }}>
                  {/* Option 1: In Stock */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatusChange(colorItem, 'in_stock')}
                    style={{
                      padding: '0.45rem 0.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentStatus === 'in_stock' ? '#059669' : 'transparent',
                      color: currentStatus === 'in_stock' ? '#FFFFFF' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>{isRtl ? 'متوفر فوراً' : 'In Stock'}</span>
                  </button>

                  {/* Option 2: On Demand */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatusChange(colorItem, 'on_demand')}
                    style={{
                      padding: '0.45rem 0.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentStatus === 'on_demand' ? '#D97706' : 'transparent',
                      color: currentStatus === 'on_demand' ? '#FFFFFF' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={12} />
                    <span>{isRtl ? 'على الطلب' : 'On Demand'}</span>
                  </button>

                  {/* Option 3: Discontinued / Hidden */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatusChange(colorItem, 'discontinued')}
                    style={{
                      padding: '0.45rem 0.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentStatus === 'discontinued' ? '#DC2626' : 'transparent',
                      color: currentStatus === 'discontinued' ? '#FFFFFF' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <EyeOff size={12} />
                    <span>{isRtl ? 'مخفي' : 'Hidden'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MODAL: PRELOADED GALLERY SHORTCUTS ── */}
      {showGalleryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '80vh',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>
                {isRtl ? 'اختر صورة من صور البوكسات المتاحة' : 'Choose Box Image'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '1rem'
            }}>
              {GALLERY_SHORTCUTS.map(g => (
                <button
                  key={g.path}
                  type="button"
                  onClick={() => {
                    setImageUrl(g.path);
                    setShowGalleryModal(false);
                  }}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '12px',
                    border: imageUrl === g.path ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                    backgroundColor: imageUrl === g.path ? 'var(--accent)' : '#FAF8F5',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.45rem',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img
                    src={g.path}
                    alt={g.name}
                    style={{ width: 80, height: 70, objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminQuickBoxes;
