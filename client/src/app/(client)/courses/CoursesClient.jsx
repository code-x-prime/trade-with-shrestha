'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI, orderAPI, userAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import CourseCard from '@/components/cards/CourseCard';
import CoursesHero from '@/components/listing-heroes/CoursesHero';
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

function CoursesPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState(new Set());
  const [courseProgress, setCourseProgress] = useState({});

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
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
    fetchCourses();
    if (isAuthenticated) {
      fetchEnrollments();
    }
  }, [isAuthenticated, page, search, filters.isFree, sort]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseAPI.getCourses({
        published: 'true',
        page,
        limit,
        search: search || undefined,
        isFree: filters.isFree || undefined,
      });

      if (response.success) {
        let coursesData = response.data.courses || [];

        // Client-side sorting
        if (sort === 'oldest') {
          coursesData = [...coursesData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'title-asc') {
          coursesData = [...coursesData].sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'title-desc') {
          coursesData = [...coursesData].sort((a, b) => b.title.localeCompare(a.title));
        } else if (sort === 'price-low') {
          coursesData = [...coursesData].sort((a, b) => {
            const priceA = a.pricing?.effectivePrice ?? a.price ?? 0;
            const priceB = b.pricing?.effectivePrice ?? b.price ?? 0;
            return priceA - priceB;
          });
        } else if (sort === 'price-high') {
          coursesData = [...coursesData].sort((a, b) => {
            const priceA = a.pricing?.effectivePrice ?? a.price ?? 0;
            const priceB = b.pricing?.effectivePrice ?? b.price ?? 0;
            return priceB - priceA;
          });
        }

        // Update enrollments from API response (includes bundle enrollments)
        if (isAuthenticated) {
          const enrolledCourseIds = new Set();
          coursesData.forEach(course => {
            if (course.isEnrolled) {
              enrolledCourseIds.add(course.id);
            }
          });
          setEnrollments(enrolledCourseIds);
        }

        setCourses(coursesData);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.message || 'Failed to load courses. Please try again.');
      toast.error(error.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await orderAPI.getOrders();
      if (response.success) {
        const orders = response.data.orders || [];
        const enrolledCourseIds = new Set();
        const progressMap = {};
        orders.forEach(order => {
          // Only count COMPLETED orders
          if (order.status === 'COMPLETED' && order.paymentStatus === 'PAID') {
            if (order.courseOrders && order.courseOrders.length > 0) {
              order.courseOrders.forEach(co => {
                if (co.course) {
                  enrolledCourseIds.add(co.course.id);
                }
              });
            }
            // Also check bundle orders for course enrollments
            if (order.bundleOrders && order.bundleOrders.length > 0) {
              // Bundle enrollments are already handled by API, but we keep this for progress tracking
            }
          }
        });
        setEnrollments(enrolledCourseIds);

        for (const courseId of enrolledCourseIds) {
          try {
            const progressResponse = await courseAPI.getCourseProgress(courseId);
            if (progressResponse.success && progressResponse.data.progress) {
              progressMap[courseId] = progressResponse.data.progress.overallProgress || 0;
            }
          } catch (error) {
            if (error.message?.includes('Not enrolled') || error.message?.includes('enrolled')) {
              continue;
            }
            console.error(`Failed to fetch progress for course ${courseId}:`, error);
          }
        }
        setCourseProgress(progressMap);
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    updateURL({ [key]: value, page: null });
  }, [updateURL]);

  const handleClearFilters = useCallback(() => {
    setFilters({ isFree: '' });
    setPage(1);
    updateURL({ isFree: null, page: null });
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <CoursesHero />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search courses..."
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
          Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} courses
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-2xl mb-6 border-destructive dark:bg-gray-800 dark:border-red-900/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 dark:text-white">Error Loading Courses</p>
            <p className="text-muted-foreground mb-4 dark:text-gray-400">{error}</p>
            <Button onClick={fetchCourses} className="dark:bg-red-900 dark:text-white dark:hover:bg-red-800">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
              <Skeleton className="h-48 w-full rounded-t-2xl dark:bg-gray-800" />
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3 dark:bg-gray-800" />
                <Skeleton className="h-4 w-1/2 mb-4 dark:bg-gray-800" />
                <Skeleton className="h-6 w-full dark:bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-500" />
            <p className="text-xl font-semibold mb-2 dark:text-white">No courses available</p>
            <p className="text-muted-foreground dark:text-gray-400">
              {search || filters.isFree
                ? 'Try adjusting your search or filters'
                : 'Check back later for new courses'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrollments.has(course.id)}
                progress={courseProgress[course.id] || 0}
                showProgress={isAuthenticated}
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

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><Skeleton className="h-96 w-full" /></div>}>
      <CoursesPageContent />
    </Suspense>
  );
}
