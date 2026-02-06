'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileSpreadsheet, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const ORDER_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'E-Book', label: 'E-Book' },
  { value: 'Bundle', label: 'Bundle' },
  { value: 'Course', label: 'Course' },
  { value: 'Webinar', label: 'Webinar' },
  { value: 'Guidance', label: 'Guidance' },
  { value: 'Mentorship', label: 'Mentorship' },
  { value: 'Offline Batch', label: 'Offline Batch' },
];

export default function AdminOrdersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [webinarOrders, setWebinarOrders] = useState([]);
  const [guidanceOrders, setGuidanceOrders] = useState([]);
  const [mentorshipOrders, setMentorshipOrders] = useState([]);
  const [courseOrders, setCourseOrders] = useState([]);
  const [offlineBatchOrders, setOfflineBatchOrders] = useState([]);
  const [bundleOrders, setBundleOrders] = useState([]);
  const [expandedBundles, setExpandedBundles] = useState(new Set());
  const fetchOrdersRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (!isAdmin || authLoading) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search query changes
    if (fetchOrdersRef.current) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchOrders();
      }, 300);
    } else {
      // First load - fetch immediately
      fetchOrdersRef.current = true;
      fetchOrders();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, searchQuery, authLoading]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAllOrders({
        search: searchQuery || undefined,
      });

      if (response.success) {
        setOrders(response.data.orders || []);
        setWebinarOrders(response.data.webinarOrders || []);
        setGuidanceOrders(response.data.guidanceOrders || []);
        setMentorshipOrders(response.data.mentorshipOrders || []);
        setCourseOrders(response.data.courseOrders || []);
        setOfflineBatchOrders(response.data.offlineBatchOrders || []);
        setBundleOrders(response.data.bundleOrders || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      COMPLETED: 'default',
      PENDING: 'secondary',
      FAILED: 'destructive',
      REFUNDED: 'outline',
      PAID: 'default',
      FREE: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  // Toggle bundle expansion
  const toggleBundle = (bundleId) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(bundleId)) {
      newExpanded.delete(bundleId);
    } else {
      newExpanded.add(bundleId);
    }
    setExpandedBundles(newExpanded);
  };

  // Get order IDs that are already handled by specific order arrays
  const handledOrderIds = new Set([
    ...offlineBatchOrders.map(o => o.orderId).filter(Boolean),
    ...bundleOrders.map(o => o.orderId).filter(Boolean),
    ...webinarOrders.map(o => o.paymentId).filter(Boolean),
    ...guidanceOrders.map(o => o.orderId).filter(Boolean),
    ...mentorshipOrders.map(o => o.paymentId).filter(Boolean),
    ...courseOrders.map(o => o.orderId).filter(Boolean),
  ]);

  // Map order types correctly
  const getOrderTypeLabel = (orderType) => {
    switch (orderType) {
      case 'EBOOK':
        return 'E-Book';
      case 'BUNDLE':
        return 'Bundle';
      case 'OFFLINE_BATCH':
        return 'Offline Batch';
      case 'COURSE':
        return 'Course';
      case 'WEBINAR':
        return 'Webinar';
      case 'GUIDANCE':
        return 'Guidance';
      default:
        return 'E-Book'; // Default fallback
    }
  };

  // Combine all orders - filter out orders already handled by specific arrays
  const allOrders = [
    // Only include orders that are EBOOK type or not handled by other arrays
    ...orders
      .filter(o => {
        // Exclude orders that are already in other arrays
        if (handledOrderIds.has(o.id)) return false;
        // Only include EBOOK orders in the main orders array
        return o.orderType === 'EBOOK';
      })
      .map(o => ({ ...o, type: getOrderTypeLabel(o.orderType) })),
    ...webinarOrders.map(o => ({ ...o, type: 'Webinar', orderNumber: `WEB-${o.id.slice(0, 8).toUpperCase()}` })),
    ...guidanceOrders.map(o => ({ ...o, type: 'Guidance', orderNumber: `GUID-${o.id.slice(0, 8).toUpperCase()}` })),
    ...mentorshipOrders.map(o => ({ ...o, type: 'Mentorship', orderNumber: `MENT-${o.id.slice(0, 8).toUpperCase()}` })),
    ...courseOrders.map(o => ({ ...o, type: 'Course', orderNumber: `COURSE-${o.id.slice(0, 8).toUpperCase()}` })),
    ...offlineBatchOrders.map(o => ({
      ...o,
      type: 'Offline Batch',
      orderNumber: o.order?.orderNumber || o.orderId ? `BATCH-${o.id.slice(0, 8).toUpperCase()}` : `BATCH-${o.id.slice(0, 8).toUpperCase()}`,
      finalAmount: o.amountPaid || 0,
      status: o.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
      user: o.user,
      batch: o.batch,
      couponCode: o.order?.couponCode || o.couponCode,
      discountAmount: o.order?.discountAmount || o.discountAmount || 0,
      totalAmount: o.order?.totalAmount || o.totalAmount || o.amountPaid || 0,
      createdAt: o.createdAt,
    })),
    ...bundleOrders.map(o => ({
      ...o,
      type: 'Bundle',
      orderNumber: o.order?.orderNumber || (o.orderId ? `BND-${o.id.slice(0, 8).toUpperCase()}` : `BND-${o.id.slice(0, 8).toUpperCase()}`),
      finalAmount: o.amountPaid,
      status: o.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
      isBundle: true,
      createdAt: o.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Filter by type
  const filteredOrders = typeFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.type === typeFilter);

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    // CSV headers
    const headers = ['Order #', 'User Name', 'User Email', 'User Phone', 'Type', 'Amount', 'Status', 'Date'];

    // CSV rows
    const rows = filteredOrders.map(order => [
      order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`,
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.user?.phone || order.user?.mobile || 'N/A',
      order.type,
      order.finalAmount || order.amountPaid || order.totalAmount || 0,
      order.status || order.paymentStatus || 'N/A',
      new Date(order.createdAt).toLocaleDateString('en-IN'),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${typeFilter === 'all' ? 'all' : typeFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    toast.success(`Exported ${filteredOrders.length} orders to Excel`);
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="border-2">
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Manage all orders across the platform</p>
        </div>
        <Button onClick={exportToExcel} className="gap-2 bg-green-600 hover:bg-green-700">
          <FileSpreadsheet className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>
            {typeFilter === 'all' ? 'All Orders' : `${typeFilter} Orders`} ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No orders found</p>
              <p className="text-sm">Orders will appear here once customers make purchases</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedBundles.has(order.id);
                    const bundleCourses = order.isBundle && order.bundle?.courses ? order.bundle.courses : [];

                    return (
                      <>
                        <TableRow key={order.id} className={order.isBundle ? 'cursor-pointer hover:bg-muted/50' : ''}>
                          <TableCell className="font-medium">
                            {order.isBundle ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleBundle(order.id)}
                                  className="p-0.5 hover:bg-muted rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                <span>{order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}</span>
                              </div>
                            ) : (
                              order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.user?.name || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.type}</Badge>
                            {order.isBundle && bundleCourses.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({bundleCourses.length} courses)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-end gap-1.5">
                              {order.totalAmount && order.totalAmount > (order.finalAmount || order.amountPaid || 0) && (
                                <div className="text-xs text-muted-foreground">
                                  <span className="line-through">₹{order.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                  <span className="ml-2 text-green-600 font-semibold">
                                    Original
                                  </span>
                                </div>
                              )}
                              {order.couponCode && (
                                <div className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                                  <span className="text-muted-foreground">🎟️ </span>
                                  <span className="font-semibold text-brand-600 uppercase">{order.couponCode}</span>
                                </div>
                              )}
                              {order.discountAmount > 0 && (
                                <div className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded">
                                  <span className="text-green-600 font-bold">
                                    -₹{order.discountAmount.toFixed(2)}
                                  </span>
                                  <span className="text-muted-foreground ml-1">Discount</span>
                                </div>
                              )}
                              {order.finalAmount === 0 || order.amountPaid === 0 ? (
                                <span className="text-green-600 font-semibold text-sm">FREE</span>
                              ) : (
                                <span className="font-bold text-base">
                                  ₹{((order.finalAmount || order.amountPaid || order.totalAmount || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status || order.paymentStatus)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </TableCell>
                        </TableRow>
                        {/* Expanded Bundle Courses */}
                        {order.isBundle && isExpanded && bundleCourses.length > 0 && (
                          <TableRow key={`${order.id}-courses`} className="bg-muted/30">
                            <TableCell colSpan={6} className="py-3">
                              <div className="pl-8 space-y-2">
                                <div className="text-sm font-semibold mb-2 text-muted-foreground">
                                  Bundle: {order.bundle?.title || 'N/A'}
                                </div>
                                <div className="space-y-1.5">
                                  {bundleCourses.map((course, idx) => (
                                    <div key={course.id || idx} className="flex items-center gap-2 text-sm py-1">
                                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-muted-foreground">
                                        {idx + 1}. {course.title || 'N/A'}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        ₹{(course.salePrice || course.price || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
