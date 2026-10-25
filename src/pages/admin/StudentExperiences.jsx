import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  Clock,
  Search,
  X,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import {
  fetchAllExperiencesForAdmin,
  adminApproveExperience,
  adminRejectExperience,
  adminDeleteExperience,
  adminDeleteExperienceComment
} from '../../utils/communityAndRequestsEngine';

export const StudentExperiences = () => {
  const { isRtl } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExp, setSelectedExp] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadExperiences = async () => {
    setLoading(true);
    try {
      const list = await fetchAllExperiencesForAdmin();
      setItems(list);
      if (selectedExp) {
        const updated = list.find((x) => x.id === selectedExp.id);
        setSelectedExp(updated || null);
      }
    } catch (err) {
      console.error('Failed to load experiences for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  const handleApprove = async (item) => {
    setBusyId(item.id);
    try {
      await adminApproveExperience(item.id);
      await loadExperiences();
    } catch (err) {
      alert(err.message || 'تعذّر اعتماد التجربة');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item) => {
    setBusyId(item.id);
    try {
      await adminRejectExperience(item.id);
      await loadExperiences();
    } catch (err) {
      alert(err.message || 'تعذّر رفض التجربة');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه التجربة نهائياً؟')) return;
    setBusyId(item.id);
    try {
      await adminDeleteExperience(item.id);
      if (selectedExp?.id === item.id) setSelectedExp(null);
      await loadExperiences();
    } catch (err) {
      alert(err.message || 'تعذّر حذف التجربة');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteComment = async (experienceId, commentId) => {
    if (!window.confirm('هل تريد حذف هذا التعليق؟')) return;
    try {
      await adminDeleteExperienceComment({ experienceId, commentId });
      await loadExperiences();
    } catch (err) {
      alert(err.message || 'تعذّر حذف التعليق');
    }
  };

  const filtered = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (item.user_name && item.user_name.toLowerCase().includes(q)) ||
        (item.text && item.text.toLowerCase().includes(q)) ||
        (item.user_email && item.user_email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
          منشورة
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(239,68,68,0.12)', color: '#DC2626' }}>
          مرفوضة
        </span>
      );
    }
    return (
      <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(245,158,11,0.14)', color: '#D97706' }}>
        قيد المراجعة
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary)' }}>
            {isRtl ? '🦷 إدارة تجارب طلبة الأسنان' : '🦷 Student Experiences Moderation'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            مراجعة تجارب الطلبة وصورهم، اعتماد النشر في الصفحة الرئيسية، وإدارة التعليقات.
          </p>
        </div>
        <button onClick={loadExperiences} className="btn btn-outline" style={{ gap: '0.4rem' }}>
          <RefreshCw size={15} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'إجمالي التجارب', value: items.length, color: 'var(--primary)' },
          { label: 'بانتظار المراجعة', value: items.filter((i) => i.status === 'pending').length, color: '#D97706' },
          { label: 'منشورة بالموقع', value: items.filter((i) => i.status === 'approved').length, color: '#059669' },
          { label: 'مرفوضة', value: items.filter((i) => i.status === 'rejected').length, color: '#DC2626' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 700 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'الكل' },
            { key: 'pending', label: 'قيد المراجعة' },
            { key: 'approved', label: 'منشورة' },
            { key: 'rejected', label: 'مرفوضة' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={statusFilter === tab.key ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 260px', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', insetInlineStart: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب أو نص التجربة..."
            className="form-input"
            style={{ paddingInlineStart: '2.2rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          جاري تحميل التجارب...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          لا توجد تجارب مطابقة للفلتر المحدد.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800 }}>
                <th style={{ padding: '0.9rem 0.75rem' }}>الصور</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الطالب</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>نص التجربة</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الإعجابات / التعليقات</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>التاريخ</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الحالة</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    {Array.isArray(item.images) && item.images.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <img
                          src={item.images[0]}
                          alt=""
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        {item.images.length > 1 && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary)' }}>
                            +{item.images.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>بدون صورة</span>
                    )}
                  </td>

                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{item.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.university || 'طب الأسنان'}</div>
                  </td>

                  <td style={{ padding: '0.85rem 0.75rem', maxWidth: '280px' }}>
                    <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                      {item.text || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>مشاركة بصور فقط</span>}
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#DC2626' }}>
                        <Heart size={14} /> {(item.likes || []).length}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                        <MessageSquare size={14} /> {(item.comments || []).length}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <div>إرسال: {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-LY') : '—'}</div>
                    {item.published_at && (
                      <div style={{ color: '#059669', fontWeight: 700 }}>
                        نشر: {new Date(item.published_at).toLocaleDateString('ar-LY')}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '0.85rem 0.75rem' }}>{getStatusBadge(item.status)}</td>

                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedExp(item)}
                        className="action-btn"
                        title="عرض التفاصيل والتعليقات"
                      >
                        <Eye size={16} />
                      </button>

                      {item.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleApprove(item)}
                          className="action-btn"
                          style={{ color: '#059669' }}
                          title="قبول ونشر"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}

                      {item.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleReject(item)}
                          className="action-btn"
                          style={{ color: '#D97706' }}
                          title="رفض"
                        >
                          <XCircle size={16} />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleDelete(item)}
                        className="action-btn"
                        style={{ color: 'var(--danger)' }}
                        title="حذف نهائي"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details & Comment Moderation Modal */}
      {selectedExp &&
        createPortal(
          <div className="ad-modal-backdrop" onClick={() => setSelectedExp(null)}>
            <div
              className="ad-modal-dialog"
              style={{ maxWidth: '640px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ad-modal-header">
                <div>
                  <h3 className="ad-modal-title">تفاصيل تجربة الطالب</h3>
                  <p className="ad-modal-subtitle">
                    بواسطة: <strong>{selectedExp.user_name}</strong> ({selectedExp.user_email || 'بدون بريد'})
                  </p>
                </div>
                <button type="button" className="ad-modal-close" onClick={() => setSelectedExp(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--accent)', padding: '0.75rem 1rem', borderRadius: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تاريخ الإرسال: </span>
                    <strong style={{ fontSize: '0.82rem' }}>
                      {selectedExp.created_at ? new Date(selectedExp.created_at).toLocaleString('ar-LY') : '—'}
                    </strong>
                  </div>
                  {getStatusBadge(selectedExp.status)}
                </div>

                {/* Full Text */}
                <div style={{ background: '#FAF6F0', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    نص التجربة:
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                    {selectedExp.text || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>لا يوجد نص — مشاركة بصور فقط</span>}
                  </p>
                </div>

                {/* Images */}
                {Array.isArray(selectedExp.images) && selectedExp.images.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                      الصور المرفقة ({selectedExp.images.length}):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
                      {selectedExp.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)', height: 130 }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Moderation */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    التعليقات ({(selectedExp.comments || []).length}):
                  </div>
                  {(selectedExp.comments || []).length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>لا توجد تعليقات على هذه التجربة.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                      {selectedExp.comments.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                              {c.user_name}{' '}
                              <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                ({c.created_at ? new Date(c.created_at).toLocaleDateString('ar-LY') : ''})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.84rem', marginTop: '0.15rem' }}>{c.text}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(selectedExp.id, c.id)}
                            className="action-btn"
                            style={{ color: 'var(--danger)' }}
                            title="حذف التعليق"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="ad-modal-footer">
                  {selectedExp.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedExp)}
                      className="btn btn-primary"
                      style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                    >
                      <CheckCircle size={15} /> قبول ونشر التجربة
                    </button>
                  )}
                  {selectedExp.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleReject(selectedExp)}
                      className="btn btn-outline"
                      style={{ color: '#D97706', borderColor: '#D97706' }}
                    >
                      <XCircle size={15} /> رفض التجربة
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedExp)}
                    className="btn btn-outline"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    <Trash2 size={15} /> حذف نهائي
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default StudentExperiences;
