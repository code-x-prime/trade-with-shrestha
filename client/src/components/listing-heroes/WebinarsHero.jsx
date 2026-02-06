"use client"

import ListingHero from './ListingHero';
import { MessageCircle, Video } from 'lucide-react';

export default function WebinarsHero() {
  return (
    <ListingHero
      badge="Live Market Conversations"
      badgeColor="pink"
      title="Live Events!"
      description="Interactive sessions with market experts to decode live setups, strategies, and risk management."
      features={[
        { icon: MessageCircle, text: 'Real-time Q&A' },
        { icon: Video, text: 'Session replays' },
      ]}
      ctaText="Explore Webinars"
      ctaLink="#webinars"
      gradientFrom="from-red-600"
      gradientVia="via-pink-700"
      gradientTo="to-rose-800"
    />
  )
}
