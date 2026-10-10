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

export const TRACKING_DELIVERY_TIME_SLOTS = [
  { id: '8:00', value: '8:00 صباحاً', labelAr: '8:00 صباحاً', labelEn: '8:00 AM', periodAr: 'الصباح الباكر', periodEn: 'Early Morning', icon: '🌅' },
  { id: '10:00', value: '10:00 صباحاً', labelAr: '10:00 صباحاً', labelEn: '10:00 AM', periodAr: 'الفترة الصباحية', periodEn: 'Mid-Morning', icon: '☀️' },
  { id: '12:00', value: '12:00 ظهراً', labelAr: '12:00 ظهراً', labelEn: '12:00 PM', periodAr: 'فترة الظهيرة', periodEn: 'Noon', icon: '🕛' },
  { id: '2:00', value: '2:00 ظهراً', labelAr: '2:00 ظهراً', labelEn: '2:00 PM', periodAr: 'بعد الظهر', periodEn: 'Afternoon', icon: '🌤️' },
  { id: 'anytime', value: 'أي وقت يناسبكم', labelAr: 'أي وقت يناسبكم', labelEn: 'Any time suits you', periodAr: 'متاح طوال اليوم', periodEn: 'Flexible all day', icon: '🤝' },
];

export const formatSelectedSlots = (slots, lang = 'ar') => {
  if (!Array.isArray(slots) || slots.length === 0) return lang === 'ar' ? '10:00 صباحاً' : '10:00 AM';
  if (slots.includes('أي وقت يناسبكم')) return lang === 'ar' ? 'أي وقت يناسبكم' : 'Any time suits you';
  const sep = lang === 'ar' ? ' أو ' : ' or ';
  return slots.join(sep);
};

export const parseDeliveryTimeSlots = (rawString) => {
  if (!rawString) return ['10:00 صباحاً'];
  const s = String(rawString).trim();
  if (s.includes('أي وقت') || s.includes('اي وقت') || s.includes('Any time')) {
    return ['أي وقت يناسبكم'];
  }
  const found = [];
  if (s.includes('08:00') || s.includes('8:00')) found.push('8:00 صباحاً');
  if (s.includes('10:00')) found.push('10:00 صباحاً');
  if (s.includes('12:00')) found.push('12:00 ظهراً');
  if (s.includes('02:00') || s.includes('2:00')) found.push('2:00 ظهراً');
  return found.length > 0 ? found : [s];
};

export const toggleTimeSlotSelection = (currentSlots, slotValue) => {
  if (slotValue === 'أي وقت يناسبكم') {
    return ['أي وقت يناسبكم'];
  }
  const base = (currentSlots || []).filter(s => s !== 'أي وقت يناسبكم');
  if (base.includes(slotValue)) {
    if (base.length <= 1) return base;
    return base.filter(s => s !== slotValue);
  } else {
    const chronological = ['8:00 صباحاً', '10:00 صباحاً', '12:00 ظهراً', '2:00 ظهراً'];
    const updated = [...base, slotValue];
    updated.sort((a, b) => chronological.indexOf(a) - chronological.indexOf(b));
    return updated;
  }
};

