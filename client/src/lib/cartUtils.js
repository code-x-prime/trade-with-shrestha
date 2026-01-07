import { cartAPI } from './api';

/**
 * Add item to cart (localStorage + backend if logged in)
 */
export const addToCart = async (itemType, itemId, isAuthenticated = false) => {
    const cartKeys = {
        EBOOK: 'cart',
        WEBINAR: 'webinarCart',
        GUIDANCE: 'guidanceCart',
        MENTORSHIP: 'mentorshipCart',
        COURSE: 'courseCart',
        OFFLINE_BATCH: 'offlineBatchCart',
        BUNDLE: 'bundleCart',
        INDICATOR: 'indicatorCart',
    };

    const key = cartKeys[itemType];
    if (!key) {
        throw new Error('Invalid item type');
    }

    // Add to localStorage
    if (itemType === 'GUIDANCE' || itemType === 'MENTORSHIP') {
        // For guidance and mentorship, we might store objects
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
        const exists = cart.some(item => (item.id || item) === itemId);
        if (!exists) {
            cart.push(itemId);
            localStorage.setItem(key, JSON.stringify(cart));
        }
    } else {
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
        if (!cart.includes(itemId)) {
            cart.push(itemId);
            localStorage.setItem(key, JSON.stringify(cart));
        }
    }

    // Sync to backend if logged in
    if (isAuthenticated) {
        try {
            await cartAPI.addToCart(itemType, itemId);
        } catch (error) {
            console.error('Failed to sync cart to backend:', error);
            // Continue anyway - localStorage is updated
        }
    }

    // Dispatch event to update cart count
    window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Remove item from cart (localStorage + backend if logged in)
 */
export const removeFromCart = async (itemType, itemId, isAuthenticated = false) => {
    const cartKeys = {
        EBOOK: 'cart',
        WEBINAR: 'webinarCart',
        GUIDANCE: 'guidanceCart',
        MENTORSHIP: 'mentorshipCart',
        COURSE: 'courseCart',
        OFFLINE_BATCH: 'offlineBatchCart',
        BUNDLE: 'bundleCart',
        INDICATOR: 'indicatorCart',
    };

    const key = cartKeys[itemType];
    if (!key) {
        throw new Error('Invalid item type');
    }

    // Remove from localStorage
    if (itemType === 'GUIDANCE' || itemType === 'MENTORSHIP') {
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedCart = cart.filter(item => (item.id || item) !== itemId);
        localStorage.setItem(key, JSON.stringify(updatedCart));
    } else {
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedCart = cart.filter(id => id !== itemId);
        localStorage.setItem(key, JSON.stringify(updatedCart));
    }

    // Sync to backend if logged in
    if (isAuthenticated) {
        try {
            await cartAPI.removeFromCart(itemType, itemId);
        } catch (error) {
            console.error('Failed to sync cart to backend:', error);
            // Continue anyway - localStorage is updated
        }
    }

    // Dispatch event to update cart count
    window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Sync entire cart to backend and clear localStorage
 */
export const syncCartToBackend = async (isAuthenticated = false) => {
    if (!isAuthenticated) return;

    try {
        const cart = {
            EBOOK: JSON.parse(localStorage.getItem('cart') || '[]'),
            WEBINAR: JSON.parse(localStorage.getItem('webinarCart') || '[]'),
            GUIDANCE: JSON.parse(localStorage.getItem('guidanceCart') || '[]').map(item => item.id || item),
            MENTORSHIP: JSON.parse(localStorage.getItem('mentorshipCart') || '[]').map(item => item.id || item),
            COURSE: JSON.parse(localStorage.getItem('courseCart') || '[]'),
            OFFLINE_BATCH: JSON.parse(localStorage.getItem('offlineBatchCart') || '[]'),
            BUNDLE: JSON.parse(localStorage.getItem('bundleCart') || '[]'),
            INDICATOR: JSON.parse(localStorage.getItem('indicatorCart') || '[]'),
        };

        await cartAPI.syncCart(cart);
        console.log('Cart synced to backend');
    } catch (error) {
        console.error('Failed to sync cart to backend:', error);
    }
};

/**
 * Clear all cart localStorage (call after successful payment)
 */
export const clearAllCartLocalStorage = () => {
    localStorage.removeItem('cart');
    localStorage.removeItem('webinarCart');
    localStorage.removeItem('guidanceCart');
    localStorage.removeItem('mentorshipCart');
    localStorage.removeItem('courseCart');
    localStorage.removeItem('offlineBatchCart');
    localStorage.removeItem('bundleCart');
    localStorage.removeItem('indicatorCart');
    localStorage.removeItem('cartItems'); // Legacy key

    // Also clear coupon data
    localStorage.removeItem('appliedCoupon');
    sessionStorage.removeItem('couponCode');

    window.dispatchEvent(new Event('cartUpdated'));
};

