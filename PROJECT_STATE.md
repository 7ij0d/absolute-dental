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

### 🔹 إتاحة اختيار مقاسات قالب طبعة الأسنان (Dental Impression Tray) من 1 إلى 4 مع جعل المقاس 2 غير متوفر:
1. **محرك المنتجات ذات المقاسات (`src/utils/productInventoryEngine.js`):**
   - تعديل منتج قالب الطبعة الأزرق (`33000000-0000-0000-0000-000000000101`):
     - تحويل الخيارات من (Upper / Lower) إلى المقاسات الرقمية: `1`، `2`، `3`، `4`.
     - مقاس 1: متوفر للطلب.
     - مقاس 2: غير متوفر حالياً (`available: false`, `isUnavailable: true`).
     - مقاس 3: متوفر للطلب.
     - مقاس 4: متوفر للطلب.
2. **واجهة بطاقة المنتج (`src/components/ProductCard.jsx` و `src/index.css`):**
   - إضافة نمط بصري للمقاس غير المتوفر (`.disabled-size`): خط مشطوب، خلفية باهتة، إطار متقطع، ومنع النقر (`disabled={isSizeUnavailable}`).
   - حماية زر الإضافة للسلة من إضافة أي مقاس غير متاح، وإظهار تنبيه يوضح أن المقاس المحدد غير متوفر.
3. **صفحة تفاصيل المنتج (`src/pages/ProductDetails.jsx`):**
   - في شبكة اختيار المقاسات: إظهار شارة `غير متوفر حالياً` باللون الأحمر للمقاس 2 مع شطب الرقم ومنع اختياره.
   - في زر الإضافة للسلة الرئيسي: تعطيل الزر وعرض رسالة واضحة `المقاس غير متوفر حالياً` في حال كان المقاس غير متاح.
4. **قاعدة البيانات وقائمة المنتجات الاحتياطية (`Supabase DB` و `src/defaultProducts.json`):**
   - تحديث وصف وتفاصيل المنتج لتوضيح توفر المقاسات 1، 3، 4 وتوضيح أن المقاس 2 غير متوفر حالياً.
5. **التحقق من البناء الإنتاجي (`npm run build`):**
   - اجتياز البناء الكامل بنجاح تام دون أي أخطاء برمجية.

### 📁 الملفات التي تم تعديلها:
- `src/utils/productInventoryEngine.js`
- `src/components/ProductCard.jsx`
- `src/pages/ProductDetails.jsx`
- `src/index.css`
- `src/defaultProducts.json`
- `PROJECT_STATE.md`
- جدول `products` في Supabase

---

## 3. الروابط المباشرة المؤكدة:
- **صفحة تفاصيل قالب طبعة الأسنان:** `https://absolutedental.ly/#/product/33000000-0000-0000-0000-000000000101`
- **مادة صناعة الأسنان الثابتة (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`
- **مادة صناعة الأسنان المتحركة (سنة ثانية):** `https://absolutedental.ly/#/subject/removable-prosthodontics`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي طلبات أو تعديلات إضافية من المستخدم.
