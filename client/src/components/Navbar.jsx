'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  User,
  LogOut,
  Settings,
  ShoppingCart,
  Video,
  Search,
  X,
  ChevronDown,
  Calendar,
  UserCircle,
  BookOpen,
  TrendingUp,
  Package,
  Sun,
  Moon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { webinarAPI, mentorshipAPI, courseAPI, ebookAPI, indicatorAPI, offlineBatchAPI, bundleAPI, guidanceAPI } from '@/lib/api';

const BRAND_COLOR = '#4A50B0';

const SEARCH_PLACEHOLDERS = [
  "Search 'Web Development'",
  "Search 'Webinars'",
  "Search 'Mentorship'",
  "Search 'Data Science'",
  "Search 'Python Mastery'",
  "Search 'Financial Markets'",
];

// Helper function to get user initials
const getUserInitials = (name) => {
  if (!name) return 'U';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCartCount } = useCart();

  // Get cart count from context
  const cartCount = getCartCount();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rotating placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  // Search suggestions with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const [coursesRes, webinarsRes, mentorshipsRes, ebooksRes, indicatorsRes, bundlesRes, guidanceRes] = await Promise.all([
          courseAPI.getCourses({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
          webinarAPI.getWebinars({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
          mentorshipAPI.getMentorship({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
          ebookAPI.getEbooks({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
          indicatorAPI.getIndicators({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
          bundleAPI.getBundles({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
          guidanceAPI.getGuidance({ search: searchQuery, limit: 3 }).catch(() => ({ success: false, data: {} })),
        ]);

        const suggestions = [];

        if (coursesRes.success && coursesRes.data.courses?.length > 0) {
          suggestions.push({
            type: 'Courses',
            items: coursesRes.data.courses.map(c => ({
              id: c.id,
              title: c.title,
              href: `/courses/${c.slug || c.id}`,
            })),
          });
        }

        if (webinarsRes.success && webinarsRes.data.webinars?.length > 0) {
          suggestions.push({
            type: 'Webinars',
            items: webinarsRes.data.webinars.map(w => ({
              id: w.id,
              title: w.title,
              href: `/webinars/${w.slug || w.id}`,
            })),
          });
        }

        if (mentorshipsRes.success && (mentorshipsRes.data.mentorships || mentorshipsRes.data.mentorship)?.length > 0) {
          const mentorships = mentorshipsRes.data.mentorships || mentorshipsRes.data.mentorship || [];
          suggestions.push({
            type: 'Mentorship',
            items: mentorships.map(m => ({
              id: m.id,
              title: m.title,
              href: `/mentorship/${m.slug || m.id}`,
            })),
          });
        }

        if (ebooksRes.success && ebooksRes.data.ebooks?.length > 0) {
          suggestions.push({
            type: 'E-Books',
            items: ebooksRes.data.ebooks.map(e => ({
              id: e.id,
              title: e.title,
              href: `/ebooks/${e.slug || e.id}`,
            })),
          });
        }

        if (indicatorsRes.success && indicatorsRes.data.indicators?.length > 0) {
          suggestions.push({
            type: 'Indicators',
            items: indicatorsRes.data.indicators.map(i => ({
              id: i.id,
              title: i.name,
              href: `/indicators/${i.slug || i.id}`,
            })),
          });
        }

        if (bundlesRes.success && bundlesRes.data.bundles?.length > 0) {
          suggestions.push({
            type: 'Bundles',
            items: bundlesRes.data.bundles.map(b => ({
              id: b.id,
              title: b.title,
              href: `/bundles/${b.slug || b.id}`,
            })),
          });
        }

        if (guidanceRes.success && guidanceRes.data.guidance?.length > 0) {
          suggestions.push({
            type: '1:1 Guidance',
            items: guidanceRes.data.guidance.map(g => ({
              id: g.id,
              title: g.expertName,
              href: `/guidance/${g.slug || g.id}`,
            })),
          });
        }

        setSearchSuggestions(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setSearchFocused(false);
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      setTimeout(() => {
        mobileSearchRef.current?.focus();
      }, 100);
    }
  }, [mobileSearchOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
      setMobileSearchOpen(false);
    }
  };

  const menuItems = [
    {
      name: 'Courses',
      href: '/courses',
      icon: BookOpen,
      hasMegaMenu: true,
    },
    {
      name: 'Live',
      href: '/webinars',
      icon: Video,
      hasMegaMenu: true,
    },
    { name: 'Indicators', href: '/indicators', icon: TrendingUp },
    { name: 'E-Books', href: '/ebooks', icon: BookOpen },
    { name: 'Blog', href: '/blog', icon: BookOpen },
  ];

  const courseMenuItems = [
    {
      title: 'Online Course',
      description: 'Self-paced structured learning',
      href: '/courses',
      icon: BookOpen,
    },
    {
      title: 'Course Bundles',
      description: 'Discounted course packages',
      href: '/bundle',
      icon: Package,
    },
    {
      title: 'Offline Batch',
      description: 'In-person training programs',
      href: '/offline-batches',
      icon: Calendar,
    },
  ];

  const liveMenuItems = [
    {
      title: 'Webinars',
      description: 'Value packed interactive sessions',
      href: '/webinars',
      icon: Video,
    },
    {
      title: 'Mentorship Programs',
      description: 'Structured live training programs',
      href: '/mentorship',
      icon: UserCircle,
    },
    {
      title: '1:1 Guidance',
      description: 'Book private calls with experts',
      href: '/guidance',
      icon: Calendar,
    },
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        boxShadow: scrolled
          ? '0 8px 32px rgba(74, 80, 176, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
          : '0 0 0 rgba(0,0,0,0)',
      }}
      className={`z-[100] w-full border-b border-[#4A50B0]/10 dark:border-[#4A50B0]/20 backdrop-blur-md transition-all duration-300 ${scrolled
        ? 'bg-white/85 dark:bg-gray-900/85'
        : 'bg-white/95 dark:bg-gray-900/95'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group"
          >
            <Image src="/logo.png" alt="Shrestha Academy" width={120} height={120} className="w-full h-full object-contain dark:invert" />

          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => {
              const dropdownKey = item.name.toLowerCase();
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.hasMegaMenu && setOpenDropdown(dropdownKey)}
                  onMouseLeave={(e) => {
                    // Check if mouse is moving to dropdown
                    const relatedTarget = e.relatedTarget;
                    const isMovingToDropdown = relatedTarget &&
                      relatedTarget instanceof Element &&
                      (relatedTarget.closest('.mega-dropdown') || relatedTarget.classList.contains('mega-dropdown'));

                    if (!isMovingToDropdown) {
                      // Add delay to allow moving to dropdown
                      setTimeout(() => {
                        if (openDropdown === dropdownKey) {
                          const dropdown = dropdownRef.current;
                          if (!dropdown || !dropdown.matches(':hover')) {
                            setOpenDropdown(null);
                          }
                        }
                      }, 200);
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    className="relative px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#4A50B0] dark:hover:text-[#9ca0ff] transition-all duration-300 flex items-center gap-1.5 group rounded-lg hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:hover:from-[#4A50B0]/20 dark:hover:to-purple-600/20"
                  >
                    {item.name}
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full bg-gradient-to-r from-orange-500 to-pink-500 shadow-md">
                        {item.badge}
                      </span>
                    )}
                    {item.hasMegaMenu && (
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 text-[#4A50B0] ${openDropdown === dropdownKey ? 'rotate-180' : ''}`} />
                    )}
                    <motion.span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-[#4A50B0] to-purple-600 rounded-full"
                      initial={{ width: 0 }}
                      whileHover={{ width: '80%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>

                  {/* Mega Dropdown for Courses */}
                  {item.hasMegaMenu && item.name === 'Courses' && openDropdown === 'courses' && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mega-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] rounded-2xl border border-[#4A50B0]/10 dark:border-[#4A50B0]/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-[#4A50B0]/10 overflow-hidden z-[200]"
                      onMouseEnter={() => setOpenDropdown('courses')}
                      onMouseLeave={() => {
                        setOpenDropdown(null);
                      }}
                    >
                      <div className="p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 bg-gradient-to-r from-[#4A50B0] to-purple-600 bg-clip-text text-transparent">
                          Course Programs
                        </h3>
                        <div className="space-y-2">
                          {courseMenuItems.map((menuItem, idx) => (
                            <motion.div
                              key={menuItem.href}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <Link
                                href={menuItem.href}
                                className="block p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:hover:from-[#4A50B0]/20 dark:hover:to-purple-600/20 transition-all duration-300 group border border-transparent hover:border-[#4A50B0]/10 dark:hover:border-[#4A50B0]/30"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4A50B0]/10 to-purple-600/10 group-hover:from-[#4A50B0]/20 group-hover:to-purple-600/20 transition-all duration-300 shadow-sm">
                                    <menuItem.icon className="h-5 w-5 text-[#4A50B0] dark:text-[#9ca0ff] group-hover:scale-110 transition-transform" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#4A50B0] dark:group-hover:text-[#9ca0ff] transition-colors">
                                      {menuItem.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {menuItem.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Mega Dropdown for Live */}
                  {item.hasMegaMenu && item.name === 'Live' && openDropdown === 'live' && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mega-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] rounded-2xl border border-[#4A50B0]/10 dark:border-[#4A50B0]/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-[#4A50B0]/10 overflow-hidden z-[200]"
                      onMouseEnter={() => setOpenDropdown('live')}
                      onMouseLeave={() => {
                        setOpenDropdown(null);
                      }}
                    >
                      <div className="p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 bg-gradient-to-r from-[#4A50B0] to-purple-600 bg-clip-text text-transparent">
                          Live Programs
                        </h3>
                        <div className="space-y-2">
                          {liveMenuItems.map((menuItem, idx) => (
                            <motion.div
                              key={menuItem.href}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <Link
                                href={menuItem.href}
                                className="block p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:hover:from-[#4A50B0]/20 dark:hover:to-purple-600/20 transition-all duration-300 group border border-transparent hover:border-[#4A50B0]/10 dark:hover:border-[#4A50B0]/30"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4A50B0]/10 to-purple-600/10 group-hover:from-[#4A50B0]/20 group-hover:to-purple-600/20 transition-all duration-300 shadow-sm">
                                    <menuItem.icon className="h-5 w-5 text-[#4A50B0] dark:text-[#9ca0ff] group-hover:scale-110 transition-transform" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#4A50B0] dark:group-hover:text-[#9ca0ff] transition-colors">
                                      {menuItem.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {menuItem.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                  className="w-72 pl-11 pr-10 rounded-full border-2 border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:border-[#4A50B0] focus:ring-2 focus:ring-[#4A50B0]/20 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-md hover:border-[#4A50B0]/30 dark:text-white dark:placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {searchFocused && searchQuery.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-3 w-96 rounded-2xl border border-[#4A50B0]/10 dark:border-[#4A50B0]/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-[#4A50B0]/10 z-50 overflow-hidden"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {searchSuggestions.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        {searchSuggestions.map((group, idx) => (
                          <div key={idx} className="p-2">
                            <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              {group.type}
                            </h4>
                            {group.items.length > 0 ? (
                              group.items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  className="block px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 transition-colors"
                                  onClick={() => {
                                    setSearchQuery('');
                                    setSearchFocused(false);
                                  }}
                                >
                                  {item.title}
                                </Link>
                              ))
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                        Searching...
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 text-gray-700 dark:text-gray-200 hover:text-[#4A50B0] dark:hover:text-[#9ca0ff] transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:hover:from-[#4A50B0]/20 dark:hover:to-purple-600/20 group"
            >
              <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-[#4A50B0] to-purple-600 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-[#4A50B0]/30 ring-2 ring-white"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-700 dark:text-gray-200 hover:text-[#4A50B0] dark:hover:text-[#9ca0ff] transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:hover:from-[#4A50B0]/20 dark:hover:to-purple-600/20"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Auth Buttons / User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full hover:ring-2 hover:ring-[#4A50B0]/30 transition-all duration-300 p-0 overflow-hidden hover:scale-105 shadow-sm hover:shadow-md">
                    {user?.avatarUrl ? (
                      <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-[#4A50B0]/20 ring-2 ring-white">
                        <Image
                          src={user.avatarUrl}
                          alt={user.name || 'User'}
                          className="h-full w-full object-cover"
                          width={44}
                          height={44}
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-[#4A50B0] to-purple-600 text-white font-semibold text-sm">
                        {getUserInitials(user?.name)}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/enrolled" className="cursor-pointer">
                      <Video className="mr-2 h-4 w-4" />
                      My Enrolled Items
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/subscription" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/orders" className="cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>

                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer font-semibold" style={{ color: BRAND_COLOR }}>
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild className="hover:text-[#4A50B0] dark:text-gray-200 dark:hover:text-[#9ca0ff] hover:bg-[#4A50B0]/5 dark:hover:bg-[#4A50B0]/20 transition-all duration-300 font-medium">
                  <Link href="/auth?mode=login">Login</Link>
                </Button>
                <Button asChild className="text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-[#4A50B0] to-purple-600 hover:from-[#4A50B0]/90 hover:to-purple-600/90 font-semibold px-6">
                  <Link href="/auth?mode=signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(true);
              }}
              className="lg:hidden hover:bg-[#4A50B0]/5 dark:hover:bg-[#4A50B0]/20 transition-all duration-300 text-gray-700 dark:text-gray-200"
            >
              <Menu className="h-5 w-5 hover:scale-110 transition-transform" />
            </Button>
            <Link
              href="/cart"
              className="relative p-2.5 text-gray-700 dark:text-gray-200 hover:text-[#4A50B0] dark:hover:text-[#9ca0ff] transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-[#4A50B0] to-purple-600 text-white text-[10px] flex items-center justify-center font-bold shadow-md shadow-[#4A50B0]/30 ring-2 ring-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSearchOpen(true);
              }}
              className="hover:bg-[#4A50B0]/5 dark:hover:bg-[#4A50B0]/20 transition-all duration-300 text-gray-700 dark:text-gray-200"
            >
              <Search className="h-5 w-5 hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/20 z-[104] top-20"
              onClick={() => setMobileSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed top-20 left-0 right-0 z-[105] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#4A50B0]/10 dark:border-[#4A50B0]/30 shadow-xl shadow-[#4A50B0]/5 px-4 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={mobileSearchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                    className="w-full pl-10 pr-10 rounded-full border-2 border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:border-[#4A50B0] focus:ring-2 focus:ring-[#4A50B0]/20 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 shadow-sm dark:text-white dark:placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </form>

              {/* Mobile Search Suggestions */}
              {searchQuery.length >= 2 && searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 max-h-64 overflow-y-auto border-t border-gray-100"
                >
                  {searchSuggestions.map((group, idx) => (
                    <div key={idx} className="py-2">
                      <h4 className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                        {group.type}
                      </h4>
                      {group.items.length > 0 ? (
                        group.items.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="block px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setSearchQuery('');
                              setMobileSearchOpen(false);
                            }}
                          >
                            {item.title}
                          </Link>
                        ))
                      ) : null}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Drawer - Using Portal to render at body level */}
      {typeof window !== 'undefined' && mobileMenuOpen && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-[110] lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-[100dvh] w-[85vw] max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[120] lg:hidden shadow-2xl shadow-[#4A50B0]/20 overflow-y-auto border-r border-[#4A50B0]/10 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#4A50B0]/10 w-full dark:border-gray-800">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                      <Image src="/logo.png" alt="Shrestha Academy" width={120} height={120} className="w-full h-full object-contain dark:invert" />
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleTheme}
                        className="p-2.5 text-gray-700 dark:text-gray-200 hover:text-[#4A50B0] dark:hover:text-[#9ca0ff] transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:hover:bg-[#4A50B0]/20"
                        aria-label="Toggle theme"
                      >
                        {theme === 'dark' ? (
                          <Sun className="h-5 w-5" />
                        ) : (
                          <Moon className="h-5 w-5" />
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="dark:text-gray-400 dark:hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                        className="w-full pl-10 rounded-full border-2 border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-[#4A50B0] focus:ring-2 focus:ring-[#4A50B0]/20 focus:bg-white transition-all duration-300 shadow-sm dark:bg-gray-800/80 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:bg-gray-800"
                      />
                    </div>
                  </form>

                  {/* Mobile Menu Items */}
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <div key={item.href}>
                        {item.hasMegaMenu ? (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value={item.href} className="border-none">
                              <AccordionTrigger className="text-base font-medium py-3 hover:no-underline dark:text-gray-200">
                                {item.name}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pl-4">
                                  {(item.name === 'Courses' ? courseMenuItems : liveMenuItems).map((subItem) => (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMobileMenuOpen(false);
                                      }}
                                      className="block py-2 text-sm text-gray-600 hover:text-[#4A50B0] dark:text-gray-400 dark:hover:text-[#9ca0ff]"
                                    >
                                      {subItem.title}
                                    </Link>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileMenuOpen(false);
                            }}
                            className="block py-3 px-4 text-base font-semibold hover:text-[#4A50B0] transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-[#4A50B0]/5 hover:to-purple-600/5 dark:text-gray-200 dark:hover:text-[#9ca0ff] dark:hover:bg-[#4A50B0]/20"
                          >
                            {item.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-6 pt-6">
                    {isAuthenticated ? (
                      <>
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b dark:border-gray-800">
                          {user?.avatarUrl ? (
                            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#4A50B0]/20 flex-shrink-0">
                              <Image
                                src={user.avatarUrl}
                                alt={user.name || 'User'}
                                className="h-full w-full object-cover"
                                width={40}
                                height={40}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-[#4A50B0] to-purple-600 text-white font-semibold text-sm">
                              {getUserInitials(user?.name)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium dark:text-gray-200">{user?.name || 'User'}</p>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                        <Link
                          href="/profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 py-3 text-base font-medium hover:text-[#4A50B0] transition-colors dark:text-gray-200 dark:hover:text-[#9ca0ff]"
                        >
                          <User className="h-5 w-5" />
                          Profile
                        </Link>
                        <Link
                          href="/profile/enrolled"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 py-3 text-base font-medium hover:text-[#4A50B0] transition-colors dark:text-gray-200 dark:hover:text-[#9ca0ff]"
                        >
                          <Video className="h-5 w-5" />
                          My Enrolled Items
                        </Link>
                        <Link
                          href="/profile/subscription"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 py-3 text-base font-medium hover:text-[#4A50B0] transition-colors dark:text-gray-200 dark:hover:text-[#9ca0ff]"
                        >
                          <Settings className="h-5 w-5" />
                          Subscriptions
                        </Link>
                        <Link
                          href="/profile/orders"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 py-3 text-base font-medium hover:text-[#4A50B0] transition-colors dark:text-gray-200 dark:hover:text-[#9ca0ff]"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          My Orders
                        </Link>

                        {user?.role === 'ADMIN' && (
                          <>
                            <div className="border-t my-2"></div>
                            <Link
                              href="/admin"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-3 py-3 text-base font-semibold"
                              style={{ color: BRAND_COLOR }}
                            >
                              <Settings className="h-5 w-5" />
                              Admin Panel
                            </Link>
                          </>
                        )}
                        <div className="border-t my-2"></div>
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full justify-start text-red-600 mt-2"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" asChild className="w-full dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                          <Link href="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>
                            Login
                          </Link>
                        </Button>
                        <Button asChild className="w-full text-white" style={{ backgroundColor: BRAND_COLOR }}>
                          <Link href="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                            Sign Up
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.nav>
  );
}
