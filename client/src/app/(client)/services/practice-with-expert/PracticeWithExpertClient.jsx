'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MessageCircle, CheckCircle2, Loader2, CalendarCheck, Sparkles } from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';
import { expertPracticeAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function PracticeWithExpertPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialog, setBookingDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    expertPracticeAPI
      .getActive()
      .then((res) => {
        const data = res?.data ?? res;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast.error('Could not load practice options');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const openBooking = (item) => {
    setBookingDialog({ open: true, item });
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  const closeBooking = () => {
    setBookingDialog({ open: false, item: null });
    setSubmitting(false);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDialog.item) return;
    const { name, email, phone, message } = form;
    if (!name?.trim() || !email?.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await expertPracticeAPI.createBooking({
        expertPracticeId: bookingDialog.item.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        message: message?.trim() || undefined,
      });
      if (res?.success) {
        toast.success('Booking request submitted. We’ll get in touch soon.');
        closeBooking();
      } else {
        toast.error(res?.message || 'Could not submit booking');
      }
    } catch (err) {
      toast.error('Could not submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <ListingHero
          badge="Practice"
          badgeColor="green"
          title="Practice with Expert"
          description="Get structured practice sessions with expert feedback. Choose a option below and reach out to book."
          features={[
            { icon: MessageCircle, text: 'Expert-led practice sessions' },
            { icon: CheckCircle2, text: 'Personalized feedback' },
          ]}
          ctaText="Contact us"
          ctaLink="/contact"
          gradientFrom="from-emerald-600"
          gradientVia="via-emerald-700"
          gradientTo="to-teal-800"
        />
      </div>

      <section id="content" className="max-w-4xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <Card className="rounded-xl border border-border bg-card shadow-sm dark:bg-gray-900/30 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No practice options are listed at the moment.</p>
              <p className="text-sm text-muted-foreground mt-2">Get in touch and we’ll help you with expert practice sessions.</p>
              <Button asChild size="lg" className="mt-6 bg-brand-600 hover:bg-brand-700">
                <Link href="/contact">Contact us</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:gap-8">
            {items.map((item) => (
              <Card
                key={item.id}
                className="group rounded-2xl border border-border/80 bg-card shadow-md hover:shadow-xl dark:bg-gray-900/40 overflow-hidden transition-all duration-300 hover:border-emerald-500/30 dark:hover:border-emerald-500/20"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-6 sm:p-8">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground tracking-tight">{item.title}</h3>
                          {item.description && (
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.description}</p>
                          )}
                          <div className="mt-4">
                            {item.isFree ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                Free
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-border/60 flex items-center justify-center p-6 sm:p-8 sm:min-w-[200px] bg-muted/30 dark:bg-muted/10">
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => openBooking(item)}
                        className="w-full sm:w-auto min-w-[160px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all font-semibold rounded-xl h-12 px-6 inline-flex items-center gap-2"
                      >
                        <CalendarCheck className="h-5 w-5" />
                        Book now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="rounded-xl border-2">
            <Link href="/contact">Request a custom practice plan</Link>
          </Button>
        </div>
      </section>

      <Dialog open={bookingDialog.open} onOpenChange={(open) => !open && closeBooking()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book session</DialogTitle>
            <DialogDescription>
              {bookingDialog.item && (
                <span className="text-foreground font-medium">{bookingDialog.item.title}</span>
              )}
              {' — Fill in your details and we’ll get in touch.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="book-name">Name *</Label>
              <Input
                id="book-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-email">Email *</Label>
              <Input
                id="book-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-phone">Phone</Label>
              <Input
                id="book-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit mobile"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-message">Message (optional)</Label>
              <Textarea
                id="book-message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Preferred time or any note"
                rows={3}
                className="rounded-lg resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeBooking} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Submitting…' : 'Submit booking'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
