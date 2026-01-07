'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User as UserIcon, Video, Zap, ArrowRight, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

const WebinarCard = ({ webinar, isEnrolled = false }) => {
  // Get effective price considering flash sale
  const hasFlashSale = webinar.pricing?.hasFlashSale;
  const effectivePrice = webinar.pricing?.effectivePrice ?? webinar.salePrice ?? webinar.price;
  const originalPrice = webinar.pricing?.displayOriginalPrice ?? webinar.price;
  const discountPercent = webinar.pricing?.discountPercent ?? (webinar.salePrice ? Math.round(((webinar.price - webinar.salePrice) / webinar.price) * 100) : 0);

  const formatDateTime = (date, time) => {
    if (!date) return { date: '-', time: '' };
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      time: time || d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatus = (startDate, duration) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(start.getTime() + (duration || 60) * 60000);

    if (now < start) return { label: 'Upcoming', variant: 'outline' };
    if (now >= start && now <= end) return { label: 'Live Now', variant: 'default', className: 'bg-red-500 hover:bg-red-600' };
    return { label: 'Ended', variant: 'secondary' };
  };

  const dateTime = formatDateTime(webinar.startDate, webinar.startTime);
  const status = getStatus(webinar.startDate, webinar.duration);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/webinars/${webinar.slug}`} className="block h-full">
        <Card className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-border dark:border-gray-800 cursor-pointer">
          <div>
            <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
              {webinar.imageUrl ? (
                <Image
                  src={getPublicUrl(webinar.imageUrl)}
                  alt={webinar.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 text-white mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-semibold">{dateTime.date}</span>
                </div>
                {dateTime.time && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">{dateTime.time}</span>
                  </div>
                )}
              </div>
              {/* Flash Sale Badge */}
              {hasFlashSale && !webinar.isFree ? (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-2 py-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {discountPercent}% OFF
                  </Badge>
                </div>
              ) : null}
              <div className="absolute top-3 right-3">
                <Badge className={status.className || 'bg-white/20 text-white border-white/40 backdrop-blur-md'} variant={status.variant}>
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="p-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white hover:text-hero-primary dark:hover:text-[#9ca0ff] transition-colors line-clamp-2 leading-snug">
              {webinar.title}
            </h3>

            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400 mb-3">
              <UserIcon className="h-4 w-4" />
              <span className="line-clamp-1">{webinar.instructorName}</span>
            </div>

            <div className="mt-auto pt-3 border-t dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                {webinar.isFree ? (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-1.5">
                    FREE
                  </Badge>
                ) : (
                  <div className="space-y-0.5">
                    {hasFlashSale ? (
                      <>
                        <div className="flex items-center gap-1 text-orange-500 text-[10px] font-semibold uppercase tracking-wide">
                          <Zap className="h-3 w-3" />
                          Flash Sale
                        </div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-lg font-bold text-hero-primary dark:text-[#9ca0ff]">
                            ₹{effectivePrice.toLocaleString('en-IN')}
                          </div>
                          <div className="text-xs text-muted-foreground dark:text-gray-500 line-through">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </>
                    ) : effectivePrice < originalPrice ? (
                      <div className="flex items-baseline gap-2">
                        <div className="text-lg font-bold text-hero-primary dark:text-[#9ca0ff]">
                          ₹{effectivePrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-gray-500 line-through">
                          ₹{originalPrice.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-hero-primary dark:text-[#9ca0ff]">
                        ₹{webinar.price.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEnrolled ? (
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  {status.label === 'Live Now' ? 'Join Live' : 'Continue'}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default WebinarCard;
