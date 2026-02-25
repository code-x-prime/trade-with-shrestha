'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Gold/Dark premium theme matching Shrestha Academy logo
const CARD_THEMES = {
  emerald: {
    bg: 'linear-gradient(135deg, #0a1f1a 0%, #0d2b22 50%, #0a1f1a 100%)',
    border: 'rgba(16,185,129,0.25)',
    borderHover: 'rgba(16,185,129,0.6)',
    glow: '#10b981',
    badgeBg: 'rgba(16,185,129,0.12)',
    badgeBorder: 'rgba(16,185,129,0.3)',
    badgeText: '#6ee7b7',
    dot: '#10b981',
    featureBg: 'rgba(16,185,129,0.08)',
    featureBorder: 'rgba(16,185,129,0.2)',
    accent: '#10b981',
    shimmer: 'from-emerald-400/0 via-emerald-400/5 to-emerald-400/0',
  },
  purple: {
    bg: 'linear-gradient(135deg, #130d1f 0%, #1a0f2e 50%, #130d1f 100%)',
    border: 'rgba(139,92,246,0.25)',
    borderHover: 'rgba(139,92,246,0.6)',
    glow: '#8b5cf6',
    badgeBg: 'rgba(139,92,246,0.12)',
    badgeBorder: 'rgba(139,92,246,0.3)',
    badgeText: '#c4b5fd',
    dot: '#8b5cf6',
    featureBg: 'rgba(139,92,246,0.08)',
    featureBorder: 'rgba(139,92,246,0.2)',
    accent: '#8b5cf6',
    shimmer: 'from-violet-400/0 via-violet-400/5 to-violet-400/0',
  },
  blue: {
    bg: 'linear-gradient(135deg, #080f1f 0%, #0c1530 50%, #080f1f 100%)',
    border: 'rgba(59,130,246,0.25)',
    borderHover: 'rgba(59,130,246,0.6)',
    glow: '#3b82f6',
    badgeBg: 'rgba(59,130,246,0.12)',
    badgeBorder: 'rgba(59,130,246,0.3)',
    badgeText: '#93c5fd',
    dot: '#3b82f6',
    featureBg: 'rgba(59,130,246,0.08)',
    featureBorder: 'rgba(59,130,246,0.2)',
    accent: '#3b82f6',
    shimmer: 'from-blue-400/0 via-blue-400/5 to-blue-400/0',
  },
  pink: {
    bg: 'linear-gradient(135deg, #1f080f 0%, #2e0c17 50%, #1f080f 100%)',
    border: 'rgba(236,72,153,0.25)',
    borderHover: 'rgba(236,72,153,0.6)',
    glow: '#ec4899',
    badgeBg: 'rgba(236,72,153,0.12)',
    badgeBorder: 'rgba(236,72,153,0.3)',
    badgeText: '#f9a8d4',
    dot: '#ec4899',
    featureBg: 'rgba(236,72,153,0.08)',
    featureBorder: 'rgba(236,72,153,0.2)',
    accent: '#ec4899',
    shimmer: 'from-pink-400/0 via-pink-400/5 to-pink-400/0',
  },
  gold: {
    bg: 'linear-gradient(135deg, #1a1200 0%, #241a00 50%, #1a1200 100%)',
    border: 'rgba(212,175,55,0.25)',
    borderHover: 'rgba(212,175,55,0.6)',
    glow: '#d4af37',
    badgeBg: 'rgba(212,175,55,0.12)',
    badgeBorder: 'rgba(212,175,55,0.3)',
    badgeText: '#fcd34d',
    dot: '#d4af37',
    featureBg: 'rgba(212,175,55,0.08)',
    featureBorder: 'rgba(212,175,55,0.2)',
    accent: '#d4af37',
    shimmer: 'from-yellow-400/0 via-yellow-400/5 to-yellow-400/0',
  },
  orange: {
    bg: 'linear-gradient(135deg, #1a0e00 0%, #261400 50%, #1a0e00 100%)',
    border: 'rgba(251,146,60,0.25)',
    borderHover: 'rgba(251,146,60,0.6)',
    glow: '#fb923c',
    badgeBg: 'rgba(251,146,60,0.12)',
    badgeBorder: 'rgba(251,146,60,0.3)',
    badgeText: '#fdba74',
    dot: '#fb923c',
    featureBg: 'rgba(251,146,60,0.08)',
    featureBorder: 'rgba(251,146,60,0.2)',
    accent: '#fb923c',
    shimmer: 'from-orange-400/0 via-orange-400/5 to-orange-400/0',
  },
};

// Map old badgeColor → theme key
const COLOR_MAP = {
  green: 'emerald',
  purple: 'purple',
  blue: 'blue',
  pink: 'pink',
  orange: 'orange',
  gold: 'gold',
};

export default function ResourceCard({
  badge,
  badgeColor = 'green',
  title,
  description,
  features = [],
  href,
}) {
  const themeKey = COLOR_MAP[badgeColor] || 'emerald';
  const t = CARD_THEMES[themeKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={href} className="block h-full group">
        <div
          className="relative flex flex-col h-full min-h-[180px] rounded-2xl overflow-hidden transition-all duration-400 cursor-pointer"
          style={{
            background: t.bg,
            border: `1px solid ${t.border}`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.border = `1px solid ${t.borderHover}`;
            e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.5), 0 0 40px ${t.glow}22`;
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02) perspective(1000px) rotateY(1deg) rotateX(-1deg)';
            e.currentTarget.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.border = `1px solid ${t.border}`;
            e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.4)`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />

          {/* corner glow */}
          <div
            className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-35"
            style={{ background: t.glow }}
          />

          {/* Gold top accent line */}
          <div
            className="absolute top-0 left-0 h-[1.5px] w-0 transition-all duration-500 group-hover:w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)` }}
          />

          <div className="relative z-10 flex flex-col h-full p-6 gap-4">

            {/* badge */}
            <div
              className="self-start inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide"
              style={{
                background: t.badgeBg,
                border: `1px solid ${t.badgeBorder}`,
                color: t.badgeText,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: t.dot,
                  boxShadow: `0 0 6px ${t.dot}`,
                }}
              />
              {badge}
            </div>

            {/* title */}
            <h3
              className="text-2xl font-extrabold leading-tight tracking-tight text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {title}
            </h3>

            {/* description */}
            <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {description}
            </p>

            {/* features */}
            <div className="flex flex-col gap-2">
              {features.map((feature, idx) => {
                const Icon = feature.icon || (() => null);
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[11px] font-medium"
                    style={{
                      background: t.featureBg,
                      border: `1px solid ${t.featureBorder}`,
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: t.accent }} />
                    {feature.text}
                  </div>
                );
              })}
            </div>

            {/* divider */}
            <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* CTA */}
            <div
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-all duration-300"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.color = t.accent}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <span
                className="h-px w-5 bg-current transition-all duration-300 group-hover:w-8"
                style={{ background: 'currentColor' }}
              />
              Explore
              <ArrowRight
                className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
              />
            </div>
          </div>

          {/* bottom accent line slide */}
          <div
            className="absolute bottom-0 left-0 h-[1.5px] w-0 transition-all duration-500 group-hover:w-full"
            style={{ background: `linear-gradient(90deg, ${t.accent}, transparent)` }}
          />
        </div>
      </Link>
    </motion.div>
  );
}