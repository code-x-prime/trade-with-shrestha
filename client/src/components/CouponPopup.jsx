'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { X, Copy, Tag, Gift } from 'lucide-react';
import Image from 'next/image';
import { couponAPI } from '@/lib/api';
import { getPublicUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Confetti from './Confetti';

export default function CouponPopup() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [coupons, setCoupons] = useState([]);
    const [currentCouponIndex, setCurrentCouponIndex] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [dismissedCoupons, setDismissedCoupons] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Excluded pages - don't show popup on these
        const excludedPaths = [
            '/cart',
            '/checkout',
            '/privacy',
            '/terms',
            '/refund',
            '/profile',
            '/admin',
        ];

        // Check if current path is excluded
        const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));
        if (isExcluded) {
            return;
        }

        // Check if popup was dismissed in this session (not permanently)
        const sessionDismissed = sessionStorage.getItem('couponPopupDismissed') === 'true';
        if (sessionDismissed) {
            return; // Don't show again in this session
        }

        // Check if user has dismissed specific coupons
        const dismissed = JSON.parse(localStorage.getItem('dismissedCoupons') || '[]');
        setDismissedCoupons(dismissed);

        // Fetch coupons ready to show
        const fetchCoupons = async () => {
            try {
                const response = await couponAPI.getCouponsReadyToShow();
                if (response.success && response.data.coupons) {
                    // Filter out dismissed coupons
                    const availableCoupons = response.data.coupons.filter(
                        coupon => !dismissed.includes(coupon.id)
                    );

                    if (availableCoupons.length > 0) {
                        setCoupons(availableCoupons);
                        // Show popup after a short delay
                        setTimeout(() => {
                            setShowPopup(true);
                            setShowConfetti(true);
                            // Stop confetti after 3 seconds
                            setTimeout(() => setShowConfetti(false), 3000);
                        }, 1500);
                    }
                }
            } catch (error) {
                console.error('Error fetching coupons:', error);
            }
        };

        fetchCoupons();
    }, [pathname, isAuthenticated]);

    const currentCoupon = coupons[currentCouponIndex];

    const handleCopyCode = () => {
        if (currentCoupon) {
            navigator.clipboard.writeText(currentCoupon.code);
            toast.success(`Coupon code "${currentCoupon.code}" copied!`);
        }
    };

    const handleDismiss = () => {
        // Mark popup as dismissed in this session (will show again on next visit)
        sessionStorage.setItem('couponPopupDismissed', 'true');

        if (currentCoupon) {
            const newDismissed = [...dismissedCoupons, currentCoupon.id];
            setDismissedCoupons(newDismissed);
            localStorage.setItem('dismissedCoupons', JSON.stringify(newDismissed));
        }

        setShowPopup(false);
        setShowConfetti(false);
    };

    const handleGrabCoupon = () => {
        if (currentCoupon) {
            // Navigate to cart with coupon code
            router.push(`/cart?coupon=${currentCoupon.code}`);
            setShowPopup(false);
        }
    };

    if (!showPopup || !currentCoupon) return null;

    const discountText = currentCoupon.discountType === 'PERCENTAGE'
        ? `${currentCoupon.discountValue}% OFF`
        : `₹${currentCoupon.discountValue} OFF`;

    const hasMedia = currentCoupon.videoUrl || currentCoupon.imageUrl;

    return (
        <>
            {/* Confetti Animation */}
            <Confetti active={showConfetti} />

            <Dialog open={showPopup} onOpenChange={(open) => {
                if (!open) handleDismiss();
            }}>
                <DialogContent className={`${hasMedia ? 'max-w-md' : 'max-w-sm'} p-0 overflow-hidden border-0`}>
                    <AnimatePresence>
                        {showPopup && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    duration: 0.4
                                }}
                                className="relative"
                            >
                                {/* Close Button */}
                                <motion.button
                                    onClick={handleDismiss}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-gray-800/90 rounded-full p-1.5 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </motion.button>

                                {/* Image or Video - Smaller if no media */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.3 }}
                                >
                                    {currentCoupon.videoUrl ? (
                                        <div className="aspect-video w-full bg-black max-h-48 rounded-t-lg overflow-hidden">
                                            <ReactPlayer
                                                url={currentCoupon.videoUrl}
                                                width="100%"
                                                height="100%"
                                                playing={false}
                                                controls
                                                config={{
                                                    file: {
                                                        attributes: {
                                                            controlsList: 'nodownload',
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    ) : currentCoupon.imageUrl ? (
                                        <div className="relative w-full max-h-48 aspect-video rounded-t-lg overflow-hidden">
                                            <Image
                                                src={getPublicUrl(currentCoupon.imageUrl)}
                                                alt={currentCoupon.title || 'Coupon Offer'}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <motion.div
                                            className="w-full h-32 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center rounded-t-lg"
                                            animate={{
                                                background: [
                                                    'linear-gradient(135deg, #4A50B0 0%, #5C64D7 100%)',
                                                    'linear-gradient(135deg, #5C64D7 0%, #6B73E8 100%)',
                                                    'linear-gradient(135deg, #4A50B0 0%, #5C64D7 100%)',
                                                ]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    rotate: [0, 5, -5, 0]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                <Gift className="h-12 w-12 text-white opacity-70" />
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Content - Compact */}
                                <div className="p-4 space-y-3 bg-white dark:bg-gray-900 rounded-b-lg">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                    >
                                        <DialogHeader className="space-y-1">
                                            <DialogTitle className="text-lg font-bold">
                                                {currentCoupon.title || 'Special Offer!'}
                                            </DialogTitle>
                                            <DialogDescription className="text-sm">
                                                {currentCoupon.description || `Get ${discountText} on your purchase!`}
                                            </DialogDescription>
                                        </DialogHeader>
                                    </motion.div>

                                    {/* Coupon Code - Compact with animation */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3, duration: 0.3 }}
                                        className="flex items-center gap-2 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border-2 border-brand-200 dark:border-brand-800 shadow-sm"
                                    >
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        >
                                            <Tag className="h-4 w-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-0.5">Your Coupon Code</div>
                                            <motion.div
                                                className="text-lg font-mono font-bold text-brand-700 dark:text-brand-300 truncate"
                                                animate={{
                                                    color: ['#4A50B0', '#5C64D7', '#4A50B0']
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {currentCoupon.code}
                                            </motion.div>
                                        </div>
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyCode}
                                                className="gap-1.5 h-8 px-2 flex-shrink-0"
                                            >
                                                <Copy className="h-3 w-3" />
                                                <span className="text-xs">Copy</span>
                                            </Button>
                                        </motion.div>
                                    </motion.div>

                                    {/* Discount Info - Compact with pulse animation */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.3 }}
                                        className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                                    >
                                        <motion.div
                                            className="text-xl font-bold text-green-700 dark:text-green-400"
                                            animate={{
                                                scale: [1, 1.05, 1],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            {discountText}
                                        </motion.div>
                                        {currentCoupon.minAmount && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                Min: ₹{currentCoupon.minAmount}
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Actions - Compact with hover animations */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.3 }}
                                        className="flex gap-2"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex-1"
                                        >
                                            <Button
                                                onClick={handleGrabCoupon}
                                                className="w-full bg-brand-600 hover:bg-brand-700 text-white h-9 text-sm shadow-md"
                                            >
                                                Grab This Coupon
                                            </Button>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                onClick={handleDismiss}
                                                variant="outline"
                                                className="h-9 text-sm"
                                            >
                                                Maybe Later
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    );
}

