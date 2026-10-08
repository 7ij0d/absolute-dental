import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import InvoiceView from '../components/InvoiceView';
import OrderEditHistory from '../components/OrderEditHistory';
import CustomerDirectOrderEditor from '../components/CustomerDirectOrderEditor';
import { getOrderStatusMeta, normalizeOrderStatus } from '../utils/orderEditHelper';
import { parseOrderVersioning, isOrderEditable } from '../utils/orderVersioning';
import { Search, MapPin, ClipboardList, CheckCircle2, Clock, Truck, ShieldAlert, ArrowRight, ArrowLeft, Edit3, AlertCircle, ShoppingCart, X, Send, Sparkles } from 'lucide-react';

export const OrderTracking = () => {
  const { t, lang, isRtl } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Search parameters
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  
  // Results
  const [order, setOrder] = useState(null);
  const [phoneOrders, setPhoneOrders] = useState([]);
  const [searchMode, setSearchMode] = useState(''); // 'single' or 'multiple'
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Direct Order Editor State
  const [showDirectEditor, setShowDirectEditor] = useState(false);
  const [editNotice, setEditNotice] = useState('');

  // Auto query if parameters exist in URL (e.g. /track?order=SD-12&phone=091)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderParam = queryParams.get('order');
    const phoneParam = queryParams.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
      if (orderParam) {
        setOrderNumber(orderParam);
        handleTrackOrder(null, orderParam, phoneParam);
      } else {
        setOrderNumber('');
        handleTrackOrder(null, '', phoneParam);
      }
    }
  }, [location]);

  const handleTrackOrder = async (e, forceOrder, forcePhone) => {
    if (e) e.preventDefault();
    
    // Use forced params if passed, otherwise fall back to state
    const oNum = forceOrder !== undefined ? forceOrder : orderNumber;
    const oPhone = forcePhone !== undefined ? forcePhone : phone;

    if (!oPhone) return;

    setLoading(true);
    setSearched(true);
    setOrder(null);
    setPhoneOrders([]);

    try {
      if (oNum && oNum.trim()) {
        // Mode 1: Track specific order (flexible numeric match)
        const cleanNum = oNum.trim().replace(/\D/g, '');
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .or(`order_number.eq.${oNum.trim()}${cleanNum ? `,order_number.ilike.%${cleanNum}%` : ''}`)
          .eq('customer_phone', oPhone.trim());
        
        if (data && data.length > 0) {
          setOrder(data[0]);
        }
        setSearchMode('single');
      } else {
        // Mode 2: Search all orders by phone number
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_phone', oPhone.trim())
          .order('created_at', { ascending: false });

        if (data) {
          setPhoneOrders(data);
        }
        setSearchMode('multiple');
      }
    } catch (err) {
      console.error('Order tracking lookup error', err);
      setSearchMode('single');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = async (orderItem) => {
    setLoading(true);
    setOrderNumber(orderItem.order_number);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('id', orderItem.id)
        .single();
      
      if (data) {
        setOrder(data);
        setSearchMode('single');
      }
    } catch (err) {
      console.error('Failed to load selected order details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModificationSubmitted = (updatedOrder) => {
    setOrder(updatedOrder);
    setEditNotice(isRtl ? 'تم إرسال تعديل الطلبية للمراجعة بنجاح' : 'Order modification submitted for review');
  };

  // Status mapping to timeline steps (0-5 index)
  const statusSteps = [
    { key: 'pending_review', label_ar: 'في انتظار المراجعة', label_en: 'Pending Review', icon: Clock },
    { key: 'accepted', label_ar: 'تم قبول الطلب', label_en: 'Accepted', icon: CheckCircle2 },
    { key: 'preparing', label_ar: 'جاري التجهيز', label_en: 'Preparing Tools', icon: ClipboardList },
    { key: 'ready_for_delivery', label_ar: 'جاهز للتوصيل', label_en: 'Ready for Delivery', icon: CheckCircle2 },
    { key: 'out_for_delivery', label_ar: 'خرج للتوصيل', label_en: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label_ar: 'تم التسليم', label_en: 'Delivered', icon: CheckCircle2 }
  ];

  const getActiveStepIndex = (status) => {
    const k = normalizeOrderStatus(status);
    if (k === 'cancelled' || k === 'rejected') return -1;
    if (status === 'edit_requested' || status === 'editing' || status === 'edited_pending') return 0;
    if (status === 'updated') return 1;
    return statusSteps.findIndex((step) => step.key === k);
  };

  const activeIndex = order ? getActiveStepIndex(order.status) : -1;

  return (
    <div className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('tracking.title')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {t('tracking.search_desc')}
        </p>
      </div>

      {/* Query inputs card */}
      <form
        onSubmit={(e) => handleTrackOrder(e)}
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface-color)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          alignItems: 'end',
          gap: '1rem'
        }}
        className="tracking-form-row"
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            {t('tracking.order_number')} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('tracking.optional')}</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="SD-XXXXX-XXXX"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t('checkout.phone')} *</label>
          <input
            type="tel"
            required
            className="form-input"
            placeholder="09XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', gap: '0.5rem' }}>
          <Search size={18} />
          {t('tracking.track_btn')}
        </button>
      </form>

      {/* Phone Number Results List */}
      {!loading && searchMode === 'multiple' && (
        <div className="card animate-fade-in" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {t('tracking.phone_search_results')}
            </h3>
          </div>

          {phoneOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--danger)' }}>
              <ShieldAlert size={40} style={{ margin: '0 auto 1rem auto' }} />
              <p>{t('tracking.no_orders_phone')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {phoneOrders.map((o) => {
                const formattedDate = new Date(o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                // Status styling helpers
                const getStatusBadgeColor = (status) => {
                  if (status === 'delivered') return 'rgba(34, 197, 94, 0.15)';
                  if (status === 'cancelled') return 'rgba(239, 68, 68, 0.15)';
                  return 'rgba(59, 130, 246, 0.15)';
                };
                const getStatusTextColor = (status) => {
                  if (status === 'delivered') return 'var(--success)';
                  if (status === 'cancelled') return 'var(--danger)';
                  return 'var(--secondary)';
                };

                return (
                  <div
                    key={o.order_number}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.2rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-color)',
                      transition: 'var(--transition-smooth)',
                      cursor: 'pointer'
                    }}
                    className="recent-order-item"
                    onClick={() => handleSelectOrder(o)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1.05rem' }}>
                        {o.order_number}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formattedDate} • {o.total_price} {t('cart.currency')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: getStatusBadgeColor(o.status),
                          color: getStatusTextColor(o.status)
                        }}
                      >
                        {t(`tracking.status_${o.status}`)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        {t('tracking.track_now')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tracking results display */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
          <div className="skeleton" style={{ height: '120px', width: '100%' }}></div>
          <div className="skeleton" style={{ height: '300px', width: '100%' }}></div>
        </div>
      ) : searched && !order && searchMode === 'single' ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--danger)', backgroundColor: 'var(--surface-color)' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 1rem auto' }} />
          <h3>{t('tracking.not_found')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            يرجى التأكد من رقم الطلب (SD-XXXXX-XXXX) ومطابقة رقم الهاتف المدخل عند الشراء.
          </p>
        </div>
      ) : order ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="animate-fade-in">

          {/* Back to Results List Button (only if we did a phone list query earlier) */}
          {phoneOrders.length > 0 && (
            <button
              onClick={() => { setSearchMode('multiple'); setOrder(null); }}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: 'var(--surface-color)' }}
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
              {lang === 'ar' ? 'العودة لقائمة الطلبات' : 'Back to Orders List'}
            </button>
          )}
          
          {/* Cancelled Alert Banner */}
          {order.status === 'cancelled' && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'center' }}>
              {t('tracking.status_cancelled')} - هذا الطلب قد تم إلغاؤه من قبل الإدارة.
            </div>
          )}

          {/* Timeline chart block */}
          {order.status !== 'cancelled' && (
            <div className="card" style={{ padding: '2rem 1.5rem', backgroundColor: 'var(--surface-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {t('tracking.timeline')}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 1rem' }} className="timeline-flow">
                {/* Horizontal connection line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '5%',
                    right: '5%',
                    height: '4px',
                    backgroundColor: 'var(--border-color)',
                    zIndex: 1
                  }}
                  className="timeline-line-bg"
                ></div>
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: isRtl ? 'auto' : '5%',
                    right: isRtl ? '5%' : 'auto',
                    width: `${(activeIndex / 5) * 90}%`,
                    height: '4px',
                    backgroundColor: 'var(--secondary)',
                    transition: 'width 0.8s ease-in-out',
                    zIndex: 2
                  }}
                  className="timeline-line-active"
                ></div>

                {statusSteps.map((step, idx) => {
                  const IconComponent = step.icon;
                  const isCompleted = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.6rem',
                        zIndex: 3,
                        flex: 1,
                        textAlign: 'center'
                      }}
                    >
                      {/* Step Bubble icon */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: isCompleted ? 'var(--secondary)' : 'var(--surface-color)',
                          color: isCompleted ? 'white' : 'var(--text-muted)',
                          border: `3px solid ${isCurrent ? 'var(--primary)' : 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isCurrent ? '0 0 0 4px var(--accent)' : 'none',
                          transition: 'all 0.4s ease'
                        }}
                      >
                        <IconComponent size={18} />
                      </div>

                      {/* Text Step labels */}
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isCurrent ? 800 : (isCompleted ? 600 : 500),
                          color: isCurrent ? 'var(--primary)' : (isCompleted ? 'var(--text-main)' : 'var(--text-muted)')
                        }}
                      >
                        {lang === 'ar' ? step.label_ar : step.label_en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit Order Notice Banner */}
          {editNotice && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid #10b981',
                borderRadius: 'var(--radius-md)',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
              className="animate-fade-in"
            >
              <CheckCircle2 size={18} />
              <span>{editNotice}</span>
            </div>
          )}

          {/* DIRECT ORDER EDITING & VERSIONING WORKFLOW */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {(() => {
              const versioning = parseOrderVersioning(order);
              const editPerm = isOrderEditable(order);
              const pendingVer = versioning?.pendingVersion;
              const rejectedVer = versioning?.versions?.find(v => v.status === 'rejected');
              const currentVer = versioning?.currentVersion;

              // CASE 1: Pending modification awaiting admin approval
              if (pendingVer) {
                const diff = pendingVer.diff || {};
                const currentTot = currentVer?.total || parseFloat(order.total_price || 0);
                const proposedTot = pendingVer.total || 0;
                const diffTot = proposedTot - currentTot;

                return (
                  <div style={{
                    padding: '1.2rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontWeight: 800, fontSize: '0.98rem' }}>
                        <Clock size={18} />
                        <span>{isRtl ? `⏳ تعديل الطلبية قيد المراجعة (الإصدار ${pendingVer.version_number})` : `⏳ Order Modification Under Review (Version ${pendingVer.version_number})`}</span>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#b45309'
                      }}>
                        {isRtl ? 'في انتظار موافقة الإدارة' : 'Awaiting Admin Approval'}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      {isRtl
                        ? 'تم إرسال تعديلك بنجاح وهو بانتظار المراجعة والاعتماد من قبل الإدارة. ستبقى الطلبية الرسمية بالنسخة الحالية حتى يتم قبول التعديل.'
                        : 'Your proposed modification has been submitted and is awaiting admin review. The official order remains active on its current version until approved.'}
                    </p>

                    {/* Preview difference card */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {isRtl ? 'الإجمالي الحالي:' : 'Current:'} <span style={{ fontWeight: 700, color: '#0f172a' }}>{currentTot.toFixed(2)} د.ل</span>
                        {' ➔ '}
                        {isRtl ? 'المقترح بعد التعديل:' : 'Proposed:'} <span style={{ fontWeight: 800, color: '#2563eb' }}>{proposedTot.toFixed(2)} د.ل</span>
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: diffTot > 0 ? '#16a34a' : (diffTot < 0 ? '#ea580c' : '#64748b')
                      }}>
                        {isRtl ? 'الفارق:' : 'Diff:'} {diffTot > 0 ? `+${diffTot.toFixed(2)}` : diffTot.toFixed(2)} د.ل
                      </div>
                    </div>
                  </div>
                );
              }

              // CASE 2: Main order status allows direct editing
              if (editPerm.editable) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* If previous modification was rejected, show notice */}
                    {rejectedVer && (
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '0.82rem',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <AlertCircle size={16} />
                        <span>
                          {isRtl ? `تم رفض التعديل السابق (الإصدار ${rejectedVer.version_number})${rejectedVer.rejection_reason ? `: ${rejectedVer.rejection_reason}` : ''}. يمكنك تقديم تعديل جديد.` : `Previous edit was rejected. You may submit a new modification.`}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                          {isRtl ? '✏️ تعديل محتويات الطلبية' : '✏️ Modify Order'}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {isRtl
                            ? 'يمكنك إضافة أدوات جديدة، حذف أدوات، وتغيير الكميات مباشرة. سيتم حفظ التعديل كنسخة مقترحة لاعتماد الإدارة.'
                            : 'Modify products, quantities, or units directly. Changes are submitted for admin approval.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDirectEditor(true)}
                        className="btn btn-outline"
                        style={{
                          padding: '0.55rem 1.25rem',
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          borderRadius: '8px',
                          borderColor: 'var(--primary)',
                          color: 'var(--primary)'
                        }}
                      >
                        <Edit3 size={16} />
                        <span>{isRtl ? 'تعديل الطلبية' : 'Edit Order'}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // CASE 3: Locked lifecycle status (preparing, out_for_delivery, delivered, cancelled)
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  <AlertCircle size={16} />
                  <span>{editPerm.reason || (isRtl ? 'هذه الطلبية في مرحلة متقدمة ولا يمكن تعديلها.' : 'This order cannot be modified in its current stage.')}</span>
                </div>
              );
            })()}
          </div>

          {/* CUSTOMER DIRECT ORDER EDITOR MODAL */}
          {showDirectEditor && (
            <CustomerDirectOrderEditor
              order={order}
              onClose={() => setShowDirectEditor(false)}
              onModificationSubmitted={handleModificationSubmitted}
            />
          )}

          {/* Order Edit History Component */}
          <div>
            <OrderEditHistory order={order} />
          </div>

          {/* Sales invoice preview */}
          <div>
            <InvoiceView order={order} />
          </div>

        </div>
      ) : null}

      <style>{`
        .recent-order-item:hover {
          border-color: var(--secondary) !important;
          background-color: var(--accent) !important;
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .delete-recent-btn:hover {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        @media (max-width: 768px) {
          .tracking-form-row {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          .timeline-flow {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1.5rem !important;
            padding-left: 2rem !important;
          }
          .timeline-line-bg, .timeline-line-active {
            display: none !important;
          }
          .timeline-flow > div {
            flex-direction: row !important;
            gap: 1rem !important;
            text-align: start !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTracking;
