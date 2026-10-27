import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Package,
  Layers,
  Palette,
  Settings,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Box
} from 'lucide-react';
import {
  isBoxProduct,
  cleanColorLabel,
  computeVariantAvailableStock,
  fetchCanonicalBoxInventory,
  saveBoxVariantInventoryRecord,
  resetAllBoxStockToZero
} from '../../utils/boxInventoryEngine';

import AdminQuickBoxes from './AdminQuickBoxes';

export const AdminAccessories = () => {
  const { isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState('quick-boxes'); // 'quick-boxes' | 'categories' | 'products' | 'colors' | 'backgrounds'

  // Data states
  const [categories, setCategories] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_acc_cats');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_acc_prods');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [colors, setColors] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_acc_colors');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [boxInventory, setBoxInventory] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_box_inv');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return {};
  });
  const [selectedProductId, setSelectedProductId] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_acc_prods');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.[0]?.id) return parsed[0].id;
      }
    } catch (_) {}
    return '';
  });
  const [backgrounds, setBackgrounds] = useState({
    accessories_page_bg: '',
    dental_boxes_page_bg: ''
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_acc_prods');
      if (cached && JSON.parse(cached).length > 0) return false;
    } catch (_) {}
    return true;
  });
  const [saving, setSaving] = useState(false);
  const [resettingStock, setResettingStock] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '', image_url: '', sort_order: 0 });

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({ category_id: '', size: '16 inch', name_ar: '', name_en: '', desc_ar: '', desc_en: '', features_en: '', main_image: '', inside_image: '', price: 0, sort_order: 0 });

  const [showColorModal, setShowColorModal] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [colorForm, setColorForm] = useState({
    product_id: '',
    color_id: '',
    label_ar: '',
    label_en: '',
    status: 'out_of_stock',
    hex_code: '#E02020',
    image_url: '',
    sort_order: 0,
    physical_stock: 0,
    reserved_stock: 0,
    price: '',
    size: ''
  });

  // Helper to extract inventory details for any color variant
  const getVariantStockInfo = (colorItem) => {
    if (!colorItem) return { physical: 0, reserved: 0, available: 0, status: 'out_of_stock', price: null, size: null };
    const inv = boxInventory[colorItem.id] || boxInventory[colorItem.color_id] || {};
    const physical = inv.physical_stock !== undefined ? inv.physical_stock : (colorItem.stock_quantity || 0);
    const reserved = inv.reserved_stock !== undefined ? inv.reserved_stock : 0;
    const available = inv.available_stock !== undefined ? inv.available_stock : computeVariantAvailableStock(physical, reserved);
    const status = available > 0 ? 'in_stock' : 'out_of_stock';
    return {
      physical,
      reserved,
      available,
      status,
      price: inv.price !== undefined ? inv.price : (colorItem.price || null),
      size: inv.size || colorItem.size || null,
      image_url: inv.image_url || colorItem.image_url || null
    };
  };

  // 1. Fetch initial data
  const loadAllData = async () => {
    if (products.length === 0) setLoading(true);
    try {
      const [catRes, prodRes, colorRes, invData, bgSettingRes] = await Promise.all([
        supabase.from('accessory_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('accessory_products').select('*').order('sort_order', { ascending: true }),
        supabase.from('accessory_product_colors').select('*').order('sort_order', { ascending: true }),
        fetchCanonicalBoxInventory(),
        supabase.from('settings').select('value').eq('key', 'accessories_bgs').maybeSingle()
      ]);

      if (catRes.data) {
        setCategories(catRes.data);
        try { localStorage.setItem('abs_admin_cached_acc_cats', JSON.stringify(catRes.data)); } catch (_) {}
      }
      if (prodRes.data) {
        setProducts(prodRes.data);
        try { localStorage.setItem('abs_admin_cached_acc_prods', JSON.stringify(prodRes.data)); } catch (_) {}
        if (prodRes.data.length > 0 && !selectedProductId) {
          setSelectedProductId(prodRes.data[0].id);
        }
      }
      if (colorRes.data) {
        setColors(colorRes.data);
        try { localStorage.setItem('abs_admin_cached_acc_colors', JSON.stringify(colorRes.data)); } catch (_) {}
      }
      if (invData?.variants || invData) {
        const vars = invData?.variants || invData || {};
        setBoxInventory(vars);
        try { localStorage.setItem('abs_admin_cached_box_inv', JSON.stringify(vars)); } catch (_) {}
      }
      if (bgSettingRes.data?.value) {
        setBackgrounds({
          accessories_page_bg: bgSettingRes.data.value.accessories_page_bg || '',
          dental_boxes_page_bg: bgSettingRes.data.value.dental_boxes_page_bg || ''
        });
      }
    } catch (err) {
      console.error('Failed to load admin accessories data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Helper for image upload -> convert to public URL / Storage
  const handleFileUpload = async (file, onDone) => {
    if (!file) return;
    setSaving(true);
    try {
      const fileName = `accessories/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('smylodent-assets')
        .upload(fileName, file);

      if (!error && data) {
        const { data: pubUrl } = supabase.storage
          .from('smylodent-assets')
          .getPublicUrl(fileName);
        onDone(pubUrl.publicUrl);
        showMsg('success', isRtl ? 'تم رفع الصورة بنجاح!' : 'Image uploaded successfully!');
      } else {
        // Fallback convert to Data URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          onDone(e.target.result);
          showMsg('success', isRtl ? 'تم تجهيز المعاينة بنجاح!' : 'Image preview ready!');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      showMsg('error', isRtl ? 'فشل رفع الصورة' : 'Image upload failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── CATEGORY HANDLERS ── */
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name_ar: catForm.name_ar,
        name_en: catForm.name_en || catForm.name_ar,
        slug: catForm.slug || catForm.name_ar.toLowerCase().replace(/\s+/g, '-'),
        description_ar: catForm.description_ar,
        description_en: catForm.description_en,
        image_url: catForm.image_url,
        sort_order: parseInt(catForm.sort_order || 0)
      };

      if (editingCategory) {
        await supabase.from('accessory_categories').update(payload).eq('id', editingCategory.id);
        showMsg('success', isRtl ? 'تم تحديث القسم بنجاح' : 'Category updated successfully');
      } else {
        await supabase.from('accessory_categories').insert(payload);
        showMsg('success', isRtl ? 'تم إضافة القسم بنجاح' : 'Category created successfully');
      }
      setShowCategoryModal(false);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت تأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this category?')) return;
    try {
      await supabase.from('accessory_categories').delete().eq('id', id);
      showMsg('success', isRtl ? 'تم الحذف بنجاح' : 'Deleted successfully');
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    }
  };

  /* ── PRODUCT HANDLERS ── */
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const featuresArr = typeof prodForm.features_en === 'string'
        ? prodForm.features_en.split('\n').filter(Boolean)
        : prodForm.features_en;

      const payload = {
        category_id: prodForm.category_id || (categories[0]?.id || null),
        size: prodForm.size,
        name_ar: prodForm.name_ar,
        name_en: prodForm.name_en || prodForm.name_ar,
        desc_ar: prodForm.desc_ar,
        desc_en: prodForm.desc_en,
        features_en: featuresArr,
        features_ar: featuresArr,
        main_image: prodForm.main_image,
        inside_image: prodForm.inside_image,
        price: parseFloat(prodForm.price || 0),
        sort_order: parseInt(prodForm.sort_order || 0)
      };

      if (editingProduct) {
        await supabase.from('accessory_products').update(payload).eq('id', editingProduct.id);
        showMsg('success', isRtl ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully');
      } else {
        await supabase.from('accessory_products').insert(payload);
        showMsg('success', isRtl ? 'تم إضافة المنتج بنجاح' : 'Product created successfully');
      }
      setShowProductModal(false);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت تأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) return;
    try {
      await supabase.from('accessory_products').delete().eq('id', id);
      showMsg('success', isRtl ? 'تم الحذف بنجاح' : 'Deleted successfully');
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    }
  };

  /* ── COLOR HANDLERS ── */
  const getStatusFromColor = (c) => {
    if (!c) return 'in_stock';
    const info = getVariantStockInfo(c);
    return info.status;
  };

  const handleSaveColor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanAr = (colorForm.label_ar || colorForm.label_en || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();
      const cleanEn = (colorForm.label_en || colorForm.label_ar || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();
      const isBox = isBoxProduct(colorForm.product_id || selectedProductId);

      const physicalStock = Math.max(0, parseInt(colorForm.physical_stock, 10) || 0);
      const reservedStock = Math.max(0, parseInt(colorForm.reserved_stock, 10) || 0);
      const availableStock = computeVariantAvailableStock(physicalStock, reservedStock);

      let effectiveStatus = colorForm.status || 'in_stock';
      if (isBox) {
        effectiveStatus = availableStock > 0 ? 'in_stock' : 'out_of_stock';
      }

      let statusSuffix = '';
      if (effectiveStatus === 'out_of_stock') statusSuffix = ' [out_of_stock]';
      else if (effectiveStatus === 'coming_soon') statusSuffix = ' [coming_soon]';

      const payload = {
        product_id: colorForm.product_id || selectedProductId,
        color_id: colorForm.color_id || cleanEn.toLowerCase().replace(/\s+/g, '-'),
        label_ar: cleanAr + statusSuffix,
        label_en: cleanEn + statusSuffix,
        hex_code: colorForm.hex_code,
        image_url: colorForm.image_url,
        sort_order: parseInt(colorForm.sort_order || 0)
      };

      let targetId = editingColor ? editingColor.id : null;

      if (editingColor) {
        await supabase.from('accessory_product_colors').update(payload).eq('id', editingColor.id);
        showMsg('success', isRtl ? 'تم تحديث اللون بنجاح' : 'Color updated successfully');
      } else {
        const { data: insData, error: insErr } = await supabase
          .from('accessory_product_colors')
          .insert(payload)
          .select()
          .single();
        if (insErr) throw insErr;
        targetId = insData.id;
        showMsg('success', isRtl ? 'تم إضافة اللون بنجاح' : 'Color added successfully');
      }

      // If box product, sync canonical box_variants_inventory record
      if (isBox && targetId) {
        const priceVal = colorForm.price !== '' && !isNaN(parseFloat(colorForm.price)) ? parseFloat(colorForm.price) : null;
        const sizeVal = colorForm.size ? colorForm.size.trim() : null;

        await saveBoxVariantInventoryRecord(targetId, {
          product_id: colorForm.product_id || selectedProductId,
          color_id: colorForm.color_id || cleanEn.toLowerCase().replace(/\s+/g, '-'),
          label_ar: cleanAr,
          label_en: cleanEn,
          hex_code: colorForm.hex_code,
          image_url: colorForm.image_url,
          physical_stock: physicalStock,
          reserved_stock: reservedStock,
          price: priceVal,
          size: sizeVal
        });
      }

      setShowColorModal(false);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColor = async (id) => {
    if (!window.confirm(isRtl ? 'حذف هذا اللون؟' : 'Delete this color variant?')) return;
    try {
      await supabase.from('accessory_product_colors').delete().eq('id', id);
      showMsg('success', isRtl ? 'تم الحذف' : 'Deleted');
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    }
  };

  const handleQuickStatusChange = async (colorItem, newStatus) => {
    try {
      const isBox = isBoxProduct(colorItem.product_id || selectedProductId);
      const cleanAr = cleanColorLabel(colorItem, 'ar');
      const cleanEn = cleanColorLabel(colorItem, 'en');
      const invInfo = getVariantStockInfo(colorItem);

      if (isBox) {
        let newPhysical = invInfo.physical;
        let newReserved = invInfo.reserved;

        if (newStatus === 'in_stock') {
          if (newPhysical <= 0) newPhysical = 1;
        } else {
          newPhysical = 0;
          newReserved = 0;
        }

        await saveBoxVariantInventoryRecord(colorItem.id, {
          physical_stock: newPhysical,
          reserved_stock: newReserved,
          hex_code: colorItem.hex_code,
          image_url: colorItem.image_url,
          label_ar: cleanAr,
          label_en: cleanEn
        });
      } else {
        let statusSuffix = '';
        if (newStatus === 'out_of_stock') statusSuffix = ' [out_of_stock]';
        else if (newStatus === 'coming_soon') statusSuffix = ' [coming_soon]';

        const payload = {
          label_ar: cleanAr + statusSuffix,
          label_en: cleanEn + statusSuffix
        };
        const { error } = await supabase.from('accessory_product_colors').update(payload).eq('id', colorItem.id);
        if (error) throw error;
      }

      showMsg('success', isRtl ? 'تم تحديث حالة التوفر بنجاح' : 'Status updated successfully');
      loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    }
  };

  const handleResetAllBoxStock = async () => {
    setResettingStock(true);
    try {
      await resetAllBoxStockToZero();
      showMsg('success', isRtl
        ? 'تم تصفير مخزون جميع ألوان البوكسات بنجاح إلى 0 مع الحفاظ التام على البيانات والكتالوج!'
        : 'All box variants reset to 0 stock successfully with catalog integrity preserved!');
      setShowResetConfirmModal(false);
      await loadAllData();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setResettingStock(false);
    }
  };

  /* ── BACKGROUNDS SAVE ── */
  const handleSaveBackgrounds = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('settings').upsert({
        key: 'accessories_bgs',
        value: backgrounds
      });
      showMsg('success', isRtl ? 'تم حفظ خلفيات الصفحات بنجاح' : 'Background images saved successfully');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredColors = colors.filter(c => c.product_id === selectedProductId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
            {isRtl ? 'إدارة قسم الإكسسوارات والبوكسات' : 'Accessories & Dental Boxes Admin'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            {isRtl ? 'التحكم الكامل في الأقسام، منتجات Dental Boxes، صور الألوان، والخلفيات' : 'Full control over categories, Dental Boxes, color variant images, and background assets'}
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {message.text && (
        <div style={{
          padding: '0.9rem 1.2rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: message.type === 'success' ? '#10B981' : '#EF4444',
          border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
          fontSize: '0.9rem',
          fontWeight: 700
        }}>
          {message.text}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('quick-boxes')}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'quick-boxes' ? 'linear-gradient(135deg, #4A3525 0%, #2C1A11 100%)' : 'transparent',
            color: activeTab === 'quick-boxes' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: activeTab === 'quick-boxes' ? '0 4px 12px rgba(44, 26, 17, 0.25)' : 'none'
          }}
        >
          <Box size={18} />
          <span>{isRtl ? '⚡ مدير البوكسات والألوان السريع' : '⚡ Quick Box Manager'}</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'categories' ? 'var(--secondary)' : 'transparent',
            color: activeTab === 'categories' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={18} />
          <span>{isRtl ? 'الأقسام (Categories)' : 'Categories'}</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'products' ? 'var(--secondary)' : 'transparent',
            color: activeTab === 'products' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Package size={18} />
          <span>{isRtl ? 'بوكسات الأسنان والمنتجات' : 'Dental Boxes Products'}</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'colors' ? 'var(--secondary)' : 'transparent',
            color: activeTab === 'colors' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Palette size={18} />
          <span>{isRtl ? 'صور الألوان (Color → Image)' : 'Color-Image Variants'}</span>
        </button>

        <button
          onClick={() => setActiveTab('backgrounds')}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'backgrounds' ? 'var(--secondary)' : 'transparent',
            color: activeTab === 'backgrounds' ? '#fff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ImageIcon size={18} />
          <span>{isRtl ? 'خلفيات الصفحات' : 'Page Backgrounds'}</span>
        </button>
      </div>

      {/* ── TAB 1: CATEGORIES MANAGEMENT ── */}
      {activeTab === 'quick-boxes' && <AdminQuickBoxes />}

      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatForm({ name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '', image_url: '', sort_order: categories.length + 1 });
                setShowCategoryModal(true);
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              <span>{isRtl ? 'إضافة قسم جديد' : 'Add Category'}</span>
            </button>
          </div>

          <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800 }}>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الصورة' : 'Image'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الاسم بالإنجليزية' : 'English Name'}</th>
                  <th style={{ padding: '1rem' }}>Slug</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الترتيب' : 'Order'}</th>
                  <th style={{ padding: '1rem', textAlign: 'end' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name_en} style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800 }}>{cat.name_ar}</td>
                    <td style={{ padding: '1rem' }}>{cat.name_en}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{cat.slug}</td>
                    <td style={{ padding: '1rem' }}>{cat.sort_order}</td>
                    <td style={{ padding: '1rem', textAlign: 'end' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatForm({ ...cat });
                            setShowCategoryModal(true);
                          }}
                          className="action-btn"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="action-btn text-danger"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PRODUCTS (DENTAL BOXES) MANAGEMENT ── */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdForm({ category_id: categories[0]?.id || '', size: '17 inch', name_ar: '', name_en: '', desc_ar: '', desc_en: '', features_en: '', main_image: '', inside_image: '', price: 0, sort_order: products.length + 1 });
                setShowProductModal(true);
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              <span>{isRtl ? 'إضافة منتج بوكس جديد' : 'Add Dental Box Product'}</span>
            </button>
          </div>

          <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800 }}>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الصورة الرئيسية' : 'Main Image'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الحجم' : 'Size'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'اسم المنتج (EN)' : 'Product Name (EN)'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'السعر' : 'Price'}</th>
                  <th style={{ padding: '1rem', textAlign: 'end' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <img src={prod.main_image || `${BASE}accessories/box17-colors.png`} alt={prod.name_en} style={{ width: 50, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--secondary)' }}>{prod.size}</td>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{prod.name_en || prod.name_ar}</td>
                    <td style={{ padding: '1rem' }}>{prod.price > 0 ? `${prod.price} LYD` : '—'}</td>
                    <td style={{ padding: '1rem', textAlign: 'end' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setProdForm({
                              ...prod,
                              features_en: Array.isArray(prod.features_en) ? prod.features_en.join('\n') : (prod.features_en || '')
                            });
                            setShowProductModal(true);
                          }}
                          className="action-btn"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="action-btn text-danger"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: COLOR-IMAGE VARIANTS MANAGEMENT ── */}
      {activeTab === 'colors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Select Target Product & Quick Actions */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 800, fontSize: '0.9rem' }}>
              {isRtl ? 'اختر المنتج لإدارة ألوانه ومخزونه:' : 'Select Product to Manage Colors & Inventory:'}
            </label>
            <select
              className="form-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ maxWidth: 320, fontWeight: 700 }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.size} — {p.name_en || p.name_ar}
                </option>
              ))}
            </select>

            <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Safe Reset All Box Stock to Zero Button */}
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(true)}
                className="btn btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#EF4444',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.55rem 0.95rem'
                }}
                title={isRtl ? 'تصفير مخزون جميع البوكسات إلى صفر بأمان' : 'Safely reset all box stock to zero'}
              >
                <RotateCcw size={15} />
                <span>{isRtl ? 'تصفير مخزون البوكسات (0)' : 'Reset All Box Stock to 0'}</span>
              </button>

              {/* Add Color & Image Button */}
              <button
                onClick={() => {
                  const currProd = products.find(p => p.id === selectedProductId);
                  setEditingColor(null);
                  setColorForm({
                    product_id: selectedProductId,
                    color_id: '',
                    label_ar: '',
                    label_en: '',
                    hex_code: '#1565C0',
                    image_url: '',
                    sort_order: filteredColors.length + 1,
                    status: 'out_of_stock',
                    physical_stock: 0,
                    reserved_stock: 0,
                    price: currProd?.price || '',
                    size: currProd?.size || ''
                  });
                  setShowColorModal(true);
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={18} />
                <span>{isRtl ? 'إضافة لون جديد ومخزون' : 'Add Color & Stock'}</span>
              </button>
            </div>
          </div>

          {/* Dental Box Info Banner */}
          {isBoxProduct(selectedProductId) && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.84rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <ShieldCheck size={18} color="#3B82F6" />
              <span>
                {isRtl
                  ? '💡 منتج بوكس أسنان: التوفر محسوب ديناميكياً (المتوفر للبيع = الكمية بالمخزن - المحجوز). إذا كان المتوفر 0 يظهر اللون تلقائياً تحت "الألوان غير المتوفرة حالياً".'
                  : '💡 Dental Box product: Availability is strictly calculated (Available = Physical - Reserved). When Available is 0, the color automatically appears under "Currently Unavailable".'}
              </span>
            </div>
          )}

          {/* Colors & Inventory Table */}
          <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800 }}>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'اللون (كود Hex)' : 'Color Dot'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'اسم اللون' : 'Color Label'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'المقاس / الأبعاد' : 'Size / Dimensions'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'السعر (د.ل)' : 'Price (LYD)'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'الكمية بالمخزن' : 'Physical Stock'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'المحجوز' : 'Reserved'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'المتوفر للبيع' : 'Available'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'حالة التوفر' : 'Availability Status'}</th>
                  <th style={{ padding: '0.85rem' }}>{isRtl ? 'الصورة' : 'Image'}</th>
                  <th style={{ padding: '0.85rem', textAlign: 'end' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredColors.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isRtl ? 'لا توجد ألوان مضافة لهذا المنتج بعد' : 'No color variants added for this product yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredColors.map(c => {
                    const stockInfo = getVariantStockInfo(c);
                    const cleanLabel = cleanColorLabel(c, isRtl ? 'ar' : 'en') || c.label_en || c.label_ar;
                    const currProd = products.find(p => p.id === selectedProductId);

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {/* 1. Color Dot & Hex */}
                        <td style={{ padding: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ width: 26, height: 26, borderRadius: '50%', background: c.hex_code, border: '2px solid rgba(0,0,0,0.12)', display: 'inline-block' }} />
                            <code style={{ fontSize: '0.8rem', opacity: 0.85 }}>{c.hex_code}</code>
                          </div>
                        </td>

                        {/* 2. Color Label */}
                        <td style={{ padding: '0.85rem', fontWeight: 800 }}>{cleanLabel}</td>

                        {/* 3. Dimensions / Size */}
                        <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>
                          {stockInfo.size || currProd?.size || '—'}
                        </td>

                        {/* 4. Price (LYD) */}
                        <td style={{ padding: '0.85rem', fontWeight: 700 }}>
                          {stockInfo.price !== null && stockInfo.price !== undefined ? `${stockInfo.price} د.ل` : (currProd?.price ? `${currProd.price} د.ل` : '—')}
                        </td>

                        {/* 5. Physical Stock */}
                        <td style={{ padding: '0.85rem', fontWeight: 800 }}>
                          {stockInfo.physical}
                        </td>

                        {/* 6. Reserved Stock */}
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{
                            fontWeight: 700,
                            color: stockInfo.reserved > 0 ? '#F59E0B' : 'var(--text-muted)',
                            background: stockInfo.reserved > 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            padding: stockInfo.reserved > 0 ? '0.2rem 0.5rem' : 0,
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            {stockInfo.reserved}
                          </span>
                        </td>

                        {/* 7. Available Stock */}
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 900,
                            fontSize: '0.88rem',
                            backgroundColor: stockInfo.available > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: stockInfo.available > 0 ? '#10B981' : '#EF4444',
                            border: `1px solid ${stockInfo.available > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                          }}>
                            {stockInfo.available > 0 ? `${stockInfo.available} متوفر` : '0 (نفذ)'}
                          </span>
                        </td>

                        {/* 8. Availability Status Quick Dropdown */}
                        <td style={{ padding: '0.85rem' }}>
                          <select
                            value={stockInfo.status}
                            onChange={(e) => handleQuickStatusChange(c, e.target.value)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              border: '1px solid var(--border-color)',
                              background: stockInfo.status === 'out_of_stock' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: stockInfo.status === 'out_of_stock' ? '#EF4444' : '#10B981',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="in_stock">🟢 {isRtl ? 'متوفر' : 'In Stock'}</option>
                            <option value="out_of_stock">🔴 {isRtl ? 'غير متوفر' : 'Out of Stock'}</option>
                          </select>
                        </td>

                        {/* 9. Image Thumbnail */}
                        <td style={{ padding: '0.85rem' }}>
                          {stockInfo.image_url ? (
                            <img src={stockInfo.image_url} alt={cleanLabel} style={{ width: 44, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No image</span>
                          )}
                        </td>

                        {/* 10. Actions */}
                        <td style={{ padding: '0.85rem', textAlign: 'end' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingColor(c);
                                setColorForm({
                                  ...c,
                                  product_id: c.product_id || selectedProductId,
                                  label_ar: cleanColorLabel(c, 'ar'),
                                  label_en: cleanColorLabel(c, 'en'),
                                  status: stockInfo.status,
                                  hex_code: c.hex_code || '#1565C0',
                                  image_url: stockInfo.image_url || c.image_url || '',
                                  physical_stock: stockInfo.physical,
                                  reserved_stock: stockInfo.reserved,
                                  price: stockInfo.price !== null && stockInfo.price !== undefined ? stockInfo.price : (currProd?.price || ''),
                                  size: stockInfo.size || currProd?.size || ''
                                });
                                setShowColorModal(true);
                              }}
                              className="action-btn"
                              title="Edit Color & Inventory"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteColor(c.id)}
                              className="action-btn text-danger"
                              title="Delete Color Variant"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: PAGE BACKGROUNDS MANAGEMENT ── */}
      {activeTab === 'backgrounds' && (
        <form onSubmit={handleSaveBackgrounds} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', backgroundColor: 'var(--surface-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem' }}>
              {isRtl ? 'التحكم في خلفيات صفحات الإكسسوارات' : 'Manage Page Background Images'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRtl ? 'قم برفع أو وضع رابط الصورة للخلفيات الرئيسية لكل قسم' : 'Upload or set image URLs for main page hero backgrounds'}
            </p>
          </div>

          {/* Accessories Main Page Background */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800 }}>
              {isRtl ? 'خلفية صفحة الإكسسوارات الرئيسية (Accessories Page Background):' : 'Main Accessories Page Background Image:'}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://... or upload below"
                value={backgrounds.accessories_page_bg}
                onChange={(e) => setBackgrounds(b => ({ ...b, accessories_page_bg: e.target.value }))}
                style={{ flex: 1 }}
              />
              <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.65rem 1rem' }}>
                <Upload size={16} />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e.target.files[0], (url) => setBackgrounds(b => ({ ...b, accessories_page_bg: url })))}
                />
              </label>
            </div>
            {backgrounds.accessories_page_bg && (
              <img src={backgrounds.accessories_page_bg} alt="Accessories BG Preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginTop: '0.6rem' }} />
            )}
          </div>

          {/* Dental Boxes Page Background */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800 }}>
              {isRtl ? 'خلفية قسم بوكسات الأسنان (Dental Boxes Page Background):' : 'Dental Boxes Sub-Page Background Image:'}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://... or upload below"
                value={backgrounds.dental_boxes_page_bg}
                onChange={(e) => setBackgrounds(b => ({ ...b, dental_boxes_page_bg: e.target.value }))}
                style={{ flex: 1 }}
              />
              <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.65rem 1rem' }}>
                <Upload size={16} />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e.target.files[0], (url) => setBackgrounds(b => ({ ...b, dental_boxes_page_bg: url })))}
                />
              </label>
            </div>
            {backgrounds.dental_boxes_page_bg && (
              <img src={backgrounds.dental_boxes_page_bg} alt="Dental Boxes BG Preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginTop: '0.6rem' }} />
            )}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.85rem', width: 'fit-content' }}>
            {saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الخلفيات' : 'Save Background Images')}
          </button>
        </form>
      )}

      {/* ── CATEGORY MODAL ── */}
      {showCategoryModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, backgroundColor: 'var(--surface-color)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                {editingCategory ? (isRtl ? 'تعديل القسم' : 'Edit Category') : (isRtl ? 'إضافة قسم جديد' : 'New Category')}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="action-btn"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'اسم القسم (عربي)' : 'Category Name (Arabic)'}</label>
                <input type="text" className="form-input" required value={catForm.name_ar} onChange={e => setCatForm({ ...catForm, name_ar: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'اسم القسم (إنجليزية)' : 'Category Name (English)'}</label>
                <input type="text" className="form-input" value={catForm.name_en} onChange={e => setCatForm({ ...catForm, name_en: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input type="text" className="form-input" value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'صورة القسم' : 'Category Image URL'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" value={catForm.image_url} onChange={e => setCatForm({ ...catForm, image_url: e.target.value })} />
                  <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], url => setCatForm({ ...catForm, image_url: url }))} />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-outline">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={saving} className="btn btn-secondary">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── PRODUCT MODAL ── */}
      {showProductModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 550, maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--surface-color)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                {editingProduct ? (isRtl ? 'تعديل بوكس المنتج' : 'Edit Product Box') : (isRtl ? 'إضافة منتج بوكس جديد' : 'New Dental Box')}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="action-btn"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'الحجم (مثل 17 inch)' : 'Size (e.g. 17 inch, 16.5 inch, 16 inch)'}</label>
                <input type="text" className="form-input" required value={prodForm.size} onChange={e => setProdForm({ ...prodForm, size: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}</label>
                <input type="text" className="form-input" required value={prodForm.name_en} onChange={e => setProdForm({ ...prodForm, name_en: e.target.value, name_ar: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'الوصف (English Description)' : 'Description (English)'}</label>
                <textarea className="form-input" rows={3} value={prodForm.desc_en} onChange={e => setProdForm({ ...prodForm, desc_en: e.target.value, desc_ar: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'المميزات (خاصية في كل سطر)' : 'Features (One feature per line)'}</label>
                <textarea className="form-input" rows={3} placeholder="Removable inner tray&#10;Two side latches" value={prodForm.features_en} onChange={e => setProdForm({ ...prodForm, features_en: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'الصورة الرئيسية للمنتج' : 'Main Product Image'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" value={prodForm.main_image} onChange={e => setProdForm({ ...prodForm, main_image: e.target.value })} />
                  <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], url => setProdForm({ ...prodForm, main_image: url }))} />
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'صورة الداخل (Inside View Image)' : 'Inside View Image'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" value={prodForm.inside_image} onChange={e => setProdForm({ ...prodForm, inside_image: e.target.value })} />
                  <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], url => setProdForm({ ...prodForm, inside_image: url }))} />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-outline">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={saving} className="btn btn-secondary">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── COLOR & INVENTORY MODAL ── */}
      {showColorModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 540, backgroundColor: 'var(--surface-color)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                  {editingColor ? (isRtl ? 'تعديل اللون ومخزونه' : 'Edit Color Variant & Inventory') : (isRtl ? 'إضافة لون ومخزون جديد' : 'Add Color & Inventory')}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {isRtl ? 'التحكم بالكمية الفعلية والمحجوزة والسعر وصورة هذا اللون بالتحديد' : 'Manage physical stock, reservations, pricing, and variant image'}
                </p>
              </div>
              <button onClick={() => setShowColorModal(false)} className="action-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveColor} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Color Name (EN & AR) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'اسم اللون (English)' : 'Color Name (EN)'}</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Cobalt Blue"
                    value={colorForm.label_en}
                    onChange={e => setColorForm({ ...colorForm, label_en: e.target.value, label_ar: colorForm.label_ar || e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'اسم اللون (عربي)' : 'Color Name (AR)'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: أزرق ملكي"
                    value={colorForm.label_ar}
                    onChange={e => setColorForm({ ...colorForm, label_ar: e.target.value })}
                  />
                </div>
              </div>

              {/* Dimensions/Size & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'المقاس / الأبعاد' : 'Size / Dimensions'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 16 inch / 40x20x18 cm"
                    value={colorForm.size || ''}
                    onChange={e => setColorForm({ ...colorForm, size: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'السعر (د.ل)' : 'Price (LYD)'}</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    placeholder="e.g. 65"
                    value={colorForm.price ?? ''}
                    onChange={e => setColorForm({ ...colorForm, price: e.target.value })}
                  />
                </div>
              </div>

              {/* Stock Management Box (Physical & Reserved) */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                    📦 {isRtl ? 'إدارة المخزون والتوافر' : 'Stock & Availability Engine'}
                  </span>
                  {/* Realtime Available Stock Calculation */}
                  {(() => {
                    const phys = Math.max(0, parseInt(colorForm.physical_stock, 10) || 0);
                    const res = Math.max(0, parseInt(colorForm.reserved_stock, 10) || 0);
                    const avail = Math.max(0, phys - res);
                    return (
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        backgroundColor: avail > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: avail > 0 ? '#10B981' : '#EF4444'
                      }}>
                        {avail > 0 ? `🟢 المتوفر للبيع: ${avail}` : '🔴 غير متوفر للبيع (0)'}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      {isRtl ? 'الكمية الإجمالية بالمخزن (Physical)' : 'Physical Stock'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={colorForm.physical_stock ?? 0}
                      onChange={e => setColorForm({ ...colorForm, physical_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      {isRtl ? 'الكمية المحجوزة للطلبات (Reserved)' : 'Reserved Stock'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={colorForm.reserved_stock ?? 0}
                      onChange={e => setColorForm({ ...colorForm, reserved_stock: e.target.value })}
                    />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isRtl
                    ? '* تظهر الألوان ذات المخزون المتوفر > 0 تلقائياً تحت "الألوان المتوفرة"، بينما تظهر ذات المخزون 0 تحت "الألوان غير المتوفرة حالياً".'
                    : '* Variants with available stock > 0 display under "Available Colors". Zero-stock variants display under "Currently Unavailable".'}
                </p>
              </div>

              {/* Color Hex Picker */}
              <div className="form-group">
                <label className="form-label">{isRtl ? 'كود اللون (Hex Color)' : 'Hex Color Picker'}</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={colorForm.hex_code || '#1565C0'}
                    onChange={e => setColorForm({ ...colorForm, hex_code: e.target.value })}
                    style={{ width: 44, height: 44, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={colorForm.hex_code}
                    onChange={e => setColorForm({ ...colorForm, hex_code: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Image URL & Upload */}
              <div className="form-group">
                <label className="form-label">{isRtl ? 'صورة المنتج لهذا اللون بالتحديد (Color Image)' : 'Specific Image for this Color:'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://... or upload below"
                    value={colorForm.image_url}
                    onChange={e => setColorForm({ ...colorForm, image_url: e.target.value })}
                  />
                  <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.6rem 0.9rem' }}>
                    <Upload size={16} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], url => setColorForm({ ...colorForm, image_url: url }))} />
                  </label>
                </div>
                {colorForm.image_url && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={colorForm.image_url} alt="Preview" style={{ width: 60, height: 50, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isRtl ? 'معاينة صورة اللون' : 'Variant Image Preview'}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowColorModal(false)} className="btn btn-outline">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={saving} className="btn btn-secondary">{isRtl ? 'حفظ البيانات' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── RESET CONFIRMATION MODAL ── */}
      {showResetConfirmModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460, backgroundColor: 'var(--surface-color)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#EF4444' }}>
                  {isRtl ? 'تأكيد تصفير مخزون البوكسات' : 'Confirm Box Inventory Reset'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {isRtl ? 'إجراء أمان المخزون الأولي' : 'Initial Inventory Safety Action'}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-main)', background: 'var(--accent)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {isRtl
                  ? 'سيتم ضبط المخزون المتوفر لجميع ألوان البوكسات إلى صفر (0)، ونقل كافة الألوان إلى قسم "الألوان غير المتوفرة حالياً" مع تعطيل الشراء لحين إدخال الكميات الفعلية.'
                  : 'All box variants will have their available stock set to 0 and moved to "Currently Unavailable" with purchases disabled until confirmed.'}
              </p>
              <ul style={{ margin: '0.75rem 0 0 0', paddingInlineStart: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <li>{isRtl ? 'لن يتم حذف أي منتج أو لون أو صورة.' : 'No products, colors, or images will be deleted.'}</li>
                <li>{isRtl ? 'لن يتم التأثير على الطلبات السابقة أو الحجوزات القائمة.' : 'Historical orders and invoices remain untouched.'}</li>
                <li>{isRtl ? 'يمكنك تحديث مخزون كل لون وتفعيله فور توفره.' : 'You can enter real stock per variant anytime.'}</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={resettingStock}
                onClick={() => setShowResetConfirmModal(false)}
                className="btn btn-outline"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={resettingStock}
                onClick={handleResetAllBoxStock}
                className="btn btn-danger"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800
                }}
              >
                {resettingStock ? (
                  <span>{isRtl ? 'جاري التصفير...' : 'Resetting...'}</span>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>{isRtl ? 'تأكيد التصفير إلى 0' : 'Confirm Reset to 0'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AdminAccessories;
