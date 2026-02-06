'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { footerAPI } from '@/lib/api';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  MessageCircle,
  Send,
  Mail,
  Github,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Video,
  TrendingUp,
  FileText,
  Info,
  Shield,
  HelpCircle,
} from 'lucide-react';

const iconMap = {
  Facebook: Facebook,
  Twitter: Twitter,
  X: Twitter,
  Instagram: Instagram,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  WhatsApp: MessageCircle,
  Telegram: Send,
  Email: Mail,
  GitHub: Github,
  Discord: MessageSquare,
};

const FOOTER_LINKS = {
  products: [
    { name: 'Courses', href: '/courses', icon: GraduationCap },
    { name: 'Webinars', href: '/webinars', icon: Video },
    { name: '1:1 Guidance', href: '/guidance', icon: HelpCircle },
    { name: 'E-Books', href: '/ebooks', icon: FileText },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund' },
  ],
};

export default function Footer() {
  const { theme } = useTheme();
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await footerAPI.getLinks();
      if (response.success) {
        setSocialLinks(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch footer links:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <footer className="bg-white dark:bg-gray-900 text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-16 w-auto rounded-lg overflow-hidden  flex items-center justify-center">
                <Image
                  src={theme === 'dark' ? '/logo.png' : '/logob.png'}
                  alt="Shrestha Academy"
                  width={200}
                  height={200}
                  className="w-full h-full "
                  onError={(e) => {
                    // Fallback if logo doesn't exist
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />

              </div>

            </Link>
            <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
              Master professional skills with expert courses, Live Events, and personalized guidance.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {socialLinks.map((link) => {
                  const IconComponent = link.icon ? iconMap[link.icon] : null;
                  const linkColor = link.color || '#3b82f6';

                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:scale-110 hover:shadow-lg border"
                      style={{
                        backgroundColor: `${linkColor}15`,
                        borderColor: linkColor,
                      }}
                      title={link.label}
                    >
                      {IconComponent ? (
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: linkColor }}
                        />
                      ) : (
                        <span className="text-xs font-medium" style={{ color: linkColor }}>
                          {link.label.charAt(0)}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Products
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.products.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                    >
                      <Icon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Company
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Legal
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
              © {new Date().getFullYear()} Shrestha Academy. All rights reserved.
            </p>
            {socialLinks.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Follow us:</span>
                <span className="text-slate-400 dark:text-slate-500">Add social links in admin panel</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
