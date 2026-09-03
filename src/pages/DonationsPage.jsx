import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { 
  HeartHandshake, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, 
  Phone, MessageCircle, Calendar, Eye, Filter, Loader2, X
} from 'lucide-react';

const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export default function DonationsPage() {
  const { t, isRtl, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('browse'); // 'donate' or 'browse'
  
  // Data state
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [donations, setDonations] = useState([]);
  
  // Filter state
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    item_type: 'equipment',
    year_id: '',
    subject_id: '',
    condition: 'good',
    donor_name: '',
    donor_phone: '',
    donor_whatsapp: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: yearsData, error: yearsError } = await supabase
          .from('years')
          .select('*')
          .order('order_index', { ascending: true });
        
        if (!yearsError && yearsData) setYears(yearsData);
        
        await fetchDonations();
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch subjects when year changes in form
  useEffect(() => {
    if (!formData.year_id) {
      setSubjects([]);
      return;
    }
    
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('year_id', formData.year_id)
        .order('name_' + lang, { ascending: true });
      
      if (data) setSubjects(data);
    };
    
    fetchSubjects();
  }, [formData.year_id, lang]);

const DEFAULT_DONATIONS = [
  {
    id: 'd1',
    title: 'مجموعة أدوات نحت الشمع PKT',
    description: 'مجموعة أدوات نحت كاملة بحالة ممتازة إهداء لطلاب السنة الأولى كلية طب الأسنان.',
    item_type: 'equipment',
    condition: 'excellent',
    year_id: '10000000-0000-0000-0000-000000000001',
    subject_id: '11000000-0000-0000-0000-000000000011',
    donor_name: 'د. أحمد الطاهر',
    donor_phone: '0912345678',
    donor_whatsapp: '218912345678',
    image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format',
    status: 'active',
    views_count: 12,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'd2',
    title: 'ملازم ومذكرات تشريح ورسم الأسنان',
    description: 'ملازم شاملة ومذكرة رسم الأسنان ملونة ومطبوعة ورق مقوى إهداء لزملائنا الدفعة الجديدة.',
    item_type: 'sheets',
    condition: 'good',
    year_id: '10000000-0000-0000-0000-000000000001',
    subject_id: '11000000-0000-0000-0000-000000000011',
    donor_name: 'فاعل خير',
    donor_phone: '0923456789',
    donor_whatsapp: '218923456789',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format',
    status: 'active',
    views_count: 24,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'd3',
    title: 'مرآة ومسبار فحص طبي ووعاء خلط الملاط',
    description: 'أدوات فحص معملية مع زجاجة خلط الملاط بحالة جيدة جداً.',
    item_type: 'equipment',
    condition: 'excellent',
    year_id: '20000000-0000-0000-0000-000000000002',
    subject_id: '22000000-0000-0000-0000-000000000021',
    donor_name: 'طالب سنة ثالثة',
    donor_phone: '0945678901',
    donor_whatsapp: '218945678901',
    image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format',
    status: 'active',
    views_count: 18,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    years: { name_ar: 'السنة الثانية', name_en: '2nd Year' }
  }
];

