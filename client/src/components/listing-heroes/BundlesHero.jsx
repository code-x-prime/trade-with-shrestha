'use client';

import { HandCoins, Package, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BundlesHero() {
    return (
        <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 right-10 opacity-20">
                <Package className="h-32 w-32 text-white" />
            </div>
            <div className="absolute bottom-5 left-20 opacity-15">
                <TrendingUp className="h-24 w-24 text-white" />
            </div>

            {/* Content */}
            <div className="relative z-10 px-8 py-12 text-white">
                <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Save More
                    </Badge>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    Course Bundles
                </h1>
                
                <p className="text-white/90 text-lg max-w-2xl mb-4">
                    Get multiple premium courses at discounted prices. Our carefully curated bundles
                    offer the best value for accelerating your trading journey.
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                        <Package className="h-4 w-4" />
                        <span>Multiple Courses</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                        <span><HandCoins className="h-4 w-4" /></span>
                        <span>Huge Savings</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                        <span><TrendingUp className="h-4 w-4" /></span>
                        <span>Complete Learning Path</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
