/**
 * Absolute Dental — Direct Order Editing & Versioning Architecture
 *
 * Implements canonical order versioning where:
 * 1. The customer directly modifies their order (add/remove items, quantities, units).
 * 2. The modification is saved as a PENDING VERSION (e.g. Version 2, status: 'pending_review').
 * 3. The official order remains the current approved version (e.g. Version 1) until approved.
 * 4. The admin reviews an intelligent diff (+added, -removed, qty changed, unit changed, total diff).
 * 5. Admin can ACCEPT (new version becomes current official version) or REJECT (current version remains).
 * 6. Order ID never changes!
 */

import { CANONICAL_ORDER_STATUSES, normalizeOrderStatus } from './orderEditHelper.js';

/**
 * Checks whether an order's main lifecycle status permits editing.
 * Rule: Editable only while in early lifecycle stages (pending_review, accepted).
 * Locked once in preparing, ready_for_delivery, out_for_delivery, delivered, cancelled, rejected.
 *
 * @param {Object} order
 * @returns {{ editable: boolean, reason?: string }}
 */
export const isOrderEditable = (order) => {
  if (!order) return { editable: false, allowed: false, reason: 'الطلب غير موجود' };

  const normStatus = normalizeOrderStatus(order.status);
  
  // Editable statuses
  if (normStatus === 'pending_review' || normStatus === 'accepted' || normStatus === 'new') {
    return { editable: true, allowed: true };
  }

  // Locked statuses with user-friendly explanations
  const lockReasons = {
    preparing: 'الطلبية قيد التجهيز الفعلي في المخزن ولا يمكن تعديلها',
    ready_for_delivery: 'الطلبية جاهزة للتسليم للشحن ولا يمكن تعديلها',
    out_for_delivery: 'الطلبية خرجت للتوصيل مع المندوب ولا يمكن تعديلها',
    delivered: 'تم تسليم الطلبية بالفعل',
    cancelled: 'الطلبية ملغاة',
    rejected: 'الطلبية مرفوضة'
  };

  return {
    editable: false,
    allowed: false,
    reason: lockReasons[normStatus] || 'حالة الطلبية الحالية لا تسمح بالتعديل'
  };
};

/**
 * Normalizes line items from either `order.items` or `order.order_items`.
 *
 * @param {Object} order
 * @returns {Array} Array of canonical item objects
 */
export const extractOrderItems = (order) => {
  if (!order) return [];

  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((it, idx) => ({
      lineId: it.lineId || `item_${it.productId || it.id || idx}`,
      id: String(it.productId || it.product_id || it.id || ''),
      productId: String(it.productId || it.product_id || it.id || ''),
      name_ar: it.name_ar || it.name || 'منتج طبي',
      name_en: it.name_en || it.name || it.name_ar || 'Medical Product',
      price: parseFloat(it.price || 0),
      quantity: Math.max(1, parseInt(it.quantity || it.qty || 1)),
      image_url: it.image_url || it.image || '',
      selling_unit: it.selling_unit || it.sellingUnit || null,
      selling_unit_id: it.selling_unit_id || (it.selling_unit?.includes('علبة') ? 'box' : 'piece'),
      unit_multiplier: parseInt(it.unit_multiplier || it.unitMultiplier || 1) || 1,
      is_accessory: Boolean(it.is_accessory)
    }));
  }

  if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    return order.order_items.map((oi, idx) => ({
      lineId: oi.lineId || `item_${oi.product_id || oi.id || idx}`,
      id: String(oi.product_id || oi.id || ''),
      productId: String(oi.product_id || oi.id || ''),
      name_ar: oi.products?.name_ar || oi.name_ar || 'منتج طبي',
      name_en: oi.products?.name_en || oi.name_en || 'Medical Product',
      price: parseFloat(oi.price ?? oi.products?.price ?? 0),
      quantity: Math.max(1, parseInt(oi.quantity || 1)),
      image_url: oi.products?.main_image_url || oi.products?.image_url || oi.image_url || '',
      selling_unit: oi.selling_unit || null,
      selling_unit_id: oi.selling_unit_id || (oi.selling_unit?.includes('علبة') ? 'box' : 'piece'),
      unit_multiplier: parseInt(oi.unit_multiplier || 1) || 1,
      is_accessory: false
    }));
  }

  return [];
};

