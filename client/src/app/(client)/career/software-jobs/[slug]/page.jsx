'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiShare2, FiCheckCircle } from 'react-icons/fi';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function JobDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchJobDetails();
    }
  }, [slug]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/slug/${slug}`);
      if (res.data?.success) {
        setJob(res.data.data.job);
      }
    } catch (err) {
      console.error(err);
      setError('Job not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
       
            <div className="max-w-4xl mx-auto pt-32 px-6">
                <Skeleton className="h-10 w-2/3 mb-4" />
                <Skeleton className="h-6 w-1/3 mb-8" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    );
  }

  if (error || !job) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
     
            <div className="flex-1 flex flex-col items-center justify-center pt-20">
                <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
                <p className="text-gray-500">The job posting you are looking for might have specific or expired.</p>
            </div>
          
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
     

      <main className="pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
               <div className="flex-1 w-full">
                 <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center p-2 border border-zinc-200 dark:border-zinc-700">
                        {job.companyLogoUrl ? (
                            <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain" />
                        ) : (
                            <FiBriefcase className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">{job.companyName}</span>
                            {job.isVerified && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 h-6">
                                    <FiCheckCircle className="mr-1 w-3.5 h-3.5" /> Verified
                                </Badge>
                            )}
                        </div>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-y-3 gap-x-6 mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 text-sm text-gray-600 dark:text-gray-400">
                    {job.location && (
                        <div className="flex items-center gap-2"><FiMapPin className="text-gray-400" /> {job.location}</div>
                    )}
                    {job.experience && (
                        <div className="flex items-center gap-2"><FiClock className="text-gray-400" /> {job.experience}</div>
                    )}
                    {job.salary && (
                        <div className="flex items-center gap-2"><FiDollarSign className="text-gray-400" /> {job.currency ? `${job.currency} ` : ''}{job.salary}</div>
                    )}
                    {job.type && job.type.length > 0 && (
                        <div className="flex items-center gap-2"><FiBriefcase className="text-gray-400" /> {job.type[0].replace('_', ' ')}</div>
                    )}
                 </div>
               </div>

               <div className="flex flex-col gap-3 w-full md:w-64 md:flex-shrink-0 mt-4 md:mt-0 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <div className="mb-2 text-center md:text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Action</span>
                  </div>
                  {/* Apply Button Logic */}
                  {job.allowsQuickApply ? (
                     <Button 
                       size="lg" 
                       className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                       onClick={() => {
                         if (!user) {
                           toast.error('Please login to apply');
                           router.push('/auth?redirect=' + encodeURIComponent(`/career/software-jobs/${job.slug}`));
                         } else {
                           toast.info('Quick apply feature coming soon!');
                         }
                       }}
                     >
                        Apply Now
                     </Button>
                  ) : job.applyLink ? (
                      <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="w-full">
                         <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                            Apply Externally <FiShare2 className="ml-2 w-4 h-4" />
                         </Button>
                      </a>
                  ) : (
                    <Button disabled size="lg" className="w-full opacity-50 cursor-not-allowed">No Link Available</Button>
                  )}
                  
                  <Button variant="outline" className="w-full bg-white dark:bg-zinc-900">
                    <FiShare2 className="mr-2" /> Share Job
                  </Button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Left Column - Content */}
             <div className="md:col-span-2 space-y-8">
                {/* Description */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-bold mb-6 dark:text-white">Job Description</h2>
                    <div 
                        className="prose dark:prose-invert max-w-none prose-sm md:prose-base text-gray-600 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                </div>

                {/* Requirements */}
                {job.requirements && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-xl font-bold mb-6 dark:text-white">Requirements</h2>
                        <div 
                            className="prose dark:prose-invert max-w-none prose-sm md:prose-base text-gray-600 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: job.requirements }}
                        />
                    </div>
                )}
             </div>

             {/* Right Column - Sidebar */}
             <div className="space-y-6">
                {/* Skills */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold mb-4 dark:text-white">Skills Required</h3>
                    <div className="flex flex-wrap gap-2">
                        {job.skills?.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm font-normal">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Meta Info */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold mb-4 dark:text-white">Job Overview</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="text-gray-500">Posted On</p>
                            <p className="font-medium dark:text-gray-200">{new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Job ID</p>
                            <p className="font-medium dark:text-gray-200">{job.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}
