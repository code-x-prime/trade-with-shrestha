import { STATIC_COURSES } from '@/data/courses';
import { USE_STATIC } from '@/lib/constants';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://shrestha.academy';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const STATIC_PAGES = [
  '/',
  '/about',
  '/bundle',
  '/career',
  '/career/interview-questions',
  '/career/placement-training',
  '/career/post-job',
  '/career/software-jobs',
  '/codexprime',
  '/contact',
  '/courses',
  '/ebooks',
  '/events',
  '/gallery',
  '/guidance',
  '/indicators',
  '/mentorship',
  '/offline-batches',
  '/placement',
  '/privacy',
  '/refund',
  '/services/corporate-training',
  '/services/hire-from-us',
  '/services/mock-interview',
  '/services/practice-with-expert',
  '/subscription',
  '/terms',
  '/training-schedule',
  '/verify-certificate',
  '/webinars',
];

async function fetchList(path) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.success) return [];
    const data = json.data;
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    return Object.values(data).find(Array.isArray) || [];
  } catch {
    return [];
  }
}

function toEntry(path, priority = 0.7, changeFrequency = 'weekly') {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

/** @returns {import('next').MetadataRoute.Sitemap} */
export default async function sitemap() {
  const staticEntries = STATIC_PAGES.map((path) =>
    toEntry(path, path === '/' ? 1.0 : 0.7)
  );

  const courseSlugs = new Set(STATIC_COURSES.map((c) => c.slug));

  if (!USE_STATIC) {
    const courses = await fetchList('/courses?published=true&limit=200');
    courses.forEach((c) => c.slug && courseSlugs.add(c.slug));
  }

  // API list endpoints (best-effort; skip section if API down)
  let ebooks = [];
  let webinars = [];
  let guidance = [];
  let mentorship = [];
  let offlineBatches = [];
  let bundles = [];
  let corporateTrainings = [];
  try {
    [
      ebooks,
      webinars,
      guidance,
      mentorship,
      offlineBatches,
      bundles,
      corporateTrainings,
    ] = await Promise.all([
      fetchList('/ebooks?isPublished=true&limit=200'),
      fetchList('/webinars?status=UPCOMING&limit=200'),
      fetchList('/guidance?limit=200'),
      fetchList('/mentorship?limit=200'),
      fetchList('/offline-batches?limit=200'),
      fetchList('/bundles?isPublished=true&limit=200'),
      fetchList('/corporate-training'),
    ]);
  } catch {
    // keep static entries only
  }

  const dynamicEntries = [
    ...[...courseSlugs].map((slug) => toEntry(`/courses/${slug}`, 0.9)),
    ...ebooks.filter((e) => e?.slug && e?.isPublished !== false).map((e) => toEntry(`/ebooks/${e.slug}`, 0.8)),
    ...webinars.filter((w) => w?.slug).map((w) => toEntry(`/webinars/${w.slug}`, 0.7)),
    ...guidance.filter((g) => g?.slug && g?.status !== 'INACTIVE').map((g) => toEntry(`/guidance/${g.slug}`, 0.7)),
    ...mentorship.filter((m) => m?.slug && m?.isPublished !== false).map((m) => toEntry(`/mentorship/${m.slug}`, 0.7)),
    ...offlineBatches.filter((b) => b?.slug).map((b) => toEntry(`/offline-batches/${b.slug}`, 0.7)),
    ...bundles.filter((b) => b?.slug && b?.isPublished !== false).map((b) => toEntry(`/bundle/${b.slug}`, 0.8)),
    ...corporateTrainings
      .filter((t) => t?.slug && t?.isActive !== false)
      .map((t) => toEntry(`/services/corporate-training/${t.slug}`, 0.6)),
  ].filter(Boolean);

  // Safety: never emit private/admin URLs
  const blocked = /^\/(admin|auth|cart|checkout|profile|search)(\/|$)|\/learn(\/|$)/;
  return [...staticEntries, ...dynamicEntries].filter(
    (e) => !blocked.test(new URL(e.url).pathname)
  );
}
