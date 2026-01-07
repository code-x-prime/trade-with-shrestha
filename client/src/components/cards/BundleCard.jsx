'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Tag, Users, Clock, Play, ArrowRight } from 'lucide-react';
import { getPublicUrl } from '@/lib/imageUtils';

export default function BundleCard({ bundle, isEnrolled = false }) {
    const {
        id,
        title,
        slug,
        thumbnailUrl,
        thumbnail,
        price,
        salePrice,
        pricing,
        coursesCount,
        enrollmentsCount,
        shortDescription,
        badges = [],
    } = bundle;

    const imageUrl = getPublicUrl(thumbnailUrl || thumbnail) || thumbnailUrl || thumbnail;

    // Calculate effective price from pricing object or use salePrice/price
    const effectivePrice = pricing?.effectivePrice ?? salePrice ?? price ?? 0;
    const originalPrice = pricing?.displayOriginalPrice ?? price ?? 0;
    const hasDiscount = effectivePrice < originalPrice;
    const discountPercent = pricing?.discountPercent || (hasDiscount ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0);
    const hasFlashSale = pricing?.hasFlashSale || false;

    return (
        <Link href={`/bundle/${slug}`} className="block h-full">
            <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 rounded-2xl border-border/50 hover:border-brand-200 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-brand-500/30 cursor-pointer">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden bg-muted">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
                            <Package className="h-16 w-16 text-brand-500" />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {hasFlashSale && (
                            <Badge className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5">
                                ⚡ Flash Sale
                            </Badge>
                        )}
                        {hasDiscount && !hasFlashSale && discountPercent > 0 && (
                            <Badge className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5">
                                <Tag className="h-3 w-3 mr-1" />
                                {discountPercent}% OFF
                            </Badge>
                        )}
                        {badges?.includes('FEATURED') && (
                            <Badge className="bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5">
                                Featured
                            </Badge>
                        )}
                        {badges?.includes('BESTSELLER') && (
                            <Badge className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5">
                                Bestseller
                            </Badge>
                        )}
                    </div>

                    {/* Courses Count Badge */}
                    <div className="absolute bottom-3 right-3">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0">
                            <Package className="h-3 w-3 mr-1" />
                            {coursesCount || 0} Courses
                        </Badge>
                    </div>

                    {/* Enrolled Badge */}
                    {isEnrolled && (
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-brand-600 text-white">
                                Enrolled
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <CardContent className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
                        {title}
                    </h3>

                    {shortDescription && (
                        <p className="text-xs text-muted-foreground dark:text-gray-400 line-clamp-2 mb-3">
                            {shortDescription}
                        </p>
                    )}

                    {/* Stats */}
                    {enrollmentsCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Users className="h-3 w-3" />
                            <span>{enrollmentsCount} enrolled</span>
                        </div>
                    )}

                    {/* Price Section */}
                    <div className="space-y-3">
                        {isEnrolled ? (
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Continue
                            </Button>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                                            ₹{effectivePrice.toLocaleString('en-IN')}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-sm text-muted-foreground dark:text-gray-500 line-through">
                                                ₹{originalPrice.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
