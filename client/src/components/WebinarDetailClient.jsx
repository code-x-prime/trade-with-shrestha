'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, Clock, CheckCircle2, Video, ShoppingCart, Loader2, Radio, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { webinarAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';
import SectionContainer from '@/components/detail/SectionContainer';
import PricingBox from '@/components/detail/PricingBox';

export default function WebinarDetailClient({ webinar: initialWebinar }) {
  const webinar = initialWebinar;
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    enrolled: false,
    canAccessLink: false,
    googleMeetLink: null,
    loading: true
  });
  const [countdown, setCountdown] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (webinar && isAuthenticated) {
      checkEnrollment();
    } else {
      setEnrollmentStatus({ enrolled: false, canAccessLink: false, googleMeetLink: null, loading: false });
    }
  }, [webinar?.id, isAuthenticated]);

  useEffect(() => {
    if (webinar?.startDate) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [webinar?.startDate, webinar?.startTime]);

  // Periodically check enrollment status when enrolled but link not yet available
  useEffect(() => {
    if (enrollmentStatus.enrolled && !enrollmentStatus.canAccessLink && webinar?.startDate && isAuthenticated) {
      const now = new Date();
      const sessionStart = new Date(webinar.startDate);
      const tenMinutesBefore = new Date(sessionStart.getTime() - 10 * 60 * 1000);
      const timeUntil10Min = tenMinutesBefore.getTime() - now.getTime();

      if (timeUntil10Min > 0 && timeUntil10Min <= 60000) {
        // Check every 30 seconds when we're close to 10 minutes before
        const interval = setInterval(() => {
          checkEnrollment();
        }, 30000);
        return () => clearInterval(interval);
      } else if (timeUntil10Min <= 0) {
        // Already past 10 minutes, check immediately and then every minute
        checkEnrollment();
        const interval = setInterval(() => {
          checkEnrollment();
        }, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [enrollmentStatus.enrolled, enrollmentStatus.canAccessLink, webinar?.startDate, isAuthenticated]);

  const updateCountdown = () => {
    if (!webinar.startDate) return;
    const now = new Date();
    const sessionStart = new Date(webinar.startDate);
    const durationMinutes = webinar.duration || 60;
    const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);

    if (now > sessionEnd) {
      setCountdown(null);
      setIsLive(false);
      return;
    }

    const diff = sessionStart.getTime() - now.getTime();

    if (diff <= 0) {
      setCountdown(null);
      setIsLive(true);
      if (enrollmentStatus.enrolled) {
        checkEnrollment();
      }
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    }
  };

  const checkEnrollment = async () => {
    if (!webinar?.id || !isAuthenticated) {
      setEnrollmentStatus({ enrolled: false, canAccessLink: false, googleMeetLink: null, loading: false });
      return;
    }
    try {
      setEnrollmentStatus(prev => ({ ...prev, loading: true }));
      const response = await webinarAPI.checkEnrollment(webinar.id);
      if (response.success) {
        setEnrollmentStatus({
          enrolled: response.data.enrolled,
          canAccessLink: response.data.canAccessLink,
          googleMeetLink: response.data.googleMeetLink || null,
          loading: false,
        });
      } else {
        setEnrollmentStatus({ enrolled: false, canAccessLink: false, googleMeetLink: null, loading: false });
      }
    } catch (error) {
      setEnrollmentStatus({ enrolled: false, canAccessLink: false, googleMeetLink: null, loading: false });
    }
  };

  const addToCart = async () => {
    const webinarCart = JSON.parse(localStorage.getItem('webinarCart') || '[]');
    if (webinarCart.includes(webinar.id)) {
      toast.info('Already in cart!');
      return;
    }

    try {
      const { addToCart: addToCartUtil } = await import('@/lib/cartUtils');
      await addToCartUtil('WEBINAR', webinar.id, isAuthenticated);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const formatCountdown = () => {
    if (!countdown) return null;
    const { days, hours, minutes, seconds } = countdown;
    return `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
  };

  const checkIfEnded = () => {
    if (!webinar.startDate) return false;
    const now = new Date();
    const sessionStart = new Date(webinar.startDate);
    const durationMinutes = webinar.duration || 60;
    const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);
    return now > sessionEnd;
  };

  const hasEnded = checkIfEnded();
  const startDate = webinar.startDate ? new Date(webinar.startDate) : null;

  if (!webinar) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Webinar not found</h2>
        <Button asChild>
          <a href="/webinars">Back to Webinars</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Event-Based with Urgency */}
      <div className="bg-gradient-to-br from-red-50/50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Webinars', href: '/webinars' },
            { label: webinar.title }
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mt-8">
            {/* Main Hero Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video/Image Preview */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 shadow-xl">
                {webinar.thumbnailVideoUrl ? (
                  <div className="relative w-full h-full">
                    <iframe
                      src={webinar.thumbnailVideoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : webinar.imageUrl ? (
                  <Image
                    src={getPublicUrl(webinar.imageUrl)}
                    alt={webinar.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100">
                    <Video className="h-24 w-24 text-red-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge className={`text-sm font-semibold ${webinar.type === 'LIVE' ? 'bg-red-500' :
                    webinar.type === 'WORKSHOP' ? 'bg-purple-500' :
                      'bg-green-500'
                    }`}>
                    {webinar.type}
                  </Badge>
                </div>
              </div>

              {/* Title & Meta */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                    {webinar.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="text-sm">{webinar.type}</Badge>
                    {webinar.isFree && (
                      <Badge className="bg-green-500 text-sm">Free</Badge>
                    )}
                  </div>
                </div>

                {/* Countdown Timer - Urgency */}
                {startDate && (
                  <Card className={`border-2 ${hasEnded ? 'border-gray-300 bg-gray-50' :
                    isLive ? 'border-red-500 bg-red-50' :
                      'border-orange-300 bg-orange-50'
                    }`}>
                    <CardContent className="p-6">
                      {hasEnded ? (
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-6 w-6 text-gray-600" />
                          <div>
                            <p className="font-bold text-lg text-gray-900">Session Ended</p>
                            <p className="text-sm text-gray-600">This webinar has concluded</p>
                          </div>
                        </div>
                      ) : isLive ? (
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-bold text-lg text-red-900">🔴 Live Now</p>
                            <p className="text-sm text-red-700">Join the session in progress</p>
                          </div>
                        </div>
                      ) : countdown ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <p className="text-sm font-medium text-orange-900">Live starts in:</p>
                          </div>
                          <p className="font-bold text-3xl font-mono text-orange-900">{formatCountdown()}</p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}

                {/* Date & Time */}
                {startDate && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-700">
                    <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-semibold dark:text-white">
                        {startDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      {webinar.startTime && (
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          {webinar.startTime} ({webinar.duration || 60} minutes)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Sidebar */}
            <div className="lg:col-span-1">
              <PricingBox
                price={webinar.price}
                salePrice={webinar.salePrice}
                pricing={webinar.pricing}
                isFree={webinar.isFree}
                features={[
                  'Live Interactive Session',
                  'Q&A with Expert',
                  'Recording Access',
                  'Certificate of Participation'
                ]}
                ctaLabel={enrollmentStatus.loading ? 'Checking...' : enrollmentStatus.enrolled ? 'Join Live' : webinar.isFree ? 'Enroll Now' : 'Add to Cart'}
                onCtaClick={enrollmentStatus.enrolled ? () => { } : webinar.isFree ? addToCart : addToCart}
                ctaVariant={enrollmentStatus.enrolled ? 'bg-green-600 hover:bg-green-700' : 'default'}
                className="border-2 border-red-100"
              >
                {enrollmentStatus.loading ? (
                  <Button disabled className="w-full">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </Button>
                ) : enrollmentStatus.enrolled ? (
                  <div className="space-y-3">
                    {enrollmentStatus.canAccessLink && enrollmentStatus.googleMeetLink ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        asChild
                      >
                        <a href={enrollmentStatus.googleMeetLink} target="_blank" rel="noopener noreferrer">
                          <Radio className="h-4 w-4 mr-2" />
                          Join Live
                        </a>
                      </Button>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Session Starting Soon</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          The Google Meet link will be available 10 minutes before the session starts. You&apos;ll also receive it via email.
                        </p>
                      </div>
                    )}
                  </div>
                ) : webinar.isFree ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={addToCart}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Enroll Now
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={addToCart}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </PricingBox>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Webinar */}
            <SectionContainer title="About This Webinar">
              <div
                className="prose prose-lg max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: webinar.description }}
              />
            </SectionContainer>

            {/* What You Will Learn */}
            {webinar.whatYouWillLearn && Array.isArray(webinar.whatYouWillLearn) && webinar.whatYouWillLearn.length > 0 && (
              <SectionContainer title="What You Will Learn">
                <div className="grid gap-3">
                  {webinar.whatYouWillLearn.map((point, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-500 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground dark:text-gray-300">{point.trim()}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Speaker Bio */}
            <SectionContainer title="Know Your Speaker">
              <Card className="border-2 dark:border-gray-700 dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {webinar.instructorImageUrl && (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 dark:border-gray-600 flex-shrink-0">
                        <Image
                          src={getPublicUrl(webinar.instructorImageUrl)}
                          alt={webinar.instructorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-bold mb-2 dark:text-white">{webinar.instructorName}</h3>
                      {webinar.instructorYearsExperience && (
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
                          {webinar.instructorYearsExperience} {webinar.instructorYearsExperience === 1 ? 'Year' : 'Years'} of Experience
                        </p>
                      )}
                      {webinar.instructorDescription && (
                        <div
                          className="text-sm text-muted-foreground dark:text-gray-400 prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: webinar.instructorDescription }}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SectionContainer>

            {/* FAQs */}
            {webinar.faqs && Array.isArray(webinar.faqs) && webinar.faqs.length > 0 && (
              <SectionContainer title="Frequently Asked Questions">
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {webinar.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`faq-${index}`}
                      className="border-2 dark:border-gray-700 rounded-lg dark:bg-gray-900"
                    >
                      <AccordionTrigger className="px-4 py-3 text-left font-medium hover:no-underline dark:text-white">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-muted-foreground dark:text-gray-400">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </SectionContainer>
            )}

            {/* Disclaimer */}
            <Card className="border-2 border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/20">
              <CardContent className="p-6">
                <p className="text-xs text-muted-foreground dark:text-gray-400 leading-relaxed">
                  <strong>Disclaimer:</strong> The trade ideas, analyses, and strategies shared on this platform are for educational purposes only, and should not be interpreted as financial advice. Shrestha Academy is not responsible for any losses resulting from applying the knowledge gained through the program. Shrestha Academy is merely providing a platform to trainers to provide stock market and financial education, the content shared is that of the trainer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
