'use client';

import { useState, useEffect } from 'react';
import { corporateTrainingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FiClock, FiGlobe, FiCheckCircle, FiSend } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import PageHero from '@/components/sections/PageHero';

export default function CorporateTrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    message: '',
    trainingId: '',
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await corporateTrainingAPI.getAll();
      if (res.success) {
        setTrainings(res.data.trainings || []);
      }
    } catch (error) {
      console.error('Failed to fetch trainings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setInquiryLoading(true);
      await corporateTrainingAPI.createInquiry(formData);
      toast.success('Thank you for your interest! We will contact you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        message: '',
        trainingId: '',
      });
    } catch (error) {
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="For Teams"
        title="Corporate"
        titleHighlight="Training"
        highlightPosition="end"
        description="Upskill your team with customised training programs."
        primaryBtn={{ text: 'Contact Us', href: '/contact' }}
      />

      {/* Programs List */}
      <section id="programs" className=" pt-10 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Training Programs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our wide range of specialized courses or request a custom curriculum tailored to your organization&apos;s needs.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainings.map((training) => (
              <div key={training.id} className="group bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {training.image ? (
                    <Image
                      src={training.image}
                      alt={training.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/5 text-primary">
                      <FiGlobe className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border shadow-sm">
                    {training.mode || 'Flexible Mode'}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {training.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    {training.duration && (
                      <div className="flex items-center gap-1.5">
                        <FiClock className="w-4 h-4" />
                        {training.duration}
                      </div>
                    )}
                  </div>

                  {training.features && Array.isArray(training.features) && training.features.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {training.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button className="w-full" asChild>
                    <Link href={`/services/corporate-training/${training.slug}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Inquiry Form */}
      <section id="inquiry-form" className="py-5 px-4 md:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl overflow-hidden border grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 md:p-12 bg-primary text-primary-foreground">
            <h3 className="text-2xl font-bold mb-4">Get a Quote</h3>
            <p className="mb-8 opacity-90">
              Tell us about your training needs, and we&apos;ll create a customized proposal for your team.
            </p>

            <div className="space-y-12">
              <div className="flex items-center gap-4">
                <Image src="/corporate/tailored-curriculum.svg" alt="Event banner" width={500} height={500} className='w-10 h-10 invert' />

                <div>
                  <h4 className="font-semibold">Tailored Curriculum</h4>
                  <p className="text-sm opacity-80">Content customized to your project stack</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Image src="/corporate/flexible-schedule.svg" alt="Event banner" width={500} height={500} className='w-10 h-10 invert' />

                <div>
                  <h4 className="font-semibold">Flexible Schedule</h4>
                  <p className="text-sm opacity-80">Weekend or weekday batches available</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Image src="/corporate/post-training-support.svg" alt="Event banner" width={500} height={500} className='w-10 h-10 invert' />

                <div>
                  <h4 className="font-semibold">Post-Training Support</h4>
                  <p className="text-sm opacity-80">Mentorship and doubt clearing sessions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  placeholder="+1 234 567 890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Training Requirements</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your team size, preferred technologies, and goals..."
                  className="min-h-[100px]"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={inquiryLoading}>
                {inquiryLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4 mr-2" /> Submit Request
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
