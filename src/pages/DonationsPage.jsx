import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { 
  HeartHandshake, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, 
  Phone, MessageCircle, Calendar, Eye, Filter, Loader2, X,
  Lock, ShieldCheck, Smartphone, Send, Copy, Plus, HelpCircle
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

const FALLBACK_YEARS = [
  { id: '10000000-0000-0000-0000-000000000001', name_ar: 'السنة الأولى',  name_en: '1st Year', slug: '1st-year' },
  { id: '20000000-0000-0000-0000-000000000002', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year' },
  { id: '30000000-0000-0000-0000-000000000003', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year' },
  { id: '40000000-0000-0000-0000-000000000004', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year' },
];

const DEFAULT_STUDENT_REQUESTS = [
  {
    id: 'req_1',
    item_title: 'ملازم ومذكرات رسم وتشريح الأسنان ملونة',
    description: 'محتاج ملازم ومذكرة رسم الأسنان ملونة لدخول امتحان العملي الطارئ، لعدم توفر ميزانية الشراء حالياً.',
    year_id: '10000000-0000-0000-0000-000000000001',
    student_real_name: 'طالب سنة أولى',
    student_phone: '0910000000',
    student_telegram: '@dental_std1',
    status: 'searching',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    years: { name_ar: 'السنة الأولى', name_en: '1st Year' }
  },
  {
    id: 'req_2',
    item_title: 'أدوات نحت الشمع PKT ووعاء الخلط معمل الفانتوم',
    description: 'طالب محتاج طقم أدوات نحت شمع كامل لدخول معمل الفانتوم لعدم القدرة على شراء طقم جديد.',
    year_id: '20000000-0000-0000-0000-000000000002',
    student_real_name: 'طالب سنة ثانية',
    student_phone: '0920000000',
    student_telegram: null,
    status: 'searching',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    years: { name_ar: 'السنة الثانية', name_en: '2nd Year' }
  }
];

const getLocalStudentRequests = () => {
  try {
    const raw = localStorage.getItem('ad_student_requests');
    if (!raw) {
      localStorage.setItem('ad_student_requests', JSON.stringify(DEFAULT_STUDENT_REQUESTS));
      return DEFAULT_STUDENT_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STUDENT_REQUESTS;
  }
};

const saveLocalStudentRequest = (newItem) => {
  try {
    const current = getLocalStudentRequests();
    const updated = [newItem, ...current];
    localStorage.setItem('ad_student_requests', JSON.stringify(updated));
    return updated;
  } catch {
    return [newItem];
  }
};

export default function DonationsPage() {
  const { t, isRtl, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'donate', 'requests', 'balance'
  
  // Data state
  const [years, setYears] = useState(FALLBACK_YEARS);
  const [subjects, setSubjects] = useState([]);
  const [donations, setDonations] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  
  // Filter state
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  
  // Tool Donation Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    item_type: 'equipment',
    year_id: '',
    subject_id: '',
    condition: 'good',
    donor_phone: '',
    donor_whatsapp: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Student Need Request Form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    item_title: '',
    description: '',
    year_id: '',
    subject_id: '',
    student_real_name: '',
    student_phone: '',
    student_telegram: ''
  });
  const [requestSubjects, setRequestSubjects] = useState([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');
  const [requestErrorMsg, setRequestErrorMsg] = useState('');

  // Balance Scratch Card Form state
  const [scratchCard, setScratchCard] = useState({
    network: 'libyana',
    code: '',
    amount: '5'
  });
  const [copiedNumber, setCopiedNumber] = useState('');
  
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
        
        if (!yearsError && yearsData && yearsData.length > 0) {
          setYears(yearsData);
        } else {
          setYears(FALLBACK_YEARS);
        }
        
        await fetchDonations();
        await fetchStudentRequests();
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setYears(FALLBACK_YEARS);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  const fetchStudentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('student_requests')
        .select('*, years(name_ar, name_en)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setStudentRequests(data);
      } else {
        setStudentRequests(getLocalStudentRequests());
      }
    } catch {
      setStudentRequests(getLocalStudentRequests());
    }
  };

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
        // Fallback to local storage with resilient year matching
        let localData = getLocalDonations().filter(d => d.status === 'active');
        if (filterType) localData = localData.filter(d => d.item_type === filterType);
        if (filterYear) {
          localData = localData.filter(d => 
            String(d.year_id) === String(filterYear) || 
            d.years?.slug === filterYear || 
            d.year_id === filterYear
          );
        }
        setDonations(localData);
      }
    } catch (err) {
      console.warn('Supabase fetch issue, using local donations:', err);
      let localData = getLocalDonations().filter(d => d.status === 'active');
      if (filterType) localData = localData.filter(d => d.item_type === filterType);
      if (filterYear) {
        localData = localData.filter(d => 
          String(d.year_id) === String(filterYear) || 
          d.years?.slug === filterYear || 
          d.year_id === filterYear
        );
      }
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

      const defaultDonorName = 'فاعل/فاعلة خير';

      const newDonationObj = {
        id: 'd_' + Date.now(),
        title: formData.title,
        description: formData.description,
        item_type: formData.item_type,
        year_id: formData.year_id || null,
        subject_id: formData.subject_id || null,
        condition: formData.condition,
        donor_name: defaultDonorName,
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
            donor_name: defaultDonorName,
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
          message: `New donation offer: ${formData.title}`,
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
        donor_name: 'فاعل/فاعلة خير',
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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    setRequestSuccessMsg('');
    setRequestErrorMsg('');

    const newReq = {
      id: 'req_' + Date.now(),
      item_title: requestForm.item_title,
      description: requestForm.description,
      year_id: requestForm.year_id || null,
      subject_id: requestForm.subject_id || null,
      student_real_name: requestForm.student_real_name,
      student_phone: requestForm.student_phone,
      student_telegram: requestForm.student_telegram || null,
      status: 'searching',
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('student_requests')
        .insert([{
          item_title: requestForm.item_title,
          description: requestForm.description,
          year_id: requestForm.year_id || null,
          subject_id: requestForm.subject_id || null,
          student_real_name: requestForm.student_real_name,
          student_phone: requestForm.student_phone,
          student_telegram: requestForm.student_telegram || null,
          status: 'searching'
        }]);

      if (error) saveLocalStudentRequest(newReq);
    } catch {
      saveLocalStudentRequest(newReq);
    }

    setStudentRequests(prev => [newReq, ...prev]);
    setRequestSuccessMsg(t('donations.request_success') || 'تم تسجيل طلب احتياجك بنجاح! يسعى المشرفون لتوفيره وسيتم التواصل معك فور توفره 🎉');
    setRequestForm({
      item_title: '',
      description: '',
      year_id: '',
      subject_id: '',
      student_real_name: '',
      student_phone: '',
      student_telegram: ''
    });
    setIsSubmittingRequest(false);
  };

  const handleSendScratchCard = (e) => {
    e.preventDefault();
    if (!scratchCard.code) return;

    const networkName = scratchCard.network === 'libyana' ? 'ليبيانا Libyana' : 'مدار Madar';
    const message = `السلام عليكم، أود التبرع برصيد ${networkName} بكود الكرت: ${scratchCard.code} بقيمة ${scratchCard.amount} د.ل لدعم بنك أدوات ومستلزمات الطلاب.`;
    const whatsappUrl = `https://wa.me/218911234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('browse')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.85rem 0',
            fontSize: '1.05rem',
            fontWeight: activeTab === 'browse' ? 'bold' : 'normal',
            color: activeTab === 'browse' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'browse' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📦 {t('donations.browse_tab') || 'الأدوات المتبرع بها'}
        </button>

        <button
          onClick={() => setActiveTab('donate')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.85rem 0',
            fontSize: '1.05rem',
            fontWeight: activeTab === 'donate' ? 'bold' : 'normal',
            color: activeTab === 'donate' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'donate' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          🎁 {t('donations.donate_tab') || 'تبرع بأداة'}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.85rem 0',
            fontSize: '1.05rem',
            fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
            color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'requests' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          🙋‍♂️ {t('donations.requests_tab') || 'طلبات الاحتياج الطلابية'}
        </button>

        <button
          onClick={() => setActiveTab('balance')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.85rem 0',
            fontSize: '1.05rem',
            fontWeight: activeTab === 'balance' ? 'bold' : 'normal',
            color: activeTab === 'balance' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'balance' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📱 {t('donations.balance_tab') || 'التبرع برصيد (ليبيانا / مدار)'}
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
                {isRtl ? 'تصفية حسب النوع' : 'Filter by Type'}
              </label>
              <select 
                className="form-input" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">{isRtl ? 'جميع الأنواع' : 'All Types'}</option>
                <option value="sheets">{t('donations.type_sheets') || 'Sheets/Notes'}</option>
                <option value="equipment">{t('donations.type_equipment') || 'Equipment'}</option>
                <option value="other">{t('donations.type_other') || 'Other'}</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label className="form-label">{isRtl ? 'تصفية حسب السنة' : 'Filter by Year'}</label>
              <select 
                className="form-input" 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">{isRtl ? 'جميع السنوات الدراسية' : 'All Academic Years'}</option>
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y[`name_${lang}`] || y.name_ar || y.name_en}</option>
                ))}
              </select>
            </div>
            {(filterType || filterYear) && (
              <button 
                className="btn btn-outline" 
                onClick={() => { setFilterType(''); setFilterYear(''); }}
                style={{ padding: '0.6rem 1rem' }}
              >
                {isRtl ? 'مسح التصفية' : 'Clear Filters'}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                        <span>{isRtl ? 'إهداء مجاني 🎁' : 'Free Gift 🎁'}</span>
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
                  <label className="form-label">{t('donations.item_name') || 'اسم الأداة / المستلزم'} *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder={t('donations.item_name_placeholder') || (isRtl ? 'مثال: دنتال واكس، شيتات فارما، أدوات عملي...' : 'e.g. Dental Wax, Pharma Sheets, Carving tools...')}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.category') || 'نوع التبرع'}</label>
                  <select
                    className="form-input"
                    name="item_type"
                    value={formData.item_type}
                    onChange={handleInputChange}
                  >
                    <option value="equipment">{t('donations.type_equipment') || 'أدوات ومعدات'}</option>
                    <option value="sheets">{t('donations.type_sheets') || 'ملازم ومذكرات'}</option>
                    <option value="other">{t('donations.type_other') || 'أخرى'}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('donations.description') || 'وصف إضافي عن الأداة'}</label>
                <textarea
                  className="form-input"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder={isRtl ? 'حالة الأداة بالتفصيل، مكان التسليم، أية تفاصيل أخرى...' : 'Item details, hand-off preference...'}
                ></textarea>
              </div>

              <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{isRtl ? 'السنة الدراسية (اختياري)' : 'Academic Year (Optional)'}</label>
                  <select
                    className="form-input"
                    name="year_id"
                    value={formData.year_id}
                    onChange={handleInputChange}
                  >
                    <option value="">{isRtl ? '-- اختيار السنة --' : '-- Select Year --'}</option>
                    {years.map(y => (
                      <option key={y.id} value={y.id}>{y[`name_${lang}`] || y.name_ar || y.name_en}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{isRtl ? 'المادة (اختياري)' : 'Subject (Optional)'}</label>
                  <select
                    className="form-input"
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    disabled={!formData.year_id || subjects.length === 0}
                  >
                    <option value="">{isRtl ? '-- اختيار المادة --' : '-- Select Subject --'}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s[`name_${lang}`] || s.name_ar || s.name_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('donations.condition') || 'حالة الأداة'}</label>
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

              <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.phone') || 'رقم الهاتف'} *</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="donor_phone"
                    value={formData.donor_phone}
                    onChange={handleInputChange}
                    required
                    placeholder="0912345678"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('donations.whatsapp') || 'رقم واتساب'} ({isRtl ? 'اختياري' : 'Optional'})</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="donor_whatsapp"
                    value={formData.donor_whatsapp}
                    onChange={handleInputChange}
                    placeholder="218912345678"
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

      {/* Tab Content: Student Requests */}
      {activeTab === 'requests' && (
        <div className="section animate-fade-in">
          
          {/* Privacy & Info Banner */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🙋‍♂️ {t('donations.requests_tab') || 'طلبات الاحتياج الطلابية'}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {isRtl ? 'قائمة بالأدوات والملازم المطلوبة من الطلاب لظروف دراسية أو طارئة' : 'List of tools & notes needed by students'}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRequestForm(!showRequestForm)}
                style={{ padding: '0.65rem 1.25rem', gap: '0.5rem' }}
              >
                <Plus size={18} />
                {t('donations.request_tool_btn') || 'اطلب أداة تحتاجها 🙋‍♂️'}
              </button>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Lock size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{t('donations.request_privacy_note') || '🔒 جميع بياناتك واسمك تظل سرية ومحمية لدى إدارة الكلية والمشرفين فقط لتوفير الأداة وتسليمها لك ولا تظهر للعامة مطلقاً.'}</span>
            </div>
          </div>

          {/* Form Modal/Card for submitting request */}
          {showRequestForm && (
            <div className="card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'var(--surface-color)', border: '2px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                  {t('donations.request_form_title') || 'تقديم طلب احتياج لأداة أو مستلزم دراسي'}
                </h3>
                <button onClick={() => setShowRequestForm(false)} className="action-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {requestSuccessMsg && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} />
                  <span>{requestSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleRequestSubmit}>
                <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t('donations.need_title') || 'اسم الأداة أو الشيت المطلوب'} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={requestForm.item_title}
                      onChange={(e) => setRequestForm({ ...requestForm, item_title: e.target.value })}
                      required
                      placeholder={isRtl ? 'مثال: طقم نحت الشمع PKT، ملازم التشريح...' : 'e.g. PKT Wax Carving set, Anatomy sheets'}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{isRtl ? 'السنة الدراسية' : 'Academic Year'}</label>
                    <select
                      className="form-input"
                      value={requestForm.year_id}
                      onChange={(e) => setRequestForm({ ...requestForm, year_id: e.target.value })}
                    >
                      <option value="">{isRtl ? '-- اختيار السنة --' : '-- Select Year --'}</option>
                      {years.map(y => (
                        <option key={y.id} value={y.id}>{y[`name_${lang}`] || y.name_ar || y.name_en}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">{t('donations.description') || 'تفاصيل عن طلبك وحالتك الدراسية'}</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    placeholder={isRtl ? 'اشرح ما تحتاجه بالضبط ودواعي الاستعجال...' : 'Describe what you need...'}
                  ></textarea>
                </div>

                {/* Confidential Student Credentials */}
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px dashed var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={14} />
                    {isRtl ? 'بيانات التواصل الشخصية (سرية للأدمن فقط ولن تظهر بالواجهة)' : 'Confidential Student Info (Private to Admin)'}
                  </h4>
                  <div className="grid-3" style={{ gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{t('donations.real_name') || 'الاسم الثلاثي (سري)'} *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={requestForm.student_real_name}
                        onChange={(e) => setRequestForm({ ...requestForm, student_real_name: e.target.value })}
                        required
                        placeholder="الاسم الكامل"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{t('donations.student_phone') || 'رقم الهاتف (سري)'} *</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={requestForm.student_phone}
                        onChange={(e) => setRequestForm({ ...requestForm, student_phone: e.target.value })}
                        required
                        placeholder="0912345678"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{t('donations.student_telegram') || 'تليجرام (اختياري)'}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={requestForm.student_telegram}
                        onChange={(e) => setRequestForm({ ...requestForm, student_telegram: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setShowRequestForm(false)} className="btn btn-outline">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={isSubmittingRequest} className="btn btn-secondary">
                    {isSubmittingRequest ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (t('donations.submit_request') || 'إرسال طلب الاحتياج')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Student Requests Cards Grid */}
          {studentRequests.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <HelpCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--text-muted)' }}>{isRtl ? 'لا توجد طلبات احتياج مسجلة حالياً.' : 'No active student needs registered.'}</h3>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: '1.25rem' }}>
              {studentRequests.map(req => (
                <div key={req.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                      {req.item_title}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: req.status === 'fulfilled' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: req.status === 'fulfilled' ? 'var(--success)' : '#F59E0B'
                    }}>
                      {req.status === 'fulfilled' ? (t('donations.status_fulfilled') || 'تم التوفير بنجاح 🎉') : (t('donations.status_searching') || 'جاري البحث عن متبرع 🔍')}
                    </span>
                  </div>

                  {req.description && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                      {req.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600 }}>
                      <Lock size={14} />
                      <span>{isRtl ? 'الهوية سرية ومحمية 🔒' : 'Confidential Student Request 🔒'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} />
                      <span>{new Date(req.created_at).toLocaleDateString(lang)}</span>
                    </div>
                  </div>

                  {req.status !== 'fulfilled' && (
                    <button
                      onClick={() => {
                        setActiveTab('donate');
                        setFormData(prev => ({ ...prev, title: req.item_title }));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="btn btn-secondary"
                      style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <HeartHandshake size={16} />
                      {isRtl ? 'أنا أملك هذه الأداة وأود التبرع بها 🎁' : 'I have this tool & want to donate 🎁'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab Content: Balance Donation */}
      {activeTab === 'balance' && (
        <div className="section animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          <div className="card" style={{ padding: '2.5rem 2rem', marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2rem' }}>
              <div style={{ backgroundColor: 'var(--accent)', padding: '1.2rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1rem', color: 'var(--secondary)' }}>
                <Smartphone size={40} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {t('donations.balance_title') || 'دعم بنك الأدوات عبر رصيد الهاتف 📱'}
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {t('donations.balance_desc') || 'مساهمتك ولو برصيد بسيط تساعد الكلية في شراء وتوفير المستلزمات والملازم للطلاب المحتاجين.'}
              </p>
            </div>

            {/* Numbers Row */}
            <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
              
              {/* Libyana Card */}
              <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '2px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.04)', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>🇱🇾 ليبيانا Libyana</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--text-main)' }}>
                  091-1234567
                </div>
                <button
                  className="btn"
                  onClick={() => {
                    navigator.clipboard.writeText('0911234567');
                    setCopiedNumber('libyana');
                    setTimeout(() => setCopiedNumber(''), 2000);
                  }}
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Copy size={16} />
                  {copiedNumber === 'libyana' ? (isRtl ? 'تم نسخ الرقم! ✓' : 'Copied!') : (isRtl ? 'نسخ رقم تحويل ليبيانا 📋' : 'Copy Libyana Number')}
                </button>
              </div>

              {/* Madar Card */}
              <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '2px solid #0284c7', backgroundColor: 'rgba(2, 132, 199, 0.04)', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>📱 مدار Madar</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--text-main)' }}>
                  092-1234567
                </div>
                <button
                  className="btn"
                  onClick={() => {
                    navigator.clipboard.writeText('0921234567');
                    setCopiedNumber('madar');
                    setTimeout(() => setCopiedNumber(''), 2000);
                  }}
                  style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '0.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Copy size={16} />
                  {copiedNumber === 'madar' ? (isRtl ? 'تم نسخ الرقم! ✓' : 'Copied!') : (isRtl ? 'نسخ رقم تحويل مدار 📋' : 'Copy Madar Number')}
                </button>
              </div>

            </div>

            {/* Scratch Card Code Instant Submission Form */}
            <div style={{ padding: '1.75rem', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Send size={20} />
                {isRtl ? 'إرسال كرت تعبئة مباشر عبر الواتساب' : 'Send Scratch Card Code via WhatsApp'}
              </h3>
              
              <form onSubmit={handleSendScratchCard} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px', margin: '0 auto' }}>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{isRtl ? 'الشبكة' : 'Network'}</label>
                    <select
                      className="form-input"
                      value={scratchCard.network}
                      onChange={(e) => setScratchCard({ ...scratchCard, network: e.target.value })}
                    >
                      <option value="libyana">ليبيانا Libyana</option>
                      <option value="madar">مدار Madar</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{isRtl ? 'قيمة الكرت (د.ل)' : 'Amount (LYD)'}</label>
                    <select
                      className="form-input"
                      value={scratchCard.amount}
                      onChange={(e) => setScratchCard({ ...scratchCard, amount: e.target.value })}
                    >
                      <option value="5">5 د.ل</option>
                      <option value="10">10 د.ل</option>
                      <option value="20">20 د.ل</option>
                      <option value="50">50 د.ل</option>
                      <option value="100">100 د.ل</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{isRtl ? 'كود الكرت (رقم التعبئة)' : 'Scratch Card Code'} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scratchCard.code}
                    onChange={(e) => setScratchCard({ ...scratchCard, code: e.target.value })}
                    required
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    style={{ direction: 'ltr', textAlign: 'center', letterSpacing: '0.1em', fontWeight: 700 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{ backgroundColor: '#25D366', color: 'white', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                >
                  <MessageCircle size={20} />
                  {isRtl ? 'إرسال الكرت عبر الواتساب للمشرف 💬' : 'Send Scratch Card Code on WhatsApp 💬'}
                </button>
              </form>
            </div>

          </div>

        </div>
      )}
      
    </div>
  );
}
