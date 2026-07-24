import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we should use Mock Fallback (when env credentials are not set or unresolvable)
const useMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseUrl.includes('vqrpodmnzubpcsvqohwj');

// -------------------------------------------------------------
// 1. MOCK SEED DATA DEFINITIONS
// -------------------------------------------------------------
const defaultYears = [
  { id: '1', name_ar: 'السنة الأولى', name_en: '1st Year', slug: '1st-year' },
  { id: '2', name_ar: 'السنة الثانية', name_en: '2nd Year', slug: '2nd-year' },
  { id: '3', name_ar: 'السنة الثالثة', name_en: '3rd Year', slug: '3rd-year' },
  { id: '4', name_ar: 'السنة الرابعة', name_en: '4th Year', slug: '4th-year' }
];

const defaultSubjects = [
  { id: '11', year_id: '1', name_ar: 'تشريح الأسنان', name_en: 'Dental Anatomy', description_ar: 'دراسة تشريح الأسنان الطبيعي وأشكالها ورسمها ونحتها.', description_en: 'Study of tooth morphology, carving, and anatomical features.', slug: 'dental-anatomy' },
  { id: '12', year_id: '1', name_ar: 'مواد طب الأسنان', name_en: 'Dental Materials', description_ar: 'التعرف على المواد المستخدمة في عيادات ومعامل الأسنان وخصائصها وكيفية خلطها.', description_en: 'Introduction to materials used in clinical and lab setups.', slug: 'dental-materials' },
  { id: '21', year_id: '2', name_ar: 'علاج الأسنان التحفظي', name_en: 'Restorative Dentistry', description_ar: 'العمل العملي في المعمل على الرؤوس الوهمية وتجهيز الحفر السنية وحشوها.', description_en: 'Pre-clinical practice on phantom heads, cavity preparations, and filling.', slug: 'restorative-dentistry' },
  { id: '22', year_id: '2', name_ar: 'صناعة الأسنان المتحركة', name_en: 'Removable Prosthodontics', description_ar: 'معمل الأطقم الكاملة والجزئية وكيفية صف الأسنان وتشميعها.', description_en: 'Complete and partial dentures, tooth arrangement, and waxing steps.', slug: 'removable-prosthodontics' },
  { id: '23', year_id: '2', name_ar: 'صناعة الأسنان الثابتة', name_en: 'Fixed Prosthodontics', description_ar: 'تجهيز الأسنان للتيجان والجسور السنية وصنع القوالب المؤقتة.', description_en: 'Crown and bridge preparation, temporary restorations, and impressions.', slug: 'fixed-prosthodontics' },
  { id: '31', year_id: '3', name_ar: 'علاج الجذور', name_en: 'Endodontics', description_ar: 'تنظيف وحشو قنوات الجذور لأسنان أحادية ومتعددة الجذور عمليًا.', description_en: 'Root canal treatment, cleaning, shaping, and obturation training.', slug: 'endodontics' },
  { id: '32', year_id: '3', name_ar: 'أمراض وجراحة اللثة', name_en: 'Periodontics', description_ar: 'أدوات تقليح الجير وتنعيم الجذور والتعامل مع النسج الداعمة.', description_en: 'Scaling and root planing instruments, periodontium health tools.', slug: 'periodontics' },
  { id: '41', year_id: '4', name_ar: 'جراحة الفم والتخدير', name_en: 'Oral Surgery & Anesthesia', description_ar: 'أدوات خلع الأسنان والمحاقن وحقن التخدير الموضعي.', description_en: 'Exodontia instruments, forceps, elevators, and local anesthesia tools.', slug: 'oral-surgery' },
  { id: '42', year_id: '4', name_ar: 'تقويم الأسنان', name_en: 'Orthodontics', description_ar: 'صنع الأجهزة المتحركة للتقويم وثني الأسلاك المعدنية.', description_en: 'Removable orthodontic appliance construction and wire bending.', slug: 'orthodontics' }
];

