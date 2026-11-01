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

### 🔹 فصل الكافر شيت إلى عنصرين مستقلين منفصلين (وردي وأزرق) بدلاً من منتج واحد بخيارات:

1. **فصل المنتج إلى عنصرين مستقلين:**
   - **مفرش عيادة أسنان Cover Sheet (وردي):** معرّف `33000000-0000-0000-0000-000000000103` بسعر 0.5 د.ل وصورته الوردية الخاصة، يُضاف مباشرة للسلة بنقرة واحدة دون نوافذ اختيار ألوان.
   - **مفرش عيادة أسنان Cover Sheet (أزرق):** معرّف `33000000-0000-0000-0000-000000000104` بسعر 0.5 د.ل وصورته الزرقاء الخاصة، يُضاف مباشرة للسلة بنقرة واحدة.

2. **تحديث محرك المتغيرات (`productInventoryEngine.js`):**
   - إزالة الكافر شيت من كائن `CANONICAL_SIZED_PRODUCTS` لمنع ظهوره كمنتج مدمج بخيارات ألوان.
   - وضع حماية صريحة في `getProductSizedConfig` تعيد `null` لكلا المعرفين وللكافر شيت لضمان عمله كمنتج مباشر وسريع.

3. **تحديث قاعدة بيانات Supabase و`defaultProducts.json`:**
   - تحديث مسميات وأوصاف كل منتج على حدة في جدول `products` وقاعدة البيانات السحابية.
   - ضبط الترتيب في `sortConsumables` ليظهر الوردي أولاً بجانب الأزرق مباشرة في مقدمة قسم المستهلكات.
   - ترقية مفتاح الكاش في `SubjectPage.jsx` إلى `subject_v43`.
   - اجتياز اختبار البناء الكامل (`npm run build`) بنجاح تام.

### 📁 الملفات التي تم تعديلها:
- `src/utils/productInventoryEngine.js`
- `src/utils/subjectGroupEngine.js`
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `PROJECT_STATE.md`
- قاعدة بيانات Supabase (جدول `products`)

---

## 3. الروابط المباشرة المؤكدة:
- **المستهلكات والإكسسوارات العامة:** `https://absolutedental.ly/#/search?category=other-supplies`
- **علاج الأسنان التحفظي 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/restorative-dentistry`
- **صناعة الأسنان الثابتة 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- جاهزية تامة لتلقي أي تعديلات أو إضافات إضافية.
