'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { indicatorAPI, userAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SearchInput from '@/components/SearchInput';
import IndicatorCard from '@/components/cards/IndicatorCard';
import IndicatorsHero from '@/components/listing-heroes/IndicatorsHero';
import { Pagination } from '@/components/ui/pagination';
import { Filters } from '@/components/ui/filters';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

function IndicatorsPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState({});

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState(null);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const limit = 20;

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
    fetchIndicators();
  }, [page, search, sort]);

  useEffect(() => {
    if (isAuthenticated && indicators.length > 0) {
      fetchPurchaseStatus();
    }
  }, [isAuthenticated, indicators]);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await indicatorAPI.getIndicators({
        page,
        limit,
        search: search || undefined,
      });

      if (response.success) {
        let indicatorsData = response.data.indicators || [];

        // Client-side sorting
        if (sort === 'oldest') {
          indicatorsData = [...indicatorsData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'name-asc') {
          indicatorsData = [...indicatorsData].sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name-desc') {
          indicatorsData = [...indicatorsData].sort((a, b) => b.name.localeCompare(a.name));
        }

        setIndicators(indicatorsData);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch indicators');
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
      setError(error.message || 'Failed to load indicators. Please try again.');
      toast.error('Failed to fetch indicators');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseStatus = async () => {
    if (!isAuthenticated || indicators.length === 0) return;

    try {
      const items = indicators.map(indicator => ({
        type: 'INDICATOR',
        id: indicator.id,
      }));

      const response = await userAPI.getPurchaseStatus(items);
      if (response.success) {
        setPurchaseStatus(response.data.purchaseStatus || {});
      }
    } catch (error) {
      console.error('Failed to fetch purchase status:', error);
    }
  };

  const handleSortChange = useCallback((value) => {
    setSort(value);
    updateURL({ sort: value !== 'newest' ? value : null });
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <IndicatorsHero />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search indicators..."
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
          Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} indicators
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading Indicators</p>
            <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchIndicators}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-0">
                <Skeleton className="aspect-video w-full rounded-t-2xl dark:bg-gray-800" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-5 w-3/4 dark:bg-gray-800" />
                  <Skeleton className="h-4 w-1/2 dark:bg-gray-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : indicators.length === 0 ? (
        <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4 dark:text-gray-500" />
            <h3 className="text-xl font-semibold mb-2 dark:text-white">No indicators found</h3>
            <p className="text-muted-foreground dark:text-gray-400">
              {search ? 'Try adjusting your search' : 'Check back later for new indicators'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {indicators.map((indicator) => (
              <IndicatorCard
                key={indicator.id}
                indicator={indicator}
                isPurchased={purchaseStatus[`INDICATOR_${indicator.id}`] || false}
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

export default function IndicatorsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
      <IndicatorsPageContent />
    </Suspense>
  );
}
