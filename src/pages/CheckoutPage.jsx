import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import InvoiceView from '../components/InvoiceView';
import { CheckCircle2, FileText, MapPin, Truck, HelpCircle, Phone } from 'lucide-react';
import MapPicker from '../components/MapPicker';

const TRIPOLI_STREETS = [
  'حي الأندلس',
  'السياحية',
  'السراج',
  'جنزور',
  'قرجي',
  'غوط الشعال',
  'الرياضية',
  'بن عاشور',
  'جرابة',
  'النوفليين',
  'فشلوم',
  'زاوية الدهماني',
  'الظهرة',
  'سوق الجمعة',
  'تاجوراء',
  'عين زارة',
  'صلاح الدين',
  'طريق المطار',
  'الهضبة الخضراء',
  'الهضبة الشرقية',
  'حي دمشق',
  'باب بن غشير',
  'شارع النصر',
  'شارع عمر المختار',
  'شارع الصريم',
  'شارع الرشيد',
  'شارع ميزران',
  'الدريبي',
  'الشارع الغربي',
  'سيدي المصري',
  'زناتة',
  'السبعة',
  'عرادة',
  'الحشان',
  'الغرارات',
  'الكحيلي',
  'خلة الفرجان',
  'وادي الربيع',
  'قصر بن غشير',
  'طريق الشط',
  'سيدي سليم',
  'أبو سليم',
  'الهضبة البدري',
  'السواني',
  'الكريمية',
  'طريق المشتل'
].sort((a, b) => a.localeCompare(b, 'ar'));

