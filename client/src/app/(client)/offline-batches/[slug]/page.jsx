'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { offlineBatchAPI, flashSaleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Clock, Users, User, CheckCircle2, XCircle, ArrowLeft, Loader2, ShoppingCart, Zap, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import PricingBox from '@/components/detail/PricingBox';

export default function OfflineBatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const slug = params.slug;
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [pricing, setPricing] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        fetchBatch();
    }, [slug, isAuthenticated]);

    const fetchBatch = async () => {
        try {
            setLoading(true);
            const response = await offlineBatchAPI.getBatchBySlug(slug);
            if (response.success) {
                const batchData = response.data.batch;
                setBatch(batchData);
                // Ensure isEnrolled is properly set from backend
                const enrolled = batchData.isEnrolled === true;
                setIsEnrolled(enrolled);
                // Debug: Log enrollment status
                if (isAuthenticated) {
                    console.log('Batch enrollment status:', {
                        isEnrolled: enrolled,
                        batchId: batchData.id,
                        userId: user?.id
                    });
                }

                // Fetch pricing info if not free
                if (!batchData.isFree && batchData.pricingType !== 'FREE' && batchData.price) {
                    try {
                        const pricingResponse = await flashSaleAPI.getActive();
                        if (pricingResponse.success && pricingResponse.data?.flashSale) {
                            const flashSale = pricingResponse.data.flashSale;
                            const item = flashSale.items?.find(i => i.itemType === 'OFFLINE_BATCH' && i.itemId === batchData.id);
                            if (item) {
                                const effectivePrice = item.discountPrice || batchData.salePrice || batchData.price;
                                const originalPrice = batchData.salePrice || batchData.price;
                                const discountPercent = Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);

                                setPricing({
                                    hasFlashSale: true,
                                    effectivePrice,
                                    displayOriginalPrice: originalPrice,
                                    discountPercent,
                                    flashSaleTitle: flashSale.title || 'Flash Sale',
                                });
                            } else {
                                // No flash sale, use regular pricing
                                const effectivePrice = batchData.salePrice || batchData.price;
                                const originalPrice = batchData.price;
                                if (effectivePrice < originalPrice) {
                                    const discountPercent = Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);
                                    setPricing({
                                        hasFlashSale: false,
                                        effectivePrice,
                                        displayOriginalPrice: originalPrice,
                                        discountPercent,
                                    });
                                } else {
                                    setPricing({
                                        hasFlashSale: false,
                                        effectivePrice: originalPrice,
                                        displayOriginalPrice: originalPrice,
                                        discountPercent: 0,
                                    });
                                }
                            }
                        } else {
                            // No active flash sale, use regular pricing
                            const effectivePrice = batchData.salePrice || batchData.price;
                            const originalPrice = batchData.price;
                            if (effectivePrice < originalPrice) {
                                const discountPercent = Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);
                                setPricing({
                                    hasFlashSale: false,
                                    effectivePrice,
                                    displayOriginalPrice: originalPrice,
                                    discountPercent,
                                });
                            } else {
                                setPricing({
                                    hasFlashSale: false,
                                    effectivePrice: originalPrice,
                                    displayOriginalPrice: originalPrice,
                                    discountPercent: 0,
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch pricing:', error);
                        // Fallback to regular pricing
                        const effectivePrice = batchData.salePrice || batchData.price;
                        const originalPrice = batchData.price;
                        setPricing({
                            hasFlashSale: false,
                            effectivePrice: effectivePrice || originalPrice,
                            displayOriginalPrice: originalPrice,
                            discountPercent: effectivePrice < originalPrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0,
                        });
                    }
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load batch');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            router.push('/auth?mode=login&redirect=' + encodeURIComponent(`/offline-batches/${slug}`));
            return;
        }

        setEnrolling(true);
        try {
            const response = await offlineBatchAPI.enroll(batch.id);
            if (response.success) {
                toast.success('Successfully enrolled in batch!');
                fetchBatch(); // Refresh to update seats
            }
        } catch (error) {
            toast.error(error.message || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const addToCart = async () => {
        if (batch.isFree || batch.pricingType === 'FREE') {
            return;
        }

        const offlineBatchCart = JSON.parse(localStorage.getItem('offlineBatchCart') || '[]');
        if (offlineBatchCart.includes(batch.id)) {
            toast.info('Already in cart!');
            router.push('/cart');
            return;
        }

        try {
            setAddingToCart(true);
            const { addToCart: addToCartUtil } = await import('@/lib/cartUtils');
            await addToCartUtil('OFFLINE_BATCH', batch.id, isAuthenticated);
            toast.success('Added to cart!');
            router.push('/cart');
        } catch (error) {
            toast.error('Failed to add to cart. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <Skeleton className="h-10 w-64 mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Batch Not Found</h1>
                    <p className="text-muted-foreground mb-4">The batch you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/offline-batches">
                        <Button>Back to Batches</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isFull = !batch.isUnlimitedSeats && batch.seatLimit && batch.seatsFilled >= batch.seatLimit;
    const canEnroll = batch.status === 'OPEN' && !isFull && !isEnrolled;
    // Only show Add to Cart if user is NOT enrolled, batch is paid, can enroll, and is authenticated
    const canAddToCart = !isEnrolled && !batch.isFree && batch.pricingType !== 'FREE' && canEnroll && isAuthenticated;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <Link href="/offline-batches">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Batches
                    </Button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Thumbnail */}
                        {batch.thumbnailUrl && (
                            <Card className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="relative w-full h-64 md:h-80 lg:h-96">
                                        <Image
                                            src={batch.thumbnailUrl}
                                            alt={batch.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Title & Description */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-3xl font-bold">{batch.title}</CardTitle>
                                    {isEnrolled && (
                                        <Badge className="bg-green-500 text-white">
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                            Enrolled
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {batch.shortDescription && (
                                    <p className="text-lg text-muted-foreground mb-4">{batch.shortDescription}</p>
                                )}
                                <div
                                    className="prose max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: batch.description }}
                                />
                            </CardContent>
                        </Card>

                        {/* Location */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-semibold">{batch.centerName}</p>
                                        <p className="text-sm text-muted-foreground">{batch.address}</p>
                                        <p className="text-sm text-muted-foreground">{batch.city}, {batch.state}</p>
                                    </div>
                                </div>
                                {batch.googleMap && (
                                    <a
                                        href={batch.googleMap}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-brand-600 hover:underline inline-block"
                                    >
                                        View on Google Maps →
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        {/* Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">
                                            {new Date(batch.startDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}{' '}
                                            - {new Date(batch.endDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <p className="font-semibold">{batch.startTime} - {batch.endTime}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Days:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {batch.days.map((day) => (
                                            <Badge key={day} variant="outline">
                                                {day}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructor */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Instructor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-2">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-semibold">{batch.instructorName}</p>
                                        {batch.instructorBio && (
                                            <p className="text-sm text-muted-foreground mt-1">{batch.instructorBio}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* What Students Get */}
                        <Card>
                            <CardHeader>
                                <CardTitle>What You&apos;ll Get</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {batch.includesNotes ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-gray-400" />
                                    )}
                                    <span>Course Notes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {batch.includesRecordings ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-gray-400" />
                                    )}
                                    <span>Session Recordings</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {batch.includesTests ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-gray-400" />
                                    )}
                                    <span>Practice Tests</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {batch.includesDoubtSupport ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-gray-400" />
                                    )}
                                    <span>Doubt Support</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <PricingBox
                            price={batch.price || 0}
                            salePrice={batch.salePrice}
                            isFree={batch.isFree || batch.pricingType === 'FREE'}
                            pricing={pricing}
                            features={[
                                batch.includesNotes && 'Course Notes',
                                batch.includesRecordings && 'Session Recordings',
                                batch.includesTests && 'Practice Tests',
                                batch.includesDoubtSupport && 'Doubt Support',
                            ].filter(Boolean)}
                            ctaLabel={
                                isEnrolled
                                    ? 'Continue Learning'
                                    : batch.isFree || batch.pricingType === 'FREE'
                                        ? (canEnroll ? 'Enroll Free' : 'Not Available')
                                        : (canEnroll ? 'Add to Cart' : 'Not Available')
                            }
                            onCtaClick={
                                isEnrolled
                                    ? () => router.push(`/offline-batches/${slug}`)
                                    : batch.isFree || batch.pricingType === 'FREE'
                                        ? handleEnroll
                                        : addToCart
                            }
                            className="sticky top-4"
                        >
                            {isEnrolled ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-700 dark:text-green-400">
                                            You are enrolled!
                                        </span>
                                    </div>

                                </div>
                            ) : canAddToCart ? (
                                <Button
                                    onClick={addToCart}
                                    disabled={addingToCart}
                                    className="w-full bg-brand-600 hover:bg-brand-700"
                                    size="lg"
                                >
                                    {addingToCart ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Add to Cart
                                        </>
                                    )}
                                </Button>
                            ) : batch.isFree || batch.pricingType === 'FREE' ? (
                                canEnroll ? (
                                    <Button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        size="lg"
                                    >
                                        {enrolling ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enrolling...
                                            </>
                                        ) : (
                                            'Enroll Free'
                                        )}
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full" size="lg">
                                        {isFull ? 'Batch Full' : batch.status === 'CLOSED' ? 'Batch Closed' : 'Not Available'}
                                    </Button>
                                )
                            ) : (
                                <Button disabled className="w-full" size="lg">
                                    {isFull ? 'Batch Full' : batch.status === 'CLOSED' ? 'Batch Closed' : isEnrolled ? 'Already Enrolled' : 'Not Available'}
                                </Button>
                            )}

                            {/* Seats */}
                            {!batch.isUnlimitedSeats && batch.seatsLeft !== null && (
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {batch.seatsLeft} of {batch.seatLimit} seats available
                                    </span>
                                </div>
                            )}

                            {/* Batch Status - Only show if not enrolled */}
                            {!isEnrolled && batch.status && (
                                <div className="flex items-center justify-center gap-2 pt-2 border-t">
                                    <span className="text-xs text-muted-foreground">Batch Status:</span>
                                    <Badge
                                        className={
                                            batch.status === 'OPEN'
                                                ? 'bg-green-500 text-white'
                                                : batch.status === 'FULL'
                                                    ? 'bg-orange-500 text-white'
                                                    : batch.status === 'CLOSED'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-500 text-white'
                                        }
                                    >
                                        {batch.status === 'OPEN' ? 'Open for Enrollment' :
                                            batch.status === 'FULL' ? 'Batch Full' :
                                                batch.status === 'CLOSED' ? 'Closed' :
                                                    batch.status}
                                    </Badge>
                                </div>
                            )}

                            {/* Only show login message if not enrolled and not authenticated */}
                            {!isEnrolled && !isAuthenticated && !batch.isFree && batch.pricingType !== 'FREE' && (
                                <p className="text-xs text-center text-muted-foreground">
                                    Please login to add to cart
                                </p>
                            )}
                        </PricingBox>
                    </div>
                </div>
            </div>
        </div>
    );
}

