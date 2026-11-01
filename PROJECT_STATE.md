# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-11-01 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Dental Boxes Unified Inventory Engine + Quick Box & Color Studio + Standalone Box Portal + Static SPA Route Pre-generation Engine + Relative Asset Resolution Engine (`base: './'`).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 عزل وفصل بيرات سنة ثانية بالكامل بين الكونس (راوند، فيشر، انفيرتد) والفكسد/الكراون:

1. **حصر بيرات العلاج التحفظي 1 (Conservative Dentistry 1 - السنة الثانية):**
   - تم حصر البارات المعروضة في مادة الكونس حصرياً بالأنواع الثلاثة المطلوبة أكاديمياً:
     - **بيرات راوند (Round):** `BR 41` و `BR 46`.
     - **بيرات فيشر (Fissure):** `SF 41 – Blue` و `SF 46 – Blue` و `CD 52 – Red`.
     - **بير انفيرتد (Inverted Cone):** `SI 46 – Blue`.
     - باقة بيرات الكونس (`Conservative Dentistry Burs Bundle`).
   - تم فك أي ارتباط لهذه البارات بمادة الفكسد أو أي مادة أخرى في قاعدة البيانات (`Supabase`) و`src/defaultProducts.json`.

2. **حصر بيرات الفكسد والكراون (Fixed Prosthodontics 1 - السنة الثانية):**
   - تم تجميع بيرات التحضير الخاصة بالكراون والفكسد حصرياً في مادة صناعة الأسنان الثابتة 1:
     - `TF 12 – Blue` و `TF 12 – Yellow`
     - `FO 32 – Blue` و `FO 32 – Yellow`
     - `TC 9 – Blue` و `TC 10`
     - `Wheel Round Bur - WR 13`
     - باقة بيرات الفكسد (`Fixed Prosthodontics Burs Bundle`).
   - تم عزلها بالكامل ومنع أي تكرار أو تسريب بينها وبين مادة الكونس.

3. **تحديث محرك المجموعات والواجهات (`subjectGroupEngine.js` & `SubjectPage.jsx`):**
   - تسمية مجموعة بيرات الكونس: `بيرات الكونس (راوند، فيشر، انفيرتد)` | `Conservative Burs (Round, Fissure, Inverted)`.
   - تسمية مجموعة بيرات الفكسد: `بيرات الكراون والفكسد` | `Crown Preparation Burs`.
   - ترقية مفتاح كاش المتصفح الفوري إلى `subject_v42` لفرض التحديث المباشر لكافة الطلاب بدون الحاجة لحذف الكاش اليدوي.
   - اجتياز اختبار البناء الكامل (`npm run build`) بنجاح تام.

### 📁 الملفات التي تم تعديلها:
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `src/utils/subjectGroupEngine.js`
- `PROJECT_STATE.md`
- قاعدة بيانات Supabase (جدول `products` وجدول `product_subjects`)

---

## 3. الروابط المباشرة المؤكدة:
- **علاج الأسنان التحفظي 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/restorative-dentistry`
- **صناعة الأسنان الثابتة 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`
- **طب الأسنان الوقائي (سنة ثالثة):** `https://absolutedental.ly/#/subject/preventive-dentistry`
- **صناعة الأسنان الثابتة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/fixed-prosthodontics-2`
- **صناعة الأسنان المتحركة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/removable-prosthodontics-2`
- **علاج الأسنان التحفظي 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/conservative-dentistry-2`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي إضافات أو تعديلات مطلوبة من قِبل إدارة المتجر.
