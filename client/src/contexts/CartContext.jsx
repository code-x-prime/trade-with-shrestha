'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const CartContext = createContext(null);

// Helper to get empty cart structure
const getEmptyCart = () => ({
  COURSE: [],
  BUNDLE: [],
  EBOOK: [],
  WEBINAR: [],
  GUIDANCE: [],
  MENTORSHIP: [],
  INDICATOR: [],
  OFFLINE_BATCH: [],
});

// Helper to load cart from localStorage
const loadCartFromStorage = () => {
  if (typeof window === 'undefined') {
    return getEmptyCart();
  }

  try {
    // Try to load from individual keys first (new system)
    const ebookCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const webinarCart = JSON.parse(localStorage.getItem('webinarCart') || '[]');
    const guidanceCart = JSON.parse(localStorage.getItem('guidanceCart') || '[]');
    const mentorshipCart = JSON.parse(localStorage.getItem('mentorshipCart') || '[]');
    const courseCart = JSON.parse(localStorage.getItem('courseCart') || '[]');
    const bundleCart = JSON.parse(localStorage.getItem('bundleCart') || '[]');
    const offlineBatchCart = JSON.parse(localStorage.getItem('offlineBatchCart') || '[]');
    const indicatorCart = JSON.parse(localStorage.getItem('indicatorCart') || '[]');

    // Fallback to legacy cartItems only if everything else is empty
    const storedCart = localStorage.getItem('cartItems');
    let legacy = {};
    if (storedCart) {
      try {
        legacy = JSON.parse(storedCart);
      } catch (e) { }
    }

    // For GUIDANCE and MENTORSHIP, they might be objects, so we need to count them properly
    // But for counting purposes, we just need the length
    return {
      EBOOK: Array.isArray(ebookCart) && ebookCart.length > 0 ? ebookCart : (legacy.ebookCart || []),
      WEBINAR: Array.isArray(webinarCart) && webinarCart.length > 0 ? webinarCart : (legacy.webinarCart || []),
      GUIDANCE: Array.isArray(guidanceCart) && guidanceCart.length > 0 ? guidanceCart : (legacy.guidanceCart || []),
      MENTORSHIP: Array.isArray(mentorshipCart) && mentorshipCart.length > 0 ? mentorshipCart : (legacy.mentorshipCart || []),
      COURSE: Array.isArray(courseCart) && courseCart.length > 0 ? courseCart : (legacy.courseCart || []),
      BUNDLE: Array.isArray(bundleCart) && bundleCart.length > 0 ? bundleCart : (legacy.bundleCart || []),
      OFFLINE_BATCH: Array.isArray(offlineBatchCart) && offlineBatchCart.length > 0 ? offlineBatchCart : (legacy.offlineBatchCart || []),
      INDICATOR: Array.isArray(indicatorCart) && indicatorCart.length > 0 ? indicatorCart : (legacy.indicatorCart || []),
    };
  } catch (e) {
    console.error('Failed to parse cart:', e);
    return getEmptyCart();
  }
};

// Helper to save cart to localStorage
const saveCartToStorage = (cart) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('cartItems', JSON.stringify({
    courseCart: cart.COURSE,
    bundleCart: cart.BUNDLE,
    ebookCart: cart.EBOOK,
    webinarCart: cart.WEBINAR,
    guidanceCart: cart.GUIDANCE,
    mentorshipCart: cart.MENTORSHIP,
    indicatorCart: cart.INDICATOR,
    offlineBatchCart: cart.OFFLINE_BATCH,
  }));

  // Also sync to individual keys for compatibility
  localStorage.setItem('cart', JSON.stringify(cart.EBOOK));
  localStorage.setItem('webinarCart', JSON.stringify(cart.WEBINAR));
  localStorage.setItem('guidanceCart', JSON.stringify(cart.GUIDANCE));
  localStorage.setItem('mentorshipCart', JSON.stringify(cart.MENTORSHIP));
  localStorage.setItem('courseCart', JSON.stringify(cart.COURSE));
  localStorage.setItem('bundleCart', JSON.stringify(cart.BUNDLE));
  localStorage.setItem('offlineBatchCart', JSON.stringify(cart.OFFLINE_BATCH));
  localStorage.setItem('indicatorCart', JSON.stringify(cart.INDICATOR));
};

