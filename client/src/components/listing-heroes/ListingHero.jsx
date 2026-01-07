'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ListingHero({
  badge,
  badgeColor = 'green',
  title,
  description,
  features,
  ctaText,
  ctaLink,
  gradientFrom = 'from-brand-600',
  gradientVia = 'via-brand-700',
  gradientTo = 'to-brand-800',
}) {
  const badgeColors = {
    green: 'bg-green-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    orange: 'bg-orange-400',
    pink: 'bg-pink-400',
  };

  return (
    <div className={`relative rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} p-8 md:p-12 mb-8 overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <div className={`w-2 h-2 ${badgeColors[badgeColor] || badgeColors.green} rounded-full animate-pulse`}></div>
              <span className="text-white text-sm font-medium">{badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {title}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
              {description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-3 mb-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon || (() => null);
                return (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <Icon className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          {ctaText && ctaLink && (
            <div className="flex-shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-white text-brand-600 hover:bg-white/90 shadow-lg"
              >
                <Link href={ctaLink}>
                  {ctaText}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

