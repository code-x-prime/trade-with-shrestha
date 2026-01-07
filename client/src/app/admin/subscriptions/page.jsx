'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscriptionAPI, subscriptionPlanAPI } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Search, MoreVertical, Power, RefreshCw, X, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function AdminSubscriptionsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [tradingViewUsername, setTradingViewUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionDialog, setActionDialog] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSubscriptions();
      fetchPlans();
    }
  }, [user, isAdmin]);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionPlanAPI.getAllPlans();
      if (response.success) {
        setPlans(response.data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getAllSubscriptions({ limit: 100 });
      if (response.success) {
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTradingView = (subscription) => {
    setEditingSubscription(subscription);
    setTradingViewUsername(subscription.tradingViewUsername || '');
  };

  const handleSaveTradingView = async () => {
    if (!editingSubscription) return;

    try {
      setSaving(true);
      const response = await subscriptionAPI.updateTradingViewUsername(
        editingSubscription.id,
        tradingViewUsername
      );
      if (response.success) {
        toast.success('TradingView username updated successfully');
        setEditingSubscription(null);
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update TradingView username');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!actionDialog?.subscription || !selectedStatus) return;

    try {
      setSaving(true);
      const response = await subscriptionAPI.updateStatus(actionDialog.subscription.id, selectedStatus);
      if (response.success) {
        toast.success('Subscription status updated successfully');
        setActionDialog(null);
        setSelectedStatus('');
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChange = async () => {
    if (!actionDialog?.subscription || !selectedPlanId) return;

    try {
      setSaving(true);
      const response = await subscriptionAPI.updatePlan(actionDialog.subscription.id, selectedPlanId);
      if (response.success) {
        toast.success('Subscription plan updated successfully');
        setActionDialog(null);
        setSelectedPlanId('');
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const handleStopSubscription = async () => {
    if (!actionDialog?.subscription) return;

    try {
      setSaving(true);
      const response = await subscriptionAPI.cancelSubscription(actionDialog.subscription.id);
      if (response.success) {
        toast.success('Subscription stopped successfully');
        setActionDialog(null);
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to stop subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!actionDialog?.subscription) return;

    try {
      setSaving(true);
      const planId = selectedPlanId || actionDialog.subscription.planId;
      const response = await subscriptionAPI.adminRenewSubscription(actionDialog.subscription.id, planId);
      if (response.success) {
        toast.success('Subscription renewed successfully');
        setActionDialog(null);
        setSelectedPlanId('');
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to renew subscription');
    } finally {
      setSaving(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      sub.user.name?.toLowerCase().includes(searchLower) ||
      sub.user.email?.toLowerCase().includes(searchLower) ||
      sub.tradingViewUsername?.toLowerCase().includes(searchLower) ||
      sub.planType?.toLowerCase().includes(searchLower)
    );
  });

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="border-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
        <p className="text-muted-foreground">Manage all user subscriptions</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user name, email, or TradingView username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Subscriptions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>Manage subscriptions and assign TradingView usernames</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No subscriptions found</p>
              <p className="text-sm">
                {search ? 'Try adjusting your search query' : 'Subscriptions will appear here once users subscribe'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>TradingView Username</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {subscription.user.avatarUrl ? (
                              <Image
                                src={subscription.user.avatarUrl}
                                alt={subscription.user.name || 'User'}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-semibold">
                                  {(subscription.user.name || subscription.user.email)[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{subscription.user.name || 'No name'}</div>
                              <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {subscription.planType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              subscription.status === 'ACTIVE'
                                ? 'bg-green-500'
                                : subscription.status === 'EXPIRED'
                                ? 'bg-gray-500'
                                : 'bg-red-500'
                            }
                          >
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{subscription.finalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          {subscription.tradingViewUsername ? (
                            <span className="font-mono text-sm">{subscription.tradingViewUsername}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTradingView(subscription)}
                              title="Edit TradingView Username"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionDialog({ type: 'status', subscription });
                                    setSelectedStatus(subscription.status);
                                  }}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionDialog({ type: 'plan', subscription });
                                    setSelectedPlanId(subscription.planId);
                                  }}
                                >
                                  <ArrowUpDown className="mr-2 h-4 w-4" />
                                  Change Plan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {subscription.status !== 'CANCELLED' && (
                                  <DropdownMenuItem
                                    onClick={() => setActionDialog({ type: 'stop', subscription })}
                                    className="text-red-600"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Stop Subscription
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionDialog({ type: 'renew', subscription });
                                    setSelectedPlanId(subscription.planId);
                                  }}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Renew Subscription
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {subscription.user.avatarUrl ? (
                              <Image
                                src={subscription.user.avatarUrl}
                                alt={subscription.user.name || 'User'}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-sm font-semibold">
                                  {(subscription.user.name || subscription.user.email)[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{subscription.user.name || 'No name'}</div>
                              <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Plan</div>
                            <Badge variant="outline" className="mt-1">
                              {subscription.planType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <Badge
                              className={`mt-1 ${
                                subscription.status === 'ACTIVE'
                                  ? 'bg-green-500'
                                  : subscription.status === 'EXPIRED'
                                  ? 'bg-gray-500'
                                  : 'bg-red-500'
                              }`}
                            >
                              {subscription.status}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Amount</div>
                            <div className="font-semibold mt-1">₹{subscription.finalAmount.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">TradingView</div>
                            <div className="text-sm mt-1">
                              {subscription.tradingViewUsername || (
                                <span className="text-muted-foreground">Not assigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTradingView(subscription)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit TV
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionDialog({ type: 'status', subscription });
                                  setSelectedStatus(subscription.status);
                                }}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionDialog({ type: 'plan', subscription });
                                  setSelectedPlanId(subscription.planId);
                                }}
                              >
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Change Plan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {subscription.status !== 'CANCELLED' && (
                                <DropdownMenuItem
                                  onClick={() => setActionDialog({ type: 'stop', subscription })}
                                  className="text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Stop Subscription
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionDialog({ type: 'renew', subscription });
                                  setSelectedPlanId(subscription.planId);
                                }}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Renew Subscription
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit TradingView Dialog */}
      <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit TradingView Username</DialogTitle>
            <DialogDescription>
              Update the TradingView username for this subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">TradingView Username</label>
              <Input
                value={tradingViewUsername}
                onChange={(e) => setTradingViewUsername(e.target.value)}
                placeholder="Enter TradingView username"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubscription(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTradingView} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={actionDialog?.type === 'status'}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Status</DialogTitle>
            <DialogDescription>Update the status of this subscription</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={saving || !selectedStatus}>
              {saving ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Change Dialog */}
      <Dialog
        open={actionDialog?.type === 'plan'}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>Update the plan for this subscription</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.planType} - ₹{plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handlePlanChange} disabled={saving || !selectedPlanId}>
              {saving ? 'Updating...' : 'Update Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Subscription Dialog */}
      <AlertDialog
        open={actionDialog?.type === 'stop'}
        onOpenChange={() => setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStopSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? 'Stopping...' : 'Stop Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew Subscription Dialog */}
      <Dialog
        open={actionDialog?.type === 'renew'}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Subscription</DialogTitle>
            <DialogDescription>Renew this subscription with a plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.planType} - ₹{plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenewSubscription} disabled={saving || !selectedPlanId}>
              {saving ? 'Renewing...' : 'Renew Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
