'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { FiCheck, FiX, FiEdit, FiTrash2, FiExternalLink } from 'react-icons/fi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs/admin/all');
      if (res.data?.success) {
        setJobs(res.data.data.jobs);
      }
    } catch (error) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, verify) => {
    try {
      await api.patch(`/jobs/${id}/verify`, { verify });
      toast.success(verify ? 'Job verified successfully' : 'Job rejected');
      fetchJobs();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Management</h1>
          <p className="text-muted-foreground">Manage all job postings</p>
        </div>
        <Button onClick={() => router.push('/admin/jobs/new')}>Post New Job</Button>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title & Company</TableHead>
              <TableHead>Posted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-10">Loading jobs...</TableCell>
               </TableRow>
            ) : jobs.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-10">No jobs found</TableCell>
               </TableRow>
            ) : (
                jobs.map((job) => (
                    <TableRow key={job.id}>
                        <TableCell>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-muted-foreground">{job.companyName}</div>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">
                                {job.user ? (
                                    <>
                                       <span className="font-medium">{job.user.name}</span>
                                       <br />
                                       <span className="text-xs text-muted-foreground">{job.user.email}</span>
                                    </>
                                ) : 'Admin'}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                                <Badge variant={job.status === 'PUBLISHED' ? 'default' : 'secondary'} className={job.status === 'PUBLISHED' ? 'bg-green-600' : ''}>
                                    {job.status}
                                </Badge>
                                {job.isVerified ? (
                                    <span className="text-xs text-green-600 flex items-center"><FiCheck className="mr-1"/> Verified</span>
                                ) : (
                                    <span className="text-xs text-amber-600 flex items-center">Unverified</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Link href={`/career/software-jobs/${job.slug}`} target="_blank">
                                    <Button variant="ghost" size="icon" title="View">
                                        <FiExternalLink />
                                    </Button>
                                </Link>
                                
                                {!job.isVerified && (
                                    <Button onClick={() => handleVerify(job.id, true)} variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                                        Verify
                                    </Button>
                                )}

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Edit"
                                  onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}
                                >
                                     <FiEdit />
                                </Button>
                                
                                <Button onClick={() => handleDelete(job.id)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <FiTrash2 />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
