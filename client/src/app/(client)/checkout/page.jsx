'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ebookAPI, webinarAPI, courseAPI, orderAPI, couponAPI, offlineBatchAPI, bundleAPI } from '@/lib/api';
import { getPublicUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Tag, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [webinarCartItems, setWebinarCartItems] = useState([]);
  const [guidanceCartItems, setGuidanceCartItems] = useState([]);
  const [mentorshipCartItems, setMentorshipCartItems] = useState([]);
  const [courseCartItems, setCourseCartItems] = useState([]);
  const [offlineBatchCartItems, setOfflineBatchCartItems] = useState([]);
  const [bundleCartItems, setBundleCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/checkout';
      router.push(`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    loadCart();

    // Read coupon from URL query parameter
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon) {
      setCouponCode(urlCoupon.toUpperCase());
    }

    // Check if Razorpay is already loaded (from beforeInteractive script)
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, [isAuthenticated, router, searchParams]);

  // Auto-validate coupon from URL after cart items are loaded
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    const hasItems = cartItems.length > 0 || webinarCartItems.length > 0 ||
      guidanceCartItems.length > 0 || mentorshipCartItems.length > 0 ||
      courseCartItems.length > 0 || offlineBatchCartItems.length > 0 ||
      bundleCartItems.length > 0;

    // Only auto-validate if we have a URL coupon, items loaded, and not already applied
    if (urlCoupon && hasItems && !appliedCoupon && !loading) {
      validateCouponCode(urlCoupon.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cartItems, webinarCartItems, guidanceCartItems, mentorshipCartItems, courseCartItems, offlineBatchCartItems, bundleCartItems]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const webinarCart = JSON.parse(localStorage.getItem('webinarCart') || '[]');
      const guidanceCart = JSON.parse(localStorage.getItem('guidanceCart') || '[]');
      const mentorshipCart = JSON.parse(localStorage.getItem('mentorshipCart') || '[]');
      const courseCart = JSON.parse(localStorage.getItem('courseCart') || '[]');
      const offlineBatchCart = JSON.parse(localStorage.getItem('offlineBatchCart') || '[]');
      const bundleCart = JSON.parse(localStorage.getItem('bundleCart') || '[]');

      if (cart.length === 0 && webinarCart.length === 0 && guidanceCart.length === 0 && mentorshipCart.length === 0 && courseCart.length === 0 && offlineBatchCart.length === 0 && bundleCart.length === 0) {
        router.push('/cart');
        return;
      }

      // Load ebooks
      const ebookItems = cart.length > 0 ? await Promise.all(
        cart.map(async (id) => {
          try {
            const response = await ebookAPI.getEbookById(id);
            return response.success ? response.data.ebook : null;
          } catch {
            return null;
          }
        })
      ) : [];

      // Load webinars
      const webinarItems = webinarCart.length > 0 ? await Promise.all(
        webinarCart.map(async (id) => {
          try {
            const response = await webinarAPI.getWebinarById(id);
            return response.success ? response.data.webinar : null;
          } catch {
            return null;
          }
        })
      ) : [];

      // Load guidance (already have all data in localStorage)
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

  // Helper to get effective price (considers flash sale)
  const getEffectivePrice = (item) => {
    if (item.pricing?.effectivePrice !== undefined) {
      return item.pricing.effectivePrice;
    }
    return item.salePrice || item.price || 0;
  };

  const calculateTotal = () => {
    let total = 0;

    // Add ebook items
    cartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    // Add webinar items
    webinarCartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    // Add guidance items
    guidanceCartItems.forEach(item => {
      total += item.pricing?.effectivePrice || (item.price || 0); // Guidance slots are always paid
    });
    // Add mentorship items
    mentorshipCartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    // Add course items (ONLY ONCE)
    courseCartItems.forEach(item => {
      if (!item.isFree) {
        total += getEffectivePrice(item);
      }
    });
    // Add offline batch items
    offlineBatchCartItems.forEach(item => {
      if (!item.isFree && item.pricingType !== 'FREE') {
        total += getEffectivePrice(item);
      }
    });
    // Add bundle items
    bundleCartItems.forEach(item => {
      total += getEffectivePrice(item);
    });
    return total;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    return Math.max(0, subtotal - couponDiscount);
  };

  const validateCouponCode = async (code) => {
    if (!code.trim()) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    try {
      const total = calculateTotal();
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
        setCouponError('');

        // Update URL with coupon for persistence/sharing
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('coupon', response.data.coupon.code);
        window.history.replaceState({}, '', currentUrl.toString());


      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponError(error.message || 'Invalid coupon code');
      toast.error(error.message || 'Invalid coupon code');
      sessionStorage.removeItem('couponCode');
    }
  };

  const handlePayment = async () => {

    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    try {
      setProcessing(true);

      // Construct items object for initPayment
      const items = {
        ebookIds: cartItems.map(item => item.id),
        webinarIds: webinarCartItems.map(item => item.id),
        guidanceSlotIds: guidanceCartItems.map(item => item.slotId),
        mentorshipIds: mentorshipCartItems.map(item => item.id),
        courseIds: courseCartItems.map(item => item.id),
        bundleIds: bundleCartItems.map(item => item.id),
        offlineBatchIds: offlineBatchCartItems.map(item => item.id),
      };

      // Call initPayment to get Razorpay order or success (if free)
      const response = await orderAPI.initPayment(items, appliedCoupon ? appliedCoupon : null);

      if (!response.success) {
        throw new Error(response.message || 'Failed to initialize payment');
      }

      // If order is completely free
      if (response.data.isFree) {
        finishCheckout();
        return;
      }

      // Handle Razorpay payment
      const { razorpayOrder, paymentRef } = response.data;

      if (!razorpayOrder) {
        throw new Error('Invalid payment configuration');
      }

      const options = {
        key: razorpayOrder.key, // Use key from server response
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Shrestha Academy',
        description: 'Order Payment',
        image: 'https://shrestha.academy/logo.png', // Optional logo
        order_id: razorpayOrder.id,
        handler: async function (minResponse) {
          // Prevent multiple calls
          if (processing) {
            console.log('Payment handler already processing, ignoring duplicate call');
            return;
          }

          try {
            setProcessing(true);
            // Verify and create orders ONLY after successful payment
            const verifyResponse = await orderAPI.completePayment({
              razorpayOrderId: razorpayOrder.id,
              paymentId: minResponse.razorpay_payment_id,
              signature: minResponse.razorpay_signature,
              items: items,
              couponCode: appliedCoupon ? appliedCoupon : null
            });

            if (verifyResponse.success) {
              finishCheckout();
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment failed: ' + (error.message || 'Verification failed'));
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#5C64D7',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast('Payment cancelled');
          },
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error(error.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  const finishCheckout = () => {
    // Clear all carts using context (reactive)
    clearCart();

    // Clear additional session data
    sessionStorage.removeItem('couponCode');
    sessionStorage.removeItem('ebookOrderId');
    sessionStorage.removeItem('webinarOrderId');
    sessionStorage.removeItem('guidanceOrderId');
    sessionStorage.removeItem('mentorshipOrderId');
    sessionStorage.removeItem('courseOrderId');
    sessionStorage.removeItem('bundleOrderId');
    sessionStorage.removeItem('offlineBatchOrderId');

    router.push('/profile/orders?success=true');
    setProcessing(false);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="beforeInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Checkout</h1>
            <p className="text-gray-600 dark:text-gray-400">Complete your purchase securely</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                        {item.image1Url ? (
                          <Image
                            src={item.image1Url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.isFree ? (
                          <p className="text-green-600 font-semibold">Free</p>
                        ) : (
                          <p className="text-brand-600 font-semibold">
                            ₹{item.salePrice || item.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {webinarCartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">Webinar</p>
                        {item.isFree ? (
                          <p className="text-green-600 font-semibold">Free</p>
                        ) : (
                          <p className="text-brand-600 font-semibold">
                            ₹{item.salePrice || item.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {guidanceCartItems.map((item) => (
                    <div key={item.slotId} className="flex gap-4 pb-4 border-b">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                        {item.expertImageUrl ? (
                          <Image
                            src={item.expertImageUrl}
                            alt={item.guidanceTitle}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.guidanceTitle}</h3>
                        <p className="text-sm text-muted-foreground">1:1 Guidance</p>
                        <p className="text-brand-600 font-semibold">
                          ₹{item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                  {mentorshipCartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                        {item.coverImageUrl ? (
                          <Image
                            src={getPublicUrl(item.coverImageUrl) || item.coverImageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">Live Mentorship</p>
                        {item.isFree ? (
                          <p className="text-green-600 font-semibold">Free</p>
                        ) : (
                          <p className="text-brand-600 font-semibold">
                            ₹{item.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {courseCartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                        {(item.coverImageUrl || item.coverImage) ? (
                          <Image
                            src={getPublicUrl(item.coverImageUrl || item.coverImage) || item.coverImageUrl || item.coverImage}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">Online Course</p>
                        {item.isFree ? (
                          <p className="text-green-600 font-semibold">Free</p>
                        ) : (
                          <div>
                            {item.salePrice ? (
                              <>
                                <span className="text-muted-foreground line-through text-sm mr-2">
                                  ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                <span className="text-brand-600 font-semibold">
                                  ₹{item.salePrice.toLocaleString('en-IN')}
                                </span>
                              </>
                            ) : (
                              <p className="text-brand-600 font-semibold">
                                ₹{item.price.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {offlineBatchCartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                        {item.thumbnailUrl ? (
                          <Image
                            src={getPublicUrl(item.thumbnailUrl) || item.thumbnailUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">Offline Batch</p>
                        {item.isFree || item.pricingType === 'FREE' ? (
                          <p className="text-green-600 font-semibold">Free</p>
                        ) : (
                          <div>
                            {getEffectivePrice(item) < item.price ? (
                              <>
                                <span className="text-muted-foreground line-through text-sm mr-2">
                                  ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                <span className="text-brand-600 font-semibold">
                                  ₹{getEffectivePrice(item).toLocaleString('en-IN')}
                                </span>
                              </>
                            ) : (
                              <p className="text-brand-600 font-semibold">
                                ₹{item.price.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {bundleCartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
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
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">Course Bundle</p>
                        <div>
                          {getEffectivePrice(item) < (item.price || 0) ? (
                            <>
                              <span className="text-muted-foreground line-through text-sm mr-2">
                                ₹{(item.price || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-brand-600 font-semibold">
                                ₹{getEffectivePrice(item).toLocaleString('en-IN')}
                              </span>
                            </>
                          ) : (
                            <p className="text-brand-600 font-semibold">
                              ₹{(item.price || 0).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-2 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">₹{calculateTotal().toLocaleString('en-IN')}</span>
                    </div>
                    {appliedCoupon && couponDiscount > 0 && (
                      <>
                        <div className="flex justify-between items-center py-2 bg-green-50 dark:bg-green-900/30 rounded-lg px-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-700 dark:text-green-300 font-medium">Coupon ({appliedCoupon})</span>
                          </div>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                          {(() => {
                            const hasEbooks = cartItems.length > 0;
                            const hasWebinars = webinarCartItems.length > 0;
                            const hasGuidance = guidanceCartItems.length > 0;
                            const hasMentorship = mentorshipCartItems.length > 0;
                            let applicableTo = 'ALL';
                            if (hasEbooks && !hasWebinars && !hasGuidance && !hasMentorship) {
                              applicableTo = 'EBOOK';
                            } else if (hasWebinars && !hasEbooks && !hasGuidance && !hasMentorship) {
                              applicableTo = 'WEBINAR';
                            } else if (hasGuidance && !hasEbooks && !hasWebinars && !hasMentorship) {
                              applicableTo = 'GUIDANCE';
                            } else if (hasMentorship && !hasEbooks && !hasWebinars && !hasGuidance) {
                              applicableTo = 'MENTORSHIP';
                            }
                            const typeText = applicableTo === 'ALL' ? 'All Products' :
                              applicableTo === 'EBOOK' ? 'E-Books Only' :
                                applicableTo === 'WEBINAR' ? 'Webinars Only' :
                                  applicableTo === 'GUIDANCE' ? '1:1 Guidance Only' :
                                    applicableTo === 'MENTORSHIP' ? 'Live Mentorship Only' : 'All Products';
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
                    <Label htmlFor="coupon" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Have a coupon code?</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        disabled={!!appliedCoupon || processing}
                        className="flex-1"
                      />
                      {!appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => validateCouponCode(couponCode)}
                          disabled={!couponCode.trim() || processing}
                          className="border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponDiscount(0);
                            setCouponCode('');
                            setCouponError('');
                            sessionStorage.removeItem('couponCode');

                            // Remove coupon from URL
                            const currentUrl = new URL(window.location.href);
                            currentUrl.searchParams.delete('coupon');
                            window.history.replaceState({}, '', currentUrl.toString());
                          }}
                          disabled={processing}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{couponError}</p>
                    )}
                    {appliedCoupon && couponDiscount > 0 && !couponError && (
                      <p className="text-sm text-green-600 bg-green-50 rounded px-3 py-2">
                        ✓ You saved ₹{couponDiscount.toLocaleString('en-IN')}!
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-6 text-lg shadow-lg"
                    onClick={handlePayment}
                    disabled={processing || (!appliedCoupon && calculateFinalTotal() > 0 && !razorpayLoaded)}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : calculateFinalTotal() === 0 ? (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Complete Free Order
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay ₹{calculateFinalTotal().toLocaleString('en-IN')}
                      </>
                    )}
                  </Button>

                  {/* Terms and Privacy Links */}
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    By completing this purchase, you agree to our{' '}
                    <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
                  </p>

                  <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" asChild>
                    <Link href="/cart">← Back to Cart</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

