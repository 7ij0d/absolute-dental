import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { CheckCircle2, XCircle, Trash2, Lock, Clock, Check, X, ShieldAlert, Sparkles, Filter } from 'lucide-react';

const DEFAULT_STUDENT_REQUESTS = [
  {
    id: 'req_1',
    item_title: 'شيتات ومذكرات رسم وتشريح الأسنان ملونة',
    description: 'محتاج شيتات ومذكرة رسم الأسنان ملونة لدخول امتحان العملي الطارئ، لعدم توفر ميزانية الشراء حالياً.',
    student_real_name: 'محمد الصادق علي',
    student_phone: '0912345678',
    student_telegram: '@dental_std1',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'req_2',
    item_title: 'أدوات نحت الشمع PKT ووعاء الخلط معمل الفانتوم',
    description: 'طالب محتاج طقم أدوات نحت شمع كامل لدخول معمل الفانتوم لعدم القدرة على شراء طقم جديد.',
    student_real_name: 'فاطمة محمود التاورغي',
    student_phone: '0923456789',
    student_telegram: '@fatima_dent',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    years: { name_ar: 'السنة الثانية', name_en: '2nd Year' }
  }
];

const getLocalStudentRequestsList = () => {
  try {
    const raw = localStorage.getItem('ad_student_requests');
    if (!raw) {
      localStorage.setItem('ad_student_requests', JSON.stringify(DEFAULT_STUDENT_REQUESTS));
      return DEFAULT_STUDENT_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STUDENT_REQUESTS;
  }
};

const saveLocalStudentRequestsList = (list) => {
  try {
    localStorage.setItem('ad_student_requests', JSON.stringify(list));
  } catch (_) {}
};

export const AdminRequests = () => {
  const { lang, t, isRtl } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'approved', 'fulfilled', 'rejected', 'all'
  const [updatingId, setUpdatingId] = useState(null);

  const fetchStudentRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_requests')
        .select('*, years(name_ar, name_en), subjects(name_ar, name_en)')
        .order('created_at', { ascending: false });

      let localReqs = getLocalStudentRequestsList() || [];
      if (!error && Array.isArray(data)) {
        const existingIds = new Set(data.map(item => item.id));
        const extraLocal = localReqs.filter(item => !existingIds.has(item.id));
        const merged = [...data, ...extraLocal].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRequests(merged);
      } else {
        setRequests(localReqs);
      }
    } catch (err) {
      console.error('Error fetching admin requests:', err);
      setRequests(getLocalStudentRequestsList() || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentRequests();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await supabase
        .from('student_requests')
        .update({ status: newStatus })
        .eq('id', id);
    } catch (_) {}

    const updated = (requests || []).map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setRequests(updated);
    saveLocalStudentRequestsList(updated);
    setUpdatingId(null);
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الطلب نهائياً؟' : 'Are you sure you want to delete this request?')) return;

    try {
      await supabase.from('student_requests').delete().eq('id', id);
    } catch (_) {}

    const updated = (requests || []).filter(item => item.id !== id);
    setRequests(updated);
    saveLocalStudentRequestsList(updated);
  };

  // Filter list by selected status tab
  const filteredRequests = (requests || []).filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const pendingCount = (requests || []).filter(i => i.status === 'pending').length;
  const approvedCount = (requests || []).filter(i => i.status === 'approved').length;
  const fulfilledCount = (requests || []).filter(i => i.status === 'fulfilled').length;
  const rejectedCount = (requests || []).filter(i => i.status === 'rejected').length;

  return (
    <div className="container section animate-fade-in" style={{ padding: '2rem 1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={22} color="var(--primary)" />
            <span>{isRtl ? 'إدارة نواقص الطلاب' : 'Student Needs Management'}</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {isRtl ? 'مراجعة بيانات الطلاب السرية والموافقة على نشر طلباتهم أو رفضها' : 'Review confidential student submissions and approve/reject before publishing'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`btn ${filterStatus === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: filterStatus === 'pending' ? '#F59E0B' : undefined, borderColor: '#F59E0B', color: filterStatus === 'pending' ? '#fff' : undefined }}
        >
          <Clock size={16} />
          <span>{isRtl ? `جديدة ينتظر الموافقة (${pendingCount})` : `Pending Approval (${pendingCount})`}</span>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`btn ${filterStatus === 'approved' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <CheckCircle2 size={16} />
          <span>{isRtl ? `معروضة حالياً (${approvedCount})` : `Approved & Published (${approvedCount})`}</span>
        </button>

        <button
          onClick={() => setFilterStatus('fulfilled')}
          className={`btn ${filterStatus === 'fulfilled' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Sparkles size={16} />
          <span>{isRtl ? `تم توفيرها (${fulfilledCount})` : `Fulfilled (${fulfilledCount})`}</span>
        </button>

        <button
          onClick={() => setFilterStatus('rejected')}
          className={`btn ${filterStatus === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <XCircle size={16} />
          <span>{isRtl ? `مرفوضة (${rejectedCount})` : `Rejected (${rejectedCount})`}</span>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Filter size={16} />
          <span>{isRtl ? `الكل (${requests.length})` : `All (${requests.length})`}</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الأداة المطلوبة والتفاصيل' : 'Requested Item & Description'}</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'بيانات الطالب السرية' : 'Confidential Student Info'}</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'التواصل (هاتف / تليجرام)' : 'Contact (Phone / Telegram)'}</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'السنة / المادة' : 'Year / Subject'}</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الحالة الحالية' : 'Current Status'}</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>{isRtl ? 'قرارات الموافقة / الرفض' : 'Approval Decision'}</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'end' }}>{isRtl ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => {
              let statusBadge = { bg: '#FEF3C7', text: '#D97706', label: isRtl ? 'معلق ينتظر الموافقة' : 'Pending Approval' };
              if (req.status === 'approved') statusBadge = { bg: '#D1FAE5', text: '#059669', label: isRtl ? 'معروض للجمهور' : 'Approved & Live' };
              if (req.status === 'fulfilled') statusBadge = { bg: '#DBEAFE', text: '#2563EB', label: isRtl ? 'تم توفيره' : 'Fulfilled' };
              if (req.status === 'rejected') statusBadge = { bg: '#FEE2E2', text: '#DC2626', label: isRtl ? 'مرفوض' : 'Rejected' };

              return (
                <tr key={req.id || Math.random()} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: req.status === 'pending' ? 'rgba(245, 158, 11, 0.04)' : undefined }}>
                  
                  {/* Item title & details */}
                  <td style={{ padding: '1rem 0.75rem', maxWidth: '280px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{req.item_title || '-'}</div>
                    {req.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                        {req.description}
                      </div>
                    )}
                  </td>

                  {/* Private Student Info */}
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={14} />
                      <span>{req.student_real_name || (isRtl ? 'طالب غير مسمى' : 'Anonymous')}</span>
                    </div>
                  </td>

                  {/* Phone & Telegram */}
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <div style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left', fontWeight: 700 }}>
                      {req.student_phone || '-'}
                    </div>
                    {req.student_telegram && (
                      <div style={{ fontSize: '0.78rem', color: '#0088cc', direction: 'ltr', textAlign: isRtl ? 'right' : 'left', marginTop: '0.2rem' }}>
                        {req.student_telegram}
                      </div>
                    )}
                  </td>

                  {/* Year */}
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {req.years ? (isRtl ? (req.years.name_ar || 'غير محدد') : (req.years.name_en || 'Not specified')) : (isRtl ? 'غير محدد' : 'Not specified')}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.text,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-block'
                    }}>
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* Actions: Approve / Reject / Mark Fulfilled */}
                  <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {req.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'approved')}
                          disabled={updatingId === req.id}
                          className="btn"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#10B981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer'
                          }}
                          title={isRtl ? 'موافقة وقبول للنشر' : 'Approve & Publish'}
                        >
                          <Check size={14} />
                          <span>{isRtl ? 'موافقة وقبول' : 'Approve'}</span>
                        </button>
                      )}

                      {req.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          disabled={updatingId === req.id}
                          className="btn"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#EF4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer'
                          }}
                          title={isRtl ? 'رفض الطلب' : 'Reject Request'}
                        >
                          <X size={14} />
                          <span>{isRtl ? 'رفض' : 'Reject'}</span>
                        </button>
                      )}

                      {req.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'fulfilled')}
                          disabled={updatingId === req.id}
                          className="btn"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Sparkles size={14} />
                          <span>{isRtl ? 'تم التوفير' : 'Fulfilled'}</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td style={{ padding: '1rem 0.75rem', textAlign: 'end' }}>
                    <button onClick={() => handleDeleteRequest(req.id)} className="action-btn" title={isRtl ? 'حذف نهائي' : 'Delete'}>
                      <Trash2 size={16} color="var(--danger)" />
                    </button>
                  </td>

                </tr>
              );
            })}

            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {isRtl ? 'لا توجد طلبات احتياج بهذه الحالة حالياً.' : 'No requests found for this status.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminRequests;
