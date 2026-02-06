'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hireFromUsAPI } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import DataExport from '@/components/admin/DataExport';

export default function AdminHireFromUsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await hireFromUsAPI.getAllAdmin(search ? { search } : {});
      if (res?.success && Array.isArray(res.data)) setList(res.data);
      else setList([]);
    } catch (e) {
      toast.error('Failed to fetch hire requests');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchList();
  }, [isAuthenticated, isAdmin]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchList();
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Hire From Us – Requests
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <DataExport
              data={list}
              columns={[
                { key: 'companyName', label: 'Company' },
                { key: 'contactName', label: 'Contact name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'hiringRequirements', label: 'Hiring requirements' },
                { key: 'source', label: 'Source' },
                { key: 'createdAt', label: 'Date' },
              ]}
              dateKey="createdAt"
              filename="hire-from-us-requests"
              disabled={loading}
            />
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Search company, name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-lg"
              />
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
            </form>
            <Button variant="outline" size="icon" onClick={fetchList} disabled={loading} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            All submissions from the Hire From Us page. Admin also receives an email for each new request.
          </p>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No hire requests yet.</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.companyName}</TableCell>
                      <TableCell>{row.contactName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone || '–'}</TableCell>
                      <TableCell className="max-w-[220px]">
                        {row.hiringRequirements ? (
                          <span className="block truncate text-sm" title={row.hiringRequirements}>
                            {row.hiringRequirements}
                          </span>
                        ) : (
                          '–'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.source}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(row.createdAt)}</TableCell>
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
