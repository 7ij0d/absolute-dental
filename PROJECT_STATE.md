# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-28 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Dental Boxes Unified Inventory Engine + Quick Box & Color Studio + Standalone Box Portal + Static SPA Route Pre-generation Engine + Relative Asset Resolution Engine (`base: './'`).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 حصر قبضة توربين وستكود (Westcode XM-H300 M4) في مادتي الفكسد والريموفبل لسنة ثانية فقط:
1. **قاعدة البيانات السحابية (Supabase DB):**
   - تحديث سجل المنتج في جدول `products` برقم المعرف `f325cfaa-c6b0-4330-966e-262cdced4635`:
     - المادة الأساسية (`subject_id`): مادة صناعة الأسنان الثابتة 2 (`22000000-0000-0000-0000-000000000023` - Fixed Prosthodontics).
     - السنة الدراسية (`year_id`): السنة الثانية (`20000000-0000-0000-0000-000000000002`).
   - تحديث جدول الربط متعدد-إلى-متعدد (`product_subjects`):
     - حذف كافة الارتباطات السابقة بمادة علاج الأسنان التحفظي (Operative) أو سنوات دراسية أخرى.
     - قصر الارتباط حصرياً على:
       1. مادة صناعة الأسنان الثابتة - سنة ثانية (`22000000-0000-0000-0000-000000000023`).
       2. مادة صناعة الأسنان المتحركة - سنة ثانية (`22000000-0000-0000-0000-000000000022`).
2. **ملف المنتجات الاحتياطي (Local Seeding `src/defaultProducts.json`):**
   - تحديث بيانات منتج قبضة وستكود لتكون مادتها الأساسية Fixed Prosthodontics والمادة الإضافية Removable Prosthodontics لسنة ثانية فقط، وإلغاء أي ارتباط بمادة Operative أو سنوات أخرى.
3. **تحديث مفتاح الكاش في واجهة المواد (`SubjectPage.jsx`):**
   - ترقية مفتاح الكاش إلى `subject_v39` لضمان ظهور التوزيع الجديد فوراً على كافة متصفحات الطلبة والعملاء دون الحاجة لمسح يدوي للكاش.

### 📁 الملفات التي تم تعديلها:
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `PROJECT_STATE.md`
- جدول `products` وجدول `product_subjects` في Supabase

---

## 3. الروابط المباشرة المؤكدة:
- **مادة صناعة الأسنان الثابتة (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`
- **مادة صناعة الأسنان المتحركة (سنة ثانية):** `https://absolutedental.ly/#/subject/removable-prosthodontics`
- **صفحة تفاصيل قبضة توربين Westcode:** `https://absolutedental.ly/#/product/f325cfaa-c6b0-4330-966e-262cdced4635`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- إرسال التحديث عبر `git commit` و `git push` ونشره حياً على الدومين الرسمي `absolutedental.ly`.
