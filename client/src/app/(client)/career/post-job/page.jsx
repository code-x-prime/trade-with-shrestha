'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JobForm from '@/components/forms/JobForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function PostJobPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please login to post a job');
      router.push('/auth?redirect=/career/post-job');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Post a Job</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Find the best talent for your team. Post your job opening and get verified by our admin team.
                {isAdmin ? ' As an admin, your posts are published immediately.' : ' Once verified, your job will be visible to thousands of candidates.'}
            </p>
        </div>

        <JobForm isAdmin={isAdmin} />
      </main>
    </div>
  );
}
