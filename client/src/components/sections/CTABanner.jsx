'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTABanner() {
    return (
        <section className="bg-white dark:bg-black py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 md:p-16 text-center shadow-2xl shadow-violet-500/25"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.1] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            Ready to Transform Your Career?
                        </h2>
                        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                            Join thousands of students mastering the skills of tomorrow. From Coding to Finance, start your journey today.
                        </p>
                        <Button
                            asChild
                            size="lg"
                            className="bg-white text-violet-700 hover:bg-white/90 hover:text-violet-800 text-base md:text-lg font-bold px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <Link href="/courses" className="flex items-center gap-2">
                                Start Learning Today
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

