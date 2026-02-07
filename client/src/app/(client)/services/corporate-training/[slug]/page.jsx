'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { corporateTrainingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FiClock, FiGlobe, FiCheckCircle, FiSend, FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function CorporateTrainingDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    message: '',
  });

  useEffect(() => {
    fetchTraining();
  }, [slug]);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const res = await corporateTrainingAPI.getBySlug(slug);
      if (res.success) {
        setTraining(res.data.training);
      } else {
        toast.error('Training not found');
        router.push('/services/corporate-training');
      }
    } catch (error) {
      console.error('Failed to fetch training', error);
      toast.error('Failed to load training details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setInquiryLoading(true);
      await corporateTrainingAPI.createInquiry({
        ...formData,
        trainingId: training.id,
        message: `Inquiry for ${training.title}: ${formData.message}`
      });
      toast.success('Thank you for your interest! We will contact you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        message: '',
      });
    } catch (error) {
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-screen bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
      )
  }

  if (!training) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                <FiArrowLeft className="mr-2" /> Back to Trainings
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold">{training.title}</h1>
                    <div className="flex flex-wrap gap-4 text-muted-foreground">
                        {training.duration && (
                            <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border">
                                <FiClock className="w-4 h-4" /> {training.duration}
                            </div>
                        )}
                        {training.mode && (
                            <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border">
                                <FiGlobe className="w-4 h-4" /> {training.mode}
                            </div>
                        )}
                    </div>
                </div>
                {/* Could add price or enroll button here for larger screens */}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Image */}
            {training.image && (
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm border">
                    <Image
                        src={training.image}
                        alt={training.title}
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* Overview / Rich Text */}
            <section>
                <h2 className="text-2xl font-bold mb-6">Program Overview</h2>
                <div 
                    className="prose prose-blue max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: training.description }}
                />
            </section>

            {/* Curriculum */}
            {training.curriculum && Array.isArray(training.curriculum) && training.curriculum.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6">Curriculum</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {training.curriculum.map((module, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left font-medium">
                                    {module.title || `Module ${index + 1}`}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {module.content || 'Detailed topics covered in this module.'}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            )}

            {/* Features */}
            {training.features && Array.isArray(training.features) && training.features.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6">Key Takeaways</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {training.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3 bg-muted/30 p-4 rounded-lg border">
                                <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
          </div>

          {/* Sidebar / Inquiry Form */}
          <div className="lg:col-span-1">
             <div className="sticky top-24 space-y-6">
                <div className="bg-card border rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-2">Request a Proposal</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Get a customized quote tailored to your team&apos;s size and needs.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input 
                                id="name" 
                                required 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}    
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Work Email *</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                required 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}    
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input 
                                id="phone" 
                                required 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}    
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name</Label>
                            <Input 
                                id="company" 
                                value={formData.companyName}
                                onChange={(e) => setFormData({...formData, companyName: e.target.value})}    
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea 
                                id="message" 
                                placeholder="Specific requirements..."
                                className="min-h-[80px]"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}    
                            />
                        </div>
                        
                        <Button type="submit" className="w-full" size="lg" disabled={inquiryLoading}>
                            {inquiryLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                                </>
                            ) : (
                                <>
                                    <FiSend className="w-4 h-4 mr-2" /> Request Quote
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Download Brochure CTA */}
                <div className="bg-muted/50 border rounded-xl p-6 text-center">
                    <h4 className="font-semibold mb-2">Need to discuss internally?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Download our comprehensive corporate training brochure.
                    </p>
                    <Button variant="outline" className="w-full">
                        <FiDownload className="mr-2" /> Download Brochure
                    </Button>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}
