'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (used as aria-label and title) */
  label: string;
}

/**
 * 44×44 px touch-target wrapper for icon-only buttons.
 * Pass the icon as children.
 */
export function IconButton({
  label,
  className,
  children,
  ...rest
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center',
        'h-11 w-11 rounded-md',
        'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-dark)]',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
