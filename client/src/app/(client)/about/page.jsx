'use client';

import { motion } from 'framer-motion';
import { 
  Target, 
  Users, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  Globe,
  Briefcase,
  Code,
  LineChart
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Teaching Experience', value: '17+ Years', icon: BookOpen },
    { label: 'Industry Experience', value: '10+ Years', icon: Briefcase },
    { label: 'Students Mentored', value: 'Thousands', icon: Users },
    { label: 'Global Reach', value: 'International', icon: Globe }
  ];

  const features = [
    {
      title: 'Practical Learning',
      description: 'Focus on real-world skills that you can apply immediately in your career.',
      icon: Target
    },
    {
      title: 'Expert Guidance',
      description: 'Learn directly from industry veterans with proven track records.',
      icon: Users
    },
    {
      title: 'Transparent Policies',
      description: 'Honest education with no false promises. Skills matter more than certificates.',
      icon: CheckCircle2
    },
    {
      title: 'Career Readiness',
      description: 'Resume building, mock interviews, and 100% job assistance for eligible programs.',
      icon: Briefcase
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 max-w-7xl mx-auto text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm font-bold mb-8 ring-1 ring-violet-200 dark:ring-violet-800">
            <Sparkles className="w-4 h-4" />
            Leading Institute for Data Analytics, AI & Trading
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
            About <span className="text-violet-600">Shrestha Academy</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-light">
            (A brand operated by Shrestha EduTech Private Limited)
            <br className="mb-4" />
            Dedicated to providing industry-relevant education in Data Analytics, Data Science, Python Programming, Artificial Intelligence, and Stock & Cryptocurrency Trading.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto relative z-10">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
            >
              <stat.icon className="w-8 h-8 text-violet-600 dark:text-violet-400 mb-3 mx-auto" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-600" />
                About the Founder
              </h2>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Sagar Shrestha</h3>
                <p className="text-violet-600 font-medium mb-4">Founder – Shrestha Academy</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  An experienced educator, technologist, and market professional with over <strong>17+ years</strong> of teaching experience and <strong>10+ years</strong> of hands-on industry experience across technology, finance, and data-driven domains.
                </p>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    Industry Experience
                 </h4>
                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                   Sagar brings strong real-world exposure through his involvement in projects and initiatives associated with reputed global organizations including <strong>HSBC, Citibank, TD Bank, Eviction Intervention, ReadyLease</strong>, and multiple US IT startups.
                 </p>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-violet-600" />
                    Leadership in Financial Education
                 </h4>
                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                   Former CEO of <strong>Monark FX</strong>, a stock market trading institute, where he played a key role in designing structured trading education programs and training aspiring traders.
                 </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
               <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-8 rounded-2xl shadow-xl">
                 <h3 className="text-2xl font-bold mb-6">Our Teaching Philosophy</h3>
                 <ul className="space-y-4">
                    {[
                      'Skills matter more than certificates',
                      'Practice matters more than theory',
                      'Transparency matters more than false promises'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0 opacity-80" />
                        <span className="text-lg font-medium">{item}</span>
                      </li>
                    ))}
                 </ul>
               </div>

               <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Our Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Python Programming', 
                      'Data Analytics (Excel, SQL, Power BI)', 
                      'Data Science & ML', 
                      'Artificial Intelligence (GenAI & Agentic AI)',
                      'Stock Market & Crypto Trading'
                    ].map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-medium border border-violet-100 dark:border-violet-800">
                        {skill}
                      </span>
                    ))}
                  </div>
               </div>

               <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-r-xl">
                  <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">Job Assistance Disclaimer</h4>
                  <p className="text-amber-900/80 dark:text-amber-100/80 text-sm leading-relaxed">
                    We provide 100% Job Assistance (resume building, interview prep, referrals) for eligible programs, but <strong>Job Placement is NOT guaranteed</strong>. Final employment depends on skills, performance, and market conditions.
                  </p>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose Shrestha Academy?</h2>
            <p className="text-slate-600 dark:text-slate-400">We focus on long-term career growth and ethical teaching.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-slate-900 text-white text-center px-4">
        <h2 className="text-3xl md:text-5xl font-black mb-6">Learn with Confidence. <br/>Grow with Skills.</h2>
        <p className="text-slate-400 text-lg mb-8">Shrestha Academy operates under Shrestha EduTech Private Limited</p>
      </section>
    </div>
  );
}
