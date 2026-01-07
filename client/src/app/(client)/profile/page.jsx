'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, BookOpen, ShoppingBag, CreditCard, Settings, LogOut,
  Video, Clock, ArrowRight, Play, Award, Tag
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';

const menuItems = [
  { label: 'My Courses', href: '/profile/enrolled', icon: BookOpen },
  { label: 'Certificates', href: '/profile/certificates', icon: Award },
  { label: 'Orders', href: '/profile/orders', icon: ShoppingBag },
  { label: 'Subscriptions', href: '/profile/subscription', icon: CreditCard },
  { label: 'Available Coupons', href: '/cart', icon: Tag },
  { label: 'Settings', href: '/profile/settings', icon: Settings },
];

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    livePrograms: 0,
  });
  const [recentContent, setRecentContent] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch orders to calculate stats
      const orderResponse = await orderAPI.getOrders();
      const orders = orderResponse.success ? orderResponse.data.orders : [];

      // Count enrolled courses
      let courseCount = 0;
      let programCount = 0;

      orders.forEach(order => {
        if (order.courseOrders && order.courseOrders.length > 0) {
          courseCount += order.courseOrders.length;
        }
        if (order.webinarOrders && order.webinarOrders.length > 0) {
          programCount += order.webinarOrders.length;
        }
        if (order.mentorshipOrders && order.mentorshipOrders.length > 0) {
          programCount += order.mentorshipOrders.length;
        }
        if (order.guidanceOrders && order.guidanceOrders.length > 0) {
          programCount += order.guidanceOrders.length;
        }
      });

      setStats({
        enrolledCourses: courseCount,
        livePrograms: programCount,

      });

      // Fetch recent enrolled courses (not completed)
      const enrolledResponse = await orderAPI.getOrders({ type: 'course' });
      const courseOrders = enrolledResponse.success ? enrolledResponse.data.orders : [];
      const recentCourses = [];
      const seenCourseIds = new Set(); // Track seen course IDs to avoid duplicates

      for (const order of courseOrders) {
        if (order.courseOrders && order.courseOrders.length > 0) {
          for (const co of order.courseOrders) {
            if (co.course && co.paymentStatus === 'PAID') {
              // Skip if already added (duplicate)
              if (seenCourseIds.has(co.course.id)) continue;
              seenCourseIds.add(co.course.id);

              // Fetch progress to check if completed
              try {
                const { courseAPI } = await import('@/lib/api');
                const progressResponse = await courseAPI.getCourseProgress(co.course.id);
                const progress = progressResponse.success ? (progressResponse.data.overallProgress || 0) : 0;

                // Only add courses that are NOT 100% completed
                if (progress < 100) {
                  recentCourses.push({
                    id: co.course.id,
                    title: co.course.title,
                    slug: co.course.slug,
                    image: co.course.coverImage || co.course.coverImageUrl,
                    type: 'course',
                    progress: progress,
                  });
                }
              } catch (err) {
                // If progress fetch fails, still add the course (assume not completed)
                recentCourses.push({
                  id: co.course.id,
                  title: co.course.title,
                  slug: co.course.slug,
                  image: co.course.coverImage || co.course.coverImageUrl,
                  type: 'course',
                  progress: 0,
                });
              }
            }
          }
        }
      }

      setRecentContent(recentCourses.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Desktop */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    {user.avatarUrl || user.avatar ? (
                      <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                        <Image
                          src={getPublicUrl(user.avatarUrl || user.avatar)}
                          alt={user.name || 'User'}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-brand-600 dark:bg-brand-700 flex items-center justify-center shadow-lg">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg dark:text-white">{user.name || 'User'}</h2>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Menu */}
            <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                      (item.href === '/profile/enrolled' && pathname?.startsWith('/profile/enrolled')) ||
                      (item.href === '/profile/orders' && pathname?.startsWith('/profile/orders'));

                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                              ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/20 dark:text-brand-400'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                            }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2 dark:text-white">Dashboard</h1>
              <p className="text-muted-foreground dark:text-gray-400">Welcome back, {user.name?.split(' ')[0] || 'there'}!</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 dark:text-gray-400">Enrolled Courses</p>
                      <p className="text-2xl font-bold dark:text-white">{stats.enrolledCourses}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 dark:text-gray-400">Live Programs</p>
                      <p className="text-2xl font-bold dark:text-white">{stats.livePrograms}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>

            {/* Recently Accessed Content */}
            {recentContent.length > 0 && (
              <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Continue Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentContent.map((item) => (
                      <Link
                        key={item.id}
                        href={`/courses/${item.slug}`}
                        className="flex items-center gap-4 p-4 rounded-lg border-2 hover:border-brand-300 transition-colors group dark:border-gray-800 dark:hover:border-brand-700"
                      >
                        {item.image && (
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={getPublicUrl(item.image)}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold group-hover:text-brand-600 transition-colors truncate dark:text-white">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">Course</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-2 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-auto py-6 justify-start dark:border-gray-800 dark:hover:bg-gray-800">
                    <Link href="/courses">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold dark:text-white">Browse Courses</p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">Explore new courses</p>
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-6 justify-start dark:border-gray-800 dark:hover:bg-gray-800">
                    <Link href="/profile/enrolled">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Play className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold dark:text-white">My Courses</p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">Continue learning</p>
                        </div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
