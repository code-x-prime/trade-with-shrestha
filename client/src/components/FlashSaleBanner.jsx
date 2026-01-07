'use client';

import { useState, useEffect } from 'react';
import { flashSaleAPI } from '@/lib/api';
import { Zap, Clock, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

export default function FlashSaleBanner() {
    const [flashSale, setFlashSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await flashSaleAPI.getActive();
                if (res.success && res.data.flashSale) {
                    setFlashSale(res.data.flashSale);
                }
            } catch (error) {
                console.error('Failed to fetch flash sale:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlashSale();
    }, []);

    useEffect(() => {
        if (!flashSale) return;

        const calculateTimeLeft = () => {
            const endDate = new Date(flashSale.endDate);
            const now = new Date();
            const difference = endDate - now;

            if (difference <= 0) {
                setFlashSale(null);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [flashSale]);

    if (loading || !flashSale || dismissed) {
        return null;
    }

    const { item } = flashSale;

    return (
        <div
            className="relative overflow-hidden py-2 sm:py-2.5"
            style={{
                background: flashSale.bgColor,
                color: flashSale.textColor,
            }}
        >
            <div className="container mx-auto px-3 sm:px-4 pr-10 sm:pr-4 relative">
                <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm flex-wrap">
                    {/* Left: Title */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse flex-shrink-0" />
                        <span className="font-bold text-xs sm:text-sm hidden sm:inline">
                            {flashSale.title}
                        </span>
                        <span className="font-bold text-xs sm:hidden">
                            {flashSale.title.split(' ').slice(0, 2).join(' ')}
                        </span>
                        <span className="px-1.5 sm:px-2 py-0.5 bg-white/20 rounded text-[10px] sm:text-xs font-bold whitespace-nowrap">
                            {flashSale.discountPercent}% OFF
                        </span>
                    </div>

                    {/* Center: Countdown */}
                    <div className="flex items-center gap-0.5 sm:gap-1 font-mono text-[10px] sm:text-xs">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {timeLeft.days > 0 && (
                            <>
                                <span className="px-1 sm:px-1.5 py-0.5 bg-white/20 rounded">{timeLeft.days}d</span>
                                <span className="hidden sm:inline">:</span>
                            </>
                        )}
                        <span className="px-1 sm:px-1.5 py-0.5 bg-white/20 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
                        <span>:</span>
                        <span className="px-1 sm:px-1.5 py-0.5 bg-white/20 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                        <span className="hidden sm:inline">:</span>
                        <span className="px-1 sm:px-1.5 py-0.5 bg-white/20 rounded hidden sm:inline-block">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                    </div>

                    {/* Right: CTA */}
                    <Link
                        href={item?.link || '#flash-sale-section'}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-[10px] sm:text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                        <span className="hidden sm:inline">Shop Now</span>
                        <span className="sm:hidden">Shop</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    </Link>

                    {/* Close Button */}
                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                        aria-label="Close banner"
                    >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
