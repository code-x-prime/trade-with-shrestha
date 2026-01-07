'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, TrendingUp, Award, ArrowRight, Video, Star, Loader2, Download, CheckCircle2, Target, UserCheck, BarChart3, Zap, Users, Calendar, MessageCircle } from 'lucide-react';
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
import Hero from '@/components/hero/Hero';

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
            {/* Hero Section */}
            <Hero />

            {/* Flash Sale Section */}
            <FlashSaleSection />

            {/* Explore Trading Resources Section */}
            <section className="bg-white dark:bg-gray-900 py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Explore Learning Resources</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">Everything you need to master your career</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <ResourceCard
                            badge="Quiet Reading Space"
                            badgeColor="green"
                            title="E-Books!"
                            description="Curated trading knowledge distilled into focused, easy-to-read books you can revisit any time."
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
                            badge="Structured Learning Path"
                            badgeColor="green"
                            title="Online Courses!"
                            description="Learn trading with structured courses, step-by-step frameworks, and guidance from market practitioners."
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
                            badge="Distraction-free 1:1 Time"
                            badgeColor="blue"
                            title="1:1 Guidance!"
                            description="Personal guidance calls with professional traders focused on your trading style, goals, and risk profile."
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
                            badge="Precision Trading Tools"
                            badgeColor="orange"
                            title="Trading Indicators!"
                            description="Powerful, battle-tested indicators that plug into your charts and help you read price action with more confidence."
                            features={[
                                { icon: BarChart3, text: 'Multi-asset ready' },
                                { icon: Zap, text: 'Intraday & swing' },
                            ]}
                            href="/indicators"
                            gradientFrom="from-orange-600"
                            gradientVia="via-amber-700"
                            gradientTo="to-orange-800"
                        />
                        <ResourceCard
                            badge="Cohort-based Mentorship"
                            badgeColor="purple"
                            title="Trading Mentorship!"
                            description="Join curated mentorship cohorts, learn in small groups, and grow with structured market roadmaps."
                            features={[
                                { icon: Users, text: 'Limited cohort sizes' },
                                { icon: Calendar, text: 'Multi-week journeys' },
                            ]}
                            href="/mentorship"
                            gradientFrom="from-indigo-600"
                            gradientVia="via-purple-700"
                            gradientTo="to-purple-800"
                        />
                        <ResourceCard
                            badge="Live Market Conversations"
                            badgeColor="pink"
                            title="Live Webinars!"
                            description="Interactive sessions with market experts to decode live setups, strategies, and risk management."
                            features={[
                                { icon: MessageCircle, text: 'Real-time Q&A' },
                                { icon: Video, text: 'Session replays' },
                            ]}
                            href="/webinars"
                            gradientFrom="from-red-600"
                            gradientVia="via-pink-700"
                            gradientTo="to-rose-800"
                        />
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
