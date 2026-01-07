'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, X, Search, Check, XCircle } from 'lucide-react';
import { couponAPI, adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import MediaPicker from '@/components/admin/MediaPicker';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { getPublicUrl } from '@/lib/imageUtils';
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

export default function AdminCouponsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minAmount: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    applicableTo: 'ALL',
    isActive: true,
    targetUserType: 'ALL',
    targetUserId: '',
    targetContentType: 'ALL_CONTENT',
    imageUrl: '',
    videoUrl: '',
    readyToShow: false,
    title: '',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [videoPreview, setVideoPreview] = useState('');
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Coupon Templates
  const couponTemplates = [
    {
      id: 'NEW_USER',
      name: 'New User Welcome',
      targetUserType: 'NEW_USER',
      title: 'Welcome! Special Offer for New Users',
      description: 'Get exclusive discounts on your first purchase. Start your learning journey with us!',
    },
    {
      id: 'FESTIVAL',
      name: 'Festival Special',
      targetUserType: 'ALL',
      title: 'Festival Special Offer!',
      description: 'Celebrate with us! Get amazing discounts on all courses and resources.',
    },
    {
      id: 'ANNIVERSARY',
      name: 'Anniversary Sale',
      targetUserType: 'ALL',
      title: 'Anniversary Celebration!',
      description: 'Join our anniversary celebration with special discounts on premium courses.',
    },
    {
      id: 'SEASONAL',
      name: 'Seasonal Sale',
      targetUserType: 'ALL',
      title: 'Seasonal Sale - Limited Time!',
      description: 'Don\'t miss out on our seasonal sale. Get the best deals on all products.',
    },
    {
      id: 'FLASH',
      name: 'Flash Sale',
      targetUserType: 'ALL',
      title: 'Flash Sale - Hurry Up!',
      description: 'Limited time flash sale! Grab your favorite courses at unbeatable prices.',
    },
  ];

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchCoupons();
    }
  }, [user, isAdmin]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponAPI.getCoupons({ limit: 100 });
      if (response.success) {
        setCoupons(response.data.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error(error.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let submitData = {
        ...formData,
        imageUrl: imagePreview || formData.imageUrl,
        videoUrl: videoPreview || formData.videoUrl,
      };

      // If specific users selected, store comma-separated user IDs
      if (formData.targetUserType === 'SPECIFIC_USER' && selectedUsers.length > 0) {
        // Store comma-separated user IDs (backend will handle)
        submitData.targetUserId = selectedUsers.map(u => u.id).join(',');
      } else if (formData.targetUserType !== 'SPECIFIC_USER') {
        submitData.targetUserId = '';
      }

      if (editingCoupon) {
        const response = await couponAPI.updateCoupon(editingCoupon.id, submitData);
        if (response.success) {
          toast.success('Coupon updated successfully');
          fetchCoupons();
          setShowForm(false);
          setEditingCoupon(null);
          resetForm();
        }
      } else {
        const response = await couponAPI.createCoupon(submitData);
        if (response.success) {
          toast.success('Coupon created successfully');
          fetchCoupons();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minAmount: '',
      maxDiscount: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      applicableTo: 'ALL',
      isActive: true,
      targetUserType: 'ALL',
      targetUserId: '',
      targetContentType: 'ALL_CONTENT',
      imageUrl: '',
      videoUrl: '',
      readyToShow: false,
      title: '',
      description: '',
    });
    setImagePreview('');
    setVideoPreview('');
    setSelectedUsers([]);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  // Search users
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    try {
      const response = await adminAPI.getUsers({ search: query, limit: 10 });
      if (response.success) {
        setUserSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Apply template
  const applyTemplate = (template) => {
    setFormData({
      ...formData,
      targetUserType: template.targetUserType,
      title: template.title,
      description: template.description,
    });
  };

  // Add/Remove user from selection
  const toggleUserSelection = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  // Remove selected user
  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minAmount: coupon.minAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      usageLimit: coupon.usageLimit?.toString() || '',
      applicableTo: coupon.applicableTo || 'ALL',
      isActive: coupon.isActive,
      targetUserType: coupon.targetUserType || 'ALL',
      targetUserId: coupon.targetUserId || '',
      targetContentType: coupon.targetContentType || 'ALL_CONTENT',
      imageUrl: coupon.imageUrl || '',
      videoUrl: coupon.videoUrl || '',
      readyToShow: coupon.readyToShow || false,
      title: coupon.title || '',
      description: coupon.description || '',
      targetContentType: coupon.targetContentType || 'ALL_CONTENT',
    });
    setImagePreview(coupon.imageUrl ? getPublicUrl(coupon.imageUrl) : '');
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const response = await couponAPI.deleteCoupon(deleteDialog.id);
      if (response.success) {
        toast.success('Coupon deleted successfully');
        fetchCoupons();
        setDeleteDialog(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete coupon');
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-40" />
        <Card className="border-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingCoupon(null);
            resetForm();
          }}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {showForm && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</CardTitle>
            <CardDescription>
              {editingCoupon ? 'Update coupon details' : 'Add a new discount coupon'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                    placeholder="SAVE10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount Value * ({formData.discountType === 'PERCENTAGE' ? '%' : '₹'})
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Amount (₹)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Unlimited if empty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicableTo">Applicable To *</Label>
                  <Select
                    value={formData.applicableTo}
                    onValueChange={(value) => setFormData({ ...formData, applicableTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select applicable products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Products</SelectItem>
                      <SelectItem value="EBOOK">E-Books Only</SelectItem>
                      <SelectItem value="COURSE">Courses Only</SelectItem>
                      <SelectItem value="BUNDLE">Bundles Only</SelectItem>
                      <SelectItem value="OFFLINE_BATCH">Offline Batches Only</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscriptions Only</SelectItem>
                      <SelectItem value="WEBINAR">Webinars Only</SelectItem>
                      <SelectItem value="GUIDANCE">1:1 Guidance Only</SelectItem>
                      <SelectItem value="MENTORSHIP">Live Mentorship Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              {/* New Fields Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Popup Display Settings</h3>

                {/* Coupon Templates */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold mb-2 block">Quick Templates (Select to auto-fill)</Label>
                  <div className="flex flex-wrap gap-2">
                    {couponTemplates.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="text-xs"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetUserType">Target User Type *</Label>
                    <Select
                      value={formData.targetUserType}
                      onValueChange={(value) => {
                        setFormData({ ...formData, targetUserType: value });
                        if (value !== 'SPECIFIC_USER') {
                          setSelectedUsers([]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Users</SelectItem>
                        <SelectItem value="NEW_USER">New Users Only</SelectItem>
                        <SelectItem value="SPECIFIC_USER">Specific Users (Select Multiple)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.targetUserType === 'SPECIFIC_USER' && (
                    <div className="space-y-2">
                      <Label>Select Users</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                            setShowUserSearch(true);
                          }}
                          onFocus={() => setShowUserSearch(true)}
                          placeholder="Search users by name or email..."
                          className="pl-10"
                        />
                        {showUserSearch && userSearchResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {userSearchResults.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => toggleUserSelection(user)}
                                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between ${selectedUsers.find(u => u.id === user.id) ? 'bg-green-50 dark:bg-green-900/20' : ''
                                  }`}
                              >
                                <div>
                                  <div className="font-medium text-sm">{user.name || 'No Name'}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                                {selectedUsers.find(u => u.id === user.id) && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedUsers.map((user) => (
                            <Badge key={user.id} variant="secondary" className="gap-1">
                              {user.name || user.email}
                              <button
                                type="button"
                                onClick={() => removeSelectedUser(user.id)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="targetContentType">Target Content Type</Label>
                    <Select
                      value={formData.targetContentType}
                      onValueChange={(value) => setFormData({ ...formData, targetContentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_CONTENT">All Content</SelectItem>
                        <SelectItem value="COURSE">Courses</SelectItem>
                        <SelectItem value="BUNDLE">Bundles</SelectItem>
                        <SelectItem value="EBOOK">E-Books</SelectItem>
                        <SelectItem value="WEBINAR">Webinars</SelectItem>
                        <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
                        <SelectItem value="GUIDANCE">1:1 Guidance</SelectItem>
                        <SelectItem value="OFFLINE_BATCH">Offline Batches</SelectItem>
                        <SelectItem value="INDICATOR">Indicators</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Popup Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Special Offer!"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Popup Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Get amazing discounts on our courses..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Popup Image</Label>
                    <div className="flex gap-2">
                      {imagePreview ? (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Coupon preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('');
                              setFormData({ ...formData, imageUrl: '' });
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowImagePicker(true)}
                        >
                          Select Image
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Popup Video</Label>
                    <div className="flex gap-2">
                      {videoPreview ? (
                        <div className="relative w-full aspect-video border rounded-lg overflow-hidden bg-black">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setVideoPreview('');
                              setFormData({ ...formData, videoUrl: '' });
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowVideoPicker(true)}
                            className="flex-1"
                          >
                            Select Video from Media
                          </Button>
                          <div className="text-xs text-muted-foreground flex items-center">OR</div>
                          <Input
                            id="videoUrl"
                            value={formData.videoUrl}
                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                            placeholder="Enter Video URL"
                            className="flex-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="readyToShow"
                      checked={formData.readyToShow}
                      onCheckedChange={(checked) => setFormData({ ...formData, readyToShow: checked })}
                    />
                    <Label htmlFor="readyToShow">Ready to Show in Popup</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-brand-600 hover:bg-brand-700">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* MediaPicker Dialogs */}
      <MediaPicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        onSelect={(url) => {
          setImagePreview(url);
          setFormData({ ...formData, imageUrl: url });
        }}
        type="image"
        title="Select Coupon Image"
        description="Choose an image from your media library"
      />
      <MediaPicker
        open={showVideoPicker}
        onOpenChange={setShowVideoPicker}
        onSelect={(url) => {
          setVideoPreview(url);
          setFormData({ ...formData, videoUrl: url });
        }}
        type="video"
        title="Select Coupon Video"
        description="Choose a video from your media library"
      />

      {/* Ready to Show Section */}
      {coupons.filter(c => c.readyToShow).length > 0 && (
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Ready to Show in Popup ({coupons.filter(c => c.readyToShow).length})
            </CardTitle>
            <CardDescription>
              These coupons will be displayed in popups based on user eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coupons.filter(c => c.readyToShow).map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <div className="font-semibold">{coupon.code}</div>
                    <div className="text-sm text-muted-foreground">
                      {coupon.title || 'No title'} - {coupon.targetUserType === 'ALL' ? 'All Users' : coupon.targetUserType === 'NEW_USER' ? 'New Users' : 'Specific User'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Coupons ({coupons.length})</CardTitle>
          <CardDescription>Manage discount coupons</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No coupons found</p>
              <p className="text-sm">Create your first coupon to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Applicable To</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ready to Show</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                      <TableCell>
                        {coupon.discountType === 'PERCENTAGE' ? (
                          <span>{coupon.discountValue}%</span>
                        ) : (
                          <span>₹{coupon.discountValue}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {coupon.applicableTo === 'ALL' ? 'All Products' :
                            coupon.applicableTo === 'EBOOK' ? 'E-Books Only' :
                              coupon.applicableTo === 'COURSE' ? 'Courses Only' :
                                coupon.applicableTo === 'BUNDLE' ? 'Bundles Only' :
                                  coupon.applicableTo === 'OFFLINE_BATCH' ? 'Offline Batches Only' :
                                    coupon.applicableTo === 'SUBSCRIPTION' ? 'Subscriptions Only' :
                                      coupon.applicableTo === 'WEBINAR' ? 'Webinars Only' :
                                        coupon.applicableTo === 'GUIDANCE' ? '1:1 Guidance Only' :
                                          coupon.applicableTo === 'MENTORSHIP' ? 'Live Mentorship Only' : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(coupon.validUntil).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.usageLimit
                          ? `${coupon.usedCount || 0}/${coupon.usageLimit}`
                          : `${coupon.usedCount || 0} (Unlimited)`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={coupon.isActive ? 'default' : 'secondary'}
                          className={coupon.isActive ? 'bg-green-500' : ''}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={coupon.readyToShow ? 'default' : 'outline'}
                          className={coupon.readyToShow ? 'bg-blue-500' : ''}
                        >
                          {coupon.readyToShow ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteDialog(coupon)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon <strong>{deleteDialog?.code}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
