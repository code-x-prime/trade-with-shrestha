"use client"

import ListingHero from './ListingHero';
import { Users, Calendar } from 'lucide-react';

export default function MentorshipHero() {
  return (
    <ListingHero
      badge="Cohort-based Mentorship"
      badgeColor="purple"
      title="Professional Mentorship!"
      description="Join curated mentorship cohorts, learn in small groups, and grow with structured career roadmaps."
      features={[
        { icon: Users, text: 'Limited cohort sizes' },
        { icon: Calendar, text: 'Multi-week journeys' },
      ]}
      ctaText="Explore Mentorship"
      ctaLink="#mentorship"
      gradientFrom="from-indigo-600"
      gradientVia="via-purple-700"
      gradientTo="to-purple-800"
    />
  )
}
