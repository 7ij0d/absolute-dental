import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Printer, MapPin, Phone, Building, Package } from 'lucide-react';
import brandLogoTrimmed from '../assets/images/brand-logo-trimmed.png';

export const InvoiceView = ({ order }) => {
  const { lang, t, isRtl } = useLanguage();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Safe formatting helpers
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '2rem auto', padding: '1rem' }} className="invoice-container">
      
      {/* Print action header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', gap: '0.5rem' }}>
          <Printer size={16} />
          {t('invoice.print')}
        </button>
      </div>

      {/* Invoice Sheet */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          backgroundColor: '#ffffff',
          color: '#1a1a1a', // solid dark text for prints
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)'
        }}
        id="invoice-print-sheet"
      >
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00a896', paddingBottom: '1.5rem', marginBottom: '1.5rem' }} className="invoice-header-row">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textAlign: isRtl ? 'right' : 'left' }}>
            <img
              src={brandLogoTrimmed}
              alt="Absolute Dental"
              style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0a335c', margin: 0, letterSpacing: '-0.01em' }}>
                Absolute Dental
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                {t('invoice.company')}
              </p>
            </div>
          </div>

          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.4rem 0.8rem',
                backgroundColor: '#e6f6f4',
                color: '#00a896',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.8rem',
                marginBottom: '0.5rem'
              }}
            >
              {order.status ? t(`tracking.status_${order.status}`) : ''}
            </span>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: '#0a335c' }}>
              {order.order_number?.replace(/\D/g, '') || order.order_number}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem' }}>{formatDate(order.created_at)}</p>
          </div>

        </div>

        {/* Customer Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.85rem' }} className="invoice-info-grid">
          
          {/* Company Details */}
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ color: '#0a335c', fontWeight: 700, marginBottom: '0.6rem' }}>Absolute Dental</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#555' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} style={{ color: '#00a896' }} />
                <span>Tripoli, Libya / طرابلس، ليبيا</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} style={{ color: '#00a896' }} />
                <span style={{ fontWeight: 700, letterSpacing: '0.03em' }}>0946859163</span>
              </p>
            </div>
          </div>

          {/* Student details */}
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ color: '#0a335c', fontWeight: 700, marginBottom: '0.6rem' }}>{t('invoice.customer_info')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#555' }}>
              <p style={{ fontWeight: 600, color: '#1a1a1a' }}>{order.customer_name}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} style={{ color: '#00a896' }} />
                <span>{order.customer_phone} {order.customer_phone_secondary ? `/ ${order.customer_phone_secondary}` : ''}</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building size={14} style={{ color: '#00a896' }} />
                <span>{order.university} - {order.college}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Invoice Items Table */}
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#0a335c', borderBottom: '2px solid #e2e8f0', textAlign: isRtl ? 'right' : 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t('invoice.item_name')}</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t('invoice.unit_price')}</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t('invoice.qty')}</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: isRtl ? 'left' : 'right' }}>{t('invoice.total')}</th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items?.length > 0 ? order.order_items : (order.items || [])).map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const snapshotItem = Array.isArray(order.items) ? order.items[index] : null;

                const primaryName = (lang === 'ar'
                  ? (item.products?.name_ar || item.name_ar || snapshotItem?.name_ar)
                  : (item.products?.name_en || item.name_en || snapshotItem?.name_en))
                  || item.products?.name_ar || item.products?.name_en || item.name_ar || item.name_en || snapshotItem?.name_ar || snapshotItem?.name_en || (lang === 'ar' ? 'أداة / مستلزم طب أسنان' : 'Dental Instrument');

                const secondaryName = (lang === 'ar'
                  ? (item.products?.name_en || item.name_en || snapshotItem?.name_en)
                  : (item.products?.name_ar || item.name_ar || snapshotItem?.name_ar));

                const itemImg = item.products?.image_url || item.image_url || snapshotItem?.image_url || null;

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {/* Product Thumbnail */}
                        <div
                          className="invoice-item-thumb-box"
                          style={{
                            width: '48px',
                            height: '48px',
                            minWidth: '48px',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={primaryName}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fb = e.currentTarget.parentElement?.querySelector('.invoice-thumb-fallback');
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="invoice-thumb-fallback"
                            style={{
                              display: itemImg ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                              color: '#94a3b8'
                            }}
                          >
                            <Package size={20} />
                          </div>
                        </div>

                        {/* Product Titles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.35 }}>
                            {primaryName}
                          </span>
                          {secondaryName && secondaryName !== primaryName && (
                            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              {secondaryName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, verticalAlign: 'middle' }}>
                      {item.price} {t('cart.currency')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: isRtl ? 'left' : 'right', fontWeight: 700, color: '#0a335c', verticalAlign: 'middle' }}>
                      {itemTotal} {t('cart.currency')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Cost summaries */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('cart.subtotal')}:</span>
              <span style={{ fontWeight: 600 }}>
                {(order.total_price - order.shipping_fee + order.discount_amount).toFixed(2)} {t('cart.currency')}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                <span>{t('cart.discounts')}:</span>
                <span style={{ fontWeight: 600 }}>
                  -{order.discount_amount.toFixed(2)} {t('cart.currency')}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('cart.shipping')}:</span>
              <span style={{ fontWeight: 600, color: '#00a896' }}>
                {order.shipping_fee > 0
                  ? `${order.shipping_fee} ${t('cart.currency')}`
                  : (order.address_text || order.shipping_fee === 0
                      ? (lang === 'ar' ? 'يتم تحديده عبر الواتساب' : 'Determined via WhatsApp')
                      : (lang === 'ar' ? 'مجاني بالكلية' : 'Free at Faculty'))}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #00a896', paddingTop: '0.6rem', fontSize: '1.1rem', color: '#0a335c', fontWeight: 800 }}>
              <span>{t('cart.total')}:</span>
              <span>
                {(parseFloat(order.total_price) - parseFloat(order.shipping_fee || 0)).toFixed(2)} {t('cart.currency')}
              </span>
            </div>

            <p style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.4rem', lineHeight: 1.4 }}>
              {lang === 'ar'
                ? '*(ملاحظة: تكلفة التوصيل تُضاف وتُحدد عبر الواتساب عند تأكيد الطلب).*'
                : '*(Note: Delivery fee is determined and added via WhatsApp upon order confirmation).*'}
            </p>

          </div>
        </div>

        {/* Notes & Print Footer */}
        {order.notes && (
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '2rem', paddingTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
            <h5 style={{ fontWeight: 700, color: '#0a335c', marginBottom: '0.3rem' }}>{t('checkout.notes')}</h5>
            <p>{order.notes}</p>
          </div>
        )}

        <div style={{ textAlign: 'center', borderTop: '1px dashed #e2e8f0', marginTop: '2rem', paddingTop: '1rem', fontSize: '0.75rem', color: '#888' }}>
          {lang === 'ar' ? 'شكراً لتسوقكم مع Absolute Dental!' : 'Thank you for choosing Absolute Dental!'}
        </div>

      </div>

      <style>{`
        /* Forces standard print constraints */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #invoice-print-sheet, #invoice-print-sheet * {
            visibility: visible;
          }
          #invoice-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .invoice-item-thumb-box {
            border: 1px solid #cbd5e1 !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @media (max-width: 600px) {
          .invoice-header-row, .invoice-info-grid {
            flex-direction: column !important;
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .invoice-container {
            padding: 0 !important;
          }
          #invoice-print-sheet {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceView;

