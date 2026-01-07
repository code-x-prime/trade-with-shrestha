'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { indicatorAPI } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Edit, Trash2, Plus, Loader2, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function AdminIndicatorsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, indicatorId: null, indicatorName: null });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchIndicators();
    }
  }, [user, isAdmin]);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const response = await indicatorAPI.getIndicators({ limit: 100 });
      if (response.success) {
        setIndicators(response.data.indicators);
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
      toast.error('Failed to fetch indicators');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      setToggling(id);
      const response = await indicatorAPI.togglePublish(id, !currentStatus);
      if (response.success) {
        setIndicators(indicators.map(indicator =>
          indicator.id === id ? response.data.indicator : indicator
        ));
        toast.success(`Indicator ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update publish status');
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (indicator) => {
    setDeleteDialog({ open: true, indicatorId: indicator.id, indicatorName: indicator.name });
  };

  const handleDelete = async () => {
    if (!deleteDialog.indicatorId) return;

    try {
      setDeleting(deleteDialog.indicatorId);
      const response = await indicatorAPI.deleteIndicator(deleteDialog.indicatorId);
      if (response.success) {
        setIndicators(indicators.filter(indicator => indicator.id !== deleteDialog.indicatorId));
        toast.success('Indicator deleted successfully');
        setDeleteDialog({ open: false, indicatorId: null, indicatorName: null });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete indicator');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Indicators</h1>
          <p className="text-muted-foreground mt-1">Manage trading indicators and subscriptions</p>
        </div>
        <Button asChild>
          <Link href="/admin/indicators/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Indicator
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Indicators</CardTitle>
          <CardDescription>Manage indicators and their subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>

                  <TableHead>Status</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No indicators found. Create your first indicator!
                    </TableCell>
                  </TableRow>
                ) : (
                  indicators.map((indicator) => (
                    <TableRow key={indicator.id}>
                      <TableCell>
                        {indicator.imageUrl ? (
                          <Image
                            src={indicator.imageUrl}
                            alt={indicator.name}
                            width={50}
                            height={50}
                            className="rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-[50px] h-[50px] bg-muted rounded flex items-center justify-center">
                            <MoreVertical className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{indicator.name}</div>
                          <div className="text-sm text-muted-foreground">{indicator.slug}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={toggling === indicator.id}
                              className="h-8"
                            >
                              {toggling === indicator.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : indicator.isPublished ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Unpublished</Badge>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(indicator.id, indicator.isPublished)}
                              disabled={toggling === indicator.id}
                              className={indicator.isPublished ? 'text-red-600' : 'text-green-600'}
                            >
                              {indicator.isPublished ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{indicator.purchaseCount || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/indicators/${indicator.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(indicator)}
                            disabled={deleting === indicator.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deleting === indicator.id ? (
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, indicatorId: deleteDialog.indicatorId, indicatorName: deleteDialog.indicatorName })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the indicator &quot;{deleteDialog.indicatorName}&quot; and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

