import { notFound } from 'next/navigation';
import { getMentorshipBySlug } from '@/lib/server-api';
import MentorshipDetailClient from '@/components/MentorshipDetailClient';

export async function generateMetadata({ params }) {
  const mentorship = await getMentorshipBySlug(params.slug);
  
  if (!mentorship) {
    return {
      title: 'Mentorship Program Not Found',
    };
  }

  return {
    title: `${mentorship.title} - Live Mentorship Program | Shrestha Academy`,
    description: mentorship.description?.replace(/<[^>]*>/g, '').substring(0, 160) || 'Join our live mentorship program',
    openGraph: {
      title: mentorship.title,
      description: mentorship.description?.replace(/<[^>]*>/g, '').substring(0, 160) || 'Join our live mentorship program',
      images: mentorship.coverImageUrl ? [mentorship.coverImageUrl] : [],
    },
  };
}

export default async function MentorshipDetailPage({ params }) {
  const mentorship = await getMentorshipBySlug(params.slug);

  if (!mentorship) {
    notFound();
  }

  return <MentorshipDetailClient mentorship={mentorship} />;
}
