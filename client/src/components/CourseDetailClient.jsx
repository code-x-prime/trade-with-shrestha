'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI, orderAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Globe, ShoppingCart, Play, CheckCircle2, Lock, Star, MessageSquare, Award, Calendar, Video } from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import PricingBox from '@/components/detail/PricingBox';
import SectionContainer from '@/components/detail/SectionContainer';
import BookDemoDialog from '@/components/BookDemoDialog';
import { USE_STATIC, WHATSAPP_NUMBER, WHATSAPP_MESSAGE_TEMPLATE } from '@/lib/constants';

export default function CourseDetailClient({ course: initialCourse }) {
  const course = initialCourse;
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false, loading: true });
  const [progress, setProgress] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [bookDemoOpen, setBookDemoOpen] = useState(false);

  useEffect(() => {
    if (course?.id) {
      fetchReviews();
      if (isAuthenticated) {
        checkEnrollment();
        fetchUserReview();
      } else {
        setEnrollmentStatus({ isEnrolled: false, loading: false });
      }
    }
  }, [course?.id, isAuthenticated]);

  useEffect(() => {
    if (course?.id && isAuthenticated && enrollmentStatus.isEnrolled && !enrollmentStatus.loading) {
      fetchProgress();
    }
  }, [course?.id, isAuthenticated, enrollmentStatus.isEnrolled, enrollmentStatus.loading]);

  const checkEnrollment = async () => {
    if (!course?.id || !isAuthenticated) {
      setEnrollmentStatus({ isEnrolled: false, loading: false });
      return;
    }
    try {
      const response = await courseAPI.checkEnrollment(course.id);
      if (response.success) {
        setEnrollmentStatus({
          isEnrolled: response.data.isEnrolled,
          enrollmentId: response.data.enrollmentId,
          loading: false,
        });
      }
    } catch (error) {
      setEnrollmentStatus({ isEnrolled: false, loading: false });
    }
  };

  const fetchProgress = async () => {
    if (!course || !course.id || !isAuthenticated || !enrollmentStatus.isEnrolled) return;
    try {
      const response = await courseAPI.getCourseProgress(course.id);
      if (response.success) {
        setProgress(response.data);
      }
    } catch (error) {
      if (error.message?.includes('Not enrolled') || error.message?.includes('enrolled')) {
        return;
      }
      console.error('Failed to fetch progress:', error);
    }
  };

  const fetchReviews = async () => {
    if (!course?.id) return;
    try {
      const response = await courseAPI.getCourseReviews(course.id);
      if (response.success) {
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchUserReview = async () => {
    if (!course?.id || !isAuthenticated) return;
    try {
      const response = await courseAPI.getUserCourseReview(course.id);
      if (response.success && response.data.review) {
        setUserReview(response.data.review);
        setReviewForm({
          rating: response.data.review.rating,
          comment: response.data.review.comment || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user review:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error('Please select a rating');
      return;
    }

    if (!isAuthenticated) {
      router.push('/auth?mode=login');
      return;
    }

    try {
      setReviewLoading(true);
      const response = await courseAPI.createCourseReview(
        course.id,
        reviewForm.rating,
        reviewForm.comment
      );
      if (response.success) {
        toast.success('Review submitted successfully!');
        setUserReview(response.data.review);
        setShowReviewForm(false);
        fetchReviews();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const canReview = () => {
    if (!enrollmentStatus.isEnrolled || !progress) return false;
    return progress.overallProgress >= 50;
  };

  const addToCart = async () => {
    if (course.isFree) {
      return;
    }

    const courseCart = JSON.parse(localStorage.getItem('courseCart') || '[]');
    if (courseCart.includes(course.id)) {
      toast.info('Already in cart!');
      router.push('/cart');
      return;
    }

    try {
      const { addToCart: addToCartUtil } = await import('@/lib/cartUtils');
      await addToCartUtil('COURSE', course.id, isAuthenticated);
      toast.success('Added to cart!');
      router.push('/cart');
    } catch (error) {
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const handleEnrollFree = async () => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      const response = await orderAPI.createCourseOrder(course.id, null);
      if (response.success) {
        toast.success('Successfully enrolled!');
        await checkEnrollment();
        router.push('/courses/' + course.slug + '/learn');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to enroll');
    }
  };

  const getLanguageLabel = (language) => {
    switch (language) {
      case 'HINDI': return 'Hindi';
      case 'ENGLISH': return 'English';
      case 'MIXED': return 'Mixed';
      default: return language;
    }
  };

  const totalChapters = course.sessions?.reduce((sum, session) => sum + (session.chapters?.length || 0), 0) || 0;
  const completedChapters = progress?.completedChapters || 0;
  const overallProgress = progress?.overallProgress || 0;
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const deliveryMode = course.deliveryMode || 'BOTH';
  const showBookDemo = deliveryMode === 'ONLINE' || deliveryMode === 'BOTH';
  const showSelfPaced = deliveryMode === 'SELF_PACED' || deliveryMode === 'BOTH';
  const benefitsList = course.benefits && Array.isArray(course.benefits) ? course.benefits : [];
  const totalEnrollments = course?._count?.enrollments || 0;
  const categoryNames = (course?.categories || [])
    .map((item) => item?.category?.name)
    .filter(Boolean);

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Button asChild>
          <a href="/courses">Back to Courses</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      {/* Hero Section - Academic Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50/70 via-white to-blue-50/40 border-b border-slate-100 dark:from-black dark:via-gray-900 dark:to-gray-950 dark:border-gray-800">
        <div className="pointer-events-none absolute -top-28 -left-16 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl dark:bg-blue-500/10" />
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course.title },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6 relative z-10">
            {/* Main Hero Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Title & Meta */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
                    {course.title}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                    Master {course.title.toLowerCase()} with structured learning, expert guidance, and hands-on practice.
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <Globe className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    <span className="font-medium dark:text-gray-200">{getLanguageLabel(course.language)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    <span className="font-medium dark:text-gray-200">{totalChapters} Chapters</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-xl border border-blue-300 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                      <Star className="h-4 w-4 fill-blue-700 text-blue-700 dark:fill-blue-400 dark:text-blue-400" />
                      <span className="font-medium dark:text-gray-200">{averageRating.toFixed(1)} ({reviews.length})</span>
                    </div>
                  )}
                  {totalEnrollments > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                      <Award className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                      <span className="font-medium dark:text-gray-200">{totalEnrollments}+ Enrolled</span>
                    </div>
                  )}
                </div>
                {categoryNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {categoryNames.slice(0, 4).map((name) => (
                      <Badge
                        key={name}
                        variant="outline"
                        className="rounded-full border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Card (if enrolled) */}
              {enrollmentStatus.isEnrolled && progress && (
                <Card className="bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200 dark:from-blue-500/10 dark:to-blue-500/5 dark:border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        <span className="font-semibold text-blue-900 dark:text-blue-100">Your Learning Progress</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-3 mb-2" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {completedChapters} of {totalChapters} chapters completed
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pricing Box - Sticky */}
            <div className="lg:col-span-1 space-y-4">
              <PricingBox
                price={course.price}
                salePrice={course.salePrice}
                pricing={course.pricing}
                isFree={course.isFree}
                features={[
                  ...(benefitsList.length > 0 ? benefitsList : [
                    `${totalChapters} Video Chapters`,
                    'Lifetime Access',
                    'Progress Tracking',
                    'Certificate of Completion'
                  ])
                ]}
                ctaLabel={enrollmentStatus.loading ? 'Checking...' : enrollmentStatus.isEnrolled ? 'Continue Learning' : course.isFree ? 'Enroll for Free' : 'Add to Cart'}
                onCtaClick={enrollmentStatus.isEnrolled ? () => router.push(`/courses/${course.slug}/learn`) : course.isFree ? handleEnrollFree : addToCart}
                ctaVariant={enrollmentStatus.isEnrolled ? 'bg-green-600 hover:bg-green-700' : 'default'}
              >
                {enrollmentStatus.loading ? (
                  <Button disabled className="w-full">
                    <BookOpen className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </Button>
                ) : enrollmentStatus.isEnrolled ? (
                  <Link href={`/courses/${course.slug}/learn`} className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {USE_STATIC ? (
                      <Button
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => {
                          const message = WHATSAPP_MESSAGE_TEMPLATE.replace('[COURSE_NAME]', course.title);
                          window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                      >
                        <Image src="/whatsapp.png" alt="WhatsApp" width={20} height={20} />
                        Enroll via WhatsApp
                      </Button>
                    ) : (
                      <>
                        {showBookDemo && (
                          <>
                            <Button
                              variant="outline"
                              className="w-full border-brand-600 text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-900/30"
                              onClick={() => setBookDemoOpen(true)}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Book a Demo
                            </Button>
                            <BookDemoDialog
                              open={bookDemoOpen}
                              onOpenChange={setBookDemoOpen}
                              courseId={course.id}
                              courseTitle={course.title}
                              defaultName={isAuthenticated && user?.name ? user.name : ''}
                              defaultEmail={isAuthenticated && user?.email ? user.email : ''}
                              defaultPhone={isAuthenticated && user?.phone ? user.phone || '' : ''}
                            />
                          </>
                        )}
                        {course.isFree ? (
                          <Button className="w-full bg-brand-600 hover:bg-brand-700" onClick={handleEnrollFree}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Enroll for Free
                          </Button>
                        ) : showSelfPaced && (
                          <Button className="w-full bg-brand-600 hover:bg-brand-700" onClick={addToCart}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Self-paced Purchase
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </PricingBox>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image */}
            {(course.coverImageUrl || course.coverImage) && (
              <div className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 shadow-xl dark:border-gray-800">
                <Image
                  src={getPublicUrl(course.coverImageUrl || course.coverImage)}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent dark:from-black/40" />
              </div>
            )}

            {/* What You'll Learn */}
            <SectionContainer title="What You'll Learn">
              <div
                className="prose prose-lg max-w-none text-muted-foreground dark:text-gray-400 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </SectionContainer>

            {/* Benefits */}
            {benefitsList.length > 0 && (
              <SectionContainer title="Benefits">
                <ul className="grid gap-2 sm:grid-cols-1">
                  {benefitsList.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </SectionContainer>
            )}

            {/* Course Curriculum – same area: online = text curriculum, self-paced = video + lecture names */}
            <SectionContainer title="Curriculum">
              {(deliveryMode === 'ONLINE' || deliveryMode === 'BOTH') && course.curriculumText && (
                <div
                  className="prose prose-lg max-w-none text-muted-foreground dark:text-gray-400 dark:prose-invert mb-6"
                  dangerouslySetInnerHTML={{ __html: course.curriculumText }}
                />
              )}
              {course.sessions && course.sessions.length > 0 && (
                <div className="space-y-4">
                  {course.sessions.map((session) => (
                    <Card key={session.id} className="border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-500/30">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant="outline" className="font-semibold dark:text-gray-300 dark:border-gray-700">
                                Session {session.order}
                              </Badge>
                              {!session.isPublished && (
                                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 dark:text-gray-400">Draft</Badge>
                              )}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 dark:text-white">{session.title}</h3>
                            {session.description && (
                              <div
                                className="text-muted-foreground line-clamp-2 dark:text-gray-400 prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: session.description }}
                              />
                            )}
                          </div>
                        </div>
                        {session.chapters && session.chapters.length > 0 && (
                          <div className="mt-4 space-y-2 border-t pt-4">
                            {session.chapters.map((chapter) => {
                              const isLocked = !chapter.isFreePreview && !enrollmentStatus.isEnrolled;
                              const chapterProgress = progress?.progress?.find(p => p.chapter.id === chapter.id);
                              const isCompleted = chapterProgress?.completed || false;
                              const showVideoIcon = deliveryMode === 'SELF_PACED' || deliveryMode === 'BOTH';
                              return (
                                <div
                                  key={chapter.id}
                                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border transition-colors ${isLocked ? 'bg-muted/50 opacity-60 dark:bg-gray-800/50 dark:border-gray-800' : isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'hover:bg-muted border-border dark:border-gray-800 dark:hover:bg-gray-800'
                                    }`}
                                >
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    {showVideoIcon ? (
                                      <Video className="h-5 w-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                                    ) : isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    ) : isLocked ? (
                                      <Lock className="h-5 w-5 text-muted-foreground dark:text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-brand-600 flex items-center justify-center flex-shrink-0 dark:border-brand-400">
                                        <div className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium dark:text-gray-200 break-words">
                                        {chapter.order}. {chapter.title}
                                      </p>
                                      {chapter.isFreePreview && (
                                        <Badge variant="outline" className="mt-1 text-[11px] shrink-0 dark:text-gray-300 dark:border-gray-700">Free Preview</Badge>
                                      )}
                                    </div>
                                  </div>
                                  {!isLocked && enrollmentStatus.isEnrolled && (
                                    <Link href={`/courses/${course.slug}/learn?chapter=${chapter.id}`} className="w-full sm:w-auto">
                                      <Button size="sm" variant="ghost" className="w-full sm:w-auto hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                                        <Play className="h-4 w-4 mr-1" />
                                        Watch
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </SectionContainer>

            {/* Reviews Section */}
            <SectionContainer title={`Reviews (${reviews.length})`}>
              {isAuthenticated && enrollmentStatus.isEnrolled && canReview() && (
                <Card className="mb-6 border-2 dark:bg-gray-900 dark:border-gray-800">
                  <CardContent className="p-6">
                    {userReview ? (
                      // User already reviewed - show message, no edit allowed
                      <div className="text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">You have already reviewed this course</span>
                        </div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          Thank you for your feedback! Your review helps other students.
                        </p>
                      </div>
                    ) : !showReviewForm ? (
                      <Button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full"
                        variant="outline"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Write a Review
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating *</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-6 w-6 ${star <= reviewForm.rating
                                      ? 'fill-blue-700 text-blue-700 dark:fill-blue-400 dark:text-blue-400'
                                      : 'text-gray-300'
                                    }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block dark:text-gray-300">Comment (Optional)</label>
                          <Textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder="Share your experience with this course..."
                            rows={4}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSubmitReview}
                            disabled={reviewLoading}
                            className="flex-1"
                          >
                            {reviewLoading ? 'Submitting...' : 'Submit Review'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewForm({ rating: 0, comment: '' });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {reviews.length === 0 ? (
                <Card className="dark:bg-gray-900 dark:border-gray-800">
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 dark:text-gray-600" />
                    <p className="text-muted-foreground dark:text-gray-400">No reviews yet. Be the first to review!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-all dark:bg-gray-900 dark:border-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {review.user.avatarUrl ? (
                            <Image
                              src={review.user.avatarUrl}
                              alt={review.user.name || 'User'}
                              className="h-12 w-12 rounded-full object-cover"
                              width={640}
                              height={360}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-700 to-slate-600 dark:from-blue-500 dark:to-slate-400 flex items-center justify-center text-white dark:text-black font-semibold text-lg">
                              {review.user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-base sm:text-lg dark:text-white truncate">{review.user.name || 'Anonymous'}</h3>
                              <span className="text-sm text-muted-foreground dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.rating
                                        ? 'fill-blue-700 text-blue-700 dark:fill-blue-400 dark:text-blue-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                  />
                                ))}
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed break-words">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </SectionContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
