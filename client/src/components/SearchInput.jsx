'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 500,
  className,
  value: controlledValue,
  defaultValue = '',
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(isControlled ? controlledValue : defaultValue);
  const onSearchRef = useRef(onSearch);
  const debounceTimerRef = useRef(null);
  const isFirstRender = useRef(true);
  const lastControlledValueRef = useRef(controlledValue);

  // Update ref when onSearch changes
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Sync internal state with controlled value when it changes externally (not from user input)
  useEffect(() => {
    if (isControlled && controlledValue !== lastControlledValueRef.current) {
      setInternalValue(controlledValue);
      lastControlledValueRef.current = controlledValue;
    }
  }, [controlledValue, isControlled]);

  // Use internal value for display to ensure immediate UI updates
  const displayValue = internalValue;

  // Debounce search calls
  useEffect(() => {
    // Skip debounce on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (onSearchRef.current && typeof onSearchRef.current === 'function') {
        onSearchRef.current(displayValue);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [displayValue, debounceMs]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400 dark:text-gray-100"
      />
    </div>
  );
}

