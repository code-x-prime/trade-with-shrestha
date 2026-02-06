'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Briefcase, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2U0ZTRlNCIvPjwvc3ZnPg==';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: i * 0.1 },
  }),
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=4A50B0&color=fff`;
}

// Local logos in public/c/ (Accenture.png, Amazon.png, ... ibm.png for IBM). Others fallback to placeholder.
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

export default function PlacementClient({ recruiters = [], students = [] }) {
  const duplicatedRecruiters = [...recruiters, ...recruiters];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── 1. Hero ─── */}
      <motion.section
        className="relative overflow-hidden bg-gradient-to-br from-[#4A50B0] via-[#5b61c4] to-indigo-800 dark:from-[#3d4288] dark:to-indigo-900 text-white pt-6"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 20V40H20'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20">
          <div className="max-w-3xl">
            <motion.p
              className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-4"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Placement success
            </motion.p>
            <motion.h1
              className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl md:leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              We&apos;ve Helped Students Score{' '}
              <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                Lucrative Placements
              </span>{' '}
              With Our Prominent Recruiters
            </motion.h1>
            <motion.p
              className="mt-5 text-lg text-white/90 sm:mt-6 sm:text-xl max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Join thousands of learners who have built their careers with us.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-white text-[#4A50B0] hover:bg-white/95 font-semibold shadow-xl rounded-xl h-12 px-7 text-base"
              >
                <Link href="/courses" className="inline-flex items-center gap-2">
                  Explore Courses
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
              <span className="text-sm text-white/80 font-medium">
                Trusted by {recruiters.length}+ top recruiters
              </span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ─── 2. Recruiter logos – infinite marquee ─── */}
      <motion.section
        className="border-b border-border bg-muted/30 dark:bg-gray-900/30 py-8 md:py-10 overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={sectionVariants}
      >
        <div className="max-w-6xl mx-auto px-4 mb-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Our recruiters
          </h2>
        </div>
        <div className="relative">
          <motion.div
            className="flex gap-4 w-max"
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
                className="flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-card/80 dark:bg-card/90 backdrop-blur-md border border-border/80 shadow-sm hover:shadow-lg px-5 py-5 min-w-[120px] md:min-w-[140px] text-center transition-all duration-300 hover:scale-105 hover:border-brand-500/30"
                whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              >
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl overflow-hidden border border-border/80 bg-muted/20 dark:bg-white dark:shadow-inner flex items-center justify-center p-1">
                  <Image
                    src={getCompanyLogoUrl(company)}
                    alt={company}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                    unoptimized={!getCompanyLogoUrl(company).startsWith('/')}
                  />
                </div>
                <span className="text-xs font-bold text-foreground leading-tight">{company}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── 3. Placed students – staggered cards ─── */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={containerVariants}
      >
        <motion.div className="mb-10 md:mb-12" variants={itemVariants}>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl flex items-center gap-2">
            <Award className="h-7 w-7 sm:h-8 sm:w-8 text-amber-500" />
            Thousands of Careers Empowered
          </h2>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg">
            Our placed students across companies and roles.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
        >
          {students.map((item, index) => (
            <motion.div
              key={`${item.name}-${item.company}-${index}`}
              variants={itemVariants}
              className="group"
            >
              <motion.div
                className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full"
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0 rounded-xl overflow-hidden ring-2 ring-border/50 group-hover:ring-brand-500/30 transition-all duration-300">
                      <Image
                        src={getAvatarUrl(item.name)}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="h-14 w-14 sm:h-16 sm:w-16 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-base truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/50 dark:bg-white dark:shadow-inner ring-1 ring-border/50 p-0.5">
                          <Image
                            src={getCompanyLogoUrl(item.company)}
                            alt={item.company}
                            width={36}
                            height={36}
                            className="h-full w-full object-contain"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            unoptimized={!getCompanyLogoUrl(item.company)?.startsWith('/')}
                          />
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/80 px-2.5 py-1 text-xs font-medium text-muted-foreground truncate min-w-0">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          {item.company}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mt-2">
                        {item.designation}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button asChild size="lg" variant="outline" className="rounded-xl border-2 border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 font-semibold h-12 px-8">
            <Link href="/courses">Explore Courses</Link>
          </Button>
        </motion.div>
      </motion.section>
    </div>
  );
}
