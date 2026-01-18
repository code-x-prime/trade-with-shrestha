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
import { CheckCircle2, XCircle, Loader2, Search, FileSpreadsheet, Mail, Trash2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, user: null });

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

  const openDeleteConfirm = (user) => {
    setDeleteConfirm({ open: true, user });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, user: null });
  };

  const handleDeleteUser = async () => {
    const userToDelete = deleteConfirm.user;
    if (!userToDelete) return;
    
    closeDeleteConfirm();

    try {
      setDeleting(userToDelete.id);
      const response = await adminAPI.deleteUser(userToDelete.id);

      if (response.success) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        toast.success('User deleted successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
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
                      <TableHead className="hidden md:table-cell">Login</TableHead>
                      <TableHead className="hidden md:table-cell">Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                            {u.authProvider === 'GOOGLE' ? (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Google</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-xs font-medium text-gray-500">Email</span>
                              </div>
                            )}
                          </TableCell>
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
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {u.isVerified ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-xs">Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-xs">Unverified</span>
                                  </div>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-center ${
                                    u.isActive
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  }`}
                                >
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={u.isVerified ? 'destructive' : 'default'}
                                  size="sm"
                                  onClick={() => handleVerificationToggle(u.id, u.isVerified)}
                                  disabled={updating === u.id || deleting === u.id}
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
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openDeleteConfirm(u)}
                                  disabled={updating === u.id || deleting === u.id}
                                >
                                  {deleting === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && closeDeleteConfirm()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">Delete User?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteConfirm.user?.name || deleteConfirm.user?.email}</span>?
              <br /><br />
              <span className="text-red-600 font-medium">⚠️ This action is permanent and will delete:</span>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>All orders and enrollments</li>
                <li>Course progress and certificates</li>
                <li>Reviews and subscriptions</li>
                <li>Profile image and data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
