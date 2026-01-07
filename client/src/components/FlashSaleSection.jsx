'use client';

import { useState, useEffect } from 'react';
import { flashSaleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import FlipClock from '@/components/blocks/flip-clock';

export default function FlashSaleSection() {
    const [flashSale, setFlashSale] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <section id="flash-sale-section" className="py-12 dark:bg-gray-900">
                <div className="container mx-auto px-4">
                    <Skeleton className="h-64 w-full rounded-2xl dark:bg-gray-800" />
                </div>
            </section>
        );
    }

    if (!flashSale) {
        return null;
    }

    const { items } = flashSale;

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <section
            id="flash-sale-section"
            className="py-16 relative z-10 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-black transition-all duration-500"
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative">
                {/* Premium Header Design */}
                <div className="relative mb-12 rounded-3xl overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-black/5 dark:border-white/10 p-4 md:p-10 text-center">
                    {/* Background Glow Effect */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full blur-[100px] opacity-20 pointer-events-none"
                        style={{ background: flashSale.bgColor }}
                    />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 max-w-6xl mx-auto">

                        {/* Title & Badge */}
                        <div className="flex flex-col items-center md:items-start gap-3 flex-1">
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-2.5 rounded-xl shadow-sm"
                                    style={{ background: flashSale.bgColor }}
                                >
                                    <Zap className="h-6 w-6" style={{ color: flashSale.textColor }} />
                                </div>
                                <div
                                    className="px-4 py-1.5 rounded-full text-sm font-bold shadow-sm backdrop-blur-md bg-white/80 dark:bg-black/50"
                                    style={{ color: flashSale.bgColor }}
                                >
                                    FLASHSALE
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 md:text-left text-center">
                                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {flashSale.title || "Limited Time Offer"}
                                </h2>
                                <p className="text-muted-foreground font-medium text-lg">
                                    Grab up to <span style={{ color: flashSale.bgColor }}>{flashSale.discountPercent}% OFF</span> on selected items
                                </p>
                            </div>
                        </div>

                        {/* Countdown Timer Block */}
                        <div className="flex flex-col items-center gap-3 bg-white/60 dark:bg-zinc-900/60 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl backdrop-blur-md w-full md:w-auto">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
                                <Clock className="h-4 w-4" style={{ color: flashSale.bgColor }} />
                                <span>Ends in</span>
                            </div>
                            <div className="w-full flex justify-center overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                                <FlipClock
                                    countdown={true}
                                    targetDate={new Date(flashSale.endDate)}
                                    size="md"
                                    className="!text-current scale-90 sm:scale-100 origin-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sale Cards - Grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {items.map((item) => {
                        const itemOriginalPrice = item.price || 0;
                        const itemEffectivePrice = item.salePrice && item.salePrice > 0 ? item.salePrice : itemOriginalPrice;
                        const itemFlashSalePrice = Math.round(itemEffectivePrice * (1 - flashSale.discountPercent / 100));
                        const itemSavings = Math.round(itemEffectivePrice * flashSale.discountPercent / 100);

                        return (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900 border border-transparent hover:border-black/5 dark:hover:border-white/10"
                            >
                                {/* Hover Gradient Overlay */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                                    style={{
                                        background: `linear-gradient(to bottom right, ${flashSale.bgColor}10, transparent)`
                                    }}
                                />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Image */}
                                    {item.imageUrl && (
                                        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-800">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Discount Badge */}
                                            <div
                                                className="absolute top-3 left-3 px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg flex items-center gap-1.5"
                                                style={{
                                                    background: flashSale.bgColor,
                                                    color: flashSale.textColor,
                                                }}
                                            >
                                                <Zap className="h-3 w-3 fill-current" />
                                                {flashSale.discountPercent}% OFF
                                            </div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 p-5 flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>

                                        {item.shortDescription && (
                                            <p className="text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 text-sm flex-1">
                                                {item.shortDescription}
                                            </p>
                                        )}

                                        {/* Pricing */}
                                        {itemEffectivePrice > 0 && (
                                            <div className="flex flex-col gap-1 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
                                                <div className="flex items-baseline gap-2 flex-wrap">
                                                    <span className="text-xl font-black" style={{ color: flashSale.bgColor }}>
                                                        ₹{itemFlashSalePrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through font-medium">
                                                        ₹{itemEffectivePrice.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                                    <span>You save ₹{itemSavings.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* CTA */}
                                        <Link href={item.link || '#'} className="mt-auto w-full">
                                            <Button
                                                size="sm"
                                                className="w-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                                                style={{
                                                    background: flashSale.bgColor,
                                                    color: flashSale.textColor,
                                                }}
                                            >
                                                Shop Now
                                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}

