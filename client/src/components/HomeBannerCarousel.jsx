'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bannerAPI } from '@/lib/api';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

// Desktop: 1200×450, Mobile: 800×400 — same aspect ~2.67
const BANNER_ASPECT_DESKTOP = 'aspect-[1200/450]';
const BANNER_ASPECT_MOBILE = 'aspect-[800/400]';

// Fallback when API returns no banners (public folder)
const FALLBACK_BANNER = {
  imageUrl: '/desk_banner.png',
  imageUrlMobile: '/mob_banner.png',
  title: 'Banner',
};

function BannerSlide({ b, priority = false }) {
  const desktopSrc = b.imageUrl || null;
  const mobileSrc = b.imageUrlMobile || b.imageUrl || null;

  const content = (
    <div className="w-full bg-muted overflow-hidden">
      {desktopSrc || mobileSrc ? (
        <>
          {/* Mobile: 800×400 */}
          <div className={`relative w-full ${BANNER_ASPECT_MOBILE} md:hidden`}>
            <Image
              src={mobileSrc || desktopSrc}
              alt={b.title || 'Banner'}
              fill
              className="object-cover"
              priority={priority}
              unoptimized
              sizes="100vw"
            />
          </div>
          {/* Desktop: 1200×450 (fallback to mobile if no desktop) */}
          <div className={`hidden md:block relative w-full ${BANNER_ASPECT_DESKTOP}`}>
            {(desktopSrc || mobileSrc) && (
              <Image
                src={desktopSrc || mobileSrc}
                alt={b.title || 'Banner'}
                fill
                className="object-cover"
                priority={priority}
                unoptimized
                sizes="100vw"
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );

  if (b.link) {
    return <Link href={b.link} className="block w-full">{content}</Link>;
  }
  return <div className="w-full">{content}</div>;
}

export default function HomeBannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    bannerAPI
      .getActive()
      .then((res) => {
        if (mounted && res.success && Array.isArray(res.data)) {
          setBanners(res.data);
        }
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="w-full" aria-busy="true">
        <Skeleton className={`w-full ${BANNER_ASPECT_DESKTOP} rounded-none min-h-[200px] md:min-h-[280px]`} />
      </div>
    );
  }

  // API se koi banner nahi (null, length 0, khali) → public wale fallback use karo
  if (error || !banners?.length) {
    return (
      <div className="w-full">
        <BannerSlide b={FALLBACK_BANNER} priority />
      </div>
    );
  }

  // Ek banner = carousel mat dikhao, sirf woh slide dikhao
  if (banners.length === 1) {
    return (
      <div className="w-full">
        <BannerSlide b={banners[0]} priority />
      </div>
    );
  }

  // 2+ banners = carousel
  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {banners.map((b, idx) => (
          <CarouselItem key={b.id}>
            <BannerSlide b={b} priority={idx === 0} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4 opacity-80" />
      <CarouselNext className="right-4 opacity-80" />
    </Carousel>
  );
}
