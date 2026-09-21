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
  ArrowLeft
} from 'lucide-react';

export const AdminAccessories = () => {
  const { isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'products' | 'colors' | 'backgrounds'

  // Data states
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [backgrounds, setBackgrounds] = useState({
    accessories_page_bg: '',
    dental_boxes_page_bg: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [colorForm, setColorForm] = useState({ product_id: '', color_id: '', label_ar: '', label_en: '', status: 'in_stock', hex_code: '#E02020', image_url: '', sort_order: 0 });

  // 1. Fetch initial data
  const loadAllData = async () => {
    setLoading(true);
    try {
      // Categories
      const { data: catData } = await supabase
        .from('accessory_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      setCategories(catData || []);

      // Products
      const { data: prodData } = await supabase
        .from('accessory_products')
        .select('*')
        .order('sort_order', { ascending: true });
      setProducts(prodData || []);
      if (prodData && prodData.length > 0 && !selectedProductId) {
        setSelectedProductId(prodData[0].id);
      }

      // Colors
      const { data: colorData } = await supabase
        .from('accessory_product_colors')
        .select('*')
        .order('sort_order', { ascending: true });
      setColors(colorData || []);

      // Backgrounds settings
      const { data: bgSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'accessories_bgs')
        .single();
      if (bgSetting?.value) {
        setBackgrounds({
          accessories_page_bg: bgSetting.value.accessories_page_bg || '',
          dental_boxes_page_bg: bgSetting.value.dental_boxes_page_bg || ''
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
    if (c.status) return c.status;
    const label = `${c.label_ar || ''} ${c.label_en || ''}`;
    if (label.includes('[out_of_stock]') || label.includes('نفذت الكمية')) return 'out_of_stock';
    if (label.includes('[coming_soon]') || label.includes('قريبا')) return 'coming_soon';
    return 'in_stock';
  };

  const handleSaveColor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanAr = (colorForm.label_ar || colorForm.label_en || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();
      const cleanEn = (colorForm.label_en || colorForm.label_ar || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();

      let statusSuffix = '';
      if (colorForm.status === 'out_of_stock') statusSuffix = ' [out_of_stock]';
      else if (colorForm.status === 'coming_soon') statusSuffix = ' [coming_soon]';

      const payload = {
        product_id: colorForm.product_id || selectedProductId,
        color_id: colorForm.color_id || cleanEn.toLowerCase().replace(/\s+/g, '-'),
        label_ar: cleanAr + statusSuffix,
        label_en: cleanEn + statusSuffix,
        hex_code: colorForm.hex_code,
        image_url: colorForm.image_url,
        sort_order: parseInt(colorForm.sort_order || 0)
      };

      if (editingColor) {
        await supabase.from('accessory_product_colors').update(payload).eq('id', editingColor.id);
        showMsg('success', isRtl ? 'تم تحديث اللون بنجاح' : 'Color updated successfully');
      } else {
        await supabase.from('accessory_product_colors').insert(payload);
        showMsg('success', isRtl ? 'تم إضافة اللون بنجاح' : 'Color added successfully');
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
          
          {/* Select Target Product */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 800, fontSize: '0.9rem' }}>
              {isRtl ? 'اختر المنتج لإدارة ألوانه وصوره:' : 'Select Product to Manage Colors:'}
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

            <button
              onClick={() => {
                setEditingColor(null);
                setColorForm({ product_id: selectedProductId, color_id: '', label_ar: '', label_en: '', hex_code: '#1565C0', image_url: '', sort_order: filteredColors.length + 1 });
                setShowColorModal(true);
              }}
              className="btn btn-secondary"
              style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              <span>{isRtl ? 'إضافة لون جديد وصورة' : 'Add Color & Image'}</span>
            </button>
          </div>

          {/* Colors Table */}
          <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800 }}>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'اللون (Hex)' : 'Color Dot'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'اسم اللون' : 'Color Label'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'حالة المعروض' : 'Availability Status'}</th>
                  <th style={{ padding: '1rem' }}>{isRtl ? 'الصورة التابعة للون' : 'Color Image'}</th>
                  <th style={{ padding: '1rem', textAlign: 'end' }}>{isRtl ? 'الإجراءات (حذف/تعديل)' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredColors.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isRtl ? 'لا توجد ألوان مضافة لهذا المنتج بعد' : 'No color variants added for this product yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredColors.map(c => {
                    const st = getStatusFromColor(c);
                    const cleanLabel = (c.label_ar || c.label_en || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ width: 28, height: 28, borderRadius: '50%', background: c.hex_code, border: '2px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                            <code style={{ fontSize: '0.8rem' }}>{c.hex_code}</code>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 800 }}>{cleanLabel}</td>
                        <td style={{ padding: '1rem' }}>
                          {st === 'out_of_stock' ? (
                            <span style={{ color: '#EF4444', fontWeight: 800, background: 'rgba(239,68,68,0.1)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>🔴 {isRtl ? 'نفذت الكمية' : 'Out of Stock'}</span>
                          ) : st === 'coming_soon' ? (
                            <span style={{ color: '#F59E0B', fontWeight: 800, background: 'rgba(245,158,11,0.1)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>🟧 {isRtl ? 'قريباً' : 'Coming Soon'}</span>
                          ) : (
                            <span style={{ color: '#10B981', fontWeight: 800, background: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>🟢 {isRtl ? 'متوفر' : 'In Stock'}</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {c.image_url ? (
                            <img src={c.image_url} alt={cleanLabel} style={{ width: 50, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Placeholder</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'end' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingColor(c);
                                setColorForm({
                                  ...c,
                                  label_ar: cleanLabel,
                                  label_en: (c.label_en || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim(),
                                  status: st
                                });
                                setShowColorModal(true);
                              }}
                              className="action-btn"
                              title="Edit Color"
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

      {/* ── COLOR MODAL ── */}
      {showColorModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, backgroundColor: 'var(--surface-color)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                {editingColor ? (isRtl ? 'تعديل لون وصورة' : 'Edit Color Variant') : (isRtl ? 'إضافة لون وصورة للمنتج' : 'Add Color & Image Variant')}
              </h3>
              <button onClick={() => setShowColorModal(false)} className="action-btn"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveColor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'اسم اللون (مثل Red, Blue, أحمر)' : 'Color Name'}</label>
                <input type="text" className="form-input" required value={colorForm.label_en} onChange={e => setColorForm({ ...colorForm, label_en: e.target.value, label_ar: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'حالة المعروض والتصميم (Availability Status)' : 'Stock Availability Status'}</label>
                <select
                  className="form-input"
                  value={colorForm.status || 'in_stock'}
                  onChange={e => setColorForm({ ...colorForm, status: e.target.value })}
                  style={{ fontWeight: 800, padding: '0.6rem' }}
                >
                  <option value="in_stock">🟢 {isRtl ? 'متوفر (In Stock)' : 'In Stock'}</option>
                  <option value="out_of_stock">🔴 {isRtl ? 'نفذت الكمية (Out of Stock)' : 'Out of Stock'}</option>
                  <option value="coming_soon">🟧 {isRtl ? 'قريباً (Coming Soon)' : 'Coming Soon'}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'كود اللون (Hex Color)' : 'Hex Color Picker'}</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="color" value={colorForm.hex_code} onChange={e => setColorForm({ ...colorForm, hex_code: e.target.value })} style={{ width: 44, height: 44, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
                  <input type="text" className="form-input" value={colorForm.hex_code} onChange={e => setColorForm({ ...colorForm, hex_code: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'صورة المنتج لهذا اللون بالتحديد (Color → Image)' : 'Specific Image for this Color:'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" required placeholder="Upload image placeholder" value={colorForm.image_url} onChange={e => setColorForm({ ...colorForm, image_url: e.target.value })} />
                  <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0], url => setColorForm({ ...colorForm, image_url: url }))} />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowColorModal(false)} className="btn btn-outline">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={saving} className="btn btn-secondary">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AdminAccessories;
