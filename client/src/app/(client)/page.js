'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, TrendingUp, Award, ArrowRight, Video, Star, Loader2, Download, CheckCircle2, Target, UserCheck, BarChart3, Zap, Users, Calendar, MessageCircle, Briefcase, HelpCircle } from 'lucide-react';
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
            <section className="bg-white dark:bg-gray-900 py-12 md:py-16 px-4" id="learning-resources">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 md:mb-10">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">Explore Learning Resources</h2>
                        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">Everything you need to master your career</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                            gradientFrom="from-emerald-600"
                            gradientVia="via-teal-700"
                            gradientTo="to-emerald-800"
                        />
                        <ResourceCard
                            badge="Structured Learning"
                            badgeColor="green"
                            title="Online Courses"
                            description="Step-by-step courses and guidance from industry practitioners."
                            features={[
                                { icon: Video, text: 'Self-paced video lessons' },
                                { icon: CheckCircle2, text: 'Progress tracking' },
                            ]}
                            href="/courses"
                            gradientFrom="from-purple-600"
                            gradientVia="via-purple-700"
                            gradientTo="to-purple-800"
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
                            gradientFrom="from-blue-600"
                            gradientVia="via-cyan-700"
                            gradientTo="to-blue-800"
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
                            gradientFrom="from-red-600"
                            gradientVia="via-pink-700"
                            gradientTo="to-rose-800"
                        />
                        <ResourceCard
                            badge="Free demos"
                            badgeColor="blue"
                            title="Demo Schedule"
                            description="Join upcoming online demos. Zoom & WhatsApp links to join—no signup needed for listed sessions."
                            features={[
                                { icon: Calendar, text: 'Upcoming demos' },
                                { icon: Video, text: 'Join Zoom / Meet' },
                            ]}
                            href="/training-schedule"
                            gradientFrom="from-brand-600"
                            gradientVia="via-brand-700"
                            gradientTo="to-brand-800"
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
                            gradientFrom="from-amber-600"
                            gradientVia="via-orange-600"
                            gradientTo="to-orange-800"
                        />
                    </div>
                </div>
            </section>

            {/* Career Section – Software Jobs, Interview Questions, Placement Training */}
            <section className="bg-muted/40 dark:bg-gray-900/50 py-16 px-4 border-y border-border">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Career</h2>
                        <p className="text-lg text-muted-foreground">Jobs, interview prep, and placement support</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Link href="/career/software-jobs">
                            <Card className="h-full border-2 hover:border-brand-500/40 dark:hover:border-brand-400/40 transition-colors group">
                                <CardContent className="p-6">
                                    <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                                        <Briefcase className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">Software Jobs</h3>
                                    <p className="text-muted-foreground text-sm">Browse software and tech job openings. Find roles that match your skills.</p>
                                    <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-600 dark:text-brand-400">
                                        Explore <ArrowRight className="h-4 w-4" />
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/career/interview-questions">
                            <Card className="h-full border-2 hover:border-brand-500/40 dark:hover:border-brand-400/40 transition-colors group">
                                <CardContent className="p-6">
                                    <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                                        <HelpCircle className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">Interview Questions</h3>
                                    <p className="text-muted-foreground text-sm">Practice common interview Q&A for technical and HR rounds.</p>
                                    <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-600 dark:text-brand-400">
                                        Explore <ArrowRight className="h-4 w-4" />
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/career/placement-training">
                            <Card className="h-full border-2 hover:border-brand-500/40 dark:hover:border-brand-400/40 transition-colors group">
                                <CardContent className="p-6">
                                    <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                                        <Award className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">Placement Training</h3>
                                    <p className="text-muted-foreground text-sm">Get job-ready with resume, interviews, and soft skills training.</p>
                                    <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-600 dark:text-brand-400">
                                        Explore <ArrowRight className="h-4 w-4" />
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                    <div className="text-center mt-8">
                        <Button asChild variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-900/30">
                            <Link href="/career">View all career resources</Link>
                        </Button>
                    </div>
                </div>
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
