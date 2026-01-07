'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Loader2, Search, FileSpreadsheet } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const USER_FILTERS = [
  { value: 'all', label: 'All Users' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'admin', label: 'Admins' },
  { value: 'user', label: 'Regular Users' },
];

export default function AdminUsersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page,
        limit: 50,
        search: search || undefined,
      });

      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationToggle = async (userId, currentStatus) => {
    try {
      setUpdating(userId);
      const response = await adminAPI.updateUserVerification(userId, !currentStatus);

      if (response.success) {
        setUsers(users.map(u => u.id === userId ? response.data.user : u));
        toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update verification status');
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'verified') return u.isVerified;
    if (filter === 'unverified') return !u.isVerified;
    if (filter === 'admin') return u.role === 'ADMIN';
    if (filter === 'user') return u.role === 'USER';
    return true;
  });

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    if (filteredUsers.length === 0) {
      toast.error('No users to export');
      return;
    }

    // CSV headers
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Verified', 'Active', 'Created At'];
    
    // CSV rows
    const rows = filteredUsers.map(u => [
      u.name || 'N/A',
      u.email || 'N/A',
      u.phone || u.mobile || 'N/A',
      u.role || 'USER',
      u.isVerified ? 'Yes' : 'No',
      u.isActive ? 'Yes' : 'No',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A',
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
    link.download = `users_${filter}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    
    toast.success(`Exported ${filteredUsers.length} users to Excel`);
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
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
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage and verify users</p>
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
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter users" />
          </SelectTrigger>
          <SelectContent>
            {USER_FILTERS.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {pagination.total} users
            {filter !== 'all' && ` (filtered: ${USER_FILTERS.find(f => f.value === filter)?.label})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Role</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {u.avatarUrl ? (
                                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                                  <Image
                                    src={u.avatarUrl}
                                    alt={u.name || 'User'}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{u.name || 'No Name'}</p>
                                {u.phone && (
                                  <p className="text-sm text-muted-foreground">{u.phone}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{u.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {u.isVerified ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm hidden sm:inline">Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm hidden sm:inline">Unverified</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={u.isVerified ? 'destructive' : 'default'}
                              size="sm"
                              onClick={() => handleVerificationToggle(u.id, u.isVerified)}
                              disabled={updating === u.id}
                              className={u.isVerified ? '' : 'bg-brand-600 hover:bg-brand-700'}
                            >
                              {updating === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : u.isVerified ? (
                                'Unverify'
                              ) : (
                                'Verify'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page || page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
