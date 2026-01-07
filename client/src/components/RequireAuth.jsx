'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * RequireAuth component - wraps content that requires authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render when authenticated
 * @param {boolean} props.adminOnly - If true, requires admin role
 * @param {React.ReactNode} props.fallback - Optional fallback to show while loading
 */
export default function RequireAuth({ children, adminOnly = false, fallback = null }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Not logged in - redirect to auth with return URL
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      } else if (adminOnly && !isAdmin) {
        // Logged in but not admin - redirect to home
        router.push('/?error=unauthorized');
      }
    }
  }, [loading, isAuthenticated, isAdmin, adminOnly, router, pathname]);

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-600" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-600" />
          <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive">Access denied</p>
          <p className="mt-2 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * useRequireAuth hook - for checking auth in components
 * Returns { isReady, isAuthenticated, isAdmin, redirectToAuth }
 */
export function useRequireAuth() {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const redirectToAuth = (message = null) => {
    const url = new URL('/auth', window.location.origin);
    url.searchParams.set('redirect', pathname);
    if (message) {
      url.searchParams.set('message', message);
    }
    router.push(url.toString());
  };

  return {
    isReady: !loading,
    isAuthenticated,
    isAdmin,
    user,
    redirectToAuth,
  };
}

