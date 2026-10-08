import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import {
  extractOrderItems,
  parseOrderVersioning,
  computeOrderComparison,
  buildSubmitModificationPayload
} from '../utils/orderVersioning';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Send,
  Loader2,
  Info
} from 'lucide-react';

export const CustomerDirectOrderEditor = ({ order, onClose, onModificationSubmitted }) => {
  const { isRtl, lang } = useLanguage();

  const { currentVersion } = useMemo(() => parseOrderVersioning(order), [order]);

  // Initial items from current approved version
  const initialItems = useMemo(() => {
    return (currentVersion?.items && currentVersion.items.length > 0)
      ? currentVersion.items.map(it => ({ ...it }))
      : extractOrderItems(order);
  }, [currentVersion, order]);

  const [items, setItems] = useState(initialItems);
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Catalog Picker for adding new items
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Load catalog products
  useEffect(() => {
    setLoadingCatalog(true);
    supabase
      .from('products')
      .select('id, name_ar, name_en, price, image_url, stock_quantity, unit_multiplier, shared_inventory_product_id, subject_id, year_id')
      .eq('is_active', true)
      .order('name_ar', { ascending: true })
      .then(({ data }) => {
        if (data) setCatalogProducts(data);
        setLoadingCatalog(false);
      })
      .catch((err) => {
        console.warn('Load catalog notice:', err);
        setLoadingCatalog(false);
      });
  }, []);

  // Compute live diff against the current approved order
  const diff = useMemo(() => {
    return computeOrderComparison(currentVersion?.items || initialItems, items);
  }, [currentVersion, initialItems, items]);

  // Shipping & Discount from current order
  const shippingFee = parseFloat(order.shipping_fee || 0);
  const discountAmount = parseFloat(order.discount_amount || 0);

  const proposedSubtotal = diff.proposedSubtotal;
  const proposedTotal = Math.max(0, proposedSubtotal + shippingFee - discountAmount);
  const currentTotal = parseFloat(currentVersion?.total ?? order.total_price ?? order.total ?? 0);
  const totalDifference = proposedTotal - currentTotal;

  // Handlers for modifying items
  const handleQuantityChange = (productId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setItems(prev => prev.map(item => {
      if (item.productId === productId || item.id === productId) {
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const handleIncrement = (productId) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId || item.id === productId) {
        return { ...item, quantity: (parseInt(item.quantity) || 1) + 1 };
      }
      return item;
    }));
  };

  const handleDecrement = (productId) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId || item.id === productId) {
        const cur = parseInt(item.quantity) || 1;
        if (cur <= 1) return item;
        return { ...item, quantity: cur - 1 };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId) => {
    if (items.length <= 1) {
      setErrorMsg(isRtl ? 'لا يمكن تفريغ الطلبية بالكامل. يمكنك إلغاء الطلبية إذا رغبت.' : 'Order cannot be completely empty.');
      return;
    }
    setErrorMsg('');
    setItems(prev => prev.filter(item => item.productId !== productId && item.id !== productId));
  };

  // Switch selling unit (piece vs box)
  const handleSellingUnitChange = (productId, newUnit) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId || item.id === productId) {
        const catalogProd = catalogProducts.find(p => p.id === productId);
        let updatedPrice = item.price;
        const multiplier = catalogProd?.unit_multiplier || item.unit_multiplier || 1;

        if (newUnit === 'علبة' && item.selling_unit !== 'علبة') {
          updatedPrice = multiplier > 1 ? (parseFloat(item.price) * multiplier) : item.price;
        } else if (newUnit !== 'علبة' && item.selling_unit === 'علبة') {
          updatedPrice = multiplier > 1 ? (parseFloat(item.price) / multiplier) : item.price;
        }

        return {
          ...item,
          selling_unit: newUnit,
          selling_unit_id: newUnit === 'علبة' ? 'box' : 'piece',
          price: updatedPrice
        };
      }
      return item;
    }));
  };

  // Add product from catalog
  const handleAddProduct = (prod) => {
    const existing = items.find(it => it.productId === prod.id || it.id === prod.id);
    if (existing) {
      handleIncrement(prod.id);
    } else {
      const newItem = {
        lineId: `new_${prod.id}_${Date.now()}`,
        id: prod.id,
        productId: prod.id,
        name_ar: prod.name_ar,
        name_en: prod.name_en || prod.name_ar,
        price: parseFloat(prod.price || 0),
        quantity: 1,
        image_url: prod.image_url || prod.main_image_url || '',
        selling_unit: prod.unit_multiplier > 1 ? 'علبة' : 'قطعة',
        selling_unit_id: prod.unit_multiplier > 1 ? 'box' : 'piece',
        unit_multiplier: prod.unit_multiplier || 1,
        is_accessory: false
      };
      setItems(prev => [...prev, newItem]);
    }
    setShowCatalogModal(false);
  };

  // Submit direct modification to Supabase as PENDING VERSION
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diff.hasChanges) {
      setErrorMsg(isRtl ? 'لم تقم بإجراء أي تعديل على الطلبية.' : 'No modifications detected.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { status_note, updated_at, newVersion } = buildSubmitModificationPayload({
        order,
        proposedItems: items,
        customerNotes
      });

      // Update Supabase order status_note ONLY. Official order items and total remain untouched!
      const { data, error } = await supabase
        .from('orders')
        .update({
          status_note: status_note,
          updated_at: updated_at
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      // Send admin notification
      try {
        const orderNum = order.order_number ? String(order.order_number).replace(/-/g, '').slice(0, 8) : order.id.slice(0, 8);
        await supabase.from('notifications').insert({
          user_id: null, // Broadcast to admin
          title_ar: `تعديل جديد للطلبية #${orderNum}`,
          title_en: `New Modification for Order #${orderNum}`,
          message_ar: `أرسل العميل ${order.customer_name || ''} تعديلاً للطلبية #${orderNum} (الإصدار ${newVersion.version_number}). الفارق: ${totalDifference > 0 ? '+' : ''}${totalDifference.toFixed(2)} د.ل`,
          message_en: `Customer ${order.customer_name || ''} submitted modification for order #${orderNum} (Version ${newVersion.version_number}).`,
          type: 'order_status'
        });
      } catch (_) {}

      if (typeof onModificationSubmitted === 'function') {
        onModificationSubmitted(data || { ...order, status_note, updated_at });
      }
      onClose();
    } catch (err) {
      console.error('Submit modification error:', err);
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء حفظ التعديل. يرجى المحاولة ثانية.' : 'Failed to submit modification.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered catalog products for picker
  const filteredCatalog = useMemo(() => {
    return catalogProducts.filter(p => {
      const q = catalogSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
        (p.name_en && p.name_en.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [catalogProducts, catalogSearch]);

  const orderNumberDisplay = order.order_number ? String(order.order_number).replace(/-/g, '').slice(0, 8) : order.id.slice(0, 8);

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      direction: isRtl ? 'rtl' : 'ltr'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        backgroundColor: 'var(--surface-color, #ffffff)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        border: '1px solid var(--border-color, #e2e8f0)'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--accent, #f8fafc)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary, #0f172a)', margin: 0 }}>
                {isRtl ? '✏️ تعديل الطلبية المباشر' : '✏️ Direct Order Edit'}
              </h2>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#2563eb',
                border: '1px solid rgba(59, 130, 246, 0.25)'
              }}>
                #{orderNumberDisplay}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}>
              {isRtl
                ? 'عدّل الكميات، أضف أو احذف منتجات، وسيتم إرسال النسخة المقترحة لمراجعة الإدارة دون تغيير طلبيتك الأصلية حتى الموافقة.'
                : 'Modify items directly. The proposed edit will be sent to admin for approval without modifying your original order.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="action-btn"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '0.4rem',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#dc2626',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ACTION BAR: ADD PRODUCT BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
              {isRtl ? `أصناف الطلبية (${items.length}):` : `Order Items (${items.length}):`}
            </span>
            <button
              type="button"
              onClick={() => setShowCatalogModal(true)}
              className="btn btn-outline"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '8px',
                borderColor: 'var(--primary, #0f172a)',
                color: 'var(--primary, #0f172a)',
                fontWeight: 700
              }}
            >
              <Plus size={15} />
              <span>{isRtl ? 'إضافة منتج للطلبية' : 'Add Product'}</span>
            </button>
          </div>

          {/* ITEMS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item) => {
              const lineTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
              const pId = item.productId || item.id;
              const hasMultiUnits = (item.unit_multiplier && item.unit_multiplier > 1);

              return (
                <div
                  key={item.lineId || pId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    gap: '0.85rem'
                  }}
                >
                  {/* Product thumbnail */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_ar}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Package size={22} color="#94a3b8" />
                    )}
                  </div>

                  {/* Name & Unit Price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text-main, #1e293b)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {isRtl ? item.name_ar : (item.name_en || item.name_ar)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '0.15rem' }}>
                      {parseFloat(item.price).toFixed(2)} د.ل {item.selling_unit ? `(${item.selling_unit})` : ''}
                    </div>

                    {/* Selling unit selector if available */}
                    {hasMultiUnits && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <select
                          value={item.selling_unit || 'علبة'}
                          onChange={(e) => handleSellingUnitChange(pId, e.target.value)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="علبة">{isRtl ? `علبة (${item.unit_multiplier} قطع)` : `Box (${item.unit_multiplier} pcs)`}</option>
                          <option value="قطعة">{isRtl ? 'قطعة مفردة' : 'Piece'}</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'var(--accent, #f8fafc)',
                    padding: '0.25rem 0.4rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e2e8f0)'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleDecrement(pId)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Minus size={13} />
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(pId, e.target.value)}
                      style={{
                        width: '36px',
                        textAlign: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleIncrement(pId)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{
                    minWidth: '70px',
                    textAlign: isRtl ? 'left' : 'right',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: 'var(--primary, #0f172a)'
                  }}>
                    {lineTotal.toFixed(2)} د.ل
                  </div>

                  {/* Trash Action */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(pId)}
                    title={isRtl ? 'حذف من الطلبية' : 'Remove from order'}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.35rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* CUSTOMER NOTES / REASON (OPTIONAL) */}
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #334155)', display: 'block', marginBottom: '0.4rem' }}>
              {isRtl ? 'ملاحظات إضافية للإدارة (اختياري):' : 'Notes for Admin (optional):'}
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={isRtl ? 'مثال: يرجى استبدال لون العلبة للون الأزرق أو تأكيد التسليم مبكراً...' : 'e.g. Please confirm box color...'}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.85rem',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* INTELLIGENT DIFF & COMPARISON BAR */}
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'var(--accent, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                {isRtl ? 'الإجمالي الحالي المعتمد:' : 'Current Approved Total:'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                {currentTotal.toFixed(2)} د.ل
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                {isRtl ? 'الإجمالي المقترح بعد التعديل:' : 'Proposed New Total:'}
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary, #0f172a)' }}>
                {proposedTotal.toFixed(2)} د.ل
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '0.5rem'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                {isRtl ? 'الفارق المالي:' : 'Difference:'}
              </span>
              <span style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: totalDifference > 0 ? '#16a34a' : (totalDifference < 0 ? '#ea580c' : '#64748b')
              }}>
                {totalDifference > 0 ? `+${totalDifference.toFixed(2)} د.ل` : (totalDifference < 0 ? `${totalDifference.toFixed(2)} د.ل` : '0.00 د.ل')}
              </span>
            </div>

            {/* Changes tags summary */}
            {diff.hasChanges && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                {diff.added.map(a => (
                  <span key={a.id} style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(22, 163, 74, 0.12)',
                    color: '#16a34a',
                    fontWeight: 700
                  }}>
                    + {isRtl ? a.name_ar : a.name_en} ×{a.quantity}
                  </span>
                ))}
                {diff.removed.map(r => (
                  <span key={r.id} style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#dc2626',
                    fontWeight: 700
                  }}>
                    - {isRtl ? r.name_ar : r.name_en}
                  </span>
                ))}
                {diff.quantityChanged.map(q => (
                  <span key={q.id} style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#2563eb',
                    fontWeight: 700
                  }}>
                    {isRtl ? q.name_ar : q.name_en}: {q.old_quantity} → {q.new_quantity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--surface-color, #ffffff)'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-outline"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !diff.hasChanges}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.75rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: (!diff.hasChanges || submitting) ? 0.6 : 1
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isRtl ? 'جاري إرسال التعديل...' : 'Submitting...'}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{isRtl ? 'إرسال التعديل للمراجعة' : 'Submit Modification'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CATALOG PICKER SUB-MODAL */}
      {showCatalogModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '80vh',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                {isRtl ? 'إضافة منتج من الكتالوج' : 'Add Product from Catalog'}
              </h3>
              <button onClick={() => setShowCatalogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Search input */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#f8fafc',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
              }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder={isRtl ? 'ابحث باسم المنتج...' : 'Search product...'}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Products List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loadingCatalog ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                  <div>{isRtl ? 'جاري تحميل المنتجات...' : 'Loading products...'}</div>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {isRtl ? 'لا توجد منتجات مطابقة' : 'No matching products'}
                </div>
              ) : (
                filteredCatalog.map(prod => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        flexShrink: 0
                      }}>
                        {(prod.image_url || prod.main_image_url) ? (
                          <img src={prod.image_url || prod.main_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={18} color="#94a3b8" style={{ margin: '10px auto' }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isRtl ? prod.name_ar : (prod.name_en || prod.name_ar)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {parseFloat(prod.price).toFixed(2)} د.ل
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px' }}
                    >
                      {isRtl ? '+ إضافة' : '+ Add'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0', textAlign: 'end' }}>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="btn btn-outline"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default CustomerDirectOrderEditor;
