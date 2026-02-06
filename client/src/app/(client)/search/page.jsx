'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Loader2 } from 'lucide-react';
import { courseAPI, webinarAPI, ebookAPI, offlineBatchAPI, bundleAPI, guidanceAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { CourseCard, WebinarCard, EbookCard, BundleCard, GuidanceCard } from '@/components/cards';
import SearchInput from '@/components/SearchInput';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({
    courses: [],
    webinars: [],
    ebooks: [],
    bundles: [],
    offlineBatches: [],
    guidance: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(query);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      const [coursesRes, webinarsRes, ebooksRes, bundlesRes, guidanceRes] = await Promise.all([
        courseAPI.getCourses({ search: searchQuery, limit: 10 }).catch(() => ({ success: false, data: {} })),
        webinarAPI.getWebinars({ search: searchQuery, limit: 10 }).catch(() => ({ success: false, data: {} })),
        ebookAPI.getEbooks({ search: searchQuery, limit: 10 }).catch(() => ({ success: false, data: {} })),
        bundleAPI.getBundles({ search: searchQuery, limit: 10 }).catch(() => ({ success: false, data: {} })),
        guidanceAPI.getGuidance({ search: searchQuery, limit: 10 }).catch(() => ({ success: false, data: {} })),
      ]);

      setResults({
        courses: coursesRes.success ? coursesRes.data.courses || [] : [],
        webinars: webinarsRes.success ? webinarsRes.data.webinars || [] : [],
        ebooks: ebooksRes.success ? ebooksRes.data.ebooks || [] : [],
        bundles: bundlesRes.success ? bundlesRes.data.bundles || [] : [],
        guidance: guidanceRes.success ? guidanceRes.data.guidance || [] : [],
        offlineBatches: [], // Offline batches don't have search in API yet
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = (results.courses?.length ?? 0) + (results.webinars?.length ?? 0) + (results.ebooks?.length ?? 0) + (results.bundles?.length ?? 0) + (results.guidance?.length ?? 0) + (results.offlineBatches?.length ?? 0);

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <p className="text-gray-500 mb-8">Enter a search query to find courses, webinars, ebooks, bundles, and more</p>
        <div className="max-w-2xl mx-auto">
          <SearchInput
            placeholder="Search courses, webinars, ebooks, bundles..."
            onSearch={setSearchValue}
            debounceMs={500}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Search Bar */}
      <div className="mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchValue.trim()) {
              router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
            }
          }}
          className="max-w-2xl"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses, webinars, ebooks, bundles..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </form>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Search Results for &quot;{query}&quot;
        </h1>
        {!loading && (
          <>
            {totalResults === 0 ? (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  No results found for &quot;{query}&quot;. Try different keywords or browse our categories.
                </p>
              </div>
            ) : (
              <p className="text-gray-500">
                Found {totalResults} {totalResults === 1 ? 'result' : 'results'}
              </p>
            )}
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Courses */}
          {results.courses.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Courses ({results.courses.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* Webinars */}
          {results.webinars.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Webinars ({results.webinars.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.webinars.map((webinar) => (
                  <WebinarCard key={webinar.id} webinar={webinar} />
                ))}
              </div>
            </section>
          )}

          {/* E-Books */}
          {results.ebooks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">E-Books ({results.ebooks.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.ebooks.map((ebook) => (
                  <EbookCard key={ebook.id} ebook={ebook} />
                ))}
              </div>
            </section>
          )}

          {/* Bundles */}
          {results.bundles.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Bundles ({results.bundles.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.bundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            </section>
          )}

          {/* 1:1 Guidance */}
          {results.guidance.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">1:1 Guidance ({results.guidance.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.guidance.map((guidance) => (
                  <GuidanceCard key={guidance.id} item={guidance} />
                ))}
              </div>
            </section>
          )}

          {/* No Results - Bottom fallback */}
          {totalResults === 0 && !loading && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-gray-500">Try different keywords or browse our categories</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
