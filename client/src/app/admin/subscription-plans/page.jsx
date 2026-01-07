'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionPlanAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PLAN_TYPES = [
  { value: 'ONE_MONTH', label: '1 Month' },
  { value: 'QUARTER', label: '3 Months (Quarter)' },
  { value: 'SIX_MONTHS', label: '6 Months' },
  { value: 'ONE_YEAR', label: '1 Year' },
  { value: 'LIFETIME', label: 'Lifetime' },
];

const DEFAULT_FEATURES = [
  'Trusted by 0+ traders',
  'Access to the Indicator',
  'Access to Video Guides',
  'Regular indicator updates',
  'Full support from our team',
  'Cancel at any time',
];

export default function SubscriptionPlansPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    planType: 'ONE_MONTH',
    price: '',
    salePrice: '',
    isActive: true,
    isPopular: false,
    features: [...DEFAULT_FEATURES],
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPlans();
    }
  }, [user, isAdmin]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionPlanAPI.getAllPlans();
      if (response.success) {
        const fetchedPlans = response.data.plans || [];
        // Merge with PLAN_TYPES to show all plan types, even if not created yet
        const allPlans = PLAN_TYPES.map(type => {
          const existingPlan = fetchedPlans.find(p => p.planType === type.value);
          return existingPlan || {
            id: null,
            planType: type.value,
            price: 0,
            salePrice: null,
            isActive: false,
            isPopular: false,
            features: [...DEFAULT_FEATURES],
          };
        });
        setPlans(allPlans);
      } else {
        toast.error('Failed to fetch subscription plans');
        // Fallback to default plans
        const defaultPlans = PLAN_TYPES.map(type => ({
          id: null,
          planType: type.value,
          price: 0,
          salePrice: null,
          isActive: false,
          isPopular: false,
          features: [...DEFAULT_FEATURES],
        }));
        setPlans(defaultPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch subscription plans');
      // Fallback to default plans
      const defaultPlans = PLAN_TYPES.map(type => ({
        id: null,
        planType: type.value,
        price: 0,
        salePrice: null,
        isActive: false,
        isPopular: false,
        features: [...DEFAULT_FEATURES],
      }));
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planType: plan.planType,
      price: plan.price.toString(),
      salePrice: plan.salePrice?.toString() || '',
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      features: plan.features || [...DEFAULT_FEATURES],
    });
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const planData = {
        planType: formData.planType,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        features: formData.features,
      };

      const response = await subscriptionPlanAPI.upsertPlan(planData);
      if (response.success) {
        toast.success('Subscription plan saved successfully');
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast.error(response.message || 'Failed to save plan');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">Manage global subscription plans for all indicators</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLAN_TYPES.map((type) => {
          const plan = plans.find(p => p.planType === type.value);
          return (
            <Card key={type.value} className={plan?.isPopular ? 'border-2 border-brand-600' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{type.label}</CardTitle>
                  {plan?.isPopular && (
                    <Badge className="bg-brand-600">MOST POPULAR</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">₹{plan?.salePrice || plan?.price || 0}</p>
                    {plan?.salePrice && (
                      <p className="text-sm text-muted-foreground line-through">₹{plan?.price}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleEdit(plan || { planType: type.value, features: [...DEFAULT_FEATURES] })}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {plan ? 'Edit Plan' : 'Create Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Configure pricing and features for {PLAN_TYPES.find(t => t.value === formData.planType)?.label}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Price (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Sale Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="h-4 w-4"
                />
                <span>Most Popular</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => {
                        const updated = [...formData.features];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, features: updated });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add new feature"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

