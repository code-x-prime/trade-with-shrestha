'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Briefcase, Building2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/sections/PageHero';

const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2U0ZTRlNCIvPjwvc3ZnPg==';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: i * 0.08 },
  }),
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=D4AF37&color=111111`;
}

const LOCAL_LOGO_COMPANIES = new Set([
  'TCS', 'Infosys', 'Wipro', 'HDFC Bank', 'Tech Mahindra', 'Cognizant',
  'Capgemini', 'Accenture', 'IBM', 'Genpact', 'Deloitte', 'Amazon',
]);

function getCompanyLogoUrl(company) {
  if (!company) return null;
  if (LOCAL_LOGO_COMPANIES.has(company)) {
    const file = company === 'IBM' ? 'ibm.png' : `${company}.png`;
    return `/c/${file}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&size=64&background=64748b&color=fff`;
}

/* ── Decorative floating shapes for hero ── */
function HeroShapes() {
  return (
    <>
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-10 right-[15%] h-64 w-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)' }}
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-[5%] h-48 w-48 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)' }}
        animate={{ y: [0, 20, 0], scale: [1, 0.95, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 right-[5%] h-32 w-32 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }}
        animate={{ x: [0, 15, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Geometric grid dots */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </>
  );
}

/* ── Stat pill for hero ── */
function HeroStat({ value, label, delay }) {
  return (
    <motion.div
      className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span className="text-xl font-extrabold text-white">{value}</span>
      <span className="text-xs text-white/70 font-medium leading-tight">{label}</span>
    </motion.div>
  );
}

export default function PlacementClient({ recruiters = [], students = [] }) {
  const duplicatedRecruiters = [...recruiters, ...recruiters];

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Placement Success"
        title="Prominent"
        titleHighlight="Placements"
        highlightPosition="end"
        description="Join thousands of learners who have built their careers with us."
        primaryBtn={{ text: 'Explore Courses', href: '/courses' }}
        stats={[
          { value: `${recruiters.length}+`, label: 'Top Recruiters' },
          { value: `${students.length * 100}+`, label: 'Students Placed' },
          { value: '95%', label: 'Placement Rate' },
        ]}
      />

      {/* ═══════════════════ 2. RECRUITER MARQUEE ═══════════════════ */}
      <motion.section
        className="relative border-b border-border bg-muted/20 dark:bg-gray-900/20 py-10 md:py-12 overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={sectionVariants}
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-muted/20 dark:from-gray-900/20 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-muted/20 dark:from-gray-900/20 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 mb-7">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Trusted by leading companies
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Top recruiters who hire our graduates year after year</p>
        </div>

        <div className="relative">
          <motion.div
            className="flex gap-5 w-max"
            animate={{ x: [0, -1392] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {duplicatedRecruiters.map((company, i) => (
              <motion.div
                key={`${company}-${i}`}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-card/90 dark:bg-card/80 backdrop-blur-md border border-border/60 shadow-sm hover:shadow-xl px-6 py-5 min-w-[130px] md:min-w-[150px] text-center transition-all duration-300"
                whileHover={{
                  y: -6,
                  scale: 1.05,
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.12)',
                }}
              >
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl overflow-hidden border border-border/60 bg-white dark:bg-white shadow-inner flex items-center justify-center p-1.5">
                  <Image
                    src={getCompanyLogoUrl(company)}
                    alt={company}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                    unoptimized={!getCompanyLogoUrl(company).startsWith('/')}
                  />
                </div>
                <span className="text-xs font-bold text-foreground leading-tight tracking-wide">
                  {company}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════ 3. PLACED STUDENTS ═══════════════════ */}
      <motion.section
        className="relative max-w-6xl mx-auto px-4 py-14 sm:py-18 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={containerVariants}
      >
        {/* Background accent */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-brand-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 left-0 h-72 w-72 rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />

        <motion.div className="mb-12 md:mb-14 relative" variants={itemVariants}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
              Success Stories
            </p>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl tracking-tight">
            Thousands of Careers Empowered
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-xl leading-relaxed">
            Our placed students across companies and roles — building tomorrow&apos;s workforce today.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
        >
          {students.map((item, index) => (
            <motion.div
              key={`${item.name}-${item.company}-${index}`}
              variants={itemVariants}
              className="group"
            >
              <motion.div
                className="relative rounded-2xl border border-border/80 bg-card overflow-hidden h-full transition-all duration-300"
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)',
                }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Top accent gradient — reveals on hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Subtle inner glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative p-5 sm:p-6">
                  {/* Avatar + info row */}
                  <div className="flex items-start gap-4">
                    {/* Avatar with ring */}
                    <div className="relative flex-shrink-0">
                      <div className="rounded-2xl overflow-hidden ring-2 ring-border/40 group-hover:ring-brand-500/30 transition-all duration-500 shadow-sm group-hover:shadow-md">
                        <Image
                          src={getAvatarUrl(item.name)}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="h-16 w-16 sm:h-[72px] sm:w-[72px] object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          unoptimized
                        />
                      </div>
                      {/* Online-style indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                          <path d="M3 0.5L6 3.5L3 6.5" />
                        </svg>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="font-bold text-foreground text-[15px] truncate leading-tight">
                        {item.name}
                      </p>
                      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1 truncate">
                        {item.designation}
                      </p>

                      {/* Company chip */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-white dark:bg-white shadow-inner p-0.5">
                          <Image
                            src={getCompanyLogoUrl(item.company)}
                            alt={item.company}
                            width={32}
                            height={32}
                            className="h-full w-full object-contain"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            unoptimized={!getCompanyLogoUrl(item.company)?.startsWith('/')}
                          />
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 dark:bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground truncate min-w-0 border border-border/40">
                          <Briefcase className="h-3 w-3 shrink-0 opacity-60" />
                          {item.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button
            asChild
            size="lg"
            className="rounded-full py-3  bg-yellow-500 text-white hover:bg-yellow-400 font-bold h-13 px-10 text-base shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-300 hover:scale-[1.02]"
          >
            <Link href="/courses" className="inline-flex items-center gap-2">
              Explore Courses
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Start your journey to a successful career today
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}