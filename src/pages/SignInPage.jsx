import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, Phone, Landmark, Lock, HelpCircle } from 'lucide-react';
import MapPicker from '../components/MapPicker';

export const SignInPage = () => {
  const { t, isRtl, lang } = useLanguage();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialSignUp = searchParams.get('tab') === 'register' || searchParams.get('mode') === 'signup';
  const redirectParam = searchParams.get('redirect') || sessionStorage.getItem('ad_auth_return_url') || '/profile';

  // Mode state: signin vs signup
  const [isSignUp, setIsSignUp] = useState(initialSignUp);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'register' || params.get('mode') === 'signup') {
      setIsSignUp(true);
    } else if (params.get('tab') === 'login' || params.get('mode') === 'signin') {
      setIsSignUp(false);
    }
  }, [location.search]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('جامعة طرابلس');
  const [college, setCollege] = useState('كلية طب الأسنان');
  
  // Geolocation States (optional during signup)
  const [addressText, setAddressText] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const completeRedirect = () => {
    const savedReturn = sessionStorage.getItem('ad_auth_return_url');
    let target = searchParams.get('redirect') || savedReturn || '/profile';
    sessionStorage.removeItem('ad_auth_return_url');
    if (target.includes('/signin')) {
      target = '/profile';
    }
    navigate(target.startsWith('/') ? target : '/profile', { replace: true });
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user && user.email !== 'admin@smylodent.com') {
      completeRedirect();
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    const savedReturn = sessionStorage.getItem('ad_auth_return_url');
    const target = searchParams.get('redirect') || savedReturn || '/';
    const { error } = await signInWithGoogle(target);
    if (error) {
      setErrorMsg(error.message || (lang === 'ar' ? 'تعذّر تسجيل الدخول عبر Google حالياً.' : 'Google sign-in failed.'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await signUp(email, password, {
          full_name: fullName,
          phone: phone,
          university: university,
          college: college,
          address_text: addressText || null,
          latitude: latitude || null,
          longitude: longitude || null,
          role: 'student'
        });
        if (error) throw error;
        completeRedirect();
      } else {
        // Sign In
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        completeRedirect();
      }
    } catch (err) {
      console.error('Auth handler failed', err);
      setErrorMsg(err.message || 'حدث خطأ في عملية التحقق، يرجى المحاولة لاحقاً. / Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '3.5rem 0', display: 'flex', justifyContent: 'center' }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '2.5rem 2rem',
          backgroundColor: 'var(--surface-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.35rem'
        }}
      >
        {/* Heading Toggles */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem' }}>
            {isSignUp ? t('auth.signup_title') : t('auth.signin_title')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'ar'
              ? 'سجل دخولك لتتبع طلباتك، مشاركة تجربتك، وطلب توفير المنتجات.'
              : 'Sign in to track orders, share your experience, and request products.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.72rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            backgroundColor: '#FFFFFF',
            color: '#1E140E',
            fontWeight: 800,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(35, 24, 16, 0.05)',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
            <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.4 0 10.6 0 12s.6 3.6 1.6 5.6l3.7-2.8z"/>
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.7-2.9c-1 .7-2.2 1.1-3.6 1.1-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"/>
          </svg>
          <span>{lang === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span>{lang === 'ar' ? 'أو عبر البريد الإلكتروني' : 'Or via Email'}</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {isSignUp && (
            <>
              {/* Full name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('checkout.full_name')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('checkout.phone')} *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="09XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* University */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('checkout.university')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>

              {/* College */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('checkout.college')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              {/* Optional Map Location Selection */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">
                  {lang === 'ar' ? 'تحديد العنوان على الخريطة (اختياري)' : 'Select Address on Map (Optional)'}
                </label>
                {addressText && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    backgroundColor: 'var(--accent)', 
                    padding: '0.6rem', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '0.5rem', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-main)', 
                    fontWeight: 600 
                  }}>
                    📍 {addressText}
                  </div>
                )}
                <MapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onLocationSelect={({ lat, lng, address }) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    setAddressText(address);
                  }}
                  height="180px"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('auth.email')} *</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('auth.password')} *</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'جاري التحقق... / Please wait...' : (isSignUp ? t('auth.btn_signup') : t('auth.btn_signin'))}
          </button>

        </form>

        {/* Toggle Mode Link */}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg('');
          }}
          style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}
        >
          {isSignUp ? t('auth.have_account') : t('auth.no_account')}
        </button>

      </div>
    </div>
  );
};

export default SignInPage;
