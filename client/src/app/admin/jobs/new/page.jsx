'use client';

import JobForm from '@/components/forms/JobForm';

export default function AdminPostJobPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Post New Job</h1>
        <p className="text-muted-foreground">Create a new job posting directly as an admin.</p>
      </div>
      <JobForm isAdmin={true} />
    </div>
  );
}
