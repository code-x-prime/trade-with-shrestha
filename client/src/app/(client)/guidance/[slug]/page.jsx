import { getGuidanceBySlug } from '@/lib/server-api';
import { notFound } from 'next/navigation';
import GuidanceDetailClient from '@/components/GuidanceDetailClient';

export async function generateMetadata({ params }) {
  const guidance = await getGuidanceBySlug(params.slug);
  
  if (!guidance) {
    return {
      title: 'Guidance Not Found - Shrestha Academy',
    };
  }

  return {
    title: `${guidance.title} - 1:1 Guidance | Shrestha Academy`,
    description: guidance.description || `Book a ${guidance.durationMinutes}-minute guidance session with ${guidance.expertName}`,
  };
}

export default async function GuidanceDetailPage({ params }) {
  const guidance = await getGuidanceBySlug(params.slug);

  if (!guidance) {
    notFound();
  }

  return <GuidanceDetailClient guidance={guidance} />;
}

