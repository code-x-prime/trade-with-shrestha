'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
  const truncateText = (text, maxLength = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // ❌ Home ('/') ko items se hata diya
  const filteredItems = items.filter(
    (item) => item.href !== '/'
  );

  return (
    <nav className="mb-4 md:mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-1 md:gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
        
        {/* Home icon only */}
        <li className="flex items-center">
          <Link
            href="/"
            className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center"
          >
            <Home className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        </li>

        {filteredItems.map((item, index) => (
          <li key={index} className="flex items-center min-w-0">
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 mx-1 md:mx-2 text-gray-500 dark:text-gray-500 flex-shrink-0" />

            {item.href && index < filteredItems.length - 1 ? (
              <Link
                href={item.href}
                className="hover:text-gray-900 dark:hover:text-white transition-colors truncate text-gray-600 dark:text-gray-300"
                title={item.label}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">
                  {truncateText(item.label, 15)}
                </span>
              </Link>
            ) : (
              <span
                className="text-gray-900 dark:text-white font-medium truncate"
                title={item.label}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">
                  {truncateText(item.label, 20)}
                </span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
