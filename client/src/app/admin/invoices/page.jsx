'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderAPI, invoiceAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Settings, Search, ExternalLink, Plus } from 'lucide-react';
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

export default function AdminInvoicesPage() {
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
  const [manualInvoices, setManualInvoices] = useState([]);
  const [loadingManual, setLoadingManual] = useState(true);
  const fetchRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (!isAdmin || authLoading) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (fetchRef.current) {
      searchTimeoutRef.current = setTimeout(() => fetchOrders(), 300);
    } else {
      fetchRef.current = true;
      fetchOrders();
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [isAdmin, searchQuery, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    invoiceAPI.manual.list().then((res) => {
      if (res.success && res.data) setManualInvoices(Array.isArray(res.data) ? res.data : []);
    }).catch(() => setManualInvoices([])).finally(() => setLoadingManual(false));
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAllOrders({ search: searchQuery || undefined });
      if (res.success) {
        setOrders(res.data.orders || []);
        setWebinarOrders(res.data.webinarOrders || []);
        setGuidanceOrders(res.data.guidanceOrders || []);
        setMentorshipOrders(res.data.mentorshipOrders || []);
        setCourseOrders(res.data.courseOrders || []);
        setOfflineBatchOrders(res.data.offlineBatchOrders || []);
        setBundleOrders(res.data.bundleOrders || []);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeLabel = (orderType) => {
    const map = { EBOOK: 'E-Book', BUNDLE: 'Bundle', COURSE: 'Course', WEBINAR: 'Webinar', GUIDANCE: 'Guidance', OFFLINE_BATCH: 'Offline Batch' };
    return map[orderType] || 'E-Book';
  };

  const handledOrderIds = new Set([
    ...offlineBatchOrders.map((o) => o.orderId).filter(Boolean),
    ...bundleOrders.map((o) => o.orderId).filter(Boolean),
    ...webinarOrders.map((o) => o.paymentId).filter(Boolean),
    ...guidanceOrders.map((o) => o.paymentId).filter(Boolean),
    ...mentorshipOrders.map((o) => o.paymentId).filter(Boolean),
    ...courseOrders.map((o) => o.orderId).filter(Boolean),
  ]);

  const allOrders = [
    ...orders
      .filter((o) => !handledOrderIds.has(o.id) && o.orderType === 'EBOOK')
      .map((o) => ({ ...o, type: getOrderTypeLabel(o.orderType), invoiceOrderId: o.id })),
    ...webinarOrders.map((o) => ({
      ...o,
      type: 'Webinar',
      orderNumber: o.paymentId ? `WEB-${o.id.slice(0, 8).toUpperCase()}` : null,
      invoiceOrderId: o.paymentId,
      user: o.user,
      finalAmount: o.amountPaid,
      createdAt: o.createdAt,
    })),
    ...guidanceOrders.map((o) => ({
      ...o,
      type: 'Guidance',
      orderNumber: o.paymentId ? `GUID-${o.id.slice(0, 8).toUpperCase()}` : null,
      invoiceOrderId: o.paymentId,
      user: o.user,
      finalAmount: o.amountPaid,
      createdAt: o.createdAt,
    })),
    ...mentorshipOrders.map((o) => ({
      ...o,
      type: 'Mentorship',
      orderNumber: o.paymentId ? `MENT-${o.id.slice(0, 8).toUpperCase()}` : null,
      invoiceOrderId: o.paymentId,
      user: o.user,
      finalAmount: o.amountPaid,
      createdAt: o.createdAt,
    })),
    ...courseOrders.map((o) => ({
      ...o,
      type: 'Course',
      orderNumber: o.order?.orderNumber,
      invoiceOrderId: o.orderId,
      user: o.user,
      finalAmount: o.amountPaid ?? o.order?.finalAmount,
      createdAt: o.createdAt,
    })),
    ...offlineBatchOrders.map((o) => ({
      ...o,
      type: 'Offline Batch',
      orderNumber: o.order?.orderNumber,
      invoiceOrderId: o.orderId,
      user: o.user,
      finalAmount: o.amountPaid ?? o.order?.finalAmount,
      createdAt: o.createdAt,
    })),
    ...bundleOrders.map((o) => ({
      ...o,
      type: 'Bundle',
      orderNumber: o.order?.orderNumber,
      invoiceOrderId: o.orderId,
      user: o.user,
      finalAmount: o.amountPaid ?? o.order?.finalAmount,
      createdAt: o.createdAt,
    })),
  ]
    .filter((o) => o.invoiceOrderId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredOrders = typeFilter === 'all' ? allOrders : allOrders.filter((o) => o.type === typeFilter);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  if (!user || !isAdmin) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm">Order invoices and manual invoices for courses, ebooks, office work, services, and more</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/invoices/create-invoice">
            <Button className="gap-2 bg-brand-600 hover:bg-brand-700">
              <Plus className="h-4 w-4" />
              Create invoice
            </Button>
          </Link>
          <Link href="/admin/invoice-settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Invoice Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by order #, user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{typeFilter === 'all' ? 'All Orders' : typeFilter} ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders to show invoices for.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount (INR)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber || `#${order.id?.slice(0, 8)?.toUpperCase() || '-'}`}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.user?.name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{order.type}</Badge></TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(order.finalAmount ?? order.amountPaid ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/invoices/${order.invoiceOrderId}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Invoice
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual invoices ({manualInvoices.length})</CardTitle>
          <CardDescription>Invoices you create yourself — for courses, ebooks, office work, services, or anything else. Use Create invoice to add a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingManual ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : manualInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No manual invoices yet.{' '}
              <Link href="/admin/invoices/create-invoice" className="text-brand-600 hover:underline">Create your first one</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Bill to</TableHead>
                    <TableHead className="text-right">Total (₹)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{inv.billToName}</span>
                          {inv.billToEmail && <span className="text-xs text-muted-foreground">{inv.billToEmail}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(inv.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/invoices/manual/${inv.id}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
