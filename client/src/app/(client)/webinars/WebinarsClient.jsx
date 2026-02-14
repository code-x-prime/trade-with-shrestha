'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { webinarAPI, userAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SearchInput from '@/components/SearchInput';
import WebinarCard from '@/components/cards/WebinarCard';
import WebinarsHero from '@/components/listing-heroes/WebinarsHero';
import { Pagination } from '@/components/ui/pagination';
import { Filters } from '@/components/ui/filters';

const WEBINAR_TYPES = [
  { value: 'LIVE', label: 'Live' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'MASTERCLASS', label: 'Masterclass' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'date-asc', label: 'Date: Soonest' },
  { value: 'date-desc', label: 'Date: Latest' },
];

function WebinarsPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState({});

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
  });
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
    fetchWebinars();
  }, [page, search, filters.type, sort]);

  useEffect(() => {
    if (isAuthenticated && webinars.length > 0) {
      fetchPurchaseStatus();
    }
  }, [isAuthenticated, webinars]);

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await webinarAPI.getWebinars({
        isPublished: true,
        page,
        limit,
        search: search || undefined,
        type: filters.type || undefined,
      });

      if (response.success) {
        let webinarsData = response.data.webinars || [];

        // Filter active webinars
        const now = new Date();
        webinarsData = webinarsData.filter(webinar => {
          if (!webinar.startDate) return false;
          const startDate = new Date(webinar.startDate);
          const durationMinutes = webinar.duration || 60;
          const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
          return now <= endDate;
        });

        // Client-side sorting
        if (sort === 'oldest') {
          webinarsData = [...webinarsData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'title-asc') {
          webinarsData = [...webinarsData].sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'title-desc') {
          webinarsData = [...webinarsData].sort((a, b) => b.title.localeCompare(a.title));
        } else if (sort === 'date-asc') {
          webinarsData = [...webinarsData].sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
            return dateA - dateB;
          });
        } else if (sort === 'date-desc') {
          webinarsData = [...webinarsData].sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
            return dateB - dateA;
          });
        }

        setWebinars(webinarsData);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch webinars');
      }
    } catch (error) {
      console.error('Error fetching webinars:', error);
      setError(error.message || 'Failed to load webinars. Please try again.');
      toast.error(error.message || 'Failed to fetch webinars');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    updateURL({ [key]: value, page: null });
  }, [updateURL]);

  const handleClearFilters = useCallback(() => {
    setFilters({ type: '' });
    setPage(1);
    updateURL({ type: null, page: null });
  }, [updateURL]);

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

  const fetchPurchaseStatus = async () => {
    if (!isAuthenticated || webinars.length === 0) return;

    try {
      const items = webinars.map(webinar => ({
        type: 'WEBINAR',
        id: webinar.id,
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
      <WebinarsHero />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search webinars..."
          onSearch={handleSearch}
          debounceMs={500}
          defaultValue={search}
        />
      </div>

      {/* Filters and Sort */}
      <div className="mb-6">
        <Filters
          filters={[
            {
              key: 'type',
              label: 'Type',
              value: filters.type,
              options: WEBINAR_TYPES,
            },
          ]}
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
          Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, webinars.length)} of {webinars.length} webinars
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading Webinars</p>
            <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchWebinars}
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
              <Skeleton className="w-full h-48 rounded-t-2xl dark:bg-gray-800" />
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3 dark:bg-gray-800" />
                <Skeleton className="h-4 w-1/2 mb-2 dark:bg-gray-800" />
                <Skeleton className="h-4 w-2/3 dark:bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : webinars.length === 0 ? (
        <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-500" />
            <p className="text-xl font-semibold mb-2 dark:text-white">No webinars available</p>
            <p className="text-muted-foreground dark:text-gray-400">
              {search || filters.type
                ? 'Try adjusting your search or filters'
                : 'Check back later for new webinars'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {webinars.map((webinar) => (
              <WebinarCard
                key={webinar.id}
                webinar={webinar}
                isEnrolled={purchaseStatus[`WEBINAR_${webinar.id}`] || false}
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

export default function WebinarsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
      <WebinarsPageContent />
    </Suspense>
  );
}
