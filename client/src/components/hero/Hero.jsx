'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
    ArrowRight,
    BookOpen,
    Play,
    Sparkles,
    Users,
    Star,
    Clock,
    TrendingUp,
    Code,
    FileSpreadsheet,
    Database,
    BarChart3,
    LineChart,
    PieChart,
    Cpu,
    Wallet,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================
// CONFIGURATION - Easy to customize
// ============================================

// Topics that rotate in typewriter (add/remove as needed)
const TYPEWRITER_WORDS = [
    { text: 'Web Development', gradient: 'from-violet-600 via-purple-600 to-violet-600' },
    { text: 'Python Programming', gradient: 'from-emerald-600 via-teal-600 to-emerald-600' },
    { text: 'Excel Mastery', gradient: 'from-green-600 via-emerald-600 to-green-600' },
    { text: 'Data Analytics', gradient: 'from-blue-600 via-cyan-600 to-blue-600' },
    { text: 'Market Analysis', gradient: 'from-orange-600 via-amber-600 to-orange-600' },
    { text: 'SQL & Databases', gradient: 'from-pink-600 via-rose-600 to-pink-600' },
    { text: 'Financial Markets', gradient: 'from-indigo-600 via-violet-600 to-indigo-600' },
    { text: 'Power BI', gradient: 'from-yellow-600 via-orange-600 to-yellow-600' },
    { text: 'Machine Learning', gradient: 'from-cyan-600 via-blue-600 to-cyan-600' },
    { text: 'Cyber Security', gradient: 'from-purple-600 via-fuchsia-600 to-purple-600' },
];

