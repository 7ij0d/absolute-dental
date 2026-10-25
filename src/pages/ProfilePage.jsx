import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import {
  User,
  ClipboardList,
  CheckCircle2,
  Phone,
  AtSign,
  GraduationCap,
  Calendar,
  LogOut,
  Sparkles,
  EyeOff,
  UserCheck,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const LIBYAN_UNIVERSITIES = [
  'جامعة طرابلس - كلية طب وجراحة الفم والأسنان',
  'جامعة بنغازي - كلية طب وجراحة الفم والأسنان',
  'جامعة مصراتة - كلية طب الأسنان',
  'جامعة الزاوية - كلية طب وجراحة الفم والأسنان',
  'جامعة العرب الطبية - بنغازي',
  'جامعة عمر المختار - البيضاء',
  'جامعة سبها - كلية طب الأسنان',
  'الجامعة الليبية الدولية (LIMU)',
  'جامعة أخرى / خريج',
];

const ACADEMIC_YEARS = [
  { id: '1st-year', labelAr: 'السنة الأولى', labelEn: '1st Year' },
  { id: '2nd-year', labelAr: 'السنة الثانية', labelEn: '2nd Year' },
  { id: '3rd-year', labelAr: 'السنة الثالثة', labelEn: '3rd Year' },
  { id: '4th-year', labelAr: 'السنة الرابعة', labelEn: '4th Year' },
  { id: 'intern', labelAr: 'طبيب امتياز / خريج', labelEn: 'Intern / Graduate' },
];

export const ProfilePage = () => {
  const { t, lang, isRtl } = useLanguage();
  const { user, profile, updateProfile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active tab: 'profile' or 'orders'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneSec, setPhoneSec] = useState('');
  const [username, setUsername] = useState('');
  const [university, setUniversity] = useState(LIBYAN_UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState('');
  const [college, setCollege] = useState('كلية طب وجراحة الفم والأسنان');
  const [academicYear, setAcademicYear] = useState('2nd-year');
  const [isAnonymousDefault, setIsAnonymousDefault] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Form State
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Route Guard & Initial population: Wait for authLoading to finish before redirecting
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const hasLocal = typeof window !== 'undefined' && (
        localStorage.getItem('ad_cached_user') ||
        localStorage.getItem('ad_auth_session')
      );
      if (!hasLocal) {
        navigate('/signin?redirect=/profile');
      }
      return;
    }

    const meta = user.user_metadata || {};
    const initialName = profile?.full_name || meta.full_name || meta.name || '';
    const initialPhone = profile?.phone || meta.phone || '';
    const initialPhoneSec = profile?.phone_secondary || meta.phone_secondary || '';
    const initialAvatar = profile?.avatar_url || meta.avatar_url || meta.picture || '';
    const emailPrefix = (user.email || '').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const initialUsername = profile?.username || meta.username || emailPrefix;
    const initialYear = profile?.academic_year || meta.academic_year || '2nd-year';
    const initialAnon = Boolean(profile?.is_anonymous_default ?? meta.is_anonymous_default ?? false);

    setFullName(initialName);
    setPhone(initialPhone);
    setPhoneSec(initialPhoneSec);
    setAvatarUrl(initialAvatar);
    setUsername(initialUsername);
    setAcademicYear(initialYear);
    setIsAnonymousDefault(initialAnon);

    if (profile?.university) {
      if (LIBYAN_UNIVERSITIES.includes(profile.university)) {
        setUniversity(profile.university);
      } else {
        setUniversity('جامعة أخرى / خريج');
        setCustomUniversity(profile.university);
      }
    }

    if (profile?.college) {
      setCollege(profile.college);
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
    setErrorMsg('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanUser = username.trim().replace(/^@+/, '');
    const finalUniversity = university === 'جامعة أخرى / خريج' && customUniversity.trim()
      ? customUniversity.trim()
      : university;

    if (!cleanName) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال اسمك الكامل.' : 'Please enter your full name.');
      setSaving(false);
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم هاتف / واتساب صالح.' : 'Please enter a valid WhatsApp/phone number.');
      setSaving(false);
      return;
    }

    const { error } = await updateProfile({
      full_name: cleanName,
      name: cleanName,
      phone: cleanPhone,
      phone_secondary: phoneSec.trim() || null,
      username: cleanUser,
      university: finalUniversity,
      college: college.trim() || 'كلية طب الأسنان',
      academic_year: academicYear,
      is_anonymous_default: isAnonymousDefault,
      avatar_url: avatarUrl || undefined,
      status: 'active'
    });

    if (!error) {
      setMessage(lang === 'ar' ? 'تم حفظ وتحديث بيانات حسابك بنجاح! ✨' : 'Profile updated successfully! ✨');
      setTimeout(() => setMessage(''), 4500);
    } else {
      setErrorMsg(error.message || (lang === 'ar' ? 'حدث خطأ أثناء حفظ التغييرات، يرجى المحاولة لاحقاً.' : 'Profile update failed.'));
    }
    setSaving(false);
  };

  const getYearLabel = (yrId) => {
    const yr = ACADEMIC_YEARS.find((y) => y.id === yrId);
    return yr ? (lang === 'ar' ? yr.labelAr : yr.labelEn) : yrId;
  };

  if (authLoading) {
    return (
      <div
        className="container animate-fade-in"
        style={{
          padding: '3rem 1rem',
          maxWidth: '1080px',
          marginInline: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div className="skeleton" style={{ height: '140px', borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: '350px', borderRadius: '24px' }} />
      </div>
    );
  }

  return (
    <div
      className="container animate-fade-in"
      style={{
        padding: '2.5rem 1rem 4.5rem',
        maxWidth: '1080px',
        marginInline: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        direction: isRtl ? 'rtl' : 'ltr'
      }}
    >
      {/* ── PROFILE HERO CARD ── */}
      <div
        className="card"
        style={{
          padding: '1.85rem 2rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1.5px solid #E6DDD2',
          boxShadow: 'inset 0 1px 0 #FFFFFF, 0 10px 30px rgba(35, 24, 16, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Avatar with Green Active Dot */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Avatar'}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #684835',
                  boxShadow: '0 4px 14px rgba(104, 72, 53, 0.25)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#F5ECE1',
                  color: '#684835',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  fontFamily: 'Cairo, sans-serif',
                  border: '3px solid #684835',
                  boxShadow: '0 4px 14px rgba(104, 72, 53, 0.25)',
                }}
              >
                {(fullName || user?.email || 'ط')[0].toUpperCase()}
              </div>
            )}
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                insetInlineEnd: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2.5px solid #FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
              title={lang === 'ar' ? 'حساب نشط ومسجل' : 'Active Account'}
            />
          </div>

          {/* Student Name & Meta Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: '#1E140E',
                  margin: 0,
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                {fullName || user?.email?.split('@')[0] || (lang === 'ar' ? 'طالب طب أسنان' : 'Dental Student')}
              </h1>

              {username && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#684835',
                    backgroundColor: '#F5EDE3',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    direction: 'ltr',
                  }}
                >
                  @{username}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flexWrap: 'wrap',
                marginTop: '0.4rem',
                fontSize: '0.82rem',
                color: '#73665C',
              }}
            >
              <span>{user?.email}</span>
              <span>•</span>
              <span style={{ color: '#684835', fontWeight: 700 }}>{getYearLabel(academicYear)}</span>
              <span>•</span>
              <span>{university}</span>
            </div>
          </div>
        </div>

        {/* Action: Sign Out */}
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/');
          }}
          className="btn btn-outline"
          style={{
            borderColor: '#E6DDD2',
            color: '#B91C1C',
            backgroundColor: '#FEF2F2',
            gap: '0.45rem',
            padding: '0.55rem 1rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          <LogOut size={15} />
          <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
        </button>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #E6DDD2',
          paddingBottom: '0.35rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: activeTab === 'profile' ? '#684835' : 'transparent',
            color: activeTab === 'profile' ? '#FFFFFF' : '#6E6258',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={17} />
          <span>{lang === 'ar' ? 'بياناتي وملفي الشخصي' : 'Personal & Academic Profile'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: activeTab === 'orders' ? '#684835' : 'transparent',
            color: activeTab === 'orders' ? '#FFFFFF' : '#6E6258',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
          }}
        >
          <ClipboardList size={17} />
          <span>
            {lang === 'ar' ? 'سجل طلباتي' : 'My Orders'} ({orders.length})
          </span>
        </button>
      </div>

      {/* ── TAB 1: PROFILE EDITOR ── */}
      {activeTab === 'profile' && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '2rem 2.25rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1.5px solid #E6DDD2',
            boxShadow: 'inset 0 1px 0 #FFFFFF, 0 10px 30px rgba(35, 24, 16, 0.05)',
          }}
        >
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #EFEBE4', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E140E', margin: 0, fontFamily: 'Cairo, sans-serif' }}>
              {lang === 'ar' ? 'تعديل بيانات الحساب والملف الشخصي' : 'Edit Profile Information'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#73665C', margin: '0.25rem 0 0 0' }}>
              {lang === 'ar'
                ? 'يمكنك تعديل اسمك، رقم الواتساب، واسم المستخدم وخيارات الخصوصية في أي وقت.'
                : 'Update your name, WhatsApp number, handle and privacy preferences anytime.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {message && (
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                backgroundColor: '#ECFDF5',
                border: '1.5px solid #6EE7B7',
                color: '#065F46',
                fontSize: '0.86rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '0.86rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {/* Grid 1: Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#3E2B1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} style={{ color: '#684835' }} />
                  <span>{lang === 'ar' ? 'الاسم الكامل الثلاثي' : 'Full Name'} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.95rem' }}
                />
              </div>

              {/* Username / Handle */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#3E2B1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AtSign size={15} style={{ color: '#684835' }} />
                  <span>{lang === 'ar' ? 'اسم المستخدم / اليوزر (Handle)' : 'Username / Handle'}</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    dir="ltr"
                    className="form-input"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.95rem', paddingInlineStart: '2rem' }}
                  />
                  <span style={{ position: 'absolute', insetInlineStart: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8A7B6E', fontWeight: 800 }}>
                    @
                  </span>
                </div>
              </div>
            </div>

            {/* Grid 2: Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* WhatsApp Phone */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#3E2B1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} style={{ color: '#684835' }} />
                  <span>{lang === 'ar' ? 'رقم الواتساب والهاتف الأساسي' : 'Primary WhatsApp / Phone'} *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="form-input"
                  placeholder="091 234 5678"
                  style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.95rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.72rem', color: '#8A7B6E', marginTop: '0.2rem', display: 'block' }}>
                  {lang === 'ar' ? 'مهم جداً لتنسيق واستلام طلباتك وتأكيد مواعيد التوصيل.' : 'Used for delivery coordination and order updates.'}
                </span>
              </div>

              {/* Secondary Phone */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#3E2B1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} style={{ color: '#8A7B6E' }} />
                  <span>{lang === 'ar' ? 'رقم هاتف إضافي (اختياري)' : 'Secondary Phone (Optional)'}</span>
                </label>
                <input
                  type="tel"
                  value={phoneSec}
                  onChange={(e) => setPhoneSec(e.target.value)}
                  dir="ltr"
                  className="form-input"
                  placeholder="092 000 0000"
                  style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.95rem' }}
                />
              </div>
            </div>

            {/* Grid 3: Academic Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* University Select */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#3E2B1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={15} style={{ color: '#684835' }} />
                  <span>{lang === 'ar' ? 'الجامعة' : 'University'} *</span>
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.95rem', backgroundColor: '#FFFFFF' }}
                >
                  {LIBYAN_UNIVERSITIES.map((uni, idx) => (
                    <option key={idx} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>

                {university === 'جامعة أخرى / خريج' && (
                  <input
                    type="text"
                    required
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب اسم جامعتك هنا...' : 'Enter your university name...'}
                    className="form-input"
                    style={{ width: '100%', marginTop: '0.5rem', borderRadius: '12px', padding: '0.6rem 0.9rem' }}
                  />
                )}
              </div>

              {/* Academic Year Selection */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#3E2B1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} style={{ color: '#684835' }} />
                  <span>{lang === 'ar' ? 'السنة الدراسية' : 'Academic Year'} *</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))', gap: '0.4rem' }}>
                  {ACADEMIC_YEARS.map((yr) => (
                    <button
                      key={yr.id}
                      type="button"
                      onClick={() => setAcademicYear(yr.id)}
                      style={{
                        padding: '0.5rem 0.4rem',
                        borderRadius: '10px',
                        border: academicYear === yr.id ? '2px solid #684835' : '1px solid #DFCEB9',
                        backgroundColor: academicYear === yr.id ? '#F4EDE4' : '#FFFFFF',
                        color: academicYear === yr.id ? '#4A3222' : '#6E6258',
                        fontFamily: 'Cairo, sans-serif',
                        fontSize: '0.78rem',
                        fontWeight: academicYear === yr.id ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {lang === 'ar' ? yr.labelAr : yr.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PRIVACY & ANONYMITY PREFERENCE CARD ── */}
            <div
              style={{
                backgroundColor: '#FAF7F2',
                border: '1.5px solid #E6DDD2',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <EyeOff size={18} style={{ color: '#684835' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3E2B1D' }}>
                    {lang === 'ar' ? 'تفضيل النشر بمجهول الهوية افتراضياً' : 'Default to Anonymous Posting'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#73665C', lineHeight: 1.45 }}>
                  {lang === 'ar'
                    ? 'عند تفعيل هذا الخيار، سيتم تحديد خيار (مجهول الهوية) افتراضياً عند مشاركة تجاربك أو كتابة تعليقاتك في الموقع، ويمكنك دائماً تغيير ذلك لكل مشاركة على حدة.'
                    : 'When enabled, new experiences and comments will default to Anonymous. You can always toggle this on individual posts.'}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymousDefault}
                onClick={() => setIsAnonymousDefault(!isAnonymousDefault)}
                style={{
                  width: '54px',
                  height: '30px',
                  borderRadius: '999px',
                  backgroundColor: isAnonymousDefault ? '#684835' : '#D6CBC1',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                  flexShrink: 0,
                  alignSelf: 'center',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    insetInlineStart: isAnonymousDefault ? '27px' : '3px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'inset-inline-start 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Actions: Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  backgroundColor: '#684835',
                  color: '#FFFFFF',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(104, 72, 53, 0.25)',
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>{lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                    <span>{lang === 'ar' ? 'حفظ وتحديث البيانات' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: ORDERS HISTORY ── */}
      {activeTab === 'orders' && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '2rem 2.25rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1.5px solid #E6DDD2',
            boxShadow: 'inset 0 1px 0 #FFFFFF, 0 10px 30px rgba(35, 24, 16, 0.05)',
          }}
        >
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #EFEBE4', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E140E', margin: 0, fontFamily: 'Cairo, sans-serif' }}>
              {lang === 'ar' ? 'سجل طلبات الأدوات والمستلزمات' : 'My Orders & Purchase History'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#73665C', margin: '0.25rem 0 0 0' }}>
              {lang === 'ar'
                ? 'يمكنك متابعة حالة الشحن، تتبع مسار المندوب، والاطلاع على الفاتورة الإلكترونية لأي طلب.'
                : 'Track shipping status, delivery coordination and electronic invoices.'}
            </p>
          </div>

          {loadingOrders ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '16px' }}></div>
              <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '16px' }}></div>
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                padding: '3.5rem 1rem',
                textAlign: 'center',
                backgroundColor: '#FAF7F2',
                borderRadius: '18px',
                border: '1.5px dashed #D6CBC1',
              }}
            >
              <ClipboardList size={42} style={{ color: '#8A7B6E', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3E2B1D', margin: '0 0 0.35rem 0' }}>
                {lang === 'ar' ? 'لم تقم بإجراء أي طلبات حتى الآن' : 'No past orders found'}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#73665C', margin: '0 0 1.25rem 0' }}>
                {lang === 'ar'
                  ? 'تصفح أقسام أدوات الدراسة وإكسسوارات الأسنان واطلب ما تحتاجه لسنتك الدراسية.'
                  : 'Browse study tools and dental kits to place your first order.'}
              </p>
              <Link
                to="/study-tools"
                className="btn btn-primary"
                style={{
                  padding: '0.65rem 1.45rem',
                  borderRadius: '12px',
                  backgroundColor: '#684835',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                {lang === 'ar' ? 'تصفح أدوات الدراسة الآن' : 'Browse Study Tools'}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: '#FAF7F2',
                    borderRadius: '16px',
                    border: '1.5px solid #E6DDD2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.96rem', color: '#1E140E', fontFamily: 'monospace' }}>
                        #{ord.order_number}
                      </span>
                      <span
                        style={{
                          padding: '0.15rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: ord.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                          color: ord.status === 'delivered' ? '#059669' : '#D97706',
                          border: ord.status === 'delivered' ? '1px solid #6EE7B7' : '1px solid #FCD34D',
                        }}
                      >
                        {t(`tracking.status_${ord.status}`) || ord.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8rem', color: '#73665C' }}>
                      <span>
                        {new Date(ord.created_at).toLocaleDateString('ar-LY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span style={{ fontWeight: 800, color: '#684835', fontSize: '0.92rem' }}>
                        {ord.total_price} {t('cart.currency')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      to={`/track?order=${ord.order_number}&phone=${ord.customer_phone || ''}`}
                      className="btn btn-outline"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        borderColor: '#D6CBC1',
                        color: '#4A3525',
                        textDecoration: 'none',
                      }}
                    >
                      {lang === 'ar' ? 'تتبع الشحن' : 'Track'}
                    </Link>

                    <Link
                      to={`/invoice/${ord.id}`}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        borderRadius: '10px',
                        backgroundColor: '#684835',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                      }}
                    >
                      {lang === 'ar' ? 'الفاتورة' : 'Invoice'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
