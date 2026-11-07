# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-11-07 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `https://absolutedental.ly` (مؤمّن بشهادة SSL رسمية سارية المفعول حتى 2027 ومفعّل HTTPS الإجباري بنجاح).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Route-Level Code Splitting (`React.lazy` + `Suspense`) + Independent Course Banners Engine (`courseBannersEngine.js`) + Live Product Status & Visibility Sync Engine (`productInventoryEngine.js`) + Shared In-Flight Query Deduplication & Idle Prefetch Engine + Sharp Image Optimization Pipeline.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 إصلاح جذري لمزامنة حالة المنتجات بين لوحة الإدارة وواجهة المستخدم (`Out of Stock` vs `Hide from Store`):
1. **حالة المنتج «غير متوفر» (`Out of Stock` — `availability === 'unavailable'`):**
   - يبقى المنتج ظاهراً في المتجر بصورة طبيعية مع شارة حمراء واضحة في أعلى البطاقة (`غير متوفر`) وحالة باللون الأحمر (`● غير متوفر`).
   - تعطيل زر الإضافة إلى السلة بالكامل (`disabled`) مع تلوينه باللون الأحمر (`غير متوفر`) في كل من:
     - بطاقات المنتجات (`src/components/ProductCard.jsx`)
     - نافذة مجموعات البيرز (`src/components/BurGroupModal.jsx` + `src/utils/burGroupingEngine.js`)
     - صفحة تفاصيل المنتج (`src/pages/ProductDetails.jsx`)
   - منع إضافة المنتج أو زيادة كميته داخل السلة (`src/context/CartContext.jsx`).
   - إذا كان المنتج مضافاً مسبقاً في سلة الزبون ثم تحول إلى غير متوفر، يتم فحص حالته الحية من قاعدة البيانات في صفحة السلة (`src/pages/CartPage.jsx`) وصفحة إتمام الطلب (`src/pages/CheckoutPage.jsx`)، وإظهار تنبيه أحمر واضح مع زر لحذفه بضغطة واحدة ومنع إتمام الطلب حتى يتم إزالته.
   - عند إعادة حالة المنتج إلى `متوفر` (`available`) من لوحة الإدارة، يتفعل زر الطلب تلقائياً.

2. **حالة «عدم العرض في المتجر» (`Hide from Store` — `is_active === false` أو `is_archived === true`):**
   - يختفي المنتج تماماً من جميع واجهات المتجر للزبائن:
     - صفحات المواد الدراسية (`src/pages/SubjectPage.jsx`)
     - صفحات البحث والعروض والمستلزمات الأخرى (`src/pages/SearchPage.jsx`)
     - نوافذ مجموعات البيرز (`src/utils/burGroupingEngine.js`)
     - صفحة تفاصيل المنتج والمنتجات المقترحة (`src/pages/ProductDetails.jsx`)
     - صفحة المفضلة (`src/pages/Favorites.jsx`)
   - منع استرجاع المنتجات المخفية من ملف البيانات الاحتياطي (`src/defaultProducts.json`) عبر تتبع جميع معرفات قاعدة البيانات (`allKnownDbIds`) ومزامنة الحالة الحية (`syncLiveProductStates`).
   - يبقى المنتج محفوظاً وقابلاً للتعديل أو إعادة العرض بضغطة واحدة داخل لوحة الإدارة (`src/pages/admin/Products.jsx`).

3. **تطوير لوحة الإدارة (`src/pages/admin/Products.jsx`):**
   - إضافة أزرار تبديل فورية بضغطة واحدة (`1-Click Quick Toggle`) في جدول المنتجات لكل منتج:
     - زر تبديل حالة التوفر: `✓ متوفر (Available)` ⇄ `● غير متوفر (Out of Stock)`
     - زر تبديل حالة العرض بالمتجر: `👁️ معروض بالمتجر` ⇄ `🚫 مخفي من المتجر (عدم العرض)`
   - تحديث فوري لقاعدة البيانات ومسح الكاش (`clearSubjectCaches()`) ومزامنة الحالة الحية (`syncLiveProductStates`) دون الحاجة لإعادة تحميل الصفحة.

### 📁 الملفات التي تم تعديلها:
- `src/utils/productInventoryEngine.js`
- `src/utils/burGroupingEngine.js`
- `src/components/ProductCard.jsx`
- `src/components/BurGroupModal.jsx`
- `src/pages/SubjectPage.jsx`
- `src/pages/SearchPage.jsx`
- `src/pages/ProductDetails.jsx`
- `src/pages/Favorites.jsx`
- `src/context/CartContext.jsx`
- `src/pages/CartPage.jsx`
- `src/pages/CheckoutPage.jsx`
- `src/pages/admin/Products.jsx`
- `src/prefetch.js`
- `src/defaultProducts.json`
- `PROJECT_STATE.md`

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة أي طلبات أو تعديلات إضافية من الإدارة.
