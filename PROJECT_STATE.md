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

### 🔹 إزالة السباطلة العريضة القديمة والإرشاد نهائياً وتثبيت المنتج الجديد المتوفر:
1. **تشخيص سبب ظهور السباطلة القديمة رغم حذفها:**
   - كانت السباطلة القديمة ذات المعرف `2a8f9bde-fb3f-485d-a1bd-d62aa0b83556` مسجلة كقالب افتراضي احتياطي في `src/defaultProducts.json` ومسجلة في مصفوفة `STUDENT_GUIDE_PRODUCTS` كمنتج إرشادي فقط غير متوفر للبيع.
   - في صفحة المادة `SubjectPage.jsx`، كانت توجد آلية استرجاع احتياطية تدمج المنتجات الافتراضية إذا لم تجدها في السيرفر، مما أدى لظهور السباطلة القديمة إلى جانب الجديدة.
2. **الحلول المنفذة (Permanent Fixes):**
   - **قاعدة البيانات (Supabase):** تم التأكد من مسح المنتج القديم وتحديث السباطلة الجديدة (`708f14ad-8374-4461-b003-12d975f1252d`) بمقاس 6 إنش بسعر 10 د.ل وصورتها الحقيقية واسمها المعرّب الكامل `السباطلة العريضة (Wide Spatula)` وكمية مخزون 50 قطعة.
   - **`src/defaultProducts.json`:** تم حذف السجل القديم نهائياً واستبداله ببيانات السباطلة الجديدة المتوفرة.
   - **`src/utils/productInventoryEngine.js`:** تم حذف المعرف القديم من قائمة `STUDENT_GUIDE_PRODUCTS` لإلغاء أي إرشاد سابق بكونها غير متوفرة.
   - **`src/pages/SubjectPage.jsx`:** ترقية إصدار التخزين المؤقت إلى `subject_v34` لضمان إفراغ أي كاش محلي سابق في متصفحات الزوار وتحديث القائمة فوراً بالمنتج المتوفر فقط.

---

### 🔹 الروابط الرسمية المؤكدة والفعالة:
- **مادة صناعة الأسنان المتحركة (سنة ثانية):** `https://absolutedental.ly/#/subject/removable-prosthodontics`
- **صفحة السباطلة العريضة المباشرة:** `https://absolutedental.ly/#/product/708f14ad-8374-4461-b003-12d975f1252d`

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- إرسال التحديث للمستودع عبر `git commit` و `git push` ونشره حياً على الموقع.
