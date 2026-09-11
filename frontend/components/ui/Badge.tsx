'use client';

import React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'location' | 'capital' | 'count' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  location:
    'border border-[var(--color-border)] bg-white text-[var(--color-text-dark)]',
  capital:
    'border border-[var(--color-border)] bg-white text-[var(--color-text-dark)]',
  count:
    'bg-[var(--color-primary)] text-[var(--color-text-dark)] font-semibold',
  neutral:
    'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
};

/**
 * Chip / pill badge.
 * - `location` / `capital` — header filter chips with border
 * - `count` — small count indicator (e.g. Compare badge)
 * - `neutral` — muted surface chip
 */
export function Badge({
  variant = 'neutral',
  className,
  children,
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
