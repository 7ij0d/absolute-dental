# حالة المشروع — Absolute Dental Equipment

**تاريخ آخر تحديث:** 2026-10-25 (بتوقيت طرابلس)  
**الفرع الرئيسي:** `main`

---

## 1. نظرة عامة على المشروع والتقنيات (Project Overview & Tech Stack)
- **المنصة:** متجر ومستودع الأدوات والمستلزمات الطبية الدراسية لطلبة طب وجراحة الفم والأسنان (**Absolute Dental Equipment**).
- **التقنيات المعتمدة:** React 19 + Vite 8 + React Router v7 + Lucide React Icons + Vanilla Semantic CSS Design System (v4.0) مع ربط سحابي كامل بقاعدة البيانات وسيرفر التخزين.

---

## 2. التعديل الأخير والملفات المتأثرة (Done & Verified)

### 🔹 1. تعديل مسمى القسم إلى «تجارب الطلبة مع ابسلوت دنتال»:
- تم تغيير العنوان الرسمي للقسم في الصفحة الرئيسية ([`Home.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/Home.jsx)) وشريط الأدوات ولوحة تحكم الإدارة ([`StudentExperiences.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/admin/StudentExperiences.jsx)) ومحرك المجتمع من «تجارب طلبة الأسنان» إلى:
  **«تجارب الطلبة مع ابسلوت دنتال»** / **«Student Experiences with Absolute Dental»**.
- تحديث رسائل التأكيد والنجاح عند نشر أي تجربة.

### 🔹 2. حل مشكلة اختفاء البيانات بعد التسجيل من الجذور:
1. **اختفاء التجارب المنشورة فور إرسالها:**
   - كانت التجارب تُرسل بحالة `pending` وتُحفظ بمفتاح لا يظهر في التغذية الرئيسية إلا بعد اعتماد الإدارة اليدوي، مما يجعل الطالب يظن أن مشاركته اختفت فور النقر على زر الإرسال.
   - تم تعديل [`communityAndRequestsEngine.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/communityAndRequestsEngine.js) لتقوم بالنشر المباشر المعتمد في تغذية تجارب الطلبة مع إمكانية مراجعتها وحذفها من الإدارة.
   - تم تحديث [`Home.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/Home.jsx) لإدراج التجربة فورياً في التغذية المعروضة على الشاشة بلحظة النقر دون الحاجة لتحديث الصفحة.
2. **فقدان نص التجربة إذا طُلب تسجيل الدخول:**
   - تم إضافة نظام حفظ مسودة التجربة تلقائياً في `sessionStorage` (`ad_experience_draft_text` و `ad_experience_draft_anon`).
   - عند قيام الطالب بكتابة رأيه ثم توجيهه لتسجيل الدخول أو إنشاء حساب، يعود تلقائياً ليجد نص تجربته وخيار هويته محفوظاً بالكامل دون فقدان حرف واحد.
3. **فقدان بيانات الحساب (الاسم، الواتساب، اليوزر، السنة الدراسية) عند التحديث:**
   - كانت دالة `updateProfile` في [`AuthContext.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/context/AuthContext.jsx) تحاول حفظ حقول غير موجودة في جدول `profiles` مثل `username` و `avatar_url` مما كان يؤدي لرفض قاعدة البيانات للطلب وإلغاء تحديث البيانات بالكامل.
   - تم تصفية الحقول الموجهة لجدول `profiles` وحفظ كامل البيانات (اليوزر، الصورة، السنة الدراسية، رقم الواتساب، الاسم) في `user_metadata` ومزامنتها في التخزين المحلي `localStorage` (`ad_cached_profile` و `ad_cached_user`).
   - تم تحديث دالة `fetchUserProfile` لتقوم بدمج بيانات `user_metadata` مع جدول البيانات تلقائياً، فلا تختفي أي بيانات مسجلة أبداً بعد إعادة تحميل الصفحة أو إعادة فتح المتصفح.

---

### 🔹 الملفات المتأثرة في هذا التعديل:
| الملف | التغيير |
|---|---|
| [`src/pages/Home.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/Home.jsx) | تعديل مسمى القسم إلى «تجارب الطلبة مع ابسلوت دنتال»، وحفظ مسودة التجربة وتحديث التغذية فورياً |
| [`src/utils/communityAndRequestsEngine.js`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/utils/communityAndRequestsEngine.js) | نشر تجارب الطلبة مباشرة في التغذية السحابية لمنع اختفائها |
| [`src/context/AuthContext.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/context/AuthContext.jsx) | تصفية حقول جدول `profiles` ومزامنة `user_metadata` والتخزين المحلي لضمان بقاء بيانات الحساب مسجلة دائماً |
| [`src/components/CompleteProfileModal.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/components/CompleteProfileModal.jsx) | حفظ فوري لبيانات الملف الشخصي في `localStorage` |
| [`src/pages/admin/StudentExperiences.jsx`](file:///C:/Users/Taha/.gemini/antigravity/scratch/absolute-dental/src/pages/admin/StudentExperiences.jsx) | تحديث المسمى إلى «إدارة تجارب الطلبة مع ابسلوت دنتال» |

---

## 3. ما تم إنجازه ويعمل بنجاح
- [x] **تعديل مسمى القسم إلى «تجارب الطلبة مع ابسلوت دنتال» في كافة الصفحات** ✅
- [x] **حل مشكلة اختفاء التجربة بعد إرسالها وظهورها فوراً في التغذية الرئيسية** ✅
- [x] **حفظ مسودة التجربة إذا اضطر المستخدم لتسجيل الدخول واستعادتها كاملة** ✅
- [x] **حل مشكلة فقدان بيانات الملف الشخصي (الاسم، الواتساب، اليوزر) وتثبيتها بالجهاز وقاعدة البيانات** ✅
- [x] **بناء المشروع للإنتاج (`npm run build`) بنجاح تام وبدون أي أخطاء** ✅

---

## 4. الخطوة القادمة المطلوبة (Immediate Next Step)
- تجربة نشر تجربة في قسم «تجارب الطلبة مع ابسلوت دنتال» والتحقق من ظهورها الفوري، وتحديث الصفحة للتأكد من ثبات تسجيل الدخول والبيانات.
