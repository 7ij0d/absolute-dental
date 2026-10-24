# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-24 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + Vanilla Semantic CSS Design System (v4.0) مع ربط سحابي كامل بقاعدة البيانات وسيرفر التخزين.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 التعديل:
مراجعة هندسية شاملة، تصحيح الأخطاء البرمجية والبصرية (Bug Hunting & Fixing)، وترقية نظام التصميم والواجهة الأمامية بالكامل إلى معايير **Linear / Raycast / Apple-grade Craftsmanship** مع الالتزام الصارم بعدم المساس بأي أسعار أو منتجات أو مواد دراسية (100% Data & Price Integrity).

### 🔹 أبرز الإصلاحات والتحسينات المنفذة:
1. **تصحيح الأخطاء البرمجية والبصرية (Bug Fixes):**
   - **شريط التنقل العلوي والقائمة الجانبية ([`src/components/Navbar.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/Navbar.jsx))**:
     - إصلاح مشكلة تعارض المحاذاة في القائمة الجانبية للموبايل (`marginRight: 'auto'` التي كانت تتعارض مع CSS في وضع RTL).
     - إصلاح خروج قائمة الحساب المنسدلة (Profile Dropdown) عن حدود الشاشة في الوضع العربي عبر استخدام الخصائص المنطقية (`insetInlineEnd: 0`).
     - إضافة أزرار تبديل اللغة (`Globe`) والمفضلة (`Heart`) التي كانت مفقودة في شريط التنقل الفاتح داخل صفحات المواد والسنوات وتفاصيل المنتجات.
   - **الفوتر ([`src/components/Footer.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/Footer.jsx))**:
     - إصلاح رابط الشعار المعطل واستبداله بالأصل المحلي المعتمد (`brand-logo-trimmed.png`).
   - **صفحة الأدوات الدراسية ([`src/pages/StudyToolsPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/StudyToolsPage.jsx))**:
     - إصلاح خطأ النص الإنجليزي للسنة الثانية حيث كان يظهر بالعربية (`السنة الثانية`) في الوضع الإنجليزي بدلاً من (`2nd Year`).
   - **صفحة تتبع الطلبات ([`src/pages/OrderTracking.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/OrderTracking.jsx))**:
     - إصلاح خطأ تكرار خاصية `className` مرتين في عنصر `<form>` (`className="card"` و`className="tracking-form-row"`) مما كان يلغي تنسيق البطاقة في JSX، ودمجهما في `className="card tracking-form-row"`.
   - **صفحة التبرعات ([`src/pages/DonationsPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/DonationsPage.jsx))**:
     - إزالة كود `:hover` غير الصالح برمجياً داخل خاصية `style` المضمنة في React والاعتماد على نظام الـ Hover الدلالي في CSS.

2. **الترقية البصرية الشاملة وإلغاء المظهر العشوائي (UI/UX & Anti-AI-Slop Elevation):**
   - **توحيد الأيقونات (Lucide Icons)**: استبدال جميع رموز الـ Emoji العشوائية (`🏠`, `📖`, `📚`, `🛒`, `❤️`, `📦`, `🧰`, `💬`, `🎁`, `💡`, `⚠️`, `🎨`, `📐`, `🚚`, `📥`, `🗃️`, `⏳`) بأيقونات خطية موحدة من مكتبة `lucide-react` في كل من: `Navbar.jsx`, `ProductCard.jsx`, `ProductDetails.jsx`, `AccessoriesPage.jsx`, و`Footer.jsx`.
   - **نظام التصميم v4.0 ([`src/index.css`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/index.css) و [`index.html`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/index.html))**:
     - تضمين خطوط **`IBM Plex Sans Arabic`** و **`Cairo`** و **`Inter`** لتحقيق توازن بصري مثالي بين العربية والإنجليزية.
     - تطبيق تقنية **Double-Border Elevation** (`inset 0 1px 0 rgba(255,255,255,0.85)`) والزوايا المتدرجة المدروسة (`4px` / `6px` / `10px` / `14px` / `18px`).
     - استبدال تدرج التحميل البنفسجي القديم (`.skeleton`) بتدرج عاجي/رملي دافئ متناسق مع هوية المتجر.
     - إضافة خاصية `font-variant-numeric: tabular-nums` (`.tabular-nums`) لكافة الأسعار، الخصومات، العدادات، والكميات.
     - دعم التفاعل اللمسي السلس (`cubic-bezier(0.16, 1, 0.3, 1)` و `button:active { transform: scale(0.98) }`) ودوران الأسهم التلقائي في الوضع العربي (`RTL`).
   - **تنظيف الكود (Clean CSS Architecture)**:
     - نقل الأنماط المضمنة المتكررة ومعالجات `onMouseEnter`/`onMouseLeave` اليدوية في `ProductCard.jsx`, `Navbar.jsx`, `Footer.jsx`, `BottomNav.jsx`, و`FloatingCart.jsx` إلى كلاسات CSS دلالية نظيفة داخل `src/index.css`.

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`index.html`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/index.html) | إضافة روابط Google Fonts لخطوط `IBM Plex Sans Arabic` و `Cairo` و `Inter` |
| [`src/index.css`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/index.css) | ترقية نظام التصميم إلى v4.0، إضافة كلاسات دلالية للمكونات، تحسين الـ Skeleton، وضبط RTL والـ Tabular Nums |
| [`src/components/Navbar.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/Navbar.jsx) | استبدال الإيموجي بأيقونات Lucide، إصلاح القائمة الجانبية والمنسدلة في RTL، وإضافة اللغة والمفضلة للـ Light Navbar |
| [`src/components/ProductCard.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/ProductCard.jsx) | تنظيف الأنماط المضمنة إلى كلاسات CSS، استبدال الإيموجي بأيقونات Lucide، وتفعيل `tabular-nums` و `decoding="async"` |
| [`src/components/BottomNav.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/BottomNav.jsx) | استخدام الخصائص المنطقية `insetInline` والحدود المزدوجة وتنسيق العداد |
| [`src/components/Footer.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/Footer.jsx) | إصلاح شعار الفوتر المحلي، استبدال إيموجي الشحن بأيقونة `Truck`، وتحويل الأزرار إلى كلاسات CSS |
| [`src/components/FloatingCart.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/FloatingCart.jsx) | تحويل الزر العائم إلى كلاس `.floating-cart-pill` مع خصائص منطقية و `tabular-nums` |
| [`src/pages/StudyToolsPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/StudyToolsPage.jsx) | إصلاح العنوان الإنجليزي للسنة الثانية (`2nd Year`) |
| [`src/pages/ProductDetails.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/ProductDetails.jsx) | استبدال الإيموجي بأيقونات Lucide، تطبيق الخصائص المنطقية `insetInline`، وتفعيل `tabular-nums` |
| [`src/pages/AccessoriesPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/AccessoriesPage.jsx) | استبدال إيموجي أزرار العرض وحالة التوفر بأيقونات Lucide وتفعيل `tabular-nums` |
| [`src/pages/OrderTracking.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/OrderTracking.jsx) | إصلاح تكرار `className` في نموذج تتبع الطلب |
| [`src/pages/DonationsPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/DonationsPage.jsx) | إزالة مفتاح `:hover` غير الصالح من `style` المضمنة |

---

## 3. ما تم إنجازه ويعمل بنجاح
- [x] **سلامة البيانات والأسعار 100%**: لم يتم المساس بأي سعر أو عملة أو منتج أو مادة دراسية أو علاقة في قاعدة البيانات أو الملفات المحلية.
- [x] **خلو البناء من الأخطاء**: تم اختبار `npm run build` بنجاح تام (`✓ built in 7.77s`) بدون أي أخطاء برمجية.
- [x] **توافق كامل مع RTL / LTR**: جميع القوائم والبطاقات والأزرار تعمل بانسيابية على الجوال والتابلت وسطح المكتب.

---

## 4. الخطوة القادمة المطلوبة (Immediate Next Step)
- متابعة أي طلبات إضافية من المستخدم لإضافة منتجات جديدة أو تحديثات مستقبلية في المتجر.