/**
 * Parses all version records and state from `order.status_note`.
 * If no versions exist yet, creates a synthetic Version 1 (Approved) from current order data.
 *
 * @param {Object} order
 * @returns {{
 *   versions: Array,
 *   currentVersion: Object,
 *   pendingVersion: Object|null,
 *   currentVersionId: string,
 *   pendingVersionId: string|null,
 *   hasPending: boolean
 * }}
 */
export const parseOrderVersioning = (order) => {
  if (!order) {
    return {
      versions: [],
      currentVersion: null,
      pendingVersion: null,
      currentVersionId: null,
      pendingVersionId: null,
      hasPending: false
    };
  }

  let noteMeta = {};
  if (order.status_note) {
    try {
      const parsed = typeof order.status_note === 'string' ? JSON.parse(order.status_note) : order.status_note;
      if (parsed && typeof parsed === 'object') {
        noteMeta = parsed;
      }
    } catch (_) {}
  }

  let versions = Array.isArray(noteMeta.order_versions) ? [...noteMeta.order_versions] : [];
  let currentVersionId = noteMeta.current_version_id || null;
  let pendingVersionId = noteMeta.pending_version_id || null;

  // If no versions exist, create default Version 1
  if (versions.length === 0) {
    const defaultV1 = {
      id: 'v1',
      version_number: 1,
      created_by: order.customer_name || 'Customer',
      created_at: order.created_at || new Date().toISOString(),
      status: 'approved',
      items: extractOrderItems(order),
      subtotal: parseFloat(order.subtotal || order.total_price || order.total || 0),
      shipping_fee: parseFloat(order.shipping_fee || 0),
      discount_amount: parseFloat(order.discount_amount || 0),
      total: parseFloat(order.total_price || order.total || 0),
      note: 'النسخة الأصلية المعتمدة للطلبية'
    };
    versions = [defaultV1];
    currentVersionId = 'v1';
  }

  // Identify current approved version
  let currentVersion = versions.find(v => v.id === currentVersionId);
  if (!currentVersion) {
    currentVersion = versions.find(v => v.status === 'approved') || versions[0];
    if (currentVersion) currentVersionId = currentVersion.id;
  }

  // Identify pending version awaiting admin review
  let pendingVersion = null;
  if (pendingVersionId) {
    pendingVersion = versions.find(v => v.id === pendingVersionId && v.status === 'pending_review');
  }
  if (!pendingVersion) {
    pendingVersion = versions.find(v => v.status === 'pending_review') || null;
    pendingVersionId = pendingVersion ? pendingVersion.id : null;
  }

  return {
    versions,
    currentVersion,
    pendingVersion,
    currentVersionId,
    pendingVersionId,
    hasPending: Boolean(pendingVersion)
  };
};

/**
 * Intelligent comparison between base approved version and proposed version.
 * Detects:
 * - Added products
 * - Removed products
 * - Quantity changes
 * - Selling unit changes
 * - Price changes
 * - Subtotal / Total differences
 *
 * @param {Array} baseItems
 * @param {Array} proposedItems
 * @returns {Object} Structured comparison diff
 */
