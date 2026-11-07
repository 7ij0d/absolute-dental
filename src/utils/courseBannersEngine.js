import supabase from '../supabaseClient';
import { cacheSet, clearSubjectCaches } from '../cache';

// Default Studio Artworks (Faded WebP & PNG)
import dentalAnatomyWebp from '../assets/images/dental-anatomy-faded.webp';
import dentalAnatomyPng from '../assets/images/dental-anatomy-faded.png';
import dentalMaterialsWebp from '../assets/images/dental-materials-faded.webp';
import dentalMaterialsPng from '../assets/images/dental-materials-faded.png';
import fixedProsthoWebp from '../assets/images/fixed-prosthodontics-faded.webp';
import fixedProsthoPng from '../assets/images/fixed-prosthodontics-faded.png';
import removableProsthoWebp from '../assets/images/removable-prosthodontics-faded.webp';
import removableProsthoPng from '../assets/images/removable-prosthodontics-faded.png';
import operativeDentWebp from '../assets/images/operative-dentistry-faded.webp';
import operativeDentPng from '../assets/images/operative-dentistry-faded.png';
import preventiveDentWebp from '../assets/images/preventive-dentistry-faded.webp';
import preventiveDentPng from '../assets/images/preventive-dentistry-faded.png';

export const ACADEMIC_YEARS_LIST = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    slug: '1st-year',
    name_ar: 'السنة الأولى',
    name_en: '1st Year',
    sort_order: 1,
    is_coming_soon: false
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    slug: '2nd-year',
    name_ar: 'السنة الثانية',
    name_en: '2nd Year',
    sort_order: 2,
    is_coming_soon: false
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    slug: '3rd-year',
    name_ar: 'السنة الثالثة',
    name_en: '3rd Year',
    sort_order: 3,
    is_coming_soon: false
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    slug: '4th-year',
    name_ar: 'السنة الرابعة',
    name_en: '4th Year',
    sort_order: 4,
    is_coming_soon: true
  }
];

/**
 * Canonical Subject Definitions with 100% independent IDs & slugs.
 * Every course has its own independent record so updating Fixed Prosthodontics 1
 * NEVER alters Fixed Prosthodontics 2, Conservative 1 vs Conservative 2, etc.
 */
