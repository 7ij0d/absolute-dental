import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import InvoiceView from '../../components/InvoiceView';
import MapPicker from '../../components/MapPicker';
import AdminEditOrderModal from '../../components/AdminEditOrderModal';
import AdminReviewEditModal from '../../components/AdminReviewEditModal';
import OrderEditHistory from '../../components/OrderEditHistory';
import { getOrderStatusMeta, normalizeOrderStatus, createStatusAuditEntry, parseOrderEditHistory } from '../../utils/orderEditHelper';
import { parseOrderVersioning } from '../../utils/orderVersioning';
import {
  Search, Eye, RefreshCw, Printer, X, ClipboardList, CheckCircle,
  Trash2, Pencil, Save, Check, AlertCircle, ArrowUpDown, Calendar,
  TrendingUp, Clock, ChevronLeft, ChevronRight, Filter, AlertTriangle, Layers, Plus
} from 'lucide-react';

export const Orders = () => {
  const { t, lang, isRtl } = useLanguage();
  const location = useLocation();

  const [orders, setOrders] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_orders') || sessionStorage.getItem('abs_admin_cached_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_orders') || sessionStorage.getItem('abs_admin_cached_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch (_) {}
    return true;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  const [reviewingEditOrder, setReviewingEditOrder] = useState(null);

  // Add Order Modal
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    phone: '',
    phone2: '',
    address: 'طرابلس',
    notes: '',
    shippingFee: 0,
    items: []
  });
  const [addingOrderLoading, setAddingOrderLoading] = useState(false);

  // Load query from URL if redirected from elsewhere & establish Realtime channel
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
    fetchOrders(orders.length > 0);
    fetchAvailableProducts();

    // 1. Live Realtime Supabase Subscription: guarantees 2-way instant synchronization
    const ordersChannel = supabase
      .channel('central-admin-orders-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchOrders(true);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setOrders((prev) => {
              const next = prev.map((ord) => (ord.id === updated.id || ord.order_number === updated.order_number ? { ...ord, ...updated } : ord));
              try { localStorage.setItem('abs_admin_cached_orders', JSON.stringify(next)); } catch (_) {}
              return next;
            });
            setSelectedOrder((prev) =>
              prev && (prev.id === updated.id || prev.order_number === updated.order_number) ? { ...prev, ...updated } : prev
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => {
              const next = prev.filter((ord) => ord.id !== payload.old.id);
              try { localStorage.setItem('abs_admin_cached_orders', JSON.stringify(next)); } catch (_) {}
              return next;
            });
            setSelectedOrder((prev) => prev && prev.id === payload.old.id ? null : prev);
          }
        }
      )
      .subscribe();

    // 2. Silent Refresh on tab focus / visibility (never blocks or blanks UI)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') fetchOrders(true);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      supabase.removeChannel(ordersChannel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [location.search]);

  const fetchAvailableProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name_ar, name_en, price, image_url, stock_quantity')
        .eq('is_active', true)
        .order('name_ar');
      if (data && Array.isArray(data)) setAvailableProducts(data);
    } catch (_) {}
  };

  const fetchOrders = async (isSilent = false) => {
    // Only show full-page skeleton if there are NO cached orders to display
    if (!isSilent && orders.length === 0) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Lightweight, high-performance query fetching only required columns with correct database schema
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
              image_url,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!error && Array.isArray(data)) {
        setOrders(data);
        try {
          localStorage.setItem('abs_admin_cached_orders', JSON.stringify(data));
        } catch (_) {}
      } else {
        console.warn('Orders primary query notice:', error);
        const { data: directData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (directData && Array.isArray(directData)) {
          setOrders(directData);
          try {
            localStorage.setItem('abs_admin_cached_orders', JSON.stringify(directData));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error('Error fetching admin order index', err);
      try {
        const { data: directData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (directData && Array.isArray(directData)) {
          setOrders(directData);
          try {
            localStorage.setItem('abs_admin_cached_orders', JSON.stringify(directData));
          } catch (_) {}
        }
      } catch (_) {}
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const targetOrder = orders.find(o => o.id === orderId) || selectedOrder;
      const oldStatus = normalizeOrderStatus(targetOrder?.status);
      const canonicalNewStatus = normalizeOrderStatus(newStatus);

      if (oldStatus === canonicalNewStatus) return;

      const now = new Date();
      const currentUser = 'الأدمن';

      const historyEntry = createStatusAuditEntry({
        fromStatus: getOrderStatusMeta(oldStatus, isRtl).label,
        toStatus: getOrderStatusMeta(canonicalNewStatus, isRtl).label,
        author: currentUser
      });

      const existingHistory = parseOrderEditHistory(targetOrder);
      const updatedHistory = [historyEntry, ...existingHistory];
      const updatedStatusNote = JSON.stringify({
        status_history: updatedHistory,
        last_status_change: historyEntry
      });

      const { error } = await supabase
        .from('orders')
        .update({
          status: canonicalNewStatus,
          status_note: updatedStatusNote,
          updated_at: now.toISOString()
        })
        .eq('id', orderId);

      if (!error) {
        // Refresh local orders list
        setOrders((prev) => {
          const next = prev.map((ord) => (ord.id === orderId ? { ...ord, status: canonicalNewStatus, status_note: updatedStatusNote } : ord));
          try { localStorage.setItem('abs_admin_cached_orders', JSON.stringify(next)); } catch (_) {}
          return next;
        });
        
        // Refresh selected details model
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: canonicalNewStatus, status_note: updatedStatusNote }));
        }

        // Add Notification for customer
        const statusMeta = getOrderStatusMeta(canonicalNewStatus, isRtl);
        const ordCode = targetOrder?.order_number?.replace(/-/g, '').slice(0, 8) || '';
        
        await supabase.from('notifications').insert({
          user_id: targetOrder?.user_id || null,
          title_ar: `تحديث حالة الطلب ${ordCode}`,
          title_en: `Order Status Updated ${ordCode}`,
          message_ar: `حالة طلبك الآن هي: ${statusMeta.label}`,
          message_en: `Your order status is now: ${statusMeta.label}`,
          type: 'order_status'
        });
      } else {
        alert('حدث خطأ أثناء تحديث حالة الطلب: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateAdminOrder = async (e) => {
    e.preventDefault();
    if (newOrderForm.items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل للطلب');
      return;
    }
    setAddingOrderLoading(true);
    try {
      const orderNumber = String(Math.floor(10000000 + Math.random() * 90000000));
      const subtotal = newOrderForm.items.reduce((s, it) => s + (it.price * it.qty), 0);
      const fee = Number(newOrderForm.shippingFee || 0);
      const total = subtotal + fee;

      const orderPayload = {
        order_number: orderNumber,
        customer_name: newOrderForm.customerName.trim(),
        customer_phone: newOrderForm.phone.trim(),
        customer_phone_secondary: newOrderForm.phone2 ? newOrderForm.phone2.trim() : null,
        address_text: newOrderForm.address || 'طرابلس',
        notes: newOrderForm.notes ? `أنشأه الأدمن: ${newOrderForm.notes}` : 'أنشأه الأدمن',
        status: 'pending_review',
        total_price: total,
        subtotal: subtotal,
        shipping_fee: fee,
        payment_method: 'cash_on_delivery',
        is_guest: true
      };

      const { data: created, error } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (error) throw error;

      if (created) {
        // Insert order_items
        const itemsPayload = newOrderForm.items.map(it => ({
          order_id: created.id,
          product_id: it.productId,
          quantity: it.qty,
          price: it.price
        }));

        await supabase.from('order_items').insert(itemsPayload);

        // Reset and close
        setNewOrderForm({
          customerName: '',
          phone: '',
          phone2: '',
          address: 'طرابلس',
          notes: '',
          shippingFee: 0,
          items: []
        });
        setShowAddOrderModal(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('حدث خطأ أثناء إنشاء الطلب: ' + err.message);
    } finally {
      setAddingOrderLoading(false);
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

  // Compute stats for overview cards and quick filter tabs using canonical status keys
  const stats = useMemo(() => {
    const total = orders.length;
    const pendingModifications = orders.filter((o) => parseOrderVersioning(o).hasPending).length;
    const pendingReview = orders.filter((o) => normalizeOrderStatus(o.status) === 'pending_review').length;
    const accepted = orders.filter((o) => normalizeOrderStatus(o.status) === 'accepted').length;
    const preparing = orders.filter((o) => normalizeOrderStatus(o.status) === 'preparing').length;
    const readyForDelivery = orders.filter((o) => normalizeOrderStatus(o.status) === 'ready_for_delivery').length;
    const outForDelivery = orders.filter((o) => normalizeOrderStatus(o.status) === 'out_for_delivery').length;
    const delivered = orders.filter((o) => normalizeOrderStatus(o.status) === 'delivered').length;
    const cancelled = orders.filter((o) => {
      const k = normalizeOrderStatus(o.status);
      return k === 'cancelled' || k === 'rejected';
    }).length;

    const needsAction = pendingReview + pendingModifications;

    const todayOrders = orders.filter((o) => {
      try {
        return new Date(o.created_at).toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    }).length;

    const totalSales = orders
      .filter((o) => {
        const k = normalizeOrderStatus(o.status);
        return k !== 'cancelled' && k !== 'rejected';
      })
      .reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);

    return { total, pendingModifications, pendingReview, accepted, preparing, readyForDelivery, outForDelivery, delivered, cancelled, needsAction, todayOrders, totalSales };
  }, [orders]);

  // Filtered & Sorted orders
  const filteredList = useMemo(() => {
    let list = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_modifications') {
        list = list.filter((ord) => parseOrderVersioning(ord).hasPending);
      } else if (statusFilter === 'needs_action') {
        list = list.filter((ord) => normalizeOrderStatus(ord.status) === 'pending_review' || parseOrderVersioning(ord).hasPending);
      } else if (statusFilter === 'cancelled') {
        list = list.filter((ord) => {
          const k = normalizeOrderStatus(ord.status);
          return k === 'cancelled' || k === 'rejected';
        });
      } else {
        list = list.filter((ord) => normalizeOrderStatus(ord.status) === statusFilter);
      }
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

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddOrderModal(true)}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
          >
            <Plus size={15} />
            <span>{isRtl ? '+ إضافة طلب' : '+ Add Order'}</span>
          </button>
          <button
            onClick={() => fetchOrders(false)}
            className="btn btn-outline"
            disabled={loading || isRefreshing}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem', borderRadius: 'var(--radius-sm)' }}
            title="تحديث البيانات من السيرفر"
          >
            <RefreshCw size={14} className={(loading || isRefreshing) ? 'animate-spin' : ''} />
            <span>{(loading || isRefreshing) ? (isRtl ? 'جاري التحديث...' : 'Refreshing...') : (isRtl ? 'تحديث البيانات' : 'Refresh')}</span>
          </button>
        </div>
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
              ⚡ في انتظار المراجعة
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
            بانتظار قبول الطلب من الإدارة
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
          { key: 'pending_modifications', label: 'تعديلات مقترحة', count: stats.pendingModifications, color: '#ea580c', isAlert: stats.pendingModifications > 0 },
          { key: 'pending_review', label: 'في انتظار المراجعة', count: stats.pendingReview, color: '#f59e0b', isAlert: stats.pendingReview > 0 },
          { key: 'accepted', label: 'تم قبول الطلب', count: stats.accepted, color: '#3b82f6' },
          { key: 'preparing', label: 'جاري التجهيز', count: stats.preparing, color: '#06b6d4' },
          { key: 'ready_for_delivery', label: 'جاهز للتوصيل', count: stats.readyForDelivery, color: '#6366f1' },
          { key: 'out_for_delivery', label: 'خرج للتوصيل', count: stats.outForDelivery, color: '#8b5cf6' },
          { key: 'delivered', label: 'تم التسليم', count: stats.delivered, color: 'var(--success)' },
          { key: 'cancelled', label: 'ملغى / مرفوض', count: stats.cancelled, color: '#ef4444' },
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
              {paginatedList.map((ord) => {
                const versioning = parseOrderVersioning(ord);
                return (
                <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: versioning.hasPending ? 'rgba(234, 88, 12, 0.04)' : undefined }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', letterSpacing: '0.04em', fontSize: '0.95rem', color: 'var(--primary)' }}>
                        {ord.order_number?.replace(/\D/g, '') || ord.order_number}
                      </span>
                      {versioning.hasPending && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            backgroundColor: '#ffedd5',
                            color: '#c2410c',
                            border: '1px solid #fed7aa',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ea580c', display: 'inline-block' }}></span>
                          تعديل مقترح (v{versioning.pendingVersion.version_number})
                        </span>
                      )}
                    </div>
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
                      {/* Direct Proposed Customer Modification Review Action */}
                      {versioning.hasPending && (
                        <button
                          onClick={() => setReviewingEditOrder(ord)}
                          title="مراجعة التعديل المقترح من الزبون واعتماده"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.72rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #ea580c',
                            backgroundColor: '#ea580c',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 800,
                            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.25)'
                          }}
                        >
                          <Layers size={13} />
                          <span>مراجعة التعديل</span>
                        </button>
                      )}

                      {/* Legacy quick action for edit_requested */}
                      {!versioning.hasPending && ord.status === 'edit_requested' && (
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

                      {/* Legacy quick action for edited_pending */}
                      {!versioning.hasPending && ord.status === 'edited_pending' && (
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

                      {/* Quick status change with canonical shared options */}
                      <select
                        value={normalizeOrderStatus(ord.status)}
                        onChange={(e) => {
                          handleUpdateStatus(ord.id, e.target.value);
                        }}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          maxWidth: '125px'
                        }}
                      >
                        <option value="pending_review">في انتظار المراجعة</option>
                        <option value="accepted">تم قبول الطلب</option>
                        <option value="preparing">جاري التجهيز</option>
                        <option value="ready_for_delivery">جاهز للتوصيل</option>
                        <option value="out_for_delivery">خرج للتوصيل</option>
                        <option value="delivered">تم التسليم</option>
                        <option value="cancelled">ملغى</option>
                        <option value="rejected">مرفوض</option>
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
              ); })}
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

      {/* REVIEW PROPOSED CUSTOMER MODIFICATION MODAL */}
      {reviewingEditOrder && (
        <AdminReviewEditModal
          order={reviewingEditOrder}
          onClose={() => setReviewingEditOrder(null)}
          onOrderUpdated={(updated) => {
            handleOrderUpdated(updated);
            setReviewingEditOrder(null);
          }}
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

            {/* Versioned Proposed Customer Edit Banner */}
            {(() => {
              const versioning = parseOrderVersioning(selectedOrder);
              if (versioning.hasPending) {
                const pendingVer = versioning.pendingVersion;
                const currentVer = versioning.currentVersion;
                const oldTot = parseFloat(currentVer?.total ?? selectedOrder.total_price ?? 0);
                const newTot = parseFloat(pendingVer?.total ?? 0);
                const diffTot = newTot - oldTot;

                return (
                  <div style={{
                    padding: '1.1rem',
                    backgroundColor: 'rgba(234, 88, 12, 0.08)',
                    border: '1.5px solid rgba(234, 88, 12, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c', fontWeight: 800, fontSize: '0.95rem' }}>
                        <Layers size={19} />
                        <span>تعديل جديد للطلبية (الإصدار {pendingVer.version_number}) بانتظار مراجعتك واعتمادك</span>
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#ffedd5',
                        color: '#9a3412',
                        border: '1px solid #fed7aa'
                      }}>
                        قيد مراجعة الإدارة
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                      قام الزبون بتعديل كميات أو أصناف هذه الطلبية مباشرة. الطلبية الأصلية لا تزال سارية بالإصدار المعتمد الحالي ({currentVer?.version_number || 1})، ولن يتم اعتماد المنتجات أو المجموع أو خصم الفارق بالمخزون حتى يتم قبول التعديل من طرفك.
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', backgroundColor: 'var(--surface-color)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>المجموع الحالي المعتمد: </span>
                        <strong style={{ color: 'var(--text-main)' }}>{oldTot.toFixed(2)} د.ل</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>المجموع المقترح: </span>
                        <strong style={{ color: '#ea580c' }}>{newTot.toFixed(2)} د.ل</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>الفارق: </span>
                        <strong style={{ color: diffTot > 0 ? '#10b981' : diffTot < 0 ? '#ef4444' : 'var(--text-main)' }}>
                          {diffTot > 0 ? `+${diffTot.toFixed(2)}` : diffTot.toFixed(2)} د.ل
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => setReviewingEditOrder(selectedOrder)}
                        className="btn btn-primary"
                        style={{
                          padding: '0.5rem 1.15rem',
                          fontSize: '0.82rem',
                          gap: '0.45rem',
                          fontWeight: 800,
                          backgroundColor: '#ea580c',
                          borderColor: '#ea580c',
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
                        }}
                      >
                        <Layers size={15} />
                        مراجعة واعتماد التعديل (عرض الفروقات الذكية)
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Legacy fallback for unmigrated edit_requested status */}
            {!parseOrderVersioning(selectedOrder).hasPending && selectedOrder.status === 'edit_requested' && (
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
                  <span>طلب تعديل تقليدي (نظام قديم)</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'editing')}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Check size={15} />
                    فتح الطلب للتعديل
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
                  value={normalizeOrderStatus(selectedOrder.status)}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  disabled={updatingStatus}
                  style={{ backgroundColor: 'var(--surface-color)', flex: 1, minWidth: '160px' }}
                >
                  <option value="pending_review">في انتظار المراجعة</option>
                  <option value="accepted">تم قبول الطلب</option>
                  <option value="preparing">جاري التجهيز</option>
                  <option value="ready_for_delivery">جاهز للتوصيل</option>
                  <option value="out_for_delivery">خرج للتوصيل</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="cancelled">ملغى</option>
                  <option value="rejected">مرفوض</option>
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
                  const snapshotItem = Array.isArray(selectedOrder.items)
                    ? (selectedOrder.items.find((si) =>
                        (si.id && item.product_id && String(si.id) === String(item.product_id)) ||
                        (si.productId && item.product_id && String(si.productId) === String(item.product_id)) ||
                        (si.id && item.id && String(si.id) === String(item.id))
                      ) || selectedOrder.items[idx] || null)
                    : null;
                  const itemName = item.products?.name_en || item.products?.name_ar || item.name_en || item.name_ar || snapshotItem?.name_en || snapshotItem?.name_ar || 'Dental Box / إكسسوار';
                  const itemImg = item.products?.image_url || item.image_url || snapshotItem?.image_url || null;
                  const itemSellingUnit = item.selling_unit || item.sellingUnit || snapshotItem?.selling_unit || snapshotItem?.sellingUnit || null;
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span>{itemName}</span>
                          {itemSellingUnit && (
                            <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#b45309', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              {itemSellingUnit}
                            </span>
                          )}
                          <strong style={{ color: 'var(--secondary)' }}>x{item.quantity}</strong>
                        </div>
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

      {/* 4. Add Order Modal (أنشأه الأدمن) */}
      {showAddOrderModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
            backgroundColor: 'var(--surface-color)', padding: '1.75rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {isRtl ? '➕ إضافة طلب يدوي جديد (أنشأه الأدمن)' : '➕ Add Manual Order (Admin)'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {isRtl ? 'سيتم إدراج الطلب مباشرة في قاعدة البيانات المركزية ليتزامن مع المنظومة فوراً' : 'Order inserted into central DB and synced immediately'}
                </p>
              </div>
              <button onClick={() => setShowAddOrderModal(false)} className="action-btn">
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAdminOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'اسم العميل *' : 'Customer Name *'}</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    placeholder={isRtl ? 'مثال: محمد ساسي' : 'Name'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'رقم الهاتف *' : 'Phone *'}</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={newOrderForm.phone}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                    placeholder="0912345678"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'هاتف إضافي (اختياري)' : 'Secondary Phone'}</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newOrderForm.phone2}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, phone2: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'العنوان / المدينة' : 'Address'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newOrderForm.address}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, address: e.target.value })}
                    placeholder="طرابلس"
                  />
                </div>
              </div>

              {/* Items Selection */}
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    {isRtl ? 'منتجات الطلبية *' : 'Order Products *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (availableProducts.length > 0) {
                        const first = availableProducts[0];
                        setNewOrderForm({
                          ...newOrderForm,
                          items: [...newOrderForm.items, { productId: first.id, name: first.name_ar, price: Number(first.price || 0), qty: 1 }]
                        });
                      }
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.25rem' }}
                  >
                    <Plus size={12} />
                    <span>{isRtl ? 'إضافة منتج' : 'Add Item'}</span>
                  </button>
                </div>

                {newOrderForm.items.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0' }}>
                    {isRtl ? 'لم يتم إضافة أي منتج بعد. اضغط «إضافة منتج» بالأعلى.' : 'No items added yet.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {newOrderForm.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.4rem', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ fontSize: '0.75rem', padding: '0.35rem' }}
                          value={it.productId}
                          onChange={(e) => {
                            const p = availableProducts.find(x => x.id === e.target.value);
                            const updated = [...newOrderForm.items];
                            updated[idx] = {
                              ...updated[idx],
                              productId: e.target.value,
                              name: p?.name_ar || '',
                              price: Number(p?.price || 0)
                            };
                            setNewOrderForm({ ...newOrderForm, items: updated });
                          }}
                        >
                          {availableProducts.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name_ar} ({prod.price} د.ل)
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ fontSize: '0.75rem', padding: '0.35rem' }}
                          value={it.qty}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            const updated = [...newOrderForm.items];
                            updated[idx].qty = val;
                            setNewOrderForm({ ...newOrderForm, items: updated });
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, textAlign: 'center' }}>
                          {(it.price * it.qty).toFixed(0)} د.ل
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = newOrderForm.items.filter((_, i) => i !== idx);
                            setNewOrderForm({ ...newOrderForm, items: updated });
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Fee & Total */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'رسوم التوصيل (د.ل)' : 'Delivery Fee'}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={newOrderForm.shippingFee}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, shippingFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ textAlign: 'end', padding: '0.5rem', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{isRtl ? 'الإجمالي النهائي:' : 'Total:'}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {((newOrderForm.items.reduce((sum, it) => sum + (it.price * it.qty), 0)) + Number(newOrderForm.shippingFee || 0)).toFixed(0)} د.ل
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={newOrderForm.notes}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                  placeholder={isRtl ? 'أي ملاحظات إضافية بخصوص الطلب...' : 'Order notes'}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="btn btn-outline"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={addingOrderLoading || newOrderForm.items.length === 0}
                  className="btn btn-secondary"
                  style={{ fontWeight: 700 }}
                >
                  {addingOrderLoading ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ وإرسال الطلب ✓' : 'Save Order')}
                </button>
              </div>
            </form>
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
