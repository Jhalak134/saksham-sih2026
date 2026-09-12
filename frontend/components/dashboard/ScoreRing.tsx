// components/dashboard/ScoreRing.tsx
// Circular SVG progress ring for Fit Score display.

'use client';

import React from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface ScoreRingProps {
  readonly score: number;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export function ScoreRing({
  score,
  size = 110,
  strokeWidth = 9,
}: ScoreRingProps): React.JSX.Element {
  const clamped = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 75
      ? '#16A34A' // Green (Highly Feasible / Feasible)
      : clamped >= 52
      ? '#D97706' // Amber (Moderate Fit)
      : '#E11D48'; // Rose Red (High Risk)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Centered label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          <AnimatedCounter value={clamped} />
        </span>
        <span className="text-[10px] font-medium text-slate-400">/ 100</span>
      </div>
    </div>
  );
}
