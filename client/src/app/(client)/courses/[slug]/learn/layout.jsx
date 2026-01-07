'use client';

import { usePathname } from 'next/navigation';

export default function LearnLayout({ children }) {
  // This layout prevents the parent (client) layout from showing Navbar/Footer
  // by returning only children without the Navbar/BottomNavbar
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
