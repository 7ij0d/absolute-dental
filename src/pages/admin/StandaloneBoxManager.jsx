import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Box, Lock, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';
import AdminQuickBoxes from './AdminQuickBoxes';

export const StandaloneBoxManager = () => {
  const { isRtl } = useLanguage();
  const { signIn, signOut } = useAuth();

  const [passcode, setPasscode] = useState(() => {
    return sessionStorage.getItem('admin_pin') || localStorage.getItem('admin_pin') || '';
  });
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setErrorMsg('');

    if (inputCode === '9922') {
      sessionStorage.setItem('admin_pin', '9922');
      localStorage.setItem('admin_pin', '9922');
      setPasscode('9922');
      try {
        await signIn('admin@smylodent.com', 'admin123');
      } catch (_) {}
      setVerifying(false);
    } else {
      setErrorMsg(isRtl ? 'رمز الدخول غير صحيح!' : 'Incorrect access code!');
      setVerifying(false);
    }
  };

  const handleLock = async () => {
    sessionStorage.removeItem('admin_pin');
    localStorage.removeItem('admin_pin');
    try {
      await signOut();
    } catch (_) {}
    setPasscode('');
    setInputCode('');
  };

  // 1. PIN Lock Screen
  if (passcode !== '9922') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8F4EE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        direction: isRtl ? 'rtl' : 'ltr'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          boxShadow: '0 20px 40px rgba(44, 26, 17, 0.08)',
          border: '1px solid rgba(180, 155, 130, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '20px',
            backgroundColor: 'linear-gradient(135deg, #4A3525 0%, #2C1A11 100%)',
            background: '#2C1A11',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(44, 26, 17, 0.25)'
          }}>
            <Box size={32} />
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#2C1A11' }}>
              {isRtl ? 'مدير البوكسات المستقل' : 'Dental Box Studio'}
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#7A6556' }}>
              {isRtl ? 'أدخل رمز الدخول لإدارة صور وألوان وحالات البوكسات' : 'Enter passcode to manage box colors & stock'}
            </p>
          </div>

          {errorMsg && (
            <div style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: '1px solid #FECACA'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleVerify} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              placeholder="••••"
              maxLength={8}
              autoFocus
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.8rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px solid rgba(180, 155, 130, 0.4)',
                backgroundColor: '#FAF8F5',
                color: '#2C1A11',
                fontWeight: 900
              }}
            />

            <button
              type="submit"
              disabled={verifying}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(44, 26, 17, 0.2)'
              }}
            >
              {verifying ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'دخول للمدير السريع' : 'Open Box Studio')}
            </button>
          </form>

          <Link
            to="/boxes"
            style={{
              fontSize: '0.82rem',
              color: '#7A6556',
              textDecoration: 'none',
              fontWeight: 600,
              marginTop: '0.5rem'
            }}
          >
            {isRtl ? '← العودة لمعاينة البوكسات في المتجر' : 'Return to store'}
          </Link>
        </div>
      </div>
    );
  }

  // 2. Standalone Box Manager Portal
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F2',
      direction: isRtl ? 'rtl' : 'ltr',
      paddingBottom: '4rem'
    }}>
      {/* Dedicated Standalone Header Bar */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(180, 155, 130, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(44, 26, 17, 0.04)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: '#2C1A11',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(44, 26, 17, 0.2)'
            }}>
              <Box size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#2C1A11' }}>
                {isRtl ? 'Absolute Dental — مدير البوكسات المستقل' : 'Absolute Dental — Standalone Box Studio'}
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#7A6556', fontWeight: 600 }}>
                {isRtl ? 'واجهة منفصلة مخصصة فقط للبوكسات وصورها وألوانها' : 'Standalone interface dedicated purely to boxes & color variants'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              to="/boxes"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '8px'
              }}
            >
              <ExternalLink size={14} />
              <span>{isRtl ? 'عرض صفحة البوكسات الحية' : 'Live Store'}</span>
            </Link>

            <Link
              to="/admin"
              className="btn btn-outline"
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                color: '#7A6556'
              }}
            >
              <span>{isRtl ? 'لوحة التحكم الكاملة' : 'Full Admin'}</span>
            </Link>

            <button
              onClick={handleLock}
              className="btn btn-outline"
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                color: '#DC2626',
                borderColor: 'rgba(220, 38, 38, 0.3)'
              }}
              title={isRtl ? 'قفل' : 'Lock'}
            >
              <Lock size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <AdminQuickBoxes />
      </main>
    </div>
  );
};

export default StandaloneBoxManager;
