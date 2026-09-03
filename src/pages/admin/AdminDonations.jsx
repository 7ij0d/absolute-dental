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

      if (error) throw error;
      setDonations(data || []);
    } catch (err) {
      console.error('Error fetching admin donations:', err);
      setErrorMsg('تعذر جلب بيانات التبرعات، يرجى المحاولة لاحقاً.');
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'claimed' ? 'active' : 'claimed';
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    } catch (err) {
      alert('حدث خطأ أثناء تغيير حالة التبرع');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا التبرع؟')) return;
    try {
      const { error } = await supabase.from('donations').delete().eq('id', id);
      if (error) throw error;
      setDonations(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء حذف التبرع');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gift size={24} /> إدارة التبرعات والإهداءات
        </h1>
        <button 
          onClick={fetchDonations} 
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <RefreshCw size={16} /> تحديث
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '1rem' }}>عنوان التبرع</th>
                <th style={{ padding: '1rem' }}>النوع</th>
                <th style={{ padding: '1rem' }}>الهاتف / الواتساب</th>
                <th style={{ padding: '1rem' }}>الحالة</th>
                <th style={{ padding: '1rem' }}>التاريخ</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.title || 'بدون عنوان'}</td>
                  <td style={{ padding: '1rem' }}>{item.item_type === 'sheets' ? 'شيتات' : 'أدوات ومعدات'}</td>
                  <td style={{ padding: '1rem' }}>{item.donor_phone || item.donor_whatsapp || 'غير متاح'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      background: item.status === 'claimed' ? '#e2e8f0' : '#d1fae5',
                      color: item.status === 'claimed' ? '#475569' : '#065f46'
                    }}>
                      {item.status === 'claimed' ? 'تم الاستلام' : 'متاح'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-LY') : '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      style={{ margin: '0 0.25rem', padding: '0.4rem 0.6rem', borderRadius: '4px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
                      title="تغيير الحالة"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ margin: '0 0.25rem', padding: '0.4rem 0.6rem', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
