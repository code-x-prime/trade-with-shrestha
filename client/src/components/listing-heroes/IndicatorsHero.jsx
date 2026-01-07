"use client"

import ListingHero from './ListingHero';
import { BarChart3, Zap } from 'lucide-react';

export default function IndicatorsHero() {
  return (
    <ListingHero
      badge="Precision Analysis Tools"
      badgeColor="orange"
      title="Market Indicators!"
      description="Powerful, battle-tested tools that plug into your charts and help you analyze market trends with more confidence."
      features={[
        { icon: BarChart3, text: 'Multi-asset ready' },
        { icon: Zap, text: 'Intraday & swing' },
      ]}
      ctaText="Explore Indicators"
      ctaLink="#indicators"
      gradientFrom="from-orange-600"
      gradientVia="via-amber-700"
      gradientTo="to-orange-800"
    />
  )
}
