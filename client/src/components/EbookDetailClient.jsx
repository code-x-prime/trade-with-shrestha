'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI, ebookAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { addToCart as addToCartUtil } from '@/lib/cartUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Star, Users, BookOpen, Download, FileText, CheckCircle2, Share2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import Breadcrumb from '@/components/Breadcrumb';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getPublicUrl } from '@/lib/imageUtils';
import SectionContainer from '@/components/detail/SectionContainer';
import PricingBox from '@/components/detail/PricingBox';

export default function EbookDetailClient({ ebook: initialEbook }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [ebook, setEbook] = useState(initialEbook);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    if (ebook && isAuthenticated) {
      checkPurchaseStatus();
    } else {
      setHasPurchased(false);
      setCanReview(false);
    }
  }, [ebook, isAuthenticated]);

  const checkPurchaseStatus = async () => {
    if (!isAuthenticated || !ebook || !user) return;
    
    try {
      const response = await orderAPI.getOrders();
      if (response.success) {
        const orders = response.data.orders || [];
        const purchased = orders.some(order => {
          if (order.status !== 'COMPLETED') return false;
          return order.items?.some(item => {
            return item.ebookId === ebook.id || item.ebook?.id === ebook.id;
          });
        });
        setHasPurchased(purchased);
        const hasReviewed = ebook.reviews?.some(r => r.userId === user.id);
        setCanReview(purchased && !hasReviewed);
      }
    } catch (error) {
      console.error('Error checking purchase:', error);
      setHasPurchased(false);
      setCanReview(false);
    }
  };

  const addToCart = async () => {
    if (ebook.isFree) {
      return;
    }

    // Guest users can also add to cart (stored in localStorage)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.includes(ebook.id)) {
      toast.info('Already in cart!');
      router.push('/cart');
      return;
    }

    try {
      await addToCartUtil('EBOOK', ebook.id, isAuthenticated);
      toast.success('Added to cart!');
      router.push('/cart');
    } catch (error) {
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const enrollFreeEbook = async () => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      const response = await orderAPI.createOrder([ebook.id], null);
      if (response.success) {
        toast.success('Successfully enrolled! You can now download the e-book.');
        await checkPurchaseStatus();
        router.push('/profile/orders?success=true');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to enroll. Please try again.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await orderAPI.createReview(ebook.id, reviewRating, reviewComment);
      if (response.success) {
        setReviewRating(0);
        setReviewComment('');
        try {
          const refreshResponse = await ebookAPI.getEbookBySlug(ebook.slug);
          if (refreshResponse.success) {
            setEbook(refreshResponse.data.ebook);
          }
        } catch (error) {
          console.error('Error refreshing ebook:', error);
        }
        setCanReview(false);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!ebook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">E-book not found</p>
      </div>
    );
  }

  const averageRating = ebook.reviews.length > 0
    ? ebook.reviews.reduce((sum, r) => sum + r.rating, 0) / ebook.reviews.length
    : 0;

  const bookImages = [ebook.image1Url, ebook.image2Url, ebook.image3Url].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Publishing/Kindle Style */}
      <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'E-Books', href: '/ebooks' },
              { label: ebook.title },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mt-8">
            {/* Left: Book Cover */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {bookImages.length > 0 ? (
                  <Carousel
                    opts={{
                      align: "start",
                      loop: bookImages.length > 1,
                    }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {bookImages.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-amber-100 to-amber-200">
                            <Image
                              src={getPublicUrl(img)}
                              alt={`${ebook.title} - Cover ${idx + 1}`}
                              fill
                              className="object-cover"
                              priority={idx === 0}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {bookImages.length > 1 && (
                      <>
                        <CarouselPrevious className="hidden sm:flex -left-4 bg-white/90 hover:bg-white border-2 shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <CarouselNext className="hidden sm:flex -right-4 bg-white/90 hover:bg-white border-2 shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <BookOpen className="h-24 w-24 text-amber-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Book Details */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 leading-tight">
                    {ebook.title}
                  </h1>
                  {ebook.author && (
                    <p className="text-lg text-muted-foreground mb-4">
                      by <span className="font-semibold text-foreground">{ebook.author}</span>
                    </p>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {averageRating > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium dark:text-white">{averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground dark:text-gray-400">({ebook.reviews.length})</span>
                    </div>
                  )}
                  {ebook.pages > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <span className="font-medium dark:text-white">{ebook.pages} Pages</span>
                    </div>
                  )}
                  {ebook.purchaseCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <Users className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <span className="font-medium dark:text-white">{ebook.purchaseCount} Purchases</span>
                    </div>
                  )}
                </div>

                {ebook.shortDescription && (
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    {ebook.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <SectionContainer title="About This Book">
              <div
                className="prose prose-lg max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: ebook.description }}
              />
            </SectionContainer>

            {/* What's Inside */}
            {ebook.curriculum && ebook.curriculum.length > 0 && (
              <SectionContainer title="What's Inside">
                <div className="grid gap-3">
                  {ebook.curriculum.map((point, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-500 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground dark:text-gray-300">{point}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Reviews */}
            <SectionContainer title={`Reviews (${ebook.reviews.length})`}>
              {canReview && (
                <Card className="mb-6 border-2 dark:border-gray-700 dark:bg-gray-900">
                  <CardContent className="p-6">
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block dark:text-white">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-2xl"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block dark:text-white">Comment</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Write your review..."
                          className="w-full p-3 border rounded-lg min-h-[100px] dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>
                      <Button type="submit" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {ebook.reviews.length === 0 ? (
                <Card className="dark:bg-gray-900 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Star className="h-12 w-12 text-muted-foreground dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-gray-400">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {ebook.reviews.map((review) => (
                    <Card key={review.id} className="dark:bg-gray-900 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold text-lg">
                            {review.user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold dark:text-white">{review.user.name || 'Anonymous'}</h3>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground dark:text-gray-400">{review.comment}</p>
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <PricingBox
              price={ebook.price}
              salePrice={ebook.salePrice}
              pricing={ebook.pricing}
              isFree={ebook.isFree}
              features={[
                'Instant Download',
                'PDF Format',
                'Lifetime Access',
                'Mobile Friendly'
              ]}
              ctaLabel={hasPurchased && ebook.pdfUrl ? 'Download PDF' : ebook.isFree ? 'Enroll Now' : 'Add to Cart'}
              onCtaClick={hasPurchased && ebook.pdfUrl ? () => window.open(ebook.pdfUrl, '_blank') : ebook.isFree ? enrollFreeEbook : addToCart}
              ctaVariant={hasPurchased ? 'bg-green-600 hover:bg-green-700' : ebook.isFree ? 'bg-green-600 hover:bg-green-700' : 'default'}
            >
              <div className="space-y-3">
                {hasPurchased && ebook.pdfUrl ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <a href={ebook.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                ) : ebook.isFree ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={enrollFreeEbook}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Enroll Now
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    onClick={addToCart}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
                
                <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard');
                }}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </PricingBox>
          </div>
        </div>
      </div>
    </div>
  );
}
