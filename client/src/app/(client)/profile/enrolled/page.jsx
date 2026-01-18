'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { orderAPI, webinarAPI, mentorshipAPI, courseAPI, bundleAPI, offlineBatchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Video, MessageCircle, Users, ExternalLink, Clock, Calendar, User, ArrowRight, Award,
  BookOpen, Download, Package, GraduationCap, BarChart3, PlayCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const TABS = [
  { id: 'courses', label: 'Courses', icon: Video },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'sessions', label: 'Sessions', icon: MessageCircle },
  { id: 'webinars', label: 'Webinars', icon: Video },
  { id: 'live', label: 'Live', icon: Users },
  { id: 'indicators', label: 'Indicators', icon: BarChart3 },
  { id: 'bundles', label: 'Bundles', icon: Package },
  { id: 'offline', label: 'Offline Classes', icon: GraduationCap },
];

export default function EnrolledPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('courses');
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState({});
  const [fetchedTabs, setFetchedTabs] = useState(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !fetchedTabs.has(activeTab)) {
      fetchTabData(activeTab);
    }
  }, [isAuthenticated, activeTab]);

  const fetchTabData = async (tab) => {
    if (fetchedTabs.has(tab)) return; // Already fetched

    try {
      setLoading(prev => ({ ...prev, [tab]: true }));

      let tabItems = [];

      switch (tab) {
        case 'courses':
          tabItems = await fetchCourses();
          break;
        case 'books':
          tabItems = await fetchBooks();
          break;
        case 'sessions':
          tabItems = await fetchSessions();
          break;
        case 'webinars':
          tabItems = await fetchWebinars();
          break;
        case 'live':
          tabItems = await fetchMentorship();
          break;
        case 'indicators':
          tabItems = await fetchIndicators();
          break;
        case 'bundles':
          tabItems = await fetchBundles();
          break;
        case 'offline':
          tabItems = await fetchOfflineBatches();
          break;
      }

      setItems(prev => ({ ...prev, [tab]: tabItems }));
      setFetchedTabs(prev => new Set([...prev, tab]));
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      toast.error(`Failed to load ${TABS.find(t => t.id === tab)?.label || tab}`);
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  const fetchCourses = async () => {
    const orderResponse = await orderAPI.getOrders({ type: 'course' });
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.courseOrders && order.courseOrders.length > 0) {
        for (const co of order.courseOrders) {
          if (co.course && co.paymentStatus === 'PAID') {
            try {
              const progressResponse = await courseAPI.getCourseProgress(co.course.id);
              let progress = 0;
              let completedChapters = 0;
              let totalChapters = 0;

              if (progressResponse.success) {
                progress = progressResponse.data.overallProgress || 0;
                completedChapters = progressResponse.data.completedChapters || 0;
                totalChapters = progressResponse.data.totalChapters || 0;
              }

              items.push({
                id: co.id,
                type: 'course',
                courseId: co.course.id,
                title: co.course.title,
                slug: co.course.slug,
                image: co.course.coverImage || co.course.coverImageUrl,
                progress,
                completedChapters,
                totalChapters,
                enrolledAt: co.createdAt || order.createdAt,
              });
            } catch (error) {
              console.error('Error fetching course progress:', error);
              items.push({
                id: co.id,
                type: 'course',
                courseId: co.course.id,
                title: co.course.title,
                slug: co.course.slug,
                image: co.course.coverImage || co.course.coverImageUrl,
                progress: 0,
                completedChapters: 0,
                totalChapters: 0,
                enrolledAt: co.createdAt || order.createdAt,
              });
            }
          }
        }
      }
    }
    return items;
  };

  const fetchBooks = async () => {
    const orderResponse = await orderAPI.getOrders();
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.ebook && order.status === 'COMPLETED') {
            items.push({
              id: item.id,
              type: 'ebook',
              ebookId: item.ebook.id,
              title: item.ebook.title,
              slug: item.ebook.slug,
              image: item.ebook.image1,
              purchasedAt: order.createdAt,
            });
          }
        }
      }
    }
    return items;
  };

  const fetchSessions = async () => {
    const orderResponse = await orderAPI.getOrders();
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.guidanceOrders && order.guidanceOrders.length > 0) {
        for (const go of order.guidanceOrders) {
          if (go.guidance && go.slot) {
            const guidance = go.guidance;
            const slot = go.slot;

            const slotDate = new Date(slot.date);
            const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
            slotDate.setHours(startHours, startMinutes, 0, 0);

            const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
            const slotEnd = new Date(slotDate);
            slotEnd.setHours(endHours, endMinutes, 0, 0);

            const now = new Date();
            let status = 'upcoming';
            if (now > slotEnd) {
              status = 'ended';
            } else if (now >= slotDate) {
              status = 'live';
            }

            const tenMinutesBefore = new Date(slotDate.getTime() - 10 * 60 * 1000);
            const canAccessLink = now >= tenMinutesBefore && now <= slotEnd;

            items.push({
              id: go.id,
              type: 'guidance',
              title: guidance.title,
              slug: guidance.slug,
              image: guidance.expertImage,
              instructor: guidance.expertName,
              startDate: slotDate,
              endDate: slotEnd,
              duration: guidance.durationMinutes,
              status,
              canAccessLink,
              enrolledAt: go.createdAt,
              slotId: slot.id,
            });
          }
        }
      }
    }
    return items;
  };

  const fetchWebinars = async () => {
    const orderResponse = await orderAPI.getOrders();
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.webinarOrders && order.webinarOrders.length > 0) {
        for (const wo of order.webinarOrders) {
          if (wo.webinar) {
            const webinar = wo.webinar;
            const startDate = new Date(webinar.startDate);
            
            // Combine startDate with startTime if available
            if (webinar.startTime) {
              const [hours, minutes] = webinar.startTime.split(':').map(Number);
              startDate.setHours(hours, minutes, 0, 0);
            }
            
            const duration = webinar.duration || 60;
            const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
            const now = new Date();

            let status = 'upcoming';
            if (now > endDate) {
              status = 'ended';
            } else if (now >= startDate) {
              status = 'live';
            }

            const tenMinutesBefore = new Date(startDate.getTime() - 10 * 60 * 1000);
            const canAccessLink = now >= tenMinutesBefore && now <= endDate;

            items.push({
              id: wo.id,
              webinarId: webinar.id,
              type: 'webinar',
              title: webinar.title,
              slug: webinar.slug,
              image: webinar.image,
              instructor: webinar.instructorName,
              startDate,
              endDate,
              duration,
              status,
              canAccessLink,
              enrolledAt: wo.createdAt,
            });
          }
        }
      }
    }
    return items;
  };

  const fetchMentorship = async () => {
    const orderResponse = await orderAPI.getOrders({ type: 'mentorship' });
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.mentorshipOrders && order.mentorshipOrders.length > 0) {
        for (const mo of order.mentorshipOrders) {
          if (mo.mentorship) {
            const mentorship = mo.mentorship;

            try {
              const sessionsResponse = await mentorshipAPI.getSessions(mentorship.id);
              const sessions = sessionsResponse.success ? sessionsResponse.data.sessions : [];

              if (sessions.length > 0) {
                const now = new Date();
                let activeSession = null;

                for (const session of sessions) {
                  const sessionDate = new Date(session.sessionDate);
                  const [hours, minutes] = session.startTime.split(':').map(Number);
                  sessionDate.setHours(hours, minutes, 0, 0);

                  const [endHours, endMinutes] = session.endTime.split(':').map(Number);
                  const sessionEnd = new Date(sessionDate);
                  sessionEnd.setHours(endHours, endMinutes, 0, 0);

                  if (now <= sessionEnd) {
                    activeSession = {
                      ...session,
                      startDate: sessionDate,
                      endDate: sessionEnd,
                    };
                    break;
                  }
                }

                if (activeSession) {
                  let status = 'upcoming';
                  if (now > activeSession.endDate) {
                    status = 'ended';
                  } else if (now >= activeSession.startDate) {
                    status = 'live';
                  }

                  const tenMinutesBefore = new Date(activeSession.startDate.getTime() - 10 * 60 * 1000);
                  const canAccessLink = now >= tenMinutesBefore && now <= activeSession.endDate;

                  items.push({
                    id: mo.id,
                    type: 'mentorship',
                    title: mentorship.title,
                    slug: mentorship.slug,
                    image: mentorship.coverImage,
                    instructor: mentorship.instructorName,
                    startDate: activeSession.startDate,
                    endDate: activeSession.endDate,
                    duration: null,
                    status,
                    canAccessLink,
                    enrolledAt: mo.createdAt,
                    mentorshipId: mentorship.id,
                    sessionTitle: activeSession.title,
                  });
                }
              }
            } catch (error) {
              console.error('Error fetching mentorship sessions:', error);
            }
          }
        }
      }
    }
    return items;
  };

  const fetchIndicators = async () => {
    const orderResponse = await orderAPI.getOrders();
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.indicator && order.status === 'COMPLETED') {
            items.push({
              id: item.id,
              type: 'indicator',
              indicatorId: item.indicator.id,
              title: item.indicator.title,
              slug: item.indicator.slug,
              image: item.indicator.image,
              purchasedAt: order.createdAt,
            });
          }
        }
      }
    }
    return items;
  };

  const fetchBundles = async () => {
    // Fetch bundle enrollments
    const orderResponse = await orderAPI.getOrders();
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.bundleOrders && order.bundleOrders.length > 0) {
        for (const bo of order.bundleOrders) {
          if (bo.bundle && bo.paymentStatus === 'PAID') {
            items.push({
              id: bo.id,
              type: 'bundle',
              bundleId: bo.bundle.id,
              title: bo.bundle.title,
              slug: bo.bundle.slug,
              image: bo.bundle.thumbnail,
              enrolledAt: bo.createdAt || order.createdAt,
            });
          }
        }
      }
    }
    return items;
  };

  const fetchOfflineBatches = async () => {
    const orderResponse = await orderAPI.getOrders();
    const allOrders = orderResponse.success ? orderResponse.data.orders : [];
    const items = [];

    for (const order of allOrders) {
      if (order.offlineBatchOrders && order.offlineBatchOrders.length > 0) {
        for (const obo of order.offlineBatchOrders) {
          if (obo.batch && obo.paymentStatus === 'PAID') {
            items.push({
              id: obo.id,
              type: 'offline',
              batchId: obo.batch.id,
              title: obo.batch.title,
              slug: obo.batch.slug,
              image: obo.batch.thumbnail,
              city: obo.batch.city,
              enrolledAt: obo.createdAt || order.createdAt,
            });
          }
        }
      }
    }
    return items;
  };

  const handleJoin = async (item) => {
    try {
      let link = null;

      if (item.type === 'webinar') {
        const response = await webinarAPI.checkEnrollment(item.webinarId);
        if (response.success && response.data.canAccessLink) {
          link = response.data.googleMeetLink;
        }
      } else if (item.type === 'guidance') {
        const response = await orderAPI.checkGuidanceBooking(item.slotId);
        if (response.success && response.data.canAccessLink) {
          link = response.data.googleMeetLink;
        }
      } else if (item.type === 'mentorship') {
        const response = await mentorshipAPI.checkEnrollment(item.mentorshipId);
        if (response.success && response.data.canAccessLink) {
          link = response.data.googleMeetLink;
        }
      }

      if (link) {
        window.open(link, '_blank');
      } else {
        toast.error('Join link is not available yet. Please wait until 10 minutes before the session starts.');
      }
    } catch (error) {
      console.error('Error getting join link:', error);
      toast.error('Failed to get join link');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
          <Skeleton className="h-40 w-full rounded-t-2xl dark:bg-gray-800" />
          <CardContent className="p-5">
            <Skeleton className="h-5 w-3/4 mb-3 dark:bg-gray-800" />
            <Skeleton className="h-4 w-1/2 mb-4 dark:bg-gray-800" />
            <Skeleton className="h-9 w-full dark:bg-gray-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmpty = (tabLabel) => (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardContent className="py-12 text-center">
        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-gray-500" />
        <h3 className="text-lg font-semibold mb-2 dark:text-white">No {tabLabel} found</h3>
        <p className="text-muted-foreground mb-4 dark:text-gray-400">You haven&apos;t enrolled in any {tabLabel.toLowerCase()} yet.</p>
      </CardContent>
    </Card>
  );

  const renderItemCard = (item) => {
    const getTypeIcon = () => {
      switch (item.type) {
        case 'webinar': return <Video className="h-5 w-5" />;
        case 'guidance': return <MessageCircle className="h-5 w-5" />;
        case 'mentorship': return <Users className="h-5 w-5" />;
        case 'course': return <Video className="h-5 w-5" />;
        case 'ebook': return <BookOpen className="h-5 w-5" />;
        case 'indicator': return <BarChart3 className="h-5 w-5" />;
        case 'bundle': return <Package className="h-5 w-5" />;
        case 'offline': return <GraduationCap className="h-5 w-5" />;
        default: return <Video className="h-5 w-5" />;
      }
    };

    const getTypeLabel = () => {
      switch (item.type) {
        case 'webinar': return 'Webinar';
        case 'guidance': return '1:1 Guidance';
        case 'mentorship': return 'Live Mentorship';
        case 'course': return 'Course';
        case 'ebook': return 'Ebook';
        case 'indicator': return 'Indicator';
        case 'bundle': return 'Bundle';
        case 'offline': return 'Offline Class';
        default: return item.type;
      }
    };

    const getItemUrl = () => {
      switch (item.type) {
        case 'webinar': return `/webinars/${item.slug}`;
        case 'guidance': return `/guidance/${item.slug}`;
        case 'course': return `/courses/${item.slug}`;
        case 'mentorship': return `/mentorship/${item.slug}`;
        case 'ebook': return `/ebooks/${item.slug}`;
        case 'indicator': return `/indicators/${item.slug}`;
        case 'bundle': return `/bundle/${item.slug}`;
        case 'offline': return `/offline-batches/${item.slug}`;
        default: return '#';
      }
    };

    return (
      <motion.div
        key={`${item.type}-${item.id}`}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col dark:bg-gray-900 dark:border dark:border-gray-800">
          <Link href={getItemUrl()}>
            <div className="relative h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              {item.image ? (
                <Image
                  src={getPublicUrl(item.image)}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  {getTypeIcon()}
                </div>
              )}
              <div className="absolute top-3 right-3">
                {item.type === 'course' ? (
                  <Badge className="bg-brand-600 hover:bg-brand-700" variant="default">
                    Course
                  </Badge>
                ) : item.status ? (
                  <Badge className={item.status === 'live' ? 'bg-red-500 hover:bg-red-600' : item.status === 'ended' ? 'bg-gray-500' : 'bg-blue-500'} variant="default">
                    {item.status === 'live' ? 'Live Now' : item.status === 'ended' ? 'Ended' : 'Upcoming'}
                  </Badge>
                ) : null}
              </div>
            </div>
          </Link>
          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon()}
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel()}
                </Badge>
              </div>
              <Link href={getItemUrl()}>
                <h3 className="font-semibold text-base mb-1 line-clamp-2 leading-snug hover:text-hero-primary transition-colors dark:text-white dark:hover:text-hero-primary">
                  {item.title}
                </h3>
              </Link>
              {item.sessionTitle && (
                <p className="text-xs text-muted-foreground mb-2">Session: {item.sessionTitle}</p>
              )}
              {item.instructor && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{item.instructor}</span>
                </div>
              )}
              {item.city && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{item.city}</span>
                </div>
              )}
            </div>

            <div className="mb-4 space-y-2">
              {item.type !== 'course' && item.startDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(item.startDate)}</span>
                </div>
              )}
              {item.type !== 'course' && item.duration && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{item.duration} min</span>
                </div>
              )}
              {item.type === 'course' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground dark:text-gray-400">Progress</span>
                    <span className="font-medium dark:text-gray-200">{Math.round(item.progress || 0)}%</span>
                  </div>
                  <Progress value={item.progress || 0} className="h-2 dark:bg-gray-700" />
                  <div className="text-xs text-muted-foreground dark:text-gray-400">
                    {item.completedChapters || 0} of {item.totalChapters || 0} chapters completed
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-3 border-t space-y-3">
              {item.type === 'course' ? (
                item.progress >= 100 ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    asChild
                  >
                    <Link href={`/courses/${item.slug}/learn`}>
                      <Award className="h-4 w-4 mr-2" />
                      Completed ✓
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                    asChild
                  >
                    <Link href={`/courses/${item.slug}/learn`}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Link>
                  </Button>
                )
              ) : item.type === 'ebook' || item.type === 'indicator' ? (
                <Button
                  className="w-full bg-[#803ADB] hover:bg-[#6a2da8] text-white"
                  asChild
                >
                  <Link href={getItemUrl()}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              ) : item.type === 'bundle' ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  asChild
                >
                  <Link href={getItemUrl()}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue
                  </Link>
                </Button>
              ) : item.type === 'offline' ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  asChild
                >
                  <Link href={getItemUrl()}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Link>
                </Button>
              ) : item.status === 'live' || item.canAccessLink ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    handleJoin(item);
                  }}
                  disabled={item.status === 'ended'}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Live
                </Button>
              ) : item.status === 'ended' ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled
                >
                  Session Ended
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                  disabled
                >
                  Starts Soon
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full text-sm"
                asChild
              >
                <Link href={getItemUrl()}>
                  View Details
                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        {renderSkeleton()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Enrolled Items</h1>
        <p className="text-muted-foreground">View and access all your purchased items</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-6 h-auto p-1 bg-muted">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {loading[tab.id] ? (
              renderSkeleton()
            ) : !items[tab.id] || items[tab.id].length === 0 ? (
              renderEmpty(tab.label)
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items[tab.id].map((item) => renderItemCard(item))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
