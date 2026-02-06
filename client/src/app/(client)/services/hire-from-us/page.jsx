'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Briefcase, CheckCircle2, Users, Award, Building2, Loader2, Quote, Star } from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';
import { hireFromUsAPI } from '@/lib/api';
import { toast } from 'sonner';

const WHY_ITEMS = [
  {
    title: 'Job-Ready Talent',
    desc: 'Our students are trained with hands-on projects, mock interviews & real-world scenarios.',
    icon: Users,
  },
  {
    title: 'Trained by Experts',
    desc: 'Mentored by experts working at top MNCs with real-time insights.',
    icon: Award,
  },
  {
    title: 'No Hiring Charges',
    desc: 'Direct access to candidates at no cost — no intermediaries.',
    icon: Building2,
  },
];

const TECH_STACK = [
  'Java',
  'Spring Boot',
  'Microservices',
  'React JS',
  'Angular',
  'DevOps',
  'Cloud',
  'Python',
  'Data Science',
];

const TESTIMONIALS = [
  {
    quote: 'We hired 3 Full Stack developers — great knowledge and work ethic!',
    author: 'Priya Sharma',
    role: 'HR Manager',
    company: 'TechNova',
    initial: 'P',
  },
  {
    quote: "Impressed by their DevOps students' understanding of CI/CD and AWS deployments.",
    author: 'Rajesh Kumar',
    role: 'VP Engineering',
    company: 'CloudServe',
    initial: 'R',
  },
  {
    quote: 'React + Node developers delivered top results in our product release.',
    author: 'Anita Desai',
    role: 'CTO',
    company: 'BrightApps',
    initial: 'A',
  },
];

export default function HireFromUsPage() {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    hiringRequirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { companyName, contactName, email, phone, hiringRequirements } = form;
    if (!companyName?.trim() || !contactName?.trim() || !email?.trim() || !phone?.trim()) {
      setError('Company name, your name, email and contact number are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await hireFromUsAPI.submit({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        hiringRequirements: hiringRequirements?.trim() || undefined,
      });
      if (res?.success) {
        toast.success("Request submitted. We'll get in touch soon.");
        setForm({ companyName: '', contactName: '', email: '', phone: '', hiringRequirements: '' });
      } else {
        setError(res?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Could not submit. Please try again.');
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-blue-800/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 relative">
          <ListingHero
            badge="Hiring"
            badgeColor="blue"
            title="Hire From Us"
            description="Hire skilled, project-ready software professionals trained by industry experts."
            features={[
              { icon: Briefcase, text: 'Job-ready talent' },
              { icon: CheckCircle2, text: 'No hiring charges' },
            ]}
            ctaText="Request Candidates"
            ctaLink="#request-form"
            gradientFrom="from-blue-600"
            gradientVia="via-blue-700"
            gradientTo="to-blue-800"
          />
        </div>
      </section>

      {/* Why Hire – new layout */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-18">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Why Hire From Us?</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Access vetted talent trained for real projects</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur shadow-md hover:shadow-lg hover:border-blue-500/20 transition-all duration-300">
                <CardContent className="p-6 md:p-8">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Technologies – improved pills */}
      <section className="bg-muted/30 border-y border-border/50 py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Technologies Our Candidates Excel In</h2>
          <p className="text-muted-foreground text-sm mb-10">Full stack to cloud — ready for your stack</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="px-5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground font-medium text-sm shadow-sm hover:shadow hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials – auto smooth infinite carousel */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What Companies Say</h2>
          <p className="text-muted-foreground mt-2">Hear from hiring managers who chose our talent</p>
        </div>
        <div className="relative px-10 md:px-14">
          <Carousel
            opts={{ align: 'center', loop: true, duration: 28 }}
            className="w-full"
            autoplay
            autoplayInterval={4500}
          >
            <CarouselContent className="-ml-3 md:-ml-6">
              {TESTIMONIALS.map((t) => (
                <CarouselItem key={t.company} className="pl-3 md:pl-6 basis-full sm:basis-2/3 md:basis-1/2">
                  <Card className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/5 dark:shadow-none overflow-hidden h-full">
                    <CardContent className="p-6 md:p-8 h-full flex flex-col">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-md">
                          {t.initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                            ))}
                          </div>
                          <Quote className="h-7 w-7 text-blue-500/25 mb-2 -ml-0.5" />
                          <p className="text-foreground/95 text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                          <div className="mt-6 pt-4 border-t border-border/60">
                            <p className="font-semibold text-foreground">{t.author}</p>
                            <p className="text-sm text-muted-foreground">{t.role}, {t.company}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 h-10 w-10 rounded-full border-2 bg-background/95 backdrop-blur hover:bg-muted shadow-md" />
            <CarouselNext className="right-0 h-10 w-10 rounded-full border-2 bg-background/95 backdrop-blur hover:bg-muted shadow-md" />
          </Carousel>
        </div>
      </section>

      {/* Request form – improved layout */}
      <section id="request-form" className="max-w-2xl mx-auto px-4 pb-20">
        <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-xl shadow-black/5 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/10 to-blue-700/5 border-b border-border/60 px-6 md:px-8 py-5">
            <h2 className="text-xl md:text-2xl font-bold">Request Candidates Now</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Fill in your details and we&apos;ll share suitable candidates.
            </p>
          </div>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
                  {error}
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    placeholder="Your company name"
                    required
                    className="rounded-xl border-border/80 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-sm font-medium">Your Name *</Label>
                  <Input
                    id="contactName"
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    placeholder="Full name"
                    required
                    className="rounded-xl border-border/80 h-11"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    required
                    className="rounded-xl border-border/80 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Contact Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit mobile"
                    required
                    className="rounded-xl border-border/80 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hiringRequirements" className="text-sm font-medium">Hiring Requirements</Label>
                <Textarea
                  id="hiringRequirements"
                  value={form.hiringRequirements}
                  onChange={(e) => setForm((f) => ({ ...f, hiringRequirements: e.target.value }))}
                  placeholder="Skills, role, experience level, etc."
                  rows={4}
                  className="rounded-xl border-border/80 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Submitting…
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
