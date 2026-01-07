'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ebookAPI, userAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SearchInput from '@/components/SearchInput';
import EbookCard from '@/components/cards/EbookCard';
import EbooksHero from '@/components/listing-heroes/EbooksHero';
import { Pagination } from '@/components/ui/pagination';
import { Filters } from '@/components/ui/filters';

const EBOOK_CATEGORIES = [
  { value: 'FEATURED', label: 'Featured' },
  { value: 'BESTSELLER', label: 'Bestseller' },
  { value: 'NEW', label: 'New' },
  { value: 'TRENDING', label: 'Trending' },
  { value: 'POPULAR', label: 'Popular' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

function EbooksPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState({});

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    isFree: searchParams.get('isFree') || '',
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
    fetchEbooks();
  }, [page, search, filters.category, filters.isFree, sort]);

  useEffect(() => {
    if (isAuthenticated && ebooks.length > 0) {
      fetchPurchaseStatus();
    }
  }, [isAuthenticated, ebooks]);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ebookAPI.getEbooks({
        page,
        limit,
        search: search || undefined,
        category: filters.category || undefined,
        isFree: filters.isFree || undefined,
      });

      if (response.success) {
        let ebooksData = response.data.ebooks || [];

        // Client-side sorting
        if (sort === 'oldest') {
          ebooksData = [...ebooksData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'title-asc') {
          ebooksData = [...ebooksData].sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'title-desc') {
          ebooksData = [...ebooksData].sort((a, b) => b.title.localeCompare(a.title));
        } else if (sort === 'price-low') {
          ebooksData = [...ebooksData].sort((a, b) => {
            const priceA = a.pricing?.effectivePrice ?? a.price ?? 0;
            const priceB = b.pricing?.effectivePrice ?? b.price ?? 0;
            return priceA - priceB;
          });
        } else if (sort === 'price-high') {
          ebooksData = [...ebooksData].sort((a, b) => {
            const priceA = a.pricing?.effectivePrice ?? a.price ?? 0;
            const priceB = b.pricing?.effectivePrice ?? b.price ?? 0;
            return priceB - priceA;
          });
        }

        setEbooks(ebooksData);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch e-books');
      }
    } catch (error) {
      console.error('Error fetching e-books:', error);
      setError(error.message || 'Failed to load e-books. Please try again.');
      toast.error(error.message || 'Failed to load e-books');
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
    setFilters({ category: '', isFree: '' });
    setPage(1);
    updateURL({ category: null, isFree: null, page: null });
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
    if (!isAuthenticated || ebooks.length === 0) return;

    try {
      const items = ebooks.map(ebook => ({
        type: 'EBOOK',
        id: ebook.id,
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
      <EbooksHero />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search e-books..."
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
              key: 'category',
              label: 'Category',
              value: filters.category,
              options: EBOOK_CATEGORIES,
            },
            {
              key: 'isFree',
              label: 'Price',
              value: filters.isFree,
              options: [
                { value: 'true', label: 'Free' },
                { value: 'false', label: 'Paid' },
              ],
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
          Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} e-books
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading E-Books</p>
            <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchEbooks}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
      ) : ebooks.length === 0 ? (
        <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-500" />
            <p className="text-xl font-semibold mb-2 dark:text-white">No e-books found</p>
            <p className="text-muted-foreground dark:text-gray-400">
              {search || filters.category || filters.isFree
                ? 'Try adjusting your search or filters'
                : 'Check back later for new e-books'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {ebooks.map((ebook) => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                isPurchased={purchaseStatus[`EBOOK_${ebook.id}`] || false}
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

export default function EbooksPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
      <EbooksPageContent />
    </Suspense>
  );
}
