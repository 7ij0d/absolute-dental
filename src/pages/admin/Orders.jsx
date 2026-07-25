import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import InvoiceView from '../../components/InvoiceView';
import MapPicker from '../../components/MapPicker';
import { Search, Eye, RefreshCw, Printer, X, ClipboardList, CheckCircle, Trash2, Pencil, Save } from 'lucide-react';

export const Orders = () => {
  const { t, lang, isRtl } = useLanguage();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);

  // Edit Modal
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Load query from URL if redirected from elsewhere (e.g. dashboard link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
    fetchOrders();
  }, [location.search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
    } catch (err) {
      console.error('Error fetching admin order index', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (!error) {
        // Refresh local orders list
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
        );
        
        // Refresh selected details model
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }

        // Add Notification for customer
        const statusTextAr = t(`tracking.status_${newStatus}`);
        const statusTextEn = t(`tracking.status_${newStatus}`);
        
        await supabase.from('notifications').insert({
          user_id: selectedOrder?.user_id || null, // null if guest, will still show up based on matching tokens in general query
          title_ar: `تحديث حالة الطلب #${selectedOrder?.order_number}`,
          title_en: `Order Status Updated #${selectedOrder?.order_number}`,
          message_ar: `حالة طلبك الآن هي: ${statusTextAr}`,
          message_en: `Your order status is now: ${statusTextEn}`,
          type: 'order_status'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطلب #${orderNumber}؟\nThis will permanently delete the order and all its items.`)) return;
    try {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (!error) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
      } else {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    }
  };

  const openEditModal = (ord) => {
    setEditingOrder(ord);
    setEditForm({
      customer_name: ord.customer_name || '',
      customer_phone: ord.customer_phone || '',
      customer_phone_secondary: ord.customer_phone_secondary || '',
      customer_email: ord.customer_email || '',
      university: ord.university || '',
      college: ord.college || '',
      notes: ord.notes || '',
      status: ord.status || 'new',
      shipping_fee: ord.shipping_fee ?? 0,
      discount_amount: ord.discount_amount ?? 0,
      address_text: ord.address_text || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: editForm.customer_name,
          customer_phone: editForm.customer_phone,
          customer_phone_secondary: editForm.customer_phone_secondary,
          customer_email: editForm.customer_email,
          university: editForm.university,
          college: editForm.college,
          notes: editForm.notes,
          status: editForm.status,
          shipping_fee: parseFloat(editForm.shipping_fee) || 0,
          discount_amount: parseFloat(editForm.discount_amount) || 0,
          address_text: editForm.address_text,
        })
        .eq('id', editingOrder.id);

      if (!error) {
        setOrders((prev) => prev.map((o) =>
          o.id === editingOrder.id ? { ...o, ...editForm } : o
        ));
        setEditingOrder(null);
      } else {
        alert('خطأ في الحفظ: ' + error.message);
      }
    } catch (err) {
      alert('خطأ غير متوقع: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Get filtered lists
  const getFilteredOrders = () => {
    let list = [...orders];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ord) =>
          ord.order_number.toLowerCase().includes(q) ||
          ord.customer_name.toLowerCase().includes(q) ||
          ord.customer_phone.includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((ord) => ord.status === statusFilter);
    }

    return list;
  };

  const filteredList = getFilteredOrders();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('admin.orders')}
        </h1>
        <button onClick={fetchOrders} className="action-btn" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Search and Filters row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="orders-action-row">
        
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="البحث بالاسم، رقم الطلب، أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
        </div>

        {/* Filter Dropdown */}
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">جميع حالات الطلبات</option>
          <option value="new">طلبات جديدة</option>
          <option value="under_review">قيد المراجعة</option>
          <option value="accepted">تم القبول</option>
          <option value="preparing">جاري التجهيز</option>
          <option value="out_for_delivery">خرج للتوصيل</option>
          <option value="delivered">تم التسليم</option>
          <option value="cancelled">ملغي</option>
        </select>

      </div>

      {/* Orders Grid/Table List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
          <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-color)' }}>
          لا توجد طلبات تطابق معايير البحث والفلترة.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                <th style={{ padding: '1rem 0.75rem' }}>{t('admin.order_number')}</th>
                <th style={{ padding: '1rem 0.75rem' }}>{t('admin.customer')}</th>
                <th style={{ padding: '1rem 0.75rem' }}>تاريخ الطلب</th>
                <th style={{ padding: '1rem 0.75rem' }}>{t('admin.total')}</th>
                <th style={{ padding: '1rem 0.75rem' }}>الحالة</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>خيارات</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>#{ord.order_number}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <p style={{ fontWeight: 600 }}>{ord.customer_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer_phone}</p>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 800 }}>{ord.total_price} د.ل</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        backgroundColor: ord.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 195, 154, 0.15)',
                        color: ord.status === 'delivered' ? 'var(--success)' : 'var(--secondary)'
                      }}
                    >
                      {t(`tracking.status_${ord.status}`)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* Quick status change */}
                      <select
                        value={ord.status}
                        onChange={(e) => {
                          handleUpdateStatus(ord.id, e.target.value);
                          // optimistic update
                          setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, status: e.target.value } : o));
                        }}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          maxWidth: '110px'
                        }}
                      >
                        <option value="new">جديد</option>
                        <option value="under_review">قيد المراجعة</option>
                        <option value="accepted">تم القبول</option>
                        <option value="preparing">جاري التجهيز</option>
                        <option value="out_for_delivery">خرج للتوصيل</option>
                        <option value="delivered">تم التسليم</option>
                        <option value="cancelled">إلغاء</option>
                      </select>
                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(ord)}
                        title="تعديل الطلب"
                        style={{
                          padding: '0.3rem 0.5rem',
                          fontSize: '0.72rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(99,102,241,0.4)',
                          backgroundColor: 'rgba(99,102,241,0.1)',
                          color: '#6366f1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                      {/* View details */}}
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="btn btn-outline"
                        title="عرض التفاصيل"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', gap: '0.2rem' }}
                      >
                        <Eye size={12} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteOrder(ord.id, ord.order_number)}
                        title="حذف الطلب"
                        style={{
                          padding: '0.3rem 0.5rem',
                          fontSize: '0.72rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(239,68,68,0.4)',
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {editingOrder && createPortal(
        <div
          onClick={() => setEditingOrder(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: '2rem 1rem', zIndex: 10000, overflowY: 'auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              width: '100%', maxWidth: '580px',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                ✏️ تعديل الطلب #{editingOrder.order_number?.slice(0, 12)}
              </h3>
              <button onClick={() => setEditingOrder(null)} className="action-btn"><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">اسم العميل</label>
                <input className="form-input" value={editForm.customer_name} onChange={e => setEditForm(p => ({...p, customer_name: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">رقم الهاتف</label>
                <input className="form-input" value={editForm.customer_phone} onChange={e => setEditForm(p => ({...p, customer_phone: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">رقم احتياطي</label>
                <input className="form-input" value={editForm.customer_phone_secondary} onChange={e => setEditForm(p => ({...p, customer_phone_secondary: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-input" type="email" value={editForm.customer_email} onChange={e => setEditForm(p => ({...p, customer_email: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">الجامعة</label>
                <input className="form-input" value={editForm.university} onChange={e => setEditForm(p => ({...p, university: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">الكلية</label>
                <input className="form-input" value={editForm.college} onChange={e => setEditForm(p => ({...p, college: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">رسوم التوصيل (د.ل)</label>
                <input className="form-input" type="number" value={editForm.shipping_fee} onChange={e => setEditForm(p => ({...p, shipping_fee: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">قيمة الخصم (د.ل)</label>
                <input className="form-input" type="number" value={editForm.discount_amount} onChange={e => setEditForm(p => ({...p, discount_amount: e.target.value}))} />
              </div>
            </div>

            <div>
              <label className="form-label">حالة الطلب</label>
              <select className="form-input" value={editForm.status} onChange={e => setEditForm(p => ({...p, status: e.target.value}))}>
                <option value="new">طلب جديد</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="accepted">تم القبول</option>
                <option value="preparing">جاري التجهيز</option>
                <option value="out_for_delivery">خرج للتوصيل</option>
                <option value="delivered">تم التسليم</option>
                <option value="cancelled">إلغاء الطلب</option>
              </select>
            </div>

            <div>
              <label className="form-label">عنوان التوصيل</label>
              <input className="form-input" value={editForm.address_text} onChange={e => setEditForm(p => ({...p, address_text: e.target.value}))} />
            </div>

            <div>
              <label className="form-label">ملاحظات</label>
              <textarea className="form-input" rows={3} value={editForm.notes} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingOrder(null)} className="btn btn-outline" style={{ padding: '0.6rem 1.5rem' }}>إلغاء</button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={15} />
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* -------------------------------------------------------------
          ORDER DETAILS DRAWER/MODAL
          ------------------------------------------------------------- */}
      {selectedOrder && !showInvoicePrint && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 9999
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '550px',
              backgroundColor: 'var(--surface-color)',
              height: '100%',
              overflowY: 'auto',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>تفاصيل الطلب #{selectedOrder.order_number.slice(0, 12)}...</h3>
              <button onClick={() => setSelectedOrder(null)} className="action-btn">
                <X size={18} />
              </button>
            </div>

            {/* Status updates action */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>{t('admin.change_status')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-input"
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  disabled={updatingStatus}
                  style={{ backgroundColor: 'var(--surface-color)' }}
                >
                  <option value="new">طلب جديد</option>
                  <option value="under_review">قيد المراجعة</option>
                  <option value="accepted">تم القبول</option>
                  <option value="preparing">جاري التجهيز</option>
                  <option value="out_for_delivery">خرج للتوصيل</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="cancelled">إلغاء الطلب</option>
                </select>
                <button
                  onClick={() => setShowInvoicePrint(true)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', gap: '0.3rem' }}
                >
                  <Printer size={16} />
                  الفاتورة
                </button>
              </div>
            </div>

            {/* Customer info */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.6rem' }}>بيانات الطالب</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <p>الاسم: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.customer_name}</strong></p>
                {selectedOrder.customer_email && <p>البريد الإلكتروني: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.customer_email}</strong></p>}
                <p>رقم الهاتف: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.customer_phone}</strong></p>
                {selectedOrder.customer_phone_secondary && <p>الهاتف الاحتياطي: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.customer_phone_secondary}</strong></p>}
                <p>الكلية والجامعة: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.university} - {selectedOrder.college}</strong></p>
              </div>
            </div>

            {/* Map Location */}
            {selectedOrder.latitude && selectedOrder.longitude && (
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.6rem' }}>موقع التوصيل على الخريطة</h4>
                {selectedOrder.address_text && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    backgroundColor: 'var(--accent)', 
                    padding: '0.6rem', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '0.5rem', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-main)', 
                    fontWeight: 600,
                    lineHeight: 1.4
                  }}>
                    📍 {selectedOrder.address_text}
                  </div>
                )}
                <MapPicker
                  latitude={selectedOrder.latitude}
                  longitude={selectedOrder.longitude}
                  readOnly={true}
                  height="180px"
                />
              </div>
            )}

            {/* Ordered Tools */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.6rem' }}>الأدوات والمستلزمات المطلوبة</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedOrder.order_items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                  >
                    <span>
                      {item.products?.name_en || item.name_en}{' '}
                      <strong style={{ color: 'var(--secondary)' }}>x{item.quantity}</strong>
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {item.price} د.ل
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order totals */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الإجمالي الفرعي:</span>
                <span style={{ fontWeight: 600 }}>{(selectedOrder.total_price - selectedOrder.shipping_fee + selectedOrder.discount_amount).toFixed(2)} د.ل</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>قيمة الخصومات:</span>
                  <span style={{ fontWeight: 600 }}>-{selectedOrder.discount_amount.toFixed(2)} د.ل</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>رسوم التوصيل:</span>
                <span style={{ fontWeight: 600 }}>{selectedOrder.shipping_fee} د.ل</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid var(--secondary)', paddingTop: '0.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                <span>الإجمالي الكلي:</span>
                <span>{selectedOrder.total_price} د.ل</span>
              </div>
            </div>

          </div>
        </div>
      , document.body)}

      {/* Invoice modal overlay specifically for printing */}
      {showInvoicePrint && selectedOrder && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-color)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '2rem 1rem'
          }}
        >
          <div className="container" style={{ maxWidth: '800px' }}>
            <button
              onClick={() => setShowInvoicePrint(false)}
              className="btn btn-outline no-print"
              style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              العودة للطلبات / Back
            </button>
            <InvoiceView order={selectedOrder} />
          </div>
        </div>
      , document.body)}

      <style>{`
        @media (max-width: 768px) {
          .orders-action-row {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Orders;
