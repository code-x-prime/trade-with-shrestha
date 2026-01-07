'use client';

import { BookOpen, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        icon: BookOpen,
        title: 'Expert Courses',
        description: 'Learn from industry veterans with comprehensive professional development courses.',
        iconBg: 'bg-violet-600',
    },
    {
        icon: TrendingUp,
        title: 'Real-time Skills',
        description: 'Get practical insights and strategies applicable in the real-world job market.',
        iconBg: 'bg-emerald-600',
    },
    {
        icon: Award,
        title: 'Certification',
        description: 'Earn recognized certificates upon course completion to boost your resume.',
        iconBg: 'bg-blue-600',
    },
];

export default function FeaturesSection() {
    return (
        <section className="bg-white dark:bg-black py-12 px-4 relative overflow-hidden">
            {/* Background Pattern */}
             <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.05] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative p-6 md:p-8 rounded-3xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/50 dark:to-gray-800/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    {/* Icon */}
                                    <div className={`rounded-2xl p-4 mb-6 w-16 h-16 flex items-center justify-center ${feature.iconBg} bg-opacity-10 text-${feature.iconBg.split('-')[1]}-600 dark:bg-opacity-20 dark:text-${feature.iconBg.split('-')[1]}-400 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="h-8 w-8 text-current" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

