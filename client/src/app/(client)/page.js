'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, TrendingUp, Award, ArrowRight, Video, Star, Loader2, Download, CheckCircle2, Target, UserCheck, Calendar, MessageCircle, Briefcase, HelpCircle } from 'lucide-react';
import { ebookAPI, courseAPI } from '@/lib/api';

import FlashSaleSection from '@/components/FlashSaleSection';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EbookCard from '@/components/cards/EbookCard';
import CourseCard from '@/components/cards/CourseCard';
import ResourceCard from '@/components/cards/ResourceCard';
import FeaturesSection from '@/components/sections/FeaturesSection';
import CTABanner from '@/components/sections/CTABanner';
import { toast } from 'sonner';
import HomeBannerCarousel from '@/components/HomeBannerCarousel';
import HomeCategoryBar from '@/components/HomeCategoryBar';
import Image from 'next/image';

const EBOOK_CATEGORIES = [
    { value: 'FEATURED', label: 'Featured Books', icon: Award },
    { value: 'BESTSELLER', label: 'Bestsellers', icon: TrendingUp },
    { value: 'NEW', label: 'New Releases', icon: BookOpen },
    { value: 'TRENDING', label: 'Trending', icon: TrendingUp },
    { value: 'POPULAR', label: 'Popular', icon: BookOpen },
];

const COURSE_CATEGORIES = [
    { value: 'FEATURED', label: 'Featured Courses', icon: Star },
    { value: 'BESTSELLER', label: 'Bestsellers', icon: TrendingUp },
    { value: 'NEW', label: 'New Releases', icon: Video },
    { value: 'TRENDING', label: 'Trending', icon: TrendingUp },
    { value: 'POPULAR', label: 'Popular', icon: Award },
];