const defaultProducts = [
  {
    id: 'p1',
    subject_id: '11',
    year_id: '1',
    name_ar: 'أداة نحت الشمع PKT 1-5',
    name_en: 'PKT Waxing Instruments Set (1-5)',
    description_ar: 'مجموعة أدوات نحت الشمع المكونة من 5 قطع برؤوس مختلفة، مثالية لمادة تشريح الأسنان.',
    description_en: 'Premium 5-piece waxing and carving tool set with dual tips, perfect for Dental Anatomy carving labs.',
    details_ar: '• مصنوعة من الفولاذ المقاوم للصدأ\n• مقبض ألومنيوم خفيف ملون\n• رؤوس عالية الدقة لنحت معالم السن ومجاري الإطباق بدقة متناهية.',
    details_en: '• Made of high-grade surgical stainless steel\n• Lightweight color-coded anodized aluminum handles\n• Double-ended tips designed for precise cusps and grooves detailing.',
    price: 45.00,
    compare_at_price: 60.00,
    discount_label_ar: 'خصم الطلاب 25%',
    discount_label_en: 'Student Discount 25%',
    discount_ends_at: null,
    stock_quantity: 45,
    availability: 'available',
    usage_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo video link placeholder
    usage_instruction_image_url: '',
    is_featured: true,
    is_archived: false,
    is_active: true,
    sort_order: 1,
    image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // dental tools
    images: [
      'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ]
  },
  {
    id: 'p2',
    subject_id: '11',
    year_id: '1',
    name_ar: 'شمع نحت الأسنان أزرق/أحمر',
    name_en: 'Dental Carving Wax Blocks (Blue/Red)',
    description_ar: 'مكعبات شمع طبيعي معالج متوسط الصلابة مناسب لنحت تشريح الأسنان.',
    description_en: 'Natural medium-hard carving wax blocks designed for tooth morphology learning.',
    details_ar: '• عبوة تحتوي على 20 قطعة\n• أبعاد مناسبة للتدريب المعملي\n• يسهل نحته ولا يتفتت عند استخدام أدوات الـ PKT.',
    details_en: '• Pack of 20 blocks\n• Optimized dimensions for lab carvings\n• Clean cuts without chipping or flaking under carving pressure.',
    price: 15.00,
    compare_at_price: null,
    discount_label_ar: null,
    discount_label_en: null,
    discount_ends_at: null,
    stock_quantity: 120,
    availability: 'available',
    usage_video_url: '',
    usage_instruction_image_url: '',
    is_featured: false,
    is_archived: false,
    is_active: true,
    sort_order: 2,
    image_url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    images: ['https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    id: 'p3',
    subject_id: '21',
    year_id: '2',
    name_ar: 'طقم قبضة التوربين للأسنان (شحن توربيني)',
    name_en: 'Dental High Speed Turbine Handpiece',
    description_ar: 'قبضة سرعة عالية توربينية بنظام دفع هوائي، متوافقة مع جميع أنواع الرؤوس الوهمية بالجامعة.',
    description_en: 'Standard high-speed air turbine dental handpiece, fully compatible with university phantom heads.',
    details_ar: '• دفع هوائي برأس توربيني قياسي\n• أزرار ضغط سهلة لتغيير سنابل الحفر (Bur Push-Button)\n• رذاذ مياه أحادي لتبريدBur والتجويف.',
    details_en: '• Air driven standard turbine head\n• Push-button bur exchange mechanism\n• Single water spray coolant for effective bur and cavity temperature regulation.',
    price: 280.00,
    compare_at_price: 320.00,
    discount_label_ar: 'عرض محدود بقيمة 40 د.ل',
    discount_label_en: 'Limited 40 LYD discount',
    discount_ends_at: null,
    stock_quantity: 12,
    availability: 'limited_quantity',
    usage_video_url: '',
    usage_instruction_image_url: '',
    is_featured: true,
    is_archived: false,
    is_active: true,
    sort_order: 1,
    image_url: 'https://images.unsplash.com/photo-1512223792601-592a9809eed4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    images: [
      'https://images.unsplash.com/photo-1512223792601-592a9809eed4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ]
  },
  {
    id: 'p4',
    subject_id: '22',
    year_id: '2',
    name_ar: 'منظم إطباق الأسنان البسيط (ارتيكوليتر)',
    name_en: 'Mean Value Articulator for Denture Setups',
    description_ar: 'جهاز ارتيكوليتر متوسط القيمة لصف الأسنان المتحركة في معمل التعويضات الصناعية.',
    description_en: 'Sturdy brass/aluminum mean value dental articulator for mounting models and arranging teeth.',
    details_ar: '• هيكل متين من النحاس المطلي المقاوم للتآكل\n• نوابض تثبيت سريعة لتسجيل حركة الفك\n• قواعد مغناطيسية لتسهيل فك وتركيب قوالب الجبس.',
    details_en: '• Rigid brass/aluminum alloy construction\n• Heavy-duty tension springs to simulate jaw hinge movements\n• Easy mounting plate lock mechanism for convenient stone model swaps.',
    price: 135.00,
    compare_at_price: null,
    discount_label_ar: null,
    discount_label_en: null,
    discount_ends_at: null,
    stock_quantity: 0,
    availability: 'unavailable',
    usage_video_url: '',
    usage_instruction_image_url: '',
    is_featured: false,
    is_archived: false,
    is_active: true,
    sort_order: 3,
    image_url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    images: ['https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    id: 'p5',
    subject_id: '31',
    year_id: '3',
    name_ar: 'علبة سنابل تحضير قنوات الجذور (ماني)',
    name_en: 'Mani K-Files Hand Instruments (25mm)',
    description_ar: 'علبة إبر يدوية قياس 25 ملم لتنظيف وتوسيع قنوات الجذور السنية، ممتازة لمادة العلاج التحفظي اللبي.',
    description_en: 'Authentic Mani stainless steel K-Files (25mm length), essential for pre-clinical and clinical root canal preparation.',
    details_ar: '• عبوة تحتوي على 6 إبر يدوية مقاسات متنوعة (15-40)\n• جودة يابانية مع مرونة ممتازة ومقاومة للكسر\n• علامات توقف من السيليكون لضبط عمق العمل.',
    details_en: '• Pack of 6 hand files (Assorted Sizes 15-40)\n• Medical grade Japanese stainless steel with cross-sectional strength\n• Silicone stoppers pre-fitted to adjust root depth working length.',
    price: 32.00,
    compare_at_price: 38.00,
    discount_label_ar: 'خصم معملي',
    discount_label_en: 'Lab promo discount',
    discount_ends_at: null,
    stock_quantity: 60,
    availability: 'available',
    usage_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    usage_instruction_image_url: '',
    is_featured: true,
    is_archived: false,
    is_active: true,
    sort_order: 2,
    image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    images: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    id: 'p6',
    subject_id: '41',
    year_id: '4',
    name_ar: 'رافع الأسنان المستقيم القوي',
    name_en: 'Dental Straight Elevator (Apexo / Coupland)',
    description_ar: 'أداة رافعة الأسنان المستقيمة لخلع جذور وأسنان الفك العلوي والسفلي، مخصصة للعمل السريري لطلبة السنة الرابعة.',
    description_en: 'Straight luxation dental elevator (Coupland style) for oral surgery clinical extractions.',
    details_ar: '• مقبض عريض ومريح مانع للانزلاق لقوة مسك وتحكم فائقة\n• نهاية حادة ومقعرة ومقاومة للانثناء لتسهيل تفتيت الرباط السني\n• قابل للتعقيم بالحرارة الرطبة أوتوكلاف بالكامل.',
    details_en: '• Wide ergonomic stainless handle for maximum mechanical leverage\n• Beveled sharp concave tip to easily engage periodontal ligament spaces\n• Autoclavable up to 134°C.',
    price: 75.00,
    compare_at_price: null,
    discount_label_ar: null,
    discount_label_en: null,
    discount_ends_at: null,
    stock_quantity: 8,
    availability: 'limited_quantity',
    usage_video_url: '',
    usage_instruction_image_url: '',
    is_featured: true,
    is_archived: false,
    is_active: true,
    sort_order: 1,
    image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    images: ['https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  }
];

const defaultBanners = [
  {
    id: 'b1',
    title_ar: 'أدوات ومستلزمات السنوات الأولى والثانية',
    title_en: '1st & 2nd Year Dental Kits',
    subtitle_ar: 'وفرنا لك أدوات النحت والتشريح والتعويضات بأقوى العروض وبجودة معتمدة',
    subtitle_en: 'Complete set of carving, morphology, and lab equipment at student friendly rates.',
    image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&auto=format&fit=crop&q=80',
    link_url: '/year/1st-year',
    is_active: true
  },
  {
    id: 'b2',
    title_ar: 'أدوات ومعدات العيادة السريرية',
    title_en: 'Pre-clinical & Clinical Gear',
    subtitle_ar: 'جميع حقائب وأدوات خلع وجراحة الأسنان وعلاج الجذور لطلبة سنة ثالثة ورابعة',
    subtitle_en: 'Exodontia forceps, root canal files, and turbines for clinical practices.',
    image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop&q=80',
    link_url: '/year/3rd-year',
    is_active: true
  }
];

const defaultSettings = {
  contact_links: {
    whatsapp: 'https://wa.me/218911234567',
    telegram: 'https://t.me/smylodent_libya',
    instagram: 'https://instagram.com/smylodent',
    facebook: 'https://facebook.com/smylodent'
  },
  shipping_rates: {
    tripoli_dental_college: 0,
    tripoli_delivery: 10,
    other_cities: 25
  },
  site_info: {
    site_name_ar: 'سمايلودنت',
    site_name_en: 'Smylodent',
    description_ar: 'المنصة المتكاملة لأدوات ومستلزمات طلبة طب الأسنان في ليبيا',
    description_en: 'The premier store and platform for dental students in Libya'
  }
};

const defaultPagesContent = {
  about_us: {
    title_ar: 'من نحن - سمايلودنت',
    title_en: 'About Us - Smylodent',
    content_ar: 'سمايلودنت هي منصة ليبية متكاملة تهدف إلى تسهيل حياة طلاب كليات طب الأسنان في ليبيا، وخصوصاً جامعة طرابلس. نقوم بتوفير جميع الأدوات والمعدات اللازمة لكل سنة دراسية، مقسمة حسب المادة، مع ضمان الجودة وسهولة الشراء والتوصيل المباشر إلى الكلية أو المنزل.',
    content_en: 'Smylodent is a Libyan platform built to support dental students, specifically at the University of Tripoli. We supply all the necessary kits and tools for each academic year, categorized by subject, with guaranteed quality and free delivery directly to the dental college.'
  },
  faq: {
    title_ar: 'الأسئلة الشائعة',
    title_en: 'Frequently Asked Questions',
    content_ar: '<h3>هل يمكنني الطلب بدون إنشاء حساب؟</h3><p>نعم، يمكنك تصفح المنتجات وإضافتها إلى السلة والطلب مباشرة بدون تسجيل مسبق.</p><h3>أين يقع مقركم وكيف يتم التوصيل؟</h3><p>نحن نوفر توصيلاً مجانياً بالكامل إلى كلية طب الأسنان بجامعة طرابلس، وتوصيلاً سريعاً لجميع المدن الليبية الأخرى بسعر رمزي.</p><h3>ما هي طرق الدفع المتوفرة؟</h3><p>حالياً نقوم بالدفع نقداً عند الاستلام (كاش) لضمان تجربة فحص ومعاينة المنتج قبل الدفع.</p>',
    content_en: '<h3>Can I order without creating an account?</h3><p>Yes, you can browse, add to cart, and checkout instantly without any signup.</p><h3>Where are you based and how does delivery work?</h3><p>We provide completely free delivery directly to the Faculty of Dentistry, University of Tripoli. We also ship to all other cities in Libya.</p><h3>What payment options are available?</h3><p>Currently, we support Cash on Delivery (COD) to ensure you check your tools before paying.</p>'
  },
  shipping_refunds: {
    title_ar: 'الشحن والاسترجاع',
    title_en: 'Shipping & Returns',
    content_ar: 'نضمن سلامة جميع الأدوات الطبية التي تستلمها. يحق للطالب استبدال أو إرجاع أي منتج فيه عيب مصنعي خلال 3 أيام من الاستلام، شريطة ألا يتم استخدام الأداة في العمل العيادي أو المعملي.',
    content_en: 'We guarantee the safety of all medical tools delivered. Students have the right to exchange or return any product with manufacturing defects within 3 days of delivery, provided it has not been used in clinical or lab practice.'
  }
};

// -------------------------------------------------------------
// 2. MOCK QUERY BUILDER CLASS (Supabase Emulator)
// -------------------------------------------------------------
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderByField = null;
    this.orderAscending = true;
    this.limitCount = null;
    this.isSingle = false;

    // Load data from localStorage or seed
    const stored = localStorage.getItem(`mock_${table}`);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      // Seed default values
      if (table === 'years') this.data = defaultYears;
      else if (table === 'subjects') this.data = defaultSubjects;
      else if (table === 'products') this.data = defaultProducts;
      else if (table === 'banners') this.data = defaultBanners;
      else if (table === 'settings') {
        this.data = Object.entries(defaultSettings).map(([key, val]) => ({ key, value: val }));
      }
      else if (table === 'pages_content') {
        this.data = Object.entries(defaultPagesContent).map(([key, val]) => ({ key, ...val }));
      }
      else {
        this.data = [];
      }
      localStorage.setItem(`mock_${table}`, JSON.stringify(this.data));
    }
  }

  // Save changes back to LocalStorage
  save() {
    localStorage.setItem(`mock_${this.table}`, JSON.stringify(this.data));
  }

  select(columns = '*') {
    // Return this query builder to allow chaining
    return this;
  }

  eq(field, value) {
    this.filters.push((item) => {
      if (item[field] === undefined) return false;
      return String(item[field]) === String(value);
    });
    return this;
  }

  match(obj) {
    this.filters.push((item) => {
      for (const [key, value] of Object.entries(obj)) {
        if (String(item[key]) !== String(value)) return false;
      }
      return true;
    });
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orderByField = field;
    this.orderAscending = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // EXECUTE READS
  async then(resolve) {
    let result = [...this.data];

    // Filter
    for (const filterFn of this.filters) {
      result = result.filter(filterFn);
    }

    // Sort
    if (this.orderByField) {
      result.sort((a, b) => {
        let valA = a[this.orderByField];
        let valB = b[this.orderByField];
        if (typeof valA === 'string') {
          return this.orderAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.orderAscending ? valA - valB : valB - valA;
      });
    }

    // Limit
    if (this.limitCount) {
      result = result.slice(0, this.limitCount);
    }

    // Single result check
    if (this.isSingle) {
      resolve({ data: result.length ? result[0] : null, error: null });
    } else {
      resolve({ data: result, error: null });
    }
  }

  // WRITE OPERATIONS
  async insert(records) {
    const arr = Array.isArray(records) ? records : [records];
    const newRecords = arr.map((item) => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...item
    }));

    this.data.push(...newRecords);
    this.save();
    return { data: newRecords, error: null };
  }

  async update(updates) {
    let affected = [];
    this.data = this.data.map((item) => {
      // Check if item matches filters
      let match = true;
      for (const filterFn of this.filters) {
        if (!filterFn(item)) {
          match = false;
          break;
        }
      }
      if (match) {
        const updated = { ...item, ...updates };
        affected.push(updated);
        return updated;
      }
      return item;
    });
    this.save();
    return { data: affected, error: null };
  }

  async delete() {
    let deleted = [];
    this.data = this.data.filter((item) => {
      let match = true;
      for (const filterFn of this.filters) {
        if (!filterFn(item)) {
          match = false;
          break;
        }
      }
      if (match) {
        deleted.push(item);
        return false;
      }
      return true;
    });
    this.save();
    return { data: deleted, error: null };
  }
}

// -------------------------------------------------------------
// 3. MOCK AUTH / LOGS / STORAGE EMULATOR
// -------------------------------------------------------------
const mockAuth = {
  getUser: async () => {
    const stored = localStorage.getItem('mock_user_session');
    if (stored) {
      return { data: { user: JSON.parse(stored) }, error: null };
    }
    return { data: { user: null }, error: null };
  },
  getSession: async () => {
    const stored = localStorage.getItem('mock_user_session');
    if (stored) {
      return { data: { session: { user: JSON.parse(stored) } }, error: null };
    }
    return { data: { session: null }, error: null };
  },
  signUp: async ({ email, password, options }) => {
    const mockUser = {
      id: Math.random().toString(36).substring(2, 11) + '-uid',
      email,
      role: 'student',
      user_metadata: options?.data || {}
    };

    // Insert user profile
    const profiles = new MockQueryBuilder('profiles');
    await profiles.insert({
      id: mockUser.id,
      full_name: options?.data?.full_name || 'طالب جديد',
      email: email,
      phone: options?.data?.phone || '',
      phone_secondary: options?.data?.phone_secondary || '',
      university: options?.data?.university || 'جامعة طرابلس',
      college: options?.data?.college || 'كلية طب الأسنان',
      address_text: options?.data?.address_text || null,
      latitude: options?.data?.latitude || null,
      longitude: options?.data?.longitude || null,
      status: 'active',
      role: options?.data?.role || 'student'
    });

    localStorage.setItem('mock_user_session', JSON.stringify(mockUser));
    return { data: { user: mockUser, session: { user: mockUser } }, error: null };
  },
  signInWithPassword: async ({ email, password }) => {
    // If it is admin credentials (admin@smylodent.com / admin123) we automatically log in as admin
    let role = 'student';
    let fullName = 'طالب مسجل';
    if (email === 'admin@smylodent.com' || email === 'admin') {
      role = 'admin';
      fullName = 'أدمن سمايلودنت';
    }

    const mockUser = {
      id: role === 'admin' ? 'admin-uid-12345' : 'student-uid-67890',
      email,
      role
    };

    // Upsert profile for local tests
    const profiles = new MockQueryBuilder('profiles');
    const { data: existing } = await profiles.eq('id', mockUser.id).single();
    if (!existing) {
      await profiles.insert({
        id: mockUser.id,
        full_name: fullName,
        email: email,
        phone: '0912345678',
        phone_secondary: '',
        university: 'جامعة طرابلس',
        college: 'كلية طب الأسنان',
        address_text: '',
        latitude: null,
        longitude: null,
        status: 'active',
        role: role
      });
    }

    localStorage.setItem('mock_user_session', JSON.stringify(mockUser));
    return { data: { user: mockUser, session: { user: mockUser } }, error: null };
  },
  signOut: async () => {
    localStorage.removeItem('mock_user_session');
    return { error: null };
  },
  onAuthStateChange: (callback) => {
    // Trigger callback immediately with local session state
    const stored = localStorage.getItem('mock_user_session');
    const user = stored ? JSON.parse(stored) : null;
    callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
    
    // Return unsubscriber
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
};

const mockObjectUrls = {};
const mockStorage = {
  from: (bucket) => ({
    upload: async (path, file) => {
      // Mock upload returns a local ObjectURL and stores it in memory
      const url = URL.createObjectURL(file);
      mockObjectUrls[path] = url;
      return { data: { path, publicUrl: url }, error: null };
    },
    getPublicUrl: (path) => {
      if (mockObjectUrls[path]) {
        return { data: { publicUrl: mockObjectUrls[path] } };
      }
      // Mock file url fallback
      return { data: { publicUrl: path.startsWith('audios/') ? '' : `https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format` } };
    }
  })
};

// -------------------------------------------------------------
// 4. CLIENT EXPORT (SUPABASE / MOCK DETECTOR)
// -------------------------------------------------------------
export const supabase = useMock
  ? {
      from: (table) => new MockQueryBuilder(table),
      auth: mockAuth,
      storage: mockStorage,
      isMock: true
    }
  : createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
