/**
 * Order Edit Utilities & Diff Computation
 * Handles parsing, history serialization, and diff tracking for customer & admin order modifications.
 */

/**
 * Safely parses the edit history array from an order.
 * Inspects `order.edit_history` (if array), or parses JSON in `order.status_note`.
 *
 * @param {Object} order
 * @returns {Array} Array of edit history entries (sorted newest first)
 */
export const parseOrderEditHistory = (order) => {
  if (!order) return [];

  // If already directly an array on the object
  if (Array.isArray(order.edit_history)) {
    return [...order.edit_history].sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );
  }

  // If stored in status_note
  if (order.status_note && typeof order.status_note === 'string') {
    try {
      const parsed = JSON.parse(order.status_note);
      if (Array.isArray(parsed)) {
        return [...parsed].sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
      }
      if (parsed && Array.isArray(parsed.edit_history)) {
        return [...parsed.edit_history].sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
      }
    } catch {
      // not JSON, regular text note
    }
  }

  return [];
};

/**
 * Normalizes an item list so that comparing by ID or Name is consistent.
 */
const normalizeItem = (item) => {
  const id = String(item.id || item.product_id || item.name_en || item.name_ar || '');
  const name_ar = item.name_ar || item.products?.name_ar || item.name_en || '';
  const name_en = item.name_en || item.products?.name_en || item.name_ar || '';
  const quantity = Math.max(0, parseInt(item.quantity) || 1);
  const price = parseFloat(item.price ?? item.products?.price ?? 0);
  const image_url = item.image_url || item.products?.main_image_url || item.products?.image_url || '';

  return {
    id,
    name_ar,
    name_en,
    quantity,
    price,
    image_url,
    is_accessory: Boolean(item.is_accessory)
  };
};

/**
 * Calculates differences between two sets of order items:
 * Identifies added, removed, and modified items.
 *
 * @param {Array} oldItems
 * @param {Array} newItems
 * @returns {Object} { added: [], removed: [], modified: [] }
 */
export const calculateItemsDiff = (oldItems = [], newItems = []) => {
  const oldNorm = (oldItems || []).map(normalizeItem);
  const newNorm = (newItems || []).map(normalizeItem);

  const oldMap = new Map();
  oldNorm.forEach((item) => {
    // Unique key: prefer ID, fallback to name
    const key = item.id || `${item.name_ar}_${item.name_en}`;
    oldMap.set(key, item);
  });

  const newMap = new Map();
  newNorm.forEach((item) => {
    const key = item.id || `${item.name_ar}_${item.name_en}`;
    newMap.set(key, item);
  });

  const added = [];
  const removed = [];
  const modified = [];

  // Check new items for added or modified
  newMap.forEach((newItem, key) => {
    if (!oldMap.has(key)) {
      added.push({
        id: newItem.id,
        name_ar: newItem.name_ar,
        name_en: newItem.name_en,
        quantity: newItem.quantity,
        price: newItem.price,
        image_url: newItem.image_url
      });
    } else {
      const oldItem = oldMap.get(key);
      const qtyChanged = oldItem.quantity !== newItem.quantity;
      const priceChanged = Math.abs(oldItem.price - newItem.price) > 0.001;

      if (qtyChanged || priceChanged) {
        modified.push({
          id: newItem.id,
          name_ar: newItem.name_ar,
          name_en: newItem.name_en,
          old_quantity: oldItem.quantity,
          new_quantity: newItem.quantity,
          old_price: oldItem.price,
          new_price: newItem.price,
          image_url: newItem.image_url
        });
      }
    }
  });

  // Check old items for removed
  oldMap.forEach((oldItem, key) => {
    if (!newMap.has(key)) {
      removed.push({
        id: oldItem.id,
        name_ar: oldItem.name_ar,
        name_en: oldItem.name_en,
        quantity: oldItem.quantity,
        price: oldItem.price,
        image_url: oldItem.image_url
      });
    }
  });

  return { added, removed, modified };
};

