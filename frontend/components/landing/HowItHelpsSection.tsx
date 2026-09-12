// components/landing/HowItHelpsSection.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Lightbulb, IndianRupee, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isAuthenticated } from '@/lib/auth';


interface HelpCardItem {
  id: string;
  title: string;
  description: string;
  href: string;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const HELP_ITEMS: readonly HelpCardItem[] = [
  {
    id: 'market',
    title: 'Understand your market',
    description: 'Get local demand insights, competition analysis, and real-world data for your area.',
    href: '/discover',
    iconBg: 'bg-blue-50 border border-blue-200/60',
    iconColor: 'text-blue-600',
    icon: BarChart3,
  },
  {
    id: 'test',
    title: 'Test your business',
    description: 'See if your idea is viable with cost estimates, revenue projections, and risk factors.',
    href: '/new-assessment',
    iconBg: 'bg-amber-50 border border-amber-200/60',
    iconColor: 'text-amber-500',
    icon: Lightbulb,
  },
  {
    id: 'finance',
    title: 'Plan your financing',
    description: 'Explore relevant government schemes and loan options based on your profile.',
    href: '/how-it-works',
    iconBg: 'bg-blue-50 border border-blue-200/60',
    iconColor: 'text-blue-600',
    icon: IndianRupee,
  },
] as const;

export function HowItHelpsSection(): React.JSX.Element {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent, href: string) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    }
  };

  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              How SAKSHAM helps
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-500">
              From idea to action — all in one place.
            </p>
          </div>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {HELP_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleCardClick(e, item.href)}
                className={cn(
                  'group flex items-start justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs',
                  'hover:border-slate-300 hover:shadow-sm transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
                )}
              >
                <div className="flex flex-col gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      item.iconBg,
                      item.iconColor
                    )}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-1 flex shrink-0 items-center text-slate-400 group-hover:text-slate-700 transition-colors">
                  <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
