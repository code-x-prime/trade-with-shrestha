'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2 } from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';

export default function CorporateTrainingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <ListingHero
          badge="Enterprise"
          badgeColor="purple"
          title="Corporate Training"
          description="Upskill your teams with tailored programs. Custom curriculum, live or self-paced sessions, and dedicated support."
          features={[
            { icon: Users, text: 'Custom curriculum for your organization' },
            { icon: CheckCircle2, text: 'Certificates and progress tracking' },
          ]}
          ctaText="Get in Touch"
          ctaLink="/contact"
          gradientFrom="from-purple-600"
          gradientVia="via-purple-700"
          gradientTo="to-purple-800"
        />
      </div>

      <section id="content" className="max-w-4xl mx-auto px-4 pb-12">
        <Card className="rounded-xl border border-border bg-card shadow-sm dark:bg-gray-900/30 overflow-hidden">
          <CardContent className="p-6 md:p-10">
            <ul className="space-y-4 text-muted-foreground max-w-xl mx-auto">
              {['Custom curriculum for your organization', 'Live sessions or self-paced options', 'Certificates and progress tracking', 'Dedicated support'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-base">
                  <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 text-center">
              <Button asChild size="lg" className="bg-brand-600 hover:bg-brand-700 text-white gap-2">
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