/**
 * Creates a structured edit history log entry.
 *
 * @param {Object} params
 * @param {string} params.editor 'Customer' | 'Admin'
 * @param {Object} params.previousOrder
 * @param {Array} params.newItems
 * @param {number} params.newTotalPrice
 * @param {string} [params.notes]
 * @param {string} [params.status]
 * @returns {Object} Edit history entry
 */
export const createEditHistoryEntry = ({
  editor = 'Customer',
  previousOrder = {},
  newItems = [],
  newTotalPrice = 0,
  notes = '',
  status = ''
}) => {
  const previousItems = Array.isArray(previousOrder.items) && previousOrder.items.length > 0
    ? previousOrder.items
    : (previousOrder.order_items || []);

  const previousTotal = parseFloat(previousOrder.total_price ?? previousOrder.total ?? 0);
  const updatedTotal = parseFloat(newTotalPrice ?? 0);

  const changes = calculateItemsDiff(previousItems, newItems);

  return {
    id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    editor, // 'Customer' | 'Admin'
    timestamp: new Date().toISOString(),
    previous_total: previousTotal,
    new_total: updatedTotal,
    difference: updatedTotal - previousTotal,
    changes,
    notes: notes || null,
    order_status_at_edit: status || previousOrder.status || 'updated'
  };
};

/**
 * Serializes an order's updated status note with the new edit entry appended.
 *
 * @param {Object} order
 * @param {Object} newEntry
 * @param {Object} [meta]
 * @returns {string} Stringified JSON
 */
export const buildUpdatedStatusNote = (order, newEntry, meta = {}) => {
  let existingMeta = {};
  let currentHistory = [];

  if (order?.status_note) {
    try {
      const parsed = JSON.parse(order.status_note);
      if (Array.isArray(parsed)) {
        currentHistory = parsed;
      } else if (parsed && typeof parsed === 'object') {
        currentHistory = Array.isArray(parsed.edit_history) ? parsed.edit_history : [];
        existingMeta = { ...parsed };
        delete existingMeta.edit_history;
      }
    } catch {
      existingMeta.original_text = order.status_note;
    }
  }

  const updatedHistory = [...currentHistory, newEntry];

  return JSON.stringify({
    ...existingMeta,
    ...meta,
    last_edited_by: newEntry.editor,
    last_edited_at: newEntry.timestamp,
    edit_history: updatedHistory
  });
};

/**
 * CANONICAL ORDER STATUSES
 * The authoritative status field for all Absolute Dental orders across Admin and Main System.
 */
export const CANONICAL_ORDER_STATUSES = {
  pending_review: {
    key: 'pending_review',
    label_ar: 'في انتظار المراجعة',
    label_en: 'Pending Review',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  accepted: {
    key: 'accepted',
    label_ar: 'تم قبول الطلب',
    label_en: 'Accepted',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  preparing: {
    key: 'preparing',
    label_ar: 'جاري التجهيز',
    label_en: 'Preparing Tools',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)'
  },
  ready_for_delivery: {
    key: 'ready_for_delivery',
    label_ar: 'جاهز للتوصيل',
    label_en: 'Ready for Delivery',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.3)'
  },
  out_for_delivery: {
    key: 'out_for_delivery',
    label_ar: 'خرج للتوصيل',
    label_en: 'Out for Delivery',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)'
  },
  delivered: {
    key: 'delivered',
    label_ar: 'تم التسليم',
    label_en: 'Delivered',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.18)',
    border: 'rgba(16, 185, 129, 0.4)'
  },
  cancelled: {
    key: 'cancelled',
    label_ar: 'ملغى',
    label_en: 'Cancelled',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)'
  },
  rejected: {
    key: 'rejected',
    label_ar: 'مرفوض',
    label_en: 'Rejected',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.3)'
  }
};

/**
 * Normalizes any raw status string (Arabic or legacy English) into the canonical enum key.
 */
