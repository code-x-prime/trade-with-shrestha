const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://shrestha.academy';

/** @returns {import('next').MetadataRoute.Robots} */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/auth',
          '/auth/',
          '/cart',
          '/cart/',
          '/checkout',
          '/checkout/',
          '/profile',
          '/profile/',
          '/search',
          '/search/',
          '/courses/*/learn',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
