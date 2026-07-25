-- =============================================================================
-- SMYLODENT SEED DATA — Run AFTER 01_schema.sql
-- =============================================================================

-- =============================================================================
-- YEARS
-- =============================================================================
INSERT INTO public.years (name_ar, name_en, slug, sort_order) VALUES
  ('السنة الأولى',  '1st Year', '1st-year', 1),
  ('السنة الثانية', '2nd Year', '2nd-year', 2),
  ('السنة الثالثة', '3rd Year', '3rd-year', 3),
  ('السنة الرابعة', '4th Year', '4th-year', 4)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SUBJECTS
-- =============================================================================
INSERT INTO public.subjects (year_id, name_ar, name_en, slug, description_ar, description_en, sort_order)
VALUES
  -- Year 1
  ((SELECT id FROM public.years WHERE slug='1st-year'),
   'تشريح الأسنان', 'Dental Anatomy', 'dental-anatomy',
   'دراسة تشريح الأسنان الطبيعي وأشكالها ورسمها ونحتها.',
   'Study of tooth morphology, carving, and anatomical features.', 1),
  ((SELECT id FROM public.years WHERE slug='1st-year'),
   'مواد طب الأسنان', 'Dental Materials', 'dental-materials',
   'التعرف على المواد المستخدمة في عيادات ومعامل الأسنان وخصائصها وكيفية خلطها.',
   'Introduction to materials used in clinical and lab setups.', 2),
  -- Year 2
  ((SELECT id FROM public.years WHERE slug='2nd-year'),
   'علاج الأسنان التحفظي', 'Restorative Dentistry', 'restorative-dentistry',
   'العمل العملي في المعمل على الرؤوس الوهمية وتجهيز الحفر السنية وحشوها.',
   'Pre-clinical practice on phantom heads, cavity preparations, and filling.', 1),
  ((SELECT id FROM public.years WHERE slug='2nd-year'),
   'صناعة الأسنان المتحركة', 'Removable Prosthodontics', 'removable-prosthodontics',
   'معمل الأطقم الكاملة والجزئية وكيفية صف الأسنان وتشميعها.',
   'Complete and partial dentures, tooth arrangement, and waxing steps.', 2),
  ((SELECT id FROM public.years WHERE slug='2nd-year'),
   'صناعة الأسنان الثابتة', 'Fixed Prosthodontics', 'fixed-prosthodontics',
   'تجهيز الأسنان للتيجان والجسور السنية وصنع القوالب المؤقتة.',
   'Crown and bridge preparation, temporary restorations, and impressions.', 3),
  -- Year 3
  ((SELECT id FROM public.years WHERE slug='3rd-year'),
   'علاج الجذور', 'Endodontics', 'endodontics',
   'تنظيف وحشو قنوات الجذور لأسنان أحادية ومتعددة الجذور عمليًا.',
   'Root canal treatment, cleaning, shaping, and obturation training.', 1),
  ((SELECT id FROM public.years WHERE slug='3rd-year'),
   'أمراض وجراحة اللثة', 'Periodontics', 'periodontics',
   'أدوات تقليح الجير وتنعيم الجذور والتعامل مع النسج الداعمة.',
   'Scaling and root planing instruments, periodontium health tools.', 2),
  -- Year 4
  ((SELECT id FROM public.years WHERE slug='4th-year'),
   'جراحة الفم والتخدير', 'Oral Surgery & Anesthesia', 'oral-surgery',
   'أدوات خلع الأسنان والمحاقن وحقن التخدير الموضعي.',
   'Exodontia instruments, forceps, elevators, and local anesthesia tools.', 1),
  ((SELECT id FROM public.years WHERE slug='4th-year'),
   'تقويم الأسنان', 'Orthodontics', 'orthodontics',
   'صنع الأجهزة المتحركة للتقويم وثني الأسلاك المعدنية.',
   'Removable orthodontic appliance construction and wire bending.', 2)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PRODUCTS — 1st Year
