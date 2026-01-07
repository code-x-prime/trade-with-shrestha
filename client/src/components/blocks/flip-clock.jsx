"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { memo, useEffect, useState } from "react";

const flipUnitVariants = cva(
  "relative subpixel-antialiased perspective-[1000px] rounded-md overflow-hidden",
  {
    variants: {
      size: {
        sm: "w-5 h-8 text-2xl sm:w-10 sm:h-14 sm:text-3xl", // Small
        md: "w-5 h-8 text-2xl sm:w-10 sm:h-14 sm:text-3xl md:w-14 md:h-20 md:text-4xl", // Responsive Medium
        lg: "w-10 h-14 text-3xl sm:w-14 sm:h-20 sm:text-4xl md:w-17 md:h-24 md:text-5xl", // Responsive Large
        xl: "w-14 h-20 text-4xl sm:w-17 sm:h-24 sm:text-5xl md:w-22 md:h-32 md:text-6xl" // Responsive XL
      },
      variant: {
        default: "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 shadow-sm",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background text-foreground",
        muted: "bg-muted text-muted-foreground"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);

const commonCardStyle = cn(
  "absolute inset-x-0 overflow-hidden h-1/2 bg-inherit text-inherit"
);

const FlipUnit = memo(function FlipUnit({
  digit,
  size,
  variant,
  className
}) {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setFlipping(true);
      // Wait for the full animation (0.3s top + 0.3s bottom) before resetting
      const timer = setTimeout(() => {
        setFlipping(false);
        setPrevDigit(digit);
      }, 550); // Slightly less than 600ms to ensure smoothness
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  return (
    <div className={cn(flipUnitVariants({ size, variant }), className)}>
      {/* 1. Background Top (The NEW digit waiting) */}
      <div className={cn(commonCardStyle, "rounded-t-lg top-0")}>
        <DigitSpan position="top">{digit}</DigitSpan>
      </div>

      {/* 2. Background Bottom (The OLD digit staying) */}
      <div className={cn(commonCardStyle, "rounded-b-lg translate-y-full")}>
        <DigitSpan position="bottom">{prevDigit}</DigitSpan>
      </div>

      {/* 3. Top Flap (The OLD digit falling down) */}
      <div
        className={cn(
          commonCardStyle,
          "z-20 origin-bottom backface-hidden rounded-t-lg",
          flipping && "animate-flip-top"
        )}
      >
        <DigitSpan position="top">{prevDigit}</DigitSpan>
      </div>

      {/* 4. Bottom Flap (The NEW digit appearing) */}
      <div
        className={cn(
          commonCardStyle,
          "z-10 origin-top backface-hidden rounded-b-lg translate-y-full",
          flipping && "animate-flip-bottom"
        )}
        style={{ transform: "rotateX(90deg)" }}
      >
        <DigitSpan position="bottom">{digit}</DigitSpan>
      </div>

      {/* Center Divider Shadow */}
      <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-background/50 z-30" />
    </div>
  );
});

function DigitSpan({ children, position }) {
  return (
    <span
      className={cn(
        "absolute left-0 right-0 w-full flex items-center justify-center",
        // The span should be the full height of the PARENT FlipUnit (200% of the half-card)
        "h-[200%]"
      )}
      style={{
        // If it's the top half, align the full span to the top
        // If it's the bottom half, shift thefull span up so its bottom half shows
        top: position === "top" ? "0%" : "-100%"
      }}
    >
      {children}
    </span>
  );
}

const flipClockVariants = cva(
  "relative flex justify-center items-center font-mono font-medium",
  {
    variants: {
      size: {
        sm: "text-2xl space-x-1 sm:text-3xl",
        md: "text-2xl space-x-1 sm:text-3xl md:text-4xl md:space-x-2",
        lg: "text-3xl space-x-1 sm:text-4xl sm:space-x-2 md:text-5xl",
        xl: "text-4xl space-x-2 sm:text-5xl md:text-6xl md:space-x-3"
      },
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
        muted: ""
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);

const heightMap = {
  sm: "text-2xl sm:text-3xl",
  md: "text-2xl sm:text-3xl md:text-4xl",
  lg: "text-3xl sm:text-4xl md:text-5xl",
  xl: "text-4xl sm:text-5xl md:text-6xl"
};

function ClockSeparator({ size }) {
  return (
    <span
      className={cn(
        "text-center -translate-y-[8%]",
        size ? heightMap[size] : heightMap["md"]
      )}
    >
      :
    </span>
  );
}

export default function FlipClock({
  countdown = false,
  targetDate,
  size,
  variant,
  showDays = "auto",
  className,
  ...props
}) {
  // Initialize with zeros or null to avoid server/client mismatch
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial calculation on client side
    setTime(getTime(countdown, targetDate));
    
    // Run a faster heartbeat (250ms) to catch the second rollover immediately
    const timer = setInterval(() => {
      const nextTime = getTime(countdown, targetDate);

      // Only update state if the seconds actually changed to prevent unnecessary re-renders
      setTime((prev) => {
        if (
          prev.seconds === nextTime.seconds &&
          prev.minutes === nextTime.minutes
        ) {
          return prev;
        }
        return nextTime;
      });
    }, 250); // 4fps check is plenty

    return () => clearInterval(timer);
  }, [countdown, targetDate]);

  if (!mounted) {
    // Render a static placeholder or null to ensure hydration matches
    // We can render the structure with 00:00:00:00 matching initial state
    // But to be perfectly safe, we'll render the component with initial 0 state
    // which matches the useState initialization.
  }

  const daysStr = String(time.days).padStart(2, "0");
  const hoursStr = String(time.hours).padStart(2, "0");
  const minutesStr = String(time.minutes).padStart(2, "0");
  const secondsStr = String(time.seconds).padStart(2, "0");

  const shouldShowDays =
    countdown &&
    (showDays === "always" || (showDays === "auto" && time.days > 0));

  return (
    <div
      className={cn(flipClockVariants({ size, variant }), className)}
      aria-live="polite"
      {...props}
    >
      <span className="sr-only absolute">
        {`${time.hours}:${time.minutes}:${time.seconds}`}
      </span>

      {/* Days */}
      {shouldShowDays && (
        <>
          {daysStr.split("").map((digit, i) => (
            <FlipUnit
              key={`d-${i}`}
              digit={digit}
              size={size}
              variant={variant}
            />
          ))}
          <ClockSeparator size={size} />
        </>
      )}

      {/* Hours */}
      {hoursStr.split("").map((digit, index) => (
        <FlipUnit
          key={`hour-${index}`}
          digit={digit}
          size={size}
          variant={variant}
        />
      ))}

      <ClockSeparator size={size} />

      {/* Minutes */}
      {minutesStr.split("").map((digit, index) => (
        <FlipUnit
          key={`minute-${index}`}
          digit={digit}
          size={size}
          variant={variant}
        />
      ))}

      <ClockSeparator size={size} />

      {/* Seconds */}
      {secondsStr.split("").map((digit, index) => (
        <FlipUnit
          key={`second-${index}`}
          digit={digit}
          size={size}
          variant={variant}
        />
      ))}

      {/* Injected Keyframes (The Shadcn "Cheat Code") */}
      <style jsx global>{`
        /* Use the same duration for both to keep them in sync */
        .animate-flip-top {
          animation: flip-top-anim 0.6s ease-in forwards;
        }
        .animate-flip-bottom {
          animation: flip-bottom-anim 0.6s ease-out forwards;
        }

        @keyframes flip-top-anim {
          0% {
            transform: rotateX(0deg);
            z-index: 30;
          }
          50%,
          100% {
            transform: rotateX(-90deg);
            z-index: 10;
          }
        }

        @keyframes flip-bottom-anim {
          0%,
          50% {
            transform: rotateX(90deg);
            z-index: 10;
          }
          100% {
            transform: rotateX(0deg);
            z-index: 30;
          }
        }
      `}</style>
    </div>
  );
}

function getTime(countdown, targetDate) {
  const now = new Date();

  // Real-time Clock Mode
  if (!countdown) {
    return {
      days: 0,
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds()
    };
  }

  // Countdown Mode
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = Math.max(0, targetDate.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60)
  };
}