export const extractOrderTimeSlot = (order) => {
  if (!order) return null;
  const combined = `${order.delivery_notes || ''} ${order.notes || ''}`;
  const match = combined.match(/\[توقيت التسليم المفضل:\s*([^\]]+)\]/);
  if (match && match[1]) return match[1].trim();
  if (combined.includes('أي وقت') || combined.includes('اي وقت')) return 'أي وقت يناسبكم';
  const found = [];
  if (combined.includes('08:00') || combined.includes('8:00')) found.push('8:00 صباحاً');
  if (combined.includes('10:00')) found.push('10:00 صباحاً');
  if (combined.includes('12:00')) found.push('12:00 ظهراً');
  if (combined.includes('02:00') || combined.includes('2:00')) found.push('2:00 ظهراً');
  if (found.length > 0) return found.join(' أو ');
  return null;
};

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

  // Delivery Time Slot Editing State
  const [selectedTimeSlots, setSelectedTimeSlots] = useState(['10:00 صباحاً']);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);
  const [slotFeedback, setSlotFeedback] = useState(null);

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

  // Synchronize preferred delivery time slot when order loads or changes
  useEffect(() => {
    if (order) {
      const existing = extractOrderTimeSlot(order);
      if (existing) {
        setSelectedTimeSlots(parseDeliveryTimeSlots(existing));
      } else {
        setSelectedTimeSlots(['10:00 صباحاً']);
      }
      setSlotFeedback(null);
    }
  }, [order?.id, order?.delivery_notes, order?.notes]);

  const handleSaveDeliveryTimeSlot = async (slotsToSave) => {
    const slotsArray = Array.isArray(slotsToSave) ? slotsToSave : selectedTimeSlots;
    const formattedSlotStr = formatSelectedSlots(slotsArray, 'ar');
    if (!order || !formattedSlotStr || isUpdatingSlot) return;
    setIsUpdatingSlot(true);
    setSlotFeedback(null);

    try {
      const currentNotes = order.notes || '';
      const cleanedNotes = currentNotes.replace(/\[توقيت التسليم المفضل:[^\]]+\]\s*/g, '').trim();
      const newNotes = `[توقيت التسليم المفضل: ${formattedSlotStr}]${cleanedNotes ? ` ${cleanedNotes}` : ''}`;
      const newDeliveryNotes = `[توقيت التسليم المفضل: ${formattedSlotStr}]`;

      // 1. Update database orders table
      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_notes: newDeliveryNotes,
          notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .single();

      if (error) throw error;

      // 2. Dispatch admin notification
      const orderNum = order.order_number
        ? String(order.order_number).replace(/-/g, '').slice(0, 8)
        : String(order.id).slice(0, 8);
      const customerName = order.customer_name || (isRtl ? 'الزبون' : 'Customer');

      try {
        await supabase.from('notifications').insert({
          user_id: null,
          title_ar: `تحديث موعد التسليم للطلب #${orderNum}`,
          title_en: `Delivery Time Slot Updated #${orderNum}`,
          message_ar: `قام الزبون ${customerName} بتحديد/تعديل موعد التسليم المفضل إلى: ${formattedSlotStr} (الطلب #${orderNum}). يرجى مراجعة الطلب وتأكيد الموعد عبر الواتساب.`,
          message_en: `Customer ${customerName} set/updated preferred delivery time slot to: ${formattedSlotStr} for order #${orderNum}.`,
          type: 'order_status',
          is_read: false
        });
      } catch (notifErr) {
        console.warn('Admin notification insert error:', notifErr);
      }

      // 3. Update local state
      if (data) {
        setOrder(data);
      } else {
        setOrder((prev) => ({
          ...prev,
          delivery_notes: newDeliveryNotes,
          notes: newNotes,
          updated_at: new Date().toISOString()
        }));
      }

      setSlotFeedback({
        type: 'success',
        text: isRtl
          ? `✓ تم حفظ وتأكيد موعد التسليم (${formattedSlotStr}) بنجاح! سيتم التواصل معك عبر الواتساب لتأكيد الاستلام.`
          : `✓ Preferred delivery time (${formattedSlotStr}) saved! We will contact you via WhatsApp to confirm.`
      });
    } catch (err) {
      console.error('Error updating delivery time slot:', err);
      setSlotFeedback({
        type: 'error',
        text: isRtl
          ? 'حدث خطأ أثناء حفظ موعد التسليم. يرجى المحاولة مرة أخرى.'
          : 'Failed to update delivery time slot. Please try again.'
      });
    } finally {
      setIsUpdatingSlot(false);
    }
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

          {/* DELIVERY TIME SLOT REVIEW & UPDATE CARD */}
          {(() => {
            const existingSlot = extractOrderTimeSlot(order);
            const isDeliveredOrCancelled = order.status === 'delivered' || order.status === 'cancelled';
            const formattedSelected = formatSelectedSlots(selectedTimeSlots, isRtl ? 'ar' : 'en');
            const hasChanged = existingSlot ? formattedSelected !== existingSlot : true;
            const existingSlotsArray = parseDeliveryTimeSlots(existingSlot);

            return (
              <div
                className="card animate-fade-in"
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent)',
                      color: 'var(--secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-color)'
                    }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                        {isRtl ? 'موعد التسليم المفضل' : 'Preferred Delivery Time Slot'}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        {isRtl
                          ? 'يمكنك تحديد توقيت واحد أو عدة أوقات تناسبك، وسيصل إشعار للإدارة لتأكيد الطلب والموعد عبر الواتساب 📲'
                          : 'Set one or multiple preferred times; admins will receive an update to confirm via WhatsApp 📲'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {existingSlot ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#059669',
                      fontSize: '0.82rem',
                      fontWeight: 800
                    }}>
                      <CheckCircle2 size={15} />
                      <span>{isRtl ? `المعتمد: ${existingSlot}` : `Confirmed: ${existingSlot}`}</span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#d97706',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}>
                      <AlertCircle size={15} />
                      <span>{isRtl ? '⚠️ لم يتم تحديد موعد مسبقاً' : '⚠️ No slot set yet'}</span>
                    </div>
                  )}
                </div>

                {/* Informative flexible multi-selection callout banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#1d4ed8',
                  fontSize: '0.82rem',
                  lineHeight: 1.55
                }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
                  <div>
                    <strong style={{ fontWeight: 800 }}>{isRtl ? 'مرونة المواعيد:' : 'Flexible Timing:'}</strong>{' '}
                    {isRtl
                      ? 'يمكنك اختيار أكثر من توقيت يناسبك (مثلاً: 8:00 و 10:00 صباحاً معاً)، أو اختيار «أي وقت يناسبكم» لتسليمها بالوقت المتاح لفريق العمل.'
                      : 'You can choose multiple times (e.g. 8:00 AM & 10:00 AM together), or select "Any time suits you".'}
                  </div>
                </div>

                {/* Explanatory banner if not set yet */}
                {!existingSlot && !isDeliveredOrCancelled && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#b45309',
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    lineHeight: 1.5
                  }}>
                    <Sparkles size={16} style={{ flexShrink: 0 }} />
                    <span>
                      {isRtl
                        ? 'لم يتم تحديد موعد تسليم عند تأكيد الطلب مسبقاً. حدد الموعد أو الأوقات الأنسب لك واضغط على "تأكيد موعد التسليم".'
                        : 'No delivery time was chosen at checkout. Select your preferred slots below and confirm.'}
                    </span>
                  </div>
                )}

                {/* Feedback Message */}
                {slotFeedback && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: slotFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${slotFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: slotFeedback.type === 'success' ? '#059669' : '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }} className="animate-fade-in">
                    {slotFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{slotFeedback.text}</span>
                  </div>
                )}

                {/* Slots Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {TRACKING_DELIVERY_TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlots.includes(slot.value);
                    const isConfirmed = existingSlotsArray.includes(slot.value);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isDeliveredOrCancelled || isUpdatingSlot}
                        onClick={() => setSelectedTimeSlots(prev => toggleTimeSlotSelection(prev, slot.value))}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '1rem 0.6rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-color)',
                          boxShadow: isSelected
                            ? 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px rgba(104,72,53,0.12)'
                            : 'none',
                          cursor: isDeliveredOrCancelled ? 'not-allowed' : 'pointer',
                          opacity: isDeliveredOrCancelled ? 0.6 : 1,
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          position: 'relative'
                        }}
                      >
                        <span style={{ fontSize: '1.35rem' }}>{slot.icon}</span>
                        <span style={{
                          fontSize: '0.92rem',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          whiteSpace: 'nowrap'
                        }}>
                          {isRtl ? slot.labelAr : slot.labelEn}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {isRtl ? slot.periodAr : slot.periodEn}
                        </span>

                        {isSelected && (
                          <span style={{
                            fontSize: '0.67rem',
                            fontWeight: 800,
                            color: 'var(--secondary)',
                            backgroundColor: 'rgba(104,72,53,0.12)',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            marginTop: '0.2rem'
                          }}>
                            ✓ {isRtl ? 'محدد' : 'Selected'}
                          </span>
                        )}

                        {isConfirmed && !isSelected && (
                          <span style={{
                            fontSize: '0.67rem',
                            fontWeight: 800,
                            color: '#059669',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            marginTop: '0.2rem'
                          }}>
                            {isRtl ? 'المعتمد سابقاً' : 'Previous'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Slots Summary Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isRtl ? 'المواعيد المحددة للطلب:' : 'Selected slots for order:'}
                  </span>
                  <strong style={{ color: 'var(--secondary)', fontWeight: 800 }}>
                    {formattedSelected}
                  </strong>
                </div>

                {/* Footer Controls & WhatsApp Notice */}
                {!isDeliveredOrCancelled ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.85rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📲</span>
                      <span>
                        {isRtl
                          ? 'عند حفظ الموعد، ستتلقى الإدارة إشعاراً فورياً لتأكيد طلبك وموعد التسليم عبر الواتساب.'
                          : 'When saved, admins receive an update to confirm your order and delivery via WhatsApp.'}
                      </span>
                    </div>

                    {hasChanged || !existingSlot ? (
                      <button
                        type="button"
                        disabled={isUpdatingSlot}
                        onClick={() => handleSaveDeliveryTimeSlot(selectedTimeSlots)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.65rem 1.4rem',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          gap: '0.5rem',
                          boxShadow: '0 2px 8px rgba(104,72,53,0.2)'
                        }}
                      >
                        {isUpdatingSlot ? (
                          <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>
                              {!existingSlot
                                ? (isRtl ? `تأكيد موعد التسليم (${formattedSelected})` : `Confirm Delivery Time (${formattedSelected})`)
                                : (isRtl ? `حفظ وتعديل الموعد إلى (${formattedSelected})` : `Save & Update to (${formattedSelected})`)}
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={16} />
                        <span>{isRtl ? `موعدك الحالي (${existingSlot}) معتمد ومسجل` : `Current time (${existingSlot}) confirmed`}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                    {isRtl ? 'لا يمكن تعديل موعد التسليم لأن الطلب تم تسليمه أو إلغاؤه.' : 'Delivery time slot cannot be modified for delivered or cancelled orders.'}
                  </div>
                )}
              </div>
            );
          })()}

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
