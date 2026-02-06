'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expertPracticeAPI } from '@/lib/api';
import { toast } from 'sonner';
import { CalendarCheck, RefreshCw } from 'lucide-react';
import DataExport from '@/components/admin/DataExport';

const STATUS_OPTIONS = ['PENDING', 'CONTACTED', 'CONVERTED', 'CANCELLED'];

export default function AdminExpertPracticeBookingsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await expertPracticeAPI.getBookingsAdmin();
      if (res?.success && Array.isArray(res.data)) setList(res.data);
      else setList([]);
    } catch (e) {
      toast.error('Failed to fetch bookings');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await expertPracticeAPI.updateBookingStatus(id, status);
      if (res?.success) {
        setList((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        toast.success('Status updated');
      } else toast.error(res?.message || 'Failed to update');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const filtered = statusFilter
    ? list.filter((r) => r.status === statusFilter)
    : list;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Expert Practice Bookings
          </CardTitle>
          <div className="flex items-center gap-2">
            <DataExport
              data={list}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'expertPractice.title', label: 'Practice option' },
                { key: 'message', label: 'Message' },
                { key: 'status', label: 'Status' },
                { key: 'createdAt', label: 'Date' },
              ]}
              dateKey="createdAt"
              statusKey="status"
              statusOptions={STATUS_OPTIONS}
              filename="expert-practice-bookings"
              disabled={loading}
            />
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {list.length === 0 ? 'No bookings yet.' : 'No bookings for this status.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Practice option</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone || '–'}</TableCell>
                    <TableCell>
                      {r.expertPractice?.title || '–'}
                      {r.expertPractice && (
                        <span className="text-xs text-muted-foreground block">
                          {r.expertPractice.isFree ? 'Free' : `₹${Number(r.expertPractice.price).toLocaleString('en-IN')}`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {r.message ? (
                        <span className="block truncate text-sm" title={r.message}>{r.message}</span>
                      ) : '–'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'PENDING' ? 'secondary' : r.status === 'CONVERTED' ? 'default' : 'outline'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
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
