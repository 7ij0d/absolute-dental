import React, { useState } from 'react';
import { X, Tag, Truck, Gift } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AnnouncementBar = () => {
  const { lang, isRtl } = useLanguage();
  const [visible, setVisible] = useState(true);

  const items = lang === 'ar'
    ? [
        { icon: <Truck size={13} />, text: 'توصيل مجاني لكلية طب الأسنان طرابلس 🦷' },
        { icon: <Tag size={13} />,   text: 'أسعار خاصة لطلاب الطب للعام الدراسي 2025-2026' },
        { icon: <Truck size={13} />, text: 'تتبع طلبك في أي وقت برقم هاتفك فقط 📦' },
        { icon: <Tag size={13} />,   text: 'جميع الأدوات الطبية أصلية ومعتمدة عالمياً ✅' },
      ]
    : [
        { icon: <Truck size={13} />, text: 'Free delivery to Tripoli Dental College 🦷' },
        { icon: <Tag size={13} />,   text: 'Special prices for dental students 2025-2026' },
        { icon: <Truck size={13} />, text: 'Track your order anytime using your phone number 📦' },
        { icon: <Tag size={13} />,   text: 'All medical tools are certified and authentic ✅' },
      ];

  if (!visible) return null;

  // Duplicate items for seamless loop
  const allItems = [...items, ...items];

  return (
    <div className="announcement-bar" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Marquee Track */}
      <div
        className="marquee-track"
        style={{
          animationDirection: isRtl ? 'reverse' : 'normal',
        }}
      >
        {allItems.map((item, i) => (
          <span key={i} className="marquee-item">
            {item.icon}
            <span>{item.text}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '0.5rem', marginLeft: '0.5rem' }}>•</span>
          </span>
        ))}
      </div>

      {/* Close Button */}
      <button
        onClick={() => setVisible(false)}
        style={{
          position: 'absolute',
          right: isRtl ? 'auto' : '0.75rem',
          left: isRtl ? '0.75rem' : 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          flexShrink: 0,
          zIndex: 2,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >
        <X size={11} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