export const computeOrderComparison = (baseItems = [], proposedItems = []) => {
  const baseMap = new Map();
  baseItems.forEach(item => {
    const key = String(item.productId || item.id);
    baseMap.set(key, item);
  });

  const proposedMap = new Map();
  proposedItems.forEach(item => {
    const key = String(item.productId || item.id);
    proposedMap.set(key, item);
  });

  const added = [];
  const removed = [];
  const quantityChanged = [];
  const unitChanged = [];
  const priceChanged = [];

  // Check proposed items
  proposedMap.forEach((newItem, key) => {
    if (!baseMap.has(key)) {
      added.push({
        id: newItem.productId || newItem.id,
        productId: newItem.productId || newItem.id,
        name_ar: newItem.name_ar,
        name_en: newItem.name_en,
        quantity: newItem.quantity,
        price: newItem.price,
        selling_unit: newItem.selling_unit || 'قطعة',
        total: newItem.quantity * newItem.price,
        image_url: newItem.image_url
      });
    } else {
      const oldItem = baseMap.get(key);
      const oldQty = parseInt(oldItem.quantity) || 0;
      const newQty = parseInt(newItem.quantity) || 0;
      const oldPrice = parseFloat(oldItem.price) || 0;
      const newPrice = parseFloat(newItem.price) || 0;
      const oldUnit = oldItem.selling_unit || 'قطعة';
      const newUnit = newItem.selling_unit || 'قطعة';

      if (oldQty !== newQty) {
        quantityChanged.push({
          id: key,
          productId: key,
          name_ar: newItem.name_ar,
          name_en: newItem.name_en,
          old_quantity: oldQty,
          new_quantity: newQty,
          diff_quantity: newQty - oldQty,
          oldQty: oldQty,
          newQty: newQty,
          diffQty: newQty - oldQty,
          price: newPrice,
          diff_total: (newQty - oldQty) * newPrice,
          image_url: newItem.image_url
        });
      }

      if (oldUnit !== newUnit) {
        unitChanged.push({
          id: key,
          productId: key,
          name_ar: newItem.name_ar,
          name_en: newItem.name_en,
          old_unit: oldUnit,
          new_unit: newUnit,
          image_url: newItem.image_url
        });
      }

      if (Math.abs(oldPrice - newPrice) > 0.001) {
        priceChanged.push({
          id: key,
          productId: key,
          name_ar: newItem.name_ar,
          name_en: newItem.name_en,
          old_price: oldPrice,
          new_price: newPrice,
          image_url: newItem.image_url
        });
      }
    }
  });

  // Check removed items
  baseMap.forEach((oldItem, key) => {
    if (!proposedMap.has(key)) {
      removed.push({
        id: oldItem.productId || oldItem.id,
        productId: oldItem.productId || oldItem.id,
        name_ar: oldItem.name_ar,
        name_en: oldItem.name_en,
        quantity: oldItem.quantity,
        price: oldItem.price,
        selling_unit: oldItem.selling_unit || 'قطعة',
        total: oldItem.quantity * oldItem.price,
        image_url: oldItem.image_url
      });
    }
  });

  const baseSubtotal = baseItems.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1), 0);
  const proposedSubtotal = proposedItems.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1), 0);

  const hasChanges = added.length > 0 || removed.length > 0 || quantityChanged.length > 0 || unitChanged.length > 0 || priceChanged.length > 0;

  return {
    added,
    removed,
    quantityChanged,
    qtyChanged: quantityChanged,
    unitChanged,
    priceChanged,
    baseSubtotal,
    proposedSubtotal,
    diffSubtotal: proposedSubtotal - baseSubtotal,
    hasChanges
  };
};

/**
 * Builds the payload to save a PENDING MODIFICATION VERSION.
 * DOES NOT ALTER OFFICIAL ORDER ITEMS OR TOTAL!
 *
 * @param {Object} params
 * @param {Object} params.order - Current official order
 * @param {Array} params.proposedItems - Items chosen by the customer
 * @param {string} [params.customerNotes] - Optional note/reason from customer
 * @returns {Object} Supabase update payload { status_note, updated_at }
 */
