'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  Award,
  Star,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';
import { placementTrainingAPI } from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';

const STATS = [
  { icon: Star, title: '4.9/5 Rating', desc: 'Based on 6,000+ student reviews' },
  { icon: GraduationCap, title: '10,000+ Enrolled', desc: 'Students worldwide' },
  { icon: Award, title: '10+ Years Experience', desc: 'Industry expert trainers' },
  { icon: TrendingUp, title: '90% Placement Success', desc: 'Students placed in top companies' },
];

const WHAT_YOU_GET = [
  'Resume Building – Craft a job-winning resume with expert guidance.',
  'Mock Interviews – Ace technical and HR rounds with real interview simulations.',
  'Coding Prep – Strengthen problem-solving skills for recruitment tests.',
  'Soft Skills & Communication – Boost confidence and improve professional communication.',
  'Exclusive Job Alerts – Get access to hiring opportunities from top companies.',
  'Placement Drives – Participate in on-campus & off-campus job drives.',
];

const COURSE_OPTIONS = [
  'Full Stack Java',
  'Full Stack Python',
  'React + Node',
  'DevOps + Cloud',
  'Data Analytics',
];

const COUNTRY_CODES = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'USA (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+61', label: 'Australia (+61)' },
];

const TESTIMONIALS = [
  {
    name: 'Ramesh Kumar',
    text: 'This course transformed my career! The hands-on projects and placement assistance helped me land my dream job.',
  },
  {
    name: 'Priya Sharma',
    text: 'The training was top-notch! The instructors were industry experts, and the mock interviews prepared me perfectly.',
  },
  {
    name: 'Ankit Verma',
    text: 'The real-world projects gave me confidence, and the job referrals helped me secure an amazing opportunity!',
  },
  {
    name: 'Sneha Reddy',
    text: 'Great mentors, excellent study material, and the best part – lifetime access to course materials!',
  },
];

