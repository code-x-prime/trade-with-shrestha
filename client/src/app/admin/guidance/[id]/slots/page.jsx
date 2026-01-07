'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { guidanceAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Loader2, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function ManageSlotsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [guidance, setGuidance] = useState(null);
  const [slots, setSlots] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, slot: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (id && isAdmin) {
      fetchGuidance();
      fetchSlots();
    }
  }, [id, isAdmin]);

  const fetchGuidance = async () => {
    try {
      const response = await guidanceAPI.getGuidanceById(id);
      if (response.success) {
        setGuidance(response.data.guidance);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch guidance');
      router.push('/admin/guidance');
    } finally {
      setFetching(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await guidanceAPI.getSlots(id);
      if (response.success) {
        setSlots(response.data.slots);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch slots');
    }
  };

  const handleAddSlot = async () => {
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await guidanceAPI.createSlot(id, slotForm);
      if (response.success) {
        toast.success('Slot created successfully');
        setShowAddDialog(false);
        const addedDate = new Date(slotForm.date);
        setSlotForm({ date: '', startTime: '', endTime: '' });
        await fetchSlots();
        // Refresh selected date if it matches the added slot date
        if (selectedDate && selectedDate.toISOString().split('T')[0] === slotForm.date) {
          handleDateClick(selectedDate);
        } else {
          handleDateClick(addedDate);
          setSelectedDate(addedDate);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create slot');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteDialog.slot) return;

    const deletedDate = new Date(deleteDialog.slot.date);
    try {
      setLoading(true);
      const response = await guidanceAPI.deleteSlot(deleteDialog.slot.id);
      if (response.success) {
        toast.success('Slot deleted successfully');
        setDeleteDialog({ open: false, slot: null });
        await fetchSlots();
        // Refresh selected date slots if the deleted slot was from the selected date
        if (selectedDate && selectedDate.toISOString().split('T')[0] === deletedDate.toISOString().split('T')[0]) {
          handleDateClick(selectedDate);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete slot');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlotStatus = async (slotId, status) => {
    try {
      setLoading(true);
      const response = await guidanceAPI.updateSlotStatus(slotId, status);
      if (response.success) {
        toast.success('Slot status updated');
        await fetchSlots();
        // Refresh selected date slots if a date is selected
        if (selectedDate) {
          handleDateClick(selectedDate);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update slot status');
    } finally {
      setLoading(false);
    }
  };


  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.push('/auth');
    return null;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateOnly = (dateStr) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getSlotsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(slot => formatDateOnly(slot.date) === dateStr);
  };

  const getDateStatus = (date) => {
    if (!date) return null;
    const dateSlots = getSlotsForDate(date);
    if (dateSlots.length === 0) return 'no-slots';
    
    const available = dateSlots.filter(s => s.status === 'AVAILABLE').length;
    const booked = dateSlots.filter(s => s.status === 'BOOKED').length;
    const closed = dateSlots.filter(s => s.status === 'CLOSED').length;
    
    if (booked > 0) return 'has-booked';
    if (closed === dateSlots.length) return 'all-closed';
    if (available > 0) return 'has-available';
    return 'mixed';
  };

  const handleDateClick = async (date) => {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    try {
      const response = await guidanceAPI.getSlots(id, { date: dateStr });
      if (response.success) {
        setSelectedDateSlots(response.data.slots);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch slots');
    }
  };

  const handleGenerateMonthSlots = async () => {
    if (!guidance) return;
    
    const confirm = window.confirm(
      `This will generate slots for the entire month (${currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}). ` +
      `Default time slots will be created for each day. Continue?`
    );
    
    if (!confirm) return;

    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Default time slots (can be customized)
      const defaultTimeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
      ];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let created = 0;
      let skipped = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date < today) continue; // Skip past dates

        const dateStr = date.toISOString().split('T')[0];
        
        for (const timeSlot of defaultTimeSlots) {
          try {
            await guidanceAPI.createSlot(id, {
              date: dateStr,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
            });
            created++;
          } catch (error) {
            if (error.message?.includes('already exists')) {
              skipped++;
            } else {
              throw error;
            }
          }
        }
      }

      toast.success(`Created ${created} slot(s), skipped ${skipped} duplicate(s)`);
      fetchSlots();
    } catch (error) {
      toast.error(error.message || 'Failed to generate slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDateSlots = async (date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    const dateSlots = getSlotsForDate(date).filter(slot => slot.status !== 'BOOKED');
    
    if (dateSlots.length === 0) {
      toast.info('No slots available to close for this date');
      return;
    }

    try {
      setLoading(true);
      const closePromises = dateSlots.map(slot => 
        guidanceAPI.updateSlotStatus(slot.id, 'CLOSED')
      );
      await Promise.all(closePromises);
      toast.success(`Closed ${dateSlots.length} slot(s) for ${formatDate(dateStr)}`);
      fetchSlots();
      handleDateClick(date); // Refresh selected date slots
    } catch (error) {
      toast.error(error.message || 'Failed to close slots');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDateSlots = async (date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    const dateSlots = getSlotsForDate(date).filter(slot => slot.status === 'CLOSED' && !slot.order);
    
    if (dateSlots.length === 0) {
      toast.info('No closed slots available to open for this date');
      return;
    }

    try {
      setLoading(true);
      const openPromises = dateSlots.map(slot => 
        guidanceAPI.updateSlotStatus(slot.id, 'AVAILABLE')
      );
      await Promise.all(openPromises);
      toast.success(`Opened ${dateSlots.length} slot(s) for ${formatDate(dateStr)}`);
      fetchSlots();
      handleDateClick(date); // Refresh selected date slots
    } catch (error) {
      toast.error(error.message || 'Failed to open slots');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/guidance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Manage Slots</h1>
          <p className="text-muted-foreground mt-1">{guidance?.title}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Duration: {guidance?.durationMinutes} minutes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateMonthSlots}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Month Slots
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Single Slot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                    disabled={loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    disabled={loading}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                    disabled={loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }
                  
                  const dateStr = date.toISOString().split('T')[0];
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;
                  const isToday = dateStr === today.toISOString().split('T')[0];
                  const status = getDateStatus(date);
                  const dateSlots = getSlotsForDate(date);
                  
                  let bgColor = 'bg-white border border-gray-200';
                  let textColor = 'text-gray-900';
                  
                  if (isPast) {
                    bgColor = 'bg-gray-100 border border-gray-200';
                    textColor = 'text-gray-400';
                  } else if (isToday) {
                    bgColor = 'bg-brand-50 border-2 border-brand-600';
                    textColor = 'text-brand-900';
                  } else if (status === 'all-closed') {
                    bgColor = 'bg-red-50 border border-red-300';
                    textColor = 'text-red-700';
                  } else if (status === 'has-booked') {
                    bgColor = 'bg-blue-50 border border-blue-300';
                    textColor = 'text-blue-700';
                  } else if (status === 'has-available') {
                    bgColor = 'bg-green-50 border border-green-300';
                    textColor = 'text-green-700';
                  }

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isPast && handleDateClick(date)}
                      disabled={isPast}
                      className={`aspect-square p-2 rounded-lg transition-all hover:scale-105 ${bgColor} ${textColor} ${
                        isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'
                      } ${selectedDate && dateStr === selectedDate.toISOString().split('T')[0] ? 'ring-2 ring-brand-600' : ''}`}
                    >
                      <div className="text-sm font-semibold">{date.getDate()}</div>
                      {dateSlots.length > 0 && (
                        <div className="text-xs mt-1">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs">
                              {dateSlots.filter(s => s.status === 'AVAILABLE').length}A
                            </span>
                            {dateSlots.filter(s => s.status === 'BOOKED').length > 0 && (
                              <span className="text-xs text-blue-600">
                                {dateSlots.filter(s => s.status === 'BOOKED').length}B
                              </span>
                            )}
                            {dateSlots.filter(s => s.status === 'CLOSED').length > 0 && (
                              <span className="text-xs text-red-600">
                                {dateSlots.filter(s => s.status === 'CLOSED').length}C
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-50 border border-green-300"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-50 border border-blue-300"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-50 border border-red-300"></div>
                  <span>Closed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-brand-50 border-2 border-brand-600"></div>
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Slots */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Click on a date in the calendar to view and manage slots
                </div>
              ) : selectedDateSlots.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No slots for this date
                  </div>
                  <Button
                    onClick={() => {
                      setSlotForm({ ...slotForm, date: selectedDate.toISOString().split('T')[0] });
                      setShowAddDialog(true);
                    }}
                    className="w-full bg-brand-600 hover:bg-brand-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenDateSlots(selectedDate)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-600"
                      disabled={loading}
                    >
                      Open All
                    </Button>
                    <Button
                      onClick={() => handleCloseDateSlots(selectedDate)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-600"
                      disabled={loading}
                    >
                      Close All
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedDateSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <Badge
                            className={`mt-1 text-xs ${
                              slot.status === 'AVAILABLE'
                                ? 'bg-green-500'
                                : slot.status === 'BOOKED'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                            }`}
                          >
                            {slot.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {slot.status === 'AVAILABLE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateSlotStatus(slot.id, 'CLOSED')}
                              disabled={loading}
                              className="h-7 px-2 text-xs"
                            >
                              Close
                            </Button>
                          )}
                          {slot.status === 'CLOSED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateSlotStatus(slot.id, 'AVAILABLE')}
                              disabled={loading}
                              className="h-7 px-2 text-xs"
                            >
                              Open
                            </Button>
                          )}
                          {slot.status !== 'BOOKED' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, slot })}
                              disabled={loading}
                              className="h-7 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      setSlotForm({ ...slotForm, date: selectedDate.toISOString().split('T')[0] });
                      setShowAddDialog(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Slots
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Slot Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={slotForm.date}
                  onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddSlot}
                  disabled={loading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Slot'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setSlotForm({ date: '', startTime: '', endTime: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, slot: deleteDialog.slot })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the slot for {deleteDialog.slot && formatDate(deleteDialog.slot.date)} at {deleteDialog.slot?.startTime}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSlot} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

