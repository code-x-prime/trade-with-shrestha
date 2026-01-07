'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscriptionAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, XCircle, CheckCircle2, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PLAN_LABELS = {
  ONE_MONTH: '1 Month',
  QUARTER: '3 Months',
  SIX_MONTHS: '6 Months',
  ONE_YEAR: '1 Year',
  LIFETIME: 'Lifetime',
};

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login&redirect=/profile/subscription');
      return;
    }
    fetchSubscriptions();
    
    // Check for success message
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated successfully! You will get access within 10-15 minutes.');
    }
  }, [isAuthenticated, router, searchParams]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getUserSubscriptions();
      if (response.success) {
        const subs = response.data.subscriptions || [];
        setSubscriptions(subs);
        const active = subs.find(s => s.status === 'ACTIVE' && (!s.endDate || new Date(s.endDate) >= new Date()));
        setActiveSubscription(active);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellingId) return;

    try {
      const response = await subscriptionAPI.cancelSubscription(cancellingId);
      if (response.success) {
        toast.success('Subscription cancelled successfully. Refund will be processed in 5-7 working days.');
        setCancelDialogOpen(false);
        setCancellingId(null);
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#4A50B0]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
        <p className="text-muted-foreground">Manage your subscription plans</p>
      </div>

      {activeSubscription ? (
        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            You have an active subscription. You have access to all indicators.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 dark:bg-gray-900 dark:border-gray-800">
          <AlertTriangle className="h-4 w-4 dark:text-yellow-500" />
          <AlertDescription className="dark:text-gray-300">
            You don&apos;t have an active subscription. <Button variant="link" className="p-0 h-auto dark:text-brand-400" onClick={() => router.push('/subscription')}>Get subscription</Button>
          </AlertDescription>
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4 dark:text-gray-400">
              No subscriptions found
            </p>
            <Button onClick={() => router.push('/subscription')}>
              Get Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const isActive = subscription.status === 'ACTIVE' && (!subscription.endDate || new Date(subscription.endDate) >= new Date());
            const isCancelled = subscription.status === 'CANCELLED';

            return (
              <Card key={subscription.id} className={`${isActive ? 'border-2 border-green-500 dark:border-green-600' : 'dark:bg-gray-900 dark:border-gray-800'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl dark:text-white">{PLAN_LABELS[subscription.planType]}</CardTitle>
                      <CardDescription className="mt-1 dark:text-gray-400">
                        {subscription.plan?.planType || subscription.planType}
                      </CardDescription>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Start Date</p>
                        <p className="font-medium dark:text-gray-200">
                          {new Date(subscription.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {subscription.endDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">End Date</p>
                          <p className="font-medium dark:text-gray-200">
                            {new Date(subscription.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Amount Paid</p>
                        <p className="font-medium dark:text-gray-200">₹{subscription.finalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    {subscription.tradingViewUsername && (
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">TradingView Username</p>
                        <p className="font-medium dark:text-gray-200">{subscription.tradingViewUsername}</p>
                      </div>
                    )}
                  </div>

                  {isCancelled && subscription.cancelledAt && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Cancelled on {new Date(subscription.cancelledAt).toLocaleDateString()}. 
                        Refund will be processed within 5-7 working days.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isActive && !isCancelled && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setCancellingId(subscription.id);
                          setCancelDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? 
              <br /><br />
              <strong>Important:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You will lose access to all indicators after the current period ends</li>
                <li>Payment refund will be processed within 5-7 working days</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProfileSubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SubscriptionContent />
    </Suspense>
  );
}

