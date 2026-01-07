'use client';

import ListingHero from './ListingHero';
import { Calendar, Users, CheckCircle2 } from 'lucide-react';

export default function OfflineBatchesHero() {
  return (
    <ListingHero
      badge="In-Person Training"
      badgeColor="green"
      title="Offline Batches!"
      description="Join our in-person training programs with expert instructors, hands-on learning, and structured guidance from market practitioners."
      features={[
        { icon: Calendar, text: 'Scheduled Sessions' },
        { icon: Users, text: 'Interactive Learning' },
        { icon: CheckCircle2, text: 'Progress Tracking' },
      ]}
      ctaText="Explore Batches"
      ctaLink="#batches"
      gradientFrom="from-brand-600"
      gradientVia="via-brand-700"
      gradientTo="to-brand-800"
    />
  );
}

