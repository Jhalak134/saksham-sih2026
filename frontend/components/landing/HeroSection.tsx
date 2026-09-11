// components/landing/HeroSection.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

function FourPointStar({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-4 w-4 text-emerald-900/60 pointer-events-none select-none', className)}
      aria-hidden="true"
    >
      <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.627 12 12 0-6.627 5.627-12 12-12-6.627 0-12-5.627-12-12z" />
    </svg>
  );
}

export function HeroSection(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] pt-4 sm:pt-6 lg:pt-8 pb-8 sm:pb-12">
      {/* 1. Subtle Architectural Vertical Dashed Guide Lines */}
      <div
        className="pointer-events-none absolute inset-0 mx-auto flex max-w-7xl justify-between px-4 sm:px-6 lg:px-8"
        aria-hidden="true"
      >
        <div className="h-full w-px border-r border-dashed border-slate-200/60" />
        <div className="hidden h-full w-px border-r border-dashed border-slate-200/60 sm:block" />
        <div className="h-full w-px border-r border-dashed border-slate-200/60" />
        <div className="hidden h-full w-px border-r border-dashed border-slate-200/60 md:block" />
        <div className="h-full w-px border-r border-dashed border-slate-200/60" />
      </div>

      {/* 2. Scattered 4-Point Star Sparkles */}
      <FourPointStar className="absolute left-[6%] top-[8%] h-4 w-4 opacity-75 animate-pulse" />
      <FourPointStar className="absolute left-[24%] top-[34%] h-3.5 w-3.5 opacity-60" />
      <FourPointStar className="absolute right-[8%] top-[10%] h-4 w-4 opacity-75 animate-pulse" />
      <FourPointStar className="absolute right-[32%] top-[28%] h-3.5 w-3.5 opacity-60" />

      {/* 3. Integrated Hero Stage: Left Text + Right Illustration */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[580px] lg:min-h-[620px] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/60 bg-[#FAFAF8] shadow-sm">
          {/* Background Illustration: Man with phone positioned clearly on the right */}
          <Image
            src="/images/man-with-phone-sky.png"
            alt="Rural entrepreneur in lush crop field using smartphone for SAKSHAM business feasibility"
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1280px"
            className="object-cover object-[78%_bottom] sm:object-[82%_bottom] md:object-right-bottom"
          />

          {/* Left-side soft ambient veil to guarantee 100% crisp typography legibility */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-4/5 md:w-3/5 lg:w-1/2 bg-gradient-to-r from-[#FAFAF8] via-[#FAFAF8]/90 to-transparent"
            aria-hidden="true"
          />

          {/* Top soft gradient fade */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-b from-[#FAFAF8] via-[#FAFAF8]/40 to-transparent"
            aria-hidden="true"
          />

          {/* Left-Aligned Text Content in the open left area */}
          <div className="relative z-20 flex min-h-[480px] sm:min-h-[540px] md:min-h-[580px] lg:min-h-[620px] flex-col justify-center px-6 sm:px-10 md:px-12 lg:px-16 py-8 sm:py-12 max-w-xl md:max-w-2xl text-left">
            {/* Main Headline */}
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl lg:text-6xl leading-[1.12]">
              Bring Fresh Growth
              <span className="block mt-1 sm:mt-2 text-slate-950">To Agriculture.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-5 max-w-lg text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed font-normal">
              Make confident business decisions for a better tomorrow. Experience the ultimate entrepreneurial journey with expert feasibility, tailored financial schemes, and hyper-local insights.
            </p>

            {/* Subtle Provenance Data Chips */}
            <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/80 shadow-2xs">
                Local data.
              </span>
              <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/80 shadow-2xs">
                Real opportunities.
              </span>
              <span className="rounded-md bg-white/80 px-2 py-0.5 border border-slate-200/80 shadow-2xs">
                Stronger businesses.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
