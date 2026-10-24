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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB max per image before compression

export const PRODUCT_REQUEST_STATUSES = [
  { value: 'new', label_ar: 'جديد', labelAr: 'جديد', labelEn: 'New', color: '#D97706', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'under_review', label_ar: 'قيد المراجعة', labelAr: 'قيد المراجعة', labelEn: 'Under Review', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  { value: 'searching', label_ar: 'جارٍ البحث عن المنتج', labelAr: 'جارٍ البحث عن المنتج', labelEn: 'Searching for Product', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' },
  { value: 'provided', label_ar: 'تم توفير المنتج', labelAr: 'تم توفير المنتج', labelEn: 'Product Provided', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  { value: 'unavailable', label_ar: 'تعذّر توفير المنتج', labelAr: 'تعذّر توفير المنتج', labelEn: 'Could Not Provide', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)' },
];

export function sanitizeInputText(input = '', maxLength = 2000) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and compresses an image file before uploading to cloud storage.
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'لم يتم اختيار ملف', errorAr: 'لم يتم اختيار ملف', errorEn: 'No file selected' };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const msg = 'يرجى اختيار صورة بصيغة JPG أو PNG أو WebP فقط.';
    return {
      valid: false,
      error: msg,
      errorAr: msg,
      errorEn: 'Please upload a valid JPG, PNG, or WebP image only.'
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const msg = 'حجم الصورة كبير جداً (الحد الأقصى 8 ميجابايت).';
    return {
      valid: false,
      error: msg,
      errorAr: msg,
      errorEn: 'Image file size exceeds the 8MB limit.'
    };
  }
  return { valid: true };
}

export function compressImageFile(file, maxWidth = 1080, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.errorAr));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', quality) });
            } else {
              reject(new Error('فشل ضغط الصورة'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadCompressedImage(file, folder = 'experiences') {
  const { blob, dataUrl } = await compressImageFile(file);
  const safeName = (file.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}.jpg`;

  try {
    const { data, error } = await supabase.storage
      .from('smylodent-assets')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });

    if (!error && data) {
      const { data: pubData } = supabase.storage
        .from('smylodent-assets')
        .getPublicUrl(filePath);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Cloud storage upload fallback to data URL:', err);
  }
  return dataUrl;
}

function normalizeExperienceRecord(item) {
  if (!item) return null;
  const userName = item.user_name || item.author_name || 'طالب طب أسنان';
  const userEmail = item.user_email || item.author_email || '';
  const comments = Array.isArray(item.comments)
    ? item.comments.map((c) => ({
        ...c,
        user_name: c.user_name || c.author_name || 'طالب طب أسنان',
        author_name: c.author_name || c.user_name || 'طالب طب أسنان',
      }))
    : [];
  return {
    ...item,
    user_name: userName,
    author_name: userName,
    user_email: userEmail,
    author_email: userEmail,
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
   1. STUDENT EXPERIENCES ENGINE (تجارب طلبة الأسنان)
   ============================================================================ */

/**
 * Fetches ONLY admin-approved experiences for the public storefront.
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
 * Submits a new student experience with status = 'pending' (requires admin approval before public display).
 */
export async function submitStudentExperience({ user, profile, text, imageFiles = [] }) {
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

  const cleanName = sanitizeInputText(rawAuthorName, 80);

  const experienceRecord = {
    id,
    user_id: user.id,
    user_name: cleanName,
    author_name: cleanName,
    user_email: user.email || '',
    author_email: user.email || '',
    university: sanitizeInputText(profile?.university || user.user_metadata?.university || 'كلية طب الأسنان', 100),
    text: cleanText,
    images: uploadedUrls,
    status: 'pending',
    likes: [],
    comments: [],
    created_at: now,
    published_at: null,
  };

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: `student_exp_pending_${id}`,
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
export async function addExperienceComment(arg1, arg2, arg3, arg4) {
  let expId, user, profile, commentText;
  if (typeof arg1 === 'object' && arg1 !== null) {
    expId = arg1.experienceId || arg1.expId;
    user = arg1.user;
    profile = arg1.profile;
    commentText = arg1.commentText;
  } else {
    expId = arg1;
    user = arg2;
    profile = arg3;
    commentText = arg4;
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

  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: user.id,
    user_name: cleanAuthor,
    author_name: cleanAuthor,
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
  const cleanName = exp.user_name || exp.author_name || 'طالب طب أسنان';

  const approvedRecord = {
    id: exp.id,
    user_id: exp.user_id,
    user_name: cleanName,
    author_name: cleanName,
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
