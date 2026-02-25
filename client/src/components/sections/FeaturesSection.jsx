'use client';

import { BookOpen, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: BookOpen,
    title: 'Expert Courses',
    description: 'Learn from industry veterans with comprehensive professional development courses.',
    accent: '#d4af37',
    accentRgb: '212,175,55',
    tag: '200+ Courses',
    tagCls: 'text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/20',
    dot: 'bg-[#d4af37]',
    borderHover: 'hover:border-[#d4af37]/50',
    glowCls: 'bg-[#d4af37]',
    lineCls: 'bg-[#d4af37]',
    arrowCls: 'group-hover:text-[#d4af37]',
    number: '01',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Skills',
    description: 'Get practical insights and strategies applicable in the real-world job market.',
    accent: '#d4af37',
    accentRgb: '212,175,55',
    tag: 'Industry Relevant',
    tagCls: 'text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/20',
    dot: 'bg-[#d4af37]',
    borderHover: 'hover:border-[#d4af37]/50',
    glowCls: 'bg-[#d4af37]',
    lineCls: 'bg-[#d4af37]',
    arrowCls: 'group-hover:text-[#d4af37]',
    number: '02',
  },
  {
    icon: Award,
    title: 'Certification',
    description: 'Earn recognized certificates upon course completion to boost your resume.',
    accent: '#d4af37',
    accentRgb: '212,175,55',
    tag: 'Recognized',
    tagCls: 'text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/20',
    dot: 'bg-[#d4af37]',
    borderHover: 'hover:border-[#d4af37]/50',
    glowCls: 'bg-[#d4af37]',
    lineCls: 'bg-[#d4af37]',
    arrowCls: 'group-hover:text-[#d4af37]',
    number: '03',
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-gray-50 dark:bg-[#08080E] py-8 px-4 transition-colors duration-300">

      {/* grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col items-center gap-4 text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] shadow-[0_0_6px_#d4af37]" />
            Why Choose Us
          </div>

          <h2
            className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-0.03em] text-gray-900 dark:text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#d4af37] to-[#d4af37] bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>

          <p className="max-w-md text-base font-light leading-relaxed text-gray-500 dark:text-white/40">
            From expert-led courses to industry certifications — we've got your growth covered.
          </p>

          <div className="h-px w-20 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
        </div>

        {/* ── CARDS ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, index) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={[
                  'group relative flex flex-col overflow-hidden rounded-2xl',
                  'border border-gray-200 dark:border-white/[0.07]',
                  'bg-white dark:bg-[#0F0F1A]',
                  'shadow-sm hover:shadow-2xl',
                  'transition-all duration-300 cursor-pointer',
                  f.borderHover,
                ].join(' ')}
              >
                {/* glow blob */}
                <div className={[
                  'pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl',
                  'opacity-0 group-hover:opacity-15 transition-opacity duration-500',
                  f.glowCls,
                ].join(' ')} />

                {/* ── BODY ── */}
                <div className="relative flex flex-1 flex-col gap-4 p-7">

                  {/* top row — number + tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold tracking-[0.18em] text-gray-300 dark:text-white/15"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {f.number}
                    </span>
                    <span className={[
                      'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                      f.tagCls,
                    ].join(' ')}>
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${f.dot}`} />
                      {f.tag}
                    </span>
                  </div>

                  {/* icon box */}
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `rgba(${f.accentRgb}, 0.12)`,
                      border: `1px solid rgba(${f.accentRgb}, 0.2)`,
                    }}
                  >
                    <Icon
                      className="h-6 w-6 transition-colors duration-300"
                      style={{ color: f.accent }}
                    />
                  </div>

                  {/* title */}
                  <h3
                    className="text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {f.title}
                  </h3>

                  {/* description */}
                  <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-white/40">
                    {f.description}
                  </p>

                  {/* divider */}
                  <div className="h-px w-full bg-gray-100 dark:bg-white/[0.05]" />

                  {/* arrow cta */}
                  <div className={[
                    'flex items-center gap-2 text-xs font-medium uppercase tracking-widest',
                    'text-gray-400 dark:text-white/25 transition-all duration-300',
                    f.arrowCls,
                  ].join(' ')}>
                    <span className="h-px w-5 bg-current transition-all duration-300 group-hover:w-9" />
                    Learn More
                    <svg className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* bottom accent line */}
                <div className={[
                  'absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full',
                  f.lineCls,
                ].join(' ')} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" />
    </section>
  );
}