'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle2, Calendar, Video, Loader2, Search, Clock } from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';
import { mockInterviewAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function formatSlotDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(paise, currency = 'INR') {
  if (currency === 'INR') return `₹${(paise / 100).toLocaleString('en-IN')}`;
  return `${(paise / 100).toLocaleString()} ${currency}`;
}

function getRemainingDisplay(slot) {
  const max = slot.maxBookings;
  const booked = slot.bookedCount ?? 0;
  if (max == null) return { text: 'Unlimited', variant: 'green' };
  const remaining = Math.max(0, max - booked);
  if (remaining === 0) return { text: 'Slot full', variant: 'red' };
  const ratio = remaining / max;
  if (ratio <= 0.2) return { text: `${remaining} remaining`, variant: 'red' };
  if (ratio <= 0.5) return { text: `${remaining} remaining`, variant: 'orange' };
  return { text: `${remaining} remaining`, variant: 'green' };
}

export default function MockInterviewPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkFetched, setCheckFetched] = useState(false);
  const [slotSearch, setSlotSearch] = useState('');

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await mockInterviewAPI.getSlots();
      const data = res?.data ?? res;
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Could not load slots');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchMyBookings = async () => {
    if (user?.id) {
      setLoadingBookings(true);
      try {
        const res = await mockInterviewAPI.getMyBookings();
        const data = res?.data ?? res;
        setMyBookings(Array.isArray(data) ? data : []);
      } catch {
        setMyBookings([]);
      } finally {
        setLoadingBookings(false);
      }
      return;
    }
    if (checkEmail.trim()) {
      setChecking(true);
      setCheckFetched(false);
      try {
        const res = await mockInterviewAPI.getMyBookings({ email: checkEmail.trim() });
        const data = res?.data ?? res;
        setMyBookings(Array.isArray(data) ? data : []);
        setCheckFetched(true);
      } catch {
        toast.error('Could not fetch bookings');
        setMyBookings([]);
        setCheckFetched(true);
      } finally {
        setChecking(false);
      }
    } else {
      setMyBookings([]);
      setCheckFetched(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchMyBookings();
    }
  }, [user?.id]);

  const openBookDialog = (slot) => {
    setSelectedSlot(slot);
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      message: '',
    });
    setBookDialogOpen(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await mockInterviewAPI.book({
        slotId: selectedSlot.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || undefined,
      });
      toast.success('Booking submitted! We will confirm shortly.');
      setBookDialogOpen(false);
      setSelectedSlot(null);
      fetchSlots();
      if (form.email) {
        const res = await mockInterviewAPI.getMyBookings({ email: form.email.trim() });
        const data = res?.data ?? res;
        setMyBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error(err?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const slotSearchLower = slotSearch.trim().toLowerCase();
  const filteredSlots = slotSearchLower
    ? slots.filter((s) => {
        const dateStr = formatSlotDate(s.slotDate).toLowerCase();
        const timeStr = (s.startTime || '').toLowerCase();
        return dateStr.includes(slotSearchLower) || timeStr.includes(slotSearchLower);
      })
    : slots;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <ListingHero
          badge="Practice"
          badgeColor="green"
          title="Mock Interview"
          description="Practice with industry-style interviews and get expert feedback. Technical and HR rounds to improve confidence."
          features={[
            { icon: MessageCircle, text: 'Real interview scenarios' },
            { icon: CheckCircle2, text: 'Expert feedback and tips' },
          ]}
          ctaText="Book Mock Interview"
          ctaLink="#slots"
          gradientFrom="from-emerald-600"
          gradientVia="via-emerald-700"
          gradientTo="to-teal-800"
        />
      </div>

      {/* My bookings check (for guests) – premium card */}
      {!user?.id && (
        <section className="max-w-2xl mx-auto px-4 pb-8">
          <Card className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/5 dark:shadow-none dark:bg-gradient-to-b dark:from-card dark:to-card/80 overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Check your booking</h3>
                  <p className="text-xs text-muted-foreground">Enter the email you used to book</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={checkEmail}
                  onChange={(e) => { setCheckEmail(e.target.value); setCheckFetched(false); }}
                  className="flex-1 h-10 rounded-lg border-border/80 bg-background/50"
                />
                <Button
                  onClick={fetchMyBookings}
                  disabled={checking || !checkEmail.trim()}
                  className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 shrink-0 px-4"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                </Button>
              </div>
              {checking && (
                <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching…
                </p>
              )}
              {checkFetched && !checking && myBookings.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">No bookings found for this email.</p>
              )}
              {checkFetched && !checking && myBookings.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {myBookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between rounded-xl bg-muted/60 dark:bg-muted/30 px-4 py-3 border border-border/50">
                      <span className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.slot && formatSlotDate(b.slot.slotDate)} · {b.slot?.startTime}
                      </span>
                      <Badge variant={b.status === 'CONFIRMED' ? 'default' : b.status === 'COMPLETED' ? 'secondary' : b.status === 'CANCELLED' ? 'destructive' : 'outline'} className="shrink-0">
                        {b.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Logged-in user bookings – premium card */}
      {user?.id && (loadingBookings || myBookings.length > 0) && (
        <section className="max-w-2xl mx-auto px-4 pb-8">
          <Card className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/5 dark:shadow-none dark:bg-gradient-to-b dark:from-card dark:to-card/80 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold">Your bookings</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingBookings ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </p>
              ) : (
                <ul className="space-y-2">
                  {myBookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between rounded-xl bg-muted/60 dark:bg-muted/30 px-4 py-3 border border-border/50">
                      <span className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.slot && formatSlotDate(b.slot.slotDate)} · {b.slot?.startTime}
                      </span>
                      <Badge variant={b.status === 'CONFIRMED' ? 'default' : b.status === 'COMPLETED' ? 'secondary' : b.status === 'CANCELLED' ? 'destructive' : 'outline'} className="shrink-0">
                        {b.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Slots – with search and remaining badges */}
      <section id="slots" className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-1">Slots</h2>
        <p className="text-sm text-muted-foreground mb-4">Pick a slot and book your mock interview.</p>
        {!loadingSlots && slots.length > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search by date or time (e.g. Mon, 10:00)"
              value={slotSearch}
              onChange={(e) => setSlotSearch(e.target.value)}
              className="max-w-sm rounded-lg bg-background border-border/80"
            />
          </div>
        )}
        {loadingSlots ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <Card className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/5 overflow-hidden">
            <CardContent className="py-12 text-center text-muted-foreground">
              {slots.length === 0
                ? <>No slots available at the moment. Check back later or <Link href="/contact" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">contact us</Link> for more options.</>
                : 'No slots match your search. Try a different date or time.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlots.map((slot) => {
              const remainingInfo = getRemainingDisplay(slot);
              const isFull = !slot.isAvailable;
              const remainingClass =
                remainingInfo.variant === 'red'
                  ? 'text-red-600 dark:text-red-400 bg-red-500/15 dark:bg-red-500/20'
                  : remainingInfo.variant === 'orange'
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/20'
                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/20';
              return (
                <Card
                  key={slot.id}
                  className={`group rounded-2xl border border-border/80 bg-card shadow-md shadow-black/5 dark:shadow-none dark:bg-gradient-to-b dark:from-card dark:to-card/90 overflow-hidden transition-all duration-200 ${isFull ? 'opacity-90' : 'hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/30'}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm font-medium truncate">{formatSlotDate(slot.slotDate)}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${remainingClass}`}>
                            {remainingInfo.text}
                          </span>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">
                          {slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ''}
                        </p>
                        <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(slot.price, slot.currency)}
                        </p>
                        {slot.meetingLink && (
                          <a
                            href={slot.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 mt-2 transition-colors"
                          >
                            <Video className="h-3.5 w-3.5" /> Join link
                          </a>
                        )}
                      </div>
                      <Button
                        size="sm"
                        disabled={isFull}
                        className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-medium shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                        onClick={() => openBookDialog(slot)}
                      >
                        {isFull ? 'Full' : 'Book'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="outline" className="rounded-xl border-border/80">
            <Link href="/contact">Request a custom slot</Link>
          </Button>
        </div>
      </section>

      {/* Book slot dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book mock interview</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>Slot: {formatSlotDate(selectedSlot.slotDate)} at {selectedSlot.startTime} – {formatPrice(selectedSlot.price, selectedSlot.currency)}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div>
              <Label htmlFor="book-name">Name *</Label>
              <Input
                id="book-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="book-email">Email *</Label>
              <Input
                id="book-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="book-phone">Phone *</Label>
              <Input
                id="book-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit mobile"
                required
              />
            </div>
            <div>
              <Label htmlFor="book-message">Message (optional)</Label>
              <Input
                id="book-message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Topic or special request"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBookDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-600 hover:bg-brand-700">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
