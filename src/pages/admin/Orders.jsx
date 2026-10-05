import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import InvoiceView from '../../components/InvoiceView';
import MapPicker from '../../components/MapPicker';
import AdminEditOrderModal from '../../components/AdminEditOrderModal';
import OrderEditHistory from '../../components/OrderEditHistory';
import { getOrderStatusMeta } from '../../utils/orderEditHelper';
import {
  Search, Eye, RefreshCw, Printer, X, ClipboardList, CheckCircle,
  Trash2, Pencil, Save, Check, AlertCircle, ArrowUpDown, Calendar,
  TrendingUp, Clock, ChevronLeft, ChevronRight, Filter, AlertTriangle, Layers
} from 'lucide-react';

export const Orders = () => {
  const { t, lang, isRtl } = useLanguage();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateFilter, setDateFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);

  // Edit Modal
  const [editingOrder, setEditingOrder] = useState(null);

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
      // Lightweight, high-performance query fetching only required columns
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          customer_phone_secondary,
          customer_email,
          university,
          college,
          address_text,
          latitude,
          longitude,
          notes,
          status,
          total_price,
          shipping_fee,
          discount_amount,
          items,
          status_note,
          created_at,
          order_items (
            id,
            quantity,
            price,
            products (
              id,
              name_ar,
              name_en,
              main_image_url,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!error && Array.isArray(data)) {
        setOrders(data);
      } else {
        console.warn('Orders optimized query fallback:', error);
        const { data: directData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (directData) setOrders(directData);
      }
    } catch (err) {
      console.error('Error fetching admin order index', err);
      try {
        const { data: directData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (directData) setOrders(directData);
      } catch (_) {}
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
        const statusMeta = getOrderStatusMeta(newStatus, isRtl);
        const targetOrder = orders.find(o => o.id === orderId) || selectedOrder;
        const ordCode = targetOrder?.order_number?.replace(/-/g, '').slice(0, 8) || '';
        
        await supabase.from('notifications').insert({
          user_id: targetOrder?.user_id || null,
          title_ar: `تحديث حالة الطلب ${ordCode}`,
          title_en: `Order Status Updated ${ordCode}`,
          message_ar: `حالة طلبك الآن هي: ${statusMeta.label}`,
          message_en: `Your order status is now: ${statusMeta.label}`,
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
    if (!window.confirm(`هل أنت متأكد من حذف الطلب ${orderNumber?.replace(/-/g, '').slice(0, 8)}؟\nThis will permanently delete the order and all its items.`)) return;
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
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
      setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
    }
    setEditingOrder(null);
  };

  // Compute stats for overview cards and quick filter tabs
  const stats = useMemo(() => {
    const total = orders.length;
    const needsAction = orders.filter((o) => ['new', 'under_review', 'edit_requested', 'edited_pending'].includes(o.status)).length;
    const newOrders = orders.filter((o) => ['new', 'under_review'].includes(o.status)).length;
    const edits = orders.filter((o) => ['edit_requested', 'editing', 'edited_pending', 'updated'].includes(o.status)).length;
    const processing = orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length;
    const shipping = orders.filter((o) => o.status === 'out_for_delivery').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    
    const todayOrders = orders.filter((o) => {
      try {
        return new Date(o.created_at).toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    }).length;

    const totalSales = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);

    return { total, needsAction, newOrders, edits, processing, shipping, delivered, cancelled, todayOrders, totalSales };
  }, [orders]);

  // Filtered & Sorted orders
  const filteredList = useMemo(() => {
    let list = [...orders];

    // Status filter
    if (statusFilter === 'needs_action') {
      list = list.filter((ord) => ['new', 'under_review', 'edit_requested', 'edited_pending'].includes(ord.status));
    } else if (statusFilter === 'new') {
      list = list.filter((ord) => ['new', 'under_review'].includes(ord.status));
    } else if (statusFilter === 'edits') {
      list = list.filter((ord) => ['edit_requested', 'editing', 'edited_pending', 'updated'].includes(ord.status));
    } else if (statusFilter === 'processing') {
      list = list.filter((ord) => ['accepted', 'preparing'].includes(ord.status));
    } else if (statusFilter === 'shipping') {
      list = list.filter((ord) => ord.status === 'out_for_delivery');
    } else if (statusFilter === 'delivered') {
      list = list.filter((ord) => ord.status === 'delivered');
    } else if (statusFilter === 'cancelled') {
      list = list.filter((ord) => ord.status === 'cancelled');
    } else if (statusFilter !== 'all') {
      list = list.filter((ord) => ord.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = now.toDateString();
        list = list.filter((ord) => new Date(ord.created_at).toDateString() === todayStr);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        list = list.filter((ord) => new Date(ord.created_at) >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        list = list.filter((ord) => new Date(ord.created_at) >= monthAgo);
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ord) =>
          (ord.order_number || '').toLowerCase().includes(q) ||
          (ord.customer_name || '').toLowerCase().includes(q) ||
          (ord.customer_phone || '').includes(q) ||
          (ord.customer_email || '').toLowerCase().includes(q) ||
          (ord.university || '').toLowerCase().includes(q) ||
          (ord.college || '').toLowerCase().includes(q) ||
          (ord.address_text || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'price_desc') return (parseFloat(b.total_price) || 0) - (parseFloat(a.total_price) || 0);
      if (sortBy === 'price_asc') return (parseFloat(a.total_price) || 0) - (parseFloat(b.total_price) || 0);
      return new Date(b.created_at) - new Date(a.created_at); // default date_desc
    });

    return list;
  }, [orders, statusFilter, dateFilter, searchQuery, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredList.length / (pageSize === 'all' ? (filteredList.length || 1) : pageSize)) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedList = pageSize === 'all'
    ? filteredList
    : filteredList.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      
      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>📦 {t('admin.orders')}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--accent)', color: 'var(--text-muted)' }}>
              {orders.length}
            </span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {isRtl ? 'فرز وإدارة طلبات المتجر، مراجعة وتعديل الطلبيات، ومتابعة الحالات' : 'Manage store orders, filter fast, review edits, and track status'}
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="btn btn-outline"
          disabled={loading}
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem', borderRadius: 'var(--radius-sm)' }}
          title="تحديث البيانات من السيرفر"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? (isRtl ? 'جاري التحميل...' : 'Refreshing...') : (isRtl ? 'تحديث البيانات' : 'Refresh')}</span>
        </button>
      </div>

      {/* KPI Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
        {/* Card 1: Total */}
        <div
          onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
          className="card"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--surface-color)',
            border: statusFilter === 'all' && dateFilter === 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي الطلبات</span>
            <Layers size={16} style={{ color: 'var(--primary)', opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.total}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>جميع الطلبات المسجلة</span>
        </div>

        {/* Card 2: Needs Action */}
        <div
          onClick={() => setStatusFilter('needs_action')}
          className="card"
          style={{
            padding: '1rem',
            backgroundColor: stats.needsAction > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--surface-color)',
            border: statusFilter === 'needs_action' ? '1.5px solid #ef4444' : stats.needsAction > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: stats.needsAction > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>
              ⚡ بحاجة لإجراء
            </span>
            <AlertCircle size={16} style={{ color: stats.needsAction > 0 ? '#ef4444' : 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.needsAction > 0 ? '#ef4444' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{stats.needsAction}</span>
            {stats.needsAction > 0 && (
              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700 }}>
                مطلوب فحص
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {stats.newOrders} جديدة • {stats.edits} تعديلات
          </span>
        </div>

        {/* Card 3: Today */}
        <div
          onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
          className="card"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--surface-color)',
            border: dateFilter === 'today' ? '1.5px solid var(--secondary)' : '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>طلبات اليوم</span>
            <Clock size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>{stats.todayOrders}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {dateFilter === 'today' ? 'مفعل: طلبات اليوم فقط' : 'اضغط للفلترة لليوم'}
          </span>
        </div>

        {/* Card 4: Sales */}
        <div
          className="card"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي المبيعات النشطة</span>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
            {stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span style={{ fontSize: '0.8rem' }}>د.ل</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>باستثناء الملغية</span>
        </div>
      </div>

      {/* Quick Status Filter Tabs / Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.35rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {[
          { key: 'all', label: 'الكل', count: stats.total, color: 'var(--primary)' },
          { key: 'needs_action', label: '⚡ بحاجة لإجراء', count: stats.needsAction, color: '#ef4444', isAlert: stats.needsAction > 0 },
          { key: 'edits', label: '🟡 طلبات تعديل', count: stats.edits, color: '#d97706' },
          { key: 'new', label: '🔴 جديدة', count: stats.newOrders, color: '#3b82f6' },
          { key: 'processing', label: '⚙️ قيد التجهيز', count: stats.processing, color: 'var(--secondary)' },
          { key: 'shipping', label: '🚚 للتوصيل', count: stats.shipping, color: '#8b5cf6' },
          { key: 'delivered', label: '🟢 تم التسليم', count: stats.delivered, color: 'var(--success)' },
          { key: 'cancelled', label: '⚪ ملغية', count: stats.cancelled, color: '#6b7280' },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '0.45rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: isActive ? 800 : 600,
                borderRadius: 'var(--radius-full)',
                border: isActive
                  ? `1.5px solid ${tab.color}`
                  : tab.isAlert
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid var(--border-color)',
                backgroundColor: isActive
                  ? `${tab.color}15`
                  : tab.isAlert
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'var(--surface-color)',
                color: isActive ? tab.color : 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? tab.color : 'var(--accent)',
                  color: isActive ? '#fff' : 'var(--text-muted)'
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Advanced Controls Toolbar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'var(--surface-color)',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr auto',
          gap: '0.75rem',
          alignItems: 'center'
        }}
        id="orders-toolbar"
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="البحث بالاسم، رقم الطلب، الهاتف، أو الكلية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: searchQuery ? '4.5rem' : '2.5rem', fontSize: '0.82rem' }}
          />
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                left: '2.4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
                display: 'flex'
              }}
              title="مسح البحث"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
          >
            <option value="date_desc">الأحدث أولاً ⏱️</option>
            <option value="date_asc">الأقدم أولاً ⌛</option>
            <option value="price_desc">الأعلى قيمة 💰</option>
            <option value="price_asc">الأقل قيمة 📉</option>
          </select>
        </div>

        {/* Date Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            className="form-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
          >
            <option value="all">جميع الفترات</option>
            <option value="today">طلبات اليوم فقط</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">هذا الشهر (30 يوم)</option>
          </select>
        </div>

        {/* Reset Filters button */}
        {(statusFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim()) && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setDateFilter('all');
              setSearchQuery('');
            }}
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem', whiteSpace: 'nowrap' }}
            title="إعادة تعيين الفلاتر"
          >
            <X size={13} />
            <span>إلغاء الفرز</span>
          </button>
        )}
      </div>

      {/* Results Count Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
        <span>
          عرض <strong style={{ color: 'var(--text-main)' }}>{paginatedList.length}</strong> من أصل <strong style={{ color: 'var(--text-main)' }}>{filteredList.length}</strong> طلبية مطابقة
          {filteredList.length !== orders.length && ` (من إجمالي ${orders.length})`}
        </span>
        {totalPages > 1 && (
          <span>الصفحة {safeCurrentPage} من {totalPages}</span>
        )}
      </div>

      {/* Orders Grid/Table List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
          <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>لا توجد طلبات تطابق معايير البحث والفلترة المحددة.</p>
          <button
            onClick={() => { setStatusFilter('all'); setDateFilter('all'); setSearchQuery(''); }}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1.25rem', borderRadius: 'var(--radius-sm)' }}
          >
            إعادة تعيين جميع الفلاتر
          </button>
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
              {paginatedList.map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>
                    <span style={{ fontFamily: 'monospace', letterSpacing: '0.04em', fontSize: '0.95rem', color: 'var(--primary)' }}>
                      {ord.order_number?.replace(/\D/g, '') || ord.order_number}
                    </span>
                    {ord.order_items?.length > 0 && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                        {ord.order_items.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>•</span>
                            <span>{i.products?.name_ar || i.products?.name_en || i.name_ar || i.name_en || 'منتج'}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(×{i.quantity})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <p style={{ fontWeight: 600 }}>{ord.customer_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer_phone}</p>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 800 }}>{ord.total_price} د.ل</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    {(() => {
                      const meta = getOrderStatusMeta(ord.status, isRtl);
                      return (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: meta.bgColor,
                            color: meta.color,
                            border: `1px solid ${meta.borderColor}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {meta.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* Special quick action for edit_requested */}
                      {ord.status === 'edit_requested' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'editing')}
                          title="الموافقة على طلب الزبون لتعديل الطلب"
                          style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.72rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--success)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 700
                          }}
                        >
                          <Check size={12} />
                          <span>قبول التعديل</span>
                        </button>
                      )}

                      {/* Special quick action for edited_pending */}
                      {ord.status === 'edited_pending' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'updated')}
                          title="اعتماد تعديلات الزبون على الطلبية"
                          style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.72rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#6366f1',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 700
                          }}
                        >
                          <CheckCircle size={12} />
                          <span>اعتماد التعديل</span>
                        </button>
                      )}

                      {/* Quick status change */}
                      <select
                        value={ord.status}
                        onChange={(e) => {
                          handleUpdateStatus(ord.id, e.target.value);
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
                          maxWidth: '120px'
                        }}
                      >
                        <option value="new">جديد</option>
                        <option value="under_review">قيد المراجعة</option>
                        <option value="edit_requested">طلب تعديل</option>
                        <option value="editing">قيد التعديل</option>
                        <option value="edited_pending">بانتظار الاعتماد</option>
                        <option value="updated">تم التحديث</option>
                        <option value="accepted">تم القبول</option>
                        <option value="preparing">جاري التجهيز</option>
                        <option value="out_for_delivery">خرج للتوصيل</option>
                        <option value="delivered">تم التسليم</option>
                        <option value="cancelled">إلغاء</option>
                      </select>
                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(ord)}
                        title="تعديل منتجات وتفاصيل الطلب"
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
                      {/* View details */}
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

          {/* Pagination Controls Footer */}
          {filteredList.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--accent)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>عرض في الصفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">عرض الكل ({filteredList.length})</option>
                </select>
              </div>

              {totalPages > 1 && pageSize !== 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', gap: '0.2rem', opacity: safeCurrentPage === 1 ? 0.4 : 1 }}
                  >
                    {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    <span>السابق</span>
                  </button>

                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 0.5rem' }}>
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', gap: '0.2rem', opacity: safeCurrentPage === totalPages ? 0.4 : 1 }}
                  >
                    <span>التالي</span>
                    {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FULL ADMIN ORDER EDITOR MODAL */}
      {editingOrder && (
        <AdminEditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>تفاصيل الطلب {selectedOrder.order_number?.replace(/-/g, '').slice(0, 8)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="action-btn">
                <X size={18} />
              </button>
            </div>

            {/* Customer Edit Request Banner */}
            {selectedOrder.status === 'edit_requested' && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontWeight: 800, fontSize: '0.9rem' }}>
                  <AlertCircle size={18} />
                  <span>الزبون يطلب تعديل هذا الطلب</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                  عند الموافقة، ستفتح السلة للزبون بنفس المنتجات ليقوم بتعديلها وإعادة إرسالها.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'editing')}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Check size={15} />
                    الموافقة على التعديل (فتح السلة للزبون)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'accepted')}
                    className="btn btn-outline"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
                  >
                    رفض طلب التعديل
                  </button>
                </div>
              </div>
            )}

            {/* Customer Edited - Awaiting Confirmation Banner */}
            {selectedOrder.status === 'edited_pending' && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontWeight: 800, fontSize: '0.9rem' }}>
                  <CheckCircle size={18} />
                  <span>قام الزبون بتعديل الطلب وهو بانتظار اعتمادك النهائي</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                  يمكنك مراجعة التغييرات في سجل التعديلات أدناه، ثم اعتماد التعديل أو تعديله كأدمن.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'updated')}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Check size={15} />
                    اعتماد تعديلات الطلب
                  </button>
                  <button
                    onClick={() => setEditingOrder(selectedOrder)}
                    className="btn btn-outline"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem', color: '#6366f1', borderColor: 'rgba(99,102,241,0.4)' }}
                  >
                    <Pencil size={14} />
                    تعديل إضافي كأدمن
                  </button>
                </div>
              </div>
            )}

            {/* Status updates action */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>{t('admin.change_status')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  disabled={updatingStatus}
                  style={{ backgroundColor: 'var(--surface-color)', flex: 1, minWidth: '150px' }}
                >
                  <option value="new">طلب جديد</option>
                  <option value="under_review">قيد المراجعة</option>
                  <option value="edit_requested">طلب تعديل (بانتظار موافقة)</option>
                  <option value="editing">قيد التعديل (الزبون)</option>
                  <option value="edited_pending">معدل - بانتظار الاعتماد</option>
                  <option value="updated">تم التحديث والاعتماد</option>
                  <option value="accepted">تم القبول</option>
                  <option value="preparing">جاري التجهيز</option>
                  <option value="out_for_delivery">خرج للتوصيل</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="cancelled">إلغاء الطلب</option>
                </select>
                <button
                  onClick={() => setEditingOrder(selectedOrder)}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-sm)', gap: '0.3rem', fontSize: '0.8rem', color: '#6366f1', borderColor: 'rgba(99,102,241,0.4)' }}
                  title="تعديل منتجات الطلب وأسعاره كأدمن"
                >
                  <Pencil size={14} />
                  تعديل الطلب
                </button>
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
                {(selectedOrder.order_items?.length > 0 ? selectedOrder.order_items : (selectedOrder.items || [])).map((item, idx) => {
                  const snapshotItem = Array.isArray(selectedOrder.items) ? selectedOrder.items[idx] : null;
                  const itemName = item.products?.name_en || item.products?.name_ar || item.name_en || item.name_ar || snapshotItem?.name_en || snapshotItem?.name_ar || 'Dental Box / إكسسوار';
                  const itemImg = item.products?.image_url || item.image_url || snapshotItem?.image_url || null;
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--accent)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <ClipboardList size={18} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <span>
                          {itemName}{' '}
                          <strong style={{ color: 'var(--secondary)' }}>x{item.quantity}</strong>
                        </span>
                      </div>
                      <span style={{ fontWeight: 700 }}>
                        {item.price} د.ل
                      </span>
                    </div>
                  );
                })}
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

            {/* Audit Edit History */}
            <OrderEditHistory order={selectedOrder} />

          </div>
        </div>
      , document.body)}

      {/* Invoice modal overlay specifically for printing */}
      {showInvoicePrint && selectedOrder && createPortal(
        <div
          className="invoice-admin-modal-overlay"
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
        @media (max-width: 900px) {
          #orders-toolbar {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          #orders-toolbar {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Orders;
