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

### 🔹 تشخيص وإصلاح مشكلة عدم فتح صفحات تفاصيل بعض المنتجات (Fix Product Details & 404 Pages):
1. **السبب الجذري للمشكلة (Root Cause Diagnosis):**
   - في صفحة تفاصيل المنتج `ProductDetails.jsx`، كان الاستعلام السحابي يطلب ربط جدول المواد عبر `.select('*, subjects(...)')` دون تحديد المفتاح الخارجي المحدد.
   - ونظراً لوجود علاقتين بين جدول المنتجات وجدول المواد (علاقة المفتاح الأجنبي `products_subject_id_fkey` وعلاقة الجدول الوسيط متعدد-إلى-متعدد `product_subjects`)، كان PostgREST يُرجع خطأ `PGRST201: Could not embed because more than one relationship was found for products and subjects`.
   - هذا الخطأ أدّى إلى فشل استعلام قاعدة البيانات لجميع المنتجات الـ 66 في Supabase، مما جعل الصفحة تلجأ إلى القائمة الافتراضية الاحتياطية. أي منتج موجود في قاعدة البيانات ولم يكن مسجلاً في القائمة الاحتياطية (أو منتج أضيف حديثاً أو تم تعديل صوره) كان يظهر كـ 404 ("المنتج غير موجود") ولا يمكن فتحه نهائياً رغم إمكانية إضافته للسلة من صفحات المواد.
   - في مجموعات البارات (Bur Groups)، كان الضغط على البطاقة يفتح نافذة الاختيار دون توفير رابط للانتقال لصفحة تفاصيل البير لمشاهدة صوره ووصفه الكامل.
2. **الحلول المنفذة (Permanent Fixes):**
   - **`src/pages/ProductDetails.jsx`:**
     - تحديد المفتاح الأجنبي الصريح في الاستعلام: `subjects:subjects!products_subject_id_fkey(...)` لإلغاء التعارض نهائياً.
     - إضافة استعلام احتياطي مباشر فوري `select('*')` في حال حدوث أي خطأ في علاقات الربط لضمان فتح المنتج 100%.
     - تنظيف معرف المنتج من أي لاحقة مقاس مثل `-M` أو `-L` عند الانتقال من السلة.
     - دعم مجموعات البارات الافتراضية `isBurGroupProduct` لعرض تفاصيلها دون أي خطأ 404.
     - تفعيل جلب الصور الإضافية من جدول `product_images` ليتمكن الطلبة من استعراض معرض الصور الكامل للمنتج.
   - **`src/components/BurGroupModal.jsx`:**
     - جعل بطاقات وصور وأسماء البارات داخل نافذة الاختيار تفاعلية وقابلة للنقر (`cursor: pointer`).
     - إضافة زر ورابط أنيق «التفاصيل والوصف» مزود بأيقونة المعاينة `<Eye />` بجوار كل بير، ينقل الطالب مباشرة إلى صفحة تفاصيل البير لمشاهدة صوره فائقة الدقة وأوصافه ومقاساته السريرية.
   - **`src/defaultProducts.json`:**
     - مزامنة كافة المنتجات الـ 67 الموجودة في قاعدة البيانات ودمج أي منتجات ناقصة داخل الملف الاحتياطي.
   - **`src/pages/SubjectPage.jsx`:**
     - ترقية مفتاح الكاش إلى `subject_v37` لتحديث واجهات المتصفحات بالكامل فوراً.

### 📁 الملفات التي تم تعديلها:
- `src/pages/ProductDetails.jsx`
- `src/components/BurGroupModal.jsx`
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `index.html`, `public/manifest.json`, `public/robots.txt`, `public/sitemap.xml`, `public/google8559ecef1b1b49a2.html`, `public/8559ecef1b1b49a28559ecef1b1b49a2.txt` (تهيئة شاملة لجميع محركات البحث Google, Safari/Applebot, Bing, Yahoo, DuckDuckGo, Yandex وإثبات الملكية)

---

## 3. الروابط المباشرة المؤكدة:
- **صفحة كاست الجبس (Dental Cast 125):** `https://absolutedental.ly/#/product/8f344bd9-91ec-4787-8371-f489cccf635e`
- **صفحة كاست الجبس الأدرد (Edentulous Dental Cast):** `https://absolutedental.ly/#/product/22000000-0000-0000-0000-000000000099`
- **صفحة بخاخ الكحول الطبي:** `https://absolutedental.ly/#/product/99000000-0000-0000-0000-000000000005`
- **صفحة البوكسات:** `https://absolutedental.ly/#/boxes`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- إرسال التحديث عبر `git commit` و `git push` ونشره حياً على الدومين الرسمي `absolutedental.ly`.
