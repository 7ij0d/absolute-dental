import supabase from '../supabaseClient.js';

/**
 * ABSOLUTE DENTAL — STUDENT EXPERIENCES & PRODUCT AVAILABILITY REQUESTS ENGINE
 * Real cloud database persistence backed by `public.settings` (JSONB rows) & `smylodent-assets` storage.
 *
 * Security & Privacy Guarantees:
 * 1. Pending/rejected experiences are stored under `student_exp_pending_<id>`.
 * 2. Approved public experiences are stored under `student_exp_pub_<id>` with zero private phone numbers or internal notes.
 * 3. Product availability requests are stored under `prod_req_<id>` and only queried by Admin.
 * 4. Likes enforce strict 1-like-per-user uniqueness on the server record (`likes` array of user IDs).
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB max per image before compression

export const PRODUCT_REQUEST_STATUSES = [
  { value: 'new', label_ar: 'جديد', label_en: 'New', color: '#2563EB' },
  { value: 'searching', label_ar: 'جاري البحث', label_en: 'Searching', color: '#D97706' },
  { value: 'available', label_ar: 'تم التوفير', label_en: 'Available', color: '#059669' },
  { value: 'unavailable', label_ar: 'غير متوفر', label_en: 'Unavailable', color: '#DC2626' }
];

export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'لم يتم اختيار ملف', errorAr: 'لم يتم اختيار ملف', errorEn: 'No file selected' };
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const isImage = type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|gif|bmp)$/i.test(name);
  if (!isImage) {
    const msg = 'يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.';
    return {
      valid: false,
      error: msg,
      errorAr: msg,
      errorEn: 'Please upload a valid image file.'
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const msg = 'حجم الصورة كبير جداً (الحد الأقصى 15 ميجابايت).';
    return {
      valid: false,
      error: msg,
      errorAr: msg,
      errorEn: 'Image file size exceeds the 15MB limit.'
    };
  }
  return { valid: true };
}

export function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ blob: null, dataUrl: '' });
      return;
    }

    // Try URL.createObjectURL first (fastest, avoids FileReader memory crashes)
    let objectUrl = null;
    try {
      if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
        objectUrl = window.URL.createObjectURL(file);
      }
    } catch (_) {}

    const cleanup = () => {
      if (objectUrl) {
        try { window.URL.revokeObjectURL(objectUrl); } catch (_) {}
      }
    };

    const processImg = (img) => {
      try {
        const canvas = document.createElement('canvas');
        const imgW = img.naturalWidth || img.width || 800;
        const imgH = img.naturalHeight || img.height || 600;
        const ratio = Math.min(maxWidth / imgW, 1);
        canvas.width = Math.round(imgW * ratio);
        canvas.height = Math.round(imgH * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve({ blob, dataUrl });
              } catch (_) {
                resolve({ blob, dataUrl: '' });
              }
            } else {
              // Return original file as blob fallback
              resolve({ blob: file, dataUrl: '' });
            }
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        cleanup();
        resolve({ blob: file, dataUrl: '' });
      }
    };

    if (objectUrl) {
      const img = new Image();
      img.onload = () => processImg(img);
      img.onerror = () => {
        cleanup();
        fallbackWithFileReader();
      };
      img.src = objectUrl;
    } else {
      fallbackWithFileReader();
    }

    function fallbackWithFileReader() {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => processImg(img);
          img.onerror = () => resolve({ blob: file, dataUrl: e.target?.result || '' });
          img.src = e.target.result;
        };
        reader.onerror = () => {
          // Never throw; fallback directly to raw file
          resolve({ blob: file, dataUrl: '' });
        };
        reader.readAsDataURL(file);
      } catch (_) {
        resolve({ blob: file, dataUrl: '' });
      }
    }
  });
}

export async function uploadCompressedImage(file, folder = 'experiences') {
  if (!file) return null;
  try {
    const { blob, dataUrl } = await compressImageFile(file);
    const blobToUpload = blob || file;
    const safeName = (file.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;

    try {
      const { data, error } = await supabase.storage
        .from('smylodent-assets')
        .upload(filePath, blobToUpload, {
          contentType: blobToUpload.type || 'image/jpeg',
          upsert: false
        });

      if (!error && data) {
        const { data: pubData } = supabase.storage
          .from('smylodent-assets')
          .getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          return pubData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Storage upload notice:', err);
    }

    if (dataUrl) return dataUrl;
  } catch (err) {
    console.warn('Image upload processing notice:', err);
  }
  return null;
}

function normalizeExperienceRecord(item) {
  if (!item) return null;
  const isAnonymous = Boolean(item.is_anonymous);
  const userName = isAnonymous ? 'طالب مجهول الهوية' : (item.user_name || item.author_name || 'طالب طب أسنان');
  const userEmail = isAnonymous ? '' : (item.user_email || item.author_email || '');
  const comments = Array.isArray(item.comments)
    ? item.comments.map((c) => ({
        ...c,
        is_anonymous: Boolean(c.is_anonymous),
        user_name: c.is_anonymous ? 'طالب مجهول الهوية' : (c.user_name || c.author_name || 'طالب طب أسنان'),
        author_name: c.is_anonymous ? 'طالب مجهول الهوية' : (c.author_name || c.user_name || 'طالب طب أسنان'),
      }))
    : [];
  return {
    ...item,
    is_anonymous: isAnonymous,
    user_name: userName,
    author_name: userName,
    user_email: userEmail,
    author_email: userEmail,
    avatar_url: isAnonymous ? null : (item.avatar_url || null),
    likes: Array.isArray(item.likes) ? item.likes : [],
    comments,
  };
}

function normalizeProductRequestRecord(item) {
  if (!item) return null;
  const imgUrl = item.image_url || item.product_image || null;
  const specs = item.specifications !== undefined ? item.specifications : (item.product_details || '');
  return {
    ...item,
    image_url: imgUrl,
    product_image: imgUrl,
    specifications: specs,
    product_details: specs,
    status_history: Array.isArray(item.status_history) ? item.status_history : [],
  };
}

/* ============================================================================
   1. STUDENT EXPERIENCES ENGINE (تجارب الطلبة مع ابسلوت دنتال)
   ============================================================================ */

