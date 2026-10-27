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

### 🔹 إضافة بخاخ الكحول الطبي (Medical Alcohol Spray) في جميع المواد الدراسية:
1. **المواصفات المعتمدة للمنتج:**
   - **الاسم:** باللغة الإنجليزية حصراً: **`Medical Alcohol 75% (125ml)`** (في `name_ar` و `name_en`).
   - **السعر:** **5 د.ل** (5 دينار).
   - **الصورة:** حفظ الصورة الحقيقية عالية الدقة المرفقة من المستخدم كـ `public/products/medical-alcohol-spray.png` ورفعها إلى Supabase Storage كـ `products/medical-alcohol-spray.png`.
   - **المعرف الثابت:** `99000000-0000-0000-0000-000000000005`.
   - **الوسم العام:** `discount_label_en: 'universal'` لإدراجه تلقائياً كمنتج استهلاكي عام في جميع المواد.
2. **الربط بجميع المواد الدراسية (كل السنوات):**
   - تم ربط المنتج برمجياً بجميع المواد الـ 9 في قاعدة البيانات عبر جدول الربط `product_subjects`:
     - Dental Anatomy (سنة أولى)
     - Dental Materials (سنة أولى)
     - Conservative Dentistry (سنة ثانية)
     - Removable Prosthodontics (سنة ثانية)
     - Fixed Prosthodontics (سنة ثانية)
     - Conservative Dentistry 2 (سنة ثالثة)
     - Preventive Dentistry (سنة ثالثة)
     - Fixed Prosthodontics 2 (سنة ثالثة)
     - Removable Prosthodontics 2 (سنة ثالثة)
   - إضافة المنتج مع قائمة `extra_subject_ids` و `all_subjects: true` في `src/defaultProducts.json`.
3. **الترتيب البصري ومجموعة المستهلكات:**
   - تم تحديث خوارزمية ترتيب المستهلكات `sortConsumables` في `src/utils/subjectGroupEngine.js` ليظهر بخاخ الكحول بانتظام وأناقة بجانب مفرش العيادة (Cover Sheet)، والقفازات (Gloves)، والكمامات (Masks).
4. **تحديث الكاش البرمجي:**
   - ترقية مفتاح الكاش في `src/pages/SubjectPage.jsx` إلى `subject_v36` لضمان إفراغ الكاش القديم في متصفحات الزوار وظهور الكحول الطبي فوراً في جميع المواد.

### 📁 الملفات التي تم تعديلها:
- `src/utils/subjectGroupEngine.js`
- `src/pages/SubjectPage.jsx`
- `src/defaultProducts.json`
- `public/products/medical-alcohol-spray.png` (صورة المنتج الجديدة)
- `public/products/medical-alcohol.png` (نسخة احتياطية مطابقة)

---

## 3. الروابط المباشرة المؤكدة:
- **صفحة المنتج المباشرة:** `https://absolutedental.ly/#/product/99000000-0000-0000-0000-000000000005`
- **علاج الأسنان التحفظي (سنة ثانية):** `https://absolutedental.ly/#/subject/restorative-dentistry`
- **صناعة الأسنان المتحركة (سنة ثانية):** `https://absolutedental.ly/#/subject/removable-prosthodontics`
- **صناعة الأسنان الثابتة (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`
- **تشريح الأسنان (سنة أولى):** `https://absolutedental.ly/#/subject/dental-anatomy`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- إرسال التحديث عبر `git commit` و `git push` ونشره حياً على الدومين الرسمي `absolutedental.ly`.
