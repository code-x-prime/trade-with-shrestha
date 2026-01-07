'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionAPI, couponAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Breadcrumb from '@/components/Breadcrumb';

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [tradingViewUsername, setTradingViewUsername] = useState('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login&redirect=/checkout/subscription');
      return;
    }

    // Check if user already has active subscription
    const checkSubscription = async () => {
      try {
        const response = await subscriptionAPI.checkActiveSubscription();
        if (response.success && response.data.hasActiveSubscription) {
          toast.error('You already have an active subscription');
          router.push('/profile/subscription');
          return;
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();

    // Get subscription data from sessionStorage
    const stored = sessionStorage.getItem('subscriptionPlan');
    if (stored) {
      setSubscriptionData(JSON.parse(stored));
      setTradingViewUsername('');
    } else {
      toast.error('No subscription plan selected');
      router.push('/subscription');
    }
  }, [isAuthenticated, router]);

  const validateCouponCode = async () => {
    if (!couponCode.trim() || !subscriptionData) return;

    try {
      const response = await couponAPI.validateCoupon(couponCode, subscriptionData.price, 'SUBSCRIPTION');
      if (response.success) {
        setAppliedCoupon(response.data.coupon);
        setCouponDiscount(response.data.discountAmount);
        toast.success('Coupon applied successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const calculateFinalTotal = () => {
    if (!subscriptionData) return 0;
    return Math.max(0, subscriptionData.price - couponDiscount);
  };

  const handlePayment = async () => {
    if (!subscriptionData || !isAuthenticated) return;

    if (!tradingViewUsername || !tradingViewUsername.trim()) {
      toast.error('TradingView username is required to access indicators');
      return;
    }

    try {
      setLoading(true);
      const response = await subscriptionAPI.createSubscription(
        subscriptionData.planId,
        tradingViewUsername.trim(),
        appliedCoupon?.code || null
      );

      if (response.success) {
        const { subscription, razorpayOrder } = response.data;

        if (subscription.finalAmount === 0) {
          // Free subscription
          toast.success('Payment successful! Subscription activated. You will get access within 10-15 minutes.');
          sessionStorage.removeItem('subscriptionPlan');
          router.push('/profile/subscription?success=true');
          return;
        }

        // Initialize Razorpay
        const options = {
          key: razorpayOrder.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Shrestha Academy',
          description: 'Global Subscription Plan',
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              const verifyResponse = await subscriptionAPI.verifyPayment(
                razorpayOrder.id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verifyResponse.success) {
                toast.success('Payment successful! Subscription activated. You will get access within 10-15 minutes.');
                sessionStorage.removeItem('subscriptionPlan');
                router.push('/profile/subscription?success=true');
              }
            } catch (error) {
              toast.error(error.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#5C64D7',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          toast.error('Payment failed: ' + response.error.description);
        });
        razorpay.open();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create subscription order');
    } finally {
      setLoading(false);
    }
  };

  if (!subscriptionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-brand-600" />
          <p className="mt-4">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const finalTotal = calculateFinalTotal();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Indicators', href: '/indicators' },
        { label: 'Checkout' }
      ]} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Global Subscription</h3>
                <p className="text-muted-foreground">
                  Plan: {subscriptionData.planType.replace('_', ' ')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This subscription gives you access to all indicators.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradingView">TradingView Username *</Label>
                <Input
                  id="tradingView"
                  value={tradingViewUsername}
                  onChange={(e) => setTradingViewUsername(e.target.value)}
                  placeholder="Enter your TradingView username"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Required: Admin will assign indicator access to this username
                </p>
              </div>

              <div className="border-t pt-4">
                <Label>Coupon Code</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <Button variant="outline" onClick={removeCoupon}>
                      Remove
                    </Button>
                  ) : (
                    <Button onClick={validateCouponCode}>Apply</Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Coupon &quot;{appliedCoupon.code}&quot; applied!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription</span>
                  <span>₹{subscriptionData.price.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-brand-600 hover:bg-brand-700"
                onClick={handlePayment}
                disabled={loading || finalTotal === 0 || !tradingViewUsername?.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${finalTotal.toFixed(2)}`
                )}
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/indicators">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

