import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import {
  User,
  Phone,
  AtSign,
  GraduationCap,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Camera,
  Loader2,
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

export const CompleteProfileModal = () => {
  const { user, profile, showProfileCompletion, setShowProfileCompletion, setProfile } = useAuth();
  const { lang, isRtl } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [university, setUniversity] = useState(LIBYAN_UNIVERSITIES[0]);
  const [academicYear, setAcademicYear] = useState('2nd-year');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-fill initial values from user metadata or profile
  useEffect(() => {
    if (!user) return;

    const meta = user.user_metadata || {};
    const initialName = profile?.full_name || meta.full_name || meta.name || '';
    const initialPhone = profile?.phone || meta.phone || '';
    const initialAvatar = meta.avatar_url || meta.picture || profile?.avatar_url || '';
    const emailPrefix = (user.email || '').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const initialUsername = meta.username || profile?.username || emailPrefix;

    setFullName(initialName);
    setPhone(initialPhone);
    setAvatarUrl(initialAvatar);
    setUsername(initialUsername);
    if (profile?.university) setUniversity(profile.university);
    if (meta.academic_year) setAcademicYear(meta.academic_year);
  }, [user, profile]);

  if (!showProfileCompletion || !user || user.email === 'admin@smylodent.com') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanUser = username.trim().replace(/^@+/, '');

    if (!cleanName) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال اسمك الكامل.' : 'Please enter your full name.');
      return;
    }

    if (!cleanPhone) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رقم الواتساب للتواصل بخصوص الطلبات والتوصيل.'
          : 'Please enter your WhatsApp / phone number for orders and delivery.'
      );
      return;
    }

    if (cleanPhone.length < 8) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال رقم هاتف صحيح (مثال: 0912345678).'
          : 'Please enter a valid phone number (e.g. 0912345678).'
      );
      return;
    }

    setSaving(true);
    try {
      // 1. Update public.profiles row in database
      const profilePayload = {
        id: user.id,
        full_name: cleanName,
        phone: cleanPhone,
        email: user.email,
        university: university,
        college: 'كلية طب وجراحة الفم والأسنان',
        role: 'student',
        status: 'active',
      };

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload)
        .select()
        .maybeSingle();

      if (profileError) throw profileError;

      // 2. Update auth user metadata (stores username, avatar_url, academic_year)
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            username: cleanUser,
            academic_year: academicYear,
            avatar_url: avatarUrl || undefined,
          },
        });
      } catch (authMetaErr) {
        console.warn('Could not update user metadata', authMetaErr);
      }

      // 3. Update local auth state
      const finalObj = {
        ...(updatedProfile || profilePayload),
        username: cleanUser,
        academic_year: academicYear,
        avatar_url: avatarUrl,
      };
      setProfile(finalObj);
      try {
        localStorage.setItem('ad_cached_profile', JSON.stringify(finalObj));
      } catch (_) {}

      setSuccessMsg(
        lang === 'ar'
          ? 'تم حفظ وتأكيد بيانات حسابك بنجاح! مرحباً بك معنا.'
          : 'Profile confirmed successfully! Welcome to Absolute Dental.'
      );

      // Auto close after brief success confirmation
      setTimeout(() => {
        setShowProfileCompletion(false);
      }, 1000);
    } catch (err) {
      console.error('Error saving student profile:', err);
      setErrorMsg(err.message || (lang === 'ar' ? 'تعذّر حفظ البيانات، يرجى المحاولة مرة أخرى.' : 'Failed to save profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowProfileCompletion(false);
  };

  return createPortal(
    <div
      className="ad-modal-backdrop"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 19, 14, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
    >
      <div
        className="ad-modal-dialog animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '2rem 1.85rem',
          border: '1.5px solid #E6DDD2',
          boxShadow: 'inset 0 1px 0 #FFFFFF, 0 24px 60px rgba(35, 24, 16, 0.3)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
          style={{
            position: 'absolute',
            top: '1.25rem',
            insetInlineEnd: '1.25rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid #EADECE',
            backgroundColor: '#FAF6F0',
            color: '#6E6258',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* Header / Avatar Profile Visual */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.85rem' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Avatar'}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #684835',
                  boxShadow: '0 4px 16px rgba(104, 72, 53, 0.2)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: '#F5ECE1',
                  color: '#684835',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #684835',
                  boxShadow: '0 4px 16px rgba(104, 72, 53, 0.2)',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                {fullName ? fullName.trim()[0].toUpperCase() : <User size={34} />}
              </div>
            )}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                insetInlineEnd: 0,
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
              title={lang === 'ar' ? 'تم تسجيل الدخول' : 'Logged In'}
            >
              <CheckCircle2 size={15} strokeWidth={2.8} />
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: '#F5EDE3',
              color: '#684835',
              fontSize: '0.74rem',
              fontWeight: 800,
              marginBottom: '0.45rem',
            }}
          >
            <Sparkles size={13} strokeWidth={2.4} />
            <span>{lang === 'ar' ? 'تسجيل الدخول ناجح!' : 'Google Sign-in Successful!'}</span>
          </div>

          <h2
            style={{
              fontFamily: 'Cairo, sans-serif',
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#1E140E',
              margin: '0 0 0.35rem 0',
            }}
          >
            {lang === 'ar' ? 'تأكيد بيانات الطالب' : 'Complete Student Details'}
          </h2>

          <p
            style={{
              fontFamily: 'Cairo, sans-serif',
              fontSize: '0.86rem',
              color: '#73665C',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {lang === 'ar'
              ? 'مرحباً بك! يرجى تأكيد بياناتك الأساسية لتفعيل حسابك وتسهيل التواصل معك عبر الواتساب.'
              : 'Welcome! Please confirm your basic details to activate your account and WhatsApp updates.'}
          </p>
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #6EE7B7',
              color: '#065F46',
              fontSize: '0.85rem',
              fontWeight: 800,
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Full Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#3B291D',
                marginBottom: '0.35rem',
              }}
            >
              <User size={15} style={{ color: '#684835' }} />
              <span>{lang === 'ar' ? 'الاسم الكامل الثلاثي' : 'Full Name'} *</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: طه محمد أحمد' : 'e.g. Taha Mohamed'}
              className="form-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: '12px',
                border: '1.5px solid #DFCEB9',
                fontSize: '0.9rem',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 600,
              }}
            />
          </div>

          {/* 2. WhatsApp / Phone Number */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#3B291D',
                marginBottom: '0.35rem',
              }}
            >
              <Phone size={15} style={{ color: '#684835' }} />
              <span>{lang === 'ar' ? 'رقم الواتساب للتواصل بخصوص الطلبات' : 'WhatsApp Number (Orders & Delivery)'} *</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="091 234 5678"
              dir="ltr"
              className="form-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: '12px',
                border: '1.5px solid #DFCEB9',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#8A7A6E', marginTop: '0.2rem', display: 'block' }}>
              {lang === 'ar'
                ? 'سنرسل لك تحديثات الشحن وتأكيد طلباتك عبر هذا الرقم.'
                : 'Order confirmation and delivery tracking will be coordinated via WhatsApp.'}
            </span>
          </div>

          {/* 3. Username / Handle */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#3B291D',
                marginBottom: '0.35rem',
              }}
            >
              <AtSign size={15} style={{ color: '#684835' }} />
              <span>{lang === 'ar' ? 'اسم المستخدم / اليوزر (Handle)' : 'Username / Handle'}</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dentist_taha"
                dir="ltr"
                className="form-input"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.95rem',
                  paddingInlineStart: '2rem',
                  borderRadius: '12px',
                  border: '1.5px solid #DFCEB9',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  insetInlineStart: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8A7A6E',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                @
              </span>
            </div>
          </div>

          {/* 4. University Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#3B291D',
                marginBottom: '0.35rem',
              }}
            >
              <GraduationCap size={15} style={{ color: '#684835' }} />
              <span>{lang === 'ar' ? 'الجامعة والكلية' : 'University & Faculty'}</span>
            </label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="form-select"
              style={{
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: '12px',
                border: '1.5px solid #DFCEB9',
                fontSize: '0.86rem',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
              }}
            >
              {LIBYAN_UNIVERSITIES.map((uni, idx) => (
                <option key={idx} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Academic Year Selection */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#3B291D',
                marginBottom: '0.35rem',
              }}
            >
              <Calendar size={15} style={{ color: '#684835' }} />
              <span>{lang === 'ar' ? 'السنة الدراسية' : 'Academic Year'}</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                gap: '0.45rem',
              }}
            >
              {ACADEMIC_YEARS.map((yr) => (
                <button
                  key={yr.id}
                  type="button"
                  onClick={() => setAcademicYear(yr.id)}
                  style={{
                    padding: '0.45rem 0.5rem',
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

          {/* Actions: Save & Continue */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem' }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '0.72rem 1rem',
                borderRadius: '12px',
                borderColor: '#DFCEB9',
                color: '#73665C',
                fontFamily: 'Cairo, sans-serif',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {lang === 'ar' ? 'إكمال لاحقاً' : 'Complete Later'}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-secondary"
              style={{
                flex: 2,
                padding: '0.72rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: '#684835',
                color: '#FFFFFF',
                fontFamily: 'Cairo, sans-serif',
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(104, 72, 53, 0.28)',
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
                  <span>{lang === 'ar' ? 'حفظ وتأكيد الحساب' : 'Save & Confirm Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CompleteProfileModal;
