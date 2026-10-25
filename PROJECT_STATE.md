# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-25 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. إصلاح نظام التنقل (Breadcrumb Navigation) بالكامل ليعكس مسار التصفح الفعلي:
- **فصل مسار التنقل عن الهيكلية الثابتة لقاعدة البيانات:**
  - تم بناء محرك تتبع المسار وسياق التصفح في [`src/utils/navigationTrail.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/navigationTrail.js).
  - عند دخول المستخدم من **الرئيسية ← الإكسسوارات ← منتج اللاب كوت**:
    - يظهر مسار التنقل بدقة: `الرئيسية › الإكسسوارات › White FIGS Lab Coat (Local)`.
    - زر الرجوع يعود مباشرة إلى صفحة الإكسسوارات: `العودة إلى الإكسسوارات`.
    - الضغط على رابط «الإكسسوارات» في مسار التنقل يعيد المستخدم مباشرة إلى `/accessories`.
- **دعم التصفح المتداخل الكامل (Nested Browsing Support):**
  - عند الدخول عبر مسار المواد الدراسية: `الرئيسية › أدوات الدراسة › السنة الأولى › تشريح الأسنان › اسم المنتج`:
    - يظهر المسار بالكامل بمستوياته الخمسة.
    - زر الرجوع يعيد إلى المادة الدراسية السابقة `العودة إلى تشريح الأسنان`.
    - كافة الروابط في المسار قابلة للنقر وتوجه إلى المستوى الصحيح.
- **الاحتفاظ بالسياق ومقاومة تحديث الصفحة (Survives Page Refresh):**
  - اعتماد استراتيجية ثلاثية الطبقات: `URL Query Parameters (?from=...)` + `React Router State` + `sessionStorage`.
  - عند تحديث الصفحة بالمتصفح (`F5` أو Refresh)، يظل المسار محفوظاً وزر الرجوع متوافقاً.
  - عند التنقل بين المنتجات المرتبطة (Sibling / Related Products)، يتم توريث سياق التصفح الأصلي دون فقدانه.
- **دعم كافة مسارات الدخول الأخرى في المتجر:**
  - البوكسات: `الرئيسية › البوكسات › اسم المنتج`.
  - مستلزمات أخرى: `الرئيسية › مستلزمات أخرى › اسم المنتج`.
  - العروض والتخفيضات: `الرئيسية › العروض والتخفيضات › اسم المنتج`.
  - البحث: `الرئيسية › البحث › اسم المنتج` (مع الحفاظ على كلمة البحث السابقة).
  - المفضلة: `الرئيسية › المفضلة › اسم المنتج`.
  - السلة: `الرئيسية › سلة المشتريات › اسم المنتج`.
  - الدخول المباشر بالرابط (Direct Link Fallback): يتعرف المحرك بذكاء على طبيعة المنتج (إكسسوار، بوكس، أو مادة دراسية) ويعرض مساراً طبيعياً ومنطقياً دون إجبار المستخدم على أقسام دراسية وهمية.
- **التوافق وترقية الكاش:**
  - متوافق بالكامل مع جميع الشاشات (الهواتف الذكية، الآيباد/التابلت، الحاسوب).
  - تم رفع إصدار الكاش إلى `ad13:` لضمان تفعيل محرك التنقل فوراً لجميع المستخدمين.
  - تم إجراء اختبارات برمجية شاملة لـ 27 سيناريو بنجاح كامل 100%.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/utils/navigationTrail.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/navigationTrail.js) | محرك التنقل الديناميكي وتحديد المسارات الفردية والمتداخلة |
| [`src/pages/ProductDetails.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/ProductDetails.jsx) | استبدال المسار الثابت بمسار تصفح المستخدم الفعلي وتحديث زر الرجوع والتنقل بين المنتجات المرتبطة |
| [`src/components/ProductCard.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/ProductCard.jsx) | تسجيل مسار الدخول الفعلي وتمرير البارامترات والسياق عند النقر على أي بطاقة منتج |
| [`src/pages/AccessoriesPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/AccessoriesPage.jsx) | ربط فتح تفاصيل اللاب كوت بمسار الإكسسوارات الفعلي وتخزين السياق |
| [`src/pages/SubjectPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/SubjectPage.jsx) | تمرير سياق المادة والسنة لبطاقات المنتجات لضمان التسلسل المتداخل |
| [`src/pages/CartPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/CartPage.jsx) | ربط منتجات السلة بمسار سلة المشتريات التفاعلي |
| [`src/cache.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/cache.js) | ترقية بادئة الكاش إلى `ad13:` |

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- متابعة تجربة المستخدم على الموقع واختبار أي مسارات تصفح أو صفحات إضافية حسب التوجيهات.
