import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Printer, MapPin, Phone, Building, Package, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import brandLogoTrimmed from '../assets/images/brand-logo-trimmed.png';

export const InvoiceView = ({ order }) => {
  const { lang, t, isRtl } = useLanguage();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!order) return null;

  // Extract clean order number
  const rawOrderNum = order.order_number?.replace(/\D/g, '') || order.order_number || 'Order';
  const pdfFileName = `Absolute_Dental_Invoice_${rawOrderNum}.pdf`;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Absolute_Dental_Invoice_${rawOrderNum}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    const sheetElement = document.getElementById('invoice-print-sheet');
    if (!sheetElement) return;

    setDownloadingPdf(true);
    const originalTitle = document.title;
    document.title = `Absolute_Dental_Invoice_${rawOrderNum}`;

    try {
      // High-res canvas capture (scale: 2 for clean, sharp print rendering)
      const canvas = await html2canvas(sheetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 5000,
        ignoreElements: (element) => element.classList?.contains('no-print')
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const margin = 10; // 10mm margins
      const printWidth = pageWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      let heightLeft = printHeight;
      let position = margin;

      // Page 1
      pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - (margin * 2));

      // Multi-page pagination if invoice spans beyond A4
      while (heightLeft > 0) {
        position = heightLeft - printHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - (margin * 2));
      }

      pdf.save(pdfFileName);
    } catch (err) {
      console.warn('html2canvas/jsPDF export notice, triggering native browser PDF dialog:', err);
      handlePrint();
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
      setDownloadingPdf(false);
    }
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
      
      {/* Action buttons header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1.35rem', gap: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center' }}
          title={lang === 'ar' ? 'حفظ كـ ملف PDF على جهازك' : 'Save PDF to device'}
        >
          {downloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>
            {downloadingPdf
              ? (lang === 'ar' ? 'جاري تجهيز PDF...' : 'Generating PDF...')
              : (lang === 'ar' ? 'حفظ كـ PDF' : 'Save as PDF')}
          </span>
        </button>

        <button
          onClick={handlePrint}
          className="btn btn-outline"
          style={{ padding: '0.65rem 1.25rem', gap: '0.5rem', fontWeight: 700, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center' }}
        >
          <Printer size={16} />
          <span>{t('invoice.print')}</span>
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
        <div className="invoice-table-wrapper" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table className="invoice-items-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
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
                  <tr key={index} className="invoice-table-row" style={{ borderBottom: '1px solid #e2e8f0' }}>
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
        <div className="invoice-totals-section" style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
          <div className="invoice-notes-section" style={{ borderTop: '1px solid #e2e8f0', marginTop: '2rem', paddingTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
            <h5 style={{ fontWeight: 700, color: '#0a335c', marginBottom: '0.3rem' }}>{t('checkout.notes')}</h5>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="invoice-footer-thanks" style={{ textAlign: 'center', borderTop: '1px dashed #e2e8f0', marginTop: '2rem', paddingTop: '1rem', fontSize: '0.75rem', color: '#888' }}>
          {lang === 'ar' ? 'شكراً لتسوقكم مع Absolute Dental!' : 'Thank you for choosing Absolute Dental!'}
        </div>

      </div>

      <style>{`
        /* ═════════════════════════════════════════════════════════════════════
           PRINT ENGINE CONSTRAINTS (A4 PORTRAIT / SAVE AS PDF / MULTI-PAGE)
           ═════════════════════════════════════════════════════════════════════ */
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 1. Global Reset: Remove all screen-only chrome, fixed widgets, footers, & navbars */
          .no-print,
          header,
          footer,
          nav,
          .navbar,
          .mobile-bottom-nav,
          .floating-cart-wrapper,
          .announcement-bar,
          .admin-sidebar-pane,
          aside {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          /* 2. Document & Body: Static, pure white, unconstrained height */
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #1a1a1a !important;
            overflow: visible !important;
          }

          /* 3. Containers Neutralization: Flatten flex wrappers, remove fixed modal overlays */
          #root,
          #app,
          main,
          .container,
          .invoice-container,
          .invoice-admin-modal-overlay {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            inset: auto !important;
            transform: none !important;
            z-index: auto !important;
          }

          /* 4. Invoice Sheet Card: Natural document flow, zero margins, no clipping */
          #invoice-print-sheet {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #1a1a1a !important;
            overflow: visible !important;
            transform: none !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* 5. Table Container: Eliminate overflow scroll container to enable native multi-page pagination */
          .invoice-table-wrapper {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            display: block !important;
            width: 100% !important;
            margin-bottom: 1.5rem !important;
          }

          /* 6. Products Table Pagination & Row Protection */
          .invoice-items-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          .invoice-items-table thead {
            display: table-header-group !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-items-table tbody {
            display: table-row-group !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          .invoice-items-table tfoot {
            display: table-footer-group !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-items-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .invoice-items-table td,
          .invoice-items-table th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-item-thumb-box {
            border: 1px solid #cbd5e1 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-item-thumb-box img {
            max-width: 48px !important;
            max-height: 48px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* 7. Block Integrity: Keep header, customer info, and totals intact without split */
          .invoice-header-row,
          .invoice-info-grid,
          .invoice-totals-section,
          .invoice-notes-section,
          .invoice-footer-thanks {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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

