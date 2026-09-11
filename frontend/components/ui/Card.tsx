'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({
  className,
  children,
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-white p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
