'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { webinarAPI } from '@/lib/api';
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
  Users,
  MoreVertical
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

export default function AdminWebinarsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, webinar: null });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchWebinars();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const response = await webinarAPI.getWebinars({ limit: 100 });
      if (response.success) {
        setWebinars(response.data.webinars);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch webinars');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (webinar) => {
    try {
      const response = await webinarAPI.togglePublish(webinar.id, !webinar.isPublished);
      if (response.success) {
        toast.success(
          response.data.webinar.isPublished
            ? 'Webinar published successfully'
            : 'Webinar unpublished successfully'
        );
        fetchWebinars();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.webinar) return;

    try {
      const response = await webinarAPI.deleteWebinar(deleteDialog.webinar.id);
      if (response.success) {
        toast.success('Webinar deleted successfully');
        setDeleteDialog({ open: false, webinar: null });
        fetchWebinars();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete webinar');
    }
  };

  const formatPrice = (price, salePrice) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground line-through text-sm">
            ₹{price.toLocaleString('en-IN')}
          </span>
          <span className="font-semibold">₹{salePrice.toLocaleString('en-IN')}</span>
        </div>
      );
    }
    return <span className="font-semibold">₹{price.toLocaleString('en-IN')}</span>;
  };

  const formatDateTime = (date, time) => {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${time || ''}`;
  };

  const getWebinarStatus = (webinar) => {
    if (!webinar.startDate) return { status: 'Unknown', color: 'gray' };

    const now = new Date();
    const startDate = new Date(webinar.startDate);
    const durationMinutes = webinar.duration || 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    if (now > endDate) {
      return { status: 'Ended', color: 'gray' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'Live', color: 'green' };
    } else {
      return { status: 'Upcoming', color: 'blue' };
    }
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
          <h1 className="text-3xl font-bold">Webinars</h1>
          <p className="text-muted-foreground mt-1">Manage all webinars</p>
        </div>
        <Button
          onClick={() => router.push('/admin/webinars/create')}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Webinar
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Is Free</TableHead>
              <TableHead>Is Published</TableHead>
              <TableHead>Start Date & Time</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webinars.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No webinars found
                </TableCell>
              </TableRow>
            ) : (
              webinars.map((webinar) => {
                const statusInfo = getWebinarStatus(webinar);
                return (
                  <TableRow key={webinar.id}>
                    <TableCell className="font-medium">{webinar.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{webinar.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {webinar.isFree ? (
                        <Badge className="bg-green-500">FREE</Badge>
                      ) : (
                        formatPrice(webinar.price, webinar.salePrice)
                      )}
                    </TableCell>
                    <TableCell>
                      {webinar.isFree ? (
                        <Badge className="bg-green-500">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {webinar.isPublished ? (
                        <Badge className="bg-blue-500">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(webinar.startDate, webinar.startTime)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {webinar._count?.orders || 0} enrolled
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        statusInfo.color === 'green' ? 'bg-green-500' :
                          statusInfo.color === 'blue' ? 'bg-blue-500' :
                            'bg-gray-500'
                      }>
                        {statusInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePublish(webinar)}>
                            {webinar.isPublished ? (
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
                          <DropdownMenuItem onClick={() => router.push(`/admin/webinars/${webinar.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {webinar.googleMeetLink && (
                            <DropdownMenuItem onClick={() => {
                              const meetLink = webinar.googleMeetLink;
                              if (meetLink) {
                                window.open(meetLink, '_blank');
                              }
                            }}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Join Meeting
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog({ open: true, webinar })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, webinar: deleteDialog.webinar })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the webinar
              &quot;{deleteDialog.webinar?.title}&quot;.
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

