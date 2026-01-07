'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BottomNavbar from '@/components/BottomNavbar';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import Footer from '@/components/Footer';
import CouponPopup from '@/components/CouponPopup';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isLearnPage = pathname?.includes('/learn');
  const isHomePage = pathname === '/';

  // Hide Navbar and Footer on learn page
  if (isLearnPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen">
      {/* Sticky header container */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/20">
        <Navbar />
        {isHomePage && <FlashSaleBanner />}
      </header>
      <main className="pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNavbar />
      <CouponPopup />
    </div>
  );
}

