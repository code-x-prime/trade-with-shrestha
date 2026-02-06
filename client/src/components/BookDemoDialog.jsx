'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { demoRequestAPI } from '@/lib/api';
import { Calendar } from 'lucide-react';

export default function BookDemoDialog({
  open,
  onOpenChange,
  courseId = null,
  courseTitle = null,
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  defaultMessage = '',
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: defaultName || '',
    email: defaultEmail || '',
    phone: defaultPhone || '',
    message: defaultMessage || '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: defaultName || '',
        email: defaultEmail || '',
        phone: defaultPhone || '',
        message: defaultMessage || '',
      });
    }
  }, [open, defaultName, defaultEmail, defaultPhone, defaultMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim()) {
      toast.error('Name, email and phone are required');
      return;
    }
    setLoading(true);
    try {
      const res = await demoRequestAPI.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        courseId: courseId || undefined,
        message: form.message?.trim() || undefined,
      });
      if (res?.success) {
        toast.success('Demo request submitted! We will contact you soon.');
        onOpenChange(false);
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        toast.error(res?.message || 'Failed to submit');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to submit demo request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Book a Demo
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {courseTitle
              ? `Request a demo for ${courseTitle}. We'll get in touch with you.`
              : 'Fill in your details and we will contact you to schedule a demo.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="demo-name" className="dark:text-gray-200">Name *</Label>
            <Input
              id="demo-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              required
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="demo-email" className="dark:text-gray-200">Email *</Label>
            <Input
              id="demo-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              required
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="demo-phone" className="dark:text-gray-200">Phone *</Label>
            <Input
              id="demo-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
              placeholder="+91 98765 43210"
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="demo-message" className="dark:text-gray-200">Message (optional)</Label>
            <Textarea
              id="demo-message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Preferred time or topic..."
              rows={3}
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-brand-600 hover:bg-brand-700">
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
