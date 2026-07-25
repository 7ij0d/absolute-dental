import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import { Settings as SettingsIcon, Save, Link, Truck, ShieldAlert } from 'lucide-react';

export const Settings = () => {
  const { t } = useLanguage();

  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  const [tripoliFacultyRate, setTripoliFacultyRate] = useState(0);
  const [tripoliHomeRate, setTripoliHomeRate] = useState(10);
  const [otherCitiesRate, setOtherCitiesRate] = useState(25);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // 1. Fetch contact links
      const { data: contacts } = await supabase.from('settings').eq('key', 'contact_links').single();
      if (contacts?.value) {
        setWhatsapp(contacts.value.whatsapp || '');
        setTelegram(contacts.value.telegram || '');
        setInstagram(contacts.value.instagram || '');
        setFacebook(contacts.value.facebook || '');
      }

      // 2. Fetch shipping rates
      const { data: shipping } = await supabase.from('settings').eq('key', 'shipping_rates').single();
      if (shipping?.value) {
        setTripoliFacultyRate(shipping.value.tripoli_dental_college || 0);
        setTripoliHomeRate(shipping.value.tripoli_delivery || 0);
        setOtherCitiesRate(shipping.value.other_cities || 0);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      // 1. Save contact links
      await supabase.from('settings').upsert({
        key: 'contact_links',
        value: { whatsapp, telegram, instagram, facebook }
      });

      // 2. Save shipping rates
      await supabase.from('settings').upsert({
        key: 'shipping_rates',
        value: {
          tripoli_dental_college: parseFloat(tripoliFacultyRate),
          tripoli_delivery: parseFloat(tripoliHomeRate),
          other_cities: parseFloat(otherCitiesRate)
        }
      });

      setSuccessMsg('تم حفظ الإعدادات بنجاح! / Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحفظ. / Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="skeleton" style={{ height: '30px', width: '200px', marginBottom: '2rem' }}></div>
        <div className="skeleton" style={{ height: '280px', width: '100%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={24} style={{ color: 'var(--secondary)' }} />
          {t('admin.settings')}
        </h1>
      </div>

      {successMsg && (
        <div style={{ padding: '0.8rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Settings form */}
      <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="settings-grid">
        
        {/* Contact Links card */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1rem', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Link size={18} style={{ color: 'var(--secondary)' }} />
            روابط التواصل الاجتماعي والدعم
          </h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">رابط واتساب (WhatsApp Link)</label>
            <input type="url" className="form-input" placeholder="https://wa.me/218..." value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">رابط تيليجرام (Telegram Link)</label>
            <input type="url" className="form-input" placeholder="https://t.me/..." value={telegram} onChange={(e) => setTelegram(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">رابط إنستغرام (Instagram Link)</label>
            <input type="url" className="form-input" placeholder="https://instagram.com/..." value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">رابط فيسبوك (Facebook Link)</label>
            <input type="url" className="form-input" placeholder="https://facebook.com/..." value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>
        </div>

        {/* Shipping configurations card */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1rem', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck size={18} style={{ color: 'var(--secondary)' }} />
            تسعير وتكلفة التوصيل والشحن
          </h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">توصيل كلية طب الأسنان طرابلس (د.ل) *</label>
            <input type="number" className="form-input" value={tripoliFacultyRate} onChange={(e) => setTripoliFacultyRate(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">توصيل المنزل داخل طرابلس (د.ل) *</label>
            <input type="number" className="form-input" value={tripoliHomeRate} onChange={(e) => setTripoliHomeRate(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">شحن لبقية المدن والمناطق (د.ل) *</label>
            <input type="number" className="form-input" value={otherCitiesRate} onChange={(e) => setOtherCitiesRate(e.target.value)} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving} className="btn btn-secondary" style={{ width: '100%', gap: '0.4rem', marginTop: '1.5rem', padding: '0.75rem' }}>
            <Save size={18} />
            {saving ? 'جاري حفظ التغييرات...' : 'حفظ الإعدادات بالكامل'}
          </button>
        </div>

      </form>

      <style>{`
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
