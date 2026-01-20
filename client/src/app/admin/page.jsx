'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { analyticsAPI, orderAPI } from '@/lib/api';
import { Users, IndianRupee, Video, CreditCard } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4A50B0', '#5C64D7', '#878fe7', '#a5abed', '#c3c7f3', '#e1e3f9'];

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders first (more reliable)
      const ordersRes = await orderAPI.getAllOrders({ limit: 10 });
      
      if (ordersRes.success) {
        // Normalize all order types into a single array
        const allOrders = [];
        
        // Regular orders (EBOOK, SUBSCRIPTION, etc.)
        if (ordersRes.data.orders) {
          ordersRes.data.orders.forEach(order => {
            allOrders.push({
              id: order.id,
              orderNumber: order.orderNumber,
              user: order.user,
              type: order.orderType || 'E-Book',
              amount: order.finalAmount || order.totalAmount || 0,
              status: order.status || order.paymentStatus,
              createdAt: order.createdAt,
            });
          });
        }
        
        // Webinar orders
        if (ordersRes.data.webinarOrders) {
          ordersRes.data.webinarOrders.forEach(order => {
            allOrders.push({
              id: order.id,
              orderNumber: `WEB-${order.id.slice(0, 8)}`,
              user: order.user,
              type: 'Webinar',
              amount: order.amountPaid || 0,
              status: order.paymentMode === 'RAZORPAY' ? 'PAID' : 'PENDING',
              createdAt: order.createdAt,
            });
          });
        }
        
        // Guidance orders
        if (ordersRes.data.guidanceOrders) {
          ordersRes.data.guidanceOrders.forEach(order => {
            allOrders.push({
              id: order.id,
              orderNumber: `GUID-${order.id.slice(0, 8)}`,
              user: order.user,
              type: 'Guidance',
              amount: order.amountPaid || 0,
              status: order.paymentStatus || 'PENDING',
              createdAt: order.createdAt,
            });
          });
        }
        
        // Mentorship orders
        if (ordersRes.data.mentorshipOrders) {
          ordersRes.data.mentorshipOrders.forEach(order => {
            allOrders.push({
              id: order.id,
              orderNumber: `MENT-${order.id.slice(0, 8)}`,
              user: order.user,
              type: 'Mentorship',
              amount: order.amountPaid || 0,
              status: order.paymentStatus || 'PENDING',
              createdAt: order.createdAt,
            });
          });
        }
        
        // Course orders are already included in the main orders array as orderType: "COURSE"
        // So we don't add courseOrders separately to avoid duplicates
        
        // Sort by date (newest first) and take top 10
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentOrders(allOrders.slice(0, 10));
      }
      
      // Fetch analytics (with error handling)
      try {
        const analyticsRes = await analyticsAPI.getAnalytics({ days: 30 });
        if (analyticsRes.success && analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        } else {
          console.warn('Analytics API returned unsuccessful response:', analyticsRes);
        }
      } catch (analyticsError) {
        console.error('Analytics API error:', analyticsError);
        // Don't block the page if analytics fails - show empty state
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-2">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const overview = analytics?.overview || {};
  const revenueByType = analytics?.revenueByType || {};
  const ordersByType = analytics?.ordersByType || {};
  const dailyRevenue = analytics?.dailyRevenue || [];
  const monthlyRevenue = analytics?.monthlyRevenue || [];

  // Prepare data for charts
  const revenueByTypeData = Object.entries(revenueByType)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value: value,
    }));

  const ordersByTypeData = Object.entries(ordersByType)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value: value,
    }));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      COMPLETED: 'default',
      PENDING: 'secondary',
      FAILED: 'destructive',
      PAID: 'default',
      FREE: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'Admin'}!</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(overview.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Active plans</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Programs</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overview.totalWebinars || 0) + (overview.totalMentorships || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Webinars & Mentorship</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Revenue Line Chart */}
        <Card className="border-2 md:col-span-2">
          <CardHeader>
            <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
            <CardDescription>Revenue trend over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4A50B0" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Type Pie Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
            <CardDescription>Revenue distribution across order types</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByTypeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Type Bar Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Orders by Type</CardTitle>
            <CardDescription>Number of orders per order type</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersByTypeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No orders data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} labelStyle={{ color: 'var(--foreground)' }} />
                  <Legend />
                  <Bar dataKey="value" fill="#4A50B0" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue Line Chart */}
        <Card className="border-2 md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue (Last 12 Months)</CardTitle>
            <CardDescription>Revenue trend over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4A50B0" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders">
              <span className="text-sm text-brand-600 hover:underline">View all</span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber || `#${order.id.slice(0, 8)}`}</TableCell>
                    <TableCell>{order.user?.name || order.user?.email || 'N/A'}</TableCell>
                    <TableCell>{order.type || 'N/A'}</TableCell>
                    <TableCell>₹{(order.amount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