export const CANONICAL_COURSES = [
  // ── 1st Year ──
  {
    id: '11000000-0000-0000-0000-000000000011',
    year_id: '10000000-0000-0000-0000-000000000001',
    year_slug: '1st-year',
    slug: 'dental-anatomy',
    name_ar: 'تشريح الأسنان',
    name_en: 'Dental Anatomy',
    description_ar: 'الأدوات والمواد المطلوبة لمادة تشريح الأسنان',
    description_en: 'Required tools and materials for Dental Anatomy',
    sort_order: 1,
    default_webp: dentalAnatomyWebp,
    default_png: dentalAnatomyPng
  },
  {
    id: '11000000-0000-0000-0000-000000000012',
    year_id: '10000000-0000-0000-0000-000000000001',
    year_slug: '1st-year',
    slug: 'dental-materials',
    name_ar: 'مواد طب الأسنان',
    name_en: 'Dental Materials',
    description_ar: 'الأدوات والمواد المطلوبة لمادة مواد طب الأسنان',
    description_en: 'Required tools and supplies for Dental Materials',
    sort_order: 2,
    default_webp: dentalMaterialsWebp,
    default_png: dentalMaterialsPng
  },

  // ── 2nd Year ──
  {
    id: '22000000-0000-0000-0000-000000000023',
    year_id: '20000000-0000-0000-0000-000000000002',
    year_slug: '2nd-year',
    slug: 'fixed-prosthodontics',
    name_ar: 'صناعة الأسنان الثابتة',
    name_en: 'Fixed Prosthodontics',
    admin_label: 'Fixed Prosthodontics 1 (السنة الثانية)',
    description_ar: 'الأدوات والمواد المطلوبة لمادة صناعة الأسنان الثابتة (سنة ثانية)',
    description_en: 'Required tools and burs for Fixed Prosthodontics 1',
    sort_order: 1,
    default_webp: fixedProsthoWebp,
    default_png: fixedProsthoPng
  },
  {
    id: '22000000-0000-0000-0000-000000000022',
    year_id: '20000000-0000-0000-0000-000000000002',
    year_slug: '2nd-year',
    slug: 'removable-prosthodontics',
    name_ar: 'صناعة الأسنان المتحركة',
    name_en: 'Removable Prosthodontics',
    admin_label: 'Removable Prosthodontics 1 (السنة الثانية)',
    description_ar: 'الأدوات والمواد المطلوبة لمادة صناعة الأسنان المتحركة (سنة ثانية)',
    description_en: 'Required tools and gear for Removable Prosthodontics 1',
    sort_order: 2,
    default_webp: removableProsthoWebp,
    default_png: removableProsthoPng
  },
  {
    id: '22000000-0000-0000-0000-000000000021',
    year_id: '20000000-0000-0000-0000-000000000002',
    year_slug: '2nd-year',
    slug: 'restorative-dentistry',
    alt_slug: 'operative-dentistry',
    name_ar: 'علاج الأسنان التحفظي',
    name_en: 'Operative Dentistry',
    admin_label: 'Conservative / Operative 1 (السنة الثانية)',
    description_ar: 'الأدوات والمواد المطلوبة لمادة علاج الأسنان التحفظي (سنة ثانية)',
    description_en: 'Required tools and instruments for Operative / Conservative 1',
    sort_order: 3,
    default_webp: operativeDentWebp,
    default_png: operativeDentPng
  },

  // ── 3rd Year ──
  {
    id: '33000000-0000-0000-0000-000000000031',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'conservative-dentistry-2',
    name_ar: 'علاج الأسنان التحفظي 2',
    name_en: 'Conservative Dentistry 2',
    admin_label: 'Conservative Dentistry 2 (السنة الثالثة)',
    description_ar: 'الأدوات والمواد المطلوبة لمادة كونسيرفتف 2',
    description_en: 'Required tools and materials for Conservative Dentistry 2',
    sort_order: 1,
    default_webp: operativeDentWebp,
    default_png: operativeDentPng
  },
  {
    id: '33000000-0000-0000-0000-000000000032',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'preventive-dentistry',
    name_ar: 'طب الأسنان الوقائي',
    name_en: 'Preventive Dentistry',
    admin_label: 'Preventive Dentistry (السنة الثالثة)',
    description_ar: 'الأدوات والمستلزمات المطلوبة لمادة بريفنشن',
    description_en: 'Required tools and supplies for Preventive Dentistry',
    sort_order: 2,
    default_webp: preventiveDentWebp,
    default_png: preventiveDentPng
  },
  {
    id: '33000000-0000-0000-0000-000000000033',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'fixed-prosthodontics-2',
    name_ar: 'صناعة الأسنان الثابتة 2',
    name_en: 'Fixed Prosthodontics 2',
    admin_label: 'Fixed Prosthodontics 2 (السنة الثالثة)',
    description_ar: 'الأدوات والمواد المطلوبة لمادة فكسد برستودونتيك 2',
    description_en: 'Required tools and burs for Fixed Prosthodontics 2',
    sort_order: 3,
    default_webp: fixedProsthoWebp,
    default_png: fixedProsthoPng
  },
  {
    id: '33000000-0000-0000-0000-000000000034',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'removable-prosthodontics-2',
    name_ar: 'صناعة الأسنان المتحركة 2',
    name_en: 'Removable Prosthodontics 2',
    admin_label: 'Removable Prosthodontics 2 (السنة الثالثة)',
    description_ar: 'الأدوات والمواد المطلوبة لمادة ريموفبل برستودونتيك 2',
    description_en: 'Required tools and gear for Removable Prosthodontics 2',
    sort_order: 4,
    default_webp: removableProsthoWebp,
    default_png: removableProsthoPng
  },
  {
    id: '33000000-0000-0000-0000-000000000035',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'oral-surgery',
    name_ar: 'جراحة الفم والأسنان',
    name_en: 'Oral Surgery',
    admin_label: 'Oral Surgery (السنة الثالثة)',
    description_ar: 'الأدوات والمستلزمات المطلوبة لمادة جراحة الفم والأسنان',
    description_en: 'Required instruments and clinical supplies for Oral Surgery',
    sort_order: 5,
    default_webp: preventiveDentWebp,
    default_png: preventiveDentPng
  },
  {
    id: '33000000-0000-0000-0000-000000000036',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'periodontology',
    name_ar: 'طب وجراحة اللثة',
    name_en: 'Periodontology',
    admin_label: 'Periodontology (السنة الثالثة)',
    description_ar: 'الأدوات والمستلزمات المطلوبة لمادة طب وجراحة اللثة (البريو)',
    description_en: 'Required instruments and clinical supplies for Periodontology',
    sort_order: 6,
    default_webp: operativeDentWebp,
    default_png: operativeDentPng
  },
  {
    id: '33000000-0000-0000-0000-000000000037',
    year_id: '30000000-0000-0000-0000-000000000003',
    year_slug: '3rd-year',
    slug: 'pediatric-dentistry',
    name_ar: 'طب أسنان الأطفال',
    name_en: 'Pediatric Dentistry',
    admin_label: 'Pediatric Dentistry (السنة الثالثة)',
    description_ar: 'الأدوات والمستلزمات المطلوبة لمادة طب أسنان الأطفال (البيدو)',
    description_en: 'Required instruments and preventive supplies for Pediatric Dentistry',
    sort_order: 7,
    default_webp: preventiveDentWebp,
    default_png: preventiveDentPng
  }
];

