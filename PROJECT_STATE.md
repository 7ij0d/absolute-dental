# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-25 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. استبدال صورة قسم طلب توفير المنتج بالصورة المرجعية الرسمية عالية الدقة:
- **استبدال الأصول الأصلية بأعلى جودة:**
  - تم استبدال `src/assets/images/product-request-faded.png` و `src/assets/images/product-request-faded.webp` بالصورة المرجعية الأصلية (`1024x384`) دون أي ضغط مخل أو تشويه.
  - إبراز العبارة التوضيحية داخل فقاعة المحادثة فوق الصندوق بوضوح تام:
    - «مش متوفر حالياً؟»
    - «نقدرو نوفروهولك..»
  - ظهور الصندوق بشعار Absolute Dental وعلامة الاستفهام (?) وتوربين الأسنان وتفاصيل العمل بوضوح كريستالي.
- **التصميم المتجاوب وتكامل الزر التفاعلي:**
  - تم تحديث حاوية القسم [`src/pages/Home.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/Home.jsx) بحاوية بطاقة تفاعلية `.home-product-request-banner-card` متناسقة مع الهوية البصرية (زوايا مستديرة 20px، وظلال ناعمة).
  - تثبيت زر تفاعلي ناعم ومتجاوب `.home-product-request-overlay-cta` فوق زر «اطلب منتجك الآن» المطبوع على الصورة بمحاذاة دقيقة، يفتح نافذة طلب توفير المنتج (`handleOpenProductRequest`) فوراً.
  - إتاحة النقر على البطاقة لتسهيل اللمس على شاشات الموبايل والتابلت وتفادي أخطاء الضغط الصغيرة.
  - الحفاظ التام على وظيفة نموذج الطلب، رفع الصور، حفظ المسودة التلقائي في `sessionStorage`، والتحقق من رقم الهاتف.
- **الحفاظ التام على باقي عناصر ونصوص الصفحة الرئيسية:**
  - لم يتم تعديل أي نصوص أو بطاقات خارج هذا القسم (أدوات الدراسة، الإكسسوارات، البوكسات، تجارب الطلبة، الفوتر).
- **تحديث الكاش والإنتاج:**
  - ترقية بادئة الكاش إلى `ad15:` لمنع أي كاش متصفح قديم.
  - بناء المشروع للإنتاج (`npm run build`) بنجاح واجتياز كل الاختبارات.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/assets/images/product-request-faded.png`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/assets/images/product-request-faded.png) | استبدال الصورة القديمة بالنسخة المرجعية الرسمية عالية الدقة 1024x384 |
| [`src/assets/images/product-request-faded.webp`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/assets/images/product-request-faded.webp) | إنشاء النسخة الحديثة بصيغة WebP عالية الجودة 100% |
| [`src/pages/Home.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/Home.jsx) | تحديث هيكلية البطاقة لتناسب الصورة الجديدة مع الحفاظ على تفاعلية زر طلب المنتج |
| [`src/index.css`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/index.css) | إضافة ستايلات `.home-product-request-banner-card` والتجاوب للزر والحاوية |
| [`src/cache.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/cache.js) | ترقية بادئة الكاش إلى `ad15:` |

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة تجربة تصفح الصفحة الرئيسية والأقسام من قبل المستخدم والتأكد من ملاءمة كافة تفاصيل العرض.
