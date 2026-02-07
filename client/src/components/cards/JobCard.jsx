'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const JobCard = ({ job }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 group flex flex-col h-full"
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
         {/* Logo */}
         <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-gray-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center p-2 border border-zinc-100 dark:border-zinc-700">
           {job.companyLogoUrl ? (
             <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain rounded" />
           ) : (
             <FiBriefcase className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" />
           )}
         </div>

         {/* Title & Company */}
         <div className="flex-1 min-w-0">
           <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
             <div className="min-w-0">
               <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  <Link href={`/career/software-jobs/${job.slug}`} className="hover:underline focus:outline-none">
                    <span className="absolute inset-0 sm:hidden" aria-hidden="true" />
                    {job.title}
                  </Link>
               </h3>
               <div className="flex items-center gap-2 mt-1">
                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{job.companyName}</p>
                 {job.isVerified && (
                    <FiCheckCircle className="text-indigo-500 w-3.5 h-3.5 flex-shrink-0" title="Verified Company" />
                 )}
               </div>
             </div>
             
             {job.isVerified && (
               <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 self-start text-[10px] uppercase tracking-wider hidden sm:inline-flex">
                  Verified
               </Badge>
             )}
           </div>
         </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-1.5 min-w-0">
              <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> 
              <span className="truncate">{job.location || 'Remote'}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
              <FiClock className="w-4 h-4 text-gray-400 flex-shrink-0" /> 
              <span className="truncate">{job.experience || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 col-span-2">
              <FiDollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" /> 
              <span className="truncate font-medium text-gray-700 dark:text-gray-300">
                {job.salary 
                  ? `${job.currency} ${job.salary}` 
                  : 'Competitive Salary'}
              </span>
          </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
         <div className="flex gap-2 min-w-0 overflow-hidden">
            {job.type?.slice(0, 2).map((t) => (
                <Badge key={t} variant="outline" className="text-xs font-normal opacity-70 whitespace-nowrap">
                    {t.replace('_', ' ')}
                </Badge>
            ))}
            {job.type?.length > 2 && (
               <span className="text-xs text-gray-400 self-center">+{job.type.length - 2}</span>
            )}
         </div>

         <div className="hidden sm:block">
            <Link href={`/career/software-jobs/${job.slug}`}>
              <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:text-white transition-all">
                  View Details
              </Button>
            </Link>
         </div>
         <div className="sm:hidden text-indigo-600 text-sm font-medium">
            View Details &rarr;
         </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
