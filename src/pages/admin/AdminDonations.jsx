import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Gift, Trash2, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      let localDonations = [];
      try {
        const raw = localStorage.getItem('ad_donations');
        if (raw) localDonations = JSON.parse(raw);
      } catch (_) {}

      if (!error && Array.isArray(data)) {
        const existingIds = new Set(data.map(d => d.id));
        const extraLocal = localDonations.filter(d => !existingIds.has(d.id));
        const merged = [...data, ...extraLocal].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setDonations(merged);
      } else {
        setDonations(localDonations);
      }
    } catch (err) {
      console.error('Error fetching admin donations:', err);
      let localDonations = [];
      try {
        const raw = localStorage.getItem('ad_donations');
        if (raw) localDonations = JSON.parse(raw);
      } catch (_) {}
      setDonations(localDonations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await supabase
        .from('donations')
        .update({ status: newStatus })
        .eq('id', id);
    } catch (err) {
      console.warn('Status update warning:', err);
    }

    const updated = donations.map(d => d.id === id ? { ...d, status: newStatus } : d);
    setDonations(updated);
    try {
      localStorage.setItem('ad_donations', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا التبرع؟')) return;
    try {
      await supabase.from('donations').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete warning:', err);
    }
    const updated = donations.filter(d => d.id !== id);
    setDonations(updated);
    try {
      localStorage.setItem('ad_donations', JSON.stringify(updated));
    } catch (_) {}
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد المراجعة', bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706' };
      case 'active':
        return { label: 'متاح للتبرع', bg: 'rgba(16, 185, 129, 0.15)', color: '#059669' };
      case 'claimed':
        return { label: 'تم الاستلام', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' };
      case 'archived':
        return { label: 'مؤرشف', bg: 'rgba(107, 114, 128, 0.15)', color: '#4b5563' };
      default:
        return { label: status || 'معلق', bg: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Gift size={24} /> إدارة التبرعات والإهداءات
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)', marginTop: '0.25rem' }}>
            مراجعة كافة التبرعات المضافة من الطلاب وقبولها أو إلغاؤها
          </p>
        </div>
        <button 
          onClick={fetchDonations} 
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: 'var(--surface-color, #fff)' }}
        >
          <RefreshCw size={16} /> تحديث البيانات
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', background: '#ffebe9', color: '#c0392b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>جاري تحميل التبرعات...</div>
      ) : donations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-color, #fff)', borderRadius: '8px' }}>
          لا توجد تبرعات مضافة حالياً.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--surface-color, #fff)', borderRadius: '8px', border: '1px solid #eee' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '1rem' }}>عنوان التبرع</th>
                <th style={{ padding: '1rem' }}>النوع</th>
                <th style={{ padding: '1rem' }}>المتبرع / الهاتف</th>
                <th style={{ padding: '1rem' }}>الحالة الحالية</th>
                <th style={{ padding: '1rem' }}>تاريخ الإدراج</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>الإجراءات والتغيير</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((item) => {
                const badge = getStatusBadge(item.status);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.title || 'بدون عنوان'}</div>
                      {item.description && (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>{item.item_type === 'sheets' ? 'شيتات' : 'أدوات ومعدات'}</td>
                    <td style={{ padding: '1rem' }}>
                      <div>{item.donor_name || 'فاعل/فاعلة خير'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666', direction: 'ltr', textAlign: 'right' }}>
                        {item.donor_phone || item.donor_whatsapp || 'غير متاح'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        display: 'inline-block'
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#666' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-LY') : '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'active')}
                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="قبول ونشر التبرع"
                          >
                            <CheckCircle size={14} /> قبول ونشر
                          </button>
                        )}

                        <select
                          value={item.status || 'pending'}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          <option value="pending">قيد المراجعة</option>
                          <option value="active">متاح (نشط)</option>
                          <option value="claimed">تم الاستلام</option>
                          <option value="archived">مؤرشف</option>
                        </select>

                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
