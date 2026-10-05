import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { parseOrderEditHistory, getOrderStatusMeta } from '../utils/orderEditHelper';
import { History, User, ShieldCheck, Plus, Minus, ArrowRight, ArrowLeft, Clock, AlertCircle } from 'lucide-react';

export const OrderEditHistory = ({ order }) => {
  const { lang, isRtl } = useLanguage();
  const history = parseOrderEditHistory(order);

  if (!order) return null;

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.8rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <History size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              {isRtl ? 'سجل تعديلات الطلبية' : 'Order Edit History'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              {isRtl
                ? 'توثيق كامل لكافة التغييرات التي طرأت على المنتجات والأسعار'
                : 'Complete record of product, quantity, and price adjustments'}
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: history.length > 0 ? 'rgba(59, 130, 246, 0.12)' : 'var(--accent)',
            color: history.length > 0 ? '#2563eb' : 'var(--text-muted)'
          }}
        >
          {history.length} {isRtl ? 'تعديل' : 'Edits'}
        </span>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'var(--text-muted)'
          }}
        >
          <Clock size={32} style={{ opacity: 0.4 }} />
          <p style={{ fontSize: '0.88rem', margin: 0, fontWeight: 500 }}>
            {isRtl
              ? 'الطلبية في حالتها الأصلية، ولم يُجرَ عليها أي تعديل حتى الآن.'
              : 'This order is in its original state with no modifications recorded.'}
          </p>
        </div>
      ) : (
        /* Timeline of Edits */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {history.map((entry, idx) => {
            const isCustomer = entry.editor === 'Customer';
            const statusMeta = getOrderStatusMeta(entry.order_status_at_edit, isRtl);
            const changes = entry.changes || {};
            const added = changes.added || [];
            const removed = changes.removed || [];
            const modified = changes.modified || [];
            const hasDetails = added.length > 0 || removed.length > 0 || modified.length > 0;
            const diff = parseFloat(entry.difference ?? (entry.new_total - entry.previous_total) ?? 0);

            return (
              <div
                key={entry.id || idx}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card, var(--surface-color))',
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
              >
                {/* Meta Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.6rem'
                  }}
                >
                  {/* Editor Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isCustomer ? 'rgba(37, 99, 235, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isCustomer ? '#2563eb' : '#059669',
                        border: `1px solid ${isCustomer ? 'rgba(37, 99, 235, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}
                    >
                      {isCustomer ? <User size={12} /> : <ShieldCheck size={12} />}
                      {isCustomer
                        ? (isRtl ? 'تم التعديل بواسطة: الزبون' : 'Edited by: Customer')
                        : (isRtl ? 'تم التعديل بواسطة: الإدارة' : 'Edited by: Admin')}
                    </span>

                    {/* Status at edit */}
                    {entry.order_status_at_edit && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.color,
                          border: `1px solid ${statusMeta.border}`
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    🕒 {formatDate(entry.timestamp)}
                  </span>
                </div>

                {/* Total Before & After */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--accent)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                    {isRtl ? 'إجمالي الطلب:' : 'Order Total:'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {entry.previous_total} {isRtl ? 'د.ل' : 'LYD'}
                    </span>
                    {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      {entry.new_total} {isRtl ? 'د.ل' : 'LYD'}
                    </span>

                    {diff !== 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: diff > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: diff > 0 ? '#ef4444' : '#10b981'
                        }}
                      >
                        {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} {isRtl ? 'د.ل' : 'LYD'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Breakdown */}
                {hasDetails && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {/* Added Items */}
                    {added.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Plus size={12} /> {isRtl ? 'المنتجات المضافة:' : 'Added Items:'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingInlineStart: '0.75rem' }}>
                          {added.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                              <span>• {isRtl ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)} (×{item.quantity})</span>
                              <span style={{ fontWeight: 700, color: '#10b981' }}>+{(item.price * item.quantity).toFixed(2)} {isRtl ? 'د.ل' : 'LYD'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Removed Items */}
                    {removed.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Minus size={12} /> {isRtl ? 'المنتجات المحذوفة:' : 'Removed Items:'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingInlineStart: '0.75rem' }}>
                          {removed.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                              <span>• {isRtl ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)} (×{item.quantity})</span>
                              <span style={{ fontWeight: 700, color: '#ef4444' }}>-{(item.price * item.quantity).toFixed(2)} {isRtl ? 'د.ل' : 'LYD'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modified Items */}
                    {modified.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          ✏️ {isRtl ? 'الكميات أو الأسعار المعدلة:' : 'Modified Items & Quantities:'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingInlineStart: '0.75rem' }}>
                          {modified.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', flexWrap: 'wrap', gap: '0.3rem' }}>
                              <span>• {isRtl ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)}:</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {item.old_quantity !== item.new_quantity && (
                                  <span style={{ marginInlineEnd: '0.6rem' }}>
                                    {isRtl ? 'الكمية:' : 'Qty:'} {item.old_quantity} ➔ <strong style={{ color: 'var(--primary)' }}>{item.new_quantity}</strong>
                                  </span>
                                )}
                                {Math.abs(item.old_price - item.new_price) > 0.001 && (
                                  <span>
                                    {isRtl ? 'السعر:' : 'Price:'} {item.old_price} ➔ <strong style={{ color: 'var(--primary)' }}>{item.new_price}</strong> {isRtl ? 'د.ل' : 'LYD'}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes attached to edit */}
                {entry.notes && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--surface-color)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      borderInlineStart: '3px solid var(--primary)'
                    }}
                  >
                    💬 <strong>{isRtl ? 'ملاحظات التعديل:' : 'Edit Notes:'}</strong> {entry.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderEditHistory;
