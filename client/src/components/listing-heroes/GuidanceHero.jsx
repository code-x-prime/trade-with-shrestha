"use client"

import ListingHero from './ListingHero';
import { Target, UserCheck } from 'lucide-react';

export default function GuidanceHero() {
  return (
    <ListingHero
      badge="Distraction-free 1:1 Time"
      badgeColor="blue"
      title="1:1 Guidance!"
      description="Personal guidance calls with industry experts focused on your learning style, goals, and risk profile."
      features={[
        { icon: Target, text: 'Tailored playbooks' },
        { icon: UserCheck, text: 'Confidential 1:1 calls' },
      ]}
      ctaText="Explore Guidance"
      ctaLink="#guidance"
      gradientFrom="from-blue-600"
      gradientVia="via-cyan-700"
      gradientTo="to-blue-800"
    />
  )
}
