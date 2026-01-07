'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI, orderAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Globe, ShoppingCart, Play, CheckCircle2, Lock, Star, MessageSquare,  Award} from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import PricingBox from '@/components/detail/PricingBox';
import SectionContainer from '@/components/detail/SectionContainer';

export default function CourseDetailClient({ course: initialCourse }) {
  const course = initialCourse;
  const { isAuthenticated} = useAuth();
  const router = useRouter();
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false, loading: true });
  const [progress, setProgress] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

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
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Hero Section - Academic Style */}
      <div className="bg-gradient-to-br from-brand-50 via-white to-brand-50/30 border-b dark:from-black dark:via-gray-900 dark:to-brand-950/80 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course.title },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6">
            {/* Main Hero Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Title & Meta */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 dark:text-white">
                    {course.title}
                  </h1>
                  <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl">
                    Master {course.title.toLowerCase()} with structured learning, expert guidance, and hands-on practice.
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                    <Globe className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span className="font-medium dark:text-gray-200">{getLanguageLabel(course.language)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                    <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span className="font-medium dark:text-gray-200">{totalChapters} Chapters</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium dark:text-gray-200">{averageRating.toFixed(1)} ({reviews.length})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Card (if enrolled) */}
              {enrollmentStatus.isEnrolled && progress && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
            <div className="lg:col-span-1">
              <PricingBox
                price={course.price}
                salePrice={course.salePrice}
                pricing={course.pricing}
                isFree={course.isFree}
                features={[
                  `${totalChapters} Video Chapters`,
                  'Lifetime Access',
                  'Progress Tracking',
                  'Certificate of Completion'
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
                ) : course.isFree ? (
                  <Button
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    onClick={handleEnrollFree}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Enroll for Free
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-brand-600 hover:bg-brand-700"
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
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image */}
            {(course.coverImageUrl || course.coverImage) && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 shadow-lg dark:border-gray-800">
                <Image
                  src={getPublicUrl(course.coverImageUrl || course.coverImage)}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* What You'll Learn */}
            <SectionContainer title="What You'll Learn">
              <div
                className="prose prose-lg max-w-none text-muted-foreground dark:text-gray-400 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </SectionContainer>

            {/* Course Curriculum */}
            {course.sessions && course.sessions.length > 0 && (
              <SectionContainer title="Course Curriculum">
                <div className="space-y-4">
                  {course.sessions.map((session) => (
                    <Card key={session.id} className="border-2 hover:border-brand-200 transition-colors dark:bg-gray-900 dark:border-gray-800 dark:hover:border-brand-800">
                      <CardContent className="p-6">
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
                            <h3 className="text-xl font-bold mb-2 dark:text-white">{session.title}</h3>
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
                            {session.chapters.map((chapter, idx) => {
                              const isLocked = !chapter.isFreePreview && !enrollmentStatus.isEnrolled;
                              const chapterProgress = progress?.progress?.find(p => p.chapter.id === chapter.id);
                              const isCompleted = chapterProgress?.completed || false;
                              
                              return (
                                <div
                                  key={chapter.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                    isLocked ? 'bg-muted/50 opacity-60 dark:bg-gray-800/50 dark:border-gray-800' : isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'hover:bg-muted border-border dark:border-gray-800 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    ) : isLocked ? (
                                      <Lock className="h-5 w-5 text-muted-foreground dark:text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-brand-600 flex items-center justify-center flex-shrink-0 dark:border-brand-400">
                                        <div className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                                      </div>
                                    )}
                                    <span className="font-medium dark:text-gray-200">
                                      {chapter.order}. {chapter.title}
                                    </span>
                                    {chapter.isFreePreview && (
                                      <Badge variant="outline" className="text-xs dark:text-gray-300 dark:border-gray-700">Free Preview</Badge>
                                    )}
                                  </div>
                                  {!isLocked && enrollmentStatus.isEnrolled && (
                                    <Link href={`/courses/${course.slug}/learn?chapter=${chapter.id}`}>
                                      <Button size="sm" variant="ghost">
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
              </SectionContainer>
            )}

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
                                  className={`h-6 w-6 ${
                                    star <= reviewForm.rating
                                      ? 'fill-yellow-400 text-yellow-400'
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
                    <Card key={review.id} className="dark:bg-gray-900 dark:border-gray-800">
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
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-semibold text-lg">
                              {review.user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg dark:text-white">{review.user.name || 'Anonymous'}</h3>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground dark:text-gray-400">{review.comment}</p>
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
