'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const SECTIONS = [
  {
    title: 'Software Jobs',
    description: 'Browse software and tech job openings. Find roles that match your skills.',
    href: '/career/software-jobs',
    svg: '/software-jobs.svg',
  },
  {
    title: 'Interview Questions',
    description: 'Practice common interview questions and answers for technical and HR rounds.',
    href: '/career/interview-questions',
    svg: '/interview-questions.svg',
  },
  {
    title: 'Placement Training',
    description: 'Structured training to get you job-ready: resume, interviews, and soft skills.',
    href: '/career/placement-training',
    svg: '/placement-training.svg',
  },
];

export default function CareerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Career</h1>
          <p className="text-muted-foreground text-lg">Jobs, interview prep, and placement support</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {SECTIONS.map((s) => {
            return (
              <Link key={s.href} href={s.href}>
                <Card className="border-2 h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-8">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <Image src={s.svg} alt={s.title} className="h-14 w-14 dark:invert" width={40} height={40} />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">{s.title}</h2>
                    <p className="text-muted-foreground text-sm mb-6">{s.description}</p>
                    <Button variant="outline" className="w-full">Explore</Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