/**
 * Filter out legacy June 2026 `/subject-images/` seed URLs so only intentional
 * custom banners uploaded by the admin override the studio default banner.
 */
export function sanitizeCourseBannerUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/subject-images/')) return null;
  return trimmed;
}

/**
 * Find canonical course definition by slug or id.
 * Strictly matches exact slug/id so Fixed 1 never collides with Fixed 2.
 */
export function getCanonicalCourse(slugOrId) {
  if (!slugOrId) return null;
  const needle = String(slugOrId).trim().toLowerCase();
  return (
    CANONICAL_COURSES.find(
      (c) =>
        c.id.toLowerCase() === needle ||
        c.slug.toLowerCase() === needle ||
        (c.alt_slug && c.alt_slug.toLowerCase() === needle)
    ) || null
  );
}

/**
 * Merge live DB `subjects` rows with `CANONICAL_COURSES` so every course has:
 * - Guaranteed independent ID & slug
 * - Custom banner URL (`image_url`) if set by admin, or `null` if using default
 * - Default WebP & PNG fallback images
 * - Accurate Arabic & English titles and sort order
 */
export function mergeCoursesWithDb(dbSubjects = [], overridesMap = {}) {
  const dbList = Array.isArray(dbSubjects) ? dbSubjects : [];
  const merged = [];
  const seenIds = new Set();

  // 1. Merge canonical courses with matching DB rows
  for (const canon of CANONICAL_COURSES) {
    const dbRow = dbList.find(
      (r) =>
        r.id === canon.id ||
        r.slug === canon.slug ||
        (canon.alt_slug && r.slug === canon.alt_slug)
    );
    const override = overridesMap?.[canon.id] || overridesMap?.[canon.slug] || null;

    const id = dbRow?.id || canon.id;
    seenIds.add(id);

    const rawCustomUrl =
      override?.image_url !== undefined
        ? override.image_url
        : dbRow?.image_url;

    merged.push({
      ...canon,
      ...(dbRow || {}),
      id,
      slug: dbRow?.slug || canon.slug,
      year_id: dbRow?.year_id || canon.year_id,
      name_ar: override?.name_ar || dbRow?.name_ar || canon.name_ar,
      name_en: override?.name_en || dbRow?.name_en || canon.name_en,
      description_ar:
        override?.description_ar !== undefined
          ? override.description_ar
          : (dbRow?.description_ar || canon.description_ar),
      description_en:
        override?.description_en !== undefined
          ? override.description_en
          : (dbRow?.description_en || canon.description_en),
      sort_order:
        override?.sort_order !== undefined
          ? Number(override.sort_order)
          : (dbRow?.sort_order !== undefined && dbRow?.sort_order !== null
              ? Number(dbRow.sort_order)
              : canon.sort_order),
      image_url: sanitizeCourseBannerUrl(rawCustomUrl),
      default_webp: canon.default_webp,
      default_png: canon.default_png
    });
  }

  // 2. Include any additional custom subjects added via Admin that aren't in CANONICAL_COURSES
  for (const dbRow of dbList) {
    if (!dbRow?.id || seenIds.has(dbRow.id)) continue;
    const isAlsoMatchedBySlug = merged.some(
      (m) => m.slug === dbRow.slug || (m.alt_slug && m.alt_slug === dbRow.slug)
    );
    if (isAlsoMatchedBySlug) continue;

    const override = overridesMap?.[dbRow.id] || overridesMap?.[dbRow.slug] || null;
    merged.push({
      ...dbRow,
      name_ar: override?.name_ar || dbRow.name_ar || dbRow.slug,
      name_en: override?.name_en || dbRow.name_en || dbRow.slug,
      sort_order:
        override?.sort_order !== undefined
          ? Number(override.sort_order)
          : Number(dbRow.sort_order || 99),
      image_url: sanitizeCourseBannerUrl(
        override?.image_url !== undefined ? override.image_url : dbRow.image_url
      ),
      default_webp: preventiveDentWebp,
      default_png: preventiveDentPng
    });
  }

  // Sort by year, then by sort_order
  return merged.sort((a, b) => {
    if (a.year_id !== b.year_id) {
      return String(a.year_id).localeCompare(String(b.year_id));
    }
    return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
  });
}

