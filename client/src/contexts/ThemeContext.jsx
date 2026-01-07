'use client';

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';

// Re-export ThemeProvider wrapping next-themes
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

// ///////////////////////////////////////////////////////////////////////////
// useTheme hook with View Transition animation (Rectangle + Blur + Top-Down)
// ///////////////////////////////////////////////////////////////////////////

export function useTheme() {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const styleId = "theme-transition-styles";

  const updateStyles = useCallback((css) => {
    if (typeof window === "undefined") return;

    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
  }, []);

  // Hardcoded: Rectangle + Blur ON + Top-Down
  const animationCSS = `
    ::view-transition-group(root) {
      animation-duration: 0.7s;
      animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
    }
          
    ::view-transition-new(root) {
      animation-name: reveal-light-top-down-blur;
      filter: blur(2px);
    }

    ::view-transition-old(root),
    .dark::view-transition-old(root) {
      animation: none;
      z-index: -1;
    }
    .dark::view-transition-new(root) {
      animation-name: reveal-dark-top-down-blur;
      filter: blur(2px);
    }

    @keyframes reveal-dark-top-down-blur {
      from {
        clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%);
        filter: blur(8px);
      }
      50% { filter: blur(4px); }
      to {
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
        filter: blur(0px);
      }
    }

    @keyframes reveal-light-top-down-blur {
      from {
        clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%);
        filter: blur(8px);
      }
      50% { filter: blur(4px); }
      to {
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
        filter: blur(0px);
      }
    }
  `;

  const toggleTheme = useCallback(() => {
    updateStyles(animationCSS);

    if (typeof window === "undefined") return;

    const switchTheme = () => {
      setNextTheme(resolvedTheme === "light" ? "dark" : "light");
    };

    // Use View Transitions API if available
    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    document.startViewTransition(switchTheme);
  }, [resolvedTheme, setNextTheme, updateStyles, animationCSS]);

  const setTheme = useCallback((newTheme) => {
    updateStyles(animationCSS);

    if (typeof window === "undefined") return;

    const switchTheme = () => {
      setNextTheme(newTheme);
    };

    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    document.startViewTransition(switchTheme);
  }, [setNextTheme, updateStyles, animationCSS]);

  return {
    theme: mounted ? theme : undefined,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    toggleTheme,
    setTheme,
    mounted,
  };
}
