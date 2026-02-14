'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  LogOut,
  User,
  Menu,
  Tag,
  Video,
  ShoppingBag,
  MessageCircle,
  GraduationCap,
  Settings,
  BarChart3,
  Award,
  Briefcase,
  Star,
  Zap,
  Calendar,
  CalendarCheck,
  Package,
  Sun,
  Moon,
  HardDrive,
  UserPlus,
  Mail,
  FileSpreadsheet,
  Image as ImageIcon,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    title: 'User Management',
    icon: Users,
    subItems: [
      { title: 'All Users', icon: Users, href: '/admin/users' },
      { title: 'Manual Enroll', icon: UserPlus, href: '/admin/manual-enroll' },
    ],
  },
  {
    title: 'Learning & Content',
    icon: GraduationCap,
    subItems: [
      { title: 'Courses', icon: GraduationCap, href: '/admin/courses' },
      { title: 'Categories', icon: Tag, href: '/admin/categories' },
      { title: 'Course Progress', icon: BarChart3, href: '/admin/course-progress' },
      { title: 'Bundles', icon: Package, href: '/admin/bundles' },
      { title: 'Webinars', icon: Video, href: '/admin/webinars' },
      { title: 'Corporate Training', icon: Briefcase, href: '/admin/corporate-training' },
      { title: 'Training Inquiries', icon: Mail, href: '/admin/corporate-training/inquiries' },
      { title: 'Offline Batches', icon: Calendar, href: '/admin/offline-batches' },
      { title: 'Certificates', icon: Award, href: '/admin/certificates' },
    ],
  },
  {
    title: 'Career Center',
    icon: Briefcase,
    subItems: [
      { title: 'Jobs', icon: Briefcase, href: '/admin/jobs' },
      { title: 'Mock Interviews', icon: MessageCircle, href: '/admin/mock-interview' },
      { title: 'Placement Training', icon: GraduationCap, href: '/admin/placement-training-registrations' },
      { title: 'Interview Qs', icon: HelpCircle, href: '/admin/interview-questions' },
      { title: 'Question Categories', icon: FolderOpen, href: '/admin/interview-categories' },
    ],
  },
  {
    title: 'Mentorship',
    icon: Star,
    subItems: [
      { title: '1:1 Guidance', icon: MessageCircle, href: '/admin/guidance' },
      { title: 'Expert Practice', icon: Users, href: '/admin/expert-practice' },
      { title: 'Bookings', icon: CalendarCheck, href: '/admin/expert-practice-bookings' },
    ],
  },
  {
    title: 'Sales & Finance',
    icon: ShoppingBag,
    subItems: [
      { title: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
      { title: 'Invoices', icon: FileSpreadsheet, href: '/admin/invoices' },
      { title: 'Coupons', icon: Tag, href: '/admin/coupons' },
      { title: 'Flash Sales', icon: Zap, href: '/admin/flash-sales' },
    ],
  },
  {
    title: 'Communications',
    icon: Mail,
    subItems: [
      { title: 'Contacts', icon: Mail, href: '/admin/contacts' },
      { title: 'Demo Requests', icon: Calendar, href: '/admin/demo-requests' },
      { title: 'Hire From Us', icon: UserPlus, href: '/admin/hire-from-us' },
      { title: 'Training Schedule', icon: CalendarCheck, href: '/admin/training-schedule' },
      { title: 'Reviews', icon: Star, href: '/admin/reviews' },
    ],
  },
  {
    title: 'System & Media',
    icon: Settings,
    subItems: [
      { title: 'Media Library', icon: HardDrive, href: '/admin/media' },
      { title: 'Banners', icon: ImageIcon, href: '/admin/banners' },
      { title: 'Settings', icon: Settings, href: '/admin/settings' },
      { title: 'Footer & Social', icon: Settings, href: '/admin/footer' },
    ],
  },
];

export default function AdminLayout({ children }) {
  const { user, logout, isAdmin, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, loading, router]);

  // Reset scroll position when pathname changes
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    // Exact match, or path is a sub-route of href (e.g. /admin/courses/123) — avoids /admin/expert-practice matching /admin/expert-practice-bookings
    return pathname === href || (pathname?.startsWith(href + '/') ?? false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/sm-logo.png" alt="Shrestha Academy" width={60} height={60} />
          <div>
            <h2 className="font-semibold text-sm">Shrestha Academy</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-1">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.subItems ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.title}
                </div>
                {item.subItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const active = isActive(subItem.href);
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        // Reset scroll position when navigating
                        if (typeof window !== 'undefined') {
                          window.scrollTo({ top: 0, behavior: 'instant' });
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <SubIcon className="h-4 w-4" />
                      <span>{subItem.title}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Link
                href={item.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  // Reset scroll position when navigating
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-1 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
        <Link
          href="/profile"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
        <button
          onClick={() => {
            logout();
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-shrink-0 fixed left-0 top-0 bottom-0 h-[100dvh]">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Image src="/sm-logo.png" alt="Shrestha Academy" width={50} height={50} />

            <div>
              <h2 className="font-semibold text-sm">Admin Panel</h2>
            </div>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 h-full overflow-hidden">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
