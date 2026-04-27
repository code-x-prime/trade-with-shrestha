'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useInView } from 'framer-motion';

const ALL_IMAGES = Array.from({ length: 17 }, (_, i) => `/gallery/img${i + 1}.jpeg`);

// Divide into 3 columns for the masonry grid
const COLUMNS = [
  ALL_IMAGES.slice(0, 6),
  ALL_IMAGES.slice(6, 12),
  ALL_IMAGES.slice(12, 17)
];

export default function GalleryPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center py-20 px-4 bg-gray-50 dark:bg-gray-950">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">Our Gallery</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Glimpses of our events, seminars, and successful student journeys.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((columnImages, colIndex) => (
          <div key={colIndex} className="grid gap-6 h-fit">
            {columnImages.map((src, index) => {
              // Create an alternating pattern of portrait/landscape to make a nice masonry
              const isPortrait = (colIndex + index) % 2 === 0;
              const ratio = isPortrait ? 3 / 4 : 4 / 3;

              return (
                <AnimatedImage
                  key={`${colIndex}-${index}`}
                  alt={`Gallery Image`}
                  src={src}
                  ratio={ratio}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedImage({ alt, src, ratio }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div
      ref={ref}
      style={{ aspectRatio: ratio }}
      className="bg-gray-200 dark:bg-gray-800 relative w-full rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      <img
        alt={alt}
        src={src}
        className={cn(
          'w-full h-full rounded-xl object-cover opacity-0 transition-all duration-[1500ms] ease-out hover:scale-105',
          {
            'opacity-100': isInView && !isLoading,
          }
        )}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
      />
    </div>
  );
}