// Trust indicators / stats
const TRUST_STATS = [
    { icon: Users, value: '25,000+', label: 'Happy Learners', color: 'text-violet-600', bgColor: 'bg-violet-50' },
    { icon: Star, value: '4.9/5', label: 'Average Rating', color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { icon: Clock, value: '100,000+', label: 'Hours Watched', color: 'text-blue-600', bgColor: 'bg-blue-50' },
];

// Popular topic pills
const POPULAR_TOPICS = ['Programming', 'Python', 'Excel', 'Web Dev', 'Data Science'];

// Icon mapping for floating cards
const iconMap = {
    'Web Development': TrendingUp,
    'Python Programming': Code,
    'Excel Mastery': FileSpreadsheet,
    'SQL & Databases': Database,
    'Data Analytics': BarChart3,
    'Market Analysis': LineChart,
    'Power BI': PieChart,
    'Machine Learning': Cpu,
    'Cyber Security': Wallet,
    'Data Science': Layers,
    'Financial Markets': LineChart,
};

// Color themes for floating cards
const cardThemes = [
    { bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-200/50', icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700' },
    { bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-200/50', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    { bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-200/50', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
    { bg: 'from-orange-500/10 to-amber-500/10', border: 'border-orange-200/50', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
    { bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-200/50', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-700' },
];

// Floating cards configuration - 3 layers for depth effect
const FLOATING_CARDS = {
    far: [
        { title: 'Python Programming', x: -5, y: 10, delay: 0, duration: 45, scale: 1.3, badge: 'Bestseller', colorIndex: 1 },
        { title: 'Data Analytics', x: 82, y: 8, delay: 12, duration: 50, scale: 1.25, badge: 'Featured', colorIndex: 2 },
        { title: 'Excel Mastery', x: 8, y: 70, delay: 8, duration: 48, scale: 1.35, badge: 'Popular', colorIndex: 1 },
        { title: 'Machine Learning', x: 75, y: 65, delay: 20, duration: 42, scale: 1.2, badge: 'New', colorIndex: 3 },
    ],
    mid: [
        { title: 'Web Development', x: 12, y: 18, delay: 2, duration: 35, scale: 1.0, badge: 'Trending', colorIndex: 0 },
        { title: 'SQL & Databases', x: 72, y: 20, delay: 10, duration: 38, scale: 1.05, badge: 'Hot', colorIndex: 4 },
        { title: 'Power BI', x: 5, y: 48, delay: 5, duration: 32, scale: 0.95, badge: 'Popular', colorIndex: 2 },
        { title: 'Market Analysis', x: 78, y: 45, delay: 15, duration: 40, scale: 1.0, badge: 'Bestseller', colorIndex: 0 },
    ],
    near: [
        { title: 'Financial Markets', x: 18, y: 32, delay: 1, duration: 28, scale: 0.85, badge: 'Free', colorIndex: 3 },
        { title: 'Data Science', x: 68, y: 30, delay: 8, duration: 30, scale: 0.88, badge: 'Live', colorIndex: 4 },
        { title: 'Cyber Security', x: 15, y: 60, delay: 4, duration: 26, scale: 0.82, badge: 'Trending', colorIndex: 0 },
    ],
};

// ============================================
// FLOATING CARD COMPONENT
// ============================================

const FloatingCard = ({ title, x, y, delay, duration, scale, layer, badge, colorIndex }) => {
    const Icon = iconMap[title] || TrendingUp;
    const theme = cardThemes[colorIndex % cardThemes.length];

    const layerStyles = {
        far: { opacity: 0.25, blur: 'blur-[2px]', zIndex: 1 },
        mid: { opacity: 0.5, blur: 'blur-[0.5px]', zIndex: 5 },
        near: { opacity: 0.75, blur: '', zIndex: 10 },
    };

    const styles = layerStyles[layer];
    const rotation = x > 50 ? 4 : -4;

    return (
        <motion.div
            className={`absolute ${styles.blur}`}
            style={{ left: `${x}%`, top: `${y}%`, zIndex: styles.zIndex, transform: `scale(${scale}) rotate(${rotation}deg)` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: styles.opacity, y: [0, -15, 0] }}
            transition={{
                opacity: { duration: 1, delay: delay * 0.1 },
                y: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: delay },
            }}
            whileHover={{ scale: scale * 1.05, opacity: Math.min(styles.opacity + 0.3, 1), transition: { duration: 0.3 } }}
        >
            <div className={`w-[160px] sm:w-[180px] md:w-[200px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border ${theme.border} shadow-lg shadow-black/5 dark:shadow-black/20 p-3 sm:p-4 cursor-pointer transition-shadow duration-300 hover:shadow-xl`}>
                <div className={`w-full aspect-[16/10] rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center mb-3 relative overflow-hidden`}>
                    <div className="absolute top-2 right-2 w-6 h-6 border border-current rounded-lg opacity-10" />
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${theme.icon}`} />
                </div>
                <div className="space-y-1.5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${theme.badge} rounded-full`}>{badge}</span>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{title}</h4>
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" />
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">2.5k+ enrolled</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ============================================
// TYPEWRITER COMPONENT
// ============================================
const TypewriterText = () => {
    const [mounted, setMounted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted) return;

        const currentWord = TYPEWRITER_WORDS[currentIndex].text;
        const typingSpeed = 80;
        const deletingSpeed = 40;
        const pauseBeforeDelete = 2500;

        let timeout;

        if (!isDeleting) {
            if (displayText.length < currentWord.length) {
                timeout = setTimeout(() => setDisplayText(currentWord.slice(0, displayText.length + 1)), typingSpeed);
            } else {
                timeout = setTimeout(() => setIsDeleting(true), pauseBeforeDelete);
            }
        } else {
            if (displayText.length > 0) {
                timeout = setTimeout(() => setDisplayText(currentWord.slice(0, displayText.length - 1)), deletingSpeed);
            } else {
                setIsDeleting(false);
                setCurrentIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
            }
        }

        return () => clearTimeout(timeout);
    }, [mounted, displayText, isDeleting, currentIndex]);

    if (!mounted) {
        return <span className="font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">Web Development</span>;
    }

    return (
        <span className="relative inline-block">
            <span className={`font-bold bg-gradient-to-r ${TYPEWRITER_WORDS[currentIndex].gradient} bg-clip-text text-transparent`}>
                {displayText}
            </span>
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-[3px] sm:w-1 h-[0.85em] bg-violet-600 ml-1 align-middle rounded-full"
            />
        </span>
    );
};

// ============================================
// TRUST INDICATORS COMPONENT
// ============================================
const TrustIndicators = () => (
    <motion.div
        className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
        {TRUST_STATS.map((stat, index) => (
            <motion.div
                key={stat.label}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-full shadow-sm hover:shadow-md hover:border-violet-200/60 dark:hover:border-violet-500/40 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            >
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{stat.value}</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">{stat.label}</span>
                </div>
            </motion.div>
        ))}
    </motion.div>
);

// ============================================
// HERO BACKGROUND COMPONENT
// ============================================
const HeroBackground = () => (
    <>
        {/* Desktop: Multi-layer floating cards */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
            {/* Ambient gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 animate-pulse" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', animationDuration: '8s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)', animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', animationDuration: '12s', animationDelay: '4s' }} />

            {/* FAR LAYER */}
            {FLOATING_CARDS.far.map((card, index) => (
                <FloatingCard key={`far-${index}`} {...card} layer="far" />
            ))}
            {/* MID LAYER */}
            {FLOATING_CARDS.mid.map((card, index) => (
                <FloatingCard key={`mid-${index}`} {...card} layer="mid" />
            ))}
            {/* NEAR LAYER */}
            {FLOATING_CARDS.near.map((card, index) => (
                <FloatingCard key={`near-${index}`} {...card} layer="near" />
            ))}
        </div>

        {/* Mobile: Simple gradient + 2 cards */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden">
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 120% 80% at 50% 30%, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 80%)` }} />
            <FloatingCard title="Python Programming" x={-8} y={5} delay={0} duration={40} scale={0.7} layer="mid" badge="Bestseller" colorIndex={1} />
            <FloatingCard title="Web Development" x={70} y={8} delay={5} duration={45} scale={0.65} layer="mid" badge="Trending" colorIndex={0} />
        </div>
    </>
);

// ============================================
// HERO CONTENT COMPONENT
// ============================================
const HeroContent = () => (
    <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-0">
        {/* Trust Badge */}
        <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-violet-200/60 dark:border-violet-500/40 shadow-lg shadow-violet-500/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-600">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Trusted by <span className="font-bold text-violet-600 dark:text-violet-400">25,000+</span> learners
            </span>
            <span className="text-red-500">❤️</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-4 sm:mb-6 leading-[1.15] text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
        >
            We make it easy to master
        </motion.h1>

        {/* Typewriter Line */}
        <motion.div
            className="min-h-[48px] sm:min-h-[56px] md:min-h-[72px] lg:min-h-[88px] flex items-center justify-center mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
        >
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
                <TypewriterText />
            </h2>
        </motion.div>

        {/* Subheading */}
        <motion.p
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 font-normal leading-relaxed px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
        >
            Learn from India&apos;s top industry experts with structured courses, live mentorship, and real-world projects.
        </motion.p>

        {/* CTAs */}
        <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
        >
            <Button
                asChild
                size="lg"
                className="w-full sm:w-auto group relative bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 sm:px-8 py-6 sm:py-7 text-base font-semibold rounded-xl sm:rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
                <Link href="/courses" className="flex items-center justify-center">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-white" />
                    <span>Explore Courses</span>
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
            </Button>

            <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-violet-50/80 dark:hover:bg-violet-950/50 text-gray-700 dark:text-gray-200 hover:text-violet-700 dark:hover:text-violet-300 border-2 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500 px-6 sm:px-8 py-6 sm:py-7 text-base font-semibold rounded-xl sm:rounded-2xl transition-all duration-300"
            >
                <Link href="/ebooks" className="flex items-center justify-center">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span>Read E-Books</span>
                </Link>
            </Button>
        </motion.div>

        {/* Trust Indicators */}
        <TrustIndicators />

        {/* Popular Topics Pills */}
        <motion.div
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
        >
            <span className="text-xs sm:text-sm text-gray-500 mr-1">Popular:</span>
            {POPULAR_TOPICS.map((topic, index) => (
                <motion.span
                    key={topic}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-gray-600 bg-gray-100/80 hover:bg-violet-100 hover:text-violet-700 rounded-full cursor-pointer transition-colors duration-200"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                >
                    {topic}
                </motion.span>
            ))}
        </motion.div>
    </div>
);

// ============================================
// MAIN HERO COMPONENT
// ============================================
const Hero = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.98]);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.9]);

    return (
        <motion.section
            ref={containerRef}
            className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950"
            style={{ scale, opacity }}
        >
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
                    backgroundSize: '80px 80px'
                }}
            />

            <HeroBackground />

            {/* Central gradient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 40%, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)` }} />

            <HeroContent />

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
        </motion.section>
    );
};

export default Hero;