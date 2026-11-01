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

### 🔹 إعادة تنظيم شاملة لتصنيفات المنتجات وتطهير المستودع (Comprehensive Product Categorization & Inventory Cleanup):

1. **Conservative Dentistry 1 (السنة الثانية):**
   - تم تثبيت منتجات المادة وتأكيد توفر حامل البارات (`Bur Holder` - `50c5fac9-de64-452d-85ac-c6cce3496793`) في هذا القسم فقط على مستوى تخصص العلاج التحفظي.
   - منع ظهور خيط الأسنان (`Dental Floss`) أو المستهلكات العامة غير المخصصة للمادة.

2. **Fixed Prosthodontics 1 (السنة الثانية):**
   - إضافة وإتاحة حامل البارات (`Bur Holder`) في هذا القسم حصرياً مع قسم كونسيرفتف 1 (سنة ثانية)، ومنع ظهوره نهائياً في مواد السنة الثالثة.

3. **Conservative Dentistry 2 (السنة الثالثة):**
   - نقل خيط الأسنان (`Dental Floss` - `33000000-0000-0000-0000-000000000113`) ليكون تابعاً لهذا القسم حصرياً، ومنعه من الظهور في أي قسم آخر.
   - إزالة طقم الفحص (`Examination Kit`) وجاون العزل (`Isolation Gown`) وحامل البارات (`Bur Holder`) من هذا القسم.

4. **Preventive Dentistry (السنة الثالثة):**
   - قصر محتويات القسم حصرياً على: رول التغليف والعزل الواقي الأزرق (`Dental Barrier Wrapping Roll (Blue)` - `33000000-0000-0000-0000-000000000111`).
   - نقل جاون العزل الأزرق (`Isolation Gown`) إلى قسم المستهلكات والإكسسوارات.
   - حذف خيط الأسنان وشاش الجبس والمستهلكات العامة من هذا القسم.

5. **Consumables & Accessories (المستهلكات والإكسسوارات):**
   - تخصيص القسم كقسم مستقل يضم المنتجات الاستهلاكية العامة الثمانية:
     1. Disposable Dental Examination Kit (Sterile) - 2.5 د.ل
     2. Disposable Dental Isolation Gown (Blue) - 3 د.ل
     3. Disposable Face Masks (Blue & Black) - 0.5 د.ل
     4. Disposable Surgical Face Masks (Black) - 0.5 د.ل
     5. Overseas Glove Nitrile Examination Gloves - 1 د.ل
     6. Cover Sheet (Pink) - 0.5 د.ل
     7. Cover Sheet (Blue) - 0.5 د.ل
     8. Medical Alcohol 75% - 5 د.ل
   - حذف باقة الماسك والقفازات (`Mask and Gloves Set` بسعر 1.5 د.ل) نهائياً من قاعدة البيانات وملفات البيانات.
   - الإبقاء على الماسك والقفازات كمنتجين مستقلين مع الحفاظ التام على الأسعار وخيارات المقاسات والألوان.
   - فك ارتباط المستهلكات العامة بصفحات المواد الأكاديمية لمنع التكرار والحشو.

6. **Fixed Prosthodontics 2 (السنة الثالثة):**
   - التأكد من عدم وجود أي مادة ألجينات (`Alginate`) في هذا القسم، وحصر مواد الطبعة فيه على السيليكون وقوالب الطبعة والشفرات الجراحية وحواجز الربر دام.

7. **Removable Prosthodontics 2 (السنة الثالثة):**
   - تثبيت مادة طبعة الألجينات (`Lascod iQ Alginate 450g` - `33000000-0000-0000-0000-000000000107`) في هذا القسم حصرياً دون أي تكرار.

8. **المنتجات الموضوعة في وضع الاستعداد (Standby):**
   - شاش `GM Medical Gauze Roll (500g)` و `Sterile Gauze Swab`: تم إزالتهما من جميع الأقسام الدراسية، مع تعطيل ظهورهما في المتجر والبحث (`is_active: false` و `availability: 'unavailable'`) مع الاحتفاظ الكامل ببياناتهما وصورهما وأسعارهما ومخزونهما في قاعدة البيانات لإعادة تفعيلهما مستقبلاً.

9. **ترقية كاش الواجهات:**
   - ترقية مفتاح كاش المواد إلى `subject_v40` في `SubjectPage.jsx` لتحديث ظهور التوزيع الجديد فوراً على كافة متصفحات الزوار.
   - تحديث مسميات الروابط في `Navbar.jsx` وصفحة البحث والتصنيف `SearchPage.jsx`.

### 📁 الملفات التي تم تعديلها:
- `src/defaultProducts.json`
- `src/pages/SubjectPage.jsx`
- `src/pages/SearchPage.jsx`
- `src/components/Navbar.jsx`
- `src/utils/subjectGroupEngine.js`
- `PROJECT_STATE.md`
- قاعدة بيانات Supabase (جدول `products` وجدول `product_subjects`)

---

## 3. الروابط المباشرة المؤكدة:
- **المستهلكات والإكسسوارات:** `https://absolutedental.ly/#/other-supplies`
- **علاج الأسنان التحفظي 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/restorative-dentistry`
- **صناعة الأسنان الثابتة 1 (سنة ثانية):** `https://absolutedental.ly/#/subject/fixed-prosthodontics`
- **علاج الأسنان التحفظي 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/conservative-dentistry-2`
- **طب الأسنان الوقائي (سنة ثالثة):** `https://absolutedental.ly/#/subject/preventive-dentistry`
- **صناعة الأسنان الثابتة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/fixed-prosthodontics-2`
- **صناعة الأسنان المتحركة 2 (سنة ثالثة):** `https://absolutedental.ly/#/subject/removable-prosthodontics-2`

---

## 4. الخطوة التالية المباشرة (Immediate Next Step)
- تنفيذ `git commit` و `git push` ونشر النسخة المحسنة على الدومين الرسمي `absolutedental.ly`.
