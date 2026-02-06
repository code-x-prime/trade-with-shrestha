'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, userAPI, cartAPI } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await userAPI.getProfile();
      if (response.success && response.data?.user) {
        const userData = response.data.user;
        // Ensure avatarUrl is set properly
        if (!userData.avatarUrl && userData.avatar) {
          // Import getPublicUrl dynamically
          const { getPublicUrl } = await import('@/lib/imageUtils');
          userData.avatarUrl = getPublicUrl(userData.avatar);
        }
        setUser(userData);
        // Refresh cookie with current token
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken) {
          document.cookie = `accessToken=${currentToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } finally {
      setLoading(false);
    }
  };

  const syncCartWithBackend = async () => {
    try {
      // Get current localStorage cart - include ALL cart types
      const localCart = {
        EBOOK: JSON.parse(localStorage.getItem('cart') || '[]'),
        WEBINAR: JSON.parse(localStorage.getItem('webinarCart') || '[]'),
        GUIDANCE: JSON.parse(localStorage.getItem('guidanceCart') || '[]').map(item => item.id || item.slotId || item),
        COURSE: JSON.parse(localStorage.getItem('courseCart') || '[]'),
        BUNDLE: JSON.parse(localStorage.getItem('bundleCart') || '[]'),
        OFFLINE_BATCH: JSON.parse(localStorage.getItem('offlineBatchCart') || '[]'),
      };

      // Fetch cart from backend
      const backendCartRes = await cartAPI.getCart();
      const backendCart = backendCartRes.success ? backendCartRes.data.cart : {
        EBOOK: [],
        WEBINAR: [],
        GUIDANCE: [],
        COURSE: [],
        BUNDLE: [],
        OFFLINE_BATCH: [],
      };

      // Merge: combine both, remove duplicates for ALL cart types
      const mergedCart = {
        EBOOK: [...new Set([...(backendCart.EBOOK || []), ...localCart.EBOOK])],
        WEBINAR: [...new Set([...(backendCart.WEBINAR || []), ...localCart.WEBINAR])],
        GUIDANCE: [...new Set([...(backendCart.GUIDANCE || []), ...localCart.GUIDANCE])],
        COURSE: [...new Set([...(backendCart.COURSE || []), ...localCart.COURSE])],
        BUNDLE: [...new Set([...(backendCart.BUNDLE || []), ...localCart.BUNDLE])],
        OFFLINE_BATCH: [...new Set([...(backendCart.OFFLINE_BATCH || []), ...localCart.OFFLINE_BATCH])],
      };

      // Sync merged cart to backend
      await cartAPI.syncCart(mergedCart);

      // Update localStorage with merged cart - ALL types
      localStorage.setItem('cart', JSON.stringify(mergedCart.EBOOK));
      localStorage.setItem('webinarCart', JSON.stringify(mergedCart.WEBINAR));
      localStorage.setItem('courseCart', JSON.stringify(mergedCart.COURSE));
      localStorage.setItem('bundleCart', JSON.stringify(mergedCart.BUNDLE));
      localStorage.setItem('offlineBatchCart', JSON.stringify(mergedCart.OFFLINE_BATCH));
      
      // For guidance, we need to handle objects
      const guidanceCart = JSON.parse(localStorage.getItem('guidanceCart') || '[]');
      const updatedGuidanceCart = mergedCart.GUIDANCE.map(id => {
        const existing = guidanceCart.find(item => (item.id || item.slotId || item) === id);
        return existing || id;
      });
      localStorage.setItem('guidanceCart', JSON.stringify(updatedGuidanceCart));

      // Dispatch event to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  const login = async (email, password, redirectUrl = null) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          // Also set cookie for middleware
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        
        // Ensure avatarUrl is set properly
        if (!user.avatarUrl && user.avatar) {
          const { getPublicUrl } = await import('@/lib/imageUtils');
          user.avatarUrl = getPublicUrl(user.avatar);
        }
        
        setUser(user);
        
        // Sync cart with backend after login
        await syncCartWithBackend();
        
        // Redirect - use provided redirect URL or default based on role
        if (redirectUrl && !redirectUrl.startsWith('/admin')) {
          router.push(redirectUrl);
        } else if (user.role === 'ADMIN') {
          router.push(redirectUrl || '/admin');
        } else {
          router.push(redirectUrl || '/profile');
        }
        
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (data) => {
    try {
      const response = await authAPI.signup(data);
      return { success: response.success, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyOTP = async (email, otp, purpose = 'EMAIL_VERIFY', redirectUrl = null) => {
    try {
      const response = await authAPI.verifyOTP({ email, otp, purpose });
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          // Also set cookie for middleware
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        
        // Ensure avatarUrl is set properly
        if (!user.avatarUrl && user.avatar) {
          const { getPublicUrl } = await import('@/lib/imageUtils');
          user.avatarUrl = getPublicUrl(user.avatar);
        }
        
        setUser(user);
        
        // Sync cart with backend after login
        await syncCartWithBackend();
        
        // Redirect - use provided redirect URL or default based on role
        if (redirectUrl && !redirectUrl.startsWith('/admin')) {
          router.push(redirectUrl);
        } else if (user.role === 'ADMIN') {
          router.push(redirectUrl || '/admin');
        } else {
          router.push(redirectUrl || '/profile');
        }
        
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const googleLogin = async (googleData, redirectUrl = null) => {
    try {
      const response = await authAPI.googleAuth(googleData);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          // Also set cookie for middleware
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        
        // Ensure avatarUrl is set properly
        if (!user.avatarUrl && user.avatar) {
          const { getPublicUrl } = await import('@/lib/imageUtils');
          user.avatarUrl = getPublicUrl(user.avatar);
        }
        
        setUser(user);
        
        // Sync cart with backend after login
        await syncCartWithBackend();
        
        // Redirect - use provided redirect URL or default based on role
        if (redirectUrl && !redirectUrl.startsWith('/admin')) {
          router.push(redirectUrl);
        } else if (user.role === 'ADMIN') {
          router.push(redirectUrl || '/admin');
        } else {
          router.push(redirectUrl || '/profile');
        }
        
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Clear cart from backend before logout (if logged in)
      if (user) {
        try {
          await cartAPI.clearCart();
        } catch (error) {
          console.error('Failed to clear cart from backend:', error);
        }
      }
      
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        // Clear authentication tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Also clear cookie
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Clear ALL cart data from localStorage
        localStorage.removeItem('cart');
        localStorage.removeItem('webinarCart');
        localStorage.removeItem('guidanceCart');
        localStorage.removeItem('mentorshipCart');
        localStorage.removeItem('courseCart');
        localStorage.removeItem('bundleCart');
        localStorage.removeItem('offlineBatchCart');
        localStorage.removeItem('indicatorCart');
        localStorage.removeItem('cartItems'); // Legacy key
        
        // Clear coupon code if any
        localStorage.removeItem('appliedCoupon');
        sessionStorage.removeItem('couponCode');
        
        // Dispatch event to update cart count in navbar
        window.dispatchEvent(new Event('cartUpdated'));
      }
      setUser(null);
      router.push('/auth');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    verifyOTP,
    googleLogin,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

