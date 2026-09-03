import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { Plus, Edit, Trash2, X, Eye, CheckCircle, Archive, Gift } from 'lucide-react';

const DEFAULT_DONATIONS = [
  {
    id: 'd1',
    title: 'مجموعة أدوات نحت الشمع PKT',
    description: 'مجموعة أدوات نحت كاملة بحالة ممتازة إهداء لطلاب السنة الأولى كلية طب الأسنان.',
    item_type: 'equipment',
    condition: 'excellent',
    donor_name: 'د. أحمد الطاهر',
    donor_phone: '0912345678',
    donor_whatsapp: '218912345678',
    image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format',
    status: 'active',
    views_count: 12,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'd2',
    title: 'شيتات ومذكرات تشريح ورسم الأسنان',
    description: 'شيتات شاملة ومذكرة رسم الأسنان ملونة ومطبوعة ورق مقوى إهداء لزملائنا الدفعة الجديدة.',
    item_type: 'sheets',
    condition: 'good',
    donor_name: 'فاعل خير',
    donor_phone: '0923456789',
    donor_whatsapp: '218923456789',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format',
    status: 'pending',
    views_count: 24,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'd3',
    title: 'مرآة ومسبار فحص طبي ووعاء خلط الملاط',
    description: 'أدوات فحص معملية مع زجاجة خلط الملاط بحالة جيدة جداً.',
    item_type: 'equipment',
    condition: 'excellent',
    donor_name: 'طالب سنة ثالثة',
    donor_phone: '0945678901',
    donor_whatsapp: '218945678901',
    image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format',
    status: 'active',
    views_count: 18,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    years: { name_ar: 'السنة الثانية', name_en: '2nd Year' }
  }
];

const DEFAULT_STUDENT_REQUESTS = [
  {
    id: 'req_1',
    item_title: 'شيتات ومذكرات رسم وتشريح الأسنان ملونة',
    description: 'محتاج شيتات ومذكرة رسم الأسنان ملونة لدخول امتحان العملي الطارئ، لعدم توفر ميزانية الشراء حالياً.',
    student_real_name: 'محمد الصادق علي',
    student_phone: '0912345678',
    student_telegram: '@dental_std1',
    status: 'searching',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'req_2',
    item_title: 'أدوات نحت الشمع PKT ووعاء الخلط معمل الفانتوم',
    description: 'طالب محتاج طقم أدوات نحت شمع كامل لدخول معمل الفانتوم لعدم القدرة على شراء طقم جديد.',
    student_real_name: 'فاطمة محمود التاورغي',
    student_phone: '0923456789',
    student_telegram: null,
    status: 'searching',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    years: { name_ar: 'السنة الثانية', name_en: '2nd Year' }
  }
];

