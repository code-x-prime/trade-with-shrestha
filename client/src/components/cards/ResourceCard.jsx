'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function ResourceCard({
    badge,
    badgeColor = 'green',
    title,
    description,
    features,
    href,
    gradientFrom = 'from-brand-600',
    gradientVia = 'via-brand-700',
    gradientTo = 'to-brand-800',
}) {
    const badgeColors = {
        green: 'bg-green-400',
        blue: 'bg-blue-400',
        purple: 'bg-purple-400',
        orange: 'bg-orange-400',
        pink: 'bg-pink-400',
    };

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <Link href={href}>
                <div className={`relative rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} p-6 h-full flex flex-col overflow-hidden group cursor-pointer`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }} />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4 w-fit">
                            <div className={`w-2 h-2 ${badgeColors[badgeColor] || badgeColors.green} rounded-full animate-pulse`}></div>
                            <span className="text-white text-xs font-medium">{badge}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            {title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm md:text-base text-white/90 mb-4 flex-1">
                            {description}
                        </p>

                        {/* Features */}
                        <div className="flex flex-col gap-2 mb-4">
                            {features.map((feature, idx) => {
                                const Icon = feature.icon || (() => null);
                                return (
                                    <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full w-fit">
                                        <Icon className="h-3.5 w-3.5 text-white" />
                                        <span className="text-white text-xs font-medium">{feature.text}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Arrow */}
                        <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors mt-auto">
                            <span className="text-sm font-medium">Explore</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

