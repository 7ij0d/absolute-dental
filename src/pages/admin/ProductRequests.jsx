import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Eye,
  Trash2,
  Phone,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  X,
  Save,
  History
} from 'lucide-react';
import {
  fetchAllProductRequestsForAdmin,
  adminUpdateProductRequest,
  adminDeleteProductRequest,
  PRODUCT_REQUEST_STATUSES
} from '../../utils/communityAndRequestsEngine';

export const ProductRequests = () => {
  const { isRtl } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Request Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalAdminNotes, setModalAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await fetchAllProductRequestsForAdmin();
      setRequests(list);
    } catch (err) {
      console.error('Failed to load product availability requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openRequestDetails = (req) => {
    setSelectedReq(req);
    setModalStatus(req.status || 'new');
    setModalAdminNotes(req.admin_notes || '');
    setSaveMessage('');
  };

  const handleQuickStatusChange = async (reqId, nextStatus) => {
    try {
      const updated = await adminUpdateProductRequest({
        requestId: reqId,
        newStatus: nextStatus
      });
      setRequests((prev) => prev.map((r) => (r.id === reqId ? updated : r)));
      if (selectedReq?.id === reqId) {
        setSelectedReq(updated);
        setModalStatus(updated.status);
      }
    } catch (err) {
      alert(err.message || 'تعذّر تحديث حالة الطلب');
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await adminUpdateProductRequest({
        requestId: selectedReq.id,
        newStatus: modalStatus,
        adminNotes: modalAdminNotes
      });
      setRequests((prev) => prev.map((r) => (r.id === selectedReq.id ? updated : r)));
      setSelectedReq(updated);
      setSaveMessage('تم حفظ التعديلات والملاحظات الداخلية بنجاح.');
    } catch (err) {
      alert(err.message || 'تعذّر حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (req) => {
    if (!window.confirm(`هل أنت متأكد من حذف طلب توفير المنتج (${req.request_number})؟`)) return;
    try {
      await adminDeleteProductRequest(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      if (selectedReq?.id === req.id) setSelectedReq(null);
    } catch (err) {
      alert(err.message || 'تعذّر حذف الطلب');
    }
  };

  const filteredRequests = requests.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (item.product_name && item.product_name.toLowerCase().includes(q)) ||
        (item.request_number && item.request_number.toLowerCase().includes(q)) ||
        (item.user_name && item.user_name.toLowerCase().includes(q)) ||
        (item.contact_phone && item.contact_phone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusMeta = (statusValue) => {
    return (
      PRODUCT_REQUEST_STATUSES.find((s) => s.value === statusValue) || {
        value: statusValue,
        label_ar: 'جديد',
        color: '#2563EB'
      }
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--secondary)' }} />
            <span>{isRtl ? 'طلبات توفير المنتجات' : 'Product Availability Requests'}</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            متابعة طلبات توفير الأدوات والمنتجات غير المتوفرة، تحديث حالات البحث، وتدوين الملاحظات الداخلية.
          </p>
        </div>
        <button onClick={loadRequests} className="btn btn-outline" style={{ gap: '0.4rem' }}>
          <RefreshCw size={15} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '0.9rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{requests.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>إجمالي الطلبات</div>
        </div>
        {PRODUCT_REQUEST_STATUSES.map((st) => (
          <div key={st.value} className="card" style={{ padding: '0.9rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: st.color }}>
              {requests.filter((r) => r.status === st.value).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>
              {st.label_ar}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Status Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem' }}
          >
            الكل ({requests.length})
          </button>
          {PRODUCT_REQUEST_STATUSES.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={statusFilter === st.value ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem' }}
            >
              {st.label_ar}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '250px', flex: '1 1 280px', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', insetInlineStart: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المنتج أو رقم الطلب (PR-XXXXXX)..."
            className="form-input"
            style={{ paddingInlineStart: '2.2rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          جاري تحميل طلبات توفير المنتجات...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          لا توجد طلبات توفير منتجات مطابقة للبحث الحالي.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--accent)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800 }}>
                <th style={{ padding: '0.9rem 0.75rem' }}>رقم الطلب</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الصورة</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>اسم المنتج والتفاصيل</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>صاحب الطلب</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>رقم التواصل</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الحالة</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>التاريخ</th>
                <th style={{ padding: '0.9rem 0.75rem' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const statusMeta = getStatusMeta(req.status);
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 900, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      {req.request_number}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      {req.image_url ? (
                        <a href={req.image_url} target="_blank" rel="noreferrer">
                          <img
                            src={req.image_url}
                            alt={req.product_name}
                            style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                          />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>بدون صورة</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', maxWidth: '250px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{req.product_name}</div>
                      {req.specifications && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {req.specifications}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ fontWeight: 700 }}>{req.user_name || 'طالب مسجل'}</div>
                      {req.user_email && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.user_email}</div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <a
                        href={`tel:${req.contact_phone}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, color: 'var(--secondary)' }}
                      >
                        <Phone size={13} />
                        <span dir="ltr">{req.contact_phone}</span>
                      </a>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <select
                        value={req.status || 'new'}
                        onChange={(e) => handleQuickStatusChange(req.id, e.target.value)}
                        style={{
                          padding: '0.32rem 0.6rem',
                          borderRadius: '999px',
                          border: `1.5px solid ${statusMeta.color}`,
                          backgroundColor: '#FFFFFF',
                          color: statusMeta.color,
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          cursor: 'pointer'
                        }}
                      >
                        {PRODUCT_REQUEST_STATUSES.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label_ar}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('ar-LY') : '—'}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => openRequestDetails(req)}
                          className="action-btn"
                          title="عرض التفاصيل والملاحظات الداخلية وسجل الحالة"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(req)}
                          className="action-btn"
                          style={{ color: 'var(--danger)' }}
                          title="حذف الطلب"
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

      {/* Detailed Request Modal (Details, Internal Admin Notes & Status History) */}
      {selectedReq &&
        createPortal(
          <div className="ad-modal-backdrop" onClick={() => setSelectedReq(null)}>
            <div
              className="ad-modal-dialog"
              style={{ maxWidth: '640px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ad-modal-header">
                <div>
                  <h3 className="ad-modal-title">
                    تفاصيل طلب توفير المنتج ({selectedReq.request_number})
                  </h3>
                  <p className="ad-modal-subtitle">
                    تاريخ الإرسال:{' '}
                    {selectedReq.created_at
                      ? new Date(selectedReq.created_at).toLocaleString('ar-LY')
                      : '—'}
                  </p>
                </div>
                <button type="button" className="ad-modal-close" onClick={() => setSelectedReq(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {saveMessage && (
                  <div style={{ padding: '0.65rem 0.9rem', background: 'rgba(16,185,129,0.12)', color: '#059669', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700 }}>
                    {saveMessage}
                  </div>
                )}

                {/* Product & Customer Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ background: '#FAF6F0', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>المنتج المطلوب</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.2rem' }}>
                      {selectedReq.product_name}
                    </div>
                    {selectedReq.specifications && (
                      <div style={{ fontSize: '0.82rem', color: '#4B3324', marginTop: '0.4rem', whiteSpace: 'pre-line' }}>
                        <strong>المواصفات:</strong> {selectedReq.specifications}
                      </div>
                    )}
                    {selectedReq.additional_notes && (
                      <div style={{ fontSize: '0.82rem', color: '#4B3324', marginTop: '0.35rem', whiteSpace: 'pre-line' }}>
                        <strong>ملاحظات العميل:</strong> {selectedReq.additional_notes}
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#FAF6F0', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>بيانات صاحب الطلب</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '0.2rem' }}>
                      {selectedReq.user_name || 'طالب مسجل'}
                    </div>
                    {selectedReq.user_email && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedReq.user_email}</div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>
                      رقم التواصل: <span dir="ltr">{selectedReq.contact_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Product Image */}
                {selectedReq.image_url && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>صورة المنتج المرفقة:</div>
                    <a href={selectedReq.image_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: 190 }}>
                      <img src={selectedReq.image_url} alt={selectedReq.product_name} style={{ maxHeight: 185, objectFit: 'contain', display: 'block' }} />
                    </a>
                  </div>
                )}

                {/* Status Selector */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">حالة الطلب</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="form-input"
                  >
                    {PRODUCT_REQUEST_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label_ar}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Internal Admin Notes (Hidden from public storefront) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    ملاحظات داخلية خاصة بالإدارة (لا تظهر للعملاء في الواجهة العامة)
                  </label>
                  <textarea
                    rows={3}
                    value={modalAdminNotes}
                    onChange={(e) => setModalAdminNotes(e.target.value)}
                    placeholder="اكتب ملاحظات المورد، السعر المتوقع، أو حالة التواصل مع الطالب..."
                    className="form-input"
                  />
                </div>

                {/* Status Change History Log */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)' }}>
                    <History size={15} />
                    <span>سجل تغييرات الحالة:</span>
                  </div>
                  <div style={{ background: '#FAF6F0', borderRadius: 10, padding: '0.65rem 0.85rem', border: '1px solid var(--border-color)', maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(selectedReq.status_history || []).map((entry, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', borderBottom: idx < (selectedReq.status_history.length - 1) ? '1px dashed rgba(0,0,0,0.08)' : 'none', paddingBottom: '0.25rem' }}>
                        <strong>{entry.label_ar || getStatusMeta(entry.status).label_ar}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          {entry.changed_at ? new Date(entry.changed_at).toLocaleString('ar-LY') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ad-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedReq(null)}>
                    إغلاق
                  </button>
                  <button type="submit" disabled={saving} className="home-primary-pill-btn">
                    <Save size={15} />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ التحديثات'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProductRequests;
