// components/landing/HeroSection.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  MessageSquare,
  PlayCircle,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Sprout,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export function HeroSection(): React.JSX.Element {
  const router = useRouter();
  const [ideaText, setIdeaText] = useState('');

  function handleIdeaSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const trimmed = ideaText.trim();
    if (trimmed.length > 0) {
      router.push(`/new-assessment?idea=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/new-assessment');
    }
  }

  return (
    <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Content Column (7 cols on lg) */}
          <div className="flex flex-col items-start lg:col-span-7">
            {/* Context pill badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 border border-blue-200/60">
              <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-blue-700">
                LOCAL INSIGHTS. REAL OPPORTUNITIES.
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
              Make confident business decisions for a better tomorrow.
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Get practical insights, explore financing options, and turn your ideas into viable businesses — with local data, in your language.
            </p>

            {/* CTA Button */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/new-assessment"
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl bg-[#F2B705] px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-2xs',
                  'hover:bg-[#D99A00] transition-all hover:scale-[1.01] active:scale-[0.99]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
                )}
              >
                <span>Start your assessment</span>
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>

            {/* Feature highlights line */}
            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium">
              <span>Free to use</span>
              <span className="text-slate-300">•</span>
              <span>Works in your language</span>
              <span className="text-slate-300">•</span>
              <span>Built for rural India</span>
            </div>

            {/* Interactive "Not sure where to start?" conversational card */}
            <div className="mt-8 w-full rounded-2xl border border-blue-100 bg-[#F0F6FF]/70 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700">
                  <MessageSquare size={16} strokeWidth={2.25} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Not sure where to start?
                  </p>
                  <p className="text-xs text-slate-600">
                    Describe your business idea in plain language.
                  </p>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleIdeaSubmit} className="mt-3.5 relative flex items-center">
                <input
                  type="text"
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="e.g. I want to start a dairy unit in my village..."
                  className={cn(
                    'w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs',
                    'focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all'
                  )}
                  aria-label="Describe your business idea in plain language"
                />
                <button
                  type="submit"
                  aria-label="Submit your business idea"
                  className={cn(
                    'absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs',
                    'hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
                  )}
                >
                  <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </form>

              {/* See how it works link */}
              <div className="mt-3 flex items-center">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <PlayCircle size={14} strokeWidth={2} aria-hidden="true" />
                  <span>See how it works</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Visual Column (5 cols on lg) */}
          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-md lg:max-w-none overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50/50 p-6 sm:p-8 shadow-sm">
              {/* Background decorative landscape elements */}
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100/90 text-emerald-800 shadow-inner">
                  <div className="flex flex-col items-center">
                    <Sprout size={48} strokeWidth={1.75} className="text-emerald-700 animate-bounce" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mt-1">
                      Grassroots
                    </span>
                  </div>
                  {/* Floating micro-badges around center */}
                  <div className="absolute -top-1 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xs text-xs font-black">
                    ₹
                  </div>
                  <div className="absolute -bottom-1 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                    <TrendingUp size={14} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-bold text-slate-900">
                    Empowering Rural Entrepreneurs
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-xs">
                    Data-driven guidance for agriculture, dairy, textiles, retail, and local enterprise.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5 w-full">
                  <div className="flex items-center gap-2 rounded-xl bg-white/90 border border-slate-200/70 p-2.5 shadow-2xs">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900">90% Scheme</p>
                      <p className="text-[9px] text-slate-500">Government Support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/90 border border-slate-200/70 p-2.5 shadow-2xs">
                    <Smartphone size={16} className="text-blue-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900">Hyper-Local</p>
                      <p className="text-[9px] text-slate-500">Village & Block Data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating quote badge overlay */}
              <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-md backdrop-blur-xs">
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Local data.
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Real opportunities.
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Stronger businesses.
                  </p>
                </div>
                <div className="mt-2.5 h-1 w-12 rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
