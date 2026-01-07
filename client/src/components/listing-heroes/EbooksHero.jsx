"use client"

import ListingHero from './ListingHero';
import { Download, BookOpen } from 'lucide-react';

export default function EbooksHero() {
  return (
    <ListingHero
      badge="Quiet Reading Space"
      badgeColor="green"
      title="E-Books!"
      description="Curated expert knowledge distilled into focused, easy-to-read books you can revisit any time."
      features={[
        { icon: Download, text: 'Download & keep forever' },
        { icon: BookOpen, text: 'Structured reading lists' },
      ]}
      ctaText="Explore E-Books"
      ctaLink="#ebooks"
      gradientFrom="from-emerald-600"
      gradientVia="via-teal-700"
      gradientTo="to-emerald-800"
    />
  )
}
