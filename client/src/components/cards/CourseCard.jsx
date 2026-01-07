'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Globe, Zap, Play, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

const CourseCard = ({ course, isEnrolled = false, progress = 0, showProgress = false }) => {
  // Get effective price considering flash sale
  const hasFlashSale = course.pricing?.hasFlashSale;
  const effectivePrice = course.pricing?.effectivePrice ?? course.salePrice ?? course.price;
  const originalPrice = course.pricing?.displayOriginalPrice ?? course.price;
  const discountPercent = course.pricing?.discountPercent ?? (course.salePrice ? Math.round(((course.price - course.salePrice) / course.price) * 100) : 0);

  const getLanguageLabel = (language) => {
    switch (language) {
      case 'HINDI': return 'Hindi';
      case 'ENGLISH': return 'English';
      case 'MIXED': return 'Mixed';
      default: return language;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/courses/${course.slug}`} className="block h-full">
        <Card className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-border dark:border-gray-800 cursor-pointer">
          <div>
            <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
              {(course.coverImageUrl || course.coverImage) ? (
                <Image
                  src={getPublicUrl(course.coverImageUrl || course.coverImage)}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center dark:bg-gray-800">
                  <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                </div>
              )}
              {/* Flash Sale Badge */}
              {hasFlashSale && !course.isFree && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-2 py-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {discountPercent}% OFF
                  </Badge>
                </div>
              )}
              <div className="absolute top-3 left-3">
                {course.isFree ? (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1">
                    FREE
                  </Badge>
                ) : !hasFlashSale && (
                  <Badge variant="secondary" className="bg-gray-900/80 text-white font-semibold px-3 py-1">
                    PAID
                  </Badge>
                )}
              </div>
              {course.category && !hasFlashSale && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm dark:border-gray-700 dark:text-gray-200">
                    {course.category}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <CardContent className="p-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white hover:text-hero-primary dark:hover:text-[#9ca0ff] transition-colors line-clamp-2 leading-snug">
              {course.title}
            </h3>

            {course.description && (
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3 line-clamp-2 flex-1">
                {course.description.replace(/<[^>]*>/g, '').substring(0, 100)}
              </p>
            )}

            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground dark:text-gray-500">
              <Globe className="h-3.5 w-3.5" />
              <span>{getLanguageLabel(course.language)}</span>
            </div>

            {showProgress && isEnrolled && progress > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium">Progress</span>
                  <span className="text-muted-foreground font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            <div className="mt-auto pt-3 border-t space-y-3">
              {isEnrolled ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/courses/${course.slug}/learn`;
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              ) : course.isFree ? (
                <div className="text-center">
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-1.5 w-full justify-center">
                    FREE
                  </Badge>
                </div>
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
                      ₹{course.price.toLocaleString('en-IN')}
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

export default CourseCard;
