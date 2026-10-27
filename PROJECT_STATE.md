# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-27 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Dental Boxes Unified Inventory Engine + Quick Box & Color Studio + Standalone Box Portal + Static SPA Route Pre-generation Engine + Relative Asset Resolution Engine (`base: './'`).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. تعديل بوكس 17 إنش (إزالة الوردي وتوحيد المقاس 17 إنش):
- **توحيد المقاس:** تم تعديل تسمية وحجم البوكس من 17.5 إنش إلى **17 إنش** (`17 inch` / `Professional Box — GT-MAX 17"`) في جميع الملفات وقاعدة البيانات واللوحات الإدارية.
- **إزالة اللون الوردي:** تم مسح اللون الوردي الخاص ببوكس 17 إنش من جدول الألوان `accessory_product_colors`، وإزالته من بيانات القوالب الافتراضية `FALLBACK_BOXES` و `CANONICAL_ORDERED_BOXES`، مع تحديث سجلات التخزين والمخزون.

### 🔹 2. تعديل بوكس 16 إنش (استبدال اللون الأحمر باللون الأسود):
- **حذف الصورة الحمراء نهائياً:** تم حذف صورة `public/accessories/box16-red.jpg` بشكل نهائي ومسح اللون الأحمر من جدول الألوان لبوكس 16.
- **اعتماد اللون الأسود بالصورة الحقيقية المرفقة:** تم حفظ الصورة الحقيقية للبوكس الأسود المرفقة من المستخدم كـ `public/accessories/box16-black.jpg` و `box16-black-real.jpg` ورفعها لمستودع التخزين السحابي `smylodent-assets/accessories/box16-black.jpg` وتعيين اللون الأسود كصورة رئيسية وخيار أساسي في البطاقة.

### 🔹 3. إضافة منتج كاست الجبس (Edentulous Dental Cast):
- **المواصفات المعتمدة:**
  - **الاسم:** باللغة الإنجليزية فقط (`Edentulous Dental Cast`) كما طُلب بدقة.
  - **السعر:** 5 د.ل (5 دينار).
  - **المادة:** صناعة الأسنان المتحركة (`removable-prosthodontics`) للسنة الثانية (`year-2`).
  - **الصورة:** حفظ ورفع صورة كاست الجبس الحقيقية كـ `public/products/edentulous-cast.png` وسحابياً في `smylodent-assets/products/edentulous-cast.png`.
  - **المعرف الثابت:** `22000000-0000-0000-0000-000000000099`.
- **التخزين وقاعدة البيانات:** تم إدراج المنتج بنجاح في جدول `products` في Supabase وإضافته إلى `src/defaultProducts.json`.
- **تحديث الكاش:** ترقية مفتاح الكاش في `src/pages/SubjectPage.jsx` إلى `subject_v35` لضمان ظهور الكاست فوراً لكل الزوار والطلبة دون الحاجة لمسح يدوي لكاش المتصفح.

### 📁 الملفات التي تم تعديلها:
- `src/utils/boxInventoryEngine.js`
- `src/pages/BoxesPage.jsx`
- `src/pages/admin/AdminQuickBoxes.jsx`
- `src/pages/SubjectPage.jsx`
- `src/supabaseClient.js`
- `src/defaultProducts.json`
- `public/accessories/box16-red.jpg` (تم الحذف نهائياً)
- `public/accessories/box16-black.jpg` (صورة جديدة مضافة)
- `public/products/edentulous-cast.png` (صورة جديدة مضافة)

---

## 3. الروابط المباشرة المؤكدة:
- **صفحة البوكسات:** `https://absolutedental.ly/#/boxes`
- **مادة صناعة الأسنان المتحركة (سنة ثانية):** `https://absolutedental.ly/#/subject/removable-prosthodontics`
- **صفحة كاست الجبس المباشرة:** `https://absolutedental.ly/#/product/22000000-0000-0000-0000-000000000099`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- إرسال التغييرات للمستودع عبر `git commit` و `git push` ومتابعة اكتمال عملية النشر الآلي عبر GitHub Actions.
