'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mentorshipAPI } from '@/lib/api';
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
  Users,
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
import Image from 'next/image';

export default function AdminMentorshipPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [mentorship, setMentorship] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mentorship: null });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchMentorship();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchMentorship = async () => {
    try {
      setLoading(true);
      const response = await mentorshipAPI.getMentorship({ limit: 100 });
      if (response.success) {
        setMentorship(response.data.mentorship);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch mentorship programs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (mentorshipItem) => {
    try {
      const newStatus = mentorshipItem.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
      const response = await mentorshipAPI.togglePublish(mentorshipItem.id, newStatus);
      if (response.success) {
        toast.success(`Mentorship ${newStatus.toLowerCase()} successfully`);
        fetchMentorship();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.mentorship) return;

    try {
      const response = await mentorshipAPI.deleteMentorship(deleteDialog.mentorship.id);
      if (response.success) {
        toast.success('Mentorship program deleted successfully');
        setDeleteDialog({ open: false, mentorship: null });
        fetchMentorship();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete mentorship program');
    }
  };

  const formatPrice = (price) => {
    return <span className="font-semibold">₹{price.toLocaleString('en-IN')}</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <h1 className="text-3xl font-bold">Live Mentorship Programs</h1>
          <p className="text-muted-foreground mt-1">Manage mentorship programs and sessions</p>
        </div>
        <Button
          onClick={() => router.push('/admin/mentorship/create')}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Mentorship
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mentorship.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No mentorship programs found
                </TableCell>
              </TableRow>
            ) : (
              mentorship.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.coverImageUrl ? (
                      <div className="w-16 h-20 relative rounded-md overflow-hidden border">
                        <Image
                          src={item.coverImageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-20 rounded-md border bg-muted flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.instructorName}</TableCell>
                  <TableCell>
                    {item.isFree ? (
                      <Badge className="bg-green-500">Free</Badge>
                    ) : (
                      formatPrice(item.salePrice || item.price)
                    )}
                  </TableCell>
                  <TableCell>{formatDate(item.startDate)}</TableCell>
                  <TableCell>{item.totalSessions}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {item._count?.enrollments || 0} enrolled
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.status === 'PUBLISHED' ? (
                      <Badge className="bg-green-500">Published</Badge>
                    ) : item.status === 'DRAFT' ? (
                      <Badge variant="outline">Draft</Badge>
                    ) : (
                      <Badge variant="outline">Unpublished</Badge>
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
                          {item.status === 'PUBLISHED' ? (
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
                        <DropdownMenuItem onClick={() => router.push(`/admin/mentorship/${item.id}/sessions`)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Manage Sessions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/mentorship/${item.id}/edit`)}>
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
                          onClick={() => setDeleteDialog({ open: true, mentorship: item })}
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

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, mentorship: deleteDialog.mentorship })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the mentorship program
              &quot;{deleteDialog.mentorship?.title}&quot;.
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

