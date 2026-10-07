import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { normalizeOrderStatus } from '../../utils/orderEditHelper';
import { DollarSign, ShoppingBag, Box, Inbox, Star, Flame, Eye } from 'lucide-react';

export const Dashboard = () => {
  const { t, lang } = useLanguage();
  
  // Dashboard Metrics
  const [stats, setStats] = useState({
    sales: 0,
    ordersCount: 0,
    productsCount: 0,
    messagesCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      setLoading(true);
      try {
        // 1. Fetch orders
        const { data: orders } = await supabase.from('orders').select('*');
        let totalSales = 0;
        let validOrdersCount = 0;
        
        if (orders) {
          validOrdersCount = orders.length;
          orders.forEach((ord) => {
            const k = normalizeOrderStatus(ord.status);
            if (k !== 'cancelled' && k !== 'rejected') {
              totalSales += parseFloat(ord.total_price || 0);
            }
          });
        }

        // 2. Fetch products count
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('is_active', true)
          .eq('is_archived', false);
        const pCount = products ? products.length : 0;

        // 3. Fetch messages count
        const { data: messages } = await supabase.from('messages').select('id');
        const mCount = messages ? messages.length : 0;

        setStats({
          sales: totalSales,
          ordersCount: validOrdersCount,
          productsCount: pCount,
          messagesCount: mCount
        });

        // 4. Fetch recent 5 orders
        const { data: recent } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (recent) setRecentOrders(recent);

        // 5. Fetch popular products (aggregated orders or mocked based on sort_order)
        const { data: popular } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: false })
          .limit(4);
        if (popular) setPopularProducts(popular);

      } catch (err) {
        console.error('Error loading dashboard numbers', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="skeleton" style={{ height: '35px', width: '250px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="stats-row-skeleton">
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '300px', width: '100%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          لوحة الإحصائيات العامة / Dashboard Overview
        </h1>
      </div>

      {/* Stats Cards Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        
        {/* Sales */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--surface-color)' }}>
          <div style={{ backgroundColor: 'rgba(0, 168, 150, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--secondary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('admin.total_sales')}</p>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>
              {stats.sales.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{t('cart.currency')}</span>
            </p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--surface-color)' }}>
          <div style={{ backgroundColor: 'rgba(10, 51, 92, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('admin.total_orders')}</p>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>
              {stats.ordersCount}
            </p>
          </div>
        </div>

        {/* Active Products Count */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--surface-color)' }}>
          <div style={{ backgroundColor: 'rgba(2, 195, 154, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--secondary)' }}>
            <Box size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('admin.active_products')}</p>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>
              {stats.productsCount}
            </p>
          </div>
        </div>

        {/* Support Inbox messages count */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--surface-color)' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
            <Inbox size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>الرسائل الواردة</p>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>
              {stats.messagesCount}
            </p>
          </div>
        </div>

      </section>

      {/* Grid layouts: Recent Orders & Most Demanded products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '2rem' }} className="admin-dashboard-split">
        
        {/* Left: Recent Orders List */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            أحدث الطلبات الواردة / Recent Orders
          </h3>

          {recentOrders.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد طلبات مسجلة حالياً.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>{t('admin.order_number')}</th>
                    <th style={{ padding: '0.6rem' }}>{t('admin.customer')}</th>
                    <th style={{ padding: '0.6rem' }}>{t('admin.total')}</th>
                    <th style={{ padding: '0.6rem' }}>{t('admin.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem 0.6rem', fontWeight: 700 }}>
                        <Link to={`/admin/orders?q=${ord.order_number || ord.id}`} style={{ color: 'var(--secondary)' }}>
                          #{(ord.order_number || String(ord.id || '')).slice(0, 11)}...
                        </Link>
                      </td>
                      <td style={{ padding: '0.8rem 0.6rem' }}>{ord.customer_name}</td>
                      <td style={{ padding: '0.8rem 0.6rem', fontWeight: 700 }}>{ord.total_price} د.ل</td>
                      <td style={{ padding: '0.8rem 0.6rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Most Demanded Tools list */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Flame size={18} style={{ color: 'var(--warning)' }} />
            الأكثر طلباً / Hot Products
          </h3>

          {popularProducts.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد منتجات مسجلة.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {popularProducts.map((prod) => (
                <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <img src={prod.image_url} alt={prod.name_ar} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                    <Link to={`/product/${prod.id}`} className="product-title-link" style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang === 'ar' ? prod.name_ar : prod.name_en}
                    </Link>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 800 }}>
                      {prod.price} د.ل
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 860px) {
          .stats-row-skeleton {
            grid-template-columns: 1fr 1fr !important;
          }
          .admin-dashboard-split {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
