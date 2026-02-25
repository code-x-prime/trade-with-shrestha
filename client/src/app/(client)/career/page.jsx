'use client';

import Link from 'next/link';
import Image from 'next/image';

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
    borderHover: 'hover:border-violet-500/50',
    tagCls: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    dot: 'bg-violet-400',
    arrowCls: 'group-hover:text-violet-400',
    glowCls: 'bg-violet-500',
    lineCls: 'bg-violet-400',
  },
];

export default function CareerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08080E] transition-colors duration-300">

      {/* dark-mode grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-8">

        {/* ── HEADER ── */}
        <header className="flex flex-col items-center gap-5 pt-8 pb-8 text-center">

          {/* eyebrow pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] shadow-[0_0_6px_#d4af37]" />
            Your Growth Hub
          </div>

          {/* headline */}
          <h1 className="text-[clamp(40px,6vw,80px)] font-extrabold leading-none tracking-[-0.04em] text-gray-900 dark:text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Crack Your{' '}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#d4af37] to-[#d4af37] bg-clip-text text-transparent">
              Dream
            </span>{' '}
            Career
          </h1>

          <p className="max-w-md text-base font-light leading-relaxed text-gray-500 dark:text-white/40">
            Jobs, interview prep, and placement support — everything in one place.
          </p>

          <div className="h-px w-20 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
        </header>

        {/* ── CARDS — teeno bilkul equal size ── */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={[
                'group relative flex flex-col overflow-hidden rounded-2xl',
                'border border-gray-200 dark:border-white/[0.07]',
                'bg-white dark:bg-[#0F0F1A]',
                'shadow-sm hover:shadow-2xl',
                'transition-all duration-300',
                s.borderHover,
              ].join(' ')}
            >
              {/* hover glow blob top-right */}
              <div className={[
                'pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl',
                'opacity-0 group-hover:opacity-15 transition-opacity duration-500',
                s.glowCls,
              ].join(' ')} />

              {/* ── IMAGE — fixed height same on all 3 ── */}
              <div className="relative h-52 w-full shrink-0 overflow-hidden">
                <Image
                  src={s.img}
                  alt={s.title}
                  fill
                  className="object-cover brightness-95 dark:brightness-75 transition-transform duration-500 group-hover:scale-105 dark:group-hover:brightness-90"
                />
                {/* gradient fade bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#0F0F1A]" />

                {/* number badge */}
                <span
                  className="absolute left-4 top-4 text-xs font-bold tracking-[0.18em] text-black/20 dark:text-white/25"
                  style={{ fontFamily: "'Syne', sans-serif" }}
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
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.title}
                </h2>

                {/* description — flex-1 pushes arrow to bottom */}
                <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-white/40">
                  {s.description}
                </p>

                {/* divider */}
                <div className="h-px w-full bg-gray-100 dark:bg-white/[0.05]" />

                {/* cta arrow */}
                <div className={[
                  'flex items-center gap-2 text-xs font-medium uppercase tracking-widest',
                  'text-gray-400 dark:text-white/25 transition-all duration-300',
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

        {/* ── FOOTER ── */}
        <footer className="mt-16 flex items-center justify-between border-t border-gray-200 dark:border-white/[0.05] pt-8">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300 dark:text-white/15"
            style={{ fontFamily: "'Syne', sans-serif" }}
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
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" />
    </div>
  );
}