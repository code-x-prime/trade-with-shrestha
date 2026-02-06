'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

// All + ye 8 categories; sab /courses pe jayega (All = sab, baki q se filter)
const CATEGORIES = [
  { label: 'All', href: '/courses', useIcon: true, icon: LayoutGrid },
  { label: 'Python', href: '/courses?q=python', useIcon: false, image: '/cate/python.png' },
  { label: 'Data Analytics', href: '/courses?q=data+analytics', useIcon: false, image: '/cate/Data-Analytics.png' },
  { label: 'Data Science', href: '/courses?q=data+science', useIcon: false, image: '/cate/machine-learning.png' },
  { label: 'Devops', href: '/courses?q=devops', useIcon: true, image: '/cate/devops.png' },
  { label: 'SQL Server', href: '/courses?q=sql+server', useIcon: false, image: '/cate/sql-server.png' },
  { label: 'Power BI', href: '/courses?q=power+bi', useIcon: false, image: '/cate/Power_BI.png' },
  { label: 'Machine Learning/AI', href: '/courses?q=machine+learning', useIcon: false, image: '/cate/machine-learning.png' },
  { label: 'Tableau', href: '/courses?q=tableau', useIcon: false, image: '/cate/Tableau.png' },
];

export default function HomeCategoryBar() {
  const scrollRef = useRef(null);

  // Mobile: scroll start se ho, scrollbar na dikhe
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, []);

  return (
    <section
      className="border-b border-border bg-background dark:bg-background"
      aria-label="Online classes and course filters"
    >
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div
          ref={scrollRef}
          className={cn(
            'flex items-center justify-start gap-4 overflow-x-auto pb-1 md:gap-8 hide-scrollbar',
            'touch-pan-x'
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {CATEGORIES.map((item) => {
            const IconComponent = item.useIcon ? item.icon : null;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  'group flex flex-col items-center justify-center gap-2.5 min-w-[88px] md:min-w-[100px] px-4 py-3 rounded-xl',
                  'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                  'dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted/80',
                  'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <span
                  className={cn(
                    'flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl transition-all duration-200 overflow-hidden',
                    'bg-muted/80 border border-border/50',
                    'group-hover:bg-primary/10 group-hover:border-primary/20',
                    'dark:bg-muted/60 dark:border-border dark:group-hover:bg-primary/20 dark:group-hover:border-primary/30'
                  )}
                >
                  {IconComponent ? (
                    <IconComponent className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground group-hover:text-primary dark:text-muted-foreground dark:group-hover:text-primary" aria-hidden strokeWidth={1.75} />
                  ) : (
                    <Image
                      src={item.image}
                      alt=""
                      width={64}
                      height={64}
                      className="h-full w-full object-contain p-1.5"
                      unoptimized
                    />
                  )}
                </span>
                <span className="text-xs md:text-sm font-medium text-center leading-tight max-w-[88px] md:max-w-[100px] truncate text-foreground/90 dark:text-foreground/90">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
