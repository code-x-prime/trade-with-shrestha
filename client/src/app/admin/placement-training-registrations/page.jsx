'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { placementTrainingAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DataExport from '@/components/admin/DataExport';
import { RefreshCw, Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPlacementTrainingRegistrationsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await placementTrainingAPI.getAllAdmin(search ? { search } : {});
      if (res?.success && Array.isArray(res.data)) setList(res.data);
      else setList([]);
    } catch {
      toast.error('Failed to fetch registrations');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) router.push('/auth');
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  if (authLoading) return null;
  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Placement Training – Registrations
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <DataExport
              data={list}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'countryCode', label: 'Country code' },
                { key: 'whatsappNumber', label: 'WhatsApp' },
                { key: 'course', label: 'Course' },
                { key: 'notes', label: 'Notes' },
                { key: 'isVerified', label: 'Verified' },
                { key: 'source', label: 'Source' },
                { key: 'createdAt', label: 'Date' },
              ]}
              dateKey="createdAt"
              statusKey="isVerified"
              statusOptions={[]}
              filename="placement-training-registrations"
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, WhatsApp…"
                className="w-56 rounded-lg"
              />
              <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
                Search
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={fetchList} disabled={loading} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No registrations yet.</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{r.countryCode} {r.whatsappNumber}</TableCell>
                      <TableCell>{r.course}</TableCell>
                      <TableCell>
                        <Badge variant={r.isVerified ? 'default' : 'secondary'}>
                          {r.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(r.createdAt)}</TableCell>
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

