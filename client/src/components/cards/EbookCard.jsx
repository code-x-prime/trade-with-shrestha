'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Zap, Download, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

const EbookCard = ({ ebook, isPurchased = false }) => {
  // Get effective price considering flash sale
  const hasFlashSale = ebook.pricing?.hasFlashSale;
  const effectivePrice = ebook.pricing?.effectivePrice ?? ebook.salePrice ?? ebook.price;
  const originalPrice = ebook.pricing?.displayOriginalPrice ?? ebook.price;
  const discountPercent = ebook.pricing?.discountPercent ?? (ebook.salePrice ? Math.round(((ebook.price - ebook.salePrice) / ebook.price) * 100) : 0);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/ebooks/${ebook.slug}`} className="block h-full">
        <Card className="rounded overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-100 dark:border-gray-800 cursor-pointer">
          <div>
            <div className="aspect-[4/5] relative bg-gradient-to-br from-indigo-50 to-purple-50">
              {ebook.image1Url ? (
                <Image
                  src={getPublicUrl(ebook.image1Url)}
                  alt={ebook.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center dark:bg-gray-800">
                  <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                </div>
              )}
              {/* Flash Sale Badge - Top Left */}
              {hasFlashSale && !ebook.isFree && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-2 py-0.5 text-xs flex items-center gap-1 shadow-md">
                    <Zap className="h-3 w-3" />
                    {discountPercent}%
                  </Badge>
                </div>
              )}
              {/* Free Badge - Top Right */}
              {ebook.isFree && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-2 py-0.5 text-xs shadow-md">
                    FREE
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-3 flex-1 flex flex-col">
            <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {ebook.title}
            </h3>

            {ebook.author && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">by {ebook.author}</p>
            )}

            <div className="flex items-center gap-3 mb-2 text-xs text-gray-500 dark:text-gray-400">
              {ebook.pages > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{ebook.pages}p</span>
                </div>
              )}
              {ebook.purchaseCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{ebook.purchaseCount}</span>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-2">
              {isPurchased ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              ) : ebook.isFree ? (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg text-center">
                  FREE DOWNLOAD
                </div>
              ) : (
                <div>
                  {hasFlashSale ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{effectivePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : effectivePrice < originalPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{effectivePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{ebook.price.toLocaleString('en-IN')}
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

export default EbookCard;