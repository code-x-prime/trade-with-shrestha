'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import JobForm from '@/components/forms/JobForm';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to edit jobs');
      router.push('/auth');
      return;
    }

    if (params?.id && user) {
      fetchJob();
    }
  }, [params?.id, user, authLoading]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${params.id}`);
      if (res.data?.success) {
        const jobData = res.data.data.job;
        
        // Check if user is authorized to edit this job
        if (!isAdmin && jobData.authorId !== user.id) {
          toast.error('You are not authorized to edit this job');
          router.push('/admin/jobs');
          return;
        }
        
        setJob(jobData);
      }
    } catch (error) {
      toast.error('Failed to fetch job');
      router.push('/admin/jobs');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!job) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Job</h1>
        <p className="text-muted-foreground">Update job posting details</p>
      </div>
      <JobForm isAdmin={isAdmin} initialData={job} />
    </div>
  );
}
