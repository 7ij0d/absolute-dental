# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-11-07 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Route-Level Code Splitting (`React.lazy` + `Suspense`) + Shared In-Flight Query Deduplication & Idle Prefetch Engine + Sharp Image Optimization Pipeline + Dynamic Navigation Trail & Browse Context Engine + Dental Boxes Unified Inventory Engine.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 إعادة هيكلة وتحسين الأداء الجذري للموقع ولوحة الإدارة (الهاتف والكمبيوتر):

1. **تقسيم الحزم البرمجية (Code Splitting & Lazy Loading):**
   - تحويل جميع صفحات المتجر الفرعية وجميع صفحات لوحة الإدارة (`/admin/*`) إلى التحميل الديناميكي عند الطلب (`React.lazy` + `Suspense`) في `src/App.jsx` مع Skeleton خفيف بدون إزاحة بصرية (`CLS = 0`).
   - فصل مكتبات التصدير الثقيلة (`jspdf` و `html2canvas` بحجم ~600 KB) في `src/components/InvoiceView.jsx` ليتم تحميلها فقط عند النقر على زر «حفظ كـ PDF».
   - إزالة ملفات الخرائط (`Leaflet CSS/JS`) الحاجبة للعرض من `index.html` وتحميلها ديناميكياً عند الحاجة فقط داخل `src/components/MapPicker.jsx`.
   - فصل كتالوج `defaultProducts.json` (98 KB) عن الحزمة الأولية في `src/context/CartContext.jsx`.
   - **النتيجة:** انخفاض حجم حزمة JavaScript الرئيسية من **2,132.84 KB** (544.90 KB مضغوطة) إلى **401.03 KB** (120.76 KB مضغوطة) — **تخفيض بنسبة 81.2% في حجم الكود المحمّل عند فتح الموقع!**

2. **ضغط وتحسين الصور (توفير أكثر من 30.4 MB):**
   - ضغط 118 صورة عالية الحجم في `public/products/` و `public/accessories/` و `public/images/` و `src/assets/images/` باستخدام `sharp` دون أي فقدان ملحوظ في الدقة (توفير **20.42 MB** من أحجام الصور).
   - إزالة مجلد النسخ الاحتياطية المكررة `public/accessories/backup_original/` (توفير **10 MB** إضافية من البناء النهائي).
   - تفعيل `loading="lazy"` و `decoding="async"` للصور خارج الشاشة، وتخصيص `fetchPriority="high"` لصورة الهيرو الأساسية فقط لمنع استهلاك ذاكرة ومعالج الهاتف.

3. **تحسين استعلامات قاعدة البيانات والتخزين المؤقت (Cache & Network Deduplication):**
   - إعادة بناء `src/prefetch.js` لمشاركة الوعود الجارية (`fetchSharedYears`, `fetchSharedSubjects`, `fetchSharedActiveProducts`) ومنع تكرار الطلبات بين `Navbar.jsx` و `StudyToolsPage.jsx` و `YearPage.jsx`، وتأجيل التحميل المسبق للكتالوج عبر `requestIdleCallback` حتى لا ينافس عرض الصفحة الأولى على الهاتف.
   - توحيد ذاكرة إعدادات الأقسام في `src/utils/siteSectionsEngine.js` لمنع تكرار طلبات `settings`.
   - إضافة `{ passive: true }` ومنع إعادة التصيير المتكرر أثناء التمرير (`scroll`) في `src/components/Navbar.jsx`.

4. **تسريع لوحة الإدارة (`/admin/products` و `/admin/banners`):**
   - تحديث حالة المنتج المعدّل أو المضاف أو المؤرشف في `src/pages/admin/Products.jsx` محلياً وبشكل فوري (`Optimistic State & Cache Update`) دون إعادة تحميل جميع منتجات الموقع بعد كل تعديل.
   - تفعيل `loading="lazy" decoding="async"` لصور جدول المنتجات في لوحة الإدارة.

### 📁 الملفات التي تم تعديلها:
- `index.html`
- `src/App.jsx`
- `src/prefetch.js`
- `src/context/CartContext.jsx`
- `src/components/Navbar.jsx`
- `src/components/InvoiceView.jsx`
- `src/components/MapPicker.jsx`
- `src/utils/siteSectionsEngine.js`
- `src/pages/Home.jsx`
- `src/pages/StudyToolsPage.jsx`
- `src/pages/YearPage.jsx`
- `src/pages/admin/Products.jsx`
- `src/pages/admin/Banners.jsx`
- `public/products/*`, `public/accessories/*`, `public/images/*`, `src/assets/images/*`
- `PROJECT_STATE.md`

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي طلبات أو تعديلات إضافية من الإدارة.