export default function PlacementTrainingPage() {
  const [step, setStep] = useState('form'); // form | otp | verified
  const [registrationId, setRegistrationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    whatsappNumber: '',
    course: '',
    notes: '',
  });

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.whatsappNumber.trim() &&
      form.course.trim()
    );
  }, [form]);

  const submitRegistration = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Name, Email, WhatsApp Number and Course are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await placementTrainingAPI.register({
        name: form.name.trim(),
        email: form.email.trim(),
        countryCode: form.countryCode,
        whatsappNumber: form.whatsappNumber.trim(),
        course: form.course,
        notes: form.notes?.trim() || undefined,
      });
      if (res?.success) {
        setRegistrationId(res?.data?.id || '');
        setStep('otp');
        toast.success('OTP sent to your email');
      } else {
        setError(res?.message || 'Could not register. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Could not register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!registrationId || otp.trim().length < 4) {
      setError('Enter the OTP sent to your email.');
      return;
    }
    setVerifying(true);
    try {
      const res = await placementTrainingAPI.verifyOtp({ id: registrationId, otp: otp.trim() });
      if (res?.success) {
        setStep('verified');
        toast.success('Verified successfully');
      } else {
        setError(res?.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(err?.message || 'OTP verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 pt-2">
        <Link href="/career" className="text-sm text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1">
          ← Career
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <ListingHero
          badge="Training"
          badgeColor="pink"
          title="Placement Assistance Training"
          description="Launch your IT career with structured training + placement support from Shrestha Academy."
          features={[
            { icon: ShieldCheck, text: 'Job-ready skills & interview prep' },
            { icon: Sparkles, text: 'Dedicated placement support' },
          ]}
          ctaText="One‑Click Apply"
          ctaLink="#register"
          gradientFrom="from-violet-600"
          gradientVia="via-fuchsia-600"
          gradientTo="to-pink-700"
        />
      </div>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid gap-8 lg:grid-cols-12">
        {/* Left content */}
        <div className="lg:col-span-7 space-y-8">
          {/* Banner placeholder */}
          <Card className="rounded-3xl border border-border/80 bg-gradient-to-br from-fuchsia-600/10 via-background to-violet-600/10 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-center  flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mt-3 tracking-tight">An Immersive Learning Experience</h2>
                </div>
                <div>
                  <Image src="/experience.svg" alt="Event banner" width={500} height={500} />
                </div>
                
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="rounded-3xl border border-border/80 bg-card">
            <CardHeader className="pb-0">
              <h3 className="text-xl font-bold">About Course</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We don’t just train you — we help you launch your dream career in IT.
              </p>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-muted-foreground leading-relaxed">
                Our Placement Assistance Training is designed to equip you with the skills, confidence, and guidance needed
                to secure top software jobs.
              </p>
              <div className="mt-5 grid gap-3">
                {WHAT_YOU_GET.map((t) => (
                  <div key={t} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/90">{t}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border/60">
                <p className="font-semibold">Pre‑Requisites</p>
                <p className="text-sm text-muted-foreground mt-1">No pre‑requisites — just your dedication matters!</p>
              </div>
            </CardContent>
          </Card>

          {/* Comparison table */}
          <Card className="rounded-3xl border border-border/80 bg-card">
            <CardHeader className="pb-0">
              <h3 className="text-xl font-bold">Why choose Shrestha Academy</h3>
              <p className="text-sm text-muted-foreground mt-1">A quick comparison of what you get</p>
            </CardHeader>
            <CardContent className="pt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4 text-muted-foreground font-medium">Feature</th>
                    <th className="py-2 text-muted-foreground font-medium">Our Program</th>
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-border/60">
                  {[
                    ['Live Interactive Sessions', '✅ Yes'],
                    ['Industry Expert Trainers', '✅ Yes'],
                    ['Real‑World Projects', '✅ Yes'],
                    ['Placement Assistance', '✅ 100% Placement Support'],
                    ['1‑on‑1 Doubt Clearing', '✅ Yes'],
                    ['Lifetime Materials Access', '✅ Yes'],
                    ['Final Verdict', '🚀 Best Choice for Career Growth'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-3 pr-4 font-medium">{k}</td>
                      <td className="py-3">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Testimonials carousel */}
          <Card className="rounded-3xl border border-border/80 bg-card overflow-hidden">
            <CardHeader className="pb-0">
              <h3 className="text-xl font-bold">Student stories</h3>
              <p className="text-sm text-muted-foreground mt-1">Real feedback from learners</p>
            </CardHeader>
            <CardContent className="pt-6">
              <Carousel opts={{ align: 'start', loop: true, duration: 28 }} autoplay autoplayInterval={4500}>
                <CarouselContent className="-ml-3">
                  {TESTIMONIALS.map((t) => (
                    <CarouselItem key={t.name} className="pl-3 basis-full md:basis-1/2">
                      <div className="h-full rounded-2xl border border-border/70 bg-muted/20 p-5">
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-foreground/90 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                        <p className="mt-4 font-semibold">{t.name}</p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="rounded-3xl border border-border/80 bg-card">
            <CardHeader className="pb-0">
              <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
            </CardHeader>
            <CardContent className="pt-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="d">
                  <AccordionTrigger>What is the duration of the course?</AccordionTrigger>
                  <AccordionContent>The program duration is typically 6 months (live + recordings access).</AccordionContent>
                </AccordionItem>
                <AccordionItem value="p">
                  <AccordionTrigger>Do you provide placement assistance?</AccordionTrigger>
                  <AccordionContent>Yes, you get resume help, mock interviews, referrals, and placement drive updates.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="m">
                  <AccordionTrigger>Can I access course materials after completion?</AccordionTrigger>
                  <AccordionContent>Yes, you’ll have continued access to materials (as per program policy).</AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Right registration card */}
        <div id="register" className="lg:col-span-5">
          <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-xl shadow-black/5 dark:shadow-none overflow-hidden sticky top-6">
            <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border-b border-border/60">
              <p className="text-xs text-muted-foreground">Register Image</p>
              <h3 className="text-xl font-bold mt-1">Placement Training Registration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                OTP will be sent to your email for verification.
              </p>
            </div>
            <CardContent className="p-6 md:p-8">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20 mb-4">
                  {error}
                </p>
              )}

              {step === 'form' && (
                <form onSubmit={submitRegistration} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="h-11 rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@email.com" className="h-11 rounded-xl" required />
                    <p className="text-xs text-muted-foreground">Password will be sent to this email for login (if applicable).</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Country Code *</Label>
                      <Select value={form.countryCode} onValueChange={(v) => setForm((f) => ({ ...f, countryCode: v }))}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp Number *</Label>
                      <Input value={form.whatsappNumber} onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))} placeholder="WhatsApp number" className="h-11 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Course *</Label>
                    <Select value={form.course} onValueChange={(v) => setForm((f) => ({ ...f, course: v }))}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="-Select-" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hiring / Learning Notes (optional)</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything you'd like us to know" className="rounded-xl resize-none" rows={3} />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 font-semibold">
                    {submitting ? (<><Loader2 className="h-5 w-5 animate-spin mr-2" /> Sending OTP…</>) : 'One‑Click Apply'}
                  </Button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the OTP sent to <span className="font-medium text-foreground">{form.email}</span>.
                  </p>
                  <div className="space-y-2">
                    <Label>OTP *</Label>
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" className="h-11 rounded-xl tracking-widest text-center" />
                  </div>
                  <Button type="submit" disabled={verifying} className="w-full h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 font-semibold">
                    {verifying ? (<><Loader2 className="h-5 w-5 animate-spin mr-2" /> Verifying…</>) : 'Verify OTP'}
                  </Button>
                  <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => { setStep('form'); setOtp(''); }}>
                    Edit details
                  </Button>
                </form>
              )}

              {step === 'verified' && (
                <div className="text-center py-6">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-lg font-bold">Registration Verified</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Thanks! Our team will contact you soon on WhatsApp and email.
                  </p>
                  <Button asChild variant="outline" className="mt-5 rounded-xl">
                    <Link href="/contact">Need help? Contact us</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
