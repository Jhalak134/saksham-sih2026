// components/install/InstallAppIcon.tsx
import React from 'react';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InstallAppIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InstallAppIcon({
  size = 'md',
  className,
}: InstallAppIconProps): React.JSX.Element {
  const sizeClasses = {
    sm: 'h-10 w-10 rounded-xl',
    md: 'h-14 w-14 rounded-2xl',
    lg: 'h-20 w-20 rounded-3xl',
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 38,
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-[#FACC15] shadow-xs text-slate-900 border border-amber-300/60',
        sizeClasses[size],
        className
      )}
      aria-label="SAKSHAM app logo"
    >
      <Sprout
        size={iconSizes[size]}
        strokeWidth={2.25}
        className="text-slate-900 drop-shadow-xs"
      />
    </div>
  );
}
