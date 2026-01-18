'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExternalLink, Calendar, Clock, User, CheckCircle2, Video, ShoppingCart, Loader2, Users, Award, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { mentorshipAPI, orderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addToCart as addToCartUtil } from '@/lib/cartUtils';
import { getPublicUrl } from '@/lib/imageUtils';
import SectionContainer from '@/components/detail/SectionContainer';
import PricingBox from '@/components/detail/PricingBox';

export default function MentorshipDetailClient({ mentorship: initialMentorship }) {
  const mentorship = initialMentorship;
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    isEnrolled: false,
    canAccessLink: false,
    googleMeetLink: null,
    activeSession: null,
    loading: true
  });
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (mentorship && isAuthenticated) {
      checkEnrollment();
      fetchSessions();
    } else {
      setEnrollmentStatus({ isEnrolled: false, canAccessLink: false, googleMeetLink: null, activeSession: null, loading: false });
    }
  }, [mentorship?.id, isAuthenticated]);

  useEffect(() => {
    if (enrollmentStatus.isEnrolled) {
      // Check every minute if enrolled
      const interval = setInterval(() => {
        checkEnrollment();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [enrollmentStatus.isEnrolled]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await mentorshipAPI.getSessions(mentorship.id);
      if (response.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const checkEnrollment = async () => {
    if (!mentorship?.id || !isAuthenticated) {
      setEnrollmentStatus({ isEnrolled: false, canAccessLink: false, googleMeetLink: null, activeSession: null, loading: false });
      return;
    }
    try {
      setEnrollmentStatus(prev => ({ ...prev, loading: true }));
      const response = await mentorshipAPI.checkEnrollment(mentorship.id);
      if (response.success) {
        setEnrollmentStatus({
          isEnrolled: response.data.isEnrolled,
          canAccessLink: response.data.canAccessLink,
          googleMeetLink: response.data.googleMeetLink || null,
          activeSession: response.data.activeSession || null,
          loading: false,
        });
      } else {
        setEnrollmentStatus({ isEnrolled: false, canAccessLink: false, googleMeetLink: null, activeSession: null, loading: false });
      }
    } catch (error) {
      setEnrollmentStatus({ isEnrolled: false, canAccessLink: false, googleMeetLink: null, activeSession: null, loading: false });
    }
  };

  const handleAddToCart = async () => {
    try {
      const mentorshipCart = JSON.parse(localStorage.getItem('mentorshipCart') || '[]');
      const existingItem = mentorshipCart.find(item => item.id === mentorship.id);

      if (existingItem) {
        toast.info('Already in cart');
        return;
      }

      // Add to localStorage with full object
      mentorshipCart.push({
        id: mentorship.id,
        title: mentorship.title,
        slug: mentorship.slug,
        price: mentorship.isFree ? 0 : (mentorship.salePrice || mentorship.price),
        isFree: mentorship.isFree,
        coverImageUrl: mentorship.coverImageUrl,
      });
      localStorage.setItem('mentorshipCart', JSON.stringify(mentorshipCart));

      // Also sync to backend if logged in
      await addToCartUtil('MENTORSHIP', mentorship.id, isAuthenticated);

      toast.success('Added to cart');
      router.push('/cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleEnrollFree = async () => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      const response = await orderAPI.createMentorshipOrder(mentorship.id, null);
      if (response.success) {
        toast.success('Successfully enrolled!');
        await checkEnrollment();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to enroll');
    }
  };

  const handleJoinLive = () => {
    if (enrollmentStatus.googleMeetLink) {
      window.open(enrollmentStatus.googleMeetLink, '_blank');
    } else {
      toast.info('Join link will be available 10 minutes before the session starts');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatSessionDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateSessionsStatus = () => {
    if (!sessions.length) return { conducted: 0, total: mentorship.totalSessions };
    const now = new Date();
    let conducted = 0;

    sessions.forEach(session => {
      const sessionDate = new Date(session.sessionDate);
      const [hours, minutes] = session.startTime.split(':').map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);

      if (now > sessionDate) {
        conducted++;
      }
    });

    return { conducted, total: sessions.length };
  };

  const sessionsStatus = calculateSessionsStatus();
  const programStarted = new Date(mentorship.startDate) <= new Date();
  const programEnded = new Date(mentorship.endDate) < new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Premium Cohort Program */}
      <div className="bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Live Mentorship', href: '/mentorship' },
              { label: mentorship.title },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mt-8">
            {/* Main Hero Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover Image */}
              {mentorship.coverImageUrl && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 shadow-xl">
                  <Image
                    src={getPublicUrl(mentorship.coverImageUrl)}
                    alt={mentorship.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Program Title & Meta */}
              <div className="space-y-4">
                <div>
                  <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-emerald-300">
                    <Users className="h-3 w-3 mr-1" />
                    Premium Cohort Program
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                    {mentorship.title}
                  </h1>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium dark:text-white">Starts: {formatDate(mentorship.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <Video className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium dark:text-white">{mentorship.totalSessions} Live Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium dark:text-white">Expert-Led</span>
                  </div>
                </div>

                {/* Program Status */}
                {programStarted && !programEnded && (
                  <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-900">Program In Progress</span>
                      </div>
                      <p className="text-sm text-emerald-700">
                        {sessionsStatus.conducted} out of {sessionsStatus.total} sessions completed.
                        You can still attend remaining live sessions and access recordings.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Pricing Sidebar */}
            <div className="lg:col-span-1">
              <PricingBox
                price={mentorship.price}
                salePrice={mentorship.salePrice}
                pricing={mentorship.pricing}
                isFree={mentorship.isFree}
                features={[
                  `${mentorship.totalSessions} Live Sessions`,
                  'Access to Recordings',
                  'Expert Guidance',
                  'Community Support'
                ]}
                ctaLabel={enrollmentStatus.loading ? 'Checking...' : enrollmentStatus.isEnrolled ? 'Join Live Session' : mentorship.isFree ? 'Enroll for Free' : 'Add to Cart'}
                onCtaClick={enrollmentStatus.isEnrolled ? handleJoinLive : mentorship.isFree ? handleEnrollFree : handleAddToCart}
                ctaVariant={enrollmentStatus.isEnrolled ? 'bg-green-600 hover:bg-green-700' : 'default'}
                className="border-2 border-emerald-100"
              >
                {enrollmentStatus.loading ? (
                  <Button disabled className="w-full">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </Button>
                ) : enrollmentStatus.isEnrolled ? (
                  <div className="space-y-3">
                    {enrollmentStatus.canAccessLink && enrollmentStatus.googleMeetLink ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleJoinLive}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Live Session
                      </Button>
                    ) : enrollmentStatus.activeSession ? (
                      <div className="text-center text-sm text-muted-foreground p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                        <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Session Starting Soon</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                          The Google Meet link will be available 10 minutes before the session starts. You&apos;ll also receive it via email.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Badge className="bg-green-500 mb-2">Enrolled</Badge>
                        <p className="text-sm text-muted-foreground">You are enrolled in this program</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={mentorship.isFree ? handleEnrollFree : handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {mentorship.isFree ? 'Enroll for Free' : 'Add to Cart'}
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
            {/* About Program */}
            <SectionContainer title="About This Program">
              <div
                className="prose prose-lg max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: mentorship.description }}
              />
            </SectionContainer>

            {/* Program Overview */}
            {mentorship.programOverview && Array.isArray(mentorship.programOverview) && mentorship.programOverview.length > 0 && (
              <SectionContainer title="Program Overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorship.programOverview.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-500 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Who is this for */}
            {mentorship.whoIsThisFor && Array.isArray(mentorship.whoIsThisFor) && mentorship.whoIsThisFor.length > 0 && (
              <SectionContainer title="Who is this program for">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorship.whoIsThisFor.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 hover:border-brand-200 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* What you will learn */}
            {mentorship.whatYouWillLearn && Array.isArray(mentorship.whatYouWillLearn) && mentorship.whatYouWillLearn.length > 0 && (
              <SectionContainer title="What you will learn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorship.whatYouWillLearn.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 hover:border-emerald-200 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Key concepts required */}
            {mentorship.keyConceptsRequired && Array.isArray(mentorship.keyConceptsRequired) && mentorship.keyConceptsRequired.length > 0 && (
              <SectionContainer title="Key concepts you should know before joining">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorship.keyConceptsRequired.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 hover:border-amber-200 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Sessions Timeline */}
            {sessions.length > 0 && (
              <SectionContainer title="Session Timeline">
                <div className="space-y-3">
                  {sessions.map((session, index) => {
                    const sessionDate = new Date(session.sessionDate);
                    const [hours, minutes] = session.startTime.split(':').map(Number);
                    sessionDate.setHours(hours, minutes, 0, 0);
                    const [endHours, endMinutes] = session.endTime.split(':').map(Number);
                    const sessionEnd = new Date(sessionDate);
                    sessionEnd.setHours(endHours, endMinutes, 0, 0);
                    const now = new Date();
                    const tenMinutesBefore = new Date(sessionDate.getTime() - 10 * 60000);
                    const isLive = now >= sessionDate && now <= sessionEnd;
                    const canJoin = enrollmentStatus.isEnrolled && now >= tenMinutesBefore && now <= sessionEnd;
                    const isPast = now > sessionEnd;
                    const isActiveSession = enrollmentStatus.activeSession?.id === session.id;

                    return (
                      <Card key={session.id} className={`border-2 ${isLive && enrollmentStatus.isEnrolled ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-border dark:border-gray-800 dark:bg-gray-900/50'}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="font-semibold dark:border-gray-600 dark:text-gray-300">Session {session.order}</Badge>
                                {isLive && enrollmentStatus.isEnrolled && (
                                  <Badge className="bg-green-500 dark:bg-green-600 dark:text-white">Live Now</Badge>
                                )}
                                {isPast && (
                                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-400">Completed</Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg mb-2 dark:text-white">{session.title}</h3>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-muted-foreground dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatSessionDate(session.sessionDate)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{session.startTime} - {session.endTime}</span>
                                </div>
                              </div>
                            </div>
                            {canJoin && isActiveSession && enrollmentStatus.googleMeetLink && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleJoinLive}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Join Live
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </SectionContainer>
            )}

            {/* FAQs */}
            {mentorship.faqs && Array.isArray(mentorship.faqs) && mentorship.faqs.length > 0 && (
              <SectionContainer title="Frequently Asked Questions">
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {mentorship.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`faq-${index}`}
                      className="border-2 dark:border-gray-700 rounded-lg dark:bg-gray-900/50"
                    >
                      <AccordionTrigger className="px-4 py-3 text-left font-medium hover:no-underline dark:text-gray-200">
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
            <Card className="border-2 border-amber-100 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/30">
              <CardContent className="p-6">
                <p className="text-xs text-muted-foreground leading-relaxed dark:text-amber-200/70">
                  <strong>Disclaimer:</strong> The trade ideas, analyses, and strategies shared on this platform are for educational purposes only, and should not be interpreted as financial advice. Shrestha Academy is not responsible for any losses resulting from applying the knowledge gained through the program. Shrestha Academy is merely providing a platform to trainers to provide stock market and financial education, the content shared is that of the trainer.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Instructor */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 dark:border-gray-700 dark:bg-gray-900">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Your Instructor</h3>
                {mentorship.instructorImageUrl ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 dark:border-gray-600 mb-4 mx-auto">
                    <Image
                      src={getPublicUrl(mentorship.instructorImageUrl)}
                      alt={mentorship.instructorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center mb-4 mx-auto">
                    <User className="h-12 w-12 text-muted-foreground dark:text-gray-400" />
                  </div>
                )}
                <h4 className="text-lg font-semibold text-center mb-3 dark:text-white">{mentorship.instructorName}</h4>
                {mentorship.instructorBio && (
                  <div
                    className="text-sm text-muted-foreground dark:text-gray-400 prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: mentorship.instructorBio }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
