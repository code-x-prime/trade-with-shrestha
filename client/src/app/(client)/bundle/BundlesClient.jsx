'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bundleAPI, userAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import BundleCard from '@/components/cards/BundleCard';
import BundlesHero from '@/components/listing-heroes/BundlesHero';
import SearchInput from '@/components/SearchInput';
import { Pagination } from '@/components/ui/pagination';
import { Filters } from '@/components/ui/filters';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
];

function BundlePageContent() {
    const { isAuthenticated } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchaseStatus, setPurchaseStatus] = useState({});

    // Initialize state from URL params
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [pagination, setPagination] = useState(null);
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const limit = 12;

    // Update URL with current state
    const updateURL = useCallback((params) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== '' && value !== 1 && value !== 'newest') {
                newParams.set(key, String(value));
            } else {
                newParams.delete(key);
            }
        });
        const queryString = newParams.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [searchParams, router, pathname]);

    useEffect(() => {
        fetchBundles();
    }, [page, search, sort]);

    useEffect(() => {
        if (isAuthenticated && bundles.length > 0) {
            fetchPurchaseStatus();
        }
    }, [isAuthenticated, bundles]);

    const fetchBundles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await bundleAPI.getBundles({
                page,
                limit,
                search: search || undefined,
            });

            if (response.success) {
                let bundlesData = response.data.bundles || [];

                // Client-side sorting
                if (sort === 'oldest') {
                    bundlesData = [...bundlesData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                } else if (sort === 'title-asc') {
                    bundlesData = [...bundlesData].sort((a, b) => a.title.localeCompare(b.title));
                } else if (sort === 'title-desc') {
                    bundlesData = [...bundlesData].sort((a, b) => b.title.localeCompare(a.title));
                } else if (sort === 'price-low') {
                    bundlesData = [...bundlesData].sort((a, b) => {
                        const priceA = a.pricing?.effectivePrice ?? a.price ?? 0;
                        const priceB = b.pricing?.effectivePrice ?? b.price ?? 0;
                        return priceA - priceB;
                    });
                } else if (sort === 'price-high') {
                    bundlesData = [...bundlesData].sort((a, b) => {
                        const priceA = a.pricing?.effectivePrice ?? a.price ?? 0;
                        const priceB = b.pricing?.effectivePrice ?? b.price ?? 0;
                        return priceB - priceA;
                    });
                }

                setBundles(bundlesData);
                setPagination(response.data.pagination || null);
            }
        } catch (error) {
            console.error('Failed to fetch bundles:', error);
            setError(error.message || 'Failed to load bundles');
            toast.error(error.message || 'Failed to load bundles');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
        updateURL({ page: newPage > 1 ? newPage : null });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [updateURL]);

    const handleSortChange = useCallback((value) => {
        setSort(value);
        updateURL({ sort: value !== 'newest' ? value : null });
    }, [updateURL]);

    const handleSearch = useCallback((value) => {
        setSearch(value);
        setPage(1);
        updateURL({ q: value || null, page: null });
    }, [updateURL]);

    const fetchPurchaseStatus = async () => {
        if (!isAuthenticated || bundles.length === 0) return;

        try {
            const items = bundles.map(bundle => ({
                type: 'BUNDLE',
                id: bundle.id,
            }));

            const response = await userAPI.getPurchaseStatus(items);
            if (response.success) {
                setPurchaseStatus(response.data.purchaseStatus || {});
            }
        } catch (error) {
            console.error('Failed to fetch purchase status:', error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <BundlesHero />

            {/* Search */}
            <div className="mb-6">
                <SearchInput
                    placeholder="Search bundles..."
                    onSearch={handleSearch}
                    debounceMs={500}
                    defaultValue={search}
                />
            </div>

            {/* Sort */}
            <div className="mb-6">
                <Filters
                    filters={[]}
                    sortOptions={SORT_OPTIONS}
                    selectedSort={sort}
                    onSortChange={handleSortChange}
                    onFilterChange={() => { }}
                    onClearFilters={() => { }}
                />
            </div>

            {/* Results Count */}
            {!loading && pagination && (
                <div className="mb-4 text-sm text-muted-foreground dark:text-gray-400">
                    Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} bundles
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading Bundles</p>
                        <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
                        <Button onClick={fetchBundles} className="dark:bg-red-900 dark:text-white dark:hover:bg-red-800">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
                            <Skeleton className="h-48 w-full rounded-t-2xl dark:bg-gray-800" />
                            <CardContent className="p-5">
                                <Skeleton className="h-5 w-3/4 mb-3 dark:bg-gray-800" />
                                <Skeleton className="h-4 w-full mb-2 dark:bg-gray-800" />
                                <Skeleton className="h-4 w-1/2 mb-4 dark:bg-gray-800" />
                                <Skeleton className="h-6 w-1/3 dark:bg-gray-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : bundles.length === 0 ? (
                <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="py-12 text-center">
                        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-500" />
                        <p className="text-xl font-semibold mb-2 dark:text-white">No bundles available</p>
                        <p className="text-muted-foreground dark:text-gray-400">
                            {search
                                ? 'Try adjusting your search'
                                : 'Check back later for new course bundles'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {bundles.map((bundle) => (
                            <BundleCard
                                key={bundle.id}
                                bundle={bundle}
                                isEnrolled={purchaseStatus[`BUNDLE_${bundle.id}`] || false}
                            />
                        ))}
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
    );
}

export default function BundlePage() {
    return (
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
            <BundlePageContent />
        </Suspense>
    );
}
