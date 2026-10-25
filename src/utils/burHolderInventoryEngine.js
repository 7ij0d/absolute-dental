import supabase from '../supabaseClient.js';

/**
 * ABSOLUTE DENTAL — BUR HOLDER RANDOM-COLOR & INVENTORY MANAGEMENT ENGINE
 * 
 * Rules:
 * 1. Product is sold with random color based on available stock.
 * 2. Customer CANNOT choose the color upon ordering.
 * 3. Store displays clear notice: «الألوان تُرسل عشوائيًا حسب المتوفر في المخزون، ولا يمكن اختيار لون محدد.»
 * 4. Admin registers and tracks stock for each of the 3 colors:
 *    - أصفر (Yellow)
 *    - أبيض (White)
 *    - وردي (Pink)
 * 5. Order fulfillment allows assigning the actual dispatched color and deducting 1 unit from that color.
 */

export const BUR_HOLDER_PRODUCT_ID = '50c5fac9-de64-452d-85ac-c6cce3496793';
export const BUR_HOLDER_SKU = 'BUR-HOLDER-MIX-001';

export const BUR_HOLDER_COLORS = [
  { id: 'yellow', name_ar: 'أصفر', name_en: 'Yellow', color_hex: '#FACC15', emoji: '🟡' },
  { id: 'white',  name_ar: 'أبيض', name_en: 'White',  color_hex: '#F8FAFC', emoji: '⚪' },
  { id: 'pink',   name_ar: 'وردي', name_en: 'Pink',   color_hex: '#F472B6', emoji: '🌸' }
];

export const DEFAULT_COLOR_STOCKS = {
  yellow: 12,
  white: 12,
  pink: 12
};

export function isBurHolderProduct(productOrId) {
  if (!productOrId) return false;
  if (typeof productOrId === 'string') {
    return productOrId === BUR_HOLDER_PRODUCT_ID || productOrId.includes(BUR_HOLDER_SKU);
  }
  const id = productOrId.id || productOrId.product_id || '';
  const sku = productOrId.sku || '';
  const nameEn = productOrId.name_en || '';
  const details = productOrId.details_ar || productOrId.details_en || '';

  return (
    id === BUR_HOLDER_PRODUCT_ID ||
    sku === BUR_HOLDER_SKU ||
    details.includes(BUR_HOLDER_SKU) ||
    nameEn.toLowerCase() === 'bur holder'
  );
}

/**
 * Fetches the canonical color inventory for Bur Holder from settings table.
 */
export async function fetchBurHolderColorInventory() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'bur_holder_inventory')
      .maybeSingle();

    if (!error && data?.value?.stocks) {
      const stocks = data.value.stocks;
      const yellow = Math.max(0, parseInt(stocks.yellow, 10) || 0);
      const white = Math.max(0, parseInt(stocks.white, 10) || 0);
      const pink = Math.max(0, parseInt(stocks.pink, 10) || 0);
      return {
        yellow,
        white,
        pink,
        totalStock: yellow + white + pink,
        assignedOrders: data.value.assigned_orders || {}
      };
    }
  } catch (err) {
    console.warn('Could not fetch bur holder inventory:', err);
  }

  // Fallback default
  const total = DEFAULT_COLOR_STOCKS.yellow + DEFAULT_COLOR_STOCKS.white + DEFAULT_COLOR_STOCKS.pink;
  return {
    ...DEFAULT_COLOR_STOCKS,
    totalStock: total,
    assignedOrders: {}
  };
}

/**
 * Saves or updates the color inventory breakdown and keeps products.stock_quantity synced.
 */
export async function saveBurHolderColorInventory({ yellow, white, pink }) {
  const y = Math.max(0, parseInt(yellow, 10) || 0);
  const w = Math.max(0, parseInt(white, 10) || 0);
  const p = Math.max(0, parseInt(pink, 10) || 0);
  const total = y + w + p;

  // 1. Fetch current to preserve assigned_orders history
  const current = await fetchBurHolderColorInventory();

  const payload = {
    product_id: BUR_HOLDER_PRODUCT_ID,
    sku: BUR_HOLDER_SKU,
    stocks: {
      yellow: y,
      white: w,
      pink: p
    },
    total_stock: total,
    assigned_orders: current.assignedOrders || {},
    updated_at: new Date().toISOString()
  };

  const { error: settingsErr } = await supabase
    .from('settings')
    .upsert({
      key: 'bur_holder_inventory',
      value: payload
    });

  if (settingsErr) throw settingsErr;

  // 2. Sync total to products table
  try {
    await supabase
      .from('products')
      .update({
        stock_quantity: total,
        availability: total > 0 ? 'available' : 'unavailable'
      })
      .eq('id', BUR_HOLDER_PRODUCT_ID);
  } catch (err) {
    console.warn('Failed to sync bur holder total to products table:', err);
  }

  return { yellow: y, white: w, pink: p, totalStock: total };
}

/**
 * Assigns a specific color to a Bur Holder in an order and deducts 1 unit from that color.
 */
export async function assignBurHolderColorToOrder({ orderId, itemKey, colorId }) {
  if (!orderId || !colorId) throw new Error('Missing orderId or colorId');
  const validColor = BUR_HOLDER_COLORS.find(c => c.id === colorId);
  if (!validColor) throw new Error(`Invalid colorId: ${colorId}`);

  const current = await fetchBurHolderColorInventory();
  const currentStockForColor = current[colorId] || 0;

  const orderKey = `${orderId}_${itemKey || '0'}`;
  const previousAssignment = current.assignedOrders[orderKey];

  // If already assigned to this exact color, no stock change needed
  if (previousAssignment === colorId) {
    return { success: true, color: validColor, currentStocks: current };
  }

  const updatedStocks = {
    yellow: current.yellow,
    white: current.white,
    pink: current.pink
  };

  // If reverting from previous color, restore 1 unit
  if (previousAssignment && updatedStocks[previousAssignment] !== undefined) {
    updatedStocks[previousAssignment] += 1;
  }

  // Deduct 1 unit from new color
  if (updatedStocks[colorId] <= 0) {
    throw new Error(`نفذت كمية اللون (${validColor.name_ar}) من المخزون! يرجى اختيار لون آخر.`);
  }
  updatedStocks[colorId] -= 1;

  const updatedAssignments = {
    ...current.assignedOrders,
    [orderKey]: colorId
  };

  const total = updatedStocks.yellow + updatedStocks.white + updatedStocks.pink;

  const payload = {
    product_id: BUR_HOLDER_PRODUCT_ID,
    sku: BUR_HOLDER_SKU,
    stocks: updatedStocks,
    total_stock: total,
    assigned_orders: updatedAssignments,
    updated_at: new Date().toISOString()
  };

  await supabase
    .from('settings')
    .upsert({
      key: 'bur_holder_inventory',
      value: payload
    });

  try {
    await supabase
      .from('products')
      .update({
        stock_quantity: total,
        availability: total > 0 ? 'available' : 'unavailable'
      })
      .eq('id', BUR_HOLDER_PRODUCT_ID);
  } catch (_) {}

  return {
    success: true,
    assignedColor: validColor,
    newStocks: { ...updatedStocks, totalStock: total }
  };
}
