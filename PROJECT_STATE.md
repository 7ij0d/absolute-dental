# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-11-08 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Route-Level Code Splitting (`React.lazy` + `Suspense`) + Independent Course Banners Engine (`courseBannersEngine.js`) + Live Product Status & Visibility Sync Engine (`productInventoryEngine.js`) + Shared In-Flight Query Deduplication & Idle Prefetch Engine + Mobile Performance Optimization Engine.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. استعادة وإظهار أيقونة وشريط السلة أسفل البانر مباشرة في كافة الأقسام والمواد:
1. **شريط وأيقونة السلة المباشرة أسفل البانر (`below-banner-cart-bar`):**
   - تم تثبيت شريط أنيق أسفل البانر التوضيحي مباشرة في صفحات:
     - صفحات المواد الدراسية للمراحل (`src/pages/SubjectPage.jsx`)
     - صفحات البحث والمستلزمات الأخرى والعروض (`src/pages/SearchPage.jsx`)
     - صفحة الإكسسوارات الطبية (`src/pages/AccessoriesPage.jsx`)
     - صفحة بوكسات الأدوات وتنظيم العيادة (`src/pages/BoxesPage.jsx`)
   - يحتوي الشريط على:
     - عداد المنتجات المتوفرة في المادة/القسم.
     - زر سلة المشتريات التفاعلي السريع مع أيقونة السلة وشارة عدد العناصر الحية ولون تفاعلي، وإجمالي السعر (`د.ل`)، وزر التوجيه الفوري للسلة بنقرة واحدة.
     - متوافق ومثبت على الهواتف والأجهزة اللوحية وأجهزة الكمبيوتر دون تغطية البانر أو اسم المادة.
2. **إصلاح ظهور شريط التنقل السفلي والسلة العائمة على الهواتف (`Mobile Bottom Nav & Floating Cart`):**
   - إزالة شرط استثناء صفحات المواد في `src/App.jsx` لضمان ظهور شريط التنقل السفلي (`BottomNav`) دوماً على الهواتف.
   - تعديل التموضع في `src/index.css` لرفع السلة العائمة فوق شريط التنقل السفلي على الهواتف (`calc(env(safe-area-inset-bottom, 10px) + 74px)`) ومنع إخفائها.

---

### 🔹 2. تسريع الطلب والتعامل مع السلة من الهاتف بشكل جذري:
1. **إلغاء التأخير عند الإضافة وتعديل الكميات (`0ms Instant Feedback`):**
   - إلغاء استدعاء الاستعلامات الشبكية المتكررة عند كل إضافة منتج في `src/context/CartContext.jsx`.
   - تأخير مزامنة التخزين المحلي (`localStorage`) بمقدار 16 مللي ثانية (`setTimeout`) لتمكين المتصفح من تحديث واجهة المستخدم وشارات السلة في 0 مللي ثانية دون أي تجميد أو تأخير.
   - إضافة حماية ضد النقر المزدوج المتسارع (`250ms anti-double-tap guard`) لمنع تكرار إضافة المنتج بالخطأ عند الضغط السريع على شاشات اللمس.
2. **دمج وتقليل استعلامات الكتالوج والمواد (`Shared Query Deduplication`):**
   - إضافة `fetchSharedCatalogProducts` و `fetchSharedProductJunctions` في `src/prefetch.js` مع تخزين مؤقت خفيف لمدة 3 دقائق.
   - منع إعادة تحميل كامل بيانات المنتجات والعلاقات من قاعدة البيانات عند الانتقال بين مادة وأخرى.
3. **تسريع تأكيد وإنشاء الطلبات في صفحة الدفع (`src/pages/CheckoutPage.jsx`):**
   - نقل حفظ العلاقات التفصيلية للمنتجات (`order_items`) إلى الخلفية غير الحاجبة (`background task`)، لأن صف الطلب الرئيسي يحتوي مسبقاً على تفاصيل المنتجات المحفوظة، مما يتيح إظهار شاشة نجاح الطلب فوراً دون انتظار.

---

### 🔹 3. تسريع تحميل لوحة الإدارة على الهاتف والكمبيوتر:
1. **لوحة التحكم والإحصائيات (`src/pages/admin/Dashboard.jsx`):**
   - استبدال الاستعلامات التسلسلية الثقيلة باستعلام متزامن خفيف (`Promise.all`) يطلب فقط الحقول اللازمة والعدادات الدقيقة (`{ count: 'exact', head: true }`).
   - اعتماد كاش محلي أولي فوري (`abs_admin_dashboard_stats_v2`) لعرض الإحصائيات مباشرة عند الفتح.
2. **إدارة المنتجات (`src/pages/admin/Products.jsx`):**
   - إزالة التوصيلات غير اللازمة (`years(*)`, `subjects(*)`) من استعلام قائمة المنتجات.
   - تطبيق العرض التدريجي (`Progressive Pagination` — 30 منتجاً في البداية مع أزرار عرض المزيد) لمنع بطء وتحميل عشرات العناصر الثقيلة في DOM على الهواتف.
   - إضافة ميزة التعديل السريع المباشر للسعر والكمية في المخزن (`Inline Quick Edit`) دون الحاجة لفتح النافذة المنبثقة لكل منتج.
3. **إدارة الطلبات (`src/pages/admin/Orders.jsx`):**
   - تحديد سقف الاستعلام بـ 150 طلباً حديثاً (`.limit(150)`) لتجنب تنزيل سجلات قديمة غير ضرورية تسبب بطء الهواتف.
   - تأجيل جلب قائمة المنتجات المتاحة (`fetchAvailableProducts`) بحيث تعمل فقط عند فتح نافذة إنشاء الطلب اليدوي، وليس عند مجرد فتح صفحة الطلبات.
4. **شريط تنقل لوحة الإدارة على الهاتف (`src/pages/admin/AdminLayout.jsx`):**
   - تحويل قائمة أقسام الإدارة على الهواتف إلى شريط أفقي ناعم وسريع التمرير (`horizontal scrollable pill navigation`) بدلاً من تراكم 15 قسماً عمودياً يشغل مساحة الشاشة بالكامل.

---

### 📁 الملفات التي تم تعديلها:
- `src/App.jsx`
- `src/index.css`
- `src/prefetch.js`
- `src/context/CartContext.jsx`
- `src/pages/SubjectPage.jsx`
- `src/pages/SearchPage.jsx`
- `src/pages/AccessoriesPage.jsx`
- `src/pages/BoxesPage.jsx`
- `src/pages/CheckoutPage.jsx`
- `src/pages/admin/Dashboard.jsx`
- `src/pages/admin/Products.jsx`
- `src/pages/admin/Orders.jsx`
- `src/pages/admin/AdminLayout.jsx`
- `PROJECT_STATE.md`

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي ملاحظات أو طلبات تخص تجربة المستخدم والتنقل.
