import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_SECRET_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabaseAnonKey = supabaseKey;

// Use Mock ONLY if credentials are explicitly missing
const useMock = (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'YOUR_SUPABASE_URL' ||
  supabaseUrl.trim() === '' ||
  supabaseAnonKey.trim() === ''
);

if (!useMock) {
  console.log('🟢 Smylodent: Connected to live Supabase →', supabaseUrl);
} else {
  console.warn('🟡 Smylodent: Using MOCK database (no Supabase credentials found in .env)');
}

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

const defaultProducts = [];

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
    subtitle_ar: 'جميع أدوات خلع وجراحة الأسنان وعلاج الجذور لطلبة سنة ثالثة ورابعة',
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
    site_name_ar: 'معدات طب الأسنان',
    site_name_en: 'Absolute Dental Equipment',
    description_ar: 'المنصة المتكاملة لأدوات ومستلزمات طلبة طب الأسنان في ليبيا',
    description_en: 'The premier store and platform for dental students in Libya'
  }
};

const defaultPagesContent = {
  about_us: {
    title_ar: 'من نحن - سمايلودنت',
    title_en: 'About Us - Absolute Dental Equipment',
    content_ar: 'سمايلودنت هي منصة ليبية متكاملة تهدف إلى تسهيل حياة طلاب كليات طب الأسنان في ليبيا، وخصوصاً جامعة طرابلس. نقوم بتوفير جميع الأدوات والمعدات اللازمة لكل سنة دراسية، مقسمة حسب المادة، مع ضمان الجودة وسهولة الشراء والتوصيل المباشر إلى الكلية أو المنزل.',
    content_en: 'Absolute Dental Equipment is a Libyan platform built to support dental students, specifically at the University of Tripoli. We supply all the necessary kits and tools for each academic year, categorized by subject, with guaranteed quality and free delivery directly to the dental college.'
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
      else if (table === 'accessory_categories') {
        this.data = [
          { id: 'cat-1', name_ar: 'بوكسات الأسنان', name_en: 'Dental Boxes', slug: 'dental-boxes', description_ar: 'بوكسات تخزين وتنظيم الأدوات الطبية بأحجام وألوان متنوعة', description_en: 'Professional storage & organizer boxes in various sizes & colors', sort_order: 1 }
        ];
      }
      else if (table === 'accessory_products') {
        this.data = [
          { id: 'p16', category_id: 'cat-1', size: '16 inch', name_ar: '16" Dental Tool Box', name_en: '16" Dental Tool Box', desc_ar: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space.', desc_en: 'Durable plastic toolbox with a colored lid, removable inner tray for organizing tools, and wide storage space.', features_ar: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'], features_en: ['Removable inner tray', 'Two side latches', 'Extra storage below tray', 'Comfortable carry handle'], main_image: '/absolute-dental/accessories/box16-colors.png', inside_image: '/absolute-dental/accessories/box16-inside1.jpg', price: 0, sort_order: 1 },
          { id: 'p16_5', category_id: 'cat-1', size: '16.5 inch', name_ar: '16.5" Organizer Box', name_en: '16.5" Organizer Box', desc_ar: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for small accessories.', desc_en: 'Fully transparent lid box with 3 cascading clear compartment layers — perfect for small accessories.', features_ar: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'], features_en: ['Fully transparent lid', '3 clear organizer layers', 'Single front latch', 'Fine internal dividers'], main_image: '/absolute-dental/accessories/box16_5-colors.png', inside_image: '/absolute-dental/accessories/box16_5-inside.png', price: 0, sort_order: 2 },
          { id: 'p17', category_id: 'cat-1', size: '17 inch', name_ar: '17" Professional Box — GT-MAX', name_en: '17" Professional Box — GT-MAX', desc_ar: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a 4-compartment clear organizer.', desc_en: 'Professional GT-MAX/BADC toolbox with a colored lid featuring a 4-compartment clear organizer.', features_ar: ['4-compartment clear lid organizer', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable plastic'], features_en: ['4-compartment clear lid organizer', 'Wide main storage space', 'Two side + one front latch', 'Strong & Durable plastic'], main_image: '/absolute-dental/accessories/box17-colors.png', inside_image: '/absolute-dental/accessories/box17-inside.png', price: 0, sort_order: 3 }
        ];
      }
      else if (table === 'accessory_product_colors') {
        this.data = [
          { id: 'c1', product_id: 'p16', color_id: 'blue', label_ar: 'Blue', label_en: 'Blue', status: 'in_stock', hex_code: '#1565C0', image_url: '/absolute-dental/accessories/box16-blue.jpg', sort_order: 1 },
          { id: 'c2', product_id: 'p16', color_id: 'red', label_ar: 'Red', label_en: 'Red', status: 'in_stock', hex_code: '#E02020', image_url: '/absolute-dental/accessories/box16-red.jpg', sort_order: 2 },
          { id: 'c3', product_id: 'p16', color_id: 'purple', label_ar: 'Purple', label_en: 'Purple', status: 'in_stock', hex_code: '#7B3FE4', image_url: '/absolute-dental/accessories/box16-purple.jpg', sort_order: 3 },
          { id: 'c4', product_id: 'p16', color_id: 'yellow', label_ar: 'Yellow [out_of_stock]', label_en: 'Yellow [out_of_stock]', status: 'out_of_stock', hex_code: '#F5C518', image_url: '/absolute-dental/accessories/box16-yellow.jpg', sort_order: 4 },
          { id: 'c5', product_id: 'p16', color_id: 'maroon', label_ar: 'Maroon [out_of_stock]', label_en: 'Maroon [out_of_stock]', status: 'out_of_stock', hex_code: '#8B1A1A', image_url: '/absolute-dental/accessories/box16-maroon.jpg', sort_order: 5 },
          
          { id: 'c6', product_id: 'p16_5', color_id: 'red', label_ar: 'Red [out_of_stock]', label_en: 'Red [out_of_stock]', status: 'out_of_stock', hex_code: '#D32F2F', image_url: '/absolute-dental/accessories/box16_5-red.jpg', sort_order: 1 },
          { id: 'c7', product_id: 'p16_5', color_id: 'blue', label_ar: 'Light Blue [out_of_stock]', label_en: 'Light Blue [out_of_stock]', status: 'out_of_stock', hex_code: '#42A5F5', image_url: '/absolute-dental/accessories/box16_5-blue.png', sort_order: 2 },
          { id: 'c8', product_id: 'p16_5', color_id: 'navy', label_ar: 'Navy Blue [out_of_stock]', label_en: 'Navy Blue [out_of_stock]', status: 'out_of_stock', hex_code: '#1565C0', image_url: '/absolute-dental/accessories/box16_5-blue.jpg', sort_order: 3 },
          { id: 'c9', product_id: 'p16_5', color_id: 'teal', label_ar: 'Teal [out_of_stock]', label_en: 'Teal [out_of_stock]', status: 'out_of_stock', hex_code: '#00ACC1', image_url: '/absolute-dental/accessories/box16_5-teal.jpg', sort_order: 4 },
          { id: 'c10', product_id: 'p16_5', color_id: 'green', label_ar: 'Green [out_of_stock]', label_en: 'Green [out_of_stock]', status: 'out_of_stock', hex_code: '#43A047', image_url: '/absolute-dental/accessories/box16_5-green.jpg', sort_order: 5 },
          { id: 'c11', product_id: 'p16_5', color_id: 'orange', label_ar: 'Orange [out_of_stock]', label_en: 'Orange [out_of_stock]', status: 'out_of_stock', hex_code: '#F57C00', image_url: '/absolute-dental/accessories/box16_5-orange.jpg', sort_order: 6 },
          
          { id: 'c12', product_id: 'p17', color_id: 'black', label_ar: 'Black', label_en: 'Black', status: 'in_stock', hex_code: '#111111', image_url: '/absolute-dental/accessories/box17-black.jpg', sort_order: 1 },
          { id: 'c13', product_id: 'p17', color_id: 'purple', label_ar: 'Purple', label_en: 'Purple', status: 'in_stock', hex_code: '#7B3FE4', image_url: '/absolute-dental/accessories/box17-purple.jpg', sort_order: 2 },
          { id: 'c14', product_id: 'p17', color_id: 'beige', label_ar: 'Beige [out_of_stock]', label_en: 'Beige [out_of_stock]', status: 'out_of_stock', hex_code: '#C8A882', image_url: '/absolute-dental/accessories/box17-beige.jpg', sort_order: 3 },
          { id: 'c15', product_id: 'p17', color_id: 'blue', label_ar: 'Blue [out_of_stock]', label_en: 'Blue [out_of_stock]', status: 'out_of_stock', hex_code: '#1565C0', image_url: '/absolute-dental/accessories/box17-blue.jpg', sort_order: 4 },
          { id: 'c16', product_id: 'p17', color_id: 'red', label_ar: 'Red [out_of_stock]', label_en: 'Red [out_of_stock]', status: 'out_of_stock', hex_code: '#E02020', image_url: '/absolute-dental/accessories/box17-red.jpg', sort_order: 5 },
          { id: 'c17', product_id: 'p17', color_id: 'pink', label_ar: 'Pink [out_of_stock]', label_en: 'Pink [out_of_stock]', status: 'out_of_stock', hex_code: '#E91E8C', image_url: '/absolute-dental/accessories/box17-pink.jpg', sort_order: 6 },
          { id: 'c18', product_id: 'p17', color_id: 'teal', label_ar: 'Teal [out_of_stock]', label_en: 'Teal [out_of_stock]', status: 'out_of_stock', hex_code: '#00897B', image_url: '/absolute-dental/accessories/box17-colors.png', sort_order: 7 }
        ];
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

  // EXECUTE READS AND WRITES
  async then(resolve) {
    let result = this.resultData !== undefined ? [...this.resultData] : [...this.data];

    // Filter reads
    if (this.resultData === undefined) {
      for (const filterFn of this.filters) {
        result = result.filter(filterFn);
      }
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
  upsert(records, options = {}) {
    const arr = Array.isArray(records) ? records : [records];
    let affected = [];

    for (const item of arr) {
      const pKey = item.key !== undefined ? 'key' : (item.id !== undefined ? 'id' : null);
      let existingIndex = -1;
      
      if (pKey) {
        existingIndex = this.data.findIndex((row) => String(row[pKey]) === String(item[pKey]));
      }

      if (existingIndex >= 0) {
        this.data[existingIndex] = { ...this.data[existingIndex], ...item };
        affected.push(this.data[existingIndex]);
      } else {
        const newItem = {
          ...(item.key ? {} : { id: item.id || Math.random().toString(36).substring(2, 9) }),
          created_at: new Date().toISOString(),
          ...item
        };
        this.data.push(newItem);
        affected.push(newItem);
      }
    }

    this.save();
    this.resultData = affected;
    return this;
  }

  insert(records) {
    const arr = Array.isArray(records) ? records : [records];
    const newRecords = arr.map((item) => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...item
    }));

    this.data.push(...newRecords);
    this.save();
    this.resultData = newRecords;
    return this;
  }

  update(updates) {
    let affected = [];
    this.data = this.data.map((item) => {
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
    this.resultData = affected;
    return this;
  }

  delete() {
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
    this.resultData = deleted;
    return this;
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

// ✅ إفراغ البيانات التجريبية كلياً من الكود
export let mockDonations = [];
export let mockStudentRequests = [];

export const supabase = useMock
  ? {
      from: (table) => new MockQueryBuilder(table),
      auth: mockAuth,
      storage: mockStorage,
      isMock: true
    }
  : createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

