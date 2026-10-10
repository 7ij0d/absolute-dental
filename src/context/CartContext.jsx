import React, { createContext, useState, useEffect, useContext } from 'react';
import { isBundleProduct, getBundleDefinition } from '../utils/productInventoryEngine';
import defaultProductsList from '../defaultProducts.json';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('smylodent_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingOrder, setEditingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('smylodent_editing_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('smylodent_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (editingOrder) {
      localStorage.setItem('smylodent_editing_order', JSON.stringify(editingOrder));
    } else {
      localStorage.removeItem('smylodent_editing_order');
    }
  }, [editingOrder]);

  const startEditingOrder = (order) => {
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
  };

  const cancelEditingOrder = () => {
    setEditingOrder(null);
    setCartItems([]);
  };

  const isEditingOrder = Boolean(editingOrder);

  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const isOffer = isBundleProduct(product.id);
      const bundleDef = isOffer ? getBundleDefinition(product.id) : null;

      const cartLineId = product.cart_line_id || (isOffer ? `bundle_${product.id}` : product.id);
      const existing = prev.find((item) => (item.cart_line_id ? item.cart_line_id === cartLineId : item.id === product.id));

      const isByOrder = product.availability === 'by_order';
      const maxAllowed = isByOrder
        ? 999
        : (product.effectiveStock !== undefined
          ? product.effectiveStock
          : (isOffer ? 999 : (product.stock_quantity !== undefined ? product.stock_quantity : 999)));

      if (existing) {
        const newQty = existing.quantity + qty;
        const finalQty = maxAllowed !== undefined && newQty > maxAllowed ? maxAllowed : newQty;
        return prev.map((item) => {
          const match = item.cart_line_id ? item.cart_line_id === cartLineId : item.id === product.id;
          return match ? { ...item, ...product, quantity: Math.max(1, finalQty) } : item;
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
  };

  /**
   * Smart synchronization: When an individual component bur belonging to a bundle is removed,
   * dissolve that bundle representation, remove the component, and keep the remaining components
   * as individual items in the cart at their individual prices.
   */
  const removeBundleComponent = (cartLineId, componentProductId) => {
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
          // Find canonical product details from default catalog
          const catalogProd = defaultProductsList.find(p => p.id === comp.productId) || {};
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
  };

  const removeFromCart = (idOrCartLineId) => {
    setCartItems((prev) => prev.filter((item) => (item.cart_line_id ? item.cart_line_id !== idOrCartLineId : item.id !== idOrCartLineId) && item.id !== idOrCartLineId));
  };

  const updateQuantity = (idOrCartLineId, qty) => {
    if (qty <= 0) {
      removeFromCart(idOrCartLineId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        const match = item.cart_line_id ? item.cart_line_id === idOrCartLineId : item.id === idOrCartLineId;
        if (!match) return item;

        const isByOrder = item.availability === 'by_order';
        const isOffer = item.is_bundle || isBundleProduct(item.bundle_id || item.id);
        const maxAllowed = isByOrder
          ? 999
          : (item.effectiveStock !== undefined
            ? item.effectiveStock
            : (isOffer ? 999 : (item.stock_quantity !== undefined ? item.stock_quantity : 999)));
        const finalQty = maxAllowed !== undefined && qty > maxAllowed ? maxAllowed : qty;
        return { ...item, quantity: Math.max(1, finalQty) };
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Computations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalComparePrice = cartItems.reduce((sum, item) => {
    const original = item.compare_at_price || item.price;
    return sum + original * item.quantity;
  }, 0);
  const totalDiscount = totalComparePrice - subtotal;
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        removeBundleComponent,
        clearCart,
        subtotal,
        totalComparePrice,
        totalDiscount,
        cartCount,
        editingOrder,
        isEditingOrder,
        startEditingOrder,
        cancelEditingOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
