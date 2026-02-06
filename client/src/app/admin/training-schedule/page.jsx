'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trainingScheduleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, Calendar, RefreshCw } from 'lucide-react';
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

const TRAINING_TYPES = [
  { value: 'e_Learning', label: 'e_Learning' },
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Online', label: 'Online' },
];

const emptyForm = () => ({
  title: '',
  topic: '',
  scheduledAt: '',
  durationMinutes: 60,
  description: '',
  registrationUrl: '',
  meetLink: '',
  whatsappLink: '',
  trainingType: '',
  isActive: true,
  sortOrder: 0,
});

export default function AdminTrainingSchedulePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  const fetchSchedules = async () => {
    if (!isAuthenticated || !isAdmin) return;
    setLoading(true);
    try {
      const res = await trainingScheduleAPI.getAllAdmin();
      const data = res?.data ?? res;
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to fetch training schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchSchedules();
  }, [isAuthenticated, isAdmin]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    const scheduledAtVal = item.scheduledAt
      ? (() => {
        const d = new Date(item.scheduledAt);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
      })()
      : '';
    setForm({
      title: item.title || '',
      topic: item.topic || '',
      scheduledAt: scheduledAtVal,
      durationMinutes: item.durationMinutes ?? 60,
      description: item.description || '',
      registrationUrl: item.registrationUrl || '',
      meetLink: item.meetLink || '',
      whatsappLink: item.whatsappLink || '',
      trainingType: item.trainingType || '',
      isActive: item.isActive !== false,
      sortOrder: item.sortOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        topic: form.topic.trim() || null,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        durationMinutes: Number(form.durationMinutes) || 60,
        description: form.description.trim() || null,
        registrationUrl: form.registrationUrl.trim() || null,
        meetLink: form.meetLink.trim() || null,
        whatsappLink: form.whatsappLink.trim() || null,
        trainingType: form.trainingType || null,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingId) {
        const res = await trainingScheduleAPI.update(editingId, payload);
        if (res?.success ?? res?.data) {
          toast.success('Schedule updated');
          setDialogOpen(false);
          fetchSchedules();
        } else toast.error(res?.message || 'Update failed');
      } else {
        const res = await trainingScheduleAPI.create(payload);
        if (res?.success ?? res?.data) {
          toast.success('Schedule created');
          setDialogOpen(false);
          fetchSchedules();
        } else toast.error(res?.message || 'Create failed');
      }
    } catch (err) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await trainingScheduleAPI.delete(deleteDialog.item.id);
      toast.success('Schedule deleted');
      setDeleteDialog({ open: false, item: null });
      fetchSchedules();
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Training Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Manage demo sessions: Zoom/Google Meet & WhatsApp links. Students see these on the Training Schedule page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchSchedules} disabled={loading} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No schedules yet. Add one to show demos with Zoom/Meet and WhatsApp links.</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Zoom/Meet</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.title}</div>
                        {s.topic && <Badge variant="secondary" className="mt-1">{s.topic}</Badge>}
                      </TableCell>
                      <TableCell>{s.trainingType || '–'}</TableCell>
                      <TableCell>{s.scheduledAt ? formatDate(s.scheduledAt) : <span className="text-muted-foreground">No date</span>}</TableCell>
                      <TableCell>{s.scheduledAt ? formatTime(s.scheduledAt) : <span className="text-muted-foreground">Contact for schedule</span>}</TableCell>
                      <TableCell>
                        {s.meetLink ? (
                          <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm">
                            Join
                          </a>
                        ) : '–'}
                      </TableCell>
                      <TableCell>
                        {s.whatsappLink ? (
                          <a href={s.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                            Join
                          </a>
                        ) : '–'}
                      </TableCell>
                      <TableCell>{s.isActive ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, item: s })} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit schedule' : 'Add schedule'}</DialogTitle>
            <DialogDescription>
              Set Zoom or Google Meet link for joining the demo, and WhatsApp group link for updates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Course / Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. React JS, Java Fullstack"
                  required
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic (optional)</Label>
                <Input
                  id="topic"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. Python, Data Analytics"
                />
              </div>
              <div>
                <Label>Training type</Label>
                <Select value={form.trainingType || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, trainingType: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">–</SelectItem>
                    {TRAINING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scheduledAt">Start date & time (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to show as &quot;Contact for schedule&quot; — entry stays visible until you set a date.</p>
              </div>
              <div>
                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="meetLink">Zoom / Google Meet link</Label>
              <Input
                id="meetLink"
                type="url"
                value={form.meetLink}
                onChange={(e) => setForm((f) => ({ ...f, meetLink: e.target.value }))}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
            </div>
            <div>
              <Label htmlFor="whatsappLink">WhatsApp group link (for more updates)</Label>
              <Input
                id="whatsappLink"
                type="url"
                value={form.whatsappLink}
                onChange={(e) => setForm((f) => ({ ...f, whatsappLink: e.target.value }))}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div>
              <Label htmlFor="registrationUrl">Other registration / form link (optional)</Label>
              <Input
                id="registrationUrl"
                type="url"
                value={form.registrationUrl}
                onChange={(e) => setForm((f) => ({ ...f, registrationUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active (visible on public page)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteDialog.item?.title}&quot; from the training schedule. Students will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
