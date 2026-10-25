# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-25 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + Vanilla Semantic CSS Design System (v4.0) + Bur Grouping & Popup Engine.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 تطوير نظام عرض بـارات الأسنان (Dental Burs Grouping & Popup System):
1. **تنظيم البارات في 6 مجموعات موحدة في صفحات العرض والبحث:**
   - **TC Needle:** خيارات `TC 9` و `TC 10` (أزرق).
   - **Tapered Fissure with Flat End:** خيارات `TF 12 – Blue` و `TF 12 – Yellow`.
   - **Diamond Flame Bur:** خيارات `FO 32 – Blue` (الصورة الجديدة) و `FO 32 – Yellow`.
   - **Fisher Bur:** خيارات `SF 41 – Blue` (الصورة الجديدة)، `SF 46 – Blue`، و `CD 52 – Red`.
   - **Round Bur:** خيارات `BR 41` (الصورة الجديدة) و `BR 46` مع اعتماد كود ورمز `BR`.
   - **SI Bur:** خيار `SI 46 – Blue` مباشرة داخل النافذة.
2. **بطاقة موحدة وزر «اختيار البير»:**
   - تظهر بطاقة واحدة لكل مجموعة بورتريت أنيق وصورة أساسية بدون نصوص عشوائية، مع السعر الفعلي وزر «اختيار البير».
3. **نافذة منبثقة تفاعلية (Bur Group Modal):**
   - تعرض النافذة صورة المجموعة والخيارات المتوفرة مع صورها الصغيرة وألوانها وأسعارها الفعلية.
   - إمكانية إضافة كل خيار إلى السلة بصورة مستقلة ومباشرة مع محدد كمية وسرعة استجابة، دون مغادرة النافذة.
4. **حجب كمية المخزون بالكامل عن واجهة الزبون:**
   - لا تظهر أي أرقام أو كميات قطع في بطاقة المنتج أو داخل النافذة المنبثقة أو في أي جزء من واجهة المتجر، مع بقاء المخزون متاحاً وخاضعاً للرقابة في لوحة الإدارة ونظام صرف الطلبات.
5. **إضافة المنتجات والصور الجديدة وربطها بالمخزون:**
   - إضافة سجلات المنتجات الجديدة في قاعدة البيانات (`TC 9`, `FO 32 – Blue`, `SF 41 – Blue`, `BR 41`).
   - ربط الصور الجديدة ورفعها للتخزين السحابي وحفظها في `public/products/`.
   - ربط المنتجات بمواد السنة الثانية في `product_subjects`.
   - الحفاظ التام على بقية المنتجات والطلبات والفواتير السابقة دون أدنى مساس.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/utils/burGroupingEngine.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/burGroupingEngine.js) | محرك تنظيم وتجميع المجموعات الست للبارات وربط الخيارات بالمنتجات الفعلية |
| [`src/components/BurGroupModal.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/BurGroupModal.jsx) | النافذة المنبثقة لاختيار البير مع الإضافة المستقلة للسلة وحجب كمية المخزون |
| [`src/components/ProductCard.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/ProductCard.jsx) | دعم بطاقات مجموعات البارات وزر «اختيار البير» وفتح النافذة |
| [`src/pages/SubjectPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/SubjectPage.jsx) | دمج المجموعات الست تلقائياً في صفحات المواد الدراسية |
| [`src/pages/SearchPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/SearchPage.jsx) | دمج المجموعات في صفحة البحث وتصفية المنتجات |
| [`src/pages/ProductDetails.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/ProductDetails.jsx) | دمج مجموعات البارات في قسم المنتجات ذات الصلة |
| [`src/defaultProducts.json`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/defaultProducts.json) | مزامنة البارات الجديدة وتحديث أسماء البارات الحالية |
| `public/products/` & قاعدة البيانات السحابية | حفظ الصور الجديدة (`bur-br-41.png`, `bur-sf-41-blue.png`, `bur-fo-32-blue.png`) وإدراج المنتجات في جدول `products` و `product_subjects` |

---

## 3. ما تم إنجازه ويعمل بنجاح
- [x] **تجميع بـارات الأسنان في 6 مجموعات موحدة ببطاقة واحدة لكل مجموعة** ✅
- [x] **نافذة منبثقة تفاعلية لعرض المقاسات والألوان مع زر إضافة مستقل لكل خيار** ✅
- [x] **إضافة المنتجات والصور الجديدة (BR 41, SF 41 Blue, FO 32 Blue, TC 9) وربطها بالمخزون** ✅
- [x] **حجب كمية المخزون وأرقام القطع تماماً عن واجهة الزبائن** ✅
- [x] **اعتماد رمز BR لمنتجات الـ Round Bur في الأسماء والأكواد** ✅
- [x] **إتمام البناء الإنتاجي (`npm run build`) بنجاح تام وبدون أي أخطاء** ✅

---

## 4. الخطوة القادمة المطلوبة (Immediate Next Step)
- فتح صفحة مادة علاج الأسنان التحفظي 2 أو صناعة الأسنان الثابتة 2، والنقر على «اختيار البير» لتجربة إضافة خيارات متعددة إلى السلة والتأكد من انسيابية التجربة.
