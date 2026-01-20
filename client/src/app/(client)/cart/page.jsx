'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ebookAPI, webinarAPI, mentorshipAPI, courseAPI, offlineBatchAPI, couponAPI, orderAPI, bundleAPI } from '@/lib/api';
import { removeFromCart as removeFromCartUtil } from '@/lib/cartUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Trash2, ArrowRight, Tag, Video, Calendar, Package, Lock, Gift, Copy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [webinarCartItems, setWebinarCartItems] = useState([]);
  const [guidanceCartItems, setGuidanceCartItems] = useState([]);
  const [mentorshipCartItems, setMentorshipCartItems] = useState([]);
  const [courseCartItems, setCourseCartItems] = useState([]);
  const [offlineBatchCartItems, setOfflineBatchCartItems] = useState([]);
  const [bundleCartItems, setBundleCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponDetails, setCouponDetails] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsDialog, setShowCouponsDialog] = useState(false);

  useEffect(() => {
    loadCart();
    loadAvailableCoupons();

    // Read coupon from URL query parameter
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon) {
      setCouponCode(urlCoupon.toUpperCase());
    }

    const handleUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleUpdate);
    return () => window.removeEventListener('cartUpdated', handleUpdate);
  }, [searchParams]);

  const loadAvailableCoupons = async () => {
    try {
      const response = await couponAPI.getCouponsReadyToShow();
      if (response.success && response.data.coupons) {
        setAvailableCoupons(response.data.coupons);
      }
    } catch (error) {
      console.error('Error loading available coupons:', error);
    }
  };


  const loadCart = async () => {
    try {
      setLoading(true);

      // ALWAYS read from localStorage first (works for both guest and logged in)
      // For logged-in users, we'll sync to backend in background but won't clear localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const webinarCart = JSON.parse(localStorage.getItem('webinarCart') || '[]');
      const guidanceCart = JSON.parse(localStorage.getItem('guidanceCart') || '[]');
      const mentorshipCart = JSON.parse(localStorage.getItem('mentorshipCart') || '[]');
      const courseCart = JSON.parse(localStorage.getItem('courseCart') || '[]');
      const offlineBatchCart = JSON.parse(localStorage.getItem('offlineBatchCart') || '[]');
      const bundleCart = JSON.parse(localStorage.getItem('bundleCart') || '[]');

      // If logged in, sync cart to backend in background (don't wait, don't clear localStorage)
      if (isAuthenticated) {
        try {
          const { cartAPI } = await import('@/lib/api');

          // Build merged cart object for syncing (extract IDs from objects where needed)
          const cartToSync = {
            EBOOK: cart,
            WEBINAR: webinarCart,
            GUIDANCE: guidanceCart.map(item => item.slotId || item.id || item),
            MENTORSHIP: mentorshipCart.map(item => item.id || item),
            COURSE: courseCart,
            OFFLINE_BATCH: offlineBatchCart,
            BUNDLE: bundleCart,
          };

          // Check if there are any items to sync
          const hasItems = Object.values(cartToSync).some(arr => arr.length > 0);

          if (hasItems) {
            // Sync to backend (fire and forget - don't await, don't block UI)
            cartAPI.syncCart(cartToSync).catch(err => {
              console.error('Background cart sync failed:', err);
            });
          }
        } catch (error) {
          console.error('Failed to sync cart to backend:', error);
        }
      }


      // Load ebooks
      const ebookItems = cart.length > 0 ? await Promise.all(
        cart.map(async (id) => {
          try {
            const response = await ebookAPI.getEbookById(id);
            if (response.success && response.data.ebook) {
              if (response.data.ebook.isFree) {
                const updatedCart = cart.filter(cartId => cartId !== id);
                localStorage.setItem('cart', JSON.stringify(updatedCart));
                window.dispatchEvent(new Event('cartUpdated'));
                return null;
              }
              return { ...response.data.ebook, type: 'ebook' };
            }
            return null;
          } catch (error) {
            // If ebook not found or access denied, remove from cart
            console.error(`Failed to load ebook ${id}:`, error);
            const updatedCart = cart.filter(cartId => cartId !== id);
            localStorage.setItem('cart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));
            return null;
          }
        })
      ) : [];

      // Load webinars
      const webinarItems = webinarCart.length > 0 ? await Promise.all(
        webinarCart.map(async (id) => {
          try {
            const response = await webinarAPI.getWebinarById(id);
            if (response.success && response.data.webinar) {
              if (response.data.webinar.isFree) {
                const updatedCart = webinarCart.filter(cartId => cartId !== id);
                localStorage.setItem('webinarCart', JSON.stringify(updatedCart));
                window.dispatchEvent(new Event('cartUpdated'));
                return null;
              }
              return { ...response.data.webinar, type: 'webinar' };
            }
            return null;
          } catch (error) {
            // If webinar not found or access denied, remove from cart
            console.error(`Failed to load webinar ${id}:`, error);
            const updatedCart = webinarCart.filter(cartId => cartId !== id);
            localStorage.setItem('webinarCart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));
            return null;
          }
        })
      ) : [];

      // Load guidance slots (already have all data in localStorage)
      const guidanceItems = guidanceCart.map(item => ({
        ...item,
        type: 'guidance',
      }));

      // Load mentorship (already have all data in localStorage)
      const mentorshipItems = mentorshipCart.map(item => ({
        ...item,
        type: 'mentorship',
      }));

      // Load courses
      const courseItems = courseCart.length > 0 ? await Promise.all(
        courseCart.map(async (id) => {
          try {
            const response = await courseAPI.getCourseById(id);
            if (response.success && response.data.course) {
              if (response.data.course.isFree) {
                const updatedCart = courseCart.filter(cartId => cartId !== id);
                localStorage.setItem('courseCart', JSON.stringify(updatedCart));
                window.dispatchEvent(new Event('cartUpdated'));
                return null;
              }
              return { ...response.data.course, type: 'course' };
            }
            return null;
          } catch (error) {
            // If course not found or access denied, remove from cart
            console.error(`Failed to load course ${id}:`, error);
            const updatedCart = courseCart.filter(cartId => cartId !== id);
            localStorage.setItem('courseCart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));
            return null;
          }
        })
      ) : [];

      // Load offline batches
      const offlineBatchItems = offlineBatchCart.length > 0 ? await Promise.all(
        offlineBatchCart.map(async (id) => {
          try {
            const response = await offlineBatchAPI.getBatchById(id);
            if (response.success && response.data.batch) {
              if (response.data.batch.isFree || response.data.batch.pricingType === 'FREE') {
                const updatedCart = offlineBatchCart.filter(cartId => cartId !== id);
                localStorage.setItem('offlineBatchCart', JSON.stringify(updatedCart));
                window.dispatchEvent(new Event('cartUpdated'));
                return null;
              }
              return { ...response.data.batch, type: 'offlineBatch' };
            }
            return null;
          } catch (error) {
            console.error(`Failed to load offline batch ${id}:`, error);
            const updatedCart = offlineBatchCart.filter(cartId => cartId !== id);
            localStorage.setItem('offlineBatchCart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));
            return null;
          }
        })
      ) : [];

      // Load bundles
      const bundleItems = bundleCart.length > 0 ? await Promise.all(
        bundleCart.map(async (id) => {
          try {
            const response = await bundleAPI.getBundleById(id);
            if (response.success && response.data.bundle) {
              return { ...response.data.bundle, type: 'bundle' };
            }
            return null;
          } catch (error) {
            console.error(`Failed to load bundle ${id}:`, error);
            const updatedCart = bundleCart.filter(cartId => cartId !== id);
            localStorage.setItem('bundleCart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));
            return null;
          }
        })
      ) : [];

      setCartItems(ebookItems.filter(Boolean));
      setWebinarCartItems(webinarItems.filter(Boolean));
      setGuidanceCartItems(guidanceItems);
      setMentorshipCartItems(mentorshipItems);
      setCourseCartItems(courseItems.filter(Boolean));
      setOfflineBatchCartItems(offlineBatchItems.filter(Boolean));
      setBundleCartItems(bundleItems.filter(Boolean));
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId, type) => {
    const typeMap = {
      'ebook': 'EBOOK',
      'webinar': 'WEBINAR',
      'guidance': 'GUIDANCE',
      'mentorship': 'MENTORSHIP',
      'course': 'COURSE',
      'offlineBatch': 'OFFLINE_BATCH',
      'bundle': 'BUNDLE',
    };

    const itemType = typeMap[type];
    if (!itemType) return;

    try {
      // Track new cart states for empty check
      let newEbookCount = cartItems.length;
      let newWebinarCount = webinarCartItems.length;
      let newGuidanceCount = guidanceCartItems.length;
      let newMentorshipCount = mentorshipCartItems.length;
      let newCourseCount = courseCartItems.length;
      let newOfflineBatchCount = offlineBatchCartItems.length;
      let newBundleCount = bundleCartItems.length;

      // Remove from localStorage and state
      if (type === 'ebook') {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = cart.filter(id => id !== itemId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        newEbookCount = updatedCart.length;
      } else if (type === 'webinar') {
        const webinarCart = JSON.parse(localStorage.getItem('webinarCart') || '[]');
        const updatedCart = webinarCart.filter(id => id !== itemId);
        localStorage.setItem('webinarCart', JSON.stringify(updatedCart));
        setWebinarCartItems(prev => prev.filter(item => item.id !== itemId));
        newWebinarCount = updatedCart.length;
      } else if (type === 'guidance') {
        const guidanceCart = JSON.parse(localStorage.getItem('guidanceCart') || '[]');
        const updatedCart = guidanceCart.filter(item => item.slotId !== itemId);
        localStorage.setItem('guidanceCart', JSON.stringify(updatedCart));
        setGuidanceCartItems(prev => prev.filter(item => item.slotId !== itemId));
        newGuidanceCount = updatedCart.length;
      } else if (type === 'mentorship') {
        const mentorshipCart = JSON.parse(localStorage.getItem('mentorshipCart') || '[]');
        const updatedCart = mentorshipCart.filter(item => item.id !== itemId);
        localStorage.setItem('mentorshipCart', JSON.stringify(updatedCart));
        setMentorshipCartItems(prev => prev.filter(item => item.id !== itemId));
        newMentorshipCount = updatedCart.length;
      } else if (type === 'course') {
        const courseCart = JSON.parse(localStorage.getItem('courseCart') || '[]');
        const updatedCart = courseCart.filter(id => id !== itemId);
        localStorage.setItem('courseCart', JSON.stringify(updatedCart));
        setCourseCartItems(prev => prev.filter(item => item.id !== itemId));
        newCourseCount = updatedCart.length;
      } else if (type === 'offlineBatch') {
        const offlineBatchCart = JSON.parse(localStorage.getItem('offlineBatchCart') || '[]');
        const updatedCart = offlineBatchCart.filter(id => id !== itemId);
        localStorage.setItem('offlineBatchCart', JSON.stringify(updatedCart));
        setOfflineBatchCartItems(prev => prev.filter(item => item.id !== itemId));
        newOfflineBatchCount = updatedCart.length;
      } else if (type === 'bundle') {
        const bundleCart = JSON.parse(localStorage.getItem('bundleCart') || '[]');
        const updatedCart = bundleCart.filter(id => id !== itemId);
        localStorage.setItem('bundleCart', JSON.stringify(updatedCart));
        setBundleCartItems(prev => prev.filter(item => item.id !== itemId));
        newBundleCount = updatedCart.length;
      }

      // IMPORTANT: Also update the cartItems legacy key to stay in sync
      // This prevents the CartContext from reading stale data
      const currentCartItems = {
        ebookCart: JSON.parse(localStorage.getItem('cart') || '[]'),
        webinarCart: JSON.parse(localStorage.getItem('webinarCart') || '[]'),
        guidanceCart: JSON.parse(localStorage.getItem('guidanceCart') || '[]'),
        mentorshipCart: JSON.parse(localStorage.getItem('mentorshipCart') || '[]'),
        courseCart: JSON.parse(localStorage.getItem('courseCart') || '[]'),
        offlineBatchCart: JSON.parse(localStorage.getItem('offlineBatchCart') || '[]'),
        bundleCart: JSON.parse(localStorage.getItem('bundleCart') || '[]'),
        indicatorCart: JSON.parse(localStorage.getItem('indicatorCart') || '[]'),
      };
      localStorage.setItem('cartItems', JSON.stringify(currentCartItems));

      // If cart is now empty, clear coupon
      const totalItems = newEbookCount + newWebinarCount + newGuidanceCount +
        newMentorshipCount + newCourseCount + newOfflineBatchCount + newBundleCount;
      if (totalItems === 0) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponDetails(null);
        setCouponCode('');
        localStorage.removeItem('appliedCoupon');
        sessionStorage.removeItem('couponCode');

        // Remove coupon from URL
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('coupon');
        window.history.replaceState({}, '', currentUrl.toString());
      }

      // Sync to backend if logged in
      if (isAuthenticated) {
        await removeFromCartUtil(itemType, itemId, isAuthenticated);
      }

      // Dispatch event to update CartContext and Navbar
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Failed to remove item. Please try again.');
    }
  };

  // Helper to validate and apply coupon
  const validateAndApplyCoupon = async (code, isAutoApply = false) => {
    if (!code.trim()) {
      if (!isAutoApply) setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const total = calculateTotal();
      if (total === 0) return;

      // Determine applicableTo based on cart contents
      let applicableTo = 'ALL';
      const hasEbooks = cartItems.length > 0;
      const hasWebinars = webinarCartItems.length > 0;
      const hasGuidance = guidanceCartItems.length > 0;
      const hasMentorship = mentorshipCartItems.length > 0;
      const hasCourses = courseCartItems.length > 0;
      const hasOfflineBatches = offlineBatchCartItems.length > 0;
      const hasBundles = bundleCartItems.length > 0;

      if (hasEbooks && !hasWebinars && !hasGuidance && !hasMentorship && !hasCourses && !hasOfflineBatches && !hasBundles) {
        applicableTo = 'EBOOK';
      } else if (hasWebinars && !hasEbooks && !hasGuidance && !hasMentorship && !hasCourses && !hasOfflineBatches && !hasBundles) {
        applicableTo = 'WEBINAR';
      } else if (hasGuidance && !hasEbooks && !hasWebinars && !hasMentorship && !hasCourses && !hasOfflineBatches && !hasBundles) {
        applicableTo = 'GUIDANCE';
      } else if (hasMentorship && !hasEbooks && !hasWebinars && !hasGuidance && !hasCourses && !hasOfflineBatches && !hasBundles) {
        applicableTo = 'MENTORSHIP';
      } else if (hasCourses && !hasEbooks && !hasWebinars && !hasGuidance && !hasMentorship && !hasOfflineBatches && !hasBundles) {
        applicableTo = 'COURSE';
      } else if (hasOfflineBatches && !hasEbooks && !hasWebinars && !hasGuidance && !hasMentorship && !hasCourses && !hasBundles) {
        applicableTo = 'OFFLINE_BATCH';
      } else if (hasBundles && !hasEbooks && !hasWebinars && !hasGuidance && !hasMentorship && !hasCourses && !hasOfflineBatches) {
        applicableTo = 'BUNDLE';
      } else {
        applicableTo = 'ALL'; // Mixed cart
      }

      const response = await couponAPI.validateCoupon(code.toUpperCase(), total, applicableTo);
      if (response.success) {
        setAppliedCoupon(response.data.coupon.code);
        setCouponDiscount(response.data.discountAmount);
        setCouponDetails(response.data.coupon);
        setCouponError('');

        // Update URL with coupon for sharing/persistence
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('coupon', response.data.coupon.code);
        window.history.replaceState({}, '', currentUrl.toString());

        const couponType = response.data.coupon.applicableTo;
        const typeText = couponType === 'ALL' ? 'All Products' :
          couponType === 'EBOOK' ? 'E-Books Only' :
            couponType === 'WEBINAR' ? 'Webinars Only' :
              couponType === 'GUIDANCE' ? '1:1 Guidance Only' :
                couponType === 'MENTORSHIP' ? 'Live Mentorship Only' :
                  couponType === 'COURSE' ? 'Courses Only' :
                    couponType === 'BUNDLE' ? 'Bundles Only' :
                      couponType === 'OFFLINE_BATCH' ? 'Offline Batches Only' :
                        couponType === 'SUBSCRIPTION' ? 'Subscriptions Only' : 'All Products';

        if (!isAutoApply) {
          toast.success(`Coupon applied! Valid for: ${typeText}`);
        }
      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponDetails(null);
      setCouponError(error.message || 'Invalid coupon code');
      // Don't persist invalid coupons
      if (!isAutoApply) {
        toast.error(error.message || 'Invalid coupon code');
      }
    }
  };

  const applyCoupon = async (code = null) => {
    const codeToApply = code || couponCode;
    if (codeToApply) {
      setCouponCode(codeToApply);
      await validateAndApplyCoupon(codeToApply);
    }
  };

  // Auto-validate coupon from URL after cart items are loaded
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    const hasItems = cartItems.length > 0 || webinarCartItems.length > 0 ||
      guidanceCartItems.length > 0 || mentorshipCartItems.length > 0 ||
      courseCartItems.length > 0 || offlineBatchCartItems.length > 0 ||
      bundleCartItems.length > 0;

    // Only auto-validate if we have a URL coupon, items loaded, and not already applied
    if (urlCoupon && hasItems && !appliedCoupon && !loading) {
      validateAndApplyCoupon(urlCoupon.toUpperCase(), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cartItems, webinarCartItems, guidanceCartItems, mentorshipCartItems, courseCartItems, offlineBatchCartItems, bundleCartItems]);


  // Helper to get effective price (considers flash sale)
  const getEffectivePrice = (item) => {
    if (item.pricing?.effectivePrice !== undefined) {
      return item.pricing.effectivePrice;
    }
    return item.salePrice || item.price || 0;
  };

  // Helper to render price with flash sale info
  const renderPrice = (item) => {
    if (item.isFree) {
      return <span className="text-xl font-bold text-green-600">Free</span>;
    }

    const hasFlashSale = item.pricing?.hasFlashSale;
    const effectivePrice = getEffectivePrice(item);
    const originalPrice = item.pricing?.displayOriginalPrice ?? (item.price || 0);

    if (hasFlashSale) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
            <span>⚡ Flash Sale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 line-through text-sm">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-2xl font-bold text-brand-600">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      );
    }

    if (effectivePrice < originalPrice) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 line-through text-sm">
            ₹{originalPrice.toLocaleString('en-IN')}
          </span>
          <span className="text-2xl font-bold text-brand-600">
            ₹{effectivePrice.toLocaleString('en-IN')}
          </span>
        </div>
      );
    }

    return (
      <span className="text-2xl font-bold text-brand-600">
        ₹{(item.price || 0).toLocaleString('en-IN')}
      </span>
    );
  };

  const calculateTotal = () => {
    let total = 0;
    cartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    webinarCartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    guidanceCartItems.forEach(item => {
      total += item.pricing?.effectivePrice || (item.price || 0); // Guidance slots are always paid
    });
    mentorshipCartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    courseCartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    offlineBatchCartItems.forEach(item => {
      if (!item.isFree && item.pricingType !== 'FREE') {
        total += getEffectivePrice(item);
      }
    });
    bundleCartItems.forEach(item => {
      total += getEffectivePrice(item);
    });
    return total;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    return Math.max(0, subtotal - couponDiscount);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login&redirect=/cart');
      return;
    }

    // ALWAYS redirect to checkout page for all payments
    // Pass coupon via URL query parameter for real-time validation on checkout
    const checkoutUrl = appliedCoupon
      ? `/checkout?coupon=${encodeURIComponent(appliedCoupon)}`
      : '/checkout';
    router.push(checkoutUrl);
    return;

    // If only mentorship, handle directly (only single mentorship for now)
    if (hasMentorship && !hasWebinars && !hasGuidance && !hasEbooks && mentorshipCartItems.length === 1) {
      try {
        const mentorshipId = mentorshipCartItems[0].id;
        const total = calculateFinalTotal();

        if (total === 0) {
          // Free mentorship - complete order directly
          const response = await orderAPI.createMentorshipOrder(mentorshipId, appliedCoupon || null);
          if (response.success) {
            localStorage.removeItem('mentorshipCart');
            sessionStorage.removeItem('couponCode');
            router.push('/profile/orders?success=true');
            return;
          }
        } else {
          // Paid mentorship - proceed with Razorpay
          const response = await orderAPI.createMentorshipOrder(mentorshipId, appliedCoupon || null);
          if (response.success) {
            if (response.data.order?.status === 'COMPLETED') {
              localStorage.removeItem('mentorshipCart');
              sessionStorage.removeItem('couponCode');
              router.push('/profile/orders?success=true');
              return;
            } else {
              const razorpayOrder = response.data.razorpayOrder;
              const orderId = response.data.order.id;
              sessionStorage.setItem('mentorshipOrderId', orderId);
              // Coupon already passed via API - no need to store in sessionStorage

              // Wait for Razorpay to load (with timeout)
              let retries = 0;
              const maxRetries = 10;
              const checkRazorpay = () => {
                if (typeof window !== 'undefined' && window.Razorpay) {
                  const options = {
                    key: razorpayOrder.key,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: 'Shrestha Academy',
                    description: 'Mentorship Enrollment',
                    order_id: razorpayOrder.id,
                    handler: async function (response) {
                      try {
                        const verifyResponse = await orderAPI.verifyPayment(
                          razorpayOrder.id,
                          response.razorpay_payment_id,
                          response.razorpay_signature
                        );
                        if (verifyResponse.success) {
                          localStorage.removeItem('mentorshipCart');
                          sessionStorage.removeItem('mentorshipOrderId');
                          sessionStorage.removeItem('couponCode');
                          router.push('/profile/orders?success=true');
                        }
                      } catch (error) {
                        toast.error('Payment verification failed');
                      }
                    },
                    prefill: {
                      email: user?.email || '',
                      contact: user?.phone || '',
                    },
                    theme: {
                      color: '#4A50B0',
                    },
                  };

                  const razorpay = new window.Razorpay(options);
                  razorpay.on('payment.failed', function (response) {
                    toast.error('Payment failed: ' + response.error.description);
                  });
                  razorpay.open();
                } else if (retries < maxRetries) {
                  retries++;
                  setTimeout(checkRazorpay, 200);
                } else {
                  toast.error('Payment gateway is taking too long to load. Please refresh the page and try again.');
                }
              };

              checkRazorpay();
              return;
            }
          }
        }
      } catch (error) {
        toast.error(error.message || 'Failed to create order');
        return;
      }
    }

    // REMOVED: All payments now go through checkout page
    if (false && hasWebinars && !hasGuidance && !hasMentorship) {
      try {
        const webinarIds = webinarCartItems.map(item => item.id);
        const total = calculateFinalTotal();

        if (total === 0) {
          // Free webinars - complete order directly
          const response = await orderAPI.createWebinarOrder(webinarIds, appliedCoupon || null);
          if (response.success) {
            localStorage.removeItem('webinarCart');
            sessionStorage.removeItem('couponCode');
            router.push('/profile/orders?success=true');
            return;
          }
        } else {
          // Paid webinars - proceed with Razorpay
          const response = await orderAPI.createWebinarOrder(webinarIds, appliedCoupon || null);
          if (response.success) {
            if (response.data.order?.status === 'COMPLETED') {
              localStorage.removeItem('webinarCart');
              sessionStorage.removeItem('couponCode');
              router.push('/profile/orders?success=true');
              return;
            } else {
              const razorpayOrder = response.data.razorpayOrder;
              const orderId = response.data.order.id;
              sessionStorage.setItem('webinarOrderId', orderId);
              // Coupon already passed via API - no need to store in sessionStorage

              const options = {
                key: razorpayOrder.key,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Shrestha Academy',
                description: 'Webinar Enrollment',
                order_id: razorpayOrder.id,
                handler: async function (response) {
                  try {
                    const verifyResponse = await orderAPI.verifyPayment(
                      razorpayOrder.id,
                      response.razorpay_payment_id,
                      response.razorpay_signature
                    );
                    if (verifyResponse.success) {
                      localStorage.removeItem('webinarCart');
                      sessionStorage.removeItem('webinarOrderId');
                      sessionStorage.removeItem('couponCode');
                      router.push('/profile/orders?success=true');
                    }
                  } catch (error) {
                    toast.error('Payment verification failed');
                  }
                },
                prefill: {
                  email: '',
                  contact: '',
                },
                theme: {
                  color: '#4A50B0',
                },
              };

              if (typeof window !== 'undefined' && window.Razorpay) {
                const razorpay = new window.Razorpay(options);
                razorpay.on('payment.failed', function (response) {
                  toast.error('Payment failed: ' + response.error.description);
                });
                razorpay.open();
              } else {
                toast.error('Payment gateway not loaded. Please refresh the page.');
              }
              return;
            }
          }
        }
      } catch (error) {
        toast.error(error.message || 'Failed to create order');
        return;
      }
    }

    // If only courses, handle directly
    if (hasCourses && !hasWebinars && !hasGuidance && !hasMentorship && !hasEbooks && courseCartItems.length === 1) {
      try {
        const courseId = courseCartItems[0].id;
        const total = calculateFinalTotal();

        if (total === 0) {
          // Free course - complete order directly
          const response = await orderAPI.createCourseOrder(courseId, appliedCoupon || null);
          if (response.success) {
            localStorage.removeItem('courseCart');
            sessionStorage.removeItem('couponCode');
            router.push('/profile/orders?success=true');
            return;
          }
        } else {
          // Paid course - proceed with Razorpay
          const response = await orderAPI.createCourseOrder(courseId, appliedCoupon || null);
          if (response.success) {
            if (response.data.order?.status === 'COMPLETED') {
              localStorage.removeItem('courseCart');
              sessionStorage.removeItem('couponCode');
              router.push('/profile/orders?success=true');
              return;
            } else {
              const razorpayOrder = response.data.razorpayOrder;
              const orderId = response.data.order.id;
              sessionStorage.setItem('courseOrderId', orderId);
              // Coupon already passed via API - no need to store in sessionStorage

              // Wait for Razorpay to load (with timeout)
              let retries = 0;
              const maxRetries = 10;
              const checkRazorpay = () => {
                if (typeof window !== 'undefined' && window.Razorpay) {
                  const options = {
                    key: razorpayOrder.key,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: 'Shrestha Academy',
                    description: 'Course Enrollment',
                    order_id: razorpayOrder.id,
                    handler: async function (response) {
                      try {
                        const verifyResponse = await orderAPI.verifyPayment(
                          razorpayOrder.id,
                          response.razorpay_payment_id,
                          response.razorpay_signature
                        );
                        if (verifyResponse.success) {
                          localStorage.removeItem('courseCart');
                          sessionStorage.removeItem('courseOrderId');
                          sessionStorage.removeItem('couponCode');
                          router.push('/profile/orders?success=true');
                        }
                      } catch (error) {
                        toast.error('Payment verification failed');
                      }
                    },
                    prefill: {
                      email: user?.email || '',
                      contact: user?.phone || '',
                    },
                    theme: {
                      color: '#4A50B0',
                    },
                  };

                  const razorpay = new window.Razorpay(options);
                  razorpay.on('payment.failed', function (response) {
                    toast.error('Payment failed: ' + response.error.description);
                  });
                  razorpay.open();
                } else if (retries < maxRetries) {
                  retries++;
                  setTimeout(checkRazorpay, 200);
                } else {
                  toast.error('Payment gateway is taking too long to load. Please refresh the page and try again.');
                }
              };

              checkRazorpay();
              return;
            }
          }
        }
      } catch (error) {
        toast.error(error.message || 'Failed to create order');
        return;
      }
    }

    // If only guidance slots, handle directly
    if (hasGuidance && !hasWebinars && !hasEbooks && !hasCourses) {
      try {
        setLoading(true);
        const slotId = guidanceCartItems[0].slotId;
        const total = calculateFinalTotal();

        const response = await orderAPI.createGuidanceOrder(slotId, appliedCoupon || null);
        if (response.success) {
          if (response.data.order?.status === 'COMPLETED') {
            localStorage.removeItem('guidanceCart');
            sessionStorage.removeItem('couponCode');
            toast.success('Slot booked successfully!');
            router.push('/profile/orders?success=true');
            setLoading(false);
            return;
          } else {
            const razorpayOrder = response.data.razorpayOrder;
            const orderId = response.data.order.id;
            sessionStorage.setItem('guidanceOrderId', orderId);
            // Coupon already passed via API - no need to store in sessionStorage

            // Wait for Razorpay to load (with timeout)
            let retries = 0;
            const maxRetries = 10;
            const checkRazorpay = () => {
              if (typeof window !== 'undefined' && window.Razorpay) {
                const options = {
                  key: razorpayOrder.key,
                  amount: razorpayOrder.amount,
                  currency: razorpayOrder.currency,
                  name: 'Shrestha Academy',
                  description: '1:1 Guidance Booking',
                  order_id: razorpayOrder.id,
                  handler: async function (response) {
                    try {
                      const verifyResponse = await orderAPI.verifyPayment(
                        razorpayOrder.id,
                        response.razorpay_payment_id,
                        response.razorpay_signature
                      );
                      if (verifyResponse.success) {
                        localStorage.removeItem('guidanceCart');
                        sessionStorage.removeItem('guidanceOrderId');
                        sessionStorage.removeItem('couponCode');
                        toast.success('Payment successful! Slot booked.');
                        router.push('/profile/orders?success=true');
                      }
                    } catch (error) {
                      toast.error('Payment verification failed');
                    } finally {
                      setLoading(false);
                    }
                  },
                  prefill: {
                    email: user?.email || '',
                    contact: user?.phone || '',
                  },
                  theme: {
                    color: '#4A50B0',
                  },
                  modal: {
                    ondismiss: function () {
                      setLoading(false);
                    },
                  },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.on('payment.failed', function (response) {
                  toast.error('Payment failed: ' + response.error.description);
                  setLoading(false);
                });
                razorpay.open();
              } else if (retries < maxRetries) {
                retries++;
                setTimeout(checkRazorpay, 200);
              } else {
                toast.error('Payment gateway is taking too long to load. Please refresh the page and try again.');
                setLoading(false);
              }
            };

            checkRazorpay();
            return;
          }
        }
      } catch (error) {
        toast.error(error.message || 'Failed to create order');
        setLoading(false);
        return;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  const totalItems = cartItems.length + webinarCartItems.length + guidanceCartItems.length + mentorshipCartItems.length + courseCartItems.length + offlineBatchCartItems.length + bundleCartItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Shopping Cart</h1>
          <p className="text-gray-600 dark:text-gray-400">Review your items and proceed to checkout</p>
        </div>

        {totalItems === 0 ? (
          <Card className="border-2 border-dashed dark:bg-gray-800/50 dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Start adding items to your cart</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600">
                  <Link href="/ebooks">Browse E-Books</Link>
                </Button>
                <Button asChild variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600">
                  <Link href="/webinars">Browse Webinars</Link>
                </Button>
                <Button asChild variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
                <Button asChild variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600">
                  <Link href="/guidance">Browse 1:1 Guidance</Link>
                </Button>
                <Button asChild variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600">
                  <Link href="/mentorship">Browse Mentorship</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Ebook Items */}
              {cartItems.map((item) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/ebooks/${item.slug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {item.image1Url ? (
                            <Image
                              src={item.image1Url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <span className="text-xs text-gray-500 font-medium">No Image</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/ebooks/${item.slug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          {item.shortDescription && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.shortDescription}
                            </p>
                          )}
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3">
                            E-Book
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            {renderPrice(item)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, 'ebook')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Guidance Items */}
              {guidanceCartItems.map((item) => (
                <Card key={item.slotId} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/guidance/${item.guidanceSlug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {item.expertImageUrl ? (
                            <Image
                              src={item.expertImageUrl}
                              alt={item.guidanceTitle}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/guidance/${item.guidanceSlug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.guidanceTitle}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 mb-1 font-medium">
                            Expert: {item.expertName}
                          </p>
                          {item.date && (
                            <p className="text-sm text-gray-500 mb-1">
                              📅 {new Date(item.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                          {item.startTime && item.endTime && (
                            <p className="text-sm text-gray-500 mb-3">
                              ⏰ {item.startTime} - {item.endTime} ({item.durationMinutes} min)
                            </p>
                          )}
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium mb-3">
                            1:1 Guidance
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            <span className="text-2xl font-bold text-brand-600">
                              ₹{(item.price || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.slotId, 'guidance')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Webinar Items */}
              {webinarCartItems.map((item) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/webinars/${item.slug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/webinars/${item.slug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 mb-2">
                            Type: {item.type}
                          </p>
                          {item.startDate && (
                            <p className="text-sm text-gray-500 mb-3">
                              📅 {new Date(item.startDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {item.startTime && ` at ${item.startTime}`}
                            </p>
                          )}
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium mb-3">
                            Webinar
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            {renderPrice(item)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, 'webinar')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Course Items */}
              {courseCartItems.map((item) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/courses/${item.slug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {(item.coverImageUrl || item.coverImage) ? (
                            <Image
                              src={getPublicUrl(item.coverImageUrl || item.coverImage) || item.coverImageUrl || item.coverImage}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/courses/${item.slug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Comprehensive online course with video lessons
                          </p>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-3">
                            Online Course
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            {renderPrice(item)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, 'course')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Offline Batch Items */}
              {offlineBatchCartItems.map((item) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/offline-batches/${item.slug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {item.thumbnailUrl ? (
                            <Image
                              src={getPublicUrl(item.thumbnailUrl) || item.thumbnailUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Calendar className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/offline-batches/${item.slug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {item.shortDescription || 'In-person training program'}
                          </p>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium mb-3">
                            Offline Batch
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            {renderPrice(item)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, 'offlineBatch')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Bundle Items */}
              {bundleCartItems.map((item) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/bundle/${item.slug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {item.thumbnailUrl ? (
                            <Image
                              src={getPublicUrl(item.thumbnailUrl) || item.thumbnailUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                              <Package className="h-8 w-8 text-purple-500" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/bundle/${item.slug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {item.courses?.length || 0} courses included in this bundle
                          </p>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs font-medium mb-3">
                            <Package className="h-3 w-3 mr-1" />
                            Course Bundle
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            {renderPrice(item)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, 'bundle')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Mentorship Items */}
              {mentorshipCartItems.map((item) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Link href={`/mentorship/${item.slug}`} className="flex-shrink-0">
                        <div className="w-28 h-36 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:border-brand-500 transition-colors">
                          {item.coverImageUrl ? (
                            <Image
                              src={getPublicUrl(item.coverImageUrl) || item.coverImageUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/mentorship/${item.slug}`}>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 hover:text-brand-600 transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Structured live training program with expert mentorship
                          </p>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-medium mb-3">
                            Live Mentorship
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            {renderPrice(item)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, 'mentorship')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-2 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">₹{calculateTotal().toLocaleString('en-IN')}</span>
                    </div>
                    {appliedCoupon && (
                      <>
                        <div className="flex justify-between items-center py-2 bg-green-50 dark:bg-green-900/30 rounded-lg px-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <div className="flex flex-col">
                              <span className="text-green-700 dark:text-green-300 font-medium">
                                Discount ({appliedCoupon})
                              </span>
                              {couponDetails?.discountType === 'PERCENTAGE' && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  {couponDetails.discountValue}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                          {(() => {
                            const hasEbooks = cartItems.length > 0;
                            const hasWebinars = webinarCartItems.length > 0;
                            const hasGuidance = guidanceCartItems.length > 0;
                            const hasCourses = courseCartItems.length > 0;
                            const hasMentorship = mentorshipCartItems.length > 0;
                            const hasBundles = bundleCartItems.length > 0;
                            const hasOfflineBatches = offlineBatchCartItems.length > 0;

                            let applicableTo = 'ALL';
                            if (hasEbooks && !hasWebinars && !hasGuidance && !hasCourses && !hasMentorship && !hasBundles && !hasOfflineBatches) {
                              applicableTo = 'EBOOK';
                            } else if (hasWebinars && !hasEbooks && !hasGuidance && !hasCourses && !hasMentorship && !hasBundles && !hasOfflineBatches) {
                              applicableTo = 'WEBINAR';
                            } else if (hasGuidance && !hasEbooks && !hasWebinars && !hasCourses && !hasMentorship && !hasBundles && !hasOfflineBatches) {
                              applicableTo = 'GUIDANCE';
                            } else if (hasCourses && !hasEbooks && !hasWebinars && !hasGuidance && !hasMentorship && !hasBundles && !hasOfflineBatches) {
                              applicableTo = 'COURSE';
                            } else if (hasMentorship && !hasEbooks && !hasWebinars && !hasGuidance && !hasCourses && !hasBundles && !hasOfflineBatches) {
                              applicableTo = 'MENTORSHIP';
                            } else if (hasBundles && !hasEbooks && !hasWebinars && !hasGuidance && !hasCourses && !hasMentorship && !hasOfflineBatches) {
                              applicableTo = 'BUNDLE';
                            } else if (hasOfflineBatches && !hasEbooks && !hasWebinars && !hasGuidance && !hasCourses && !hasMentorship && !hasBundles) {
                              applicableTo = 'OFFLINE_BATCH';
                            }

                            const typeText = applicableTo === 'ALL' ? 'All Products' :
                              applicableTo === 'EBOOK' ? 'E-Books Only' :
                                applicableTo === 'WEBINAR' ? 'Webinars Only' :
                                  applicableTo === 'GUIDANCE' ? '1:1 Guidance Only' :
                                    applicableTo === 'COURSE' ? 'Courses Only' :
                                      applicableTo === 'MENTORSHIP' ? 'Live Mentorship Only' :
                                        applicableTo === 'BUNDLE' ? 'Bundles Only' :
                                          applicableTo === 'OFFLINE_BATCH' ? 'Offline Batches Only' : 'All Products';
                            return `Applied to: ${typeText}`;
                          })()}
                        </div>
                      </>
                    )}
                    <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-brand-600">₹{calculateFinalTotal().toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="coupon" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Have a coupon code?</Label>
                      {availableCoupons.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCouponsDialog(true)}
                          className="gap-2 text-xs"
                        >
                          <Gift className="h-3 w-3" />
                          Available ({availableCoupons.length})
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        disabled={!!appliedCoupon}
                        className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                      />
                      {!appliedCoupon ? (
                        <Button
                          onClick={() => applyCoupon()}
                          variant="outline"
                          className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-900/20"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponDiscount(0);
                            setCouponDetails(null);
                            setCouponCode('');
                            setCouponError('');
                            sessionStorage.removeItem('couponCode');

                            // Remove coupon from URL
                            const currentUrl = new URL(window.location.href);
                            currentUrl.searchParams.delete('coupon');
                            window.history.replaceState({}, '', currentUrl.toString());
                          }}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{couponError}</p>
                    )}
                    {appliedCoupon && !couponError && (
                      <p className="text-sm text-green-600 bg-green-50 rounded px-3 py-2">
                        ✓ Coupon applied successfully!
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-6 text-lg shadow-lg"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={!isAuthenticated}
                  >
                    Proceed to Pay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  {/* Security & Legal Links */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                      <Lock className="h-3 w-3" />
                      <span className="text-xs font-medium">Secure Payment via Razorpay</span>
                    </div>
                    <div className="flex justify-center items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline transition-colors">
                        Privacy Policy
                      </Link>
                      <span>•</span>
                      <Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline transition-colors">
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-xs text-center text-gray-500">
                      Please <Link href="/auth?mode=login" className="text-brand-600 hover:underline">login</Link> to continue
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Available Coupons Dialog */}
      <Dialog open={showCouponsDialog} onOpenChange={setShowCouponsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Coupons</DialogTitle>
            <DialogDescription>
              Select a coupon to apply to your cart
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {availableCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No coupons available at the moment</p>
            ) : (
              availableCoupons.map((coupon) => {
                const discountText = coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}% OFF`
                  : `₹${coupon.discountValue} OFF`;

                return (
                  <div
                    key={coupon.id}
                    className="p-4 border rounded-lg hover:border-brand-500 transition-colors cursor-pointer"
                    onClick={() => {
                      setCouponCode(coupon.code);
                      setShowCouponsDialog(false);
                      applyCoupon(coupon.code);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-bold text-lg text-brand-600 dark:text-brand-400">
                            {coupon.code}
                          </span>
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                            {discountText}
                          </Badge>
                        </div>
                        {coupon.title && (
                          <h4 className="font-semibold mb-1">{coupon.title}</h4>
                        )}
                        {coupon.description && (
                          <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {coupon.minAmount && (
                            <span>Min: ₹{coupon.minAmount}</span>
                          )}
                          {coupon.applicableTo !== 'ALL' && (
                            <span>• {coupon.applicableTo.replace('_', ' ')}</span>
                          )}
                          {coupon.usageLimit && (
                            <span>• {coupon.usedCount || 0}/{coupon.usageLimit} used</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-brand-600 hover:bg-brand-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCouponCode(coupon.code);
                          setShowCouponsDialog(false);
                          applyCoupon(coupon.code);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        strategy="lazyOnload"
      />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
