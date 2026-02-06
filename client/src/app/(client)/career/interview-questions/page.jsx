'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';

export default function InterviewQuestionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-2">
        <Link href="/career" className="text-sm text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1">
          ← Career
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <ListingHero
          badge="Resources"
          badgeColor="orange"
          title="Interview Questions"
          description="Common technical and HR interview questions with tips. Prepare better with our question bank."
          features={[
            { icon: HelpCircle, text: 'Technical & HR questions' },
            { icon: HelpCircle, text: 'Tips and best practices' },
          ]}
          ctaText="Contact Us"
          ctaLink="/contact"
          gradientFrom="from-amber-600"
          gradientVia="via-orange-600"
          gradientTo="to-orange-800"
        />
      </div>

      <section id="content" className="max-w-4xl mx-auto px-4 pb-12">
        <Card className="rounded-xl border border-border bg-card shadow-sm dark:bg-gray-900/30 overflow-hidden">
          <CardContent className="p-6 md:p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-brand-500/10 dark:bg-brand-400/10 flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Interview question bank and tips will be added here. Check back soon or contact us.
            </p>
            <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
