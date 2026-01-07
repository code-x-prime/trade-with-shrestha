/**
 * Server-side API functions for Next.js Server Components
 * These functions run on the server and don't require authentication tokens
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch ebook by slug (Server-side)
 */
export async function getEbookBySlug(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/ebooks/slug/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data.ebook : null;
    } catch (error) {
        console.error('Error fetching ebook:', error);
        return null;
    }
}

/**
 * Fetch indicator by slug (Server-side)
 */
export async function getIndicatorBySlug(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/indicators/slug/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data.indicator : null;
    } catch (error) {
        console.error('Error fetching indicator:', error);
        return null;
    }
}

/**
 * Fetch webinar by slug (Server-side)
 */
export async function getWebinarBySlug(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/webinars/slug/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data.webinar : null;
    } catch (error) {
        console.error('Error fetching webinar:', error);
        return null;
    }
}

/**
 * Fetch guidance by slug (Server-side)
 */
export async function getGuidanceBySlug(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/guidance/slug/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data.guidance : null;
    } catch (error) {
        console.error('Error fetching guidance:', error);
        return null;
    }
}

/**
 * Fetch mentorship by slug (Server-side)
 */
export async function getMentorshipBySlug(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/mentorship/slug/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data.mentorship : null;
    } catch (error) {
        console.error('Error fetching mentorship:', error);
        return null;
    }
}

/**
 * Fetch course by slug (Server-side)
 */
export async function getCourseBySlug(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/slug/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data.course : null;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

