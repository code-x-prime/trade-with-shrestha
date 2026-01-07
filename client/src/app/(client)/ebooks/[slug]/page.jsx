import { getEbookBySlug } from '@/lib/server-api';
import EbookDetailClient from '@/components/EbookDetailClient';
import { notFound } from 'next/navigation';

// Strip HTML tags for description
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }) {
  const ebook = await getEbookBySlug(params.slug);
  
  if (!ebook) {
    return {
      title: 'E-book Not Found | Shrestha Academy',
      description: 'The e-book you are looking for does not exist.',
    };
  }

  const description = ebook.shortDescription || stripHtml(ebook.description).substring(0, 160);
  const title = `${ebook.title} | Shrestha Academy - LMS`;

  return {
    title,
    description: description || 'Learn trading with expert guidance from Shrestha Academy',
    openGraph: {
      title,
      description,
      images: ebook.image1Url ? [ebook.image1Url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ebook.image1Url ? [ebook.image1Url] : [],
    },
  };
}

export default async function EbookDetailPage({ params }) {
  const ebook = await getEbookBySlug(params.slug);

  if (!ebook) {
    notFound();
  }

  return <EbookDetailClient ebook={ebook} />;
}