-- =============================================================================
INSERT INTO public.products
  (subject_id, year_id, name_ar, name_en, description_ar, description_en,
   details_ar, details_en, price, compare_at_price, stock_quantity,
   availability, is_featured, is_active, is_archived, sort_order, image_url)
VALUES
  (
    (SELECT id FROM public.subjects WHERE slug='dental-anatomy'),
    (SELECT id FROM public.years WHERE slug='1st-year'),
    'أداة نحت الشمع PKT 1-5',
    'PKT Waxing Instruments Set (1-5)',
    'مجموعة أدوات نحت الشمع المكونة من 5 قطع برؤوس مختلفة، مثالية لمادة تشريح الأسنان.',
    'Premium 5-piece waxing and carving tool set with dual tips, perfect for Dental Anatomy carving labs.',
    '• مصنوعة من الفولاذ المقاوم للصدأ' || chr(10) || '• مقبض ألومنيوم خفيف ملون' || chr(10) || '• رؤوس عالية الدقة لنحت معالم السن.',
    '• High-grade surgical stainless steel' || chr(10) || '• Lightweight color-coded anodized aluminum handles' || chr(10) || '• Double-ended tips for precise cusps and grooves.',
    45.00, 60.00, 45, 'available', TRUE, TRUE, FALSE, 1,
    'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=60'
  ),
  (
    (SELECT id FROM public.subjects WHERE slug='dental-anatomy'),
    (SELECT id FROM public.years WHERE slug='1st-year'),
    'شمع نحت الأسنان أزرق/أحمر',
    'Dental Carving Wax Blocks (Blue/Red)',
    'مكعبات شمع طبيعي معالج متوسط الصلابة مناسب لنحت تشريح الأسنان.',
    'Natural medium-hard carving wax blocks designed for tooth morphology learning.',
    '• عبوة تحتوي على 20 قطعة' || chr(10) || '• أبعاد مناسبة للتدريب المعملي' || chr(10) || '• يسهل نحته ولا يتفتت.',
    '• Pack of 20 blocks' || chr(10) || '• Optimized dimensions for lab carvings' || chr(10) || '• Clean cuts without chipping or flaking.',
    15.00, NULL, 120, 'available', FALSE, TRUE, FALSE, 2,
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&auto=format&fit=crop&q=60'
  );

-- =============================================================================
-- PRODUCTS — 2nd Year / Restorative Dentistry (Conservative)
-- =============================================================================
INSERT INTO public.products
  (subject_id, year_id, name_ar, name_en, description_ar, description_en,
   details_ar, details_en, price, compare_at_price, stock_quantity,
   availability, is_featured, is_active, is_archived, sort_order, image_url)
