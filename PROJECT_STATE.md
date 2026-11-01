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

### 🔹 تثبيت قسم المستهلكات العام أسفل كل المواد، وتحديثات الوقائي والفكسد والريموفبل:

1. **قسم المستهلكات الموحد أسفل جميع المواد الأكاديمية (All Subjects Bottom Consumables):**
   - تم إدراج قسم موحد في أسفل قائمة منتجات كل مادة دراسية يحتوي حصرياً على:
     1. الكافر شيت (Cover Sheet Pink & Blue) - 0.5 د.ل
     2. الماسك (Disposable Face Masks Blue & Black) - 0.5 د.ل
     3. القلافز (Overseas Glove Nitrile Examination Gloves) - 1 د.ل
     4. طقم الفحص الديسبوزبل (Disposable Dental Examination Kit) - 2.5 د.ل
     5. الكحول الطبي (Medical Alcohol 75%) - 5 د.ل
     6. حامل البارات (Bur Holder) - حصرياً لمادتي العلاج التحفظي 1 وصناعة الأسنان الثابتة 1 لسنة ثانية.
   - تم ربط هذه المستلزمات في جدول `product_subjects` بجميع المواد الدراسية التسع لضمان ظهورها المتناسق دون تشويش على أدوات المادة الرئيسية.

2. **تحديث مادة طب الأسنان الوقائي (Preventive Dentistry - السنة الثالثة):**
   - أدوات المادة المباشرة تضم الآن:
     1. رول التغليف والعزل الواقي الأزرق (`Dental Barrier Wrapping Roll`).
     2. شاش العيادة العادي القطعة المعقم (`Life Support Sterile Gauze Swab 10x10cm` بسعر 0.5 د.ل).
   - يتبعها بالأسفل قسم المستهلكات العامة الموحد.

3. **إزالة الربر دام والبليد من الفكسد والريموفبل:**
   - **Fixed Prosthodontics 2 (سنة ثالثة):** تم حذف شفرات الجراحة (`Surgical Blades Size 22`) وحواجز الربر دام (`Dental Rubber Dam Sheets 6x6`) منها نهائياً.
   - **Removable Prosthodontics 2 (سنة ثالثة):** تم حذف شفرات الجراحة وحواجز الربر دام منها نهائياً.
   - **حصر الربر دام:** تم حصر حواجز الربر دام (`Rubber Dam Sheets`) حصرياً في مادة علاج الأسنان التحفظي 2 (`Conservative Dentistry 2`).

4. **تحديث محرك التجميع وكاش الواجهات:**
   - تحديث `src/utils/subjectGroupEngine.js` لترتيب المستهلكات بحسب طلب المستخدم (الكافر شيت أولاً، ثم الكمامات، ثم القفازات، ثم طقم الفحص، ثم الكحول).
   - ترقية مفتاح الكاش في `SubjectPage.jsx` إلى `subject_v41` لتطبيق الظهور الجديد فوراً.
   - اجتياز اختبار البناء الكامل (`npm run build`) بنجاح تام.

### 📁 الملفات التي تم تعديلها:
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `src/utils/subjectGroupEngine.js`
- `PROJECT_STATE.md`
- قاعدة بيانات Supabase (جدول `products` وجدول `product_subjects`)

---

## 3. الروابط المباشرة المؤكدة:
- **طب الأسنان الوقائي (سنة ثالثة):** `https://absolutedental.ly/#/subject/preventive-dentistry`
- **صناعة الأسنان الثابتة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/fixed-prosthodontics-2`
- **صناعة الأسنان المتحركة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/removable-prosthodontics-2`
- **علاج الأسنان التحفظي 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/conservative-dentistry-2`
- **صناعة الأسنان الثابتة 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`
- **علاج الأسنان التحفظي 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/restorative-dentistry`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- دفع التحديثات إلى المستودع الرئيسي ونشر النسخة النهائية على الدومين الرسمي `absolutedental.ly`.
