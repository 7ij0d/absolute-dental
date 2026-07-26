import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import supabase from '../supabaseClient';
import { Phone, Send, Mail, MapPin, CheckCircle2, MessageSquare } from 'lucide-react';

export const ContactPage = () => {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [contacts, setContacts] = useState({
    whatsapp: 'https://wa.me/218911234567',
    telegram: 'https://t.me/smylodent_libya',
    instagram: 'https://instagram.com/smylodent',
    facebook: 'https://facebook.com/smylodent'
  });

  // Load contact links from database settings
  useEffect(() => {
    const fetchContactSettings = async () => {
      const { data } = await supabase.from('settings').eq('key', 'contact_links').single();
      if (data?.value) {
        setContacts(data.value);
      }
    };
    fetchContactSettings();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !messageText.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          message: messageText.trim()
        });
      
      if (error) throw error;

      // Add Admin alert notification
      await supabase.from('notifications').insert({
        title_ar: 'رسالة تواصل جديدة',
        title_en: 'New Contact Message',
        message_ar: `رسالة جديدة من ${name} (${phone})`,
        message_en: `New inquiry from ${name} (${phone})`,
        type: 'general'
      });

      setSuccess(true);
      setName('');
      setPhone('');
      setMessageText('');
    } catch (err) {
      console.error('Inbox submission failed', err);
      setErrorMsg('حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً. / Send failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2.5rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Heading */}
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('nav.contact')}
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          لديك استفسار أو طلب خاص؟ تواصل معنا وسنجيبك في أسرع وقت. / Reach out to us.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }} className="contact-grid">
        
        {/* Contact form column */}
        <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)' }}>
          
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={18} style={{ color: 'var(--secondary)' }} />
            نموذج مراسلة الدعم / Contact Support Form
          </h3>

          {success && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} />
              <span>تم إرسال رسالتك بنجاح! وسيتواصل معك فريقنا قريباً. / Sent successfully.</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.full_name')} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.phone')} *</label>
              <input
                type="tel"
                className="form-input"
                required
                placeholder="09XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('product.comment')} *</label>
              <textarea
                className="form-input"
                required
                rows="4"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب استفسارك هنا بالتفصيل..."
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
              {submitting ? 'جاري الإرسال... / Sending...' : 'إرسال الرسالة / Send Message'}
            </button>

          </form>
        </div>

        {/* Info detail column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>معلومات الاتصال المباشر</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              
              <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} className="contact-link-row">
                <div style={{ color: 'var(--secondary)' }}><Phone size={20} /></div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>واتساب / WhatsApp</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>محادثة مباشرة لطلبات الكليات والجملة</p>
                </div>
              </a>

              <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} className="contact-link-row">
                <div style={{ color: 'var(--secondary)' }}><Send size={20} /></div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>تيليجرام / Telegram</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مجموعات وقنوات الدفعة والتواصل مع الطلبة</p>
                </div>
              </a>

            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <MapPin size={24} style={{ color: 'var(--secondary)' }} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>مقر الخدمات الرئيسي</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>كلية طب وجراحة الفم والأسنان - جامعة طرابلس، ليبيا</p>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .contact-link-row {
          transition: var(--transition-smooth);
        }
        .contact-link-row:hover {
          background-color: var(--accent);
          border-color: var(--secondary) !important;
        }
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;
