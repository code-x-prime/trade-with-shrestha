'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { analyticsAPI, adminAPI, couponAPI } from '@/lib/api';
import {
  Users, BookOpen, Video, CreditCard,
  MessageCircle, GraduationCap, Tag, Database, Server, Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    ebooks: 0,
    webinars: 0,
    guidance: 0,
    coupons: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllStats();
    }
  }, [user, isAdmin]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);

      // Fetch analytics first (contains most stats)
      const analyticsRes = await analyticsAPI.getAnalytics({ days: 30 });

      // Fetch additional stats in parallel
      const [
        usersRes,
        couponsRes,
      ] = await Promise.all([
        adminAPI.getUsers({ limit: 1 }),
        couponAPI.getCoupons({ limit: 1 }),
      ]);

      const overview = analyticsRes.success ? analyticsRes.data.overview || {} : {};

      setStats({
        users: overview.totalUsers || (usersRes.success ? usersRes.data.pagination?.total || 0 : 0),
        courses: overview.totalCourses || 0,
        ebooks: overview.totalEbooks || 0,
        webinars: overview.totalWebinars || 0,
        guidance: overview.totalGuidance || 0,
        coupons: couponsRes.success ? (couponsRes.data.pagination?.total || couponsRes.data.coupons?.length || 0) : 0,
        revenue: overview.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch platform statistics');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Platform settings and system information</p>
      </div>

      {/* Platform Statistics */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Statistics
          </CardTitle>
          <CardDescription>Real-time platform data from database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{stats.users}</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString('en-IN')}</div>
                <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Courses</span>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{stats.courses}</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">E-Books</span>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{stats.ebooks}</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Webinars</span>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{stats.webinars}</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">1:1 Guidance</span>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{stats.guidance}</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Coupons</span>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{stats.coupons}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>Platform configuration and environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border-2 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Environment</div>
                <div className="font-semibold">
                  <Badge variant="outline">
                    {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                  </Badge>
                </div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">API Base URL</div>
                <div className="font-mono text-sm">{process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Database</div>
                <div className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  PostgreSQL
                </div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Platform Version</div>
                <div className="font-semibold">v1.0.0</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border-2 rounded-lg hover:border-brand-300 transition-colors">
              <div className="font-semibold mb-1">View Analytics</div>
              <div className="text-sm text-muted-foreground">Check platform analytics and reports</div>
            </div>

            <div className="p-4 border-2 rounded-lg hover:border-brand-300 transition-colors">
              <div className="font-semibold mb-1">Manage Content</div>
              <div className="text-sm text-muted-foreground">Create and edit courses, ebooks, and more</div>
            </div>

            <div className="p-4 border-2 rounded-lg hover:border-brand-300 transition-colors">
              <div className="font-semibold mb-1">User Management</div>
              <div className="text-sm text-muted-foreground">View and manage user accounts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

