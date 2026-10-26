# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-26 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **الدومين الرسمي المخصص:** `absolutedental.ly`
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + High-Res Asset Pipeline + Dynamic Navigation Trail & Browse Context Engine + Bur Grouping & Popup Engine + Sized Products Engine + Boxes & Accessories Gateway Architecture + Student Experiences Engine + Product Availability Requests Engine + Avatar Upload & Compression Engine (Google & Custom).

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. تمكين المستخدمين (التسجيل الجديد أو تسجيل الدخول عبر Google) من تغيير وحفظ صورتهم الشخصية:
- **المتطلبات المنفّذة (Implemented Requirements):**
  1. **تغيير الصورة من بطاقة الملف الشخصي (Hero Card):** تم تزويد دائرة الصورة في أعلى الصفحة بزر تفاعلي مع أيقونة كاميرا منبثقة ومؤشر تحميل يدعم النقر المباشر لاختيار صورة من الجهاز أو الهاتف.
  2. **قسم مخصص لإدارة الصورة الشخصية داخل نموذج الملف الشخصي:** تمت إضافة صندوق تحكم أنيق بتصميم Elevation مزدوج يعرض معاينة الصورة الحالية وزر «تغيير الصورة»، وزر «إزالة الصورة»، بالإضافة إلى زر «استعادة صورة Google» التلقائي عند التسجيل بحساب Google.
  3. **دعم التغيير أثناء إكمال البيانات (Complete Profile Modal):** تمكين الطالب الجديد أو مسجل الدخول عبر Google من النقر على الصورة واختيار صورته المفضلة مباشرة.
  4. **ضغط ورفع فوري مع حفظ السحابة والبيانات الوصفية:** معالجة الصور وضغطها تلقائياً بتقنية `uploadCompressedImage` وحفظ الرابط في بيانات الحساب الوصفية `avatar_url` مع التحديث الفوري للـ Navbar وتجارب الطلاب.
  5. نجاح اختبار البناء الإنتاجي (`npm run build`) بنسبة 100% دون أي أخطاء.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/pages/ProfilePage.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/ProfilePage.jsx) | إضافة آليات رفع وتغيير الصورة الشخصية بالهيرو ونموذج التعديل مع خيارات الاستعادة والإزالة |
| [`src/context/AuthContext.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/context/AuthContext.jsx) | دعم الأسبقية لـ `avatar_url` المخصصة على صورة Google وحفظها في بيانات الحساب والـ Cache |
| [`src/components/CompleteProfileModal.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/CompleteProfileModal.jsx) | تفعيل زر الكاميرا واختيار الصورة مباشرة أثناء نافذة إكمال التسجيل |

---

## 3. الخطوة التالية المباشرة (Immediate Next Step)
- رفع التعديلات عبر `git commit & push` إلى الفرع الرئيسي `main` لتصبح ميزة تغيير الصورة الشخصية حية وفورية لجميع المستخدمين والطلبة على `absolutedental.ly`.
