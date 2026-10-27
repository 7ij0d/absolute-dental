# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-27 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الاستضافة:** GitHub Pages الرسمية فائقة السرعة والمؤمنة بـ SSL التلقائي: `https://7ij0d.github.io/absolute-dental/`
- **الدومين المخصص:** `absolutedental.ly` (جاري انتظار استكمال شهادة الحماية SSL من مسجل النطاق / الاستضافة).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 (HashRouter) + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Dental Boxes Unified Inventory Engine + Quick Box & Color Studio + Standalone Box Portal + Static SPA Route Pre-generation Engine + Relative Asset Resolution Engine (`base: './'`).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 اعتماد وحصر أحجام وأسعار البوكسات الرسمية حصرياً:
1. **تحديث وتثبيت قائمة الأحجام والأسعار النهائية للبوكسات:**
   - 📦 **بوكس 14 إنش:** **45 د.ل**
   - 📦 **بوكس 16 إنش:** **65 د.ل**
   - 📦 **بوكس 16.5 إنش:** **85 د.ل**
   - 📦 **بوكس 17 إنش (17.5 GT-MAX):** **85 د.ل**
   *(حصر البوكسات في هذه الأحجام والأسعار الأربعة فقط دون غيرها).*
2. **المزامنة الشاملة في قاعدة البيانات ومحرك المخزون والواجهة:**
   - تحديث جدول منتجات الملحقات لقيم الأسعار المعتمدة (تعديل 17.5 إنش من 95 إلى 85، وتثبيت 16.5 إنش على 85 د.ل).
   - تحديث سجلات الأسعار في إعدادات `box_variants_inventory`.
   - تعديل القيم الافتراضية والبيانات المرجعية في [`src/utils/boxInventoryEngine.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/boxInventoryEngine.js) لـ `CANONICAL_BOXES` و `FALLBACK_BOXES`.
   - تحديث الأسعار الافتراضية للبطاقات في مدير البوكسات السريع [`src/pages/admin/AdminQuickBoxes.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/admin/AdminQuickBoxes.jsx).
3. **التحقق والبناء (Build Verification):**
   - اجتياز اختبار البناء `npm run build` بنجاح بنسبة 100% في 3.08 ثوانٍ.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/utils/boxInventoryEngine.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/boxInventoryEngine.js) | تثبيت أسعار البوكسات: 14 بـ 45، 16 بـ 65، 16.5 بـ 85، و 17 بـ 85 د.ل |
| [`src/pages/admin/AdminQuickBoxes.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/admin/AdminQuickBoxes.jsx) | مطابقة الأسعار الافتراضية للبوكسات الأربعة في واجهة الإضافة السريعة |
| [`PROJECT_STATE.md`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/PROJECT_STATE.md) | تحديث وثيقة حالة المشروع المستمرة ومزامنة التغييرات |

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- دفع التعديلات عبر `git commit & push`.
- تأكيد ضبط الأسعار الأربعة للمشرف وإرسال الرابط المباشر.
