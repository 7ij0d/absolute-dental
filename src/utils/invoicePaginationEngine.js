/**
 * ABSOLUTE DENTAL — AUTHORITATIVE INVOICE NORMALIZATION & PAGINATION ENGINE
 *
 * Implements:
 * 1. Immutable normalization of order items with stable line item IDs.
 * 2. Clean, row-aware multi-page pagination.
 * 3. Elimination of row duplication across page boundaries.
 * 4. Guaranteeing Totals render ONLY on the final page of the invoice.
 */

import { isBundleProduct, getBundleDefinition } from './productInventoryEngine.js';

/**
 * Normalizes order items into an immutable array with stable line item IDs.
 * Guarantees that the original order.items / order.order_items array is NEVER mutated.
 */
export function normalizeOrderItems(order) {
  if (!order) return [];
  const rawList = (order.order_items && order.order_items.length > 0)
    ? order.order_items
    : (Array.isArray(order.items) ? order.items : []);

  return rawList.map((item, index) => {
    // Resolve matching snapshot item safely by id, NEVER blindly by index!
    const snapshotItem = Array.isArray(order.items)
      ? (order.items.find((si) =>
          (si.id && item.product_id && String(si.id) === String(item.product_id)) ||
          (si.productId && item.product_id && String(si.productId) === String(item.product_id)) ||
          (si.id && item.id && String(si.id) === String(item.id))
        ) || order.items[index] || null)
      : null;

    const productId = item.product_id || item.productId || item.products?.id || item.id || snapshotItem?.id || `prod_${index}`;
    const nameAr = item.products?.name_ar || item.name_ar || snapshotItem?.name_ar || item.products?.name_en || item.name_en || snapshotItem?.name_en || 'أداة طب أسنان';
    const nameEn = item.products?.name_en || item.name_en || snapshotItem?.name_en || item.products?.name_ar || item.name_ar || snapshotItem?.name_ar || 'Dental Instrument';
    const price = parseFloat(item.price ?? snapshotItem?.price ?? item.products?.price ?? 0) || 0;
    const quantity = Math.max(1, parseInt(item.quantity ?? item.qty ?? snapshotItem?.quantity ?? 1) || 1);
    const imageUrl = item.products?.main_image_url || item.products?.image_url || item.image_url || snapshotItem?.image_url || '';
    const sellingUnit = item.selling_unit || item.sellingUnit || snapshotItem?.selling_unit || snapshotItem?.sellingUnit || null;

    const isBundle = Boolean(item.is_bundle || snapshotItem?.is_bundle || isBundleProduct(item.bundle_id || snapshotItem?.bundle_id || productId));
    const bundleDef = isBundle ? getBundleDefinition(item.bundle_id || snapshotItem?.bundle_id || productId) : null;
    const bundleComponents = item.bundle_components || snapshotItem?.bundle_components || bundleDef?.components || null;

    return {
      lineItemId: `line_${index}_${productId}`,
      index,
      productId,
      nameAr,
      nameEn,
      price,
      quantity,
      lineTotal: price * quantity,
      imageUrl,
      sellingUnit,
      isBundle,
      bundleComponents
    };
  });
}

/**
 * Clean, row-aware multi-page pagination engine for invoices.
 * Guarantees:
 * 1. An item is NEVER split or rendered half on Page 1 and half on Page 2.
 * 2. If an item cannot fit on Page 1, the entire row is moved cleanly to Page 2.
 * 3. Page 2 starts with the first item that could not fit on Page 1.
 * 4. Zero duplicate items across pages.
 * 5. Totals section is rendered ONLY on the final page of the invoice.
 */
export function paginateInvoiceItems(invoiceItems) {
  if (!invoiceItems || invoiceItems.length === 0) {
    return [{
      pageNumber: 1,
      totalPages: 1,
      items: [],
      isFirstPage: true,
      isLastPage: true
    }];
  }

  // Row quotas per page
  // Page 1 has large header + student/company info cards:
  // If items <= 8, all fit on 1 page with Totals and Footer.
  const PAGE_1_SINGLE_LIMIT = 8;
  const PAGE_1_MULTI_LIMIT = 7;
  const PAGE_N_LAST_LIMIT = 10;
  const PAGE_N_MIDDLE_LIMIT = 13;

  if (invoiceItems.length <= PAGE_1_SINGLE_LIMIT) {
    return [{
      pageNumber: 1,
      totalPages: 1,
      items: [...invoiceItems],
      isFirstPage: true,
      isLastPage: true
    }];
  }

  const pages = [];
  let remaining = [...invoiceItems];

  // Page 1: Header + Info cards + first chunk
  const page1Items = remaining.slice(0, PAGE_1_MULTI_LIMIT);
  remaining = remaining.slice(PAGE_1_MULTI_LIMIT);
  pages.push({
    pageNumber: 1,
    items: page1Items,
    isFirstPage: true,
    isLastPage: false
  });

  // Subsequent pages
  while (remaining.length > 0) {
    if (remaining.length <= PAGE_N_LAST_LIMIT) {
      pages.push({
        pageNumber: pages.length + 1,
        items: remaining,
        isFirstPage: false,
        isLastPage: true
      });
      remaining = [];
    } else {
      const chunk = remaining.slice(0, PAGE_N_MIDDLE_LIMIT);
      remaining = remaining.slice(PAGE_N_MIDDLE_LIMIT);
      pages.push({
        pageNumber: pages.length + 1,
        items: chunk,
        isFirstPage: false,
        isLastPage: remaining.length === 0
      });
    }
  }

  const totalPages = pages.length;
  pages.forEach((p) => {
    p.totalPages = totalPages;
  });

  // Pre-render development validation check
  const renderedCount = pages.reduce((sum, p) => sum + p.items.length, 0);
  if (renderedCount !== invoiceItems.length) {
    console.error(`[Invoice Pagination Error] Item count mismatch! Expected ${invoiceItems.length}, got ${renderedCount}`);
  }

  return pages;
}
