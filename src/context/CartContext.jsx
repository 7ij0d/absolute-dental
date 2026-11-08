import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import {
  isBundleProduct,
  getBundleDefinition,
  isProductHiddenFromStore,
  isProductOutOfStock,
  syncLiveProductStates,
  applyLiveProductState
} from '../utils/productInventoryEngine';
import { isBoxProduct } from '../utils/boxInventoryEngine';
import { cacheGet } from '../cache';
import supabase from '../supabaseClient';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('smylodent_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Strict safety sanitize: clean up any legacy items where Isolation Gown had Rubber Dam variants attached
      return parsed.map(item => {
        if (item && (item.id === '33000000-0000-0000-0000-000000000112' || item.base_product_id === '33000000-0000-0000-0000-000000000112' || String(item.id).startsWith('33000000-0000-0000-0000-000000000112-'))) {
          const isGown = /gown|جاون/i.test(`${item.name_en || ''} ${item.name_ar || ''}`);
          if (isGown) {
            return {
              ...item,
              id: '33000000-0000-0000-0000-000000000112',
              base_product_id: undefined,
              selected_size: undefined,
              selected_color: undefined,
              name_en: 'Disposable Dental Isolation Gown (Blue)',
              name_ar: 'جاون وقائي طبي للاستخدام مرة واحدة (أزرق) - Dental Isolation Gown'
            };
          }
        }
        return item;
      });
    } catch {
      return [];
    }
  });

  const [editingOrder, setEditingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('smylodent_editing_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Ref to always access latest cartItems without re-creating callbacks on every cart change
  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;

  // Anti-duplicate tap guard: prevents double-adding when a mobile user double-taps "Add to Cart" within 250ms
  const lastAddTapRef = useRef({ key: '', time: 0 });

  // Persist cart asynchronously after paint so UI updates at 0ms without synchronous JSON.stringify blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('smylodent_cart', JSON.stringify(cartItems));
      } catch (_) {}
    }, 16);
    return () => clearTimeout(timer);
  }, [cartItems]);

  useEffect(() => {
    try {
      if (editingOrder) {
        localStorage.setItem('smylodent_editing_order', JSON.stringify(editingOrder));
      } else {
        localStorage.removeItem('smylodent_editing_order');
      }
    } catch (_) {}
  }, [editingOrder]);

  const startEditingOrder = useCallback((order) => {
    if (!order) return;

    // Extract items safely from order.items or order_items
    let orderItems = [];
    if (Array.isArray(order.items) && order.items.length > 0) {
      orderItems = order.items.map((it) => ({
        id: it.id,
        name_ar: it.name_ar,
        name_en: it.name_en,
        price: parseFloat(it.price) || 0,
        compare_at_price: it.compare_at_price ? parseFloat(it.compare_at_price) : null,
        quantity: Math.max(1, parseInt(it.quantity) || 1),
        image_url: it.image_url || '',
        is_accessory: Boolean(it.is_accessory)
      }));
    } else if (Array.isArray(order.order_items)) {
      orderItems = order.order_items.map((oi) => ({
        id: oi.product_id || oi.products?.id || oi.id,
        name_ar: oi.products?.name_ar || oi.name_ar || 'منتج',
        name_en: oi.products?.name_en || oi.name_en || 'Product',
        price: parseFloat(oi.price) || 0,
        compare_at_price: oi.products?.compare_at_price ? parseFloat(oi.products.compare_at_price) : null,
        quantity: Math.max(1, parseInt(oi.quantity) || 1),
        image_url: oi.products?.main_image_url || oi.image_url || '',
        is_accessory: Boolean(oi.is_accessory)
      }));
    }

    const orderMeta = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_phone_secondary: order.customer_phone_secondary,
      customer_email: order.customer_email,
      university: order.university,
      college: order.college,
      notes: order.notes,
      address_text: order.address_text,
      latitude: order.latitude,
      longitude: order.longitude,
      total_price: order.total_price || order.total,
      shipping_fee: order.shipping_fee || 0,
      discount_amount: order.discount_amount || 0,
      status: order.status,
      status_note: order.status_note,
      original_items: orderItems
    };

    setEditingOrder(orderMeta);
    setCartItems(orderItems);
  }, []);

  const cancelEditingOrder = useCallback(() => {
    setEditingOrder(null);
    setCartItems([]);
  }, []);

  const isEditingOrder = Boolean(editingOrder);

  const addToCart = useCallback((product, qty = 1) => {
    if (!product) return;

    const isOffer = isBundleProduct(product.id);
    const cartLineId = product.cart_line_id || (isOffer ? `bundle_${product.id}` : product.id);

    // Prevent accidental double-add when rapidly tapping the same Add button (< 250ms)
    const now = Date.now();
    if (lastAddTapRef.current.key === String(cartLineId) && now - lastAddTapRef.current.time < 250) {
      return;
    }
    lastAddTapRef.current = { key: String(cartLineId), time: now };

    setCartItems((prev) => {
      // 0. Strict product status check: Never allow adding hidden or out-of-stock products to cart
      const liveProd = applyLiveProductState(product);
      if (isProductHiddenFromStore(liveProd) || isProductOutOfStock(liveProd)) {
        console.warn('Blocked adding unavailable or hidden product to cart:', liveProd);
        return prev;
      }

      // 1. Strict box product stock check: Zero stock box variants can NEVER be added to cart
      const isBox = Boolean(product.is_box || isBoxProduct(product) || isBoxProduct(product.base_product_id));
      if (isBox) {
        const boxStock = product.availableStock !== undefined
          ? product.availableStock
          : (product.available_stock !== undefined
            ? product.available_stock
            : (product.stock_quantity !== undefined ? product.stock_quantity : 0));
        if (boxStock <= 0) {
          console.warn('Blocked adding zero-stock dental box variant to cart:', product);
          return prev;
        }
      }

      const bundleDef = isOffer ? getBundleDefinition(product.id) : null;
      const existing = prev.find((item) => (item.cart_line_id ? item.cart_line_id === cartLineId : item.id === product.id));

      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((item) => {
          const match = item.cart_line_id ? item.cart_line_id === cartLineId : item.id === product.id;
          return match ? { ...item, ...product, quantity: Math.max(1, newQty) } : item;
        });
      }

      const bundleComponents = bundleDef ? bundleDef.components.map(c => ({
        productId: c.productId,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        quantity: c.quantity,
        normalPrice: c.normalPrice,
        imageUrl: c.imageUrl
      })) : null;

      const newItem = {
        ...product,
        cart_line_id: cartLineId,
        is_bundle: Boolean(isOffer),
        bundle_id: isOffer ? product.id : null,
        bundle_components: bundleComponents,
        quantity: Math.max(1, qty),
        price: isOffer && bundleDef?.bundlePrice !== undefined ? bundleDef.bundlePrice : product.price
      };

      return [...prev, newItem];
    });
  }, []);

  /**
   * Smart synchronization: When an individual component bur belonging to a bundle is removed,
   * dissolve that bundle representation, remove the component, and keep the remaining components
   * as individual items in the cart at their individual prices.
   */
  const removeBundleComponent = useCallback((cartLineId, componentProductId) => {
    setCartItems((prev) => {
      const bundleItem = prev.find(it => (it.cart_line_id === cartLineId || it.id === cartLineId) && (it.is_bundle || isBundleProduct(it.id)));
      if (!bundleItem) return prev;

      const bundleDef = getBundleDefinition(bundleItem.bundle_id || bundleItem.id);
      if (!bundleDef) {
        return prev.filter(it => (it.cart_line_id ? it.cart_line_id !== cartLineId : it.id !== cartLineId));
      }

      // Remaining components of this bundle instance (excluding the removed component)
      const remainingComponents = bundleDef.components.filter(c => c.productId !== componentProductId);

      // 1. Remove the intact bundle line item
      const listWithoutBundle = prev.filter(it => (it.cart_line_id ? it.cart_line_id !== cartLineId : it.id !== cartLineId));

      // 2. Add each remaining component as an individual cart item
      const newItems = [...listWithoutBundle];
      const cachedProds = cacheGet('products:all') || [];

      remainingComponents.forEach(comp => {
        const compQty = comp.quantity * bundleItem.quantity;
        const existingCompIndex = newItems.findIndex(it => (it.id === comp.productId || it.cart_line_id === comp.productId) && !it.is_bundle);

        if (existingCompIndex >= 0) {
          // Merge quantity into existing standalone bur
          newItems[existingCompIndex] = {
            ...newItems[existingCompIndex],
            quantity: newItems[existingCompIndex].quantity + compQty
          };
        } else {
          // Find canonical product details from cached catalog or component metadata
          const catalogProd = cachedProds.find(p => p.id === comp.productId) || {};
          newItems.push({
            id: comp.productId,
            cart_line_id: comp.productId,
            name_ar: comp.nameAr || catalogProd.name_ar || comp.nameEn,
            name_en: comp.nameEn || catalogProd.name_en,
            price: comp.normalPrice || catalogProd.price || 2,
            compare_at_price: catalogProd.compare_at_price || null,
            image_url: comp.imageUrl || catalogProd.image_url || '',
            quantity: compQty,
            is_bundle: false
          });
        }
      });

      return newItems;
    });
  }, []);

  const removeFromCart = useCallback((idOrCartLineId) => {
    setCartItems((prev) => prev.filter((item) => (item.cart_line_id ? item.cart_line_id !== idOrCartLineId : item.id !== idOrCartLineId) && item.id !== idOrCartLineId));
  }, []);

  const updateQuantity = useCallback((idOrCartLineId, qty) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((item) => (item.cart_line_id ? item.cart_line_id !== idOrCartLineId : item.id !== idOrCartLineId) && item.id !== idOrCartLineId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        const match = item.cart_line_id ? item.cart_line_id === idOrCartLineId : item.id === idOrCartLineId;
        if (!match) return item;
        // Block increasing quantity if the product is unavailable or hidden
        if (qty > item.quantity) {
          const liveItem = applyLiveProductState(item);
          if (isProductHiddenFromStore(liveItem) || isProductOutOfStock(liveItem)) {
            return item;
          }
        }
        return { ...item, quantity: Math.max(1, qty) };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  /**
   * Queries Supabase for live availability/visibility & price of all items currently in the cart.
   * Called on CartPage and CheckoutPage (and once on initial load if cart is non-empty).
   * Does NOT fire on every Add-to-Cart click so mobile adding stays 0ms!
   */
  const refreshCartStatuses = useCallback(async () => {
    const currentCart = cartItemsRef.current;
    if (!currentCart || currentCart.length === 0) return [];
    try {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const idsSet = new Set();
      currentCart.forEach(item => {
        const baseId = item.base_product_id || (typeof item.id === 'string' && item.id.length > 36 && item.id.includes('-') ? item.id.substring(0, 36) : item.id);
        if (baseId && UUID_REGEX.test(String(baseId))) idsSet.add(String(baseId));
        const bId = item.bundle_id || item.id;
        if (isBundleProduct(bId)) {
          const bDef = getBundleDefinition(bId);
          if (bDef && Array.isArray(bDef.components)) {
            bDef.components.forEach(c => {
              if (c.productId && UUID_REGEX.test(String(c.productId))) idsSet.add(String(c.productId));
            });
          }
        }
      });

      const ids = Array.from(idsSet);
      if (ids.length === 0) return [];

      const { data: dbProds } = await supabase
        .from('products')
        .select('id, name_ar, name_en, price, compare_at_price, stock_quantity, availability, is_active, is_archived')
        .in('id', ids);

      if (Array.isArray(dbProds) && dbProds.length > 0) {
        syncLiveProductStates(dbProds);
        const dbMap = new Map(dbProds.map(p => [String(p.id), p]));
        setCartItems(prev => {
          let changed = false;
          const next = prev.map(item => {
            const baseId = item.base_product_id || (typeof item.id === 'string' && item.id.length > 36 && item.id.includes('-') ? item.id.substring(0, 36) : item.id);
            const dbP = baseId ? dbMap.get(String(baseId)) : null;
            if (!dbP) return item;
            const nextAvail = dbP.availability || 'available';
            const nextActive = dbP.is_active !== false;
            const nextArch = Boolean(dbP.is_archived);
            const isOffer = Boolean(item.is_bundle || isBundleProduct(item.bundle_id || item.id));
            const nextPrice = (!isOffer && typeof dbP.price === 'number' && dbP.price > 0) ? dbP.price : item.price;

            if (item.availability !== nextAvail || item.is_active !== nextActive || item.is_archived !== nextArch || item.price !== nextPrice) {
              changed = true;
              return {
                ...item,
                price: nextPrice,
                availability: nextAvail,
                is_active: nextActive,
                is_archived: nextArch
              };
            }
            return item;
          });
          return changed ? next : prev;
        });
        return dbProds;
      }
    } catch (err) {
      console.warn('Cart live status check notice:', err);
    }
    return [];
  }, []);

  // Verify cart once on initial app mount if cart already has items (deferred so it never blocks first paint)
  useEffect(() => {
    if (cartItemsRef.current.length > 0) {
      const t = setTimeout(() => {
        refreshCartStatuses();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [refreshCartStatuses]);

  // Identify any items in the cart that are currently out of stock or hidden from the store
  const unavailableCartItems = useMemo(() => {
    return cartItems.filter(item => {
      if (item.is_box || item.is_accessory) return false;
      const liveItem = applyLiveProductState(item);
      return isProductHiddenFromStore(liveItem) || isProductOutOfStock(liveItem);
    });
  }, [cartItems]);

  // Computations
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const totalComparePrice = useMemo(() => cartItems.reduce((sum, item) => {
    const original = item.compare_at_price || item.price;
    return sum + original * item.quantity;
  }, 0), [cartItems]);
  const totalDiscount = totalComparePrice - subtotal;
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    removeBundleComponent,
    clearCart,
    refreshCartStatuses,
    unavailableCartItems,
    subtotal,
    totalComparePrice,
    totalDiscount,
    cartCount,
    editingOrder,
    isEditingOrder,
    startEditingOrder,
    cancelEditingOrder
  }), [
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    removeBundleComponent,
    clearCart,
    refreshCartStatuses,
    unavailableCartItems,
    subtotal,
    totalComparePrice,
    totalDiscount,
    cartCount,
    editingOrder,
    isEditingOrder,
    startEditingOrder,
    cancelEditingOrder
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
