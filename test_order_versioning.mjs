// test_order_versioning.mjs
// Comprehensive end-to-end unit and flow verification for Direct Order Editing & Versioning

import assert from 'assert';

import {
  isOrderEditable,
  computeOrderComparison,
  buildSubmitModificationPayload,
  buildApproveModificationPayload,
  buildRejectModificationPayload,
  parseOrderVersioning
} from './src/utils/orderVersioning.js';

console.log('🧪 Starting Direct Order Editing & Versioning Tests...\n');

// 1. TEST EDITABILITY
console.log('Test 1: Order Editability Rules');
assert.strictEqual(isOrderEditable({ status: 'pending_review' }).allowed, true);
assert.strictEqual(isOrderEditable({ status: 'accepted' }).allowed, true);
assert.strictEqual(isOrderEditable({ status: 'preparing' }).allowed, false);
assert.strictEqual(isOrderEditable({ status: 'delivered' }).allowed, false);
assert.strictEqual(isOrderEditable({ status: 'cancelled' }).allowed, false);
console.log('✅ Editability rules passed.');

// 2. TEST INITIAL ORDER (Version 1)
console.log('\nTest 2: Parse order without prior version history');
const initialOrder = {
  id: 'order-123',
  order_number: '40515629',
  status: 'accepted',
  total_price: 100,
  shipping_fee: 10,
  status_note: null,
  items: [
    { productId: 'prod-mirror', name_ar: 'مرآة فحص', quantity: 1, price: 20 },
    { productId: 'prod-probe', name_ar: 'مسبار أسناني', quantity: 2, price: 40 }
  ]
};

const vInit = parseOrderVersioning(initialOrder);
assert.strictEqual(vInit.hasPending, false);
assert.strictEqual(vInit.currentVersion.version_number, 1);
assert.strictEqual(vInit.currentVersion.items.length, 2);
assert.strictEqual(vInit.versions.length, 1);
console.log('✅ Initial order parsed as Canonical Version 1.');

// 3. TEST SUBMIT MODIFICATION (Creates Version 2 pending_review)
console.log('\nTest 3: Customer submits modification -> Version 2 (Pending Review)');
const modifiedItems = [
  { productId: 'prod-mirror', name_ar: 'مرآة فحص', quantity: 2, price: 20 }, // qty changed 1 -> 2 (+20)
  // prod-probe removed (-80)
  { productId: 'prod-tweezers', name_ar: 'ملقط جراحي', quantity: 1, price: 50 } // new item added (+50)
];
const proposedTotal = 90 + 10; // (2*20) + (1*50) = 90 subtotal + 10 shipping_fee = 100

const submitResult = buildSubmitModificationPayload({
  order: initialOrder,
  proposedItems: modifiedItems,
  proposedTotal: proposedTotal,
  notes: 'أرجو تغيير الملقط وزيادة المرآة'
});

// Verify official order items and total ARE NOT modified yet
assert.strictEqual(submitResult.updatePayload.total_price, undefined, 'Official total_price must NOT change upon submit');
assert.strictEqual(submitResult.updatePayload.items, undefined, 'Official items must NOT change upon submit');
assert.strictEqual(submitResult.updatePayload.status, undefined, 'Official status must NOT change upon submit');
assert.strictEqual(submitResult.newVersion.version_number, 2);
assert.strictEqual(submitResult.newVersion.status, 'pending_review');

// Simulate order state in DB with pending version
const orderWithPendingV2 = {
  ...initialOrder,
  ...submitResult.updatePayload
};

const vPending = parseOrderVersioning(orderWithPendingV2);
assert.strictEqual(vPending.hasPending, true);
assert.strictEqual(vPending.pendingVersion.version_number, 2);
assert.strictEqual(vPending.currentVersion.version_number, 1);
console.log('✅ Version 2 successfully created as pending_review without touching official order state.');

// 4. TEST SMART DIFF CALCULATION
console.log('\nTest 4: Smart Diff Comparison Engine');
const diff = computeOrderComparison(vPending.currentVersion.items, vPending.pendingVersion.items);
assert.strictEqual(diff.hasChanges, true);
assert.strictEqual(diff.added.length, 1, 'Should detect 1 added item (tweezers)');
assert.strictEqual(diff.added[0].productId, 'prod-tweezers');
assert.strictEqual(diff.removed.length, 1, 'Should detect 1 removed item (probe)');
assert.strictEqual(diff.removed[0].productId, 'prod-probe');
assert.strictEqual(diff.qtyChanged.length, 1, 'Should detect 1 quantity changed (mirror: 1 -> 2)');
assert.strictEqual(diff.qtyChanged[0].diffQty, 1);
console.log('✅ Smart diff accurately calculated additions, removals, and quantity deltas.');

