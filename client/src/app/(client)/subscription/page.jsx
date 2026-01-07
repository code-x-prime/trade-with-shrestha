'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionPlanAPI, subscriptionAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Download, RefreshCw, Headphones, Check, ArrowRight, Percent, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '@/components/Breadcrumb';

const PLAN_LABELS = {
  ONE_MONTH: '1 Month',
  QUARTER: '3 Months',
  SIX_MONTHS: '6 Months',
  ONE_YEAR: '1 Year',
  LIFETIME: 'Lifetime',
};

const PLAN_ORDER = ['ONE_MONTH', 'QUARTER', 'SIX_MONTHS', 'ONE_YEAR', 'LIFETIME'];

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      checkActiveSubscription();
    }
    fetchSubscriptionPlans();
  }, [isAuthenticated]);

  const checkActiveSubscription = async () => {
    try {
      setCheckingSubscription(true);
      const response = await subscriptionAPI.checkActiveSubscription();
      if (response.success) {
        setHasActiveSubscription(response.data.hasActiveSubscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionPlanAPI.getPlans(true);
      if (response.success) {
        const plans = response.data.plans || [];
        // Sort plans according to PLAN_ORDER
        const sortedPlans = PLAN_ORDER
          .map(planType => plans.find(p => p.planType === planType))
          .filter(Boolean);
        setSubscriptionPlans(sortedPlans);
      } else {
        toast.error('Failed to fetch subscription plans');
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan) => {
    if (!isAuthenticated) {
      router.push(`/auth?mode=login&redirect=/subscription`);
      return;
    }

    // Store plan in sessionStorage for checkout
    sessionStorage.setItem('subscriptionPlan', JSON.stringify({
      planId: plan.id,
      planType: plan.planType,
      price: plan.salePrice || plan.price,
    }));

    router.push('/checkout/subscription');
  };

  const calculateSavings = (plan) => {
    if (!plan.salePrice || plan.planType === 'LIFETIME') return null;
    
    const monthlyPlan = subscriptionPlans.find(p => p.planType === 'ONE_MONTH');
    if (!monthlyPlan) return null;
    
    const monthlyPrice = monthlyPlan.salePrice || monthlyPlan.price;
    const months = plan.planType === 'QUARTER' ? 3 : plan.planType === 'SIX_MONTHS' ? 6 : plan.planType === 'ONE_YEAR' ? 12 : 1;
    const equivalentMonthly = (plan.salePrice || plan.price) / months;
    const savings = ((monthlyPrice - equivalentMonthly) / monthlyPrice) * 100;
    
    return savings > 0 ? Math.round(savings) : null;
  };

  if (loading || checkingSubscription) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Subscription Plans' }
        ]} />
        <div className="max-w-7xl mx-auto mt-8">
          <div className="text-center mb-8 space-y-4">
            <Skeleton className="h-10 w-96 mx-auto" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="w-full sm:w-[280px] dark:bg-gray-900 dark:border-gray-800">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-24 dark:bg-gray-800" />
                  <Skeleton className="h-4 w-32 mt-2 dark:bg-gray-800" />
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Skeleton className="h-8 w-32 dark:bg-gray-800" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <Skeleton key={j} className="h-4 w-full dark:bg-gray-800" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full mt-3 dark:bg-gray-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasActiveSubscription) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Subscription Plans' }
        ]} />
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <Card className="p-12 dark:bg-gray-900 dark:border-gray-800">
            <CardContent>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 dark:text-white">You Already Have an Active Subscription</h2>
              <p className="text-muted-foreground mb-6 dark:text-gray-400">
                You already have an active subscription. You have access to all indicators.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/profile/subscription')} className="bg-[#4A50B0] hover:bg-[#3d4288] text-white">
                  View My Subscription
                </Button>
                <Button variant="outline" onClick={() => router.push('/indicators')} className="dark:text-white dark:border-gray-700 dark:hover:bg-gray-800">
                  Browse Indicators
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Subscription Plans' }
      ]} />

      <div className="max-w-7xl mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 dark:text-white">Choose Your Subscription Plan</h1>
          <p className="text-muted-foreground text-lg dark:text-gray-400">
            Get access to all indicators with our flexible subscription plans
          </p>
        </div>

        {subscriptionPlans.length === 0 ? (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground text-lg dark:text-gray-400">
                No subscription plans available at the moment. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6 overflow-x-auto pb-4">
            {subscriptionPlans.map((plan) => {
              const savings = calculateSavings(plan);

              return (
              <Card 
                key={plan.id} 
                className={`relative w-full sm:w-[280px] flex-shrink-0 dark:bg-gray-900 dark:border-gray-800 ${plan.isPopular ? 'border-2 border-[#4A50B0] shadow-lg dark:border-[#5C64D7]' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-[#4A50B0] text-white px-3 py-0.5 text-xs">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                
                {savings && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <Percent className="h-3 w-3" />
                      Save {savings}%
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg dark:text-white">{PLAN_LABELS[plan.planType]}</CardTitle>
                  {plan.planType === 'QUARTER' && savings && (
                    <p className="text-xs text-muted-foreground mt-1 dark:text-gray-400">vs monthly</p>
                  )}
                  {plan.planType === 'LIFETIME' && (
                    <p className="text-xs text-muted-foreground mt-1 dark:text-gray-400">Only Pay Once</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold dark:text-white">₹{(plan.salePrice || plan.price).toFixed(2)}</span>
                      {plan.salePrice && (
                        <span className="text-sm text-muted-foreground line-through dark:text-gray-500">
                          ₹{plan.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {plan.planType !== 'LIFETIME' && (
                      <p className="text-xs text-muted-foreground mt-1 dark:text-gray-400">
                        per {plan.planType === 'ONE_MONTH' ? 'month' : plan.planType === 'QUARTER' ? '3 months' : plan.planType === 'SIX_MONTHS' ? '6 months' : 'year'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {plan.features.map((feature, idx) => {
                      const iconMap = {
                        'Trusted by': Trophy,
                        'Access to the Indicator': Download,
                        'Access to Video Guides': Download,
                        'Regular indicator updates': RefreshCw,
                        'Full support': Headphones,
                        'Priority support': Headphones,
                        'Cancel at any time': Check,
                      };
                      const Icon = Object.entries(iconMap).find(([key]) => feature.includes(key))?.[1] || Check;
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <Icon className="h-4 w-4 text-[#4A50B0] mt-0.5 flex-shrink-0 dark:text-[#6f76ff]" />
                          <span className="text-xs dark:text-gray-300">{feature}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    className={`w-full mt-3 ${plan.isPopular ? 'bg-[#4A50B0] hover:bg-[#3d4288]' : 'bg-[#4A50B0] hover:bg-[#3d4288]'}`}
                    onClick={() => handleSubscribe(plan)}
                    size="sm"
                  >
                    Get Access Now
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