VALUES
  (
    (SELECT id FROM public.subjects WHERE slug='restorative-dentistry'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'قبضة توربين عالي السرعة — علاج الأسنان التحفظي',
    'High Speed Dental Handpiece — Restorative Dentistry',
    'قبضة توربينية عالية السرعة لمعمل العلاج التحفظي، تُستخدم لتجهيز التجاويف السنية (Class I-V) على الرأس الوهمي.',
    'Air-turbine high-speed handpiece for restorative dentistry lab — cavity preparations (Class I-V) on phantom heads.',
    '• مناسبة لتجهيز تجاويف صنف أول حتى خامس' || chr(10) || '• دوران سلس بضوضاء منخفضة' || chr(10) || '• نظام push-button لتغيير السنابل',
    '• Suitable for Class I–V cavity preparations' || chr(10) || '• Smooth low-vibration rotation' || chr(10) || '• Quick push-button bur exchange',
    135.00, NULL, 20, 'available', FALSE, TRUE, FALSE, 1,
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=80'
  ),
  (
    (SELECT id FROM public.subjects WHERE slug='restorative-dentistry'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'مسبار طبي (Probe) — علاج الأسنان التحفظي',
    'Dental Probe — Restorative Dentistry',
    'مسبار سني لاستكشاف التجاويف السنية وفحص عمق النخر والتحقق من الحشوات في معمل العلاج التحفظي.',
    'Dental explorer probe for caries detection, cavity depth exploration, and restoration quality checks.',
    '• طرف حاد ومدبب لاستكشاف مناطق النخر' || chr(10) || '• مقبض مريح خماسي الأوجه' || chr(10) || '• فولاذ جراحي معالج حرارياً',
    '• Sharp pointed tip for accurate caries exploration' || chr(10) || '• Ergonomic pentagonal handle' || chr(10) || '• Heat-treated surgical steel',
    16.00, NULL, 80, 'available', FALSE, TRUE, FALSE, 2,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80'
  );

-- =============================================================================
-- PRODUCTS — 2nd Year / Removable Prosthodontics
-- =============================================================================
INSERT INTO public.products
  (subject_id, year_id, name_ar, name_en, description_ar, description_en,
   details_ar, details_en, price, compare_at_price, stock_quantity,
   availability, is_featured, is_active, is_archived, sort_order, image_url)
VALUES
  (
    (SELECT id FROM public.subjects WHERE slug='removable-prosthodontics'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'أسنان اصطناعية Falcons - الضرس الأول السفلي (Lower First Molar)',
    'Falcons Artificial Tooth - Lower First Molar (Denture Tooth)',
    'سن ضرس اصطناعي سفلي أول ماركة Falcons، يُستخدم في صف أسنان الطقم الكامل والجزئي لمادة صناعة الأسنان المتحركة.',
    'Falcons brand lower first molar artificial denture tooth — complete and partial denture tooth arrangement.',
    '• ماركة Falcons عالية الجودة' || chr(10) || '• أكريليك مقوى مقاوم للتآكل واللون' || chr(10) || '• القطعة = سنٌّ واحد',
    '• Falcons brand premium quality' || chr(10) || '• Color-stable wear-resistant acrylic' || chr(10) || '• Sold per tooth',
    2.00, NULL, 200, 'available', TRUE, TRUE, FALSE, 1,
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&auto=format&fit=crop&q=80'
  );

-- =============================================================================
-- PRODUCTS — 2nd Year / Fixed Prosthodontics (Crown)
-- =============================================================================
INSERT INTO public.products
  (subject_id, year_id, name_ar, name_en, description_ar, description_en,
   details_ar, details_en, price, compare_at_price, discount_label_ar,
   discount_label_en, stock_quantity, availability, is_featured,
   is_active, is_archived, sort_order, image_url)
VALUES
  (
    (SELECT id FROM public.subjects WHERE slug='fixed-prosthodontics'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'أسنان اصطناعية — السن الأمامي العلوي (Upper Central Incisor)',
    'Artificial Tooth - Upper Central Incisor (Crown Prep Typodont)',
    'سن أمامي علوي اصطناعي مصنوع من الراتنج عالي الجودة، يُستخدم في التدريب على تجهيز التيجان.',
    'High-quality resin upper central incisor for fixed prosthodontics crown preparation training.',
    '• راتنج ألياف مقوى بمقاومة عالية' || chr(10) || '• أبعاد تشريحية دقيقة موافقة لمعايير FDI' || chr(10) || '• مناسب لتجهيز التاج الكامل',
    '• Durable fiber-reinforced resin' || chr(10) || '• Anatomically accurate FDI standard dimensions' || chr(10) || '• Ideal for full crown preparation training',
    2.00, NULL, NULL, NULL, 200, 'available', TRUE, TRUE, FALSE, 1,
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&auto=format&fit=crop&q=80'
  ),
  (
    (SELECT id FROM public.subjects WHERE slug='fixed-prosthodontics'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'قبضة توربين عالي السرعة — صناعة الأسنان الثابتة',
    'High Speed Dental Handpiece — Fixed Prosthodontics',
    'قبضة توربينية عالية السرعة للاستخدام في معمل صناعة الأسنان الثابتة، مناسبة لتجهيز التيجان والجسور.',
    'Professional air-driven high-speed handpiece for fixed prosthodontics — crown and bridge preparation.',
    '• سرعة تصل إلى 350,000 RPM' || chr(10) || '• نظام push-button لتبديل السنابل' || chr(10) || '• تبريد ثنائي بالماء والهواء',
    '• Up to 350,000 RPM air-turbine speed' || chr(10) || '• Push-button chuck for quick bur changes' || chr(10) || '• Dual air-water spray cooling',
    135.00, NULL, NULL, NULL, 20, 'available', TRUE, TRUE, FALSE, 2,
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=80'
  ),
  (
    (SELECT id FROM public.subjects WHERE slug='fixed-prosthodontics'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'قالب الصهر (Cast / Casting Ring)',
    'Dental Casting Ring & Investment Flask (Cast)',
    'حلقة الصهر المستخدمة في صناعة الأسنان الثابتة لصبّ معدن التيجان والجسور.',
    'Stainless steel casting ring and investment flask — lost-wax technique for metal crown frameworks.',
    '• قالب فولاذي مقاوم للحرارة' || chr(10) || '• مناسب لأفران الصهر والمحاث الكهربائي' || chr(10) || '• سهل التنظيف وإعادة الاستخدام',
    '• Heat-resistant stainless steel flask' || chr(10) || '• Compatible with induction and torch casting' || chr(10) || '• Easy to clean and reuse',
    125.00, NULL, NULL, NULL, 15, 'available', TRUE, TRUE, FALSE, 3,
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=500&auto=format&fit=crop&q=80'
  ),
  (
    (SELECT id FROM public.subjects WHERE slug='fixed-prosthodontics'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'مسبار طبي (Probe) — صناعة الأسنان الثابتة',
    'Dental Probe — Fixed Prosthodontics',
    'مسبار سني دقيق ذو طرفين يستخدم في فحص حافة التاج والتأكد من التوافق ونقاط الاتصال.',
    'Double-ended dental explorer probe for crown margin fit, contact points, and surface quality checks.',
    '• فولاذ جراحي عالي الجودة' || chr(10) || '• طرفان: مستقيم ومنحنٍ' || chr(10) || '• قابل للتعقيم بالأوتوكلاف',
    '• High-grade surgical stainless steel' || chr(10) || '• Double-ended: straight + curved tips' || chr(10) || '• Fully autoclavable',
    16.00, NULL, NULL, NULL, 80, 'available', FALSE, TRUE, FALSE, 4,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80'
  ),
  (
    (SELECT id FROM public.subjects WHERE slug='fixed-prosthodontics'),
    (SELECT id FROM public.years WHERE slug='2nd-year'),
    'سنبلة ماسية لتجهيز التاج (Diamond Bur)',
    'Diamond Bur — Crown Preparation (Flat End Taper)',
    'سنبلة ماسية تيبر أسطوانية ذات نهاية مسطحة، تستخدم في تجهيز التيجان الكاملة والجزئية.',
    'Flat-end tapered diamond bur for crown preparation — axial wall reduction and chamfer finishing.',
    '• حبيبات ماسية صناعية عالية الكثافة' || chr(10) || '• ذراع FG قياسي' || chr(10) || '• حزمة من 5 سنابل',
    '• Dense synthetic diamond grit coating' || chr(10) || '• Standard FG shank' || chr(10) || '• Pack of 5 burs',
    18.00, 25.00, 'عرض الحزمة', 'Bundle Offer', 50, 'available', TRUE, TRUE, FALSE, 5,
    'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=500&auto=format&fit=crop&q=80'
  );

-- =============================================================================
-- PRODUCTS — 3rd Year / Endodontics
-- =============================================================================
INSERT INTO public.products
  (subject_id, year_id, name_ar, name_en, description_ar, description_en,
   details_ar, details_en, price, compare_at_price, discount_label_ar,
   discount_label_en, stock_quantity, availability, is_featured,
   is_active, is_archived, sort_order, image_url)
VALUES
  (
    (SELECT id FROM public.subjects WHERE slug='endodontics'),
    (SELECT id FROM public.years WHERE slug='3rd-year'),
    'علبة سنابل تحضير قنوات الجذور (ماني)',
    'Mani K-Files Hand Instruments (25mm)',
    'علبة إبر يدوية قياس 25 ملم لتنظيف وتوسيع قنوات الجذور السنية.',
    'Authentic Mani stainless steel K-Files (25mm), essential for pre-clinical root canal preparation.',
    '• عبوة 6 إبر مقاسات متنوعة (15-40)' || chr(10) || '• جودة يابانية مع مرونة ممتازة' || chr(10) || '• علامات توقف من السيليكون',
    '• Pack of 6 hand files (Assorted 15-40)' || chr(10) || '• Japanese stainless steel' || chr(10) || '• Silicone stoppers pre-fitted',
    32.00, 38.00, 'خصم معملي', 'Lab promo discount', 60, 'available', TRUE, TRUE, FALSE, 1,
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60'
  );

-- =============================================================================
-- PRODUCTS — 4th Year / Oral Surgery
-- =============================================================================
INSERT INTO public.products
  (subject_id, year_id, name_ar, name_en, description_ar, description_en,
   details_ar, details_en, price, compare_at_price, stock_quantity,
   availability, is_featured, is_active, is_archived, sort_order, image_url)
VALUES
  (
    (SELECT id FROM public.subjects WHERE slug='oral-surgery'),
    (SELECT id FROM public.years WHERE slug='4th-year'),
    'رافع الأسنان المستقيم القوي',
    'Dental Straight Elevator (Apexo / Coupland)',
    'أداة رافعة الأسنان المستقيمة لخلع جذور وأسنان الفك العلوي والسفلي.',
    'Straight luxation dental elevator (Coupland style) for oral surgery clinical extractions.',
    '• مقبض عريض مانع للانزلاق' || chr(10) || '• نهاية حادة مقعرة مقاومة للانثناء' || chr(10) || '• قابل للتعقيم أوتوكلاف 134°C',
    '• Wide ergonomic stainless handle' || chr(10) || '• Beveled sharp concave tip' || chr(10) || '• Autoclavable up to 134°C',
    75.00, NULL, 8, 'limited_quantity', TRUE, TRUE, FALSE, 1,
    'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=60'
  );

-- =============================================================================
-- BANNERS / HERO SLIDES
-- =============================================================================
INSERT INTO public.banners (title_ar, title_en, subtitle_ar, subtitle_en, image_url, link_url, is_active, sort_order)
VALUES
  (
    'أدوات ومستلزمات السنة الأولى والثانية',
    '1st & 2nd Year Dental Kits',
    'وفرنا لك أدوات النحت والتشريح والتعويضات بأقوى العروض وبجودة معتمدة',
    'Complete set of carving, morphology, and lab equipment at student friendly rates.',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&auto=format&fit=crop&q=80',
    '/year/1st-year', TRUE, 1
  ),
  (
    'أدوات ومعدات العيادة السريرية',
    'Pre-clinical & Clinical Gear',
    'جميع أدوات خلع وجراحة الأسنان وعلاج الجذور لطلبة سنة ثالثة ورابعة',
    'Exodontia forceps, root canal files, and turbines for clinical practices.',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop&q=80',
    '/year/3rd-year', TRUE, 2
  ),
  (
    'عروض طلابية حصرية 🔥',
    'Exclusive Student Offers 🔥',
    'خصومات حتى 30% على الأدوات الأكثر طلباً — عرض محدود!',
    'Up to 30% off the most requested dental tools — limited offer!',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    '/year/2nd-year', TRUE, 3
  );

-- =============================================================================
-- ANNOUNCEMENTS
-- =============================================================================
INSERT INTO public.announcements (text_ar, text_en, is_active, sort_order)
VALUES
  ('🚚 توصيل مجاني لكلية طب الأسنان — جامعة طرابلس', 'Free delivery to the Dental College — University of Tripoli', TRUE, 1),
  ('🦷 أسعار طلابية حصرية على جميع أدوات السنة الثانية', 'Exclusive student prices on all 2nd Year tools', TRUE, 2),
  ('⭐ أدوات أصلية مضمونة الجودة — الدفع عند الاستلام', 'Original certified tools — Cash on Delivery', TRUE, 3),
  ('📦 طلبات جديدة كل يوم — تتبع طلبك من الموقع', 'New orders daily — track your order on the site', TRUE, 4);

-- =============================================================================
-- SETTINGS
-- =============================================================================
INSERT INTO public.settings (key, value) VALUES
  ('contact_links', '{
    "whatsapp": "https://wa.me/218911234567",
    "telegram": "https://t.me/smylodent_libya",
    "instagram": "https://instagram.com/smylodent",
    "facebook": "https://facebook.com/smylodent"
  }'),
  ('shipping_rates', '{
    "tripoli_dental_college": 0,
    "tripoli_delivery": 15,
    "suburbs": 20,
    "other_cities": 30
  }'),
  ('site_info', '{
    "site_name_ar": "سمايلودنت",
    "site_name_en": "Smylodent",
    "description_ar": "المنصة المتكاملة لأدوات ومستلزمات طلبة طب الأسنان في ليبيا",
    "description_en": "The premier store for dental students in Libya"
  }')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =============================================================================
-- PAGES CONTENT
-- =============================================================================
INSERT INTO public.pages_content (key, title_ar, title_en, content_ar, content_en)
VALUES
  ('about_us',
   'من نحن - سمايلودنت', 'About Us - Smylodent',
   'سمايلودنت هي منصة ليبية متكاملة تهدف إلى تسهيل حياة طلاب كليات طب الأسنان في ليبيا، وخصوصاً جامعة طرابلس. نقوم بتوفير جميع الأدوات والمعدات اللازمة لكل سنة دراسية، مقسمة حسب المادة، مع ضمان الجودة وسهولة الشراء والتوصيل المباشر إلى الكلية أو المنزل.',
   'Smylodent is a Libyan platform built to support dental students at the University of Tripoli. We supply all necessary tools for each academic year, categorized by subject, with guaranteed quality and free delivery to the dental college.'
  ),
  ('faq',
   'الأسئلة الشائعة', 'Frequently Asked Questions',
   '<h3>هل يمكنني الطلب بدون إنشاء حساب؟</h3><p>نعم، يمكنك تصفح المنتجات والطلب مباشرة بدون تسجيل.</p><h3>كيف يتم التوصيل؟</h3><p>توصيل مجاني لكلية الأسنان بجامعة طرابلس، وتوصيل سريع لباقي المناطق.</p><h3>ما طرق الدفع؟</h3><p>الدفع نقداً عند الاستلام.</p>',
   '<h3>Can I order without an account?</h3><p>Yes, browse and order instantly without signup.</p><h3>How does delivery work?</h3><p>Free delivery to the Dental Faculty. Fast delivery to all other areas.</p><h3>Payment options?</h3><p>Cash on Delivery (COD).</p>'
  ),
  ('shipping_refunds',
   'الشحن والاسترجاع', 'Shipping & Returns',
   'نضمن سلامة جميع الأدوات الطبية. يحق للطالب استبدال أو إرجاع أي منتج فيه عيب مصنعي خلال 3 أيام من الاستلام.',
   'We guarantee the safety of all medical tools. Students may exchange or return any defective product within 3 days of delivery.'
  )
ON CONFLICT (key) DO UPDATE
  SET title_ar = EXCLUDED.title_ar, title_en = EXCLUDED.title_en,
      content_ar = EXCLUDED.content_ar, content_en = EXCLUDED.content_en;

SELECT 'Seed data inserted successfully! ✅' AS status;