// 5. TEST ADMIN APPROVAL OF VERSION 2
console.log('\nTest 5: Admin Approves Version 2');
const approveResult = buildApproveModificationPayload({
  order: orderWithPendingV2,
  versionId: vPending.pendingVersion.id,
  adminName: 'مدير النظام'
});

// Verify official order is now updated to proposed items & total
assert.strictEqual(approveResult.updatePayload.total_price, proposedTotal);
assert.strictEqual(approveResult.updatePayload.items.length, 2);
assert.strictEqual(approveResult.updatePayload.status, undefined, 'Order lifecycle status must NOT be altered');
assert.strictEqual(approveResult.targetVersion.status, 'approved');

// Verify stock diffs:
// Mirror: 1 -> 2 (diffUnits: +1)
// Probe: 2 -> 0 (diffUnits: -2)
// Tweezers: 0 -> 1 (diffUnits: +1)
const mirrorStockAdj = approveResult.stockAdjustments.find(a => a.productId === 'prod-mirror');
const probeStockAdj = approveResult.stockAdjustments.find(a => a.productId === 'prod-probe');
const tweezerStockAdj = approveResult.stockAdjustments.find(a => a.productId === 'prod-tweezers');
assert.strictEqual(mirrorStockAdj.diffUnits, 1);
assert.strictEqual(probeStockAdj.diffUnits, -2);
assert.strictEqual(tweezerStockAdj.diffUnits, 1);
console.log('✅ Version 2 approved: official order updated, inventory differences accurately isolated.');

// 6. TEST SIMULATION OF SUBSEQUENT MODIFICATION (Version 3) & REJECTION
console.log('\nTest 6: Customer modifies again (Version 3) and Admin Rejects');
const orderWithV2Approved = {
  ...orderWithPendingV2,
  ...approveResult.updatePayload
};

const v2State = parseOrderVersioning(orderWithV2Approved);
assert.strictEqual(v2State.hasPending, false);
assert.strictEqual(v2State.currentVersion.version_number, 2);

// Customer submits Version 3
const submitV3 = buildSubmitModificationPayload({
  order: orderWithV2Approved,
  proposedItems: [{ productId: 'prod-mirror', name_ar: 'مرآة فحص', quantity: 5, price: 20 }],
  proposedTotal: 100,
  notes: 'أريد 5 مرايا'
});

const orderWithPendingV3 = {
  ...orderWithV2Approved,
  ...submitV3.updatePayload
};

const v3PendingState = parseOrderVersioning(orderWithPendingV3);
assert.strictEqual(v3PendingState.hasPending, true);
assert.strictEqual(v3PendingState.pendingVersion.version_number, 3);
assert.strictEqual(v3PendingState.currentVersion.version_number, 2);

// Admin Rejects Version 3
const rejectResult = buildRejectModificationPayload({
  order: orderWithPendingV3,
  versionId: v3PendingState.pendingVersion.id,
  reason: 'الكمية المطلوبة غير متوفرة حالياً بالمخزن',
  adminName: 'مدير النظام'
});

assert.strictEqual(rejectResult.updatePayload.items, undefined, 'Items must not change on rejection');
assert.strictEqual(rejectResult.updatePayload.total_price, undefined, 'Total price must not change on rejection');

const orderAfterRejection = {
  ...orderWithPendingV3,
  ...rejectResult.updatePayload
};

const vAfterReject = parseOrderVersioning(orderAfterRejection);
assert.strictEqual(vAfterReject.hasPending, false);
assert.strictEqual(vAfterReject.currentVersion.version_number, 2, 'Version 2 must remain official version');
const rejectedV3 = vAfterReject.versions.find(v => v.version_number === 3);
assert.strictEqual(rejectedV3.status, 'rejected');
assert.strictEqual(rejectedV3.rejection_reason, 'الكمية المطلوبة غير متوفرة حالياً بالمخزن');

console.log('✅ Version 3 rejected properly: Version 2 remained official, reason was documented.');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Direct Order Editing & Versioning architecture is bulletproof.\n');
