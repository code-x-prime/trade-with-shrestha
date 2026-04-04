'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { codexPrimeAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Handshake, RefreshCw, Search } from 'lucide-react';

const months = [
  { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' },
  { value: '5', label: 'May' }, { value: '6', label: 'Jun' }, { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];

const yearOptions = ['2024', '2025', '2026'];
const statusOptions = ['ALL', 'NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];

const statusClassMap = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  CONTACTED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  CONVERTED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function AdminCodeXPrimePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });
  const [selectedLead, setSelectedLead] = useState(null);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filters, setFilters] = useState({
    month: 'all',
    year: 'all',
    status: 'ALL',
    search: '',
    page: 1,
    limit: 10,
  });
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await codexPrimeAPI.getStatsAdmin();
      if (res?.success) setStats(res.data || {});
    } catch {
      toast.error('Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.month !== 'all') params.month = filters.month;
      if (filters.year !== 'all') params.year = filters.year;
      if (filters.status !== 'ALL') params.status = filters.status;
      if (appliedSearch.trim()) params.search = appliedSearch.trim();

      const res = await codexPrimeAPI.getLeadsAdmin(params);
      if (res?.success) {
        setLeads(res.data?.leads || []);
        setMeta({
          total: res.data?.total || 0,
          page: res.data?.page || 1,
          totalPages: res.data?.totalPages || 1,
        });
      }
    } catch {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) router.push('/auth');
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchStats();
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchLeads();
  }, [filters.page, filters.month, filters.year, filters.status, appliedSearch, isAuthenticated, isAdmin]);

  const onSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(filters.search.trim());
    setFilters((s) => ({ ...s, page: 1 }));
  };

  const resetFilters = () => {
    setFilters((s) => ({ ...s, month: 'all', year: 'all', status: 'ALL', search: '', page: 1 }));
    setAppliedSearch('');
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await codexPrimeAPI.updateLeadStatus(id, status);
      if (res?.success) {
        toast.success('Status updated');
        setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
        fetchStats();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const showingText = useMemo(() => {
    if (!meta.total) return 'Showing 0 of 0 leads';
    const shown = Math.min(filters.page * filters.limit, meta.total);
    return `Showing ${shown} of ${meta.total} leads`;
  }, [meta.total, filters.page, filters.limit]);

  if (authLoading || !isAuthenticated || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="h-6 w-6" /> CodeXPrime Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin → CodeXPrime</p>
        </div>
        <Button variant="outline" onClick={() => { fetchLeads(); fetchStats(); }} disabled={loading || statsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-3xl font-bold mt-2">{statsLoading ? '...' : stats.total || 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">New Leads</p><p className="text-3xl font-bold mt-2">{statsLoading ? '...' : stats.new || 0}</p><Badge className="mt-3 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">NEW</Badge></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Contacted</p><p className="text-3xl font-bold mt-2">{statsLoading ? '...' : stats.contacted || 0}</p><Badge className="mt-3 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">CONTACTED</Badge></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Converted</p><p className="text-3xl font-bold mt-2">{statsLoading ? '...' : stats.converted || 0}</p><Badge className="mt-3 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">CONVERTED</Badge></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={filters.month} onValueChange={(v) => setFilters((s) => ({ ...s, month: v, page: 1 }))}>
              <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.year} onValueChange={(v) => setFilters((s) => ({ ...s, year: v, page: 1 }))}>
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters((s) => ({ ...s, status: v, page: 1 }))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <form onSubmit={onSearch} className="md:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={filters.search} onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))} placeholder="Search name, email, phone..." />
              </div>
              <Button type="submit" variant="outline">Search</Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>Reset Filters</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[210px]">Email</TableHead>
                  <TableHead className="min-w-[140px]">Phone</TableHead>
                  <TableHead className="min-w-[190px]">Interest</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : leads.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads found.</TableCell></TableRow>
                ) : leads.map((lead, idx) => (
                  <TableRow key={lead.id}>
                    <TableCell>{(meta.page - 1) * filters.limit + idx + 1}</TableCell>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="break-all">{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell className="max-w-[240px] truncate" title={lead.courseInterest || '—'}>{lead.courseInterest || '—'}</TableCell>
                    <TableCell>
                      <Badge className={statusClassMap[lead.status] || statusClassMap.CLOSED}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.filter((s) => s !== 'ALL').map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">{showingText}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setFilters((s) => ({ ...s, page: s.page - 1 }))}>Prev</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((s) => ({ ...s, page: s.page + 1 }))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedLead.name}</p>
              <p><strong>Email:</strong> {selectedLead.email}</p>
              <p><strong>Phone:</strong> {selectedLead.phone}</p>
              <p><strong>Interest:</strong> {selectedLead.courseInterest || '—'}</p>
              <p><strong>Status:</strong> {selectedLead.status}</p>
              <p><strong>Source:</strong> {selectedLead.source}</p>
              <p><strong>Date:</strong> {new Date(selectedLead.createdAt).toLocaleString('en-IN')}</p>
              <p><strong>Message:</strong></p>
              <div className="rounded-md border p-3 text-muted-foreground whitespace-pre-wrap">{selectedLead.message || '—'}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