export const buildSubmitModificationPayload = ({ order, proposedItems, customerNotes = '' }) => {
  const { versions, currentVersion } = parseOrderVersioning(order);

  // Compute highest version number
  const maxVerNum = versions.reduce((max, v) => Math.max(max, parseInt(v.version_number) || 1), 1);
  const nextVerNum = maxVerNum + 1;
  const newVersionId = `v${nextVerNum}-${Date.now().toString(36)}`;

  const diff = computeOrderComparison(currentVersion.items, proposedItems);

  const shippingFee = parseFloat(order.shipping_fee || 0);
  const discountAmount = parseFloat(order.discount_amount || 0);
  const proposedSubtotal = diff.proposedSubtotal;
  const proposedTotal = Math.max(0, proposedSubtotal + shippingFee - discountAmount);

  const newVersion = {
    id: newVersionId,
    version_number: nextVerNum,
    created_by: order.customer_name || 'Customer',
    created_at: new Date().toISOString(),
    status: 'pending_review',
    items: proposedItems,
    subtotal: proposedSubtotal,
    shipping_fee: shippingFee,
    discount_amount: discountAmount,
    total: proposedTotal,
    diff,
    customer_notes: customerNotes || null
  };

  // Audit trail entry
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('ar-LY') + ' ' + now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });
  const auditEntry = {
    id: `edit-${Date.now()}`,
    type: 'customer_modification_submitted',
    editor: 'Customer',
    version_number: nextVerNum,
    version_id: newVersionId,
    timestamp: now.toISOString(),
    date_formatted: dateFormatted,
    previous_total: currentVersion.total,
    new_total: proposedTotal,
    difference: proposedTotal - currentVersion.total,
    changes: {
      added_count: diff.added.length,
      removed_count: diff.removed.length,
      modified_count: diff.quantityChanged.length + diff.unitChanged.length
    },
    notes: customerNotes || null,
    order_status_at_edit: order.status
  };

  let existingMeta = {};
  if (order.status_note) {
    try {
      existingMeta = typeof order.status_note === 'string' ? JSON.parse(order.status_note) : order.status_note;
    } catch (_) {}
  }

  const updatedVersions = [...versions, newVersion];
  const updatedEditHistory = [auditEntry, ...(existingMeta.edit_history || [])];

  const updatedStatusNote = JSON.stringify({
    ...existingMeta,
    order_versions: updatedVersions,
    current_version_id: currentVersion.id,
    pending_version_id: newVersionId,
    last_edited_by: 'Customer',
    last_edited_at: now.toISOString(),
    edit_history: updatedEditHistory
  });

  const updatePayload = {
    status_note: updatedStatusNote,
    updated_at: now.toISOString()
  };

  return {
    ...updatePayload,
    updatePayload,
    status_note: updatedStatusNote,
    updated_at: now.toISOString(),
    newVersion,
    auditEntry
  };
};

/**
 * Builds the payload for ADMIN APPROVAL of a pending version.
 * Marks proposed version as APPROVED.
 * Marks previous version as SUPERSEDED.
 * Promotes proposed version items and total to become the OFFICIAL ORDER.
 *
 * @param {Object} params
 * @param {Object} params.order
 * @param {string} params.versionId
 * @param {string} [params.adminName]
 * @returns {Object} Database update payload and inventory diff
 */
export const buildApproveModificationPayload = ({ order, versionId, adminName = 'الأدمن' }) => {
  const { versions, currentVersion } = parseOrderVersioning(order);

  const targetVersion = versions.find(v => v.id === versionId);
  if (!targetVersion) {
    throw new Error(`Version ${versionId} not found`);
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('ar-LY') + ' ' + now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });

  // Update statuses inside versions array
  const updatedVersions = versions.map(v => {
    if (v.id === versionId) {
      return {
        ...v,
        status: 'approved',
        approved_at: now.toISOString(),
        approved_by: adminName
      };
    }
    if (v.status === 'approved') {
      return {
        ...v,
        status: 'superseded',
        superseded_at: now.toISOString()
      };
    }
    return v;
  });

  // Calculate stock diff for inventory adjustments (DIFFERENCE ONLY!)
  const oldItemsMap = new Map();
  (currentVersion?.items || []).forEach(it => {
    oldItemsMap.set(String(it.productId || it.id), parseInt(it.quantity) || 1);
  });

  const stockAdjustments = [];
  (targetVersion.items || []).forEach(it => {
    const pId = String(it.productId || it.id);
    const oldQty = oldItemsMap.get(pId) || 0;
    const newQty = parseInt(it.quantity) || 1;
    const diffQty = newQty - oldQty;
    if (diffQty !== 0) {
      stockAdjustments.push({
        productId: pId,
        name_ar: it.name_ar,
        diffUnits: diffQty // positive means customer needs more -> deduct more; negative means return
      });
    }
    oldItemsMap.delete(pId);
  });

  // Any remaining old items were completely removed
  oldItemsMap.forEach((oldQty, pId) => {
    stockAdjustments.push({
      productId: pId,
      name_ar: 'منتج محذوف',
      diffUnits: -oldQty // return to stock
    });
  });

  // Audit trail entry
  const auditEntry = {
    id: `audit-approve-${Date.now()}`,
    type: 'modification_approved',
    author: adminName,
    version_number: targetVersion.version_number,
    version_id: versionId,
    timestamp: now.toISOString(),
    date_formatted: dateFormatted,
    previous_total: currentVersion?.total || order.total_price || 0,
    new_total: targetVersion.total,
    difference: targetVersion.total - (currentVersion?.total || order.total_price || 0),
    order_status: order.status
  };

  let existingMeta = {};
  if (order.status_note) {
    try {
      existingMeta = typeof order.status_note === 'string' ? JSON.parse(order.status_note) : order.status_note;
    } catch (_) {}
  }

  const updatedEditHistory = [auditEntry, ...(existingMeta.edit_history || [])];

  const updatedStatusNote = JSON.stringify({
    ...existingMeta,
    order_versions: updatedVersions,
    current_version_id: versionId,
    pending_version_id: null,
    last_approved_at: now.toISOString(),
    last_approved_by: adminName,
    edit_history: updatedEditHistory
  });

  const approvedVersion = updatedVersions.find(v => v.id === versionId) || { ...targetVersion, status: 'approved' };

  return {
    updatePayload: {
      items: targetVersion.items,
      subtotal: targetVersion.subtotal,
      total_price: targetVersion.total,
      total: targetVersion.total,
      status_note: updatedStatusNote,
      updated_at: now.toISOString()
    },
    targetVersion: approvedVersion,
    approvedVersion,
    stockAdjustments,
    auditEntry
  };
};

