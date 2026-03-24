'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/* ── Keyframe animations injected once ── */
const heroStyles = `
@keyframes floatOrb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
@keyframes floatOrb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(0.9); }
  66% { transform: translate(25px, -25px) scale(1.08); }
}
@keyframes floatOrb3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -50px) scale(1.05); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes spinSlow {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.hero-animate-in > * {
  opacity: 0;
  animation: fadeInUp 0.7s ease-out forwards;
}
.hero-animate-in > *:nth-child(1) { animation-delay: 0.1s; }
.hero-animate-in > *:nth-child(2) { animation-delay: 0.2s; }
.hero-animate-in > *:nth-child(3) { animation-delay: 0.35s; }
.hero-animate-in > *:nth-child(4) { animation-delay: 0.45s; }
.hero-animate-in > *:nth-child(5) { animation-delay: 0.55s; }
.hero-animate-in > *:nth-child(6) { animation-delay: 0.65s; }

.hero-highlight-text {
  color: #b45309;
}
.dark .hero-highlight-text {
  color: #facc15;
}

.hero-btn-glow {
  position: relative;
}
.hero-btn-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #f59e0b, #f97316, #ef4444, #f59e0b);
  background-size: 300% 300%;
  animation: shimmer 3s linear infinite;
  z-index: -1;
  opacity: 0.6;
  filter: blur(8px);
  transition: opacity 0.3s;
}
.hero-btn-glow:hover::before {
  opacity: 1;
}

.hero-stat-card {
  position: relative;
  overflow: hidden;
}
.hero-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #f59e0b, #f97316, transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.hero-stat-card:hover::before {
  opacity: 1;
}
.hero-stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.06), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}
.hero-stat-card:hover::after {
  opacity: 1;
}
`;

/* ── SVG mandala pattern for background ── */
function MandalaPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1000px] md:h-[1000px] opacity-[0.025] dark:opacity-[0.015]"
      style={{ animation: 'spinSlow 120s linear infinite' }}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {[60, 100, 140, 180].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} stroke="#b45309" strokeWidth="0.5" opacity="0.6" />
      ))}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 200 + Math.cos(angle) * 60;
        const y1 = 200 + Math.sin(angle) * 60;
        const x2 = 200 + Math.cos(angle) * 160;
        const y2 = 200 + Math.sin(angle) * 160;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b45309" strokeWidth="0.4" opacity="0.4" />
        );
      })}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const cx = 200 + Math.cos(angle) * 120;
        const cy = 200 + Math.sin(angle) * 120;
        return (
          <circle key={`arc-${i}`} cx={cx} cy={cy} r="20" stroke="#b45309" strokeWidth="0.4" fill="none" opacity="0.3" />
        );
      })}
    </svg>
  );
}

/* ── Small lotus icon ── */
function LotusIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21c0-4-3-7-7-9 2-1 4-1 7 1 3-2 5-2 7-1-4 2-7 5-7 9z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M12 21c0-6-5-9-9-11 3-2 6-1 9 2 3-3 6-4 9-2-4 2-9 5-9 11z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M12 16c0-3 0-6-3-9 2 0 3 2 3 4 0-2 1-4 3-4-3 3-3 6-3 9z"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}

function renderTitle(title, titleHighlight, highlightPosition) {
  if (!titleHighlight || highlightPosition === 'none') {
    return <>{title}</>;
  }

  if (highlightPosition === 'start') {
    return (
      <>
        <span className="hero-highlight-text">{titleHighlight}</span> {title}
      </>
    );
  }

  return (
    <>
      {title} <span className="hero-highlight-text">{titleHighlight}</span>
    </>
  );
}

