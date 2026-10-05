import React, { createContext, useState, useEffect, useContext } from 'react';

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
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Enforce maximum stock check if available
        const newQty = existing.quantity + qty;
        const finalQty = product.stock_quantity !== undefined && newQty > product.stock_quantity
          ? product.stock_quantity
          : newQty;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: finalQty } : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
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
