'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { offlineBatchAPI, flashSaleAPI, userAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Clock, Users, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import OfflineBatchesHero from '@/components/listing-heroes/OfflineBatchesHero';
import SearchInput from '@/components/SearchInput';
import { Pagination } from '@/components/ui/pagination';
import { Filters } from '@/components/ui/filters';

const SORT_OPTIONS = [
    { value: 'date-asc', label: 'Date: Soonest' },
    { value: 'date-desc', label: 'Date: Latest' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
];

function OfflineBatchesPageContent() {
    const { isAuthenticated } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchaseStatus, setPurchaseStatus] = useState({});

    // Initialize state from URL params
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [pagination, setPagination] = useState(null);
    const [flashSaleData, setFlashSaleData] = useState(null);
    const [sort, setSort] = useState(searchParams.get('sort') || 'date-asc');
    const limit = 20;

    // Update URL with current state
    const updateURL = useCallback((params) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== '' && value !== 1 && value !== 'date-asc') {
                newParams.set(key, String(value));
            } else {
                newParams.delete(key);
            }
        });
        const queryString = newParams.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [searchParams, router, pathname]);

    useEffect(() => {
        fetchBatches();
        fetchFlashSale();
    }, [page, cityFilter, search]);

    useEffect(() => {
        if (isAuthenticated && batches.length > 0) {
            fetchPurchaseStatus();
        }
    }, [isAuthenticated, batches]);

    const fetchFlashSale = async () => {
        try {
            const response = await flashSaleAPI.getActive();
            if (response.success && response.data?.flashSale) {
                setFlashSaleData(response.data.flashSale);
            }
        } catch (error) {
            console.error('Failed to fetch flash sale:', error);
        }
    };

    const fetchBatches = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await offlineBatchAPI.getBatches({
                status: 'OPEN',
                city: cityFilter || undefined,
                page,
                limit,
            });

            if (response.success) {
                let batchesData = response.data.batches || [];

                // Client-side search
                if (search) {
                    batchesData = batchesData.filter(batch =>
                        batch.title.toLowerCase().includes(search.toLowerCase()) ||
                        batch.city?.toLowerCase().includes(search.toLowerCase()) ||
                        batch.state?.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Client-side sorting
                if (sort === 'date-desc') {
                    batchesData = [...batchesData].sort((a, b) => {
                        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
                        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
                        return dateB - dateA;
                    });
                } else if (sort === 'date-asc') {
                    batchesData = [...batchesData].sort((a, b) => {
                        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
                        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
                        return dateA - dateB;
                    });
                } else if (sort === 'title-asc') {
                    batchesData = [...batchesData].sort((a, b) => a.title.localeCompare(b.title));
                } else if (sort === 'title-desc') {
                    batchesData = [...batchesData].sort((a, b) => b.title.localeCompare(a.title));
                }

                setBatches(batchesData);
                setPagination(response.data.pagination);
            } else {
                throw new Error(response.message || 'Failed to fetch offline batches');
            }
        } catch (error) {
            console.error('Error fetching offline batches:', error);
            setError(error.message || 'Failed to load offline batches. Please try again.');
            toast.error(error.message || 'Failed to fetch offline batches');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = useCallback((key, value) => {
        if (key === 'city') {
            setCityFilter(value);
            setPage(1);
            updateURL({ city: value, page: null });
        }
    }, [updateURL]);

    const handleClearFilters = useCallback(() => {
        setCityFilter('');
        setPage(1);
        updateURL({ city: null, page: null });
    }, [updateURL]);

    const handleSortChange = useCallback((value) => {
        setSort(value);
        updateURL({ sort: value !== 'date-asc' ? value : null });
    }, [updateURL]);

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
        updateURL({ page: newPage > 1 ? newPage : null });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [updateURL]);

    const handleSearch = useCallback((value) => {
        setSearch(value);
        setPage(1);
        updateURL({ q: value || null, page: null });
    }, [updateURL]);

    const fetchPurchaseStatus = async () => {
        if (!isAuthenticated || batches.length === 0) return;

        try {
            const items = batches.map(batch => ({
                type: 'OFFLINE_BATCH',
                id: batch.id,
            }));

            const response = await userAPI.getPurchaseStatus(items);
            if (response.success) {
                setPurchaseStatus(response.data.purchaseStatus || {});
            }
        } catch (error) {
            console.error('Failed to fetch purchase status:', error);
        }
    };

    // Get unique cities for filter
    const uniqueCities = Array.from(new Set(batches.map(b => b.city).filter(Boolean))).sort();
    const cityOptions = uniqueCities.map(city => ({ value: city, label: city }));

    const getBatchPricing = (batch) => {
        if (batch.isFree || batch.pricingType === 'FREE') {
            return { isFree: true, price: 0 };
        }

        if (!flashSaleData || !flashSaleData.items) {
            return {
                isFree: false,
                price: batch.price || 0,
                salePrice: batch.salePrice,
                effectivePrice: batch.salePrice || batch.price || 0,
                originalPrice: batch.price || 0,
                hasFlashSale: false,
            };
        }

        const flashSaleItem = flashSaleData.items.find(
            item => item.itemType === 'OFFLINE_BATCH' && item.itemId === batch.id
        );

        if (flashSaleItem) {
            const effectivePrice = flashSaleItem.discountPrice || batch.salePrice || batch.price || 0;
            const originalPrice = batch.salePrice || batch.price || 0;
            return {
                isFree: false,
                price: batch.price || 0,
                salePrice: batch.salePrice,
                effectivePrice,
                originalPrice,
                hasFlashSale: true,
                flashSaleTitle: flashSaleData.title || 'Flash Sale',
            };
        }

        return {
            isFree: false,
            price: batch.price || 0,
            salePrice: batch.salePrice,
            effectivePrice: batch.salePrice || batch.price || 0,
            originalPrice: batch.price || 0,
            hasFlashSale: false,
        };
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <OfflineBatchesHero />

                {/* Search */}
                <div className="mb-6">
                    <SearchInput
                        placeholder="Search batches by title, city..."
                        onSearch={handleSearch}
                        debounceMs={500}
                        defaultValue={search}
                    />
                </div>

                {/* Filters and Sort */}
                <div className="mb-6">
                    <Filters
                        filters={cityOptions.length > 0 ? [
                            {
                                key: 'city',
                                label: 'City',
                                value: cityFilter,
                                options: cityOptions,
                            },
                        ] : []}
                        sortOptions={SORT_OPTIONS}
                        selectedSort={sort}
                        onSortChange={handleSortChange}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                {/* Results Count */}
                {!loading && pagination && (
                    <div className="mb-4 text-sm text-muted-foreground dark:text-gray-400">
                        Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, batches.length)} of {batches.length} batches
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
                        <CardContent className="py-12 text-center">
                            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                            <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading Batches</p>
                            <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
                            <Button onClick={fetchBatches} className="dark:bg-red-900 dark:text-white dark:hover:bg-red-800">
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="dark:bg-gray-900 dark:border-gray-800">
                                <Skeleton className="h-48 w-full dark:bg-gray-800" />
                                <CardContent className="p-4 space-y-2">
                                    <Skeleton className="h-6 w-full dark:bg-gray-800" />
                                    <Skeleton className="h-4 w-3/4 dark:bg-gray-800" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : batches.length === 0 ? (
                    <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="py-12 text-center">
                            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-500" />
                            <p className="text-xl font-semibold mb-2 dark:text-white">No offline batches available</p>
                            <p className="text-muted-foreground dark:text-gray-400">
                                {search || cityFilter
                                    ? 'Try adjusting your search or filters'
                                    : 'Check back later for new batches'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {batches.map((batch) => {
                                const pricing = getBatchPricing(batch);
                                const isPurchased = purchaseStatus[`OFFLINE_BATCH_${batch.id}`] || false;
                                return (
                                    <Link key={batch.id} href={`/offline-batches/${batch.slug}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col">
                                            {batch.thumbnailUrl ? (
                                                <div className="relative h-48 w-full">
                                                    <Image
                                                        src={batch.thumbnailUrl}
                                                        alt={batch.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-48 w-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center">
                                                    <Calendar className="h-12 w-12 text-slate-400 dark:text-gray-600" />
                                                </div>
                                            )}
                                            <CardContent className="p-6 flex-1 flex flex-col">
                                                <h3 className="text-xl font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white">{batch.title}</h3>
                                                {batch.shortDescription && (
                                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4 line-clamp-2">
                                                        {batch.shortDescription}
                                                    </p>
                                                )}

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{batch.city}, {batch.state}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{batch.startTime} - {batch.endTime}</span>
                                                    </div>
                                                    {!batch.isUnlimitedSeats && batch.seatsLeft !== null && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                                                            <Users className="h-4 w-4" />
                                                            <span>{batch.seatsLeft} seats left</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mb-4">
                                                    {pricing.isFree ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                                            FREE
                                                        </Badge>
                                                    ) : pricing.hasFlashSale ? (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold mb-1">
                                                                <Zap className="h-3 w-3" />
                                                                <span>{pricing.flashSaleTitle}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="line-through text-muted-foreground text-sm">₹{pricing.originalPrice}</span>
                                                                <span className="font-semibold text-brand-600">₹{pricing.effectivePrice}</span>
                                                                <span className="text-xs text-orange-600 font-semibold">
                                                                    ({Math.round(((pricing.originalPrice - pricing.effectivePrice) / pricing.originalPrice) * 100)}% OFF)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : pricing.salePrice && pricing.salePrice < pricing.price ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="line-through text-muted-foreground text-sm dark:text-gray-500">₹{pricing.price}</span>
                                                            <span className="font-semibold text-gray-900 dark:text-white">₹{pricing.salePrice}</span>
                                                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                                                ({Math.round(((pricing.price - pricing.salePrice) / pricing.price) * 100)}% OFF)
                                                            </span>
                                                        </div>
                                                    ) : pricing.price ? (
                                                        <span className="font-semibold text-gray-900 dark:text-white">₹{pricing.price}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm dark:text-gray-400">Starting Soon</span>
                                                    )}
                                                </div>

                                                {isPurchased ? (
                                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white mt-auto">
                                                        Continue
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <Pagination
                                currentPage={page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function OfflineBatchesPage() {
    return (
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
            <OfflineBatchesPageContent />
        </Suspense>
    );
}
