import { getCourseBySlug } from '@/lib/server-api';
import CourseDetailClient from '@/components/CourseDetailClient';
import { notFound } from 'next/navigation';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }) {
  const course = await getCourseBySlug(params.slug);
  
  if (!course) {
    return {
      title: 'Course Not Found | Shrestha Academy',
      description: 'The course you are looking for does not exist.',
    };
  }

  const description = stripHtml(course.description).substring(0, 160);
  const title = `${course.title} | Shrestha Academy - LMS`;

  return {
    title,
    description: description || 'Learn trading with expert guidance from Shrestha Academy',
    openGraph: {
      title,
      description,
      images: course.coverImage ? [course.coverImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: course.coverImage ? [course.coverImage] : [],
    },
  };
}

export default async function CourseDetailPage({ params }) {
  const course = await getCourseBySlug(params.slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailClient course={course} />;
}