const getLocalDonations = () => {
  try {
    const raw = localStorage.getItem('ad_donations');
    if (!raw) {
      localStorage.setItem('ad_donations', JSON.stringify(DEFAULT_DONATIONS));
      return DEFAULT_DONATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DONATIONS;
  }
};

const saveLocalDonation = (newItem) => {
  try {
    const current = getLocalDonations();
    const updated = [newItem, ...current];
    localStorage.setItem('ad_donations', JSON.stringify(updated));
    return updated;
  } catch {
    return [newItem];
  }
};

  const fetchDonations = async () => {
    try {
      let query = supabase
        .from('donations')
        .select(`
          *,
          years(name_ar, name_en)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (filterType) query = query.eq('item_type', filterType);
      if (filterYear) query = query.eq('year_id', filterYear);
        
      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        setDonations(data);
      } else {
        // Fallback to local storage
        let localData = getLocalDonations().filter(d => d.status === 'active');
        if (filterType) localData = localData.filter(d => d.item_type === filterType);
        if (filterYear) localData = localData.filter(d => d.year_id === filterYear);
        setDonations(localData);
      }
    } catch (err) {
      console.warn('Supabase fetch issue, using local donations:', err);
      let localData = getLocalDonations().filter(d => d.status === 'active');
      if (filterType) localData = localData.filter(d => d.item_type === filterType);
      if (filterYear) localData = localData.filter(d => d.year_id === filterYear);
      setDonations(localData);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [filterType, filterYear]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearForm = () => {
    setFormData({
      title: '',
      description: '',
      item_type: 'equipment',
      year_id: '',
      subject_id: '',
      condition: 'good',
      donor_name: '',
      donor_phone: '',
      donor_whatsapp: ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (imageFile) {
        const compressedBlob = await compressImage(imageFile);
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `donations/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('smylodent-assets')
          .upload(filePath, compressedBlob, {
            contentType: 'image/jpeg'
          });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('smylodent-assets')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }

      const newDonationObj = {
        id: 'd_' + Date.now(),
        title: formData.title,
        description: formData.description,
        item_type: formData.item_type,
        year_id: formData.year_id || null,
        subject_id: formData.subject_id || null,
        condition: formData.condition,
        donor_name: formData.donor_name,
        donor_phone: formData.donor_phone,
        donor_whatsapp: formData.donor_whatsapp || null,
        image_url: imageUrl || imagePreview || null,
        status: 'pending',
        views_count: 0,
        created_at: new Date().toISOString()
      };

      // Try Supabase insert
      try {
        const { error: insertError } = await supabase
          .from('donations')
          .insert([{
            title: formData.title,
            description: formData.description,
            item_type: formData.item_type,
            year_id: formData.year_id || null,
            subject_id: formData.subject_id || null,
            condition: formData.condition,
            donor_name: formData.donor_name,
            donor_phone: formData.donor_phone,
            donor_whatsapp: formData.donor_whatsapp || null,
            image_url: imageUrl,
            status: 'pending',
            views_count: 0
          }]);

        if (insertError) {
          saveLocalDonation(newDonationObj);
        }
      } catch {
        saveLocalDonation(newDonationObj);
      }

      // Insert notification for admins if table available
      try {
        await supabase.from('notifications').insert([{
          title: 'New Donation Pending',
          message: `New donation offer: ${formData.title} by ${formData.donor_name}`,
          type: 'donation',
          is_read: false
        }]);
      } catch (_) {}

      setSuccessMsg(t('donations.success_msg') || 'Donation submitted successfully and is pending approval.');
      clearForm();
      
    } catch (err) {
      console.warn('Handling submission via local storage:', err);
      const fallbackObj = {
        id: 'd_' + Date.now(),
        title: formData.title,
        description: formData.description,
        item_type: formData.item_type,
        year_id: formData.year_id || null,
        subject_id: formData.subject_id || null,
        condition: formData.condition,
        donor_name: formData.donor_name,
        donor_phone: formData.donor_phone,
        donor_whatsapp: formData.donor_whatsapp || null,
        image_url: imagePreview || null,
        status: 'pending',
        views_count: 0,
        created_at: new Date().toISOString()
      };
      saveLocalDonation(fallbackObj);
      setSuccessMsg(t('donations.success_msg') || 'Donation submitted successfully and is pending approval.');
      clearForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardClick = async (donation) => {
    // Increment view count
    try {
      await supabase
        .from('donations')
        .update({ views_count: (donation.views_count || 0) + 1 })
        .eq('id', donation.id);
        
      setDonations(prev => prev.map(d => 
        d.id === donation.id ? { ...d, views_count: (d.views_count || 0) + 1 } : d
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const getConditionColor = (cond) => {
    switch(cond) {
      case 'excellent': return 'var(--success)';
      case 'good': return 'var(--secondary)';
      case 'fair': return 'var(--accent)';
      default: return 'var(--text-muted)';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'sheets': return '#8b5cf6'; // purple
      case 'equipment': return '#0d9488'; // teal
      case 'other': return '#64748b'; // gray
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2.5rem 0', minHeight: '80vh' }}>
      
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2rem',
        color: '#fff',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>
            {t('donations.title') || 'Community Equipment Donations'}
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            {t('donations.subtitle') || 'Share what you don\'t need, find what you do. A platform by students, for students.'}
          </p>
        </div>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '1.5rem', 
          borderRadius: '50%',
          display: 'flex',
          backdropFilter: 'blur(10px)'
        }}>
          <HeartHandshake size={64} color="#fff" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '2rem',
        gap: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('browse')}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0',
            fontSize: '1.1rem',
            fontWeight: activeTab === 'browse' ? 'bold' : 'normal',
            color: activeTab === 'browse' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'browse' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          {t('donations.browse_tab') || 'Available Donations'}
        </button>
        <button
          onClick={() => setActiveTab('donate')}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0',
            fontSize: '1.1rem',
            fontWeight: activeTab === 'donate' ? 'bold' : 'normal',
            color: activeTab === 'donate' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'donate' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          {t('donations.donate_tab') || 'Donate a Tool'}
        </button>
      </div>

      {/* Tab Content: Browse */}
      {activeTab === 'browse' && (
        <div className="section animate-fade-in">
          
          {/* Filters */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label className="form-label">
                <Filter size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                Filter by Type
              </label>
              <select 
                className="form-input" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="sheets">{t('donations.type_sheets') || 'Sheets/Notes'}</option>
                <option value="equipment">{t('donations.type_equipment') || 'Equipment'}</option>
                <option value="other">{t('donations.type_other') || 'Other'}</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label className="form-label">Filter by Year</label>
              <select 
                className="form-input" 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y[`name_${lang}`] || y.name_en}</option>
                ))}
              </select>
            </div>
            {(filterType || filterYear) && (
              <button 
                className="btn btn-outline" 
                onClick={() => { setFilterType(''); setFilterYear(''); }}
                style={{ padding: '0.6rem 1rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="spinner" size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : donations.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <HeartHandshake size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--text-muted)' }}>{t('donations.no_donations') || 'No active donations found.'}</h3>
            </div>
          ) : (
            <div className="grid-4">
              {donations.map(donation => (
                <div 
                  key={donation.id} 
                  className="card" 
                  style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }}
                  onClick={() => handleCardClick(donation)}
                >
                  <div style={{ 
                    height: '200px', 
                    background: 'var(--bg)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'relative'
                  }}>
                    {donation.image_url ? (
                      <img 
                        src={donation.image_url} 
                        alt={donation.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <ImageIcon size={48} color="var(--text-muted)" style={{ opacity: 0.2 }} />
                    )}
                    
                    {/* Badges Overlay */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: getTypeColor(donation.item_type), 
                        color: 'white', 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'bold'
                      }}>
                        {t(`donations.type_${donation.item_type}`) || donation.item_type}
                      </span>
                      <span style={{ 
                        background: getConditionColor(donation.condition), 
                        color: 'white', 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'bold'
                      }}>
                        {t(`donations.condition_${donation.condition}`) || donation.condition}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{donation.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {donation.description}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>{donation.donor_name.split(' ')[0]}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>{new Date(donation.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={14} />
                        <span>{donation.views_count || 0}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      {donation.donor_whatsapp && (
                        <a 
                          href={`https://wa.me/${donation.donor_whatsapp.replace(/\D/g, '')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ flex: 1, background: '#25D366', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle size={16} /> WhatsApp
                        </a>
                      )}
                      <a 
                        href={`tel:${donation.donor_phone}`}
                        className="btn btn-outline"
                        style={{ flex: donation.donor_whatsapp ? '0 0 auto' : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={16} /> {donation.donor_whatsapp ? '' : 'Call'}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Donate */}
      {activeTab === 'donate' && (
        <div className="section animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', margin: 0 }}>
                <HeartHandshake />
                {t('donations.donate_tab') || 'Submit a Donation'}
              </h2>
            </div>

            {successMsg && (
              <div style={{
                background: 'rgba(16,185,129,0.1)',
                color: 'var(--success)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle2 size={24} />
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            )}

            {errorMsg && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--danger)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={24} />
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.item_name') || 'Item Name'} *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Articulator, Dental Chair..."
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.category') || 'Category'}</label>
                  <select
                    className="form-input"
                    name="item_type"
                    value={formData.item_type}
                    onChange={handleInputChange}
                  >
                    <option value="equipment">{t('donations.type_equipment') || 'Equipment'}</option>
                    <option value="sheets">{t('donations.type_sheets') || 'Sheets/Notes'}</option>
                    <option value="other">{t('donations.type_other') || 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('donations.description') || 'Description'}</label>
                <textarea
                  className="form-input"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Details about the item..."
                ></textarea>
              </div>

              <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Related Year (Optional)</label>
                  <select
                    className="form-input"
                    name="year_id"
                    value={formData.year_id}
                    onChange={handleInputChange}
                  >
                    <option value="">-- None --</option>
                    {years.map(y => (
                      <option key={y.id} value={y.id}>{y[`name_${lang}`] || y.name_en}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Related Subject (Optional)</label>
                  <select
                    className="form-input"
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    disabled={!formData.year_id || subjects.length === 0}
                  >
                    <option value="">-- None --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s[`name_${lang}`] || s.name_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('donations.condition') || 'Condition'}</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['excellent', 'good', 'fair'].map(cond => (
                    <label key={cond} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      border: `2px solid ${formData.condition === cond ? getConditionColor(cond) : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: formData.condition === cond ? `${getConditionColor(cond)}15` : 'transparent',
                      transition: 'var(--transition-fast)'
                    }}>
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={formData.condition === cond}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                      />
                      <div style={{ 
                        width: '16px', height: '16px', 
                        borderRadius: '50%', 
                        border: `2px solid ${formData.condition === cond ? getConditionColor(cond) : 'var(--text-muted)'}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}>
                        {formData.condition === cond && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getConditionColor(cond) }} />}
                      </div>
                      <span style={{ fontWeight: formData.condition === cond ? 'bold' : 'normal', color: formData.condition === cond ? getConditionColor(cond) : 'inherit' }}>
                        {t(`donations.condition_${cond}`) || cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.donor_name') || 'Your Name'} *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="donor_name"
                    value={formData.donor_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.phone') || 'Phone'} *</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="donor_phone"
                    value={formData.donor_phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.whatsapp') || 'WhatsApp'} (Optional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="donor_whatsapp"
                    value={formData.donor_whatsapp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Image (Optional, max 800px width)</label>
                <div style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'var(--bg)',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer'
                    }}
                  />
                  
                  {imagePreview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: 'var(--radius-sm)' }} />
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Change Image</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Upload size={32} />
                      <p>Click or drag to upload image</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  style={{ minWidth: '200px', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={20} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> {t('donations.submitting') || 'Submitting...'}</>
                  ) : (
                    <><HeartHandshake size={20} /> {t('donations.submit') || 'Submit Donation'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      )}
      
    </div>
  );
}
