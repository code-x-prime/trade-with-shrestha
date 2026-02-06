'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mockInterviewAPI } from '@/lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Edit, Trash2, Loader2, Calendar, Users, Video, Search, RefreshCw } from 'lucide-react';
import DataExport from '@/components/admin/DataExport';
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

const emptySlotForm = () => ({
  slotDate: '',
  startTime: '10:00 AM',
  endTime: '',
  meetingLink: '',
  price: '',
  currency: 'INR',
  isActive: true,
  unlimitedCapacity: true,
  maxBookings: '',
  sortOrder: 0,
});

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function AdminMockInterviewPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotForm, setSlotForm] = useState(emptySlotForm());
  const [savingSlot, setSavingSlot] = useState(false);
  const [deleteSlotDialog, setDeleteSlotDialog] = useState({ open: false, item: null });
  const [activeTab, setActiveTab] = useState('slots');
  const [bookingSearch, setBookingSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  const fetchSlots = async () => {
    if (!isAuthenticated || !isAdmin) return;
    setLoadingSlots(true);
    try {
      const res = await mockInterviewAPI.admin.getSlots();
      const data = res?.data ?? res;
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to fetch slots');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchBookings = async () => {
    if (!isAuthenticated || !isAdmin) return;
    setLoadingBookings(true);
    try {
      const res = await mockInterviewAPI.admin.getBookings();
      const data = res?.data ?? res;
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchSlots();
      fetchBookings();
    }
  }, [isAuthenticated, isAdmin]);

  const openCreateSlot = () => {
    setEditingSlotId(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSlotForm({
      ...emptySlotForm(),
      slotDate: tomorrow.toISOString().slice(0, 10),
    });
    setSlotDialogOpen(true);
  };

  const openEditSlot = (slot) => {
    setEditingSlotId(slot.id);
    const d = new Date(slot.slotDate);
    const localDate = d.toISOString().slice(0, 10);
    const unlimited = slot.maxBookings == null;
    setSlotForm({
      slotDate: localDate,
      startTime: slot.startTime || '10:00 AM',
      endTime: slot.endTime || '',
      meetingLink: slot.meetingLink || '',
      price: slot.price != null ? String(Math.round(slot.price / 100)) : '',
      currency: slot.currency || 'INR',
      isActive: slot.isActive !== false,
      unlimitedCapacity: unlimited,
      maxBookings: unlimited ? '' : String(slot.maxBookings),
      sortOrder: slot.sortOrder ?? 0,
    });
    setSlotDialogOpen(true);
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    setSavingSlot(true);
    try {
      const dateStr = slotForm.slotDate;
      let slotDate;
      if (dateStr) {
        slotDate = new Date(dateStr + 'T12:00:00').toISOString();
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(12, 0, 0, 0);
        slotDate = d.toISOString();
      }
      const payload = {
        slotDate,
        startTime: slotForm.startTime.trim() || '10:00 AM',
        endTime: slotForm.endTime.trim() || null,
        meetingLink: slotForm.meetingLink.trim() || null,
        price: Math.round(Number(slotForm.price) || 0) * 100,
        currency: slotForm.currency || 'INR',
        isActive: slotForm.isActive,
        maxBookings: slotForm.unlimitedCapacity ? null : (slotForm.maxBookings === '' ? null : Number(slotForm.maxBookings)),
        sortOrder: Number(slotForm.sortOrder) || 0,
      };
      if (editingSlotId) {
        await mockInterviewAPI.admin.updateSlot(editingSlotId, payload);
        toast.success('Slot updated');
      } else {
        await mockInterviewAPI.admin.createSlot(payload);
        toast.success('Slot created');
      }
      setSlotDialogOpen(false);
      fetchSlots();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteSlotDialog.item) return;
    try {
      await mockInterviewAPI.admin.deleteSlot(deleteSlotDialog.item.id);
      toast.success('Slot deleted');
      setDeleteSlotDialog({ open: false, item: null });
      fetchSlots();
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const handleBookingStatusChange = async (bookingId, status) => {
    try {
      await mockInterviewAPI.admin.updateBookingStatus(bookingId, status);
      toast.success('Status updated');
      fetchBookings();
    } catch (e) {
      toast.error(e?.message || 'Update failed');
    }
  };

  const formatSlotDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formatPrice = (paise, currency = 'INR') => {
    if (currency === 'INR') return `₹${(paise / 100).toLocaleString('en-IN')}`;
    return `${(paise / 100).toLocaleString()} ${currency}`;
  };

  const bookingSearchLower = bookingSearch.trim().toLowerCase();
  const filteredBookings = bookingSearchLower
    ? bookings.filter((b) => {
        const name = (b.name || '').toLowerCase();
        const email = (b.email || '').toLowerCase();
        const phone = (b.phone || '').toLowerCase();
        const slotStr = b.slot ? formatSlotDate(b.slot.slotDate).toLowerCase() + (b.slot.startTime || '').toLowerCase() : '';
        return name.includes(bookingSearchLower) || email.includes(bookingSearchLower) || phone.includes(bookingSearchLower) || slotStr.includes(bookingSearchLower);
      })
    : bookings;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mock Interview</h1>
          <p className="text-muted-foreground mt-1">
            Manage slots (date, time, Zoom link, price) and view/update bookings.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => { fetchSlots(); fetchBookings(); }}
          disabled={loadingSlots || loadingBookings}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${(loadingSlots || loadingBookings) ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="slots" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Slots
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bookings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slots">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interview slots</CardTitle>
              <Button onClick={openCreateSlot} className="bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4 mr-2" />
                Add slot
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No slots yet. Add a slot to allow users to book mock interviews.</p>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Zoom / Meet</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{formatSlotDate(s.slotDate)}</TableCell>
                          <TableCell>{s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}</TableCell>
                          <TableCell>{formatPrice(s.price, s.currency)}</TableCell>
                          <TableCell>
                            {s._count?.bookings ?? 0}
                            {s.maxBookings != null && ` / ${s.maxBookings}`}
                          </TableCell>
                          <TableCell>
                            {s.meetingLink ? (
                              <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm flex items-center gap-1">
                                <Video className="h-3 w-3" /> Join
                              </a>
                            ) : '–'}
                          </TableCell>
                          <TableCell>{s.isActive ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditSlot(s)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteSlotDialog({ open: true, item: s })} title="Delete">
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
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>All bookings</CardTitle>
                <p className="text-sm text-muted-foreground">Update status to Confirmed, Cancelled, or Completed. User gets an email when status changes.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DataExport
                  data={bookings}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'slot.slotDate', label: 'Slot date' },
                    { key: 'slot.startTime', label: 'Slot time' },
                    { key: 'message', label: 'Message' },
                    { key: 'status', label: 'Status' },
                    { key: 'createdAt', label: 'Booked at' },
                  ]}
                  dateKey="createdAt"
                  statusKey="status"
                  statusOptions={['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']}
                  filename="mock-interview-bookings"
                  disabled={loadingBookings}
                />
                {bookings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, phone, or slot"
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-56 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  {bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your search.'}
                </p>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slot</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email / Phone</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-40">Change status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div className="text-sm">
                              {b.slot && formatSlotDate(b.slot.slotDate)}
                              {b.slot && <span className="block text-muted-foreground">{b.slot.startTime}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">{b.email}</div>
                            <div className="text-muted-foreground text-xs">{b.phone}</div>
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground" title={b.message || ''}>
                            {b.message || '–'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={b.status === 'CONFIRMED' ? 'default' : b.status === 'COMPLETED' ? 'secondary' : b.status === 'CANCELLED' ? 'destructive' : 'outline'}>
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select value={b.status} onValueChange={(v) => handleBookingStatusChange(b.id, v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Slot Create / Edit Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlotId ? 'Edit slot' : 'Add slot'}</DialogTitle>
            <DialogDescription>
              Set date, time, Zoom/Meet link, and price. Use &quot;Unlimited capacity&quot; for no limit on bookings (infinite slots). Users see only active slots with future dates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSlotSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slotDate">Date (optional)</Label>
                <Input
                  id="slotDate"
                  type="date"
                  value={slotForm.slotDate}
                  onChange={(e) => setSlotForm((f) => ({ ...f, slotDate: e.target.value }))}
                  placeholder="Leave empty for default"
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm((f) => ({ ...f, startTime: e.target.value }))}
                  placeholder="10:00 AM"
                />
              </div>
              <div>
                <Label htmlFor="endTime">End time (optional)</Label>
                <Input
                  id="endTime"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm((f) => ({ ...f, endTime: e.target.value }))}
                  placeholder="11:00 AM"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹) (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={slotForm.price}
                  onChange={(e) => setSlotForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0 = Free"
                />
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="unlimitedCapacity"
                    checked={slotForm.unlimitedCapacity}
                    onChange={(e) => setSlotForm((f) => ({ ...f, unlimitedCapacity: e.target.checked, maxBookings: e.target.checked ? '' : f.maxBookings }))}
                    className="rounded border-border"
                  />
                  <Label htmlFor="unlimitedCapacity">Unlimited capacity (infinite slots)</Label>
                </div>
                {!slotForm.unlimitedCapacity && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="maxBookings" className="whitespace-nowrap">Max bookings</Label>
                    <Input
                      id="maxBookings"
                      type="number"
                      min={1}
                      value={slotForm.maxBookings}
                      onChange={(e) => setSlotForm((f) => ({ ...f, maxBookings: e.target.value }))}
                      placeholder="e.g. 10"
                      className="w-24"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={slotForm.sortOrder}
                  onChange={(e) => setSlotForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="meetingLink">Zoom / Google Meet link</Label>
              <Input
                id="meetingLink"
                type="url"
                value={slotForm.meetingLink}
                onChange={(e) => setSlotForm((f) => ({ ...f, meetingLink: e.target.value }))}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={slotForm.isActive}
                onChange={(e) => setSlotForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="isActive">Active (visible to users)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSlotDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingSlot} className="bg-brand-600 hover:bg-brand-700">
                {savingSlot ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingSlotId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteSlotDialog.open} onOpenChange={(open) => !open && setDeleteSlotDialog({ open: false, item: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the slot. Existing bookings for this slot will remain but the slot will no longer be listed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSlot} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