export function CartProvider({ children }) {
  // Use lazy initializer to load from localStorage on first client render
  const [cart, setCart] = useState(getEmptyCart);
  const [isHydrated, setIsHydrated] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Track if we've loaded from storage to prevent overwriting
  const hasLoadedRef = useRef(false);
  // Track when we're responding to external updates to skip sync
  const skipSyncRef = useRef(false);

  // Load cart from localStorage on client mount (handles hydration)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      const storedCart = loadCartFromStorage();
      setCart(storedCart);

      hasLoadedRef.current = true;
      setIsHydrated(true);
    }
  }, []);

  // Listen for cart updates from other sources (cart page, checkout, etc.)
  useEffect(() => {
    const handleCartUpdate = () => {
      // Skip the next sync since we're loading from storage
      skipSyncRef.current = true;
      const storedCart = loadCartFromStorage();
      setCart(storedCart);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Sync to localStorage on cart change - BUT SKIP until hydrated and skip external updates
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Skip sync if we're just responding to external storage changes
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    saveCartToStorage(cart);

    // Check if cart is empty and clear coupon if so
    const totalItems = Object.values(cart).reduce((sum, items) => sum + items.length, 0);
    if (totalItems === 0 && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [cart, isHydrated, appliedCoupon]);

  const addItem = useCallback((type, itemId) => {
    setCart(prev => {
      if (prev[type]?.includes(itemId)) {
        return prev;
      }
      const newCart = {
        ...prev,
        [type]: [...(prev[type] || []), itemId],
      };
      // Dispatch event immediately for other listeners
      setTimeout(() => window.dispatchEvent(new Event('cartUpdated')), 0);
      return newCart;
    });
  }, []);

  const removeItem = useCallback((type, itemId) => {
    setCart(prev => {
      const newCart = {
        ...prev,
        [type]: (prev[type] || []).filter(id => id !== itemId),
      };
      // Save to localStorage immediately for reliability
      saveCartToStorage(newCart);
      // Dispatch event immediately for other listeners
      setTimeout(() => window.dispatchEvent(new Event('cartUpdated')), 0);
      return newCart;
    });
  }, []);

  const isInCart = useCallback((type, itemId) => {
    return cart[type]?.includes(itemId) || false;
  }, [cart]);

  const getCartCount = useCallback(() => {
    return Object.values(cart).reduce((sum, items) => {
      // Ensure items is an array before getting length
      const itemArray = Array.isArray(items) ? items : [];
      return sum + itemArray.length;
    }, 0);
  }, [cart]);

  const clearCart = useCallback(() => {
    const emptyCart = getEmptyCart();
    setCart(emptyCart);

    // Explicitly clear all localStorage keys for reliability
    localStorage.removeItem('cart');
    localStorage.removeItem('webinarCart');
    localStorage.removeItem('guidanceCart');
    localStorage.removeItem('mentorshipCart');
    localStorage.removeItem('courseCart');
    localStorage.removeItem('bundleCart');
    localStorage.removeItem('offlineBatchCart');
    localStorage.removeItem('indicatorCart');
    localStorage.removeItem('cartItems'); // Legacy key

    // Clear coupon when cart is cleared
    setAppliedCoupon(null);

    // Dispatch event for other listeners
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  // Coupon management functions
  const setCoupon = useCallback((couponData) => {
    setAppliedCoupon(couponData);
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      isInCart,
      getCartCount,
      clearCart,
      appliedCoupon,
      setCoupon,
      clearCoupon,
      isHydrated,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // Return mock functions if not in provider (for SSR safety)
    return {
      cart: getEmptyCart(),
      addItem: () => { },
      removeItem: () => { },
      isInCart: () => false,
      getCartCount: () => 0,
      clearCart: () => { },
      appliedCoupon: null,
      setCoupon: () => { },
      clearCoupon: () => { },
      isHydrated: false,
    };
  }
  return context;
}

export default CartContext;