/**
 * Builds the payload for ADMIN REJECTION of a proposed version.
 * Marks proposed version as REJECTED.
 * Official order items and total remain COMPLETELY UNCHANGED.
 *
 * @param {Object} params
 * @param {Object} params.order
 * @param {string} params.versionId
 * @param {string} [params.rejectionReason]
 * @param {string} [params.adminName]
 * @returns {Object} Database update payload
 */
export const buildRejectModificationPayload = ({ order, versionId, rejectionReason = '', reason = '', adminName = 'الأدمن' }) => {
  const finalReason = rejectionReason || reason || '';
  const { versions, currentVersion } = parseOrderVersioning(order);

  const targetVersion = versions.find(v => v.id === versionId);
  if (!targetVersion) {
    throw new Error(`Version ${versionId} not found`);
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('ar-LY') + ' ' + now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });

  // Update target version to rejected
  const updatedVersions = versions.map(v => {
    if (v.id === versionId) {
      return {
        ...v,
        status: 'rejected',
        rejected_at: now.toISOString(),
        rejected_by: adminName,
        rejection_reason: finalReason || null
      };
    }
    return v;
  });

  // Audit trail entry
  const auditEntry = {
    id: `audit-reject-${Date.now()}`,
    type: 'modification_rejected',
    author: adminName,
    version_number: targetVersion.version_number,
    version_id: versionId,
    rejection_reason: rejectionReason || 'تم الرفض بواسطة الإدارة',
    timestamp: now.toISOString(),
    date_formatted: dateFormatted,
    maintained_total: currentVersion?.total || order.total_price || 0,
    order_status: order.status
  };

  let existingMeta = {};
  if (order.status_note) {
    try {
      existingMeta = typeof order.status_note === 'string' ? JSON.parse(order.status_note) : order.status_note;
    } catch (_) {}
  }

  const updatedEditHistory = [auditEntry, ...(existingMeta.edit_history || [])];

  const updatedStatusNote = JSON.stringify({
    ...existingMeta,
    order_versions: updatedVersions,
    current_version_id: currentVersion?.id || 'v1',
    pending_version_id: null,
    last_rejected_at: now.toISOString(),
    last_rejected_by: adminName,
    rejection_reason: rejectionReason || null,
    edit_history: updatedEditHistory
  });

  const rejectedVersion = updatedVersions.find(v => v.id === versionId) || { ...targetVersion, status: 'rejected' };

  return {
    updatePayload: {
      status_note: updatedStatusNote,
      updated_at: now.toISOString()
    },
    targetVersion: rejectedVersion,
    rejectedVersion,
    auditEntry
  };
};
