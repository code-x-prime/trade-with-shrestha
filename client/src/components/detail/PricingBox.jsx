'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap } from 'lucide-react';

export default function PricingBox({ 
  price, 
  salePrice, 
  isFree, 
  pricing, // Flash sale pricing object from API
  features = [],
  ctaLabel,
  onCtaClick,
  ctaVariant = 'default',
  className = '',
  children 
}) {
  const formatPrice = () => {
    if (isFree) {
      return (
        <div className="text-center">
          <Badge className="bg-green-600 text-white text-lg px-4 py-2 mb-2">FREE</Badge>
        </div>
      );
    }

    // Use flash sale pricing if available
    if (pricing?.hasFlashSale) {
      return (
        <div className="text-center space-y-2">
          {/* Flash sale badge */}
          <div className="flex items-center justify-center gap-1 text-orange-500 font-semibold text-sm">
            <Zap className="h-4 w-4" />
            <span>{pricing.flashSaleTitle || 'Flash Sale'}</span>
          </div>
          <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">
            ₹{pricing.effectivePrice.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground line-through text-sm dark:text-gray-500">
              ₹{pricing.displayOriginalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-orange-600 font-semibold">
              ({pricing.discountPercent}% OFF)
            </span>
          </div>
        </div>
      );
    }

    // Regular sale price
    if (pricing?.effectivePrice !== undefined && pricing.effectivePrice < pricing.displayOriginalPrice) {
      return (
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">
            ₹{pricing.effectivePrice.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground line-through text-sm dark:text-gray-500">
              ₹{pricing.displayOriginalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-green-600 font-semibold">
              ({pricing.discountPercent}% OFF)
            </span>
          </div>
        </div>
      );
    }

    // Fallback to old logic for backwards compatibility
    if (salePrice && salePrice < price) {
      return (
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">₹{salePrice.toLocaleString('en-IN')}</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground line-through text-sm dark:text-gray-500">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-sm text-green-600 font-semibold">
              ({Math.round(((price - salePrice) / price) * 100)}% OFF)
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">₹{price.toLocaleString('en-IN')}</div>
      </div>
    );
  };

  return (
    <Card className={`lg:sticky lg:top-24 dark:bg-gray-900 dark:border-gray-800 ${className}`}>
      <CardContent className="p-6 space-y-6">
        {formatPrice()}
        
        {children || (
          <Button
            className={`w-full ${ctaVariant === 'default' ? 'bg-brand-600 hover:bg-brand-700' : ctaVariant}`}
            size="lg"
            onClick={onCtaClick}
          >
            {ctaLabel}
          </Button>
        )}

        {features.length > 0 && (
          <div className="pt-4 border-t space-y-3 text-sm dark:border-gray-800 dark:text-gray-300">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
