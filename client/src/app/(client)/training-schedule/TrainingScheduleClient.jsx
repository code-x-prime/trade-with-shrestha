'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trainingScheduleAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Video, MessageCircle, Loader2 } from 'lucide-react';
import BookDemoDialog from '@/components/BookDemoDialog';
import TrainingScheduleHero from '@/components/listing-heroes/TrainingScheduleHero';

const TRAINING_TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'e_Learning', label: 'e_Learning' },
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Online', label: 'Online' },
];

const VALID_TYPES = TRAINING_TYPE_FILTERS.map((t) => t.value);
const SEARCH_DEBOUNCE_MS = 400;

function getInitialFilter(searchParams) {
  const type = searchParams.get('type');
  return type != null && VALID_TYPES.includes(type) ? type : '';
}

function TrainingScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => getInitialFilter(searchParams));
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [bookDemoOpen, setBookDemoOpen] = useState(false);
  const [selectedDemoMessage, setSelectedDemoMessage] = useState('');

  // URL change (e.g. back/forward) par tab sync
  useEffect(() => {
    setFilter(getInitialFilter(searchParams));
  }, [searchParams]);

  // Tab change par URL update – link share karne par wahi tab khule
  const setFilterAndUrl = useCallback(
    (value) => {
      setFilter(value);
      const url = value ? `/training-schedule?type=${encodeURIComponent(value)}` : '/training-schedule';
      router.replace(url, { scroll: false });
    },
    [router]
  );

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  // API fetch
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter && filter.trim()) params.trainingType = filter.trim();
    if (searchDebounced.trim()) params.search = searchDebounced.trim();
    trainingScheduleAPI
      .getUpcoming(params)
      .then((res) => {
        const raw = res?.data ?? res;
        const data = Array.isArray(raw) ? raw : raw?.schedules ?? [];
        setSchedules(data);
      })
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [filter, searchDebounced]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const formatTimeIST = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const hasDate = (item) => item.scheduledAt != null;

  const openBookDemo = (message = '') => {
    setSelectedDemoMessage(message);
    setBookDemoOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Banner – same style as Courses / other listing pages */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <TrainingScheduleHero />
      </div>

      {/* Schedule section */}
      <section id="schedule" className="max-w-5xl mx-auto px-4 py-6 pb-10" aria-label="Demo schedule">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm dark:bg-gray-900/30">
          <h2 className="text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
            <Video className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Upcoming demos
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Filter by type, search by course name. Share the page link to open the same tab.
          </p>

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {TRAINING_TYPE_FILTERS.map((t) => (
                <Button
                  key={t.value || 'all'}
                  variant={filter === t.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterAndUrl(t.value)}
                  className={filter === t.value ? 'bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600' : ''}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No upcoming demos for this filter.</p>
                <p className="text-sm mt-2">Try another type or search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 dark:bg-gray-800/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground w-12">S.No</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground whitespace-nowrap">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground whitespace-nowrap">Time (IST)</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Zoom Link</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">For More Updates</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 bg-background hover:bg-muted/30 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{item.title}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{hasDate(item) ? formatDate(item.scheduledAt) : '–'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{hasDate(item) ? formatTimeIST(item.scheduledAt) : 'Contact for schedule'}</td>
                      <td className="py-3 px-4">
                        {item.meetLink ? (
                          <a
                            href={item.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                          >
                            <Button size="sm" variant="secondary" className="gap-1.5">
                              <Video className="h-4 w-4" />
                              Join Zoom
                            </Button>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">–</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.whatsappLink ? (
                          <a
                            href={item.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                          >
                            <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                              <MessageCircle className="h-4 w-4" />
                              Join WhatsApp Group
                            </Button>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-6">
            Need a custom slot?{' '}
            <button type="button" onClick={() => openBookDemo()} className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
              Request a demo
            </button>
          </p>
        </div>
      </section>

      <BookDemoDialog
        open={bookDemoOpen}
        onOpenChange={setBookDemoOpen}
        defaultMessage={selectedDemoMessage}
      />
    </div>
  );
}

export default function TrainingSchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <TrainingScheduleHero />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6 pb-10 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </div>
    }>
      <TrainingScheduleContent />
    </Suspense>
  );
}