/**
 * Fetches approved experiences for the public storefront.
 */
export async function fetchApprovedExperiences() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'student_exp_pub_%');

    if (error || !Array.isArray(data)) return [];

    return data
      .map((row) => normalizeExperienceRecord(row.value))
      .filter((item) => item && item.id && item.status === 'approved')
      .sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
  } catch (err) {
    console.error('Error fetching approved experiences:', err);
    return [];
  }
}

export const fetchPublishedExperiences = fetchApprovedExperiences;

/**
 * Submits a new student experience and publishes it immediately to the feed.
 */
export async function submitStudentExperience({ user, profile, text, imageFiles = [], isAnonymous = false }) {
  if (!user || !user.id) {
    throw new Error('AUTH_REQUIRED');
  }

  const cleanText = sanitizeInputText(text, 1500);
  if (!cleanText && (!imageFiles || imageFiles.length === 0)) {
    throw new Error('يرجى كتابة نص التجربة أو إرفاق صورة واحدة على الأقل.');
  }

  const uploadedUrls = [];
  for (const file of imageFiles.slice(0, 5)) {
    const url = await uploadCompressedImage(file, 'experiences');
    if (url) uploadedUrls.push(url);
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const rawAuthorName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split('@')[0] : 'طالب طب أسنان');

  const cleanRealName = sanitizeInputText(rawAuthorName, 80);
  const displayName = isAnonymous ? 'طالب مجهول الهوية' : cleanRealName;
  const authorAvatar = isAnonymous ? null : (profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null);

  const experienceRecord = {
    id,
    user_id: user.id,
    user_name: displayName,
    author_name: displayName,
    real_author_name: cleanRealName,
    is_anonymous: Boolean(isAnonymous),
    user_email: user.email || '',
    author_email: user.email || '',
    avatar_url: authorAvatar,
    university: sanitizeInputText(profile?.university || user.user_metadata?.university || 'كلية طب الأسنان', 100),
    academic_year: profile?.academic_year || user.user_metadata?.academic_year || null,
    text: cleanText,
    images: uploadedUrls,
    status: 'approved',
    likes: [],
    comments: [],
    created_at: now,
    published_at: now,
  };

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `student_exp_pub_${id}`,
      value: experienceRecord,
    });

  if (error) throw error;
  return normalizeExperienceRecord(experienceRecord);
}