/**
 * Automatic client-side image compression + Supabase Storage upload.
 * Supports PNG/WebP transparency and high-speed mobile uploads.
 */
export async function uploadCourseBannerImage(file, courseSlug = 'course') {
  const compressBannerToBlob = (inputFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1100;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Use WebP for optimal size + alpha transparency support; fallback to JPEG/PNG
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                resolve({ blob: webpBlob, mime: 'image/webp', ext: 'webp', dataUrl: canvas.toDataURL('image/webp', 0.84) });
              } else {
                canvas.toBlob(
                  (pngBlob) => {
                    if (pngBlob) {
                      resolve({ blob: pngBlob, mime: 'image/png', ext: 'png', dataUrl: canvas.toDataURL('image/png') });
                    } else {
                      reject(new Error('Banner compression failed'));
                    }
                  },
                  'image/png'
                );
              }
            },
            'image/webp',
            0.84
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(inputFile);
    });

  const { blob, mime, ext, dataUrl } = await compressBannerToBlob(file);
  const safeSlug = String(courseSlug || 'course').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const fileName = `${safeSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

  // 1. Primary bucket: `smylodent-assets/course-banners/`
  const primaryPath = `course-banners/${fileName}`;
  const { error: primaryErr } = await supabase.storage
    .from('smylodent-assets')
    .upload(primaryPath, blob, {
      contentType: mime,
      cacheControl: '31536000',
      upsert: true
    });

  if (!primaryErr) {
    const { data: { publicUrl } } = supabase.storage
      .from('smylodent-assets')
      .getPublicUrl(primaryPath);
    return publicUrl;
  }

  // 2. Fallback bucket: `pdf-sheets/smylodent-products/`
  const fallbackPath = `smylodent-products/${fileName}`;
  const { error: fallbackErr } = await supabase.storage
    .from('pdf-sheets')
    .upload(fallbackPath, blob, {
      contentType: mime,
      cacheControl: '31536000',
      upsert: true
    });

  if (!fallbackErr) {
    const { data: { publicUrl } } = supabase.storage
      .from('pdf-sheets')
      .getPublicUrl(fallbackPath);
    return publicUrl;
  }

  // 3. Final fallback: compressed dataUrl
  return dataUrl;
}

/**
 * Flush all subject/year caches across memory and localStorage
 * so student pages reflect changes immediately.
 */
export function invalidateCourseBannersCache(updatedSubjects = null) {
  try {
    clearSubjectCaches();
  } catch (_) {}

  try {
    Object.keys(localStorage).forEach((k) => {
      if (
        k.includes('subject_') ||
        k.includes('subjects:') ||
        k.includes('year_v5:') ||
        k === 'abs_admin_cached_subjects'
      ) {
        localStorage.removeItem(k);
      }
    });
    if (Array.isArray(updatedSubjects) && updatedSubjects.length > 0) {
      localStorage.setItem('abs_admin_cached_subjects', JSON.stringify(updatedSubjects));
      cacheSet('subjects:all', updatedSubjects, 86400);
      const byYear = {};
      for (const s of updatedSubjects) {
        if (!byYear[s.year_id]) byYear[s.year_id] = [];
        byYear[s.year_id].push(s);
      }
      for (const [yId, list] of Object.entries(byYear)) {
        cacheSet('subjects:year:' + yId, list, 86400);
      }
    }
  } catch (_) {}
}
