# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-26 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `absolutedental.ly`
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Student Experiences Engine + Product Availability Requests Engine (Guest & Student).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. إصلاح توجيه وعرض مواد السنة الرابعة لتظهر صفحة «السنة الرابعة — قريباً»:
- **سبب الخلل (Root Cause):**
  - في صفحة [`src/pages/YearPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/YearPage.jsx)، كان التحقق من السنة مبنياً على `isYear3` و `isYear2` و `isYear1 = !isYear3 && !isYear2`.
  - عند الدخول إلى رابط السنة الرابعة `/year/4th-year`، كانت قيم `isYear3` و `isYear2` خطأ (`false`)، وبالتالي اعتُبرت السنة الأولى (`isYear1 = true`) مع `targetSlug = '1st-year'`!
  - كان استدعاء البيانات يجلب مواد السنة الأولى (`YEAR_1_SUBJECTS` — تشريح الأسنان ومواد طب الأسنان) بدلاً من البقاء في حالة "قريباً".
- **التعديلات المنفّذة (Fixes Applied):**
  1. إضافة فحص صريح ومباشر للسنة الرابعة `isYear4 = slug === '4th-year' || slug === '4th' || slug?.startsWith('4')` في [`src/pages/YearPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/YearPage.jsx).
  2. تعيين `targetSlug = isYear4 ? '4th-year' : ...` و `defaultYear = isYear4 ? DEFAULT_YEARS[3] : ...` مع الاحتفاظ بخاصية `is_coming_soon: true`.
  3. حماية حالة الـ Coming Soon بحيث تُعرض بطاقة «السنة الرابعة — قريباً» مباشرة ومنع الاستبدال ببيانات أي سنة أخرى.
  4. تحسين زر الرجوع داخل بطاقة «قريباً» ليوجه الطالب بسلاسة إلى صفحة أدوات الدراسة `/study-tools`.
  5. ربط بطاقة السنة الرابعة في صفحة [`src/pages/StudyToolsPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/StudyToolsPage.jsx) بالمسار `/year/4th-year` لفتح شاشة «قريباً» مباشرة عند النقر عليها.
  6. نجاح اختبار البناء الإنتاجي (`npm run build`) بنسبة 100% دون أي أخطاء.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/pages/YearPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/YearPage.jsx) | إضافة دعم صريح للسنة الرابعة `isYear4` وعرض واجهة «السنة الرابعة — قريباً» بدلاً من جلب مواد السنة الأولى |
| [`src/pages/StudyToolsPage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/StudyToolsPage.jsx) | ربط بطاقة السنة الرابعة بالمسار `/year/4th-year` مع تفعيل الانتقال لصفحة قريباً |

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- مزامنة ورفع الكود عبر `git commit & push` إلى الفرع الرئيسي `main` ليتم نشره فوراً على بيئة الإنتاج للدومين `absolutedental.ly`.
