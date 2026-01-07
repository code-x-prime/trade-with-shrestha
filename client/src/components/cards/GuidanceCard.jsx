'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Clock, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

const GuidanceCard = ({ item }) => {
  // Get effective price considering flash sale
  const hasFlashSale = item.pricing?.hasFlashSale;
  const effectivePrice = item.pricing?.effectivePrice ?? item.price;
  const originalPrice = item.pricing?.displayOriginalPrice ?? item.price;
  const discountPercent = item.pricing?.discountPercent ?? 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/guidance/${item.slug}`}>
        <Card className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer border border-border dark:border-gray-800 group">

          {/* Expert Image - Main Visual */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center overflow-hidden">
            {/* Flash Sale Badge */}
            {hasFlashSale && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-2 py-1 flex items-center gap-1 shadow-sm">
                  <Zap className="h-3 w-3" />
                  {discountPercent}% OFF
                </Badge>
              </div>
            )}

            {/* Expert Image - Centered and Prominent */}
            {item.expertImageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={getPublicUrl(item.expertImageUrl)}
                  alt={item.expertName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shadow-lg">
                <UserIcon className="h-16 w-16 text-purple-600 dark:text-purple-400" />
              </div>
            )}
          </div>

          <CardContent className="flex-1 flex flex-col p-5">
            <h3 className="font-bold text-lg mb-1 line-clamp-2 leading-snug text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {item.title}
            </h3>

            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground dark:text-gray-400">
              <span className="font-medium text-foreground dark:text-gray-300">{item.expertName}</span>
            </div>

            {item.expertise && Array.isArray(item.expertise) && item.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.expertise.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] px-2 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-500 mb-4">
              <Clock className="h-3.5 w-3.5" />
              <span>{item.durationMinutes} minutes session</span>
            </div>

            <div className="mt-auto pt-4 border-t dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                {hasFlashSale ? (
                  <div className="space-y-0.5">
                    <div className="text-xs text-orange-500 font-bold uppercase tracking-wider">Flash Sale</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">₹{effectivePrice.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm group-hover:shadow-md transition-all">
                Book Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default GuidanceCard;
