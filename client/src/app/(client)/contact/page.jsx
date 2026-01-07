'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

// Phone regex for Indian numbers (+91 optional, 10 digits)
const PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    subjectType: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!PHONE_REGEX.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setSuccess(true);
      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      value: '+91 92207 97499',
      link: 'tel:+919220797499',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/30'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+91 88600 36536',
      link: 'https://wa.me/918860036536',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30'
    },
    {
      icon: Mail,
      title: 'Email Us',
      value: 'support@shrestha.com',
      link: 'mailto:support@shrestha.com',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      value: 'New Delhi, India',
      link: '#',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/30'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden border-b bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Get in <span className="text-brand-600">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about our courses or need expert guidance? We&apos;re here to help you upskill and succeed.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Contact Info Grid */}
          <div className="grid sm:grid-cols-2 gap-6 order-2 lg:order-1">
            {contactInfo.map((info, idx) => (
              <motion.a
                key={info.title}
                href={info.link}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="group flex flex-col items-center justify-center p-8 rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-300"
              >
                <div className={`p-4 rounded-full ${info.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <info.icon className={`w-8 h-8 ${info.color}`} />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">{info.title}</h3>
                <p className="text-sm text-muted-foreground font-medium">{info.value}</p>
              </motion.a>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="order-1 lg:order-2 bg-card p-8 md:p-10 rounded-2xl border shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Send us a Message</h2>
              
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-8 rounded-xl text-center"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">We have received your message and sent a confirmation to your email.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSuccess(false)} 
                    className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/40"
                  >
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Name <span className="text-red-500">*</span></label>
                      <Input 
                        placeholder="John Doe" 
                        value={formData.name}
                        onChange={e => {
                          setFormData({...formData, name: e.target.value});
                          if(errors.name) setErrors({...errors, name: ''});
                        }}
                        className={`rounded-lg ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-xs text-red-500 flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1" />{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email <span className="text-red-500">*</span></label>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        value={formData.email}
                        onChange={e => {
                          setFormData({...formData, email: e.target.value});
                          if(errors.email) setErrors({...errors, email: ''});
                        }}
                        className={`rounded-lg ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-xs text-red-500 flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1" />{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number <span className="text-red-500">*</span></label>
                    <Input 
                      type="tel"
                      placeholder="+91 99999 99999" 
                      value={formData.phone}
                      onChange={e => {
                        setFormData({...formData, phone: e.target.value});
                        if(errors.phone) setErrors({...errors, phone: ''});
                      }}
                      className={`rounded-lg ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {errors.phone && <p className="text-xs text-red-500 flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1" />{errors.phone}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Subject <span className="text-red-500">*</span></label>
                    <Select
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, subjectType: value, subject: value === 'other' ? '' : value }));
                        if(errors.subject) setErrors({...errors, subject: ''});
                      }}
                    >
                      <SelectTrigger className={`w-full ${errors.subject ? 'border-red-500 focus:ring-red-500' : ''}`}>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Course Inquiry">Course Inquiry</SelectItem>
                        <SelectItem value="Admission Support">Admission Support</SelectItem>
                        <SelectItem value="Stock Market Trading">Stock Market Trading</SelectItem>
                        <SelectItem value="Partnership Proposal">Partnership Proposal</SelectItem>
                        <SelectItem value="Job Application">Job Application</SelectItem>
                        <SelectItem value="Corporate Training">Corporate Training</SelectItem>
                        <SelectItem value="Technical Support">Technical Support</SelectItem>
                        <SelectItem value="Feedback">Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.subject && !formData.subjectType && <p className="text-xs text-red-500 flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1" />{errors.subject}</p>}
                  </div>

                  {formData.subjectType === 'other' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-foreground">Specify Subject <span className="text-red-500">*</span></label>
                      <Input 
                        placeholder="Please specify your subject" 
                        value={formData.subject}
                        onChange={e => {
                          setFormData({...formData, subject: e.target.value});
                          if(errors.subject) setErrors({...errors, subject: ''});
                        }}
                        className={`rounded-lg ${errors.subject ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      {errors.subject && <p className="text-xs text-red-500 flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1" />{errors.subject}</p>}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message <span className="text-red-500">*</span></label>
                    <Textarea 
                      placeholder="How can we help you?" 
                      className={`min-h-[150px] rounded-lg resize-none ${errors.message ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      value={formData.message}
                      onChange={e => {
                        setFormData({...formData, message: e.target.value});
                        if(errors.message) setErrors({...errors, message: ''});
                      }}
                    />
                    {errors.message && <p className="text-xs text-red-500 flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1" />{errors.message}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-lg hover:shadow-lg transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
