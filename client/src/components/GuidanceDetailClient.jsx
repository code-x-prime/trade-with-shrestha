'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Clock, Globe, ExternalLink, Loader2, Sparkles, Award, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { guidanceAPI, orderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addToCart as addToCartUtil } from '@/lib/cartUtils';
import { getPublicUrl } from '@/lib/imageUtils';
import SectionContainer from '@/components/detail/SectionContainer';

export default function GuidanceDetailClient({ guidance: initialGuidance }) {
  const guidance = initialGuidance;
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ booked: false, canAccessLink: false, googleMeetLink: null, loading: false });

  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSlot && isAuthenticated) {
      checkBookingStatus();
    }
  }, [selectedSlot, isAuthenticated]);

  // Periodically check booking status when booked but link not yet available
  useEffect(() => {
    if (bookingStatus.booked && !bookingStatus.canAccessLink && selectedSlot && isAuthenticated) {
      const slot = slots.find(s => s.id === selectedSlot);
      if (slot) {
        const now = new Date();
        const slotDate = new Date(slot.date);
        const [hours, minutes] = slot.startTime.split(":").map(Number);
        slotDate.setHours(hours, minutes, 0, 0);
        const tenMinutesBefore = new Date(slotDate.getTime() - 10 * 60 * 1000);
        const timeUntil10Min = tenMinutesBefore.getTime() - now.getTime();

        if (timeUntil10Min > 0 && timeUntil10Min <= 60000) {
          // Check every 30 seconds when we're close to 10 minutes before
          const interval = setInterval(() => {
            checkBookingStatus();
          }, 30000);
          return () => clearInterval(interval);
        } else if (timeUntil10Min <= 0) {
          // Already past 10 minutes, check immediately and then every minute
          checkBookingStatus();
          const interval = setInterval(() => {
            checkBookingStatus();
          }, 60000);
          return () => clearInterval(interval);
        }
      }
    }
  }, [bookingStatus.booked, bookingStatus.canAccessLink, selectedSlot, isAuthenticated, slots]);

  const fetchSlotsForDate = async () => {
    if (!selectedDate || !guidance?.id) return;
    try {
      setLoadingSlots(true);
      const response = await guidanceAPI.getAvailableSlots(guidance.id, { date: selectedDate });
      if (response.success) {
        setSlots(response.data.slots);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const checkBookingStatus = async () => {
    if (!selectedSlot || !isAuthenticated) return;
    try {
      setBookingStatus(prev => ({ ...prev, loading: true }));
      const response = await orderAPI.checkGuidanceBooking(selectedSlot);
      if (response.success) {
        setBookingStatus({
          booked: response.data.booked,
          canAccessLink: response.data.canAccessLink,
          googleMeetLink: response.data.googleMeetLink,
          loading: false,
        });
      }
    } catch (error) {
      setBookingStatus({ booked: false, canAccessLink: false, googleMeetLink: null, loading: false });
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot.id);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      toast.error('Please select a slot');
      return;
    }

    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) {
      toast.error('Slot not found');
      return;
    }

    const guidanceCart = JSON.parse(localStorage.getItem('guidanceCart') || '[]');

    if (guidanceCart.some(item => item.slotId === selectedSlot)) {
      toast.info('This slot is already in your cart');
      return;
    }

    const cartItem = {
      slotId: selectedSlot,
      id: guidance.id, // Add id for backend sync
      guidanceId: guidance.id,
      guidanceTitle: guidance.title,
      guidanceSlug: guidance.slug,
      expertName: guidance.expertName,
      expertImageUrl: guidance.expertImageUrl,
      price: guidance.pricing?.effectivePrice || guidance.price,
      originalPrice: guidance.price,
      pricing: guidance.pricing,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: guidance.durationMinutes,
    };

    guidanceCart.push(cartItem);
    localStorage.setItem('guidanceCart', JSON.stringify(guidanceCart));

    // Also update the cartItems legacy key for sync
    const currentCartItems = JSON.parse(localStorage.getItem('cartItems') || '{}');
    currentCartItems.guidanceCart = guidanceCart;
    localStorage.setItem('cartItems', JSON.stringify(currentCartItems));

    // Sync to backend if logged in
    if (isAuthenticated) {
      try {
        await addToCartUtil('GUIDANCE', guidance.id, isAuthenticated);
      } catch (error) {
        console.error('Failed to sync to backend:', error);
      }
    }

    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Slot added to cart!');
    router.push('/cart');
  };

  const handleJoinCall = () => {
    if (bookingStatus.googleMeetLink) {
      window.open(bookingStatus.googleMeetLink, '_blank');
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  if (!guidance) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Guidance not found</h2>
        <Button asChild>
          <a href="/guidance">Back to Guidance</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Luxury Service Style */}
      <div className="bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: '1:1 Guidance', href: '/guidance' },
            { label: guidance.title }
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mt-8">
            {/* Left: Expert Profile Hero */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Expert Image - Circular, Premium */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-purple-100 shadow-xl mx-auto sm:mx-0 flex-shrink-0">
                  {guidance.expertImageUrl ? (
                    <Image
                      src={getPublicUrl(guidance.expertImageUrl)}
                      alt={guidance.expertName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                      <User className="h-16 w-16 text-purple-600" />
                    </div>
                  )}
                </div>

                {/* Expert Info */}
                <div className="flex-1 text-center sm:text-left space-y-4">
                  <div>
                    <Badge className="mb-3 bg-purple-100 text-purple-700 border-purple-300">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Expert Consultation
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                      {guidance.title}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                      <User className="h-5 w-5 text-purple-600" />
                      <span className="text-xl font-semibold text-foreground">{guidance.expertName}</span>
                    </div>
                    {guidance.expertBio && (
                      <div
                        className="prose prose-sm max-w-none text-muted-foreground dark:text-gray-400 dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: guidance.expertBio }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking Widget - Moved to Hero */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-2 border-purple-100 dark:border-gray-700 dark:bg-gray-900">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    {guidance.pricing?.hasFlashSale ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-orange-500 font-semibold text-sm">
                          <span>⚡ {guidance.pricing.flashSaleTitle || 'Flash Sale'}</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">₹{guidance.pricing.effectivePrice.toLocaleString('en-IN')}</div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-muted-foreground dark:text-gray-500 line-through text-sm">₹{guidance.price.toLocaleString('en-IN')}</span>
                          <span className="text-sm text-orange-600 font-semibold">({guidance.pricing.discountPercent}% OFF)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">₹{guidance.price.toLocaleString('en-IN')}</div>
                    )}
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{guidance.durationMinutes} min</span>
                      </div>
                      {guidance.language && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span>{guidance.language}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Selector */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm dark:text-white">Select Date</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {availableDates.map((date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        const isSelected = selectedDate === dateStr;
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return (
                          <button
                            key={dateStr}
                            onClick={() => handleDateSelect(dateStr)}
                            className={`p-2 text-sm rounded-lg border-2 transition-colors ${isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                              : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-gray-600 dark:text-gray-200'
                              }`}
                          >
                            <div className="font-semibold">{day}</div>
                            <div className="text-xs opacity-75">{monthNames[date.getMonth()]}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot Selector */}
                  {selectedDate && (
                    <div>
                      <h3 className="font-semibold mb-3 text-sm dark:text-white">Available Slots</h3>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground dark:text-gray-400 text-xs">
                          No slots available for this date
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slots.map((slot) => {
                            const isSelected = selectedSlot === slot.id;
                            const isBooked = slot.status === 'BOOKED' || slot.order;
                            return (
                              <button
                                key={slot.id}
                                onClick={() => !isBooked && handleSlotSelect(slot)}
                                disabled={isBooked}
                                className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${isBooked
                                  ? 'bg-muted dark:bg-gray-800 text-muted-foreground cursor-not-allowed opacity-50 border-muted dark:border-gray-700'
                                  : isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                                    : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-gray-600 cursor-pointer dark:text-gray-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                  {isBooked && (
                                    <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                                      Booked
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {selectedSlot && (
                    <div className="space-y-3 pt-4 border-t">
                      {bookingStatus.booked ? (
                        <>
                          {bookingStatus.canAccessLink ? (
                            <Button
                              onClick={handleJoinCall}
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={!bookingStatus.googleMeetLink}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Join Live Call
                            </Button>
                          ) : (
                            <div className="text-center text-sm text-muted-foreground p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Call Starting Soon</p>
                              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                                The Google Meet link will be available 10 minutes before the scheduled time. You&apos;ll also receive it via email.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={handleBookSlot}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  )}

                  {!selectedSlot && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Select a date and time slot to book
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Expertise Tags */}
            {guidance.expertise && Array.isArray(guidance.expertise) && guidance.expertise.length > 0 && (
              <SectionContainer title="Areas of Expertise">
                <div className="flex flex-wrap gap-3">
                  {guidance.expertise.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="px-4 py-2 text-sm font-medium border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30">
                      <Award className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* About Session */}
            {guidance.description && (
              <SectionContainer title="About This Session">
                <div
                  className="prose prose-lg max-w-none text-muted-foreground leading-relaxed dark:text-gray-400 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: guidance.description }}
                />
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
