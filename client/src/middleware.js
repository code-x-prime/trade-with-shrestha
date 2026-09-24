import { NextResponse } from 'next/server';
import { decodeJwt } from 'jose';

// Decode JWT without verification (server will verify)
function decodeToken(token) {
    try {
        const decoded = decodeJwt(token);
        return decoded;
    } catch (error) {
        console.error('Token decode error:', error);
        return null;
    }
}

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const token = request.cookies.get('accessToken')?.value;

    // Decode token to get user info
    const decoded = token ? decodeToken(token) : null;
    const isLoggedIn = !!decoded;
    const isAdmin = decoded?.role === 'ADMIN';

    // ====== NOINDEX (never rank private pages) ======
    // Covers /admin (client layout can't export metadata) + other private routes
    const noindexPrefixes = [
        '/admin',
        '/auth',
        '/cart',
        '/checkout',
        '/profile',
        '/search',
    ];
    const isNoindex =
        noindexPrefixes.some(
            (p) => pathname === p || pathname.startsWith(p + '/')
        ) || /^\/courses\/[^/]+\/learn/.test(pathname);

    // ====== AUTH PAGE PROTECTION ======
    // Redirect logged-in users away from /auth page
    if (pathname === '/auth' || pathname.startsWith('/auth/')) {
        if (isLoggedIn) {
            // Redirect to appropriate page based on role
            const redirectUrl = isAdmin ? '/admin' : '/profile';
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
    }

    // ====== ADMIN ROUTES PROTECTION ======
    // Admin routes require authentication AND admin role
    if (pathname.startsWith('/admin')) {
        if (!isLoggedIn) {
            // Not logged in - redirect to auth
            const url = new URL('/auth', request.url);
            url.searchParams.set('redirect', pathname);
            const res = NextResponse.redirect(url);
            res.headers.set('X-Robots-Tag', 'noindex, nofollow');
            return res;
        }

        if (!isAdmin) {
            // Logged in but not admin - redirect to home with error
            const url = new URL('/', request.url);
            url.searchParams.set('error', 'unauthorized');
            const res = NextResponse.redirect(url);
            res.headers.set('X-Robots-Tag', 'noindex, nofollow');
            return res;
        }
    }

    // ====== PROTECTED USER ROUTES ======
    // These routes require authentication (any logged-in user)
    const protectedRoutes = [
        '/profile',
        '/checkout',
    ];

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (isProtectedRoute && !isLoggedIn) {
        const url = new URL('/auth', request.url);
        url.searchParams.set('redirect', pathname);
        const res = NextResponse.redirect(url);
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
    }

    // ====== ENROLLMENT/PURCHASE PROTECTION ======
    // Course learn pages require login (not necessarily enrollment - page handles that)
    if (pathname.match(/^\/courses\/[^\/]+\/learn/)) {
        if (!isLoggedIn) {
            const url = new URL('/auth', request.url);
            url.searchParams.set('redirect', pathname);
            const res = NextResponse.redirect(url);
            res.headers.set('X-Robots-Tag', 'noindex, nofollow');
            return res;
        }
    }

    const response = NextResponse.next();
    if (isNoindex) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};