function HomeContent() {
    const searchParams = useSearchParams();
    const [categoryBooks, setCategoryBooks] = useState({});
    const [categoryCourses, setCategoryCourses] = useState({});
    const [freeCourses, setFreeCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(true);

    useEffect(() => {
        // Show error toast if redirected due to unauthorized access
        const error = searchParams.get('error');
        if (error === 'unauthorized') {
            toast.error('You do not have permission to access that page.');
            // Remove the error param from URL
            window.history.replaceState({}, '', '/');
        }

        fetchCategoryBooks();
        fetchCategoryCourses();
        fetchFreeCourses();
    }, [searchParams]);

    const fetchCategoryBooks = async () => {
        try {
            setLoading(true);
            const promises = EBOOK_CATEGORIES.map(async (category) => {
                try {
                    const response = await ebookAPI.getEbooksByCategory(category.value, 10);
                    if (response.success && response.data.ebooks.length > 0) {
                        return { category: category.value, books: response.data.ebooks };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching ${category.label}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const booksMap = {};
            results.forEach(result => {
                if (result) {
                    booksMap[result.category] = result.books;
                }
            });
            setCategoryBooks(booksMap);
        } catch (error) {
            console.error('Error fetching category books:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryCourses = async () => {
        try {
            setCoursesLoading(true);
            const promises = COURSE_CATEGORIES.map(async (category) => {
                try {
                    // Use getCoursesByBadge for all course categories
                    const response = await courseAPI.getCoursesByBadge(category.value, 10);
                    if (response.success && response.data.courses.length > 0) {
                        return { category: category.value, courses: response.data.courses };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching ${category.label}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const coursesMap = {};
            results.forEach(result => {
                if (result) {
                    coursesMap[result.category] = result.courses;
                }
            });
            setCategoryCourses(coursesMap);
        } catch (error) {
            console.error('Error fetching category courses:', error);
        } finally {
            setCoursesLoading(false);
        }
    };

    const fetchFreeCourses = async () => {
        try {
            const response = await courseAPI.getFreeCourses(10);
            if (response.success) {
                setFreeCourses(response.data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching free courses:', error);
        }
    };



    return (
        <div className="min-h-screen bg-background">
            {/* Hero: Admin-managed banners (one size). No banners = section hidden. */}
            <HomeBannerCarousel />

            {/* Static: Online classes & filters bar (theme + dark/light) */}
            <HomeCategoryBar />

            {/* Flash Sale Section */}
            <FlashSaleSection />
            {/* Explore Learning Resources Section */}
            <section className="relative overflow-hidden dark:bg-[#08080E] bg-white py-8 md:py-10 px-4" id="learning-resources">

                {/* dot grid */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* gold radial ambient top center */}
                <div
                    className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)' }}
                />

                <div className="relative z-10 max-w-7xl mx-auto">

                    {/* ── HEADER ── */}
                    <div className="mb-12 flex flex-col gap-4">

                        {/* eyebrow */}
                        <div className="inline-flex items-center gap-2 self-start rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] dark:border-gray-700 dark:bg-gray-800"
                            style={{ borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)', color: '#d4af37' }}>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" style={{ boxShadow: '0 0 6px #d4af37' }} />
                            Learning Hub
                        </div>

                        <h2
                            className="font-syne text-4xl md:text-5xl font-extrabold leading-none tracking-[-0.03em] text-gray-900 dark:text-white"
                        >
                            Explore Learning{' '}
                            <span
                                className="bg-clip-text text-transparent"
                                style={{ backgroundImage: 'linear-gradient(90deg, #d4af37, #f9d05e, #d4af37)' }}
                            >
                                Resources
                            </span>
                        </h2>

                        <p className="text-base font-light text-gray-600 dark:text-gray-400">
                            Everything you need to master your career
                        </p>

                        {/* gold divider */}
                        <div className="h-px w-24 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }} />
                    </div>

                    {/* ── CARDS GRID ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        <ResourceCard
                            badge="Quiet Reading Space"
                            badgeColor="green"
                            title="E-Books"
                            description="Curated knowledge in focused, easy-to-read books you can revisit any time."
                            features={[
                                { icon: Download, text: 'Download & keep forever' },
                                { icon: BookOpen, text: 'Structured reading lists' },
                            ]}
                            href="/ebooks"
                        />
                        <ResourceCard
                            badge="Structured Learning"
                            badgeColor="purple"
                            title="Online Courses"
                            description="Step-by-step courses and guidance from industry practitioners."
                            features={[
                                { icon: Video, text: 'Self-paced video lessons' },
                                { icon: CheckCircle2, text: 'Progress tracking' },
                            ]}
                            href="/courses"
                        />
                        <ResourceCard
                            badge="1:1 Time"
                            badgeColor="blue"
                            title="1:1 Guidance"
                            description="Personal guidance calls focused on your goals and style."
                            features={[
                                { icon: Target, text: 'Tailored playbooks' },
                                { icon: UserCheck, text: 'Confidential 1:1 calls' },
                            ]}
                            href="/guidance"
                        />
                        <ResourceCard
                            badge="Live Sessions"
                            badgeColor="pink"
                            title="Live Events"
                            description="Interactive sessions with experts—live Q&A and replays."
                            features={[
                                { icon: MessageCircle, text: 'Real-time Q&A' },
                                { icon: Video, text: 'Session replays' },
                            ]}
                            href="/webinars"
                        />
                        <ResourceCard
                            badge="Free Demos"
                            badgeColor="blue"
                            title="Demo Schedule"
                            description="Join upcoming online demos. Zoom & WhatsApp links to join—no signup needed."
                            features={[
                                { icon: Calendar, text: 'Upcoming demos' },
                                { icon: Video, text: 'Join Zoom / Meet' },
                            ]}
                            href="/training-schedule"
                        />
                        <ResourceCard
                            badge="Jobs & Prep"
                            badgeColor="orange"
                            title="Career"
                            description="Software jobs, interview questions, and placement training to get job-ready."
                            features={[
                                { icon: Briefcase, text: 'Job listings' },
                                { icon: HelpCircle, text: 'Interview prep' },
                            ]}
                            href="/career"
                        />
                    </div>
                </div>


            </section>

            {/* Career Section – Software Jobs, Interview Questions, Placement Training */}
            <section className="relative overflow-hidden bg-gray-50 dark:bg-[#08080E] py-8 px-4 border-y border-gray-200 dark:border-white/[0.05] transition-colors duration-300">

                {/* dark grid pattern — stays inside section only */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
                        backgroundSize: '56px 56px',
                    }}
                />

                <div className="relative z-10 max-w-6xl mx-auto">

                    {/* ── HEADER ── */}
                    <div className="flex flex-col items-center gap-4 text-center mb-14">

                        {/* eyebrow pill */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] shadow-[0_0_6px_#d4af37]" />
                            Your Growth Hub
                        </div>

                        <h2
                            className="font-syne text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-0.03em] text-gray-900 dark:text-white"
                        >
                            Launch Your{' '}
                            <span className="bg-gradient-to-r from-[#d4af37] via-[#d4af37] to-[#d4af37] bg-clip-text text-transparent">
                                Career
                            </span>
                        </h2>

                        <p className="max-w-md text-base font-light leading-relaxed text-gray-500 dark:text-white/40">
                            Jobs, interview prep, and placement support — everything in one place.
                        </p>

                        <div className="h-px w-20 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
                    </div>

                    {/* ── CARDS ── */}
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

                        {/* Card 1 — Software Jobs */}
                        <Link
                            href="/career/software-jobs"
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0F0F1A] shadow-sm hover:shadow-2xl hover:border-orange-500/50 transition-all duration-300"
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl bg-orange-500 opacity-0 group-hover:opacity-15 transition-opacity duration-500" />
                            <div className="relative h-52 w-full shrink-0 overflow-hidden">
                                <Image src="/card1.png" alt="Software Jobs" fill className="object-cover brightness-95 dark:brightness-75 transition-transform duration-500 group-hover:scale-105 dark:group-hover:brightness-90" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#0F0F1A]" />
                                <span className="font-syne absolute left-4 top-4 text-xs font-bold tracking-[0.18em] text-black/20 dark:text-white/25">01</span>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-3">
                                <span className="self-start rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-400">
                                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle bg-orange-400" />
                                    500+ Openings
                                </span>
                                <h3 className="font-syne text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white">Software Jobs</h3>
                                <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-white/40">Browse software and tech job openings. Find roles that match your skills and experience level.</p>
                                <div className="h-px w-full bg-gray-100 dark:bg-white/[0.05]" />
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-white/25 group-hover:text-orange-400 transition-all duration-300">
                                    <span className="h-px w-5 bg-current transition-all duration-300 group-hover:w-9" />
                                    Explore
                                    <svg className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-400 transition-all duration-500 group-hover:w-full" />
                        </Link>

                        {/* Card 2 — Interview Questions */}
                        <Link
                            href="/career/interview-questions"
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0F0F1A] shadow-sm hover:shadow-2xl hover:border-teal-500/50 transition-all duration-300"
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl bg-teal-500 opacity-0 group-hover:opacity-15 transition-opacity duration-500" />
                            <div className="relative h-52 w-full shrink-0 overflow-hidden">
                                <Image src="/card2.png" alt="Interview Questions" fill className="object-cover brightness-95 dark:brightness-75 transition-transform duration-500 group-hover:scale-105 dark:group-hover:brightness-90" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#0F0F1A]" />
                                <span className="font-syne absolute left-4 top-4 text-xs font-bold tracking-[0.18em] text-black/20 dark:text-white/25">02</span>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-3">
                                <span className="self-start rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-400">
                                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle bg-teal-400" />
                                    1200+ Questions
                                </span>
                                <h3 className="font-syne text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white">Interview Questions</h3>
                                <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-white/40">Practice common interview questions and answers for technical and HR rounds.</p>
                                <div className="h-px w-full bg-gray-100 dark:bg-white/[0.05]" />
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-white/25 group-hover:text-teal-400 transition-all duration-300">
                                    <span className="h-px w-5 bg-current transition-all duration-300 group-hover:w-9" />
                                    Explore
                                    <svg className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-teal-400 transition-all duration-500 group-hover:w-full" />
                        </Link>

                        {/* Card 3 — Placement Training */}
                        <Link
                            href="/career/placement-training"
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0F0F1A] shadow-sm hover:shadow-2xl hover:border-violet-500/50 transition-all duration-300"
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl bg-violet-500 opacity-0 group-hover:opacity-15 transition-opacity duration-500" />
                            <div className="relative h-52 w-full shrink-0 overflow-hidden">
                                <Image src="/card3.png" alt="Placement Training" fill className="object-cover brightness-95 dark:brightness-75 transition-transform duration-500 group-hover:scale-105 dark:group-hover:brightness-90" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#0F0F1A]" />
                                <span className="font-syne absolute left-4 top-4 text-xs font-bold tracking-[0.18em] text-black/20 dark:text-white/25">03</span>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-3">
                                <span className="self-start rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-400">
                                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle bg-violet-400" />
                                    Expert Mentors
                                </span>
                                <h3 className="font-syne text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white">Placement Training</h3>
                                <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-white/40">Structured training to get you job-ready: resume, interviews, and essential soft skills.</p>
                                <div className="h-px w-full bg-gray-100 dark:bg-white/[0.05]" />
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-white/25 group-hover:text-violet-400 transition-all duration-300">
                                    <span className="h-px w-5 bg-current transition-all duration-300 group-hover:w-9" />
                                    Explore
                                    <svg className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-violet-400 transition-all duration-500 group-hover:w-full" />
                        </Link>

                    </div>

                    {/* ── CTA BUTTON ── */}
                    <div className="text-center mt-10">
                        <Link
                            href="/career"
                            className="inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] px-7 py-3 text-sm font-medium text-gray-700 dark:text-white/60 shadow-sm hover:border-orange-500/40 hover:text-orange-500 dark:hover:text-orange-400 dark:hover:border-orange-500/30 transition-all duration-300 group"
                        >
                            View all career resources
                            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                </div>

                {/* Syne font */}

            </section>
            {/* Features Section */}
            <FeaturesSection />

            {/* Category Sections */}
            {loading ? (
                <section className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <Skeleton className="h-8 w-48" />
                                </div>
                                <Skeleton className="h-10 w-24" />
                            </div>
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3, 4].map((j) => (
                                    <Card key={j} className="flex-shrink-0 w-[280px]">
                                        <Skeleton className="aspect-video w-full rounded-t-lg" />
                                        <CardContent className="p-4 space-y-2">
                                            <Skeleton className="h-5 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <div className="flex items-center justify-between mt-4">
                                                <Skeleton className="h-6 w-20" />
                                                <Skeleton className="h-9 w-20" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            ) : Object.keys(categoryBooks).length > 0 && (
                <section className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                    {EBOOK_CATEGORIES.map((category) => {
                        const books = categoryBooks[category.value];
                        if (!books || books.length === 0) return null;

                        const Icon = category.icon;

                        return (
                            <div key={category.value} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white">{category.label}</h2>
                                    </div>
                                    <Button variant="ghost" asChild>
                                        <Link href="/ebooks">
                                            View All <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>

                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {books.map((ebook) => (
                                            <CarouselItem key={ebook.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                                                <EbookCard ebook={ebook} />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {books.length > 4 && (
                                        <>
                                            <CarouselPrevious className="hidden sm:flex -left-2 md:-left-4" />
                                            <CarouselNext className="hidden sm:flex -right-2 md:-right-4" />
                                        </>
                                    )}
                                </Carousel>
                            </div>
                        );
                    })}
                </section>
            )}

            {/* Free Courses Section */}
            {freeCourses.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 py-12">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                                    <Star className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold dark:text-white">Free Courses</h2>
                            </div>
                            <Button variant="ghost" asChild>
                                <Link href="/courses?free=true">
                                    View All <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <Carousel
                            opts={{
                                align: "start",
                                loop: false,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {freeCourses.map((course) => (
                                    <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                        <CourseCard course={course} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {freeCourses.length > 4 && (
                                <>
                                    <CarouselPrevious className="hidden sm:flex -left-2 md:-left-4" />
                                    <CarouselNext className="hidden sm:flex -right-2 md:-right-4" />
                                </>
                            )}
                        </Carousel>
                    </div>
                </section>
            )}

            {/* Course Category Sections */}
            {coursesLoading ? (
                <section className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <Skeleton className="h-8 w-48" />
                                </div>
                                <Skeleton className="h-10 w-24" />
                            </div>
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3, 4].map((j) => (
                                    <Card key={j} className="flex-shrink-0 w-[280px]">
                                        <Skeleton className="aspect-video w-full rounded-t-lg" />
                                        <CardContent className="p-4 space-y-2">
                                            <Skeleton className="h-5 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <div className="flex items-center justify-between mt-4">
                                                <Skeleton className="h-6 w-20" />
                                                <Skeleton className="h-9 w-20" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            ) : Object.keys(categoryCourses).length > 0 && (
                <section className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                    {COURSE_CATEGORIES.map((category) => {
                        const courses = categoryCourses[category.value];
                        if (!courses || courses.length === 0) return null;

                        const Icon = category.icon;

                        return (
                            <div key={category.value} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white">{category.label}</h2>
                                    </div>
                                    <Button variant="ghost" asChild>
                                        <Link href="/courses">
                                            View All <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>

                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {courses.map((course) => (
                                            <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                                <CourseCard course={course} />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {courses.length > 4 && (
                                        <>
                                            <CarouselPrevious className="hidden sm:flex -left-2 md:-left-4" />
                                            <CarouselNext className="hidden sm:flex -right-2 md:-right-4" />
                                        </>
                                    )}
                                </Carousel>
                            </div>
                        );
                    })}
                </section>
            )}



            {/* CTA Banner */}
            <CTABanner />
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <HomeContent />
        </Suspense>
    );
}
