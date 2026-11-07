# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-11-07 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Route-Level Code Splitting (`React.lazy` + `Suspense`) + Independent Course Banners Engine (`courseBannersEngine.js`) + Shared In-Flight Query Deduplication & Idle Prefetch Engine + Sharp Image Optimization Pipeline.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 إضافة نظام إدارة وتعديل بانرات المواد الدراسية (`Manage Course Banners`):
1. **إضافة صفحة مخصصة في لوحة الإدارة (`/admin/course-banners` — `Manage Course Banners`):**
   - عرض جميع المواد الدراسية في الموقع مرتبة ومقسمة حسب السنة الدراسية (`السنة الأولى`، `السنة الثانية`، `السنة الثالثة`).
   - استقلال كامل بنسبة 100% لكل مادة دراسية عبر معرّفها الفريد (`id` و `slug`):
     - `Fixed Prosthodontics` (سنة ثانية) مستقل تماماً عن `Fixed Prosthodontics 2` (سنة ثالثة).
     - `Operative / Conservative 1` (سنة ثانية) مستقل تماماً عن `Conservative Dentistry 2` (سنة ثالثة).
     - `Removable Prosthodontics 1` (سنة ثانية) مستقل تماماً عن `Removable Prosthodontics 2` (سنة ثالثة).
     - `Oral Surgery`، `Periodontology`، `Pediatric Dentistry`، `Preventive Dentistry`، `Dental Anatomy`، `Dental Materials` — لكل مادة بانر مستقل خاص بها فقط.
2. **مميزات نظام `Manage Course Banners` (`src/pages/admin/CourseBanners.jsx`):**
   - زر **Edit Banner / تعديل البانر** بجانب كل مادة دراسية.
   - رفع صورة جديدة بسهولة من الهاتف أو الآيباد أو الكمبيوتر مع ضغط تلقائي ذكي للصورة (`WebP/PNG` عالي الدقة وخفيف الحجم) ورفعها إلى التخزين السحابي المعتمد (`smylodent-assets/course-banners/`).
   - **معاينة حية ومطابقة لواجهة الطلاب** (`Live Preview` + نافذة معاينة كاملة) قبل وبعد الحفظ.
   - زر **إعادة الصورة الافتراضية** (`Reset to Default Image`) لاسترجاع التصميم الأصلي لأي مادة بضغطة واحدة دون التأثير على باقي المواد.
   - تعديل اسم المادة بالعربية والإنجليزية (`name_ar` و `name_en`) والتحكم في ترتيب ظهور المواد داخل كل سنة دراسية (`⬆️` / `⬇️` أو رقم الترتيب).
   - حفظ مباشر في جدول `subjects` بقاعدة البيانات مع نسخة احتياطية متزامنة في `settings` (`course_banners_config`) وتحديث فوري للتخزين المؤقت (`Cache Invalidation`) ليظهر التعديل لجميع الطلاب فوراً.

### 📁 الملفات التي تم إنشاؤها أو تعديلها:
- `src/utils/courseBannersEngine.js` (جديد)
- `src/pages/admin/CourseBanners.jsx` (جديد)
- `src/App.jsx`
- `src/pages/admin/AdminLayout.jsx`
- `src/pages/admin/Subjects.jsx`
- `src/pages/admin/Banners.jsx`
- `src/pages/YearPage.jsx`
- `src/pages/SubjectPage.jsx`
- `PROJECT_STATE.md`

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي طلبات أو تعديلات إضافية من الإدارة.
