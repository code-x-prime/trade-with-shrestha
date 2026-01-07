'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Zap, Play, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

const MentorshipCard = ({ program, isEnrolled = false }) => {
  // Get effective price considering flash sale
  const hasFlashSale = program.pricing?.hasFlashSale;
  const effectivePrice = program.pricing?.effectivePrice ?? program.salePrice ?? program.price;
  const originalPrice = program.pricing?.displayOriginalPrice ?? program.price;
  const discountPercent = program.pricing?.discountPercent ?? (program.salePrice ? Math.round(((program.price - program.salePrice) / program.price) * 100) : 0);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/mentorship/${program.slug}`} className="block h-full">
        <Card className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer border border-border dark:border-gray-800">
          <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-hero-primary/10 to-hero-secondary/10 dark:from-hero-primary/20 dark:to-hero-secondary/20 overflow-hidden">
            {program.coverImage ? (
              <Image
                src={getPublicUrl(program.coverImage)}
                alt={program.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted dark:bg-gray-800">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600" />
              </div>
            )}
            {/* Flash Sale Badge */}
            {hasFlashSale && !program.isFree ? (
              <div className="absolute top-3 left-3">
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-2 py-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {discountPercent}% OFF
                </Badge>
              </div>
            ) : null}
            <div className="absolute top-3 right-3">
              {program.isFree ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white font-semibold">
                  FREE
                </Badge>
              ) : !hasFlashSale && (
                <Badge variant="secondary" className="bg-gray-900/80 text-white font-semibold">
                  PAID
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="p-5 flex-1 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-snug text-gray-900 dark:text-white">{program.title}</h3>
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Starts {formatDate(program.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{program.totalSessions || 0} Sessions</span>
              </div>
            </div>
            <div className="pt-3 border-t space-y-3">
              {isEnrolled ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              ) : program.isFree ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-1.5 w-full justify-center">
                  FREE
                </Badge>
              ) : (
                <div className="space-y-1">
                  {hasFlashSale ? (
                    <>
                      <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
                        <Zap className="h-3 w-3" />
                        Flash Sale
                      </div>
                      <div className="text-xl font-bold text-hero-primary dark:text-[#9ca0ff]">
                        ₹{effectivePrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-gray-500 line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </div>
                    </>
                  ) : effectivePrice < originalPrice ? (
                    <>
                      <div className="text-xl font-bold text-hero-primary dark:text-[#9ca0ff]">
                        ₹{effectivePrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-gray-500 line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-bold text-hero-primary dark:text-[#9ca0ff]">
                      ₹{program.price.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default MentorshipCard;
