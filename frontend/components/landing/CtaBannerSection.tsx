// components/landing/CtaBannerSection.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function CtaBannerSection(): React.JSX.Element {
  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-r from-[#EBF3FF] via-[#E8F1FF] to-[#DCEBFF] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left text + CTA */}
            <div className="flex flex-col items-start lg:col-span-7">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Your ideas.
                <br />
                A stronger tomorrow.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md">
                Take the first step towards a more informed, more confident business journey.
              </p>

              <div className="mt-6">
                <Link
                  href="/new-assessment"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl bg-[#F2B705] px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-2xs',
                    'hover:bg-[#D99A00] transition-transform hover:scale-[1.02] active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
                  )}
                >
                  <span>Start your assessment</span>
                  <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Right illustration / graphic */}
            <div className="flex justify-center lg:justify-end lg:col-span-5">
              <div className="relative w-full max-w-xs sm:max-w-sm">
                <svg
                  viewBox="0 0 320 180"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto drop-shadow-xs"
                  aria-hidden="true"
                >
                  {/* Sun */}
                  <circle cx="250" cy="40" r="18" fill="#FDE047" />

                  {/* Trees */}
                  <circle cx="235" cy="85" r="22" fill="#3B82F6" />
                  <circle cx="280" cy="95" r="18" fill="#60A5FA" />
                  <circle cx="60" cy="110" r="16" fill="#3B82F6" />

                  {/* House Body */}
                  <rect x="95" y="85" width="130" height="60" rx="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                  {/* Roof */}
                  <polygon points="85,85 160,45 235,85" fill="#3B82F6" stroke="#2563EB" strokeWidth="2.5" />
                  <polygon points="160,45 235,85 235,85" fill="#2563EB" />
                  {/* Door */}
                  <rect x="150" y="110" width="20" height="35" rx="2" fill="#2563EB" />
                  {/* Windows */}
                  <rect x="110" y="100" width="16" height="16" rx="2" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5" />
                  <rect x="190" y="100" width="16" height="16" rx="2" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5" />

                  {/* Ground / Farmland Furrow Lines */}
                  <path d="M20 155 L300 155" stroke="#93C5FD" strokeWidth="2" strokeDasharray="6 6" />
                  <path d="M40 165 L280 165" stroke="#60A5FA" strokeWidth="2.5" strokeDasharray="8 6" />
                  <path d="M70 175 L250 175" stroke="#3B82F6" strokeWidth="3" strokeDasharray="10 8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