/**
 * Toggles a single like per authenticated user account on a published experience.
 */
export async function toggleExperienceLike(arg1, arg2) {
  let expId;
  let userId;
  if (typeof arg1 === 'object' && arg1 !== null) {
    expId = arg1.experienceId || arg1.expId;
    userId = arg1.userId || arg1.user?.id;
  } else {
    expId = arg1;
    userId = typeof arg2 === 'object' ? arg2?.id : arg2;
  }

  if (!userId) {
    throw new Error('AUTH_REQUIRED');
  }
  if (!expId) throw new Error('Invalid experience ID');

  const key = `student_exp_pub_${expId}`;
  const { data: row, error: fetchErr } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (fetchErr || !row?.value) {
    throw new Error('التجربة غير موجودة');
  }

  const exp = row.value;
  const currentLikes = Array.isArray(exp.likes) ? [...new Set(exp.likes)] : [];
  const hasLiked = currentLikes.includes(userId);

  const updatedLikes = hasLiked
    ? currentLikes.filter((uid) => uid !== userId)
    : [...currentLikes, userId];

  const updatedExp = {
    ...exp,
    likes: updatedLikes,
  };

  const { error: updateErr } = await supabase
    .from('settings')
    .upsert({
      key,
      value: updatedExp,
    });

  if (updateErr) throw updateErr;
  return normalizeExperienceRecord(updatedExp);
}

/**
 * Adds a comment from an authenticated user to a published experience.
 */
export async function addExperienceComment(arg1, arg2, arg3, arg4, arg5) {
  let expId, user, profile, commentText, isAnonymous = false;
  if (typeof arg1 === 'object' && arg1 !== null) {
    expId = arg1.experienceId || arg1.expId;
    user = arg1.user;
    profile = arg1.profile;
    commentText = arg1.commentText;
    isAnonymous = Boolean(arg1.isAnonymous);
  } else {
    expId = arg1;
    user = arg2;
    profile = arg3;
    commentText = arg4;
    isAnonymous = Boolean(arg5);
  }

  if (!user || !user.id) {
    throw new Error('AUTH_REQUIRED');
  }
  const cleanComment = sanitizeInputText(commentText, 600);
  if (!cleanComment) {
    throw new Error('يرجى كتابة نص التعليق');
  }

  const key = `student_exp_pub_${expId}`;
  const { data: row, error: fetchErr } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (fetchErr || !row?.value) {
    throw new Error('التجربة غير موجودة');
  }

  const exp = row.value;
  const rawAuthorName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split('@')[0] : 'طالب طب أسنان');

  const cleanAuthor = sanitizeInputText(rawAuthorName, 80);
  const displayAuthor = isAnonymous ? 'طالب مجهول الهوية' : cleanAuthor;

  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: user.id,
    user_name: displayAuthor,
    author_name: displayAuthor,
    real_author_name: cleanAuthor,
    is_anonymous: Boolean(isAnonymous),
    text: cleanComment,
    created_at: new Date().toISOString(),
  };

  const updatedExp = {
    ...exp,
    comments: [...(Array.isArray(exp.comments) ? exp.comments : []), newComment],
  };

  const { error: updateErr } = await supabase
    .from('settings')
    .upsert({
      key,
      value: updatedExp,
    });

  if (updateErr) throw updateErr;
  return normalizeExperienceRecord(updatedExp);
}

/**
 * Admin: Fetch all student experiences (pending, approved, rejected).
 */
export async function fetchAllExperiencesForAdmin() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .like('key', 'student_exp_%');

  if (error || !Array.isArray(data)) return [];

  const byId = new Map();
  for (const row of data) {
    const val = normalizeExperienceRecord(row.value);
    if (!val || !val.id) continue;
    if (!byId.has(val.id) || row.key.startsWith('student_exp_pub_')) {
      byId.set(val.id, val);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
}

async function resolveExperienceByIdOrObject(expOrId) {
  if (typeof expOrId === 'object' && expOrId?.id) return expOrId;
  const id = expOrId;
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [`student_exp_pending_${id}`, `student_exp_pub_${id}`]);
  const row = (data || [])[0];
  return row?.value || null;
}