export const CheckoutPage = () => {
  const { t, isRtl, lang } = useLanguage();
  const { cartItems, subtotal, totalDiscount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneSec, setPhoneSec] = useState('');
  const [university, setUniversity] = useState('جامعة طرابلس');
  const [college, setCollege] = useState('كلية طب الأسنان');
  const [notes, setNotes] = useState('');
  const [shippingOption, setShippingOption] = useState('faculty'); // faculty, tripoli_center, tripoli_suburbs
  
  // Searchable street selection & Maps location
  const [selectedStreet, setSelectedStreet] = useState('');
  const [streetSearch, setStreetSearch] = useState('');
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [locationUrl, setLocationUrl] = useState('');

  // Geolocation States
  const [addressText, setAddressText] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [saveLocationDefault, setSaveLocationDefault] = useState(false);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill logged-in profile data (excluding admin profile name)
  useEffect(() => {
    if (profile) {
      if (profile.full_name === 'أدمن سمايلودنت' || profile.role === 'admin') {
        setFullName('');
      } else {
        setFullName(profile.full_name || '');
      }
      setPhone(profile.phone || '');
      setPhoneSec(profile.phone_secondary || '');
      setUniversity(profile.university || 'جامعة طرابلس');
      setCollege(profile.college || 'كلية طب الأسنان');
      setAddressText(profile.address_text || '');
      setLatitude(profile.latitude ? parseFloat(profile.latitude) : null);
      setLongitude(profile.longitude ? parseFloat(profile.longitude) : null);
    }
    if (user) {
      setCustomerEmail(user.email || '');
    }
  }, [profile, user]);

  // Handle street blur with delay to let option click fire
  const handleBlur = () => {
    setTimeout(() => {
      setShowStreetDropdown(false);
    }, 200);
  };

  // Filter streets matching search
  const filteredStreets = TRIPOLI_STREETS.filter(street =>
    street.toLowerCase().includes(streetSearch.toLowerCase())
  );

  // Calculate Shipping fee
  const getShippingFee = () => 0; // سعر التوصيل يتم تأكيده عبر الواتساب

  const finalTotal = subtotal + getShippingFee();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setSubmitting(true);
    setErrorMsg('');

    // Generate Order number (numbers only, e.g. 84930219)
    const orderNum = Math.floor(10000000 + Math.random() * 90000000).toString();

    try {
      // Format final notes with street and location link if available
      let combinedNotes = notes || '';
      if (shippingOption !== 'faculty') {
        const locationLink = (latitude && longitude) ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
        const streetLabel = lang === 'ar' ? 'الشارع/المنطقة' : 'Street/Area';
        const locationLabel = lang === 'ar' ? 'خرائط جوجل' : 'Google Maps';
        const notesLabel = lang === 'ar' ? 'ملاحظات' : 'Notes';
        
        combinedNotes = `[${streetLabel}: ${addressText || 'لم يحدد'}]` + 
          (locationLink ? ` [${locationLabel}: ${locationLink}]` : '') + 
          (notes ? ` \n[${notesLabel}: ${notes}]` : '');
      }

      const orderData = {
        order_number: orderNum,
        user_id: user?.id || null,
        customer_name: fullName,
        customer_email: customerEmail || null,
        customer_phone: phone,
        customer_phone_secondary: phoneSec || null,
        university,
        college,
        notes: combinedNotes || null,
        address_text: shippingOption === 'faculty' ? null : addressText,
        latitude: shippingOption === 'faculty' ? null : latitude,
        longitude: shippingOption === 'faculty' ? null : longitude,
        status: 'new',
        total_price: finalTotal,
        discount_amount: totalDiscount,
        shipping_fee: getShippingFee(),
        created_at: new Date().toISOString()
      };

      // If registered user requested saving this location as default, update their profile
      if (user && saveLocationDefault && shippingOption !== 'faculty') {
        await supabase
          .from('profiles')
          .update({
            address_text: addressText,
            latitude: latitude,
            longitude: longitude
          })
          .eq('id', user.id);
      }

      // 0. Pre-flight: validate stock is sufficient for every item
      for (const item of cartItems) {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name_ar, stock_quantity, shared_inventory_product_id, unit_multiplier')
          .eq('id', item.id)
          .single();

        if (!prodData) continue;

        // Block coming_soon and unavailable products
        if (prodData.availability === 'coming_soon') {
          throw new Error(`❌ "${prodData.name_ar}" غير متاح للشراء حالياً — سيتوفر قريباً.`);
        }
        if (prodData.availability === 'unavailable') {
          throw new Error(`❌ "${prodData.name_ar}" غير متوفر حالياً.`);
        }

        if (prodData.shared_inventory_product_id) {

          // Linked product — check master stock
          const { data: master } = await supabase
            .from('products')
            .select('stock_quantity, name_ar')
            .eq('id', prodData.shared_inventory_product_id)
            .single();

          const mult = prodData.unit_multiplier || 1;
          const needed = item.quantity * mult;
          const available = master ? master.stock_quantity : 0;

          if (available < needed) {
            const availableUnits = Math.floor(available / mult);
            throw new Error(
              `❌ "${prodData.name_ar}": الكمية المطلوبة غير متوفرة.\n` +
              `المتاح: ${availableUnits} وحدة فقط (المخزن: ${available} قطعة، كل وحدة = ${mult} قطع)`
            );
          }
        } else {
          // Regular product
          const available = prodData.stock_quantity || 0;
          if (available < item.quantity) {
            throw new Error(
              `❌ "${prodData.name_ar}": الكمية المطلوبة غير متوفرة.\n` +
              `المتاح: ${available} فقط`
            );
          }
        }
      }

      // 1. Insert order record
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderErr) throw orderErr;


      // 2. Insert items
      const orderItemsData = cartItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsErr) throw itemsErr;

      // 3. Update stock levels — works for both real Supabase and Mock
      for (const item of cartItems) {
        // Fetch latest product data (shared_inventory_product_id + unit_multiplier)
        const { data: prodData } = await supabase
          .from('products')
          .select('id, stock_quantity, shared_inventory_product_id, unit_multiplier')
          .eq('id', item.id)
          .single();

        if (!prodData) continue;

        if (prodData.shared_inventory_product_id) {
          // Linked product: deduct from the MASTER stock
          const { data: master } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .eq('id', prodData.shared_inventory_product_id)
            .single();

          if (master) {
            const mult = prodData.unit_multiplier || 1;
            const deduct = item.quantity * mult;
            const newMasterQty = Math.max(0, master.stock_quantity - deduct);
            const availability = newMasterQty === 0 ? 'unavailable'
              : newMasterQty < 5 * mult ? 'limited_quantity' : 'available';
            await supabase.from('products').update({
              stock_quantity: newMasterQty, availability
            }).eq('id', master.id);
          }
        } else {
          // Regular product: deduct directly
          const newQty = Math.max(0, (prodData.stock_quantity || 0) - item.quantity);
          const availability = newQty === 0 ? 'unavailable'
            : newQty < 5 ? 'limited_quantity' : 'available';
          await supabase.from('products').update({
            stock_quantity: newQty, availability
          }).eq('id', item.id);
        }
      }

      // Add notification for Admin in DB
      await supabase.from('notifications').insert({
        title_ar: `طلب جديد وارد #${orderNum}`,
        title_en: `New Order Received #${orderNum}`,
        message_ar: `طلب جديد من الطالب ${fullName} بقيمة ${finalTotal} د.ل`,
        message_en: `New order from student ${fullName} for ${finalTotal} LYD`,
        type: 'order_status'
      });

      // Clear Shopping Cart & Save placed order reference for rendering
      clearCart();
      setPlacedOrder({ ...newOrder, order_items: cartItems });

    } catch (err) {
      console.error('Checkout failed', err);
      setErrorMsg('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً. / Checkout process failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // SUCCESS VIEW RENDER
  // -------------------------------------------------------------
  if (placedOrder) {
    return (
      <div className="container" style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        
        {/* Success header animation block */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--success)' }} className="animate-pulse-smile" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {t('checkout.success_title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px' }}>
            {t('checkout.success_desc', { order_number: placedOrder.order_number })}
          </p>
        </div>

        {/* Action Button Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <Link to={`/invoice/${placedOrder.id}`} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <FileText size={18} />
            {t('checkout.print_invoice')}
          </Link>
          <Link to={`/track?order=${placedOrder.order_number}&phone=${placedOrder.customer_phone}`} className="btn btn-outline">
            {t('checkout.track_order')}
          </Link>
          <Link to="/" className="btn btn-outline" style={{ border: 'none', color: 'var(--secondary)' }}>
            العودة للرئيسية / Go Home
          </Link>
        </div>

        {/* Inline Printable invoice preview */}
        <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '1rem' }}>
          <InvoiceView order={placedOrder} />
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // FORM ENTRY VIEW RENDER
  // -------------------------------------------------------------
  return (
    <div className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {t('checkout.title')}
        </h1>
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }} className="checkout-grid">
        
        {/* Checkout Form */}
        <form onSubmit={handlePlaceOrder} className="card" style={{ padding: '2rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
            {/* Full Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.full_name')} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Phone Number */}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
            {/* Secondary Phone */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.phone_sec')}</label>
              <input
                type="tel"
                className="form-input"
                value={phoneSec}
                onChange={(e) => setPhoneSec(e.target.value)}
              />
            </div>

            {/* Email Address */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
            {/* University selection dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.university')} *</label>
              <select
                className="form-input"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              >
                <option value="جامعة طرابلس">جامعة طرابلس (Tripoli University)</option>
                <option value="جامعة بنغازي">جامعة بنغازي (Benghazi University)</option>
                <option value="جامعة مصراتة">جامعة مصراتة (Misrata University)</option>
                <option value="جامعة الزاوية">جامعة الزاوية (Zawia University)</option>
                <option value="جامعة أخرى / كليات خاصة">جامعة أخرى / كليات خاصة</option>
              </select>
            </div>

            {/* College */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('checkout.college')} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </div>
          </div>

          {/* Delivery Options Selector */}
          <div>
            <label className="form-label">{t('checkout.delivery_options')} *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              
              {/* Tripoli College Delivery */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '1rem',
                  border: shippingOption === 'faculty' ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: shippingOption === 'faculty' ? 'var(--accent)' : 'transparent',
                  transition: 'var(--transition-fast)'
                }}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingOption === 'faculty'}
                  onChange={() => {
                    setShippingOption('faculty');
                    setErrorMsg('');
                  }}
                  style={{ accentColor: 'var(--secondary)' }}
                />
                <MapPin size={20} style={{ color: 'var(--secondary)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('checkout.delivery_faculty')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مجانيًا - تسليم مباشر بالكلية</p>
                </div>
              </label>

              {/* Home Delivery Tripoli Center */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '1rem',
                  border: shippingOption === 'tripoli_center' ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: shippingOption === 'tripoli_center' ? 'var(--accent)' : 'transparent',
                  transition: 'var(--transition-fast)'
                }}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingOption === 'tripoli_center'}
                  onChange={() => {
                    setShippingOption('tripoli_center');
                    setErrorMsg('');
                  }}
                  style={{ accentColor: 'var(--secondary)' }}
                />
                <Truck size={20} style={{ color: 'var(--secondary)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('checkout.delivery_tripoli_center')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? 'يتم تحديده عبر الواتساب بناءً على عنوانك 📲' : 'Determined via WhatsApp based on your address 📲'}</p>
                </div>
              </label>

              {/* Tripoli Suburbs delivery */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '1rem',
                  border: shippingOption === 'tripoli_suburbs' ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: shippingOption === 'tripoli_suburbs' ? 'var(--accent)' : 'transparent',
                  transition: 'var(--transition-fast)'
                }}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingOption === 'tripoli_suburbs'}
                  onChange={() => {
                    setShippingOption('tripoli_suburbs');
                    setErrorMsg('');
                  }}
                  style={{ accentColor: 'var(--secondary)' }}
                />
                <Truck size={20} style={{ color: 'var(--secondary)' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('checkout.delivery_tripoli_suburbs')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? 'يتم تحديده عبر الواتساب بناءً على عنوانك 📲' : 'Determined via WhatsApp based on your address 📲'}</p>
                </div>
              </label>

            </div>
          </div>

          {/* Tripoli Map Location Picker (Visible only for home deliveries) */}
          {(shippingOption === 'tripoli_center' || shippingOption === 'tripoli_suburbs') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent)', marginTop: '0.5rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  {lang === 'ar' ? 'تحديد موقع التوصيل على الخريطة *' : 'Specify delivery location on map *'}
                </label>
                
                {addressText ? (
                  <div style={{ 
                    fontSize: '0.82rem', 
                    backgroundColor: 'var(--surface-color)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-main)', 
                    fontWeight: 600,
                    lineHeight: 1.4
                  }}>
                    📍 {addressText}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {lang === 'ar' ? 'يرجى النقر على موقعك على الخريطة لتحديد عنوان التوصيل تلقائياً' : 'Please click on your location on the map to pin the delivery address'}
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
                  height="220px"
                />

                {/* Default address save option for registered students */}
                {user && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.8rem', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={saveLocationDefault}
                      onChange={(e) => setSaveLocationDefault(e.target.checked)}
                      style={{ accentColor: 'var(--secondary)' }}
                    />
                    <span>{lang === 'ar' ? 'حفظ هذا الموقع كعنوان افتراضي لحسابي' : 'Save this location as my default account address'}</span>
                  </label>
                )}
              </div>

            </div>
          )}

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('checkout.notes')}</label>
            <textarea
              className="form-input"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: رقم المجموعة الدراسية، أو تفاصيل إضافية لمكان التوصيل..."
              style={{ resize: 'none' }}
            />
          </div>

          {/* Checkout Submit trigger */}
          <button
            type="submit"
            disabled={submitting || cartItems.length === 0}
            className="btn btn-secondary"
            style={{ padding: '0.8rem', fontSize: '1rem', width: '100%', marginTop: '1rem' }}
          >
            {submitting ? 'جاري إرسال الطلب... / Submitting...' : t('checkout.place_order')}
          </button>

        </form>

        {/* Cart items Recap side column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              الأدوات المطلوبة / Ordered Items
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name_en} <strong style={{ color: 'var(--secondary)' }}>x{item.quantity}</strong>
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {(item.price * item.quantity).toFixed(2)} {t('cart.currency')}
                  </span>
                </div>
              ))}
            </div>

            {/* Sum details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('cart.subtotal')}:</span>
                <span style={{ fontWeight: 600 }}>{(subtotal + totalDiscount).toFixed(2)} {t('cart.currency')}</span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>{t('cart.discounts')}:</span>
                  <span style={{ fontWeight: 600 }}>-{totalDiscount.toFixed(2)} {t('cart.currency')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('cart.shipping')}:</span>
                <span style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.8rem' }}>
                  {shippingOption === 'faculty'
                    ? (lang === 'ar' ? 'مجاني بالكلية' : 'Free at Faculty')
                    : (lang === 'ar' ? 'يتم تحديده عبر الواتساب بناءً على عنوانك 📲' : 'Determined via WhatsApp based on your address 📲')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--secondary)', paddingTop: '0.6rem', fontSize: '1.15rem', color: 'var(--primary)', fontWeight: 800 }}>
                <span>{t('cart.total')}:</span>
                <span>{subtotal.toFixed(2)} {t('cart.currency')}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                {lang === 'ar'
                  ? '*(ملاحظة: تكلفة التوصيل تُضاف وتُحدد عبر الواتساب عند تأكيد الطلب).*'
                  : '*(Note: Delivery fee is determined and added via WhatsApp upon order confirmation).*'}
              </p>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        .street-option:hover {
          background-color: var(--accent) !important;
          color: var(--secondary) !important;
        }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .form-row {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
