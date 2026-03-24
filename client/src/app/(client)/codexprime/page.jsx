'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Globe, Phone, Mail, Loader2, CheckCircle2, Rocket, TrendingUp, BookOpen, ArrowRight, Star } from 'lucide-react';

const coreServices = [
  {
    icon: Rocket,
    title: 'Web & MVP Development',
    desc: 'Fast, scalable product builds with clear milestones and business-focused delivery.',
  },
  {
    icon: TrendingUp,
    title: 'Digital Growth',
    desc: 'SEO, paid campaigns, and social strategy focused on qualified leads and measurable ROI.',
  },
  {
    icon: BookOpen,
    title: 'Learning + Execution',
    desc: 'Shrestha Academy training + CodeXPrime delivery so students learn with real projects.',
  },
];

export default function CodeXPrimePage() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    courseInterest: '',
    message: '',
  });

  const canSubmit = useMemo(
    () => form.name.trim() && form.email.trim() && form.phone.trim() && form.courseInterest.trim(),
    [form]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/codexprime/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          courseInterest: form.courseInterest,
          message: form.message?.trim() || undefined,
          source: 'codexprime-collab',
        }),
      });
      const res = await response.json();
      if (response.ok && res?.success) {
        toast.success("✅ Submitted! We'll contact you within 24 hours.");
        setForm({ name: '', email: '', phone: '', courseInterest: '', message: '' });
      } else {
        toast.error(res?.message || 'Failed to submit enquiry');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to submit enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/50 via-transparent to-yellow-100/30 dark:from-yellow-500/10 dark:to-yellow-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 border border-yellow-300 dark:bg-yellow-500/10 dark:border-yellow-500/30 w-fit">
              <Star className="h-4 w-4 fill-yellow-700 text-yellow-700 dark:fill-yellow-400 dark:text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Official Collaboration</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-balance">
              <span className="text-gray-900 dark:text-white">Shrestha Academy</span> <span className="text-yellow-700 dark:text-yellow-400">×</span> <span className="text-gray-900 dark:text-white">CodeXPrime</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              Training meets execution. You learn from experts and build with a real digital agency team under one partnership.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500 italic font-medium">
              Turning Ideas into Scalable Products
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#lead-form">
                <Button className="bg-yellow-600 text-white hover:bg-yellow-500 dark:bg-yellow-500 dark:text-black dark:hover:bg-yellow-400 rounded-lg px-8 py-6 font-bold text-base group">
                  Get Expert Support
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="https://codexprime.in/" target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-lg px-8 py-6 border-2 border-yellow-700 dark:border-yellow-500/40 text-gray-900 dark:text-white hover:bg-yellow-100 dark:hover:bg-yellow-500/10 font-bold text-base">
                  Visit CodeXPrime
                </Button>
              </a>
            </div>

            <a href="tel:+919354734436" className="inline-flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold hover:text-yellow-800 dark:hover:text-yellow-300 transition-colors pt-2">
              <Phone className="h-5 w-5" />
              <span>+91 935 473 4436</span>
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/40 via-yellow-100/30 to-transparent dark:from-yellow-500/20 dark:via-yellow-500/10 rounded-2xl blur-3xl"></div>
            <Card className="relative border-2 border-yellow-300 dark:border-yellow-500/30 bg-white dark:bg-gray-900 backdrop-blur-sm rounded-2xl shadow-2xl">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What is CodeXPrime?</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                  CodeXPrime is a digital product and growth agency. They design websites, build MVPs, and run marketing pipelines. In this collaboration, students and businesses get one integrated ecosystem: learning + implementation.
                </p>

                <div className="space-y-3 pt-2">
                  <a href="https://codexprime.in/" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors font-medium">
                    <Globe className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                    <span>codexprime.in</span>
                  </a>
                  <a href="mailto:codexprime00@gmail.com" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors font-medium">
                    <Mail className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                    <span>codexprime00@gmail.com</span>
                  </a>
                  <a href="tel:+919354734436" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors font-medium">
                    <Phone className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                    <span>+91 935 473 4436</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-8 md:py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-700 dark:text-yellow-400">Partnership Value</p>
            <h2 className="text-4xl md:text-5xl font-bold text-balance">What You Get From This Partnership</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {coreServices.map((item, idx) => (
              <Card key={item.title} className="group relative border-gray-200 dark:border-gray-800 hover:border-yellow-300 dark:hover:border-yellow-500/30 bg-white dark:bg-gray-900 transition-all duration-300 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/0 via-transparent to-yellow-100/0 group-hover:from-yellow-100/50 dark:group-hover:from-yellow-500/5 transition-all duration-300"></div>
                <CardContent className="relative p-7 space-y-5">
                  <div className="h-12 w-12 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-500/20 transition-colors">
                    <item.icon className="h-6 w-6" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 font-medium pt-2">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span>Outcome-driven execution</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section id="lead-form" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Let&apos;s Discuss Your Requirement</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Share your need and our team will contact you within 24 hours with a clear action plan tailored to your goals.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20">
                <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Partner</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Shrestha Academy × CodeXPrime</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20">
                <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Support Window</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monday - Saturday, 10:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="order-1 lg:order-2 border-2 border-yellow-300 dark:border-yellow-500/30 bg-white dark:bg-gray-950 backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 dark:text-white">Full Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Your full name"
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-yellow-700 dark:focus:border-yellow-500 rounded-lg h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 dark:text-white">Email Address *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    placeholder="you@email.com"
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-yellow-700 dark:focus:border-yellow-500 rounded-lg h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 dark:text-white">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    placeholder="+91 98XXXXXXXX"
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-yellow-700 dark:focus:border-yellow-500 rounded-lg h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 dark:text-white">Course/Service Interest *</Label>
                  <Select value={form.courseInterest} onValueChange={(v) => setForm((s) => ({ ...s, courseInterest: v }))}>
                    <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-yellow-700 dark:focus:border-yellow-500 rounded-lg h-11">
                      <SelectValue placeholder="Select interest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      <SelectItem value="Web Development / Website Design">Web Development / Website Design</SelectItem>
                      <SelectItem value="Full Stack Development">Full Stack Development</SelectItem>
                      <SelectItem value="SEO & Content Marketing">SEO & Content Marketing</SelectItem>
                      <SelectItem value="Social Media Marketing">Social Media Marketing</SelectItem>
                      <SelectItem value="MVP Development">MVP Development</SelectItem>
                      <SelectItem value="Online Courses (Shrestha Academy)">Online Courses (Shrestha Academy)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 dark:text-white">Message / Query</Label>
                  <Textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                    placeholder="Tell us your requirement..."
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-yellow-700 dark:focus:border-yellow-500 rounded-lg resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="w-full bg-yellow-600 text-white hover:bg-yellow-500 dark:bg-yellow-500 dark:text-black dark:hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-6 font-bold text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Enquiry
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-gray-500 dark:text-gray-500 text-xs text-center font-medium">
                  🔒 Your information is safe with us. No spam, ever.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 md:py-10">
        <div className="max-w-4xl mx-auto px-4 space-y-10">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-700 dark:text-yellow-400">FAQs</p>
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="q1" className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden data-[state=open]:border-yellow-300 dark:data-[state=open]:border-yellow-500/30 data-[state=open]:bg-yellow-50 dark:data-[state=open]:bg-yellow-500/10 transition-all">
              <AccordionTrigger className="px-6 py-4 hover:no-underline font-semibold text-gray-900 dark:text-white hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors">
                What does CodeXPrime do?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                CodeXPrime builds websites, MVPs, and growth systems using modern stacks and performance-first delivery. They combine technical excellence with business strategy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2" className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden data-[state=open]:border-yellow-300 dark:data-[state=open]:border-yellow-500/30 data-[state=open]:bg-yellow-50 dark:data-[state=open]:bg-yellow-500/10 transition-all">
              <AccordionTrigger className="px-6 py-4 hover:no-underline font-semibold text-gray-900 dark:text-white hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors">
                How does this collaboration help me?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                You get both sides in one place: training from Shrestha Academy and real project execution support from CodeXPrime. Learn while building real products with industry experts.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3" className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden data-[state=open]:border-yellow-300 dark:data-[state=open]:border-yellow-500/30 data-[state=open]:bg-yellow-50 dark:data-[state=open]:bg-yellow-500/10 transition-all">
              <AccordionTrigger className="px-6 py-4 hover:no-underline font-semibold text-gray-900 dark:text-white hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors">
                How quickly will your team respond?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Most enquiries are acknowledged within 24 hours, followed by a discovery call to understand your needs and suggest tailored next steps.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4" className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden data-[state=open]:border-yellow-300 dark:data-[state=open]:border-yellow-500/30 data-[state=open]:bg-yellow-50 dark:data-[state=open]:bg-yellow-500/10 transition-all">
              <AccordionTrigger className="px-6 py-4 hover:no-underline font-semibold text-gray-900 dark:text-white hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors">
                What makes this partnership unique?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Unlike typical agencies or academies, this partnership combines hands-on training with immediate real-world project execution, giving you practical experience and portfolio-building opportunities.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Connect with our team today and take the first step toward your digital transformation.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href="#lead-form">
              <Button className="bg-yellow-600 text-white hover:bg-yellow-500 dark:bg-yellow-500 dark:text-black dark:hover:bg-yellow-400 rounded-lg px-8 py-6 font-bold">
                Fill the Form
              </Button>
            </a>
            <a href="tel:+919354734436">
              <Button variant="outline" className="rounded-lg px-8 py-6 border-2 border-yellow-700 dark:border-yellow-500/40 text-gray-900 dark:text-white hover:bg-yellow-100 dark:hover:bg-yellow-500/10 font-bold">
                Call Us Now
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
