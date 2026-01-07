'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { bundleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, X, Package, Check, ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';

export default function EditBundlePage() {
    const router = useRouter();
    const params = useParams();
    const bundleId = params?.id;
    const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingBundle, setLoadingBundle] = useState(true);
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        description: '',
        price: '',
        salePrice: '',
        isPublished: false,
    });
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [existingThumbnail, setExistingThumbnail] = useState(null);
    const [selectedCourses, setSelectedCourses] = useState([]);

    // MediaPicker state
    const [showImagePicker, setShowImagePicker] = useState(false);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated && isAdmin && bundleId) {
            fetchBundle();
            fetchCourses();
        }
    }, [isAuthenticated, isAdmin, bundleId]);

    const fetchBundle = async () => {
        try {
            setLoadingBundle(true);
            const response = await bundleAPI.getById(bundleId);
            if (response.success && response.data.bundle) {
                const bundle = response.data.bundle;
                setFormData({
                    title: bundle.title || '',
                    shortDescription: bundle.shortDescription || '',
                    description: bundle.description || '',
                    price: bundle.price?.toString() || '',
                    salePrice: bundle.salePrice?.toString() || '',
                    isPublished: bundle.isPublished || false,
                });
                setExistingThumbnail(bundle.thumbnailUrl || bundle.thumbnail);
                setSelectedCourses(bundle.courses?.map(c => c.id) || []);
            } else {
                toast.error('Bundle not found');
                router.push('/admin/bundles');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch bundle');
            router.push('/admin/bundles');
        } finally {
            setLoadingBundle(false);
        }
    };

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const response = await bundleAPI.getCoursesForBundle();
            if (response.success) {
                setCourses(response.data.courses || []);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch courses');
        } finally {
            setLoadingCourses(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const removeImage = () => {
        setThumbnail(null);
        setThumbnailPreview(null);
        setExistingThumbnail(null);
    };

    const handleCourseToggle = useCallback((courseId) => {
        setSelectedCourses(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        if (!formData.description.trim()) {
            toast.error('Description is required');
            return;
        }

        if (selectedCourses.length < 2) {
            toast.error('Select at least 2 courses for the bundle');
            return;
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            toast.error('Price is required');
            return;
        }

        try {
            setLoading(true);
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('shortDescription', formData.shortDescription);
            submitData.append('description', formData.description);
            submitData.append('price', formData.price);
            if (formData.salePrice) {
                submitData.append('salePrice', formData.salePrice);
            }
            submitData.append('isPublished', formData.isPublished);
            submitData.append('courseIds', JSON.stringify(selectedCourses));
            if (thumbnail) {
                // File upload
                submitData.append('thumbnail', thumbnail);
            } else if (thumbnailPreview && !thumbnail) {
                // URL from MediaPicker
                submitData.append('thumbnailUrl', thumbnailPreview);
            }

            const response = await bundleAPI.update(bundleId, submitData);
            if (response.success) {
                toast.success('Bundle updated successfully!');
                router.push('/admin/bundles');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update bundle');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalValue = () => {
        return selectedCourses.reduce((total, courseId) => {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                return total + (course.salePrice || course.price || 0);
            }
            return total;
        }, 0);
    };

    if (authLoading || loadingBundle) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Skeleton className="h-10 w-48 mb-6" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/bundles">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Bundle</h1>
                    <p className="text-muted-foreground">Update bundle details and courses</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">Bundle Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Complete Trading Mastery Bundle"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="shortDescription">Short Description</Label>
                            <Textarea
                                id="shortDescription"
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleInputChange}
                                placeholder="Brief description for listings..."
                                rows={2}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Full Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Detailed description of what's included in the bundle..."
                                rows={5}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="thumbnail">Thumbnail Image</Label>
                            <div className="mt-2">
                                {(thumbnailPreview || existingThumbnail) ? (
                                    <div className="relative w-64 h-40 rounded-lg overflow-hidden border">
                                        <Image
                                            src={thumbnailPreview || getPublicUrl(existingThumbnail) || existingThumbnail}
                                            alt="Thumbnail preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => setShowImagePicker(true)}
                                            >
                                                Change
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={removeImage}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-64 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                                        onClick={() => setShowImagePicker(true)}
                                    >
                                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Click to select thumbnail</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Select Courses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Select Courses *</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                {selectedCourses.length} selected (min 2 required)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingCourses ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No published courses available</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {courses.map((course) => {
                                    const isSelected = selectedCourses.includes(course.id);
                                    return (
                                        <div
                                            key={course.id}
                                            className={`flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                    : 'border-border hover:border-brand-200'
                                                }`}
                                            onClick={() => handleCourseToggle(course.id)}
                                        >
                                            <div className={`
                                                h-4 w-4 shrink-0 rounded-sm border border-primary shadow flex items-center justify-center
                                                ${isSelected ? 'bg-primary text-white' : 'bg-transparent'}
                                            `}>
                                                {isSelected && <div className="h-3 w-3"><Check size={12} strokeWidth={3} /></div>}
                                            </div>
                                            {course.coverImageUrl || course.coverImage ? (
                                                <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={getPublicUrl(course.coverImageUrl || course.coverImage) || course.coverImageUrl}
                                                        alt={course.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{course.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    ₹{(course.salePrice || course.price || 0).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {selectedCourses.length > 0 && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium">
                                    Total Course Value: ₹{calculateTotalValue().toLocaleString('en-IN')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="price">Bundle Price (₹) *</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="3999"
                                    min="0"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="salePrice">Sale Price (₹)</Label>
                                <Input
                                    id="salePrice"
                                    name="salePrice"
                                    type="number"
                                    value={formData.salePrice}
                                    onChange={handleInputChange}
                                    placeholder="2999"
                                    min="0"
                                />
                            </div>
                        </div>

                        {selectedCourses.length >= 2 && formData.price && calculateTotalValue() > 0 && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-green-700 dark:text-green-300 font-medium">
                                    Savings: ₹{(calculateTotalValue() - parseFloat(formData.salePrice || formData.price)).toLocaleString('en-IN')}
                                    {' '}({Math.round(((calculateTotalValue() - parseFloat(formData.salePrice || formData.price)) / calculateTotalValue()) * 100)}% off)
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Publish Status */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Publish Bundle</Label>
                                <p className="text-sm text-muted-foreground">
                                    Make this bundle visible to users
                                </p>
                            </div>
                            <Switch
                                checked={formData.isPublished}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex gap-4">
                    <Link href="/admin/bundles" className="flex-1">
                        <Button type="button" variant="outline" className="w-full">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="flex-1 bg-brand-600 hover:bg-brand-700"
                        disabled={loading || selectedCourses.length < 2}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Update Bundle'
                        )}
                    </Button>
                </div>
            </form>

            {/* MediaPicker Dialog */}
            <MediaPicker
                open={showImagePicker}
                onOpenChange={setShowImagePicker}
                onSelect={(url) => {
                    setThumbnailPreview(url);
                    setThumbnail(null);
                    setExistingThumbnail(null);
                }}
                type="image"
                title="Select Bundle Thumbnail"
                description="Choose an image from your media library"
            />
        </div>
    );
}
