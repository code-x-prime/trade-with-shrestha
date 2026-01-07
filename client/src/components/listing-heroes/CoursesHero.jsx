"use client"

import ListingHero from './ListingHero';
import { Video, CheckCircle2 } from 'lucide-react';

export default function CoursesHero() {
  return (
    <ListingHero
      badge="Structured Learning Path"
      badgeColor="green"
      title="Online Courses!"
      description="Master professional skills with structured courses, step-by-step frameworks, and guidance from market practitioners."
      features={[
        { icon: Video, text: 'Self-paced video lessons' },
        { icon: CheckCircle2, text: 'Progress tracking' },
      ]}
      ctaText="Explore Courses"
      ctaLink="#courses"
      gradientFrom="from-purple-600"
      gradientVia="via-purple-700"
      gradientTo="to-purple-800"
    />
  )
}
