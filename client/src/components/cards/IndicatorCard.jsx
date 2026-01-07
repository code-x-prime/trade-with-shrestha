'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Play, Check, Download, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

const IndicatorCard = ({ indicator, isPurchased = false }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/indicators/${indicator.slug}`} className="block h-full">
        <Card className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer border border-border dark:border-gray-800">
          <div className="aspect-video relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
            {indicator.imageUrl ? (
              <Image
                src={getPublicUrl(indicator.imageUrl)}
                alt={indicator.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-hero-primary to-hero-secondary flex items-center justify-center shadow-lg">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
            )}
            {indicator.videoUrl && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-black/70 text-white backdrop-blur-sm">
                  <Play className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-base mb-3 line-clamp-2 leading-snug text-gray-900 dark:text-white">
              {indicator.name}
            </h3>
            {indicator.description && (
              <div className="mb-4 flex-1">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {indicator.description
                    .replace(/<[^>]*>/g, '')
                    .split('\n')
                    .filter(line => line.trim().length > 0)
                    .slice(0, 3)
                    .map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground dark:text-gray-400">
                        <Check className="h-4 w-4 text-hero-primary dark:text-[#9ca0ff] mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{point.trim()}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {indicator.platform && (
              <div className="mb-3">
                <Badge variant="outline" className="text-xs dark:border-gray-700 dark:text-gray-300">
                  {indicator.platform}
                </Badge>
              </div>
            )}
            <div className="mt-auto pt-3 border-t">
              {isPurchased ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default IndicatorCard;

