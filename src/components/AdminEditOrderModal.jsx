import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { createEditHistoryEntry, buildUpdatedStatusNote } from '../utils/orderEditHelper';
import { CANONICAL_MULTI_UNITS, isBundleProduct, getBundleDefinition } from '../utils/productInventoryEngine';
import {
  X,
  Save,
  Plus,
  Trash2,
  Search,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';

export const AdminEditOrderModal = ({ order, onClose, onOrderUpdated }) => {
  const { isRtl, lang } = useLanguage();

  // Basic Info Form
  const [customerName, setCustomerName] = useState(order.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone || '');
  const [customerPhoneSec, setCustomerPhoneSec] = useState(order.customer_phone_secondary || '');
  const [customerEmail, setCustomerEmail] = useState(order.customer_email || '');
  const [university, setUniversity] = useState(order.university || '');
  const [college, setCollege] = useState(order.college || '');
  const [addressText, setAddressText] = useState(order.address_text || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [status, setStatus] = useState(order.status || 'new');
  const [shippingFee, setShippingFee] = useState(parseFloat(order.shipping_fee ?? 0) || 0);
  const [discountAmount, setDiscountAmount] = useState(parseFloat(order.discount_amount ?? 0) || 0);

  // Catalog Products (preloaded for selling units and adding new items)
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preload catalog products for accurate selling unit resolution
  useEffect(() => {
    setLoadingCatalog(true);
    supabase
      .from('products')
      .select('id, name_ar, name_en, price, image_url, stock_quantity, unit_multiplier, shared_inventory_product_id')
      .eq('is_active', true)
      .order('name_ar', { ascending: true })
      .then(({ data }) => {
        if (data) setCatalogProducts(data);
        setLoadingCatalog(false);
      })
      .catch((err) => {
        console.warn('Preload catalog notice:', err);
        setLoadingCatalog(false);
      });
  }, []);

  // Items State with strict canonical product identity retention
  const initialItems = useMemo(() => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map((it, idx) => {
        const pId = it.productId || it.id;
        const isBundle = Boolean(it.is_bundle || isBundleProduct(it.bundle_id || pId));
        const bDef = isBundle ? getBundleDefinition(it.bundle_id || pId) : null;
        return {
          lineId: it.lineId || `line_${idx}_${pId || idx}`,
          id: pId,
          productId: pId,
          name_ar: it.name_ar,
          name_en: it.name_en,
          price: parseFloat(it.price) || 0,
          quantity: Math.max(1, parseInt(it.quantity) || 1),
          image_url: it.image_url || '',
          selling_unit: it.selling_unit || it.sellingUnit || (isBundle ? 'بكج متكامل' : null),
          selling_unit_id: it.selling_unit_id || it.sellingUnitId || (isBundle ? 'bundle' : (it.selling_unit?.includes('علبة') ? 'box' : 'piece')),
          unit_multiplier: parseInt(it.unit_multiplier || it.unitMultiplier) || 1,
          is_accessory: Boolean(it.is_accessory),
          is_bundle: isBundle,
          bundle_id: isBundle ? (it.bundle_id || pId) : null,
          bundle_components: isBundle ? (it.bundle_components || bDef?.components || []) : null
        };
      });
    }
    if (Array.isArray(order.order_items)) {
      return order.order_items.map((oi, idx) => {
        const pId = oi.product_id || oi.id;
        const isBundle = Boolean(oi.is_bundle || isBundleProduct(oi.bundle_id || pId));
        const bDef = isBundle ? getBundleDefinition(oi.bundle_id || pId) : null;
        return {
          lineId: oi.lineId || `line_${idx}_${pId}`,
          id: pId,
          productId: pId,
          name_ar: oi.products?.name_ar || oi.name_ar || 'منتج',
          name_en: oi.products?.name_en || oi.name_en || 'Product',
          price: parseFloat(oi.price) || 0,
          quantity: Math.max(1, parseInt(oi.quantity) || 1),
          image_url: oi.products?.image_url || oi.image_url || '',
          selling_unit: oi.selling_unit || (isBundle ? 'بكج متكامل' : null),
          selling_unit_id: oi.selling_unit_id || (isBundle ? 'bundle' : (oi.selling_unit?.includes('علبة') ? 'box' : 'piece')),
          unit_multiplier: parseInt(oi.unit_multiplier) || 1,
          is_accessory: false,
          is_bundle: isBundle,
          bundle_id: isBundle ? (oi.bundle_id || pId) : null,
          bundle_components: isBundle ? (oi.bundle_components || bDef?.components || []) : null
        };
      });
    }
    return [];
  }, [order]);

  const [items, setItems] = useState(initialItems);

  // Recalculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const final = subtotal + (parseFloat(shippingFee) || 0) - (parseFloat(discountAmount) || 0);
    return Math.max(0, final);
  }, [subtotal, shippingFee, discountAmount]);

  /**
   * Authoritative lookup of available selling units for a product.
   * NEVER searches products flatly by price!
   * Strictly inspects canonical multi-unit metadata and relational parent/child links.
   */
  const getAvailableSellingUnits = (item, catalogList) => {
    const prodId = item.productId || item.id;
    if (item.is_bundle || isBundleProduct(prodId) || isBundleProduct(item.bundle_id)) {
      return [
        {
          id: 'bundle',
          nameAr: 'بكج متكامل',
          nameEn: 'Complete Bundle',
          multiplier: 1,
          defaultPrice: item.price
        }
      ];
    }
    const units = [];

    // 1. Check CANONICAL_MULTI_UNITS (Wax etc.)
    const canonicalMeta = CANONICAL_MULTI_UNITS[prodId];
    if (canonicalMeta) {
      if (canonicalMeta.isBase) {
        units.push({
          id: 'piece',
          nameAr: canonicalMeta.baseUnitNameAr || 'قطعة',
          nameEn: canonicalMeta.baseUnitNameEn || 'Piece',
          multiplier: 1,
          defaultPrice: 2
        });
        const packProd = (catalogList || []).find((p) => p.id === canonicalMeta.packProductId);
        units.push({
          id: 'box',
          nameAr: 'علبة (3 قطع)',
          nameEn: 'Box (3 Pieces)',
          multiplier: canonicalMeta.boxSize || 3,
          defaultPrice: packProd ? parseFloat(packProd.price) : 5
        });
      } else {
        const baseProd = (catalogList || []).find((p) => p.id === canonicalMeta.baseProductId);
        units.push({
          id: 'piece',
          nameAr: 'قطعة',
          nameEn: 'Piece',
          multiplier: 1,
          defaultPrice: baseProd ? parseFloat(baseProd.price) : 2
        });
        units.push({
          id: 'box',
          nameAr: canonicalMeta.unitNameAr || 'علبة (3 قطع)',
          nameEn: canonicalMeta.unitNameEn || 'Box (3 Pieces)',
          multiplier: canonicalMeta.unitMultiplier || 3,
          defaultPrice: 5
        });
      }
      return units;
    }

    // 2. Check relational shared_inventory in database catalog
    const catalogItem = (catalogList || []).find((p) => p.id === prodId);
    if (catalogItem) {
      if (catalogItem.shared_inventory_product_id) {
        const parent = (catalogList || []).find((p) => p.id === catalogItem.shared_inventory_product_id);
        const mult = parseInt(catalogItem.unit_multiplier) || 3;
        units.push({
          id: 'piece',
          nameAr: 'قطعة',
          nameEn: 'Piece',
          multiplier: 1,
          defaultPrice: parent ? parseFloat(parent.price) : parseFloat((catalogItem.price / mult).toFixed(2))
        });
        units.push({
          id: 'box',
          nameAr: `علبة (${mult} قطع)`,
          nameEn: `Box (${mult} Pieces)`,
          multiplier: mult,
          defaultPrice: parseFloat(catalogItem.price)
        });
        return units;
      }

      // Check if another product references this as its shared inventory master
      const childPack = (catalogList || []).find((p) => p.shared_inventory_product_id === prodId);
      if (childPack) {
        const mult = parseInt(childPack.unit_multiplier) || 3;
        units.push({
          id: 'piece',
          nameAr: 'قطعة',
          nameEn: 'Piece',
          multiplier: 1,
          defaultPrice: parseFloat(catalogItem.price)
        });
        units.push({
          id: 'box',
          nameAr: `علبة (${mult} قطع)`,
          nameEn: `Box (${mult} Pieces)`,
          multiplier: mult,
          defaultPrice: parseFloat(childPack.price)
        });
        return units;
      }
    }

    // 3. If item has existing selling_unit, preserve it and offer standard alternative
    if (item.selling_unit) {
      units.push({
        id: item.selling_unit.includes('علبة') ? 'box' : 'piece',
        nameAr: item.selling_unit,
        nameEn: item.selling_unit,
        multiplier: item.unit_multiplier || 1,
        defaultPrice: item.price
      });
      if (!item.selling_unit.includes('علبة')) {
        units.push({
          id: 'box',
          nameAr: 'علبة (Box)',
          nameEn: 'Box',
          multiplier: 3,
          defaultPrice: Math.round(item.price * 2.5)
        });
      }
      if (!item.selling_unit.includes('قطعة')) {
        units.push({
          id: 'piece',
          nameAr: 'قطعة (Piece)',
          nameEn: 'Piece',
          multiplier: 1,
          defaultPrice: Math.max(1, Math.round(item.price / 3))
        });
      }
      return units;
    }

    // Default units available for standard products
    return [
      { id: 'piece', nameAr: 'قطعة (Piece)', nameEn: 'Piece', multiplier: 1, defaultPrice: item.price },
      { id: 'box', nameAr: 'علبة (Box)', nameEn: 'Box', multiplier: 3, defaultPrice: Math.round(item.price * 2.5) }
    ];
  };

  // Item handlers
  const handleUpdateItemQuantity = (index, newQty) => {
    const val = Math.max(1, parseInt(newQty) || 1);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: val } : item))
    );
  };

  const handleUpdateItemPrice = (index, newPrice) => {
    const val = Math.max(0, parseFloat(newPrice) || 0);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, price: val } : item))
    );
  };

  /**
   * CRITICAL FIX FOR BUG 2:
   * Changing selling unit MUST NEVER change product identity (productId, name, image)!
   * NEVER looks up by price across all products.
   */
  const handleUpdateItemSellingUnit = (index, selectedUnitKey) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const availableUnits = getAvailableSellingUnits(item, catalogProducts);
        const chosenUnit = availableUnits.find((u) => u.id === selectedUnitKey);
        if (!chosenUnit) return item;

        // Strictly preserve canonical product identity:
        return {
          ...item,
          productId: item.productId || item.id,
          id: item.productId || item.id,
          name_ar: item.name_ar,
          name_en: item.name_en,
          image_url: item.image_url,
          is_accessory: item.is_accessory,
          // Updated selling unit attributes:
          selling_unit: chosenUnit.nameAr,
          selling_unit_id: chosenUnit.id,
          unit_multiplier: chosenUnit.multiplier,
          price: chosenUnit.defaultPrice !== undefined ? chosenUnit.defaultPrice : item.price
        };
      })
    );
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      if (!window.confirm(isRtl ? 'هذا هو المنتج الأخير في الطلب. هل تريد حذفه؟' : 'This is the last item in the order. Delete it?')) {
        return;
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProductFromCatalog = (product) => {
    const isBundle = Boolean(product.is_bundle || isBundleProduct(product.id));
    const bDef = isBundle ? getBundleDefinition(product.id) : null;
    const existingIndex = items.findIndex((it) => (it.productId || it.id) === product.id);
    if (existingIndex >= 0) {
      handleUpdateItemQuantity(existingIndex, items[existingIndex].quantity + 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          lineId: `line_${Date.now()}_${product.id}`,
          id: product.id,
          productId: product.id,
          name_ar: product.name_ar,
          name_en: product.name_en,
          price: parseFloat(product.price) || 0,
          quantity: 1,
          image_url: product.image_url || product.main_image_url || '',
          selling_unit: isBundle ? (isRtl ? 'بكج متكامل' : 'Bundle') : 'قطعة',
          selling_unit_id: isBundle ? 'bundle' : 'piece',
          unit_multiplier: 1,
          is_accessory: false,
          is_bundle: isBundle,
          bundle_id: isBundle ? product.id : null,
          bundle_components: isBundle ? (bDef?.components || []) : null
        }
      ]);
    }
    setShowCatalogPicker(false);
    setCatalogSearch('');
  };

  // Filtered Catalog
  const filteredCatalog = catalogProducts.filter((p) => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      (p.name_ar || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q)
    );
  });

  // Save changes
  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg(isRtl ? 'لا يمكن حفظ طلب بدون أي منتجات' : 'Cannot save an empty order');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      // 1. Prepare diff and history entry
      const editEntry = createEditHistoryEntry({
        editor: 'Admin',
        previousOrder: order,
        newItems: items,
        newTotalPrice: grandTotal,
        notes: notes !== order.notes ? notes : undefined,
        status: status
      });

      const updatedStatusNote = buildUpdatedStatusNote(order, editEntry, {
        last_admin_edit_at: new Date().toISOString()
      });

      // 2. Update orders table (same order ID, preserving canonical productId & bundle metadata)
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_phone_secondary: customerPhoneSec || null,
        customer_email: customerEmail || null,
        university,
        college,
        address_text: addressText || null,
        notes: notes || null,
        status,
        shipping_fee: parseFloat(shippingFee) || 0,
        discount_amount: parseFloat(discountAmount) || 0,
        subtotal: subtotal,
        total_price: grandTotal,
        items: items.map((it) => {
          const isBundle = Boolean(it.is_bundle || isBundleProduct(it.bundle_id || it.productId || it.id));
          const bDef = isBundle ? getBundleDefinition(it.bundle_id || it.productId || it.id) : null;
          return {
            id: it.productId || it.id,
            productId: it.productId || it.id,
            name_ar: it.name_ar,
            name_en: it.name_en,
            price: it.price,
            quantity: it.quantity,
            image_url: it.image_url,
            selling_unit: it.selling_unit || null,
            selling_unit_id: it.selling_unit_id || null,
            unit_multiplier: it.unit_multiplier || 1,
            is_accessory: Boolean(it.is_accessory),
            is_bundle: isBundle,
            bundle_id: isBundle ? (it.bundle_id || it.productId || it.id) : null,
            bundle_components: isBundle ? (it.bundle_components || bDef?.components || []) : null
          };
        }),
        status_note: updatedStatusNote,
        updated_at: new Date().toISOString()
      };

      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update(orderPayload)
        .eq('id', order.id)
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .single();

      if (updateErr) throw updateErr;

      // 3. Update relational order_items table with canonical product ID & selling unit
      await supabase.from('order_items').delete().eq('order_id', order.id);
      const newOrderItems = items.map((it) => ({
        order_id: order.id,
        product_id: UUID_REGEX.test(String(it.productId || it.id || '')) ? (it.productId || it.id) : null,
        quantity: it.quantity,
        price: it.price
      }));
      if (newOrderItems.length > 0) {
        await supabase.from('order_items').insert(newOrderItems);
      }

      // 4. Send customer notification
      try {
        await supabase.from('notifications').insert({
          user_id: order.user_id || null,
          title_ar: `تعديل تفاصيل الطلب ${order.order_number?.replace(/-/g, '').slice(0, 8)}`,
          title_en: `Order Details Updated ${order.order_number?.replace(/-/g, '').slice(0, 8)}`,
          message_ar: `قامت الإدارة بتحديث تفاصيل طلبيتك، الإجمالي المعدّل هو: ${grandTotal} د.ل`,
          message_en: `Admin updated your order details. Modified total: ${grandTotal} LYD`,
          type: 'order_status'
        });
      } catch (notifErr) {
        console.warn('Notification log error (non-fatal):', notifErr);
      }

      // 5. Notify parent callback & close
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder || { ...order, ...orderPayload });
      }
      onClose();
    } catch (err) {
      console.error('Error saving admin order edit:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '2rem 1rem',
        zIndex: 11000,
        overflowY: 'auto'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '920px',
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          padding: '2rem',
          margin: 'auto 0'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '1rem'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              🛠️ {isRtl ? 'تعديل كامل للطلب' : 'Full Order Editor'} #{order.order_number?.replace(/-/g, '').slice(0, 8)}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              {isRtl
                ? 'تعديل المنتجات، وحدات البيع، الأسعار، الكميات، وبيانات العميل مع الحفظ في سجل التعديلات المعتمد.'
                : 'Modify items, selling units, prices, quantities, and customer details with full audit logging.'}
            </p>
          </div>
          <button onClick={onClose} className="action-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              color: '#ef4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* SECTION 1: Customer & Logistics Info */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
              👤 {isRtl ? 'بيانات العميل والتوصيل' : 'Customer & Delivery Info'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">{isRtl ? 'اسم العميل' : 'Customer Name'}</label>
                <input
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input
                  className="form-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">{isRtl ? 'هاتف احتياطي' : 'Secondary Phone'}</label>
                <input
                  className="form-input"
                  value={customerPhoneSec}
                  onChange={(e) => setCustomerPhoneSec(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  className="form-input"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">{isRtl ? 'الجامعة' : 'University'}</label>
                <input
                  className="form-input"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">{isRtl ? 'الكلية' : 'College'}</label>
                <input
                  className="form-input"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">{isRtl ? 'حالة الطلب' : 'Order Status'}</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="new">{isRtl ? 'طلب جديد' : 'New Order'}</option>
                  <option value="under_review">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                  <option value="accepted">{isRtl ? 'تم القبول' : 'Accepted'}</option>
                  <option value="preparing">{isRtl ? 'جاري التجهيز' : 'Preparing Tools'}</option>
                  <option value="out_for_delivery">{isRtl ? 'خرج للتوصيل' : 'Out for Delivery'}</option>
                  <option value="delivered">{isRtl ? 'تم التسليم' : 'Delivered'}</option>
                  <option value="edit_requested">{isRtl ? 'طلب تعديل قيد المراجعة' : 'Edit Requested'}</option>
                  <option value="editing">{isRtl ? 'قيد التعديل' : 'Editing'}</option>
                  <option value="edited_pending">{isRtl ? 'معدّل - بانتظار الاعتماد' : 'Edited – Awaiting Review'}</option>
                  <option value="updated">{isRtl ? 'تم التحديث والاعتماد' : 'Updated'}</option>
                  <option value="cancelled">{isRtl ? 'ملغي' : 'Cancelled'}</option>
                </select>
              </div>

              <div>
                <label className="form-label">{isRtl ? 'عنوان التوصيل' : 'Delivery Address'}</label>
                <input
                  className="form-input"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Order Items & Pricing */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  📦 {isRtl ? 'منتجات الطلبية ووحدات البيع والأسعار' : 'Order Products, Units & Pricing'} ({items.length})
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {isRtl
                    ? 'يمكنك تبديل وحدة البيع (قطعة / علبة)، تعديل الكمية أو السعر، أو إضافة منتجات جديدة من الكتالوج دون المساس بهوية المنتج.'
                    : 'Switch selling units (piece / box), adjust quantities or unit prices, or add items while strictly preserving product identity.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCatalogPicker((prev) => !prev)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} />
                {isRtl ? 'إضافة منتج من الكتالوج' : 'Add Item from Catalog'}
              </button>
            </div>

            {/* Catalog Picker Dropdown Panel */}
            {showCatalogPicker && (
              <div
                style={{
                  backgroundColor: 'var(--accent)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                    🔍 {isRtl ? 'اختر منتجاً لإضافته إلى الطلبية:' : 'Select a product to add to order:'}
                  </span>
                  <button type="button" onClick={() => setShowCatalogPicker(false)} className="action-btn" style={{ padding: '0.2rem' }}>
                    <X size={14} />
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={isRtl ? 'ابحث عن اسم المنتج...' : 'Search product name...'}
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    style={{ paddingInlineStart: '2.2rem', fontSize: '0.85rem' }}
                  />
                  <Search size={15} style={{ position: 'absolute', [isRtl ? 'right' : 'left']: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>

                {loadingCatalog ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0' }}>
                    {isRtl ? 'جاري تحميل قائمة المنتجات...' : 'Loading catalog items...'}
                  </p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {filteredCatalog.slice(0, 15).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProductFromCatalog(prod)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--surface-color)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          border: '1px solid var(--border-color)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-color)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {(prod.image_url || prod.main_image_url) ? (
                            <img src={prod.image_url || prod.main_image_url} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <Package size={20} color="var(--text-muted)" />
                          )}
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {isRtl ? (prod.name_ar || prod.name_en) : (prod.name_en || prod.name_ar)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                            {prod.price} {isRtl ? 'د.ل' : 'LYD'}
                          </span>
                          <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            + {isRtl ? 'إضافة' : 'Add'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredCatalog.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0' }}>
                        {isRtl ? 'لا توجد منتجات تطابق البحث' : 'No products match search'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Items Table with Selling Unit Column */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                    <th style={{ padding: '0.75rem 1rem' }}>{isRtl ? 'المنتج' : 'Product'}</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '140px' }}>{isRtl ? 'وحدة البيع' : 'Selling Unit'}</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '110px' }}>{isRtl ? 'سعر الوحدة (د.ل)' : 'Unit Price (LYD)'}</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '120px' }}>{isRtl ? 'الكمية' : 'Quantity'}</th>
                    <th style={{ padding: '0.75rem 1rem', width: '110px' }}>{isRtl ? 'الإجمالي' : 'Subtotal'}</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '45px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
                    const availableUnits = getAvailableSellingUnits(item, catalogProducts);
                    const selectedUnitKey = item.selling_unit_id || (item.selling_unit?.includes('علبة') ? 'box' : 'piece');

                    return (
                      <tr key={item.lineId || item.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {/* Title & Image (Strictly preserved) */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                              <Package size={24} color="var(--text-muted)" />
                            )}
                            <div>
                              <p style={{ fontWeight: 700, margin: 0, fontSize: '0.88rem' }}>
                                {isRtl ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)}
                              </p>
                              {item.selling_unit && !item.is_bundle && (
                                <span style={{ fontSize: '0.72rem', color: '#b45309', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.15rem' }}>
                                  {item.selling_unit}
                                </span>
                              )}
                              {item.is_bundle && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#00a896', backgroundColor: 'rgba(0, 168, 150, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', fontWeight: 700, width: 'fit-content' }}>
                                    🎁 {isRtl ? 'بكج متكامل (5 بيرات)' : 'Bundle (5 Burs)'}
                                  </span>
                                  {Array.isArray(item.bundle_components) && item.bundle_components.length > 0 && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                      {item.bundle_components.map(c => isRtl ? (c.nameAr || c.nameEn) : (c.nameEn || c.nameAr)).join(' • ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Selling Unit Selector */}
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <select
                            className="form-input"
                            value={selectedUnitKey}
                            onChange={(e) => handleUpdateItemSellingUnit(idx, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', fontWeight: 600, backgroundColor: 'var(--surface-color)' }}
                            title={isRtl ? 'تبديل وحدة البيع للمنتج' : 'Switch selling unit'}
                          >
                            {availableUnits.map((u) => (
                              <option key={u.id} value={u.id}>
                                {isRtl ? u.nameAr : u.nameEn}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Unit Price Input */}
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            className="form-input"
                            value={item.price}
                            onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                            title={isRtl ? 'تعديل السعر المخصص' : 'Edit custom price'}
                          />
                        </td>

                        {/* Quantity Controls */}
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: 'fit-content' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                              style={{ padding: '0.25rem 0.55rem', border: 'none', background: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(idx, e.target.value)}
                              style={{ width: '40px', textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                              style={{ padding: '0.25rem 0.55rem', border: 'none', background: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Line Total */}
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {lineTotal.toFixed(2)} {isRtl ? 'د.ل' : 'LYD'}
                        </td>

                        {/* Remove Action */}
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                            title={isRtl ? 'حذف المنتج' : 'Remove item'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Financial Calculations & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            {/* Notes */}
            <div>
              <label className="form-label">{isRtl ? 'ملاحظات الطلبية' : 'Order Notes'}</label>
              <textarea
                className="form-input"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRtl ? 'أدخل أي ملاحظات على التعديل أو التوصيل...' : 'Any modification or delivery notes...'}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Calculations Box */}
            <div
              style={{
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'المجموع الفرعي للمنتجات:' : 'Products Subtotal:'}</span>
                <span style={{ fontWeight: 700 }}>{subtotal.toFixed(2)} {isRtl ? 'د.ل' : 'LYD'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'رسوم التوصيل (د.ل):' : 'Shipping Fee (LYD):'}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="form-input"
                  style={{ width: '85px', padding: '0.2rem 0.5rem', fontSize: '0.85rem', textAlign: 'end' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'قيمة الخصم (د.ل):' : 'Discount Amount (LYD):'}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '85px', padding: '0.2rem 0.5rem', fontSize: '0.85rem', textAlign: 'end' }}
                />
              </div>

              <div
                style={{
                  borderTop: '2px dashed var(--border-color)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                  {isRtl ? 'الإجمالي النهائي:' : 'Grand Total:'}
                </span>
                <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}>
                  {grandTotal.toFixed(2)} {isRtl ? 'د.ل' : 'LYD'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.25rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-outline"
              style={{ padding: '0.65rem 1.75rem' }}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.65rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
            >
              <Save size={16} />
              {saving ? (isRtl ? 'جاري حفظ التعديلات...' : 'Saving Changes...') : (isRtl ? 'حفظ وتحديث الطلب' : 'Save & Update Order')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AdminEditOrderModal;
