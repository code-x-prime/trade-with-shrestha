import { getIndicatorBySlug } from '@/lib/server-api';
import IndicatorDetailClient from '@/components/IndicatorDetailClient';
import { notFound } from 'next/navigation';

// Strip HTML tags for description
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }) {
  const indicator = await getIndicatorBySlug(params.slug);
  
  if (!indicator) {
    return {
      title: 'Indicator Not Found | Shrestha Academy',
      description: 'The indicator you are looking for does not exist.',
    };
  }

  const description = stripHtml(indicator.description).substring(0, 160);
  const title = `${indicator.name} | Shrestha Academy - LMS`;

  return {
    title,
    description: description || 'Premium trading indicator from Shrestha Academy',
    openGraph: {
      title,
      description,
      images: indicator.imageUrl ? [indicator.imageUrl] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: indicator.imageUrl ? [indicator.imageUrl] : [],
    },
  };
}

export default async function IndicatorDetailPage({ params }) {
  const indicator = await getIndicatorBySlug(params.slug);

  if (!indicator) {
    notFound();
  }

  return <IndicatorDetailClient indicator={indicator} />;
}
