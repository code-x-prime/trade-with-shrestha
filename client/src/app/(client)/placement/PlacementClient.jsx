'use client';

import React from 'react';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Award,  Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/sections/PageHero';



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
      {/* ═══════════════════ 3. PLACED STUDENTS (Wall of Success) ═══════════════════ */}
      <section className="relative py-20 overflow-hidden bg-muted/5">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4"
            >
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Wall of Success
              </span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Thousands of Careers Empowered
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our graduates are working at the world&apos;s leading tech companies. 
              Join the league of successful professionals.
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[800px] overflow-hidden">
            <TestimonialsColumn
              testimonials={students.slice(0, Math.ceil(students.length / 3))}
              duration={15}
            />
            <TestimonialsColumn
              testimonials={students.slice(Math.ceil(students.length / 3), Math.ceil(students.length / 3) * 2)}
              className="hidden md:block"
              duration={20}
            />
            <TestimonialsColumn
              testimonials={students.slice(Math.ceil(students.length / 3) * 2)}
              className="hidden lg:block"
              duration={17}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Award className="h-32 w-32" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to be our next success story?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Get access to premium courses, industry-expert mentorship, and dedicated placement support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-8 h-12 font-bold shadow-xl">
                <Link href="/courses">Explore Our Courses</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-blue-700 hover:bg-white/10 hover:text-white rounded-full px-8 h-12">
                <Link href="/contact">Talk to Expert</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const TestimonialsColumn = (props) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2)].fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map((student, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 w-[280px] md:w-[320px] group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                    <Image
                      src={getAvatarUrl(student.name)}
                      alt={student.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold text-foreground leading-tight">{student.name}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{student.designation}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="h-8 w-8 rounded-lg bg-white p-1 border border-border shadow-sm flex items-center justify-center">
                    <Image
                      src={getCompanyLogoUrl(student.company)}
                      alt={student.company}
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized={!getCompanyLogoUrl(student.company)?.startsWith('/')}
                    />
                  </div>
                  <div className="text-sm font-bold text-muted-foreground">
                    Placed at {student.company}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};