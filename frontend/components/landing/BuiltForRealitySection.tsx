// components/landing/BuiltForRealitySection.tsx
'use client';

import React from 'react';
import { MapPin, TrendingUp, FileText, Languages } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const REALITY_FEATURES: readonly FeatureItem[] = [
  {
    id: 'village',
    title: 'Village and block-level context',
    description: 'Insights tailored to your local area, not just national averages.',
    icon: MapPin,
  },
  {
    id: 'signals',
    title: 'Local market signals',
    description: 'Real data on demand, prices, and nearby opportunities.',
    icon: TrendingUp,
  },
  {
    id: 'scheme',
    title: 'Scheme-aware financing',
    description: 'Get matched with relevant government schemes and financial products.',
    icon: FileText,
  },
  {
    id: 'language',
    title: 'Multilingual support',
    description: "Use SAKSHAM in the language you're most comfortable with.",
    icon: Languages,
  },
] as const;

export function BuiltForRealitySection(): React.JSX.Element {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Built for your reality
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-slate-500 max-w-xl">
            Designed around the opportunities and challenges of rural and semi-urban India.
          </p>
        </div>

        {/* 2x2 Grid on desktop, 1 col on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {REALITY_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs',
                  'hover:border-slate-300 transition-colors'
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/50 text-blue-600">
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
