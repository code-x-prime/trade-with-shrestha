'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiSearch, FiBriefcase, FiFilter } from 'react-icons/fi';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import JobCard from '@/components/cards/JobCard';

export default function JobListingPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    experience: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('');
  
  // Typing animation effect
  useEffect(() => {
    const placeholders = [
      "Software Engineer", 
      "Product Designer", 
      "Frontend Developer", 
      "Backend Developer", 
      "Data Scientist",
      "DevOps Engineer",
      "Full Stack Developer"
    ];
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      const currentText = placeholders[currentIndex];
      
      if (isDeleting) {
        setSearchPlaceholder(currentText.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setSearchPlaceholder(currentText.substring(0, charIndex + 1));
        charIndex++;
      }

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % placeholders.length;
        typeSpeed = 500; // Pause before new word
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    type();

    return () => clearTimeout(timeoutId);
  }, []);
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [filters, searchTerm]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let query = '/jobs?status=PUBLISHED&isVerified=true';
      
      if (searchTerm?.trim()) query += `&search=${encodeURIComponent(searchTerm.trim())}`;
      if (filters.type) query += `&type=${encodeURIComponent(filters.type)}`;
      if (filters.location) query += `&location=${encodeURIComponent(filters.location)}`;
      if (filters.experience) query += `&experience=${encodeURIComponent(filters.experience)}`;
      
      const res = await api.get(query);
      if (res.data?.success) {
        setJobs(res.data.data.jobs);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is now handled by debounced useEffect
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: '', location: '', experience: '' });
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black">

      {/* Hero Header */}
      <section className="bg-indigo-700 text-white pt-32 pb-20 px-6"
        style={{
          backgroundImage: 'linear-gradient(rgba(67, 56, 202, 0.4), rgba(67, 56, 202, 0.4)), url(/Career.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold mb-4"
            >
                Find Your Next Career Move
            </motion.h1>
            <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            >
                Browse latest openings in software, design, and engineering.
            </motion.p>

            {/* Search Bar */}
            <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSearch}
                className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-full p-2 pl-4 md:pl-6 flex shadow-2xl items-center border border-transparent focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all dark:shadow-indigo-900/10 w-full"
            >
                <FiSearch className="text-xl text-gray-400 flex-shrink-0" />
                <input 
                    type="text" 
                    placeholder={`Search "${searchPlaceholder}"...`}
                    className="flex-1 px-3 md:px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-base md:text-lg min-w-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" size="lg" className="rounded-full px-4 md:px-8 bg-indigo-600 hover:bg-indigo-700 text-white h-10 md:h-12 shadow-md hover:shadow-lg transition-all flex-shrink-0">
                  <FiSearch className="md:mr-2 w-4 h-4 md:w-5 md:h-5" />
                   <span className='hidden md:block'>Search</span>
                </Button>
            </motion.form>
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold dark:text-white">Latest Openings</h2>
                <div className="flex gap-2">
                    <Button 
                      variant={showFilters ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter className="mr-2" /> Filters
                    </Button>
                    {(filters.type || filters.location || filters.experience || searchTerm) && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Type</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="REMOTE">Remote</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="ON_SITE">On Site</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <input 
                      type="text"
                      placeholder="e.g. New York, Remote"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                      value={filters.experience}
                      onChange={(e) => handleFilterChange('experience', e.target.value)}
                    >
                      <option value="">All Levels</option>
                      <option value="Entry">Entry Level</option>
                      <option value="Junior">Junior (1-3 years)</option>
                      <option value="Mid">Mid Level (3-5 years)</option>
                      <option value="Senior">Senior (5+ years)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
                </div>
            ) : jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                    {jobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800">
                    <FiBriefcase className="mx-auto text-4xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">No jobs found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria</p>
                    {(filters.type || filters.location || filters.experience || searchTerm) && (
                      <Button onClick={clearFilters} variant="outline" className="mt-4">
                        Clear Filters
                      </Button>
                    )}
                </div>
            )}
        </div>
      </section>

      {/* Post Job CTA */}
      <section className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 py-16">
         <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Hiring? Post a Job Today</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Reach thousands of qualified candidates. Post your job opening in minutes and verify your listing.
            </p>
            <Link href="/career/post-job">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                    Post a Job for Free
                </Button>
            </Link>
         </div>
      </section>
    </div>
  );
}
