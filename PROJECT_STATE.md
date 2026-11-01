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

### 🔹 فصل قوالب الطبعة (Dental Impression Trays) إلى منتجين مستقلين: قالب علوي (Upper Tray) وقالب سفلي (Lower Tray):

1. **قالب طبعة الأسنان - علوي (Upper Impression Tray):**
   - المعرف: `33000000-0000-0000-0000-000000000101` بسعر 2 د.ل.
   - الصورة: صورة قالب الفك العلوي المرفقة من المستخدم والمرفوعة على السحابة (`dental-impression-tray-upper-blue.png`).
   - خيارات المقاسات: مقاس 1، 2 (غير متوفر)، 3، 4.

2. **قالب طبعة الأسنان - سفلي (Lower Impression Tray):**
   - المعرف: `33000000-0000-0000-0000-000000000119` بسعر 2 د.ل.
   - الصورة: صورة قالب الفك السفلي من الموقع (`dental-impression-tray-blue-angle.png`).
   - خيارات المقاسات: مقاس 1، 2 (غير متوفر)، 3، 4 (نفس مقاسات القالب العلوي تماماً).

3. **المزامنة والتنظيم:**
   - تحديث `productInventoryEngine.js` بتهيئة المقاسات المستقلة لكلا القالبين.
   - تحديث وترتيب `sortImpression` في `subjectGroupEngine.js` لظهور القالب العلوي أولاً ويليه القالب السفلي جنباً إلى جنب في صدارة قسم مواد وقوالب الطبعات.
   - تحديث وحفظ البيانات في جدول `products` وجدول الارتباطات `product_subjects` في Supabase ومزامنة `defaultProducts.json`.
   - ترقية مفتاح كاش الواجهة في `SubjectPage.jsx` إلى `subject_v45` لضمان التحديث الفوري للطلبة.
   - اجتياز اختبار البناء الكامل (`npm run build`) بنجاح تام.

### 📁 الملفات التي تم تعديلها:
- `src/utils/productInventoryEngine.js`
- `src/utils/subjectGroupEngine.js`
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `public/dental-impression-tray-upper-blue.png`
- `PROJECT_STATE.md`
- قاعدة بيانات Supabase (جدول `products` وجدول `product_subjects`)

---

## 3. الروابط المباشرة المؤكدة:
- **صناعة الأسنان الثابتة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/fixed-prosthodontics-2`
- **صناعة الأسنان المتحركة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/removable-prosthodontics-2`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي طلبات أو تعديلات إضافية من الإدارة.
