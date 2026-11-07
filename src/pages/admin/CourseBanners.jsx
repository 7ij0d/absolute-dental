import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../supabaseClient';
import {
  ACADEMIC_YEARS_LIST,
  mergeCoursesWithDb,
  uploadCourseBannerImage,
  invalidateCourseBannersCache,
  sanitizeCourseBannerUrl
} from '../../utils/courseBannersEngine';
import {
  Edit,
  X,
  Upload,
  Eye,
  RotateCcw,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  Layers
} from 'lucide-react';

export const CourseBanners = () => {
  const { isRtl } = useLanguage();

  const [years, setYears] = useState(ACADEMIC_YEARS_LIST);
  const [courses, setCourses] = useState(() => {
    try {
      const cached = localStorage.getItem('abs_admin_cached_subjects');
      const overrides = JSON.parse(localStorage.getItem('ad_course_banners_config') || '{}');
      if (cached) {
        return mergeCoursesWithDb(JSON.parse(cached), overrides);
      }
    } catch (_) {}
    return mergeCoursesWithDb([], {});
  });

  const [loading, setLoading] = useState(false);
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Edit Banner Modal State
  const [editingCourse, setEditingCourse] = useState(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLivePreviewBox, setShowLivePreviewBox] = useState(true);

  // Standalone Full Preview Modal State
  const [previewCourse, setPreviewCourse] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 4000);
  };

  const fetchCoursesData = async () => {
    setLoading(true);
    try {
      const [{ data: yrsData }, { data: subsData }, { data: settingsData }] = await Promise.all([
        supabase.from('years').select('*').order('sort_order', { ascending: true }),
        supabase.from('subjects').select('*').order('sort_order', { ascending: true }),
        supabase.from('settings').select('value').eq('key', 'course_banners_config').maybeSingle()
      ]);

      if (Array.isArray(yrsData) && yrsData.length > 0) {
        setYears(yrsData);
      }

      const overridesMap = settingsData?.value || {};
      try {
        localStorage.setItem('ad_course_banners_config', JSON.stringify(overridesMap));
      } catch (_) {}

      const merged = mergeCoursesWithDb(subsData || [], overridesMap);
      setCourses(merged);
      invalidateCourseBannersCache(merged);
    } catch (err) {
      console.error('Error loading course banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesData();
  }, []);

  // Open Edit Banner Modal for a specific course
  const openEditBannerModal = (course) => {
    setEditingCourse(course);
    setFormNameAr(course.name_ar || '');
    setFormNameEn(course.name_en || '');
    setFormDescAr(course.description_ar || '');
    setFormDescEn(course.description_en || '');
    setFormSortOrder(Number(course.sort_order) || 1);
    setFormImageUrl(sanitizeCourseBannerUrl(course.image_url) || '');
    setShowLivePreviewBox(true);
  };

  // Handle uploading a new banner image from Phone / iPad / Computer
  const handleBannerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingCourse) return;

    setUploadingImg(true);
    try {
      const uploadedUrl = await uploadCourseBannerImage(file, editingCourse.slug);
      setFormImageUrl(uploadedUrl);
      showToast('تم ضغط ورفع الصورة بنجاح! يمكنك معاينة البانر الآن قبل الحفظ.');
    } catch (err) {
      console.error('Banner upload failed:', err);
      alert('تعذر رفع الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  // Persist a single course update to Supabase `subjects` AND `settings` backup
  const persistSingleCourseChanges = async (targetCourse, updates) => {
    const cleanImageUrl = sanitizeCourseBannerUrl(updates.image_url);
    const dbPayload = {
      name_ar: (updates.name_ar || targetCourse.name_ar || '').trim(),
      name_en: (updates.name_en || targetCourse.name_en || '').trim(),
      description_ar: (updates.description_ar !== undefined ? updates.description_ar : (targetCourse.description_ar || '')).trim(),
      description_en: (updates.description_en !== undefined ? updates.description_en : (targetCourse.description_en || '')).trim(),
      sort_order: Number(updates.sort_order ?? targetCourse.sort_order ?? 1),
      image_url: cleanImageUrl
    };

    // 1. Update or Upsert the specific row in `subjects` table by its unique ID
    const { data: updatedRows, error: updateErr } = await supabase
      .from('subjects')
      .update(dbPayload)
      .eq('id', targetCourse.id)
      .select();

    if (updateErr || !updatedRows || updatedRows.length === 0) {
      // If row wasn't present by ID yet, upsert full subject record
      await supabase.from('subjects').upsert({
        id: targetCourse.id,
        year_id: targetCourse.year_id,
        slug: targetCourse.slug,
        ...dbPayload
      });
    }

    // 2. Also save to `settings` (`course_banners_config`) keyed by course ID & slug for 100% persistence
    try {
      const rawExisting = localStorage.getItem('ad_course_banners_config');
      const currentMap = rawExisting ? JSON.parse(rawExisting) : {};
      const entryData = {
        id: targetCourse.id,
        slug: targetCourse.slug,
        year_id: targetCourse.year_id,
        ...dbPayload,
        updated_at: new Date().toISOString()
      };
      const nextMap = {
        ...currentMap,
        [targetCourse.id]: entryData,
        [targetCourse.slug]: entryData
      };
      localStorage.setItem('ad_course_banners_config', JSON.stringify(nextMap));
      await supabase.from('settings').upsert({
        key: 'course_banners_config',
        value: nextMap
      });
    } catch (settingsErr) {
      console.warn('Settings backup sync notice:', settingsErr);
    }

    // 3. Optimistically update ONLY this course in state & flush storefront caches
    setCourses((prev) => {
      const next = prev
        .map((item) =>
          item.id === targetCourse.id
            ? {
                ...item,
                ...dbPayload
              }
            : item
        )
        .sort((a, b) => {
          if (a.year_id !== b.year_id) return String(a.year_id).localeCompare(String(b.year_id));
          return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        });
      invalidateCourseBannersCache(next);
      return next;
    });
  };

  // Save handler inside Edit Banner Modal
  const handleSaveCourseModal = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!formNameAr.trim() || !formNameEn.trim()) {
      alert('يرجى إدخال اسم المادة بالعربية والإنجليزية.');
      return;
    }

    setSaving(true);
    try {
      await persistSingleCourseChanges(editingCourse, {
        name_ar: formNameAr,
        name_en: formNameEn,
        description_ar: formDescAr,
        description_en: formDescEn,
        sort_order: formSortOrder,
        image_url: formImageUrl
      });
      showToast(`تم حفظ بانر وبيانات مادة «${formNameEn}» بنجاح وتحديث واجهة الطلاب!`);
      setEditingCourse(null);
    } catch (err) {
      console.error('Failed saving course banner:', err);
      alert('حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Reset to Default Banner directly from card or modal
  const handleQuickResetDefault = async (course) => {
    if (!window.confirm(`هل تريد استعادة صورة البانر الافتراضية لمادة «${course.name_ar} (${course.name_en})» فقط؟`)) {
      return;
    }
    try {
      await persistSingleCourseChanges(course, {
        ...course,
        image_url: null
      });
      showToast(`تمت استعادة البانر الافتراضي لمادة «${course.name_en}» بنجاح.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Move course up or down within its Academic Year
  const handleMoveCourseOrder = async (course, direction) => {
    const yearCourses = courses
      .filter((c) => c.year_id === course.year_id)
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

    const currentIndex = yearCourses.findIndex((c) => c.id === course.id);
    if (currentIndex < 0) return;
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= yearCourses.length) return;

    // Assign clean sequential sort_order numbers (1, 2, 3...) to the year's courses
    const reordered = [...yearCourses];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[swapIndex];
    reordered[swapIndex] = temp;

    const updatedYearCourses = reordered.map((c, idx) => ({
      ...c,
      sort_order: idx + 1
    }));

    // Optimistic UI update immediately
    setCourses((prev) => {
      const next = prev
        .map((item) => {
          const found = updatedYearCourses.find((u) => u.id === item.id);
          return found ? found : item;
        })
        .sort((a, b) => {
          if (a.year_id !== b.year_id) return String(a.year_id).localeCompare(String(b.year_id));
          return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        });
      invalidateCourseBannersCache(next);
      return next;
    });

    // Persist swapped items to DB
    try {
      await Promise.all([
        persistSingleCourseChanges(updatedYearCourses[currentIndex], updatedYearCourses[currentIndex]),
        persistSingleCourseChanges(updatedYearCourses[swapIndex], updatedYearCourses[swapIndex])
      ]);
      showToast(`تم تحديث ترتيب المواد في ${getYearNameAr(course.year_id)} بنجاح!`);
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  const getYearNameAr = (yId) => {
    const found = years.find((y) => y.id === yId) || ACADEMIC_YEARS_LIST.find((y) => y.id === yId);
    return found ? found.name_ar : 'السنة الدراسية';
  };

  const getYearNameEn = (yId) => {
    const found = years.find((y) => y.id === yId) || ACADEMIC_YEARS_LIST.find((y) => y.id === yId);
    return found ? found.name_en : 'Academic Year';
  };

  // Group courses by Academic Year (Years 1, 2, 3, and 4 if any courses exist)
  const visibleYears = ACADEMIC_YEARS_LIST.filter((yr) => {
    if (selectedYearFilter !== 'all' && yr.id !== selectedYearFilter && yr.slug !== selectedYearFilter) {
      return false;
    }
    return courses.some((c) => c.year_id === yr.id);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--surface-color)',
          padding: '1.35rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.7rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(104, 72, 53, 0.1)',
                color: '#684835',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              <Sparkles size={13} />
              Manage Course Banners
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
            إدارة بانرات المواد الدراسية (Manage Course Banners)
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
            تحكم كامل ومستقل في صورة البانر، الاسم العربي والإنجليزي، وترتيب الظهور لكل مادة دراسية على حدة دون التأثير على أي مادة أخرى.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/banners"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', gap: '0.4rem' }}
          >
            <Layers size={15} />
            <span>بانرات الصفحة الرئيسية والأقسام</span>
          </Link>
          <Link
            to="/study-tools"
            target="_blank"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', gap: '0.4rem' }}
          >
            <ExternalLink size={15} />
            <span>معاينة واجهة الطلاب</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            padding: '0.9rem 1.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#065f46',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem'
          }}
        >
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Year Filter Pills */}
      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setSelectedYearFilter('all')}
          style={{
            padding: '0.5rem 1.1rem',
            borderRadius: '999px',
            border: selectedYearFilter === 'all' ? '2px solid #684835' : '1px solid var(--border-color)',
            backgroundColor: selectedYearFilter === 'all' ? '#684835' : 'var(--surface-color)',
            color: selectedYearFilter === 'all' ? '#ffffff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.83rem',
            cursor: 'pointer'
          }}
        >
          جميع السنوات الدراسية ({courses.length} مادة)
        </button>

        {ACADEMIC_YEARS_LIST.slice(0, 3).map((yr) => {
          const count = courses.filter((c) => c.year_id === yr.id).length;
          const isSelected = selectedYearFilter === yr.id;
          return (
            <button
              key={yr.id}
              type="button"
              onClick={() => setSelectedYearFilter(yr.id)}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '999px',
                border: isSelected ? '2px solid #684835' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? '#684835' : 'var(--surface-color)',
                color: isSelected ? '#ffffff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.83rem',
                cursor: 'pointer'
              }}
            >
              {yr.name_ar} — {yr.name_en} ({count})
            </button>
          );
        })}
      </div>

      {/* Courses Grouped by Academic Year */}
      {loading && courses.length === 0 ? (
        <div className="skeleton" style={{ height: '260px', borderRadius: '16px' }} />
      ) : (
        visibleYears.map((yr) => {
          const yearCourses = courses
            .filter((c) => c.year_id === yr.id)
            .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

          return (
            <section
              key={yr.id}
              className="card"
              style={{
                padding: '1.35rem',
                backgroundColor: 'var(--surface-color)',
                borderRadius: '18px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem'
              }}
            >
              {/* Year Section Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: '2px solid var(--border-color)',
                  paddingBottom: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: '#F3ECE2',
                      color: '#684835',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900
                    }}
                  >
                    <BookOpen size={19} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
                      {yr.name_ar} ({yr.name_en})
                    </h2>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {yearCourses.length} مواد دراسية — كل مادة لها بانر مستقل تماماً
                    </span>
                  </div>
                </div>

                <Link
                  to={`/year/${yr.slug}`}
                  target="_blank"
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.76rem', gap: '0.35rem' }}
                >
                  <ExternalLink size={13} />
                  <span>فتح صفحة {yr.name_ar}</span>
                </Link>
              </div>

              {/* Course Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: '1.1rem'
                }}
              >
                {yearCourses.map((course, idx) => {
                  const hasCustomBanner = Boolean(sanitizeCourseBannerUrl(course.image_url));
                  const displayBannerImg =
                    sanitizeCourseBannerUrl(course.image_url) ||
                    course.default_png ||
                    course.default_webp;

                  return (
                    <div
                      key={course.id}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: '#FFFDF9',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 10px rgba(36, 23, 15, 0.04)'
                      }}
                    >
                      {/* Top Mini Replica of Student Year Card Banner */}
                      <div
                        style={{
                          position: 'relative',
                          height: '138px',
                          background: 'linear-gradient(135deg, #FBF7F0 0%, #F2E8DC 100%)',
                          borderBottom: '1px solid rgba(138, 108, 82, 0.16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.15rem',
                          overflow: 'hidden',
                          direction: 'ltr'
                        }}
                      >
                        {/* Left Titles (Matches YearPage layout) */}
                        <div style={{ zIndex: 2, maxWidth: '56%', textAlign: 'left' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              marginBottom: '0.35rem',
                              backgroundColor: hasCustomBanner ? 'rgba(16, 185, 129, 0.16)' : 'rgba(104, 72, 53, 0.12)',
                              color: hasCustomBanner ? '#047857' : '#684835'
                            }}
                          >
                            {hasCustomBanner ? '✓ بانر مخصص' : 'بانر افتراضي'}
                          </span>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#5A3E2B', lineHeight: 1.25 }}>
                            {course.name_ar}
                          </div>
                          <div style={{ fontSize: '1.02rem', fontWeight: 900, color: '#2B1B12', lineHeight: 1.2, marginTop: '2px' }}>
                            {course.name_en}
                          </div>
                        </div>

                        {/* Right Banner Artwork */}
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '52%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            pointerEvents: 'none'
                          }}
                        >
                          <img
                            src={displayBannerImg}
                            alt={course.name_en}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center right'
                            }}
                          />
                        </div>
                      </div>

                      {/* Course Info & Actions Footer */}
                      <div style={{ padding: '0.95rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              {yr.name_ar} • الترتيب: #{course.sort_order ?? idx + 1}
                            </div>
                            <code
                              style={{
                                fontSize: '0.68rem',
                                color: '#7A6556',
                                backgroundColor: '#F4EFE8',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              /subject/{course.slug}
                            </code>
                          </div>

                          {/* Up / Down Order Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={() => handleMoveCourseOrder(course, 'up')}
                              disabled={idx === 0}
                              title="تحريك لأعلى"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: idx === 0 ? '#f8fafc' : '#ffffff',
                                opacity: idx === 0 ? 0.35 : 1,
                                cursor: idx === 0 ? 'default' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCourseOrder(course, 'down')}
                              disabled={idx === yearCourses.length - 1}
                              title="تحريك لأسفل"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: idx === yearCourses.length - 1 ? '#f8fafc' : '#ffffff',
                                opacity: idx === yearCourses.length - 1 ? 0.35 : 1,
                                cursor: idx === yearCourses.length - 1 ? 'default' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => openEditBannerModal(course)}
                            className="btn btn-secondary"
                            style={{
                              flex: 1,
                              padding: '0.55rem 0.85rem',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              gap: '0.4rem',
                              justifyContent: 'center'
                            }}
                          >
                            <Edit size={14} />
                            <span>Edit Banner / تعديل البانر</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewCourse(course)}
                            className="btn btn-outline"
                            title="معاينة البانر في واجهة الطلاب"
                            style={{
                              padding: '0.55rem 0.7rem',
                              fontSize: '0.78rem',
                              gap: '0.3rem'
                            }}
                          >
                            <Eye size={14} />
                            <span>معاينة</span>
                          </button>

                          {hasCustomBanner && (
                            <button
                              type="button"
                              onClick={() => handleQuickResetDefault(course)}
                              className="btn btn-outline"
                              title="إرجاع الصورة الافتراضية"
                              style={{
                                padding: '0.55rem 0.65rem',
                                fontSize: '0.75rem',
                                color: 'var(--danger)',
                                borderColor: 'rgba(239, 68, 68, 0.35)'
                              }}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 1: EDIT COURSE BANNER & DETAILS (WITH LIVE PREVIEW)
         ═══════════════════════════════════════════════════════════════════ */}
      {editingCourse &&
        createPortal(
          <div
            onClick={() => !saving && setEditingCourse(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="card animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '92vh',
                overflowY: 'auto',
                backgroundColor: 'var(--surface-color)',
                padding: '1.6rem',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                boxShadow: 'var(--shadow-lg)',
                direction: isRtl ? 'rtl' : 'ltr'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.85rem'
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: '#684835',
                      backgroundColor: '#F3ECE2',
                      padding: '2px 9px',
                      borderRadius: '999px'
                    }}
                  >
                    {getYearNameAr(editingCourse.year_id)} — {getYearNameEn(editingCourse.year_id)}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0.35rem 0 0 0', color: 'var(--primary)' }}>
                    تعديل بانر وبيانات مادة: {editingCourse.name_en}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="action-btn"
                  aria-label="Close"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Isolation Guarantee Notice */}
              <div
                style={{
                  padding: '0.65rem 0.95rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(14, 116, 144, 0.08)',
                  border: '1px solid rgba(14, 116, 144, 0.22)',
                  color: '#0e7490',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                🔒 هذا البانر مرتبط حصرياً بمادة «{editingCourse.name_en}» (المعرّف: <code>{editingCourse.slug}</code>) ولن يؤثر على أي مادة أخرى.
              </div>

              <form onSubmit={handleSaveCourseModal} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Names & Sort Order */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">اسم المادة بالعربية *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formNameAr}
                      onChange={(e) => setFormNameAr(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">اسم المادة بالإنجليزية (Course Name) *</label>
                    <input
                      type="text"
                      className="form-input"
                      dir="ltr"
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ترتيب المادة داخل السنة الدراسية</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className="form-input"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(e.target.value)}
                    />
                  </div>
                </div>

                {/* Banner Upload & Controls */}
                <div
                  style={{
                    padding: '1.1rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--accent)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 800 }}>
                      صورة البانر الخاصة بالمادة (Course Banner Image)
                    </label>

                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {/* Upload from Phone / PC Button */}
                      <label
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem 0.95rem',
                          fontSize: '0.8rem',
                          cursor: uploadingImg ? 'wait' : 'pointer',
                          margin: 0,
                          gap: '0.4rem',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Upload size={15} />
                        <span>
                          {uploadingImg
                            ? 'جاري ضغط ورفع الصورة...'
                            : formImageUrl
                              ? 'استبدال الصورة بأخرى جديدة'
                              : 'رفع صورة جديدة (هاتف / كمبيوتر)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          disabled={uploadingImg}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {/* Preview Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowLivePreviewBox((prev) => !prev)}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.78rem', gap: '0.35rem' }}
                      >
                        <Eye size={14} />
                        <span>{showLivePreviewBox ? 'إخفاء المعاينة' : 'معاينة البانر'}</span>
                      </button>

                      {/* Reset to Default Image Button */}
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="btn btn-outline"
                          style={{
                            padding: '0.5rem 0.8rem',
                            fontSize: '0.78rem',
                            gap: '0.35rem',
                            color: 'var(--danger)',
                            borderColor: 'rgba(239, 68, 68, 0.4)'
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>إعادة الصورة الافتراضية</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Direct Image URL Input */}
                  <input
                    type="text"
                    className="form-input"
                    dir="ltr"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="أو الصق رابط مباشر للصورة (اتركه فارغاً لاستخدام الصورة الافتراضية للمادة)..."
                    style={{ fontSize: '0.8rem' }}
                  />

                  {/* Live Student-Facing Preview Box */}
                  {showLivePreviewBox && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#684835' }}>
                          👁️ معاينة حية لشكل بطاقة المادة في واجهة الطلاب ({getYearNameAr(editingCourse.year_id)}):
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {formImageUrl ? 'بانر مخصص جديد' : 'البانر الافتراضي للمادة'}
                        </span>
                      </div>

                      {/* Exact Student YearPage Subject Card Preview */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '165px',
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, #FBF7F0 0%, #F2E8DC 100%)',
                          border: '1px solid rgba(138, 108, 82, 0.22)',
                          boxShadow: '0 8px 24px rgba(56, 36, 22, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.35rem 1.6rem',
                          overflow: 'hidden',
                          direction: 'ltr'
                        }}
                      >
                        <div
                          style={{
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '100%',
                            maxWidth: '55%',
                            textAlign: 'left'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#5A3E2B', marginBottom: '2px' }}>
                              {formNameAr || editingCourse.name_ar}
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2B1B12', lineHeight: 1.18 }}>
                              {formNameEn || editingCourse.name_en}
                            </div>
                          </div>

                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: '#5A3E2B',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ArrowRight size={18} strokeWidth={2.5} />
                          </div>
                        </div>

                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '54%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <img
                            src={formImageUrl || editingCourse.default_png || editingCourse.default_webp}
                            alt="Course Banner Preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center right'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="btn btn-outline"
                    disabled={saving}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImg}
                    className="btn btn-secondary"
                    style={{ padding: '0.65rem 1.5rem', fontWeight: 800, gap: '0.4rem' }}
                  >
                    <Check size={16} />
                    <span>{saving ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات مباشرة'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 2: FULL PREVIEW MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {previewCourse &&
        createPortal(
          <div
            onClick={() => setPreviewCourse(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="card animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '620px',
                backgroundColor: 'var(--surface-color)',
                padding: '1.5rem',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
                  معاينة بانر مادة: {previewCourse.name_ar} ({previewCourse.name_en})
                </h3>
                <button type="button" onClick={() => setPreviewCourse(null)} className="action-btn">
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '180px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, #FBF7F0 0%, #F2E8DC 100%)',
                  border: '1px solid rgba(138, 108, 82, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.5rem 1.75rem',
                  overflow: 'hidden',
                  direction: 'ltr'
                }}
              >
                <div
                  style={{
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    maxWidth: '55%',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#5A3E2B' }}>
                      {previewCourse.name_ar}
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2B1B12', lineHeight: 1.2 }}>
                      {previewCourse.name_en}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#5A3E2B',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '54%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}
                >
                  <img
                    src={
                      sanitizeCourseBannerUrl(previewCourse.image_url) ||
                      previewCourse.default_png ||
                      previewCourse.default_webp
                    }
                    alt={previewCourse.name_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center right' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                  to={`/subject/${previewCourse.slug}`}
                  target="_blank"
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', gap: '0.35rem' }}
                >
                  <ExternalLink size={14} />
                  <span>فتح صفحة المادة في الموقع</span>
                </Link>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewCourse;
                      setPreviewCourse(null);
                      openEditBannerModal(target);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', gap: '0.35rem' }}
                  >
                    <Edit size={14} />
                    <span>تعديل هذا البانر</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CourseBanners;
