'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mentorshipAPI, userAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SearchInput from '@/components/SearchInput';
import MentorshipCard from '@/components/cards/MentorshipCard';
import MentorshipHero from '@/components/listing-heroes/MentorshipHero';
import { Pagination } from '@/components/ui/pagination';
import { Filters } from '@/components/ui/filters';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
];

function MentorshipPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [mentorship, setMentorship] = useState([]);
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
    fetchMentorship();
  }, [page, search, sort]);

  useEffect(() => {
    if (isAuthenticated && mentorship.length > 0) {
      fetchPurchaseStatus();
    }
  }, [isAuthenticated, mentorship]);

  const fetchMentorship = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mentorshipAPI.getMentorship({
        page,
        limit,
        status: 'PUBLISHED',
        search: search || undefined,
      });

      if (response.success) {
        let mentorshipData = response.data.mentorship || [];

        // Client-side sorting
        if (sort === 'oldest') {
          mentorshipData = [...mentorshipData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'title-asc') {
          mentorshipData = [...mentorshipData].sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'title-desc') {
          mentorshipData = [...mentorshipData].sort((a, b) => b.title.localeCompare(a.title));
        }

        setMentorship(mentorshipData);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch mentorship programs');
      }
    } catch (error) {
      console.error('Failed to fetch mentorship programs:', error);
      setError(error.message || 'Failed to load mentorship programs. Please try again.');
      toast.error(error.message || 'Failed to fetch mentorship programs');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = useCallback((value) => {
    setSort(value);
    updateURL({ sort: value !== 'newest' ? value : null });
  }, [updateURL]);

  const fetchPurchaseStatus = async () => {
    if (!isAuthenticated || mentorship.length === 0) return;

    try {
      const items = mentorship.map(program => ({
        type: 'MENTORSHIP',
        id: program.id,
      }));

      const response = await userAPI.getPurchaseStatus(items);
      if (response.success) {
        setPurchaseStatus(response.data.purchaseStatus || {});
      }
    } catch (error) {
      console.error('Failed to fetch purchase status:', error);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <MentorshipHero />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search mentorship programs..."
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
          Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} programs
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading Programs</p>
            <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchMentorship}
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
              <Skeleton className="w-full h-56 rounded-t-2xl dark:bg-gray-800" />
              <CardContent className="p-5">
                <Skeleton className="h-6 w-3/4 mb-3 dark:bg-gray-800" />
                <Skeleton className="h-4 w-full mb-2 dark:bg-gray-800" />
                <Skeleton className="h-4 w-2/3 dark:bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mentorship.length === 0 ? (
        <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-500" />
            <p className="text-xl font-semibold mb-2 dark:text-white">No mentorship programs available</p>
            <p className="text-muted-foreground dark:text-gray-400">
              {search ? 'Try adjusting your search' : 'Check back later for new programs'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {mentorship.map((program) => (
              <MentorshipCard
                key={program.id}
                program={program}
                isEnrolled={purchaseStatus[`MENTORSHIP_${program.id}`] || false}
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

export default function MentorshipListPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
      <MentorshipPageContent />
    </Suspense>
  );
}