const getLocalDonations = () => {
  try {
    const raw = localStorage.getItem('ad_donations');
    if (!raw) {
      localStorage.setItem('ad_donations', JSON.stringify(DEFAULT_DONATIONS));
      return DEFAULT_DONATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DONATIONS;
  }
};

const saveLocalDonationsList = (list) => {
  try {
    localStorage.setItem('ad_donations', JSON.stringify(list));
  } catch (_) {}
};

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

export const Donations = () => {
  const { lang, t, isRtl } = useLanguage();
  const [adminTab, setAdminTab] = useState('donations'); // 'donations' or 'requests'
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDonations();
    fetchStudentRequests();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('donations')
        .select('*, years(name_ar, name_en), subjects(name_ar, name_en)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setItems(data);
      } else {
        setItems(getLocalDonations());
      }
    } catch {
      setItems(getLocalDonations());
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('student_requests')
        .select('*, years(name_ar, name_en), subjects(name_ar, name_en)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setRequests(data);
      } else {
        setRequests(getLocalStudentRequestsList());
      }
    } catch {
      setRequests(getLocalStudentRequestsList());
    }
  };

  const handleUpdateReqStatus = async (id, newStatus) => {
    try {
      await supabase
        .from('student_requests')
        .update({ status: newStatus })
        .eq('id', id);
    } catch (_) {}

    const updated = requests.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setRequests(updated);
    saveLocalStudentRequestsList(updated);
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف طلب الاحتياج هذا؟' : 'Are you sure you want to delete this request?')) return;

    try {
      await supabase.from('student_requests').delete().eq('id', id);
    } catch (_) {}

    const updated = requests.filter(item => item.id !== id);
    setRequests(updated);
    saveLocalStudentRequestsList(updated);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await supabase
        .from('donations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (_) {}

    const updated = items.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setItems(updated);
    saveLocalDonationsList(updated);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا التبرع؟' : 'Are you sure you want to delete this donation?')) {
      return;
    }

    try {
      await supabase
        .from('donations')
        .delete()
        .eq('id', id);
    } catch (_) {}

    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    saveLocalDonationsList(updated);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setSubmitting(true);
    try {
      const updates = {
        title: e.target.title.value,
        description: e.target.description.value,
        item_type: e.target.item_type.value,
        donor_name: editingItem?.donor_name || 'فاعل/فاعلة خير',
        donor_phone: e.target.donor_phone.value,
        donor_whatsapp: e.target.donor_whatsapp.value,
        status: e.target.status.value,
        updated_at: new Date().toISOString()
      };

      try {
        await supabase
          .from('donations')
          .update(updates)
          .eq('id', editingItem.id);
      } catch (_) {}

      const updated = items.map(item =>
        item.id === editingItem.id ? { ...item, ...updates } : item
      );
      setItems(updated);
      saveLocalDonationsList(updated);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating donation:', error);
      alert(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' }; // orange
      case 'active': return { bg: '#D1FAE5', text: '#059669' }; // green
      case 'claimed': return { bg: '#DBEAFE', text: '#2563EB' }; // blue
      case 'archived': return { bg: '#F3F4F6', text: '#4B5563' }; // gray
      default: return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="container section">
        <div className="skeleton" style={{ height: '100px', marginBottom: '1.5rem' }}></div>
        <div className="skeleton" style={{ height: '400px' }}></div>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in" style={{ padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gift size={24} color="var(--primary)" />
            <span>{isRtl ? 'إدارة التبرعات والطلبات' : 'Donations & Requests Management'}</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {isRtl ? 'مراجعة وإدارة تبرعات الطلاب بالأدوات والمستلزمات وطلبات الاحتياج' : 'Review and manage student tool donations and need requests'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: isRtl ? 'إجمالي التبرعات' : 'Total', value: items.length, color: 'var(--primary)' },
          { label: isRtl ? 'نشط' : 'Active', value: items.filter(i => i.status === 'active').length, color: 'var(--success)' },
          { label: isRtl ? 'محجوز' : 'Claimed', value: items.filter(i => i.status === 'claimed').length, color: '#3B82F6' },
          { label: isRtl ? 'معلق' : 'Pending', value: items.filter(i => i.status === 'pending').length, color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sub-Tabs: Donations vs Confidential Student Requests */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setAdminTab('donations')}
          className={`btn ${adminTab === 'donations' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Gift size={16} />
          <span>{isRtl ? `الأدوات المتبرع بها (${items.length})` : `Donated Items (${items.length})`}</span>
        </button>
        <button
          onClick={() => setAdminTab('requests')}
          className={`btn ${adminTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: adminTab === 'requests' ? undefined : 'var(--primary)' }}
        >
          <Lock size={16} />
          <span>{isRtl ? `طلبات الاحتياج السرية (${requests.length})` : `Secret Need Requests (${requests.length})`}</span>
        </button>
      </div>

      {adminTab === 'donations' ? (
        <>
          {/* Table for Donated Items */}
          <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الصورة' : 'Image'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'العنوان' : 'Title'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'النوع' : 'Type'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الهاتف' : 'Phone'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'السنة الدراسية / المادة' : 'Year / Subject'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'end' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const statusColor = getStatusColor(item.status);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Gift size={20} color="var(--text-muted)" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{item.title}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                          {item.item_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', direction: 'ltr' }}>{item.donor_phone || '-'}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.years ? (isRtl ? item.years.name_ar : item.years.name_en) : '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.subjects ? (isRtl ? item.subjects.name_ar : item.subjects.name_en) : '-'}</div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <select 
                          value={item.status} 
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">{isRtl ? 'معلق' : 'Pending'}</option>
                          <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                          <option value="claimed">{isRtl ? 'محجوز' : 'Claimed'}</option>
                          <option value="archived">{isRtl ? 'مؤرشف' : 'Archived'}</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleDateString(lang)}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'end' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => openEditModal(item)} className="action-btn" title={isRtl ? 'تعديل' : 'Edit'}>
                            <Edit size={16} color="var(--primary)" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="action-btn" title={isRtl ? 'حذف' : 'Delete'}>
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isRtl ? 'لا توجد تبرعات' : 'No donations found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Table for Confidential Student Requests */}
          <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الأداة المطلوبة' : 'Requested Item'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'بيانات الطالب (سرية)' : 'Student Info (Private)'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الهاتف والتليجرام' : 'Phone & Telegram'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'السنة / المادة' : 'Year / Subject'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'start' }}>{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'end' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  let reqColor = { bg: '#FEF3C7', text: '#D97706' }; // searching
                  if (req.status === 'fulfilled') reqColor = { bg: '#D1FAE5', text: '#059669' };
                  if (req.status === 'cancelled') reqColor = { bg: '#FEE2E2', text: '#DC2626' };

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{req.item_title}</div>
                        {req.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', maxWidth: '280px' }}>
                            {req.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--secondary)' }}>
                          <Lock size={14} />
                          <span>{req.student_real_name || (isRtl ? 'طالب غير مسمى' : 'Anonymous')}</span>
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left', fontWeight: 600 }}>
                          {req.student_phone || '-'}
                        </div>
                        {req.student_telegram && (
                          <div style={{ fontSize: '0.75rem', color: '#0088cc', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                            {req.student_telegram}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{req.years ? (isRtl ? req.years.name_ar : req.years.name_en) : '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.subjects ? (isRtl ? req.subjects.name_ar : req.subjects.name_en) : '-'}</div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <select 
                          value={req.status} 
                          onChange={(e) => handleUpdateReqStatus(req.id, e.target.value)}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: reqColor.bg,
                            color: reqColor.text,
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="searching">{isRtl ? 'جاري البحث' : 'Searching'}</option>
                          <option value="fulfilled">{isRtl ? 'تم التوفير' : 'Fulfilled'}</option>
                          <option value="cancelled">{isRtl ? 'ملغي' : 'Cancelled'}</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString(lang)}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'end' }}>
                        <button onClick={() => handleDeleteRequest(req.id)} className="action-btn" title={isRtl ? 'حذف' : 'Delete'}>
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isRtl ? 'لا توجد طلبات احتياج' : 'No student requests found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
            backgroundColor: 'var(--surface-color)', padding: '2rem 1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {isRtl ? 'تعديل التبرع' : 'Edit Donation'}
              </h3>
              <button onClick={() => setShowModal(false)} className="action-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">{isRtl ? 'العنوان' : 'Title'}</label>
                <input 
                  type="text" 
                  name="title"
                  className="form-input" 
                  defaultValue={editingItem?.title || ''}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isRtl ? 'الوصف' : 'Description'}</label>
                <textarea 
                  name="description"
                  className="form-input" 
                  defaultValue={editingItem?.description || ''}
                  rows="3"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'النوع' : 'Type'}</label>
                  <select name="item_type" className="form-input" defaultValue={editingItem?.item_type || 'sheets'}>
                    <option value="sheets">{isRtl ? 'مذكرات/ورق' : 'Sheets'}</option>
                    <option value="equipment">{isRtl ? 'أدوات' : 'Equipment'}</option>
                    <option value="other">{isRtl ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select name="status" className="form-input" defaultValue={editingItem?.status || 'pending'}>
                    <option value="pending">{isRtl ? 'معلق' : 'Pending'}</option>
                    <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                    <option value="claimed">{isRtl ? 'محجوز' : 'Claimed'}</option>
                    <option value="archived">{isRtl ? 'مؤرشف' : 'Archived'}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'الهاتف' : 'Phone'}</label>
                  <input 
                    type="text" 
                    name="donor_phone"
                    className="form-input" 
                    defaultValue={editingItem?.donor_phone || ''}
                    style={{ direction: 'ltr' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'واتساب' : 'WhatsApp'}</label>
                  <input 
                    type="text" 
                    name="donor_whatsapp"
                    className="form-input" 
                    defaultValue={editingItem?.donor_whatsapp || ''}
                    style={{ direction: 'ltr' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={submitting} className="btn btn-secondary">
                  {submitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default Donations;
