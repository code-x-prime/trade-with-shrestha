'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { guidanceAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Calendar,
  MoreVertical,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminGuidancePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [guidance, setGuidance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, guidance: null });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchGuidance();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchGuidance = async () => {
    try {
      setLoading(true);
      const response = await guidanceAPI.getGuidance({ limit: 100 });
      if (response.success) {
        setGuidance(response.data.guidance);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch guidance');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (guidanceItem) => {
    try {
      const newStatus = guidanceItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await guidanceAPI.toggleStatus(guidanceItem.id, newStatus);
      if (response.success) {
        toast.success(`Guidance ${newStatus.toLowerCase()} successfully`);
        fetchGuidance();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.guidance) return;

    try {
      const response = await guidanceAPI.deleteGuidance(deleteDialog.guidance.id);
      if (response.success) {
        toast.success('Guidance deleted successfully');
        setDeleteDialog({ open: false, guidance: null });
        fetchGuidance();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete guidance');
    }
  };

  const formatPrice = (price) => {
    return <span className="font-semibold">₹{price.toLocaleString('en-IN')}</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">1:1 Guidance</h1>
          <p className="text-muted-foreground mt-1">Manage guidance sessions and slots</p>
        </div>
        <Button
          onClick={() => router.push('/admin/guidance/create')}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Guidance
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Expert Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Booked Slots</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guidance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No guidance found
                </TableCell>
              </TableRow>
            ) : (
              guidance.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.expertName}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>{item.durationMinutes} min</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {item._count?.orders || 0} booked / {item._count?.slots || 0} total slots
                      </div>
                      {item.slots && item.slots.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Next: {new Date(item.slots[0].date).toLocaleDateString()} {item.slots[0].startTime}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.status === 'ACTIVE' ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                          {item.status === 'ACTIVE' ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/guidance/${item.id}/slots`)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Manage Slots
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/guidance/${item.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {item.googleMeetLink && (
                          <DropdownMenuItem onClick={() => {
                            window.open(item.googleMeetLink, '_blank');
                          }}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Join Meeting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, guidance: item })}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, guidance: deleteDialog.guidance })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guidance
              &quot;{deleteDialog.guidance?.title}&quot;.
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

