'use client';

import ListingHero from './ListingHero';
import { Video, Calendar } from 'lucide-react';

export default function TrainingScheduleHero() {
  return (
    <ListingHero
      badge="Free demos"
      badgeColor="blue"
      title="Demo schedule"
      description="Join upcoming online demos. Filter by type, search by course, and use Zoom or WhatsApp links to join—no booking needed for listed sessions."
      features={[
        { icon: Video, text: 'Join Zoom / Google Meet' },
        { icon: Calendar, text: 'Join WhatsApp for updates' },
      ]}
      ctaText="View schedule"
      ctaLink="#schedule"
      gradientFrom="from-brand-600"
      gradientVia="via-brand-700"
      gradientTo="to-brand-800"
    />
  );
}
