# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-11-07 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Dental Boxes Unified Inventory Engine + Quick Box & Color Studio + Standalone Box Portal + Static SPA Route Pre-generation Engine + Relative Asset Resolution Engine (`base: './'`).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 إضافة وتوزيع مواد ومنتجات السنة الثالثة (`Absolute_Dental_Third_Year_Materials`):

1. **إضافة 3 مواد دراسية جديدة للسنة الثالثة (`3rd Year`):**
   - **Oral Surgery (جراحة الفم والأسنان):** `33000000-0000-0000-0000-000000000035` (`slug: oral-surgery`).
   - **Periodontology (طب وجراحة اللثة):** `33000000-0000-0000-0000-000000000036` (`slug: periodontology`).
   - **Pediatric Dentistry (طب أسنان الأطفال):** `33000000-0000-0000-0000-000000000037` (`slug: pediatric-dentistry`).

2. **تحديث وتوزيع المنتجات الثمانية والصور المعتمدة:**
   - **Cotton Rolls (`2.00 LYD`):** مرتبط بمواد `Oral Surgery` و `Periodontology` و `Pediatric Dentistry` مع إزالته من `Preventive Dentistry`.
   - **Dental Syringe (`50.00 LYD`):** مرتبط بمواد `Oral Surgery` و `Periodontology` و `Pediatric Dentistry` مع إزالته من `Preventive Dentistry`.
   - **Periodontal Probe (`15.00 LYD`):** مضاف إلى `Periodontology` مع بقائه في مواد السنة الثانية (`Conservative` و `Fixed`) وتحديث صورته عالية الدقة (`periodontal-probe.png`).
   - **Mouth Mirror (`15.00 LYD`):** مضاف إلى `Oral Surgery` و `Periodontology` و `Pediatric Dentistry` مع بقائه في مواد السنة الثانية.
   - **Self-Sealing Sterilization Pouch (`0.50 LYD`):** منتج موحد بمخزون مشترك مضاف إلى `Oral Surgery` و `Periodontology` و `Pediatric Dentistry` مع صورته الاستوديو (`self-sealing-sterilization-pouch.jpg`).
   - **Disposable Diagnostic Kit (`2.50 LYD`):** مضاف إلى `Pediatric Dentistry` وكافة المواد الجديدة مع الاحتفاظ بجميع ارتباطاته السابقة.
   - **Fluoride Varnish (`15.00 LYD`):** مضاف حصرياً إلى `Pediatric Dentistry` مع صورة `V-Varnish Premium` (`fluoride-varnish.jpg`).
   - **Dental Needle (`0.50 LYD`):** منقول حصرياً إلى `Oral Surgery` وإزالته من `Preventive Dentistry`.

3. **المزامنة والتنظيم وتفعيل التعديل الكامل من لوحة التحكم:**
   - تحديث `YearPage.jsx` و `SubjectPage.jsx` (`subject_v46`) و `supabaseClient.js` و `subjectGroupEngine.js` و `defaultProducts.json`.
   - ترقية `src/pages/admin/Subjects.jsx` لدعم رفع أو تعديل صورة الهيرو (`image_url`) وترتيب الظهور (`sort_order`) لكل مادة دراسية ولكل سنة دراسية مباشرة من لوحة الإدارة، مع انعكاس فوري في صفحات السنوات والمواد (`StudyToolsPage.jsx`, `YearPage.jsx`, `SubjectPage.jsx`).
   - ترقية `src/pages/admin/Banners.jsx` وإنشاء `src/utils/siteSectionsEngine.js` للتحكم الكامل في هيرو الصفحة الرئيسية والبطاقات الثلاث الرئيسية (`أدوات الدراسة`، `الإكسسوارات`، `البوكسات`) وهيرو صفحات الأقسام (`مستلزمات أخرى`، `الإكسسوارات`، `البوكسات`) من لوحة الإدارة.
   - ترقية `src/pages/admin/Products.jsx` لإضافة حقول الاسم الإنجليزي، كود `SKU`، وترتيب الظهور (`sort_order`) بجانب التحكم الكامل في أماكن ظهور كل منتج عبر المواد والسنوات.

### 📁 الملفات التي تم تعديلها:
- `src/pages/admin/Products.jsx`
- `src/pages/admin/Subjects.jsx`
- `src/pages/admin/Banners.jsx`
- `src/pages/admin/AdminLayout.jsx`
- `src/utils/siteSectionsEngine.js`
- `src/pages/Home.jsx`
- `src/pages/StudyToolsPage.jsx`
- `src/pages/YearPage.jsx`
- `src/pages/SubjectPage.jsx`
- `src/pages/AccessoriesPage.jsx`
- `src/pages/BoxesPage.jsx`
- `src/pages/SearchPage.jsx`
- `src/supabaseClient.js`
- `src/utils/subjectGroupEngine.js`
- `src/defaultProducts.json`
- `public/products/self-sealing-sterilization-pouch.jpg`
- `public/products/fluoride-varnish.jpg`
- `public/products/periodontal-probe.png`
- `public/products/mouth-mirror.jpg`
- `PROJECT_STATE.md`

---

## 3. الروابط المباشرة المؤكدة:
- **السنة الثالثة:** `https://absolutedental.ly/#/year/3rd-year`
- **جراحة الفم والأسنان:** `https://absolutedental.ly/#/subject/oral-surgery`
- **طب وجراحة اللثة:** `https://absolutedental.ly/#/subject/periodontology`
- **طب أسنان الأطفال:** `https://absolutedental.ly/#/subject/pediatric-dentistry`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي طلبات أو تعديلات إضافية من الإدارة.
