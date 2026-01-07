'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { addToCart as addToCartUtil } from '@/lib/cartUtils';
import { bundleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Package,
    ShoppingCart,
    CheckCircle,
    PlayCircle,
    BookOpen,
    Users,
    Clock,
    ArrowLeft,
    Tag,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';

export default function BundleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params?.slug;
    const { isAuthenticated } = useAuth();
    const { isInCart } = useCart();
    const [bundle, setBundle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchBundle();

            // If payment was just verified, refresh after a short delay
            if (searchParams.get('payment') === 'success') {
                setTimeout(() => {
                    fetchBundle();
                }, 2000);
                // Remove the query parameter
                router.replace(`/bundle/${slug}`, { scroll: false });
            }
        }
    }, [slug, isAuthenticated]); // Refresh when authentication status changes

    // Refresh enrollment status periodically if authenticated but not enrolled
    useEffect(() => {
        if (isAuthenticated && bundle && !isEnrolled) {
            const interval = setInterval(() => {
                fetchBundle();
            }, 5000); // Check every 5 seconds

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, bundle, isEnrolled]);

    const fetchBundle = async () => {
        try {
            setLoading(true);
            const response = await bundleAPI.getBundleBySlug(slug);
            if (response.success && response.data.bundle) {
                setBundle(response.data.bundle);
                setIsEnrolled(response.data.isEnrolled || false);
            } else {
                toast.error('Bundle not found');
                router.push('/bundle');
            }
        } catch (error) {
            console.error('Failed to fetch bundle:', error);
            toast.error(error.message || 'Failed to load bundle');
            router.push('/bundle');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        try {
            setAddingToCart(true);

            // Add to localStorage first (works for both guest and logged in)
            const bundleCart = JSON.parse(localStorage.getItem('bundleCart') || '[]');
            if (!bundleCart.includes(bundle.id)) {
                bundleCart.push(bundle.id);
                localStorage.setItem('bundleCart', JSON.stringify(bundleCart));

                // Also update the cartItems legacy key for sync
                const currentCartItems = JSON.parse(localStorage.getItem('cartItems') || '{}');
                currentCartItems.bundleCart = bundleCart;
                localStorage.setItem('cartItems', JSON.stringify(currentCartItems));
            }

            // Sync to backend if authenticated
            if (isAuthenticated) {
                await addToCartUtil('BUNDLE', bundle.id, isAuthenticated);
            }

            window.dispatchEvent(new Event('cartUpdated'));
            toast.success('Bundle added to cart!');
            router.push('/cart');
        } catch (error) {
            toast.error(error.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };



    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-64 w-full rounded-2xl mb-6" />
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div>
                        <Skeleton className="h-96 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!bundle) {
        return null;
    }

    const imageUrl = getPublicUrl(bundle.thumbnailUrl || bundle.thumbnail) || bundle.thumbnailUrl;
    const { pricing, courses: bundleCourses = [], coursesCount, enrollmentsCount, totalCoursesValue, savings } = bundle;
    const courses = Array.isArray(bundleCourses) ? bundleCourses : [];
    const effectivePrice = pricing?.effectivePrice ?? bundle.salePrice ?? bundle.price ?? 0;
    const originalPrice = pricing?.displayOriginalPrice ?? bundle.price ?? 0;
    const hasDiscount = effectivePrice < originalPrice;
    const discountPercent = pricing?.discountPercent || (hasDiscount ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0);
    const inCart = isInCart('BUNDLE', bundle.id);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Back Button */}
            <Link href="/bundle" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bundles
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Hero Image */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={bundle.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
                                <Package className="h-24 w-24 text-brand-500" />
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            {pricing?.hasFlashSale && (
                                <Badge className="bg-red-500 text-white">
                                    ⚡ Flash Sale
                                </Badge>
                            )}
                            {discountPercent > 0 && (
                                <Badge className="bg-green-500 text-white">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {discountPercent}% OFF
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Title and Description */}
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{bundle.title}</h1>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="h-5 w-5" />
                                <span>{coursesCount} Courses</span>
                            </div>
                            {enrollmentsCount > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-5 w-5" />
                                    <span>{enrollmentsCount} students</span>
                                </div>
                            )}
                        </div>

                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {bundle.description}
                        </p>
                    </div>

                    <Separator />

                    {/* Included Courses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-brand-600" />
                                What&apos;s Included ({courses.length} Courses)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {courses.map((course, index) => (
                                <div key={course.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                        {course.coverImageUrl || course.coverImage ? (
                                            <Image
                                                src={getPublicUrl(course.coverImageUrl || course.coverImage) || course.coverImageUrl}
                                                alt={course.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                                                <PlayCircle className="h-6 w-6 text-brand-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{course.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Worth ₹{(course.salePrice || course.price || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    {isEnrolled && (
                                        <Link href={`/courses/${course.slug}`}>
                                            <Button variant="outline" size="sm">
                                                Go to Course
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Pricing Card */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 rounded-2xl shadow-lg">
                        <CardContent className="p-6 space-y-6">
                            {/* Price Section */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <span className="text-4xl font-bold text-brand-600">
                                        ₹{effectivePrice.toLocaleString('en-IN')}
                                    </span>
                                    {hasDiscount && (
                                        <span className="text-xl text-muted-foreground line-through">
                                            ₹{originalPrice.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                </div>

                                {totalCoursesValue > 0 && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Total course value: ₹{totalCoursesValue.toLocaleString('en-IN')}
                                    </p>
                                )}

                                {savings > 0 && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        You save ₹{savings.toLocaleString('en-IN')}!
                                    </Badge>
                                )}
                            </div>

                            <Separator />

                            {/* Action Buttons */}
                            {isEnrolled ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-700 dark:text-green-400">
                                            You have access!
                                        </span>
                                    </div>
                                    <Button asChild className="w-full bg-green-600 hover:bg-green-700" size="lg">
                                        <Link href={`/bundle/${slug}`}>
                                            <PlayCircle className="h-5 w-5 mr-2" />
                                            Continue
                                        </Link>
                                    </Button>
                                </div>
                            ) : inCart ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                                        <ShoppingCart className="h-5 w-5 text-brand-600" />
                                        <span className="font-medium text-brand-700 dark:text-brand-400">
                                            Already in cart
                                        </span>
                                    </div>
                                    <Button asChild className="w-full" size="lg">
                                        <Link href="/cart">
                                            <ShoppingCart className="h-5 w-5 mr-2" />
                                            View Cart
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Button
                                        variant="default" // Changed from outline to default to match primary action style
                                        onClick={handleAddToCart}
                                        disabled={addingToCart}
                                        className="w-full bg-brand-600 hover:bg-brand-700"
                                        size="lg"
                                    >
                                        <ShoppingCart className="h-5 w-5 mr-2" />
                                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </Button>
                                </div>
                            )}

                            <Separator />

                            {/* Included Courses List */}
                            {courses.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm mb-2">What&apos;s Included:</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {courses.map((course) => (
                                            <div key={course.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50">
                                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{course.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Worth ₹{(course.salePrice || course.price || 0).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Bundle Features */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>Lifetime access to all courses</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>Access on mobile and desktop</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>Certificates upon completion</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>Future course updates included</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
