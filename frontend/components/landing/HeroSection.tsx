// components/landing/HeroSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const [text, setText] = useState('');
  const fullText = "Bring Fresh Growth To Agriculture";

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    let isDeleting = false;
    let isMounted = true;

    const tick = () => {
      if (!isMounted) return;
      
      setText(fullText.slice(0, currentIndex));

      if (!isDeleting && currentIndex === fullText.length) {
        isDeleting = true;
        timeoutId = setTimeout(tick, 2500); // Pause when fully typed
      } else if (isDeleting && currentIndex === 0) {
        isDeleting = false;
        timeoutId = setTimeout(tick, 800); // Pause when fully deleted
      } else {
        currentIndex += isDeleting ? -1 : 1;
        timeoutId = setTimeout(tick, isDeleting ? 30 : 60); // Type at 60ms, delete at 30ms
      }
    };

    timeoutId = setTimeout(tick, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

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
          <div className="relative z-20 flex min-h-[480px] sm:min-h-[540px] md:min-h-[580px] lg:min-h-[620px] flex-col justify-center px-6 sm:px-10 md:px-12 lg:px-16 py-8 sm:py-12 max-w-2xl lg:max-w-3xl text-left">
            {/* Main Headline */}
            <h1 className="animate-slide-up-1 text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] font-black tracking-tight text-slate-950 leading-[1.1]">
              Know if your <br />
              <span className="whitespace-nowrap">business idea works</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-slide-up-2 mt-4 sm:mt-5 max-w-lg text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Make confident business decisions for a better tomorrow. Experience the ultimate entrepreneurial journey with expert feasibility, tailored financial schemes, and hyper-local insights.
            </p>

            {/* Search Bar with Typing Animation */}
            <div className="animate-slide-up-3 mt-8 w-full max-w-lg">
              <div className="flex items-center w-full rounded-full border border-slate-200 bg-white p-2 shadow-sm">
                {/* Chat Icon */}
                <div className="pl-3 pr-2 text-purple-400 flex-shrink-0">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                
                {/* Typing Text */}
                <div className="flex-1 text-slate-800 text-sm sm:text-base font-medium truncate px-2 min-h-[24px] flex items-center">
                  {text}
                  <span className="animate-pulse border-r-2 border-slate-400 ml-0.5 h-4 sm:h-5"></span>
                </div>

                {/* Button */}
                <Link href="/login?mode=signup" className="flex-shrink-0 bg-[#FABC15] hover:bg-[#EAB308] text-slate-900 font-semibold text-sm px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5">
                  Try it 
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