export const normalizeOrderStatus = (raw) => {
  if (!raw) return 'pending_review';
  const s = String(raw).trim().toLowerCase();

  if (s === 'pending_review' || s === 'new' || s === 'under_review' || s.includes('انتظار') || s.includes('جديد')) {
    return 'pending_review';
  }
  if (s === 'accepted' || s.includes('قبول')) {
    return 'accepted';
  }
  if (s === 'preparing' || s.includes('تجهيز') || s === 'editing') {
    return 'preparing';
  }
  if (s === 'ready_for_delivery' || s === 'ready' || s.includes('جاهز')) {
    return 'ready_for_delivery';
  }
  if (s === 'out_for_delivery' || s === 'shipping' || (s.includes('خرج') && s.includes('توصيل'))) {
    return 'out_for_delivery';
  }
  if (s === 'delivered' || s === 'completed' || s.includes('تسليم') || s.includes('مكتمل')) {
    return 'delivered';
  }
  if (s === 'rejected' || s.includes('مرفوض')) {
    return 'rejected';
  }
  if (s === 'cancelled' || s === 'canceled' || s.includes('ملغ')) {
    return 'cancelled';
  }

  // Edit sub-states from website
  if (s === 'edit_requested' || s === 'edited_pending' || s === 'updated') {
    return s;
  }

  return 'pending_review';
};

/**
 * Creates an audit trail log entry for order status changes.
 */
export const createStatusAuditEntry = ({ fromStatus, toStatus, author = 'النظام', notes = null }) => {
  const now = new Date();
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: fromStatus,
    to: toStatus,
    author,
    notes,
    timestamp: now.toISOString(),
    date_formatted: now.toLocaleDateString('ar-LY') + ' ' + now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })
  };
};

/**
 * Returns human-readable status metadata, color badges, and labels.
 */
export const getOrderStatusMeta = (rawStatus, isRtl = true) => {
  const normKey = normalizeOrderStatus(rawStatus);

  if (CANONICAL_ORDER_STATUSES[normKey]) {
    const c = CANONICAL_ORDER_STATUSES[normKey];
    return {
      key: c.key,
      label: isRtl ? c.label_ar : c.label_en,
      color: c.color,
      bg: c.bg,
      bgColor: c.bg,
      border: c.border,
      borderColor: c.border
    };
  }

  // Handling special edit states
  switch (rawStatus) {
    case 'edit_requested':
      return {
        key: 'edit_requested',
        label: isRtl ? 'طلب تعديل قيد المراجعة' : 'Edit Requested',
        color: '#d97706',
        bg: 'rgba(217, 119, 6, 0.15)',
        bgColor: 'rgba(217, 119, 6, 0.15)',
        border: 'rgba(217, 119, 6, 0.4)',
        borderColor: 'rgba(217, 119, 6, 0.4)',
        isEditState: true
      };
    case 'editing':
      return {
        key: 'editing',
        label: isRtl ? 'قيد التعديل' : 'Editing in Progress',
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.15)',
        bgColor: 'rgba(37, 99, 235, 0.15)',
        border: 'rgba(37, 99, 235, 0.4)',
        borderColor: 'rgba(37, 99, 235, 0.4)',
        isEditState: true
      };
    case 'edited_pending':
      return {
        key: 'edited_pending',
        label: isRtl ? 'معدّل - بانتظار الاعتماد' : 'Edited – Awaiting Review',
        color: '#7c3aed',
        bg: 'rgba(124, 58, 237, 0.15)',
        bgColor: 'rgba(124, 58, 237, 0.15)',
        border: 'rgba(124, 58, 237, 0.4)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        isEditState: true
      };
    case 'updated':
      return {
        key: 'updated',
        label: isRtl ? 'تم التحديث والاعتماد' : 'Updated & Confirmed',
        color: '#059669',
        bg: 'rgba(5, 150, 105, 0.15)',
        bgColor: 'rgba(5, 150, 105, 0.15)',
        border: 'rgba(5, 150, 105, 0.4)',
        borderColor: 'rgba(5, 150, 105, 0.4)',
        isEditState: true
      };
    default:
      return {
        key: rawStatus || 'unknown',
        label: rawStatus || (isRtl ? 'غير محدد' : 'Unknown'),
        color: 'var(--text-muted)',
        bg: 'var(--accent)',
        bgColor: 'var(--accent)',
        border: 'var(--border-color)',
        borderColor: 'var(--border-color)'
      };
  }
};
