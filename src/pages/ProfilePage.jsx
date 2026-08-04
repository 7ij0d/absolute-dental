import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { User, ClipboardList, CheckCircle2, Clock, Truck, ShieldAlert } from 'lucide-react';

export const ProfilePage = () => {
  const { t, lang, isRtl } = useLanguage();
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Profile Edit fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneSec, setPhoneSec] = useState('');
  const [university, setUniversity] = useState('');
  const [college, setCollege] = useState('');
  
  // States
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Route guard
  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setPhoneSec(profile.phone_secondary || '');
      setUniversity(profile.university || 'جامعة طرابلس');
      setCollege(profile.college || 'كلية طب الأسنان');
    }

    // Load past orders
    const fetchUserOrders = async () => {
      setLoadingOrders(true);
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setOrders(data);
      } catch (err) {
        console.error('Error fetching student order list', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchUserOrders();
  }, [user, profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      phone_secondary: phoneSec.trim() || null,
      university: university.trim(),
      college: college.trim()
    });

    if (!error) {
      setMessage(t('auth.profile_saved'));
    } else {
      setMessage('حدث خطأ أثناء حفظ التغييرات. / Profile save failed.');
    }
    setSaving(false);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Title */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={24} style={{ color: 'var(--secondary)' }} />
          {t('nav.profile')}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem' }} className="profile-grid">
        
        {/* Profile details editor column */}
        <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>بيانات الطالب / Student Details</h3>
          
          {message && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent)', border: '1px solid var(--secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.full_name')} *</label>
              <input type="text" className="form-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.phone')} *</label>
              <input type="tel" className="form-input" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.phone_sec')}</label>
              <input type="tel" className="form-input" value={phoneSec} onChange={(e) => setPhoneSec(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.university')} *</label>
              <input type="text" className="form-input" required value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.college')} *</label>
              <input type="text" className="form-input" required value={college} onChange={(e) => setCollege(e.target.value)} />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.6rem', marginTop: '0.5rem' }}>
              {saving ? 'جاري الحفظ... / Saving...' : t('admin.save')}
            </button>

          </form>
        </div>

        {/* User Orders list column */}
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ClipboardList size={20} style={{ color: 'var(--secondary)' }} />
            سجل طلباتي / My Orders
          </h3>

          {loadingOrders ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
              <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>لم تقم بإجراء أي طلبات سابقة حتى الآن.</p>
              <Link to="/" className="btn btn-outline" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                تصفح المتجر الآن
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--surface-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  className="profile-order-row"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>#{ord.order_number}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ord.created_at).toLocaleDateString()}</p>
                    <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--secondary)', marginTop: '0.2rem' }}>
                      {ord.total_price} {t('cart.currency')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: ord.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 195, 154, 0.15)',
                        color: ord.status === 'delivered' ? 'var(--success)' : 'var(--secondary)'
                      }}
                    >
                      {t(`tracking.status_${ord.status}`)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/track?order=${ord.order_number}&phone=${ord.customer_phone}`} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        {t('checkout.track_order')}
                      </Link>
                      <Link to={`/invoice/${ord.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        الفاتورة
                      </Link>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .profile-order-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .profile-order-row > div:last-child {
            align-items: flex-start !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
