import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import {
  parseOrderVersioning,
  computeOrderComparison,
  buildApproveModificationPayload,
  buildRejectModificationPayload
} from '../utils/orderVersioning';
import {
  X,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Phone,
  FileText,
  Loader2
} from 'lucide-react';

export const AdminReviewEditModal = ({ order, onClose, onOrderUpdated }) => {
  const { isRtl, lang } = useLanguage();

  const { versions, currentVersion, pendingVersion } = useMemo(() => {
    return parseOrderVersioning(order);
  }, [order]);

  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'side_by_side' | 'history'
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Compute detailed diff
  const diff = useMemo(() => {
    if (!currentVersion || !pendingVersion) return null;
    return computeOrderComparison(currentVersion.items || [], pendingVersion.items || []);
  }, [currentVersion, pendingVersion]);

  if (!pendingVersion) {
    return null;
  }

  const currentTotal = parseFloat(currentVersion?.total ?? order.total_price ?? order.total ?? 0);
  const proposedTotal = parseFloat(pendingVersion.total ?? 0);
  const diffTotal = proposedTotal - currentTotal;

  const orderNum = order.order_number ? String(order.order_number).replace(/-/g, '').slice(0, 8) : order.id.slice(0, 8);

  // HANDLE APPROVE
  const handleApprove = async () => {
    setProcessing(true);
    setErrorMsg('');
    try {
      const { updatePayload, targetVersion, stockAdjustments } = buildApproveModificationPayload({
        order,
        versionId: pendingVersion.id,
        adminName: 'الأدمن'
      });

      // 1. Update orders table in Supabase
      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 2. Synchronize relational order_items table with approved version items
      try {
        await supabase.from('order_items').delete().eq('order_id', order.id);
        const newOrderItems = (targetVersion.items || []).map(it => ({
          order_id: order.id,
          product_id: (it.productId && !it.productId.startsWith('line_') && !it.productId.startsWith('custom_')) ? it.productId : null,
          quantity: it.quantity,
          price: it.price,
          selling_unit: it.selling_unit || null
        }));
        if (newOrderItems.length > 0) {
          await supabase.from('order_items').insert(newOrderItems);
        }
      } catch (relErr) {
        console.warn('Sync order_items relation notice:', relErr);
      }

      // 3. Apply stock adjustments for DIFFERENCE ONLY if order is in deducted state
      // (Pending modifications did not alter inventory; now only the diff is adjusted)
      if (stockAdjustments && stockAdjustments.length > 0) {
        for (const adj of stockAdjustments) {
          if (adj.productId && adj.diffUnits !== 0) {
            try {
              // Fetch current stock
              const { data: prodData } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', adj.productId)
                .single();
              if (prodData && prodData.stock_quantity != null) {
                // If diffUnits > 0, customer ordered more -> decrease stock
                // If diffUnits < 0, customer ordered less -> return stock
                const newStock = Math.max(0, prodData.stock_quantity - adj.diffUnits);
                await supabase
                  .from('products')
                  .update({ stock_quantity: newStock })
                  .eq('id', adj.productId);
              }
            } catch (stockErr) {
              console.warn('Stock diff adjustment notice:', stockErr);
            }
          }
        }
      }

      // 4. Send customer notification
      try {
        await supabase.from('notifications').insert({
          user_id: order.user_id || null,
          title_ar: `تمت الموافقة على تعديل الطلبية #${orderNum}`,
          title_en: `Order #${orderNum} Modification Approved`,
          message_ar: `وافقت الإدارة على تعديل طلبيتك #${orderNum} (الإصدار ${targetVersion.version_number}). الإجمالي الجديد: ${proposedTotal.toFixed(2)} د.ل`,
          message_en: `Admin approved your modification for order #${orderNum}. New total: ${proposedTotal.toFixed(2)} LYD`,
          type: 'order_status'
        });
      } catch (_) {}

      if (typeof onOrderUpdated === 'function') {
        onOrderUpdated(updatedOrder || { ...order, ...updatePayload });
      }
      onClose();
    } catch (err) {
      console.error('Error approving order modification:', err);
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء قبول التعديل' : 'Failed to approve modification'));
    } finally {
      setProcessing(false);
    }
  };

  // HANDLE REJECT
  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    setProcessing(true);
    setErrorMsg('');
    try {
      const { updatePayload, targetVersion } = buildRejectModificationPayload({
        order,
        versionId: pendingVersion.id,
        rejectionReason: rejectionReason || 'تم الرفض بواسطة الإدارة',
        adminName: 'الأدمن'
      });

      // Update orders table with rejection status_note (official items remain UNTOUCHED!)
      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Send customer notification
      try {
        await supabase.from('notifications').insert({
          user_id: order.user_id || null,
          title_ar: `تم رفض تعديل الطلبية #${orderNum}`,
          title_en: `Order #${orderNum} Modification Rejected`,
          message_ar: `تم رفض التعديل المقترح للطلبية #${orderNum}. بقيت طلبيتك على نسختها السابقة المعتمدة.${rejectionReason ? ` سبب الرفض: ${rejectionReason}` : ''}`,
          message_en: `Proposed modification for order #${orderNum} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
          type: 'order_status'
        });
      } catch (_) {}

      if (typeof onOrderUpdated === 'function') {
        onOrderUpdated(updatedOrder || { ...order, ...updatePayload });
      }
      onClose();
    } catch (err) {
      console.error('Error rejecting order modification:', err);
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء رفض التعديل' : 'Failed to reject modification'));
    } finally {
      setProcessing(false);
    }
  };

  const formattedSubmittedDate = pendingVersion.created_at
    ? new Date(pendingVersion.created_at).toLocaleString('ar-LY', { dateStyle: 'medium', timeStyle: 'short' })
    : '-';

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
        maxWidth: '820px',
        maxHeight: '92vh',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isRtl ? '🔍 مراجعة التعديل المقترح من العميل' : '🔍 Review Proposed Modification'}
              </h2>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                {isRtl ? `الإصدار ${pendingVersion.version_number} (معلق)` : `Version ${pendingVersion.version_number} (Pending)`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span>#{orderNum}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={13} /> {order.customer_name || 'العميل'}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={13} /> {formattedSubmittedDate}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="action-btn"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '0.4rem',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
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
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              fontSize: '0.85rem'
            }}>
              {errorMsg}
            </div>
          )}

          {/* TOTALS COMPARISON METRIC CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            {/* CURRENT APPROVED TOTAL */}
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                {isRtl ? 'الطلبية الحالية المعتمدة' : 'Current Approved Total'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                {currentTotal.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>د.ل</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                الإصدار {currentVersion?.version_number || 1}
              </div>
            </div>

            {/* PROPOSED TOTAL */}
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
                {isRtl ? 'التعديل المقترح الجديد' : 'Proposed New Total'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
                {proposedTotal.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>د.ل</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                الإصدار {pendingVersion.version_number}
              </div>
            </div>

            {/* DIFFERENCE */}
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: diffTotal > 0 ? 'rgba(22, 163, 74, 0.05)' : (diffTotal < 0 ? 'rgba(234, 88, 12, 0.05)' : '#f8fafc'),
              border: `1px solid ${diffTotal > 0 ? 'rgba(22, 163, 74, 0.25)' : (diffTotal < 0 ? 'rgba(234, 88, 12, 0.25)' : '#e2e8f0')}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: diffTotal > 0 ? '#16a34a' : (diffTotal < 0 ? '#ea580c' : '#64748b') }}>
                {isRtl ? 'الفارق المالي' : 'Difference'}
              </div>
              <div style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: diffTotal > 0 ? '#15803d' : (diffTotal < 0 ? '#c2410c' : '#475569'),
                marginTop: '0.25rem'
              }}>
                {diffTotal > 0 ? `+${diffTotal.toFixed(2)}` : diffTotal.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>د.ل</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                {diffTotal > 0 ? (isRtl ? 'زيادة على الطلبية' : 'Increase') : (diffTotal < 0 ? (isRtl ? 'تخفيض في القيمة' : 'Decrease') : (isRtl ? 'بدون فارق مالي' : 'Same Total'))}
              </div>
            </div>
          </div>

          {/* CUSTOMER NOTES (IF PRESENT) */}
          {pendingVersion.customer_notes && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <FileText size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                  {isRtl ? 'ملاحظة العميل المرفقة مع التعديل:' : 'Customer Note with Modification:'}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#78350f', marginTop: '0.2rem', lineHeight: 1.5 }}>
                  "{pendingVersion.customer_notes}"
                </div>
              </div>
            </div>
          )}

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('diff')}
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'diff' ? 800 : 600,
                color: activeTab === 'diff' ? '#0f172a' : '#64748b',
                borderBottom: activeTab === 'diff' ? '2px solid #0f172a' : '2px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isRtl ? '⚡ ملخص التغييرات الذكي' : '⚡ Intelligent Diff'}
            </button>
            <button
              onClick={() => setActiveTab('side_by_side')}
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'side_by_side' ? 800 : 600,
                color: activeTab === 'side_by_side' ? '#0f172a' : '#64748b',
                borderBottom: activeTab === 'side_by_side' ? '2px solid #0f172a' : '2px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isRtl ? '📋 مقارنة الأصناف الكاملة' : '📋 All Items Comparison'}
            </button>
          </div>

          {/* TAB 1: INTELLIGENT DIFF BREAKDOWN */}
          {activeTab === 'diff' && diff && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* ADDED ITEMS */}
              {diff.added.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span>🟢 {isRtl ? `أصناف مضافة جديدة (+${diff.added.length}):` : `Added Items (+${diff.added.length}):`}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {diff.added.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(22, 163, 74, 0.06)',
                          border: '1px solid rgba(22, 163, 74, 0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>+</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d' }}>
                            {isRtl ? item.name_ar : (item.name_en || item.name_ar)}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            ({item.quantity} × {parseFloat(item.price).toFixed(2)} د.ل)
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>
                          +{(item.quantity * item.price).toFixed(2)} د.ل
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REMOVED ITEMS */}
              {diff.removed.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span>🔴 {isRtl ? `أصناف محذوفة من الطلبية (-${diff.removed.length}):` : `Removed Items (-${diff.removed.length}):`}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {diff.removed.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.06)',
                          border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, color: '#dc2626' }}>-</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c', textDecoration: 'line-through' }}>
                            {isRtl ? item.name_ar : (item.name_en || item.name_ar)}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            ({item.quantity} × {parseFloat(item.price).toFixed(2)} د.ل)
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                          -{(item.quantity * item.price).toFixed(2)} د.ل
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUANTITY CHANGED */}
              {diff.quantityChanged.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span>🔵 {isRtl ? `تغيير في كميات الأصناف (${diff.quantityChanged.length}):` : `Quantity Changed (${diff.quantityChanged.length}):`}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {diff.quantityChanged.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(59, 130, 246, 0.06)',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                            {isRtl ? item.name_ar : (item.name_en || item.name_ar)}:
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563eb' }}>
                            {item.old_quantity} → {item.new_quantity}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ({item.diff_quantity > 0 ? `+${item.diff_quantity}` : item.diff_quantity})
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: item.diff_total > 0 ? '#16a34a' : '#dc2626' }}>
                          {item.diff_total > 0 ? `+${item.diff_total.toFixed(2)}` : item.diff_total.toFixed(2)} د.ل
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SELLING UNIT CHANGED */}
              {diff.unitChanged.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span>🟣 {isRtl ? `تغيير وحدة البيع (${diff.unitChanged.length}):` : `Selling Unit Changed (${diff.unitChanged.length}):`}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {diff.unitChanged.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(124, 58, 237, 0.06)',
                          border: '1px solid rgba(124, 58, 237, 0.2)'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {isRtl ? item.name_ar : (item.name_en || item.name_ar)}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed' }}>
                          {item.old_unit || 'قطعة'} → {item.new_unit || 'علبة'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!diff.hasChanges && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {isRtl ? 'لا توجد فروقات بين النسختين' : 'No changes between versions'}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL ITEMS COMPARISON */}
          {activeTab === 'side_by_side' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Current Version Column */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.6rem' }}>
                  {isRtl ? 'الطلبية المعتمدة حالياً (الإصدار 1)' : 'Current Approved (V1)'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(currentVersion?.items || []).map(it => (
                    <div key={it.productId || it.id} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600 }}>{isRtl ? it.name_ar : it.name_en} ×{it.quantity}</span>
                      <span style={{ fontWeight: 700 }}>{(it.quantity * it.price).toFixed(2)} د.ل</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Version Column */}
              <div style={{ border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '0.85rem', backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem', marginBottom: '0.6rem' }}>
                  {isRtl ? `التعديل المقترح (الإصدار ${pendingVersion.version_number})` : `Proposed (V${pendingVersion.version_number})`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(pendingVersion.items || []).map(it => (
                    <div key={it.productId || it.id} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{isRtl ? it.name_ar : it.name_en} ×{it.quantity}</span>
                      <span style={{ fontWeight: 800, color: '#2563eb' }}>{(it.quantity * it.price).toFixed(2)} د.ل</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REJECTION REASON INPUT (SLIDE-DOWN) */}
          {showRejectInput && (
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b91c1c' }}>
                {isRtl ? 'سبب الرفض (سيتم إرساله للزبون):' : 'Rejection Reason (will be sent to customer):'}
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={isRtl ? 'مثال: أحد الأصناف المضافة غير متوفر حالياً في المخزن...' : 'e.g. Added item is out of stock...'}
                style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #f87171',
                  fontSize: '0.85rem'
                }}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* REJECT BUTTON */}
            <button
              type="button"
              onClick={handleReject}
              disabled={processing}
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {processing && showRejectInput ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              <span>{showRejectInput ? (isRtl ? 'تأكيد رفض التعديل' : 'Confirm Rejection') : (isRtl ? 'رفض التعديل' : 'Reject Edit')}</span>
            </button>

            {/* ACCEPT BUTTON */}
            <button
              type="button"
              onClick={handleApprove}
              disabled={processing}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                backgroundColor: '#16a34a',
                borderColor: '#15803d',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '8px'
              }}
            >
              {processing && !showRejectInput ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{isRtl ? 'قبول التعديل واعتماده كنسخة رسمية' : 'Accept & Approve Modification'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminReviewEditModal;
