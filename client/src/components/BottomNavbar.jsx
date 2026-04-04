'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Home, BookOpen, User, Video, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNavbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Events', href: '/webinars', icon: Video },
    { name: 'Demo', href: '/training-schedule', icon: Calendar },
    { name: 'Profile', href: isAuthenticated ? '/profile' : '/auth', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden border-t border-blue-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_20px_rgba(0,0,0,0.06)] safe-area-inset-bottom dark:bg-gray-900 dark:border-gray-800 dark:shadow-none">
      <div className="flex items-center justify-around h-16 px-2 pb-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 min-w-0 rounded-xl",
                isActive
                  ? "text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-500/10"
                  : "text-gray-600 hover:text-blue-700 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform flex-shrink-0",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[11px] font-medium truncate w-full text-center",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-700 rounded-t-full dark:bg-blue-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