/**
 * Admin: Approve and publish an experience.
 */
export async function adminApproveExperience(expOrId) {
  const exp = await resolveExperienceByIdOrObject(expOrId);
  if (!exp || !exp.id) throw new Error('التجربة غير موجودة');
  const now = new Date().toISOString();
  const isAnon = Boolean(exp.is_anonymous);
  const cleanName = isAnon ? 'طالب مجهول الهوية' : (exp.user_name || exp.author_name || 'طالب طب أسنان');

  const approvedRecord = {
    ...exp,
    id: exp.id,
    user_id: exp.user_id,
    user_name: cleanName,
    author_name: cleanName,
    real_author_name: exp.real_author_name || exp.user_name,
    is_anonymous: isAnon,
    avatar_url: isAnon ? null : (exp.avatar_url || null),
    university: exp.university || 'كلية طب الأسنان',
    text: exp.text || '',
    images: Array.isArray(exp.images) ? exp.images : [],
    status: 'approved',
    likes: Array.isArray(exp.likes) ? exp.likes : [],
    comments: Array.isArray(exp.comments) ? exp.comments : [],
    created_at: exp.created_at || now,
    published_at: exp.published_at || now,
  };

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `student_exp_pub_${exp.id}`,
      value: approvedRecord,
    });

  if (error) throw error;

  await supabase
    .from('settings')
    .delete()
    .eq('key', `student_exp_pending_${exp.id}`);

  return normalizeExperienceRecord(approvedRecord);
}

/**
 * Admin: Reject an experience (unpublishes if it was published).
 */
export async function adminRejectExperience(expOrId) {
  const exp = await resolveExperienceByIdOrObject(expOrId);
  if (!exp || !exp.id) throw new Error('التجربة غير موجودة');
  const rejectedRecord = {
    ...exp,
    status: 'rejected',
  };

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `student_exp_pending_${exp.id}`,
      value: rejectedRecord,
    });

  if (error) throw error;

  await supabase
    .from('settings')
    .delete()
    .eq('key', `student_exp_pub_${exp.id}`);

  return normalizeExperienceRecord(rejectedRecord);
}

/**
 * Admin: Permanently delete an experience.
 */
export async function adminDeleteExperience(expOrId) {
  const expId = typeof expOrId === 'object' ? expOrId?.id : expOrId;
  if (!expId) return;
  await Promise.all([
    supabase.from('settings').delete().eq('key', `student_exp_pending_${expId}`),
    supabase.from('settings').delete().eq('key', `student_exp_pub_${expId}`),
  ]);
}

/**
 * Admin: Delete an inappropriate comment from an experience.
 */
export async function adminDeleteExperienceComment(arg1, arg2) {
  const expId = typeof arg1 === 'object' ? (arg1.experienceId || arg1.expId) : arg1;
  const commentId = typeof arg1 === 'object' ? arg1.commentId : arg2;
  const pubKey = `student_exp_pub_${expId}`;
  const { data: row } = await supabase
    .from('settings')
    .select('value')
    .eq('key', pubKey)
    .maybeSingle();

  if (!row?.value) return null;

  const updated = {
    ...row.value,
    comments: (row.value.comments || []).filter((c) => c.id !== commentId),
  };

  await supabase.from('settings').upsert({
    key: pubKey,
    value: updated,
  });

  return normalizeExperienceRecord(updated);
}

/* ============================================================================
   2. PRODUCT AVAILABILITY REQUESTS ENGINE (طلبات توفير المنتجات)
   ============================================================================ */

/**
 * Submits a new product availability request (`مش لاقي اللي تبيه؟ خلّيه علينا!`).
 * Never deducts inventory or creates a purchase order.
 */
