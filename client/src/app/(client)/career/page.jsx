'use client';

import Link from 'next/link';
import Image from 'next/image';
import PageHero from '@/components/sections/PageHero';

const SECTIONS = [
  {
    title: 'Software Jobs',
    description: 'Browse software and tech job openings. Find roles that match your skills and experience level.',
    href: '/career/software-jobs',
    img: '/card1.png',
    tag: '500+ Openings',
    number: '01',
    borderHover: 'hover:border-orange-500/50',
    tagCls: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    dot: 'bg-orange-400',
    arrowCls: 'group-hover:text-orange-400',
    glowCls: 'bg-orange-500',
    lineCls: 'bg-orange-400',
  },
  {
    title: 'Interview Questions',
    description: 'Practice common interview questions and answers for technical and HR rounds.',
    href: '/career/interview-questions',
    img: '/card2.png',
    tag: '1200+ Questions',
    number: '02',
    borderHover: 'hover:border-teal-500/50',
    tagCls: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    dot: 'bg-teal-400',
    arrowCls: 'group-hover:text-teal-400',
    glowCls: 'bg-teal-500',
    lineCls: 'bg-teal-400',
  },
  {
    title: 'Placement Training',
    description: 'Structured training to get you job-ready: resume, interviews, and essential soft skills.',
    href: '/career/placement-training',
    img: '/card3.png',
    tag: 'Expert Mentors',
    number: '03',
    borderHover: 'hover:border-yellow-500/50',
    tagCls: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
    dot: 'bg-yellow-500',
    arrowCls: 'group-hover:text-yellow-700 dark:group-hover:text-yellow-400',
    glowCls: 'bg-yellow-500',
    lineCls: 'bg-yellow-500',
  },
];

export default function CareerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <PageHero
        eyebrow="Your Growth Hub"
        title="Launch Your"
        titleHighlight="Career"
        highlightPosition="end"
        description="Jobs, interview prep, and placement support — everything in one place."
        primaryBtn={{ text: 'Explore Jobs', href: '/career/software-jobs' }}
        secondaryBtn={{ text: 'Interview Prep', href: '/career/interview-questions' }}
        stats={[
          { value: '500+', label: 'Job Openings' },
          { value: '1200+', label: 'Interview Questions' },
          { value: '100%', label: 'Placement Support' },
        ]}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-8">
        {/* ── CARDS — teeno bilkul equal size ── */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={[
                'group relative flex flex-col overflow-hidden rounded-2xl',
                'border border-gray-200 dark:border-gray-800',
                'bg-white dark:bg-gray-900',
                'shadow-sm hover:shadow-2xl',
                'transition-all duration-300',
                s.borderHover,
              ].join(' ')}
            >
              {/* ── IMAGE — fixed height same on all 3 ── */}
              <div className="relative h-52 w-full shrink-0 overflow-hidden">
                <Image
                  src={s.img}
                  alt={s.title}
                  fill
                  className="object-cover brightness-95 dark:brightness-75 transition-transform duration-500 group-hover:scale-105 dark:group-hover:brightness-90"
                />
                {/* gradient fade bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900" />

                {/* number badge */}
                <span
                  className="absolute left-4 top-4 text-xs font-bold tracking-[0.18em] text-black/20 dark:text-white/25"
                >
                  {s.number}
                </span>
              </div>

              {/* ── BODY — flex-1 so all cards stretch equal ── */}
              <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-3">

                {/* tag badge */}
                <span className={[
                  'self-start rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  s.tagCls,
                ].join(' ')}>
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${s.dot}`} />
                  {s.tag}
                </span>

                {/* title */}
                <h2
                  className="text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white"
                >
                  {s.title}
                </h2>

                {/* description — flex-1 pushes arrow to bottom */}
                <p className="flex-1 text-sm font-light leading-relaxed text-gray-600 dark:text-gray-400">
                  {s.description}
                </p>

                {/* divider */}
                <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

                {/* cta arrow */}
                <div className={[
                  'flex items-center gap-2 text-xs font-medium uppercase tracking-widest',
                  'text-gray-500 dark:text-gray-500 transition-all duration-300',
                  s.arrowCls,
                ].join(' ')}>
                  <span className="h-px w-5 bg-current transition-all duration-300 group-hover:w-9" />
                  Explore
                  <svg className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* bottom accent slide line */}
              <div className={[
                'absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full',
                s.lineCls,
              ].join(' ')} />
            </Link>
          ))}
        </section>

        <div className="text-center mt-10">
          <Link
            href="/career/software-jobs"
            className="inline-flex items-center gap-3 rounded-full bg-yellow-600 text-white dark:bg-yellow-500 dark:text-black hover:bg-yellow-500 dark:hover:bg-yellow-400 px-7 py-3 text-sm font-semibold transition-all duration-300"
          >
            Explore career resources
          </Link>
        </div>

        {/* ── FOOTER ── */}
        <footer className="mt-16 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-8">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500"
          >
            Career Portal
          </span>
          <div className="flex gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
          </div>
        </footer>
      </div>

      {/* Syne font */}

    </div>
  );
}