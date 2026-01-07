'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PasswordInput({ 
  value, 
  onChange, 
  onBlur,
  className,
  id,
  name,
  placeholder,
  required,
  showStrength = false,
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    if (strength <= 2) {
      return { strength, label: 'Weak', color: 'bg-red-500', checks };
    } else if (strength <= 4) {
      return { strength, label: 'Medium', color: 'bg-yellow-500', checks };
    } else {
      return { strength, label: 'Strong', color: 'bg-green-500', checks };
    }
  };

  const passwordStrength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          required={required}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {showStrength && value && (
        <div className="space-y-2">
          {/* Strength Bar */}
          <div className="flex gap-1 h-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'flex-1 rounded-full transition-colors',
                  level <= (passwordStrength?.strength || 0)
                    ? passwordStrength?.color
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
          
          {/* Requirements */}
          {focused && passwordStrength && (
            <div className="space-y-1 text-xs">
              <div className={cn('flex items-center gap-2', passwordStrength.checks.length ? 'text-muted-foreground' : '')}>
                {passwordStrength.checks.length ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span>At least 8 characters</span>
              </div>
              <div className={cn('flex items-center gap-2', passwordStrength.checks.uppercase ? 'text-green-500' : 'text-muted-foreground')}>
                {passwordStrength.checks.uppercase ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>One uppercase letter</span>
              </div>
              <div className={cn('flex items-center gap-2', passwordStrength.checks.lowercase ? 'text-green-500' : 'text-muted-foreground')}>
                {passwordStrength.checks.lowercase ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>One lowercase letter</span>
              </div>
              <div className={cn('flex items-center gap-2', passwordStrength.checks.number ? 'text-green-500' : 'text-muted-foreground')}>
                {passwordStrength.checks.number ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>One number</span>
              </div>
              <div className={cn('flex items-center gap-2', passwordStrength.checks.special ? 'text-green-500' : 'text-muted-foreground')}>
                {passwordStrength.checks.special ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>One special character</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