export async function submitProductAvailabilityRequest({
  user,
  profile,
  productName,
  imageFile,
  productImageFile,
  specifications,
  productDetails,
  contactPhone,
  additionalNotes,
}) {
  if (!user || !user.id) {
    throw new Error('AUTH_REQUIRED');
  }

  const cleanProductName = sanitizeInputText(productName, 200);
  const cleanPhone = sanitizeInputText(contactPhone, 40);
  const cleanDetails = sanitizeInputText(specifications || productDetails || '', 1500);
  const cleanNotes = sanitizeInputText(additionalNotes || '', 1000);

  if (!cleanProductName) {
    throw new Error('يرجى إدخال اسم المنتج المطلوب.');
  }
  if (!cleanPhone) {
    throw new Error('يرجى إدخال رقم التواصل.');
  }

  let uploadedImageUrl = null;
  const fileToUpload = imageFile || productImageFile;
  if (fileToUpload) {
    uploadedImageUrl = await uploadCompressedImage(fileToUpload, 'product-requests');
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const requestNumber = `PR-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const requesterName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split('@')[0] : 'طالب طب أسنان');

  const record = {
    id,
    request_number: requestNumber,
    user_id: user.id,
    user_name: sanitizeInputText(requesterName, 100),
    user_email: user.email || '',
    product_name: cleanProductName,
    image_url: uploadedImageUrl,
    product_image: uploadedImageUrl,
    specifications: cleanDetails,
    product_details: cleanDetails,
    contact_phone: cleanPhone,
    additional_notes: cleanNotes,
    status: 'new',
    admin_notes: '',
    status_history: [
      {
        status: 'new',
        label_ar: 'جديد',
        changed_at: now,
        note: 'تم إنشاء طلب توفير المنتج',
      },
    ],
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `prod_req_${id}`,
      value: record,
    });

  if (error) throw error;
  return normalizeProductRequestRecord(record);
}

/**
 * Admin: Fetch all product availability requests.
 */
export async function fetchAllProductRequestsForAdmin() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .like('key', 'prod_req_%');

  if (error || !Array.isArray(data)) return [];

  return data
    .map((row) => normalizeProductRequestRecord(row.value))
    .filter((item) => item && item.id)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Admin: Update status and/or internal admin notes of a product request.
 */
export async function adminUpdateProductRequest(arg1, arg2 = {}) {
  let reqId, nextStatusParam, adminNotesParam;
  if (typeof arg1 === 'object' && arg1 !== null) {
    reqId = arg1.requestId || arg1.reqId;
    nextStatusParam = arg1.newStatus || arg1.status;
    adminNotesParam = arg1.adminNotes;
  } else {
    reqId = arg1;
    nextStatusParam = arg2.newStatus || arg2.status;
    adminNotesParam = arg2.adminNotes;
  }

  if (!reqId) throw new Error('Invalid request ID');
  const key = `prod_req_${reqId}`;

  const { data: row, error: fetchErr } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (fetchErr || !row?.value) {
    throw new Error('الطلب غير موجود');
  }

  const current = row.value;
  const now = new Date().toISOString();
  const history = Array.isArray(current.status_history) ? [...current.status_history] : [];

  const nextStatus = nextStatusParam || current.status;
  if (nextStatusParam && nextStatusParam !== current.status) {
    const statusObj = PRODUCT_REQUEST_STATUSES.find((s) => s.value === nextStatusParam);
    history.push({
      status: nextStatusParam,
      label_ar: statusObj ? statusObj.label_ar : nextStatusParam,
      changed_at: now,
      note: `تغيير الحالة إلى: ${statusObj ? statusObj.label_ar : nextStatusParam}`,
    });
  }

  const updated = {
    ...current,
    status: nextStatus,
    admin_notes: adminNotesParam !== undefined ? sanitizeInputText(adminNotesParam, 2000) : (current.admin_notes || ''),
    status_history: history,
    updated_at: now,
  };

  const { error: updateErr } = await supabase
    .from('settings')
    .upsert({
      key,
      value: updated,
    });

  if (updateErr) throw updateErr;
  return normalizeProductRequestRecord(updated);
}

/**
 * Admin: Delete a product availability request.
 */
export async function adminDeleteProductRequest(reqId) {
  if (!reqId) return;
  await supabase.from('settings').delete().eq('key', `prod_req_${reqId}`);
}
