'use client';

import Image from 'next/image';
import Link from 'next/link';
import { STATIC_COURSES } from '@/data/courses';
import { Clock, IndianRupee, MessageCircle, ArrowRight, GraduationCap } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/constants';

const BADGE_COLORS = {
  FEATURED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  BESTSELLER: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function AllCoursesSection() {
  return (
    <section className="bg-gray-50 dark:bg-[#08080E] py-14 px-4 transition-colors duration-300" id="all-courses">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300 dark:border-blue-500/20 bg-blue-100 dark:bg-blue-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-700 dark:bg-blue-400" />
              Shrestha Academy
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              All Our <span className="text-blue-600 dark:text-blue-400">Courses</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-white/40 max-w-lg">
              Learn from industry experts — real projects, live sessions, and placement support. {STATIC_COURSES.length} courses available.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
          >
            View All Courses <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {STATIC_COURSES.map((course, i) => (
            <div
              key={course.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0F0F1A] shadow-sm hover:shadow-xl hover:border-blue-400/50 dark:hover:border-blue-500/30 transition-all duration-300"
            >
              {/* Badge */}
              {course.badge && (
                <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${BADGE_COLORS[course.badge]}`}>
                  {course.badge}
                </span>
              )}
              {/* Rank */}
              <span className="absolute top-3 right-3 z-10 text-[10px] font-bold text-black/20 dark:text-white/20">
                #{String(i + 1).padStart(2, '0')}
              </span>

              {/* Image */}
              <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4 gap-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                  {course.category}
                </span>
                <h3 className="text-sm font-bold leading-snug text-gray-900 dark:text-white line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed line-clamp-3 flex-1">
                  {course.description}
                </p>

                {/* Benefits */}
                {course.benefits && (
                  <ul className="space-y-1 pt-1">
                    {course.benefits.slice(0, 3).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-white/50">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/[0.05] text-[11px] text-gray-400 dark:text-white/30">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{course.language}</span>
                </div>

                {/* Price + WhatsApp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">
                      {course.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello! I am interested in: ${course.title}. Please share details.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-[11px] font-semibold px-3 py-1.5 transition-colors duration-200"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-12 rounded-2xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Any Questions? Talk to Us! 💬
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
              Course selection, fees, batch timing — free counselling available on WhatsApp.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello! I want to know about your courses at Shrestha Academy.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 text-sm transition-colors duration-200 shrink-0"
          >
            <Image src="/whatsapp.png" alt="WhatsApp" width={20} height={20} className="h-5 w-5 object-contain" unoptimized />
            WhatsApp Now
          </a>
        </div>

      </div>
    </section>
  );
}
