'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { mentorshipAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Loader2, Edit, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ManageSessionsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mentorship, setMentorship] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, session: null });
  const [sessionForm, setSessionForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    order: '',
  });

  useEffect(() => {
    if (id && isAdmin) {
      fetchMentorship();
      fetchSessions();
    }
  }, [id, isAdmin]);

  const fetchMentorship = async () => {
    try {
      setFetching(true);
      const response = await mentorshipAPI.getMentorshipById(id);
      if (response.success) {
        setMentorship(response.data.mentorship);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch mentorship program');
      router.push('/admin/mentorship');
    } finally {
      setFetching(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await mentorshipAPI.getSessions(id);
      if (response.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch sessions');
    }
  };

  const handleAddSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime || !sessionForm.order) {
      toast.error('Please fill all fields');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      const response = await mentorshipAPI.createSession(id, {
        title: sessionForm.title,
        sessionDate: sessionForm.date,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        order: parseInt(sessionForm.order),
      });
      if (response.success) {
        toast.success('Session created successfully');
        setShowAddDialog(false);
        setSessionForm({ title: '', date: '', startTime: '', endTime: '', order: '' });
        await fetchSessions();
      }
    } catch (error) {
      console.error('Create session error:', error);
      if (error.message?.includes('Admin access required') || error.message?.includes('403')) {
        toast.error('Admin access required. Please log in again.');
        router.push('/auth');
      } else {
        toast.error(error.message || 'Failed to create session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = async () => {
    if (!editingSession || !sessionForm.title || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime || !sessionForm.order) {
      toast.error('Please fill all fields');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      const response = await mentorshipAPI.updateSession(editingSession.id, {
        title: sessionForm.title,
        sessionDate: sessionForm.date,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        order: parseInt(sessionForm.order),
      });
      if (response.success) {
        toast.success('Session updated successfully');
        setEditingSession(null);
        setSessionForm({ title: '', date: '', startTime: '', endTime: '', order: '' });
        await fetchSessions();
      }
    } catch (error) {
      console.error('Update session error:', error);
      if (error.message?.includes('Admin access required') || error.message?.includes('403')) {
        toast.error('Admin access required. Please log in again.');
        router.push('/auth');
      } else {
        toast.error(error.message || 'Failed to update session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.session) return;

    try {
      setLoading(true);
      const response = await mentorshipAPI.deleteSession(deleteDialog.session.id);
      if (response.success) {
        toast.success('Session deleted successfully');
        setDeleteDialog({ open: false, session: null });
        await fetchSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (session) => {
    const sessionDate = new Date(session.sessionDate || session.date);
    const dateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
    setEditingSession(session);
    setSessionForm({
      title: session.title || '',
      date: dateStr,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      order: session.order?.toString() || '',
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/mentorship">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Manage Sessions</h1>
          <p className="text-muted-foreground mt-1">
            {mentorship?.title || 'Loading...'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sessions</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Session</DialogTitle>
                  <DialogDescription>
                    Create a new session for this mentorship program
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Session Title *</Label>
                    <Input
                      id="title"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                      placeholder="e.g., Introduction to Trading"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={sessionForm.startTime}
                        onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={sessionForm.endTime}
                        onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="order">Order *</Label>
                    <Input
                      id="order"
                      type="number"
                      min="1"
                      value={sessionForm.order}
                      onChange={(e) => setSessionForm({ ...sessionForm, order: e.target.value })}
                      placeholder="Session order (1, 2, 3...)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSession} disabled={loading} className="bg-brand-600 hover:bg-brand-700">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sessions created yet. Add your first session to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.order}</TableCell>
                    <TableCell>{session.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(session.sessionDate || session.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(session)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, session })}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update session details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Session Title *</Label>
                <Input
                  id="edit-title"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Trading"
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startTime">Start Time *</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endTime">End Time *</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-order">Order *</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min="1"
                  value={sessionForm.order}
                  onChange={(e) => setSessionForm({ ...sessionForm, order: e.target.value })}
                  placeholder="Session order (1, 2, 3...)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSession(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSession} disabled={loading} className="bg-brand-600 hover:bg-brand-700">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, session: deleteDialog.session })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session
              &quot;{deleteDialog.session?.title}&quot;.
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
