'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-gray-50 dark:bg-[#08080E] py-8 px-4 transition-colors duration-300">

      {/* grid pattern — section only */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <Link href="/courses" className="group block">

          {/* wrapper card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/[0.08] shadow-lg group-hover:shadow-2xl group-hover:border-blue-300 dark:group-hover:border-blue-500/30 transition-all duration-500">

            {/* glow blobs on hover */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-500 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 z-10" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-blue-500 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 z-10" />

            {/* ── IMAGE — full width, no text on top ── */}
            <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl aspect-[16/9] sm:aspect-[1000/380]">
              <Image
                src="/ban2.png"
                alt="Courses Banner"
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                priority
              />

              {/* very subtle vignette edges only — no center tint */}
              <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.25)] rounded-3xl pointer-events-none" />

              {/* bottom-left badge — small, doesn't block image text */}
              <div className="hidden sm:flex absolute bottom-5 left-5 items-center gap-2 rounded-full border border-blue-300 dark:border-blue-500/30 bg-black/40 backdrop-blur-md px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-700 dark:bg-blue-400 shadow-[0_0_6px_#2563eb]" />
                New Batch Starting
              </div>

              {/* bottom-right CTA button — doesn't block image text */}
              <div className="hidden sm:flex absolute bottom-5 right-5 items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2.5 text-sm font-semibold text-white group-hover:bg-blue-500 group-hover:text-black group-hover:border-blue-500 transition-all duration-300">
                View Courses
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            {/* bottom gradient accent line */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 dark:from-blue-500 dark:via-blue-400 dark:to-blue-500 transition-all duration-700 group-hover:w-full z-20" />
          </div>

        </Link>
      </div>


    </section>
  );
}