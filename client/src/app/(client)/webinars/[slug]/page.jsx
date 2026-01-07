import { getWebinarBySlug } from '@/lib/server-api';
import WebinarDetailClient from '@/components/WebinarDetailClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const webinar = await getWebinarBySlug(params.slug);

  if (!webinar) {
    return {
      title: 'Webinar Not Found',
    };
  }

  const description = webinar.description
    ? webinar.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Join ${webinar.instructorName} for ${webinar.title}`;

  return {
    title: `${webinar.title} | Shrestha Academy`,
    description,
    openGraph: {
      title: webinar.title,
      description,
      images: webinar.imageUrl ? [webinar.imageUrl] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: webinar.title,
      description,
      images: webinar.imageUrl ? [webinar.imageUrl] : [],
    },
  };
}

export default async function WebinarDetailPage({ params }) {
  const webinar = await getWebinarBySlug(params.slug);

  if (!webinar) {
    notFound();
  }

  return <WebinarDetailClient webinar={webinar} />;
}