export default function PageHero({
  eyebrow,
  title,
  titleHighlight,
  highlightPosition = 'end',
  description,
  primaryBtn,
  secondaryBtn,
  stats = [],
  badge,
}) {
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const tag = document.createElement('style');
    tag.textContent = heroStyles;
    document.head.appendChild(tag);
    return () => {
      tag.remove();
      styleRef.current = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-orange-50/30 to-white dark:from-[#0c0a09] dark:via-[#0f0d0a] dark:to-gray-950 border-b border-orange-200/40 dark:border-yellow-900/20">

      {/* ── Background Effects Layer ── */}

      {/* Primary glow – large warm orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full blur-[120px] opacity-40 dark:opacity-15"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(245,158,11,0.4), rgba(249,115,22,0.2), transparent 70%)',
          animation: 'pulseGlow 6s ease-in-out infinite',
        }}
      />

      {/* Floating orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-16 left-[12%] h-44 w-44 rounded-full bg-yellow-400/15 dark:bg-yellow-500/5 blur-[60px]"
        style={{ animation: 'floatOrb1 12s ease-in-out infinite' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-32 right-[8%] h-56 w-56 rounded-full bg-orange-400/[0.12] dark:bg-orange-500/[0.04] blur-[70px]"
        style={{ animation: 'floatOrb2 15s ease-in-out infinite' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-20 left-[25%] h-36 w-36 rounded-full bg-amber-300/15 dark:bg-amber-500/5 blur-[50px]"
        style={{ animation: 'floatOrb3 10s ease-in-out infinite' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-[20%] h-40 w-40 rounded-full bg-yellow-300/10 dark:bg-yellow-600/[0.04] blur-[55px]"
        style={{ animation: 'floatOrb1 14s ease-in-out infinite 2s' }}
      />

      {/* Rotating mandala pattern */}
      <MandalaPattern />

      {/* Grain / noise texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Subtle radial dot pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, #92400e 0.8px, transparent 0.8px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top decorative saffron border with glow */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0">
        <div className="h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 dark:opacity-50" />
        <div className="h-[6px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent blur-sm" />
      </div>

      {/* ── Content ── */}
      <div className="hero-animate-in relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">

        {/* Eyebrow */}
        {eyebrow ? (
          <div className="flex items-center justify-center">
            <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
              <span className="flex items-center gap-1.5">
                <span className="block h-px w-8 bg-gradient-to-r from-transparent to-amber-500/70" />
                <LotusIcon className="h-3.5 w-3.5 text-amber-500/60" />
              </span>
              {eyebrow}
              <span className="flex items-center gap-1.5">
                <LotusIcon className="h-3.5 w-3.5 text-amber-500/60" />
                <span className="block h-px w-8 bg-gradient-to-l from-transparent to-amber-500/70" />
              </span>
            </p>
          </div>
        ) : null}

        {/* Title */}
        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-gray-900 dark:text-white drop-shadow-sm">
          {renderTitle(title, titleHighlight, highlightPosition)}
        </h1>

        {/* Description */}
        {description ? (
          <p className="mt-6 text-lg md:text-xl text-gray-600/90 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        ) : null}

        {/* Badge */}
        {badge ? (
          <div className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-yellow-100 dark:bg-white/5 backdrop-blur-md border border-yellow-300 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-5 py-2 text-xs font-bold tracking-widest uppercase shadow-sm shadow-amber-200/30 dark:shadow-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            {badge}
          </div>
        ) : null}

        {/* Buttons */}
        {primaryBtn || secondaryBtn ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {primaryBtn ? (
              <div className="hero-btn-glow">
                <Button
                  asChild
                  className="relative z-10 bg-yellow-600 text-white dark:bg-yellow-500 dark:text-black font-bold rounded-full px-10 py-4 h-auto text-base shadow-xl shadow-amber-500/25 hover:bg-yellow-500 dark:hover:bg-yellow-400 transition-all duration-300"
                >
                  <Link href={primaryBtn.href}>{primaryBtn.text}</Link>
                </Button>
              </div>
            ) : null}
            {secondaryBtn ? (
              <Button
                asChild
                variant="outline"
                className="border-2 border-amber-300/50 dark:border-yellow-500/15 text-gray-700 dark:text-gray-300 rounded-full px-10 py-4 h-auto text-base font-semibold backdrop-blur-sm bg-white/40 dark:bg-white/5 hover:border-amber-500/70 hover:text-amber-800 hover:bg-amber-50/60 dark:hover:border-yellow-500/40 dark:hover:text-yellow-400 dark:hover:bg-yellow-500/5 transition-all duration-300"
              >
                <Link href={secondaryBtn.href}>{secondaryBtn.text}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Stats */}
        {stats?.length ? (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <div
                key={`${s.value}-${s.label}`}
                className="hero-stat-card group rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-md border border-amber-200/40 dark:border-yellow-500/[0.08] shadow-sm hover:shadow-lg hover:shadow-amber-200/20 dark:hover:shadow-yellow-500/5 p-6 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  animation: `scaleIn 0.5s ease-out ${0.7 + i * 0.12}s forwards`,
                  opacity: 0,
                }}
              >
                <p className="hero-highlight-text font-extrabold text-3xl md:text-4xl">
                  {s.value}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1.5 font-medium tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}