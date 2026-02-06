'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Download, TrendingUp, Video, MessageCircle, BookOpen, Play, IndianRupee, Loader2, Package, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';

function OrdersContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Order completed successfully!');
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Determine API type parameter
      let apiType = undefined;
      if (activeTab === 'webinars') apiType = 'webinar';
      else if (activeTab === 'guidance') apiType = 'guidance';
      else if (activeTab === 'courses') apiType = 'course';

      // Fetch orders
      const orderResponse = await orderAPI.getOrders({ type: apiType });
      const allOrders = orderResponse.success ? orderResponse.data.orders : [];

      // Process and combine all orders
      const processedOrders = [];

      // Process regular orders (ebooks, webinars, guidance, mentorship, courses)
      allOrders.forEach(order => {
        // Add ebook items
        if (order.items && order.items.length > 0) {
          processedOrders.push({
            ...order,
            displayType: 'ebook',
          });
        }

        // Add webinar orders as separate entries
        if (order.webinarOrders && order.webinarOrders.length > 0) {
          order.webinarOrders.forEach(wo => {
            processedOrders.push({
              id: wo.id,
              orderNumber: order.orderNumber || `WEB-${wo.id.slice(0, 8).toUpperCase()}`,
              orderType: 'WEBINAR',
              status: wo.paymentId ? 'COMPLETED' : 'PENDING',
              paymentStatus: wo.paymentId ? 'PAID' : wo.paymentMode === 'FREE' ? 'FREE' : 'PENDING',
              totalAmount: wo.amountPaid || 0,
              finalAmount: wo.amountPaid || 0,
              createdAt: wo.createdAt || order.createdAt,
              razorpayPaymentId: order.razorpayPaymentId,
              razorpayOrderId: order.razorpayOrderId,
              couponCode: order.couponCode,
              discountAmount: 0,
              displayType: 'webinar',
              webinarOrders: [wo],
              items: [],
              subscriptions: [],
            });
          });
        }

        // Add guidance orders as separate entries
        if (order.guidanceOrders && order.guidanceOrders.length > 0) {
          order.guidanceOrders.forEach(go => {
            processedOrders.push({
              id: go.id,
              orderNumber: order.orderNumber || `GUID-${go.id.slice(0, 8).toUpperCase()}`,
              orderType: 'GUIDANCE',
              status: go.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
              paymentStatus: go.paymentStatus || 'PENDING',
              totalAmount: go.amountPaid || 0,
              finalAmount: go.amountPaid || 0,
              createdAt: go.createdAt || order.createdAt,
              razorpayPaymentId: order.razorpayPaymentId,
              razorpayOrderId: order.razorpayOrderId,
              couponCode: order.couponCode,
              discountAmount: 0,
              displayType: 'guidance',
              guidanceOrders: [go],
              items: [],
              subscriptions: [],
            });
          });
        }

        // Add course orders as separate entries
        if (order.courseOrders && order.courseOrders.length > 0) {
          order.courseOrders.forEach(co => {
            processedOrders.push({
              id: co.id,
              orderNumber: order.orderNumber || `COURSE-${co.id.slice(0, 8).toUpperCase()}`,
              orderType: 'COURSE',
              status: co.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
              paymentStatus: co.paymentStatus || 'PENDING',
              totalAmount: co.amountPaid || 0,
              finalAmount: co.amountPaid || 0,
              createdAt: co.createdAt || order.createdAt,
              razorpayPaymentId: order.razorpayPaymentId,
              razorpayOrderId: order.razorpayOrderId,
              couponCode: order.couponCode,
              discountAmount: 0,
              displayType: 'course',
              courseOrders: [co],
              items: [],
              subscriptions: [],
            });
          });
        }


        // Add offline batch orders as separate entries
        if (order.offlineBatchOrders && order.offlineBatchOrders.length > 0) {
          order.offlineBatchOrders.forEach(bo => {
            processedOrders.push({
              id: bo.id,
              orderNumber: order.orderNumber || `BATCH-${bo.id.slice(0, 8).toUpperCase()}`,
              orderType: 'OFFLINE_BATCH',
              status: bo.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
              paymentStatus: bo.paymentStatus || 'PENDING',
              totalAmount: bo.amountPaid || 0,
              finalAmount: bo.amountPaid || 0,
              createdAt: bo.createdAt || order.createdAt,
              razorpayPaymentId: order.razorpayPaymentId,
              razorpayOrderId: order.razorpayOrderId,
              couponCode: order.couponCode,
              discountAmount: 0,
              displayType: 'offlineBatch',
              offlineBatchOrders: [bo],
              items: [],
              subscriptions: [],
            });
          });
        }

        // Add bundle orders as separate entries
        if (order.bundleOrders && order.bundleOrders.length > 0) {
          order.bundleOrders.forEach(bo => {
            processedOrders.push({
              id: bo.id,
              orderNumber: order.orderNumber || `BND-${bo.id.slice(0, 8).toUpperCase()}`,
              orderType: 'BUNDLE',
              status: bo.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
              paymentStatus: bo.paymentStatus || 'PENDING',
              totalAmount: bo.amountPaid || 0,
              finalAmount: bo.amountPaid || 0,
              createdAt: bo.createdAt || order.createdAt,
              razorpayPaymentId: order.razorpayPaymentId,
              razorpayOrderId: order.razorpayOrderId,
              couponCode: order.couponCode,
              discountAmount: 0,
              displayType: 'bundle',
              bundleOrders: [bo],
              items: [],
              subscriptions: [],
            });
          });
        }
      });

      // Filter by active tab
      let filtered = processedOrders;
      if (activeTab === 'purchased') {
        filtered = processedOrders.filter(o => o.status === 'COMPLETED' && o.finalAmount > 0);
      } else if (activeTab === 'free') {
        filtered = processedOrders.filter(o => o.status === 'COMPLETED' && o.finalAmount === 0);
      } else if (activeTab === 'webinars') {
        filtered = processedOrders.filter(o => o.displayType === 'webinar');
      } else if (activeTab === 'guidance') {
        filtered = processedOrders.filter(o => o.displayType === 'guidance');
      } else if (activeTab === 'courses') {
        filtered = processedOrders.filter(o => o.displayType === 'course');
      } else if (activeTab === 'offlineBatches') {
        filtered = processedOrders.filter(o => o.displayType === 'offlineBatch');
      } else if (activeTab === 'bundles') {
        filtered = processedOrders.filter(o => o.displayType === 'bundle');
      }

      // Sort by date
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(filtered);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === 'PENDING') return <Clock className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">My Orders</h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 items-center justify-center rounded-md bg-muted p-1 gap-1 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-all ${activeTab === 'all'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'purchased'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Purchased
          </button>
          <button
            onClick={() => setActiveTab('free')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'free'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Free
          </button>
          <button
            onClick={() => setActiveTab('webinars')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'webinars'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Webinars
          </button>
          <button
            onClick={() => setActiveTab('guidance')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'guidance'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            1:1 Guidance
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'courses'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('offlineBatches')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'offlineBatches'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Offline Batches
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`px-3 sm:px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'bundles'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Bundles
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4 dark:text-gray-400">No orders found</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/ebooks">Browse E-Books</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/webinars">Browse Webinars</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 dark:text-white text-lg sm:text-xl">
                      <span className="truncate">Order #{order.orderNumber}</span>
                      {order.orderType === 'WEBINAR' && <Video className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {order.orderType === 'GUIDANCE' && <MessageCircle className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {order.orderType === 'COURSE' && <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {order.orderType === 'COURSE' && <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {order.orderType === 'SUBSCRIPTION' && <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {order.orderType === 'OFFLINE_BATCH' && <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                      {order.orderType === 'BUNDLE' && <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusIcon(order.status)}
                    <span className={`text-sm sm:text-base font-semibold ${order.status === 'COMPLETED' ? 'text-green-600' :
                      order.status === 'PENDING' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* E-Book Items */}
                  {order.items && order.items.length > 0 && order.items.map((item) => (
                    <div key={item.id} className="flex gap-3 sm:gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                      {item.ebook?.image1Url && (
                        <Link href={item.ebook.slug ? `/ebooks/${item.ebook.slug}` : '#'}>
                          <div className="w-16 h-24 sm:w-20 sm:h-28 relative rounded-md overflow-hidden border flex-shrink-0 dark:border-gray-700">
                            <Image
                              src={item.ebook.image1Url}
                              alt={item.ebook.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold dark:text-white text-sm sm:text-base break-words">{item.ebook?.title}</h3>
                        {item.ebook?.isFree ? (
                          <p className="text-green-600 dark:text-green-400 font-semibold mt-1 text-sm">FREE</p>
                        ) : (
                          <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1 text-sm">₹{item.price?.toFixed(2)}</p>
                        )}
                        {order.status === 'COMPLETED' && item.ebook?.pdfUrl && (
                          <Button size="sm" variant="outline" className="mt-2 text-xs sm:text-sm" asChild>
                            <a href={item.ebook.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Download PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Webinar Orders */}
                  {order.webinarOrders && order.webinarOrders.length > 0 && order.webinarOrders.map((wo) => {
                    const webinar = wo.webinar;
                    if (!webinar) return null;
                    return (
                      <div key={wo.id} className="flex gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                        {webinar.imageUrl && (
                          <Link href={webinar.slug ? `/webinars/${webinar.slug}` : '#'}>
                            <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={webinar.imageUrl}
                                alt={webinar.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold dark:text-white">{webinar.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            {webinar.instructorName} • {webinar.type}
                          </p>
                          {wo.amountPaid === 0 ? (
                            <p className="text-green-600 dark:text-green-400 font-semibold mt-1">FREE</p>
                          ) : (
                            <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">₹{wo.amountPaid?.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Guidance Orders */}
                  {order.guidanceOrders && order.guidanceOrders.length > 0 && order.guidanceOrders.map((go) => {
                    const guidance = go.guidance;
                    const slot = go.slot;
                    if (!guidance || !slot) return null;
                    return (
                      <div key={go.id} className="flex gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                        {guidance.expertImageUrl && (
                          <Link href={guidance.slug ? `/guidance/${guidance.slug}` : '#'}>
                            <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={guidance.expertImageUrl}
                                alt={guidance.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold dark:text-white">{guidance.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            Expert: {guidance.expertName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            {formatDate(slot.date)} {slot.startTime} - {slot.endTime}
                          </p>
                          {go.amountPaid === 0 ? (
                            <p className="text-green-600 dark:text-green-400 font-semibold mt-1">FREE</p>
                          ) : (
                            <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">₹{go.amountPaid?.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Mentorship Orders */}
                  {order.mentorshipOrders && order.mentorshipOrders.length > 0 && order.mentorshipOrders.map((mo) => {
                    const mentorship = mo.mentorship;
                    if (!mentorship) return null;
                    return (
                      <div key={mo.id} className="flex gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                        {mentorship.coverImageUrl && (
                          <Link href={mentorship.slug ? `/mentorship/${mentorship.slug}` : '#'}>
                            <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={getPublicUrl(mentorship.coverImageUrl) || mentorship.coverImageUrl}
                                alt={mentorship.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold dark:text-white">{mentorship.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            {mentorship.instructorName} • {mentorship.totalSessions} sessions
                          </p>
                          {mo.amountPaid === 0 ? (
                            <p className="text-green-600 dark:text-green-400 font-semibold mt-1">FREE</p>
                          ) : (
                            <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">₹{mo.amountPaid?.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Course Orders */}
                  {order.courseOrders && order.courseOrders.length > 0 && order.courseOrders.map((co) => {
                    const course = co.course;
                    if (!course) return null;
                    return (
                      <div key={co.id} className="flex gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                        {course.coverImageUrl && (
                          <Link href={course.slug ? `/courses/${course.slug}` : '#'}>
                            <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={getPublicUrl(course.coverImageUrl) || course.coverImageUrl}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold dark:text-white">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            Language: {course.language}
                          </p>
                          {co.amountPaid === 0 ? (
                            <p className="text-green-600 dark:text-green-400 font-semibold mt-1">FREE</p>
                          ) : (
                            <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">₹{co.amountPaid?.toFixed(2)}</p>
                          )}
                          {course.slug && (
                            <Button size="sm" className="mt-2 bg-brand-600 hover:bg-brand-700" asChild>
                              <Link href={`/courses/${course.slug}/learn`}>
                                <Play className="mr-2 h-4 w-4" />
                                Continue Learning
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );

                  })}

                  {/* Offline Batch Orders */}
                  {order.offlineBatchOrders && order.offlineBatchOrders.length > 0 && order.offlineBatchOrders.map((bo) => {
                    const batch = bo.batch;
                    if (!batch) return null;
                    return (
                      <div key={bo.id} className="flex gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                        {batch.thumbnailUrl ? (
                          <Link href={batch.slug ? `/offline-batches/${batch.slug}` : '#'}>
                            <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={getPublicUrl(batch.thumbnailUrl) || batch.thumbnailUrl}
                                alt={batch.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0 bg-muted flex items-center justify-center">
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold dark:text-white">{batch.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            Offline Batch {batch.city && `• ${batch.city}`}
                          </p>
                          {bo.amountPaid === 0 ? (
                            <p className="text-green-600 dark:text-green-400 font-semibold mt-1">FREE</p>
                          ) : (
                            <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">₹{bo.amountPaid?.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bundle Orders */}
                  {order.bundleOrders && order.bundleOrders.length > 0 && order.bundleOrders.map((bo) => {
                    const bundle = bo.bundle;
                    if (!bundle) return null;
                    return (
                      <div key={bo.id} className="flex gap-4 pb-4 border-b last:border-0 dark:border-gray-800">
                        {bundle.thumbnailUrl ? (
                          <Link href={bundle.slug ? `/bundle/${bundle.slug}` : '#'}>
                            <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={getPublicUrl(bundle.thumbnailUrl) || bundle.thumbnailUrl}
                                alt={bundle.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-20 h-28 relative rounded-md overflow-hidden border flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                            <Package className="h-8 w-8 text-purple-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold dark:text-white">{bundle.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                            Course Bundle
                          </p>
                          {bo.amountPaid === 0 ? (
                            <p className="text-green-600 dark:text-green-400 font-semibold mt-1">FREE</p>
                          ) : (
                            <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">₹{bo.amountPaid?.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Order Summary */}
                  <div className="pt-4 border-t dark:border-gray-800">
                    {(order.totalAmount !== order.finalAmount || order.couponCode || order.discountAmount > 0) && (
                      <div className="mb-4 p-4 bg-muted/50 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="text-sm font-semibold mb-3 dark:text-white">Price Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">Original Price:</span>
                            <span className="text-sm font-semibold dark:text-white">₹{order.totalAmount?.toFixed(2) || order.finalAmount?.toFixed(2)}</span>
                          </div>
                          {order.couponCode && (
                            <div className="flex justify-between items-center py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                              <span className="text-sm font-semibold dark:text-white">
                                🎟️ Coupon: <span className="text-brand-600 dark:text-brand-400 uppercase">{order.couponCode}</span>
                              </span>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                -₹{order.discountAmount?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          )}
                          {!order.couponCode && order.discountAmount > 0 && (
                            <div className="flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                              <span className="text-sm font-semibold dark:text-white">Discount:</span>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                -₹{order.discountAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Total Amount Paid</p>
                        {order.paymentStatus && (
                          <Badge className={`mt-2 ${order.paymentStatus === 'PAID' ? 'bg-green-500' :
                            order.paymentStatus === 'PENDING' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}>
                            {order.paymentStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        {order.finalAmount === 0 ? (
                          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">FREE</p>
                        ) : (
                          <>
                            {order.totalAmount && order.totalAmount > order.finalAmount && (
                              <p className="text-xs sm:text-sm line-through text-muted-foreground dark:text-gray-500 mb-1">
                                ₹{order.totalAmount.toFixed(2)}
                              </p>
                            )}
                            <p className="text-2xl font-bold flex items-center gap-1 dark:text-white">
                              <IndianRupee className="h-6 w-6" />
                              {order.finalAmount?.toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
