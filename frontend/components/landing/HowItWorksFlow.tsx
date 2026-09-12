// components/landing/HowItWorksFlow.tsx
'use client';

import React from 'react';
import Image from 'next/image';

interface FlowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  image: string;
  alt: string;
  colorClass: string;
  arrow?: React.ReactNode;
  marginTopClass: string; // for the staggered effect
}

const FLOW_STEPS: readonly FlowStep[] = [
  {
    id: 'form',
    number: 1,
    title: 'Tell us about your idea',
    description: 'Pick your location, business type, and how much capital you have. Takes under a minute.',
    image: '/images/how-it-works/step1.png',
    alt: 'New business feasibility assessment form showing location, category, and capital inputs',
    colorClass: 'text-blue-500',
    marginTopClass: 'mt-0',
    arrow: (
      <svg
        className="hidden lg:block absolute top-[4rem] -right-[4rem] xl:-right-[5rem] w-[80px] xl:w-[100px] h-[60px] text-blue-500 pointer-events-none drop-shadow-sm"
        viewBox="0 0 100 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 20 Q 50 -10, 95 45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M80 45 L 95 45 L 90 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'processing',
    number: 2,
    title: 'We do the analysis',
    description: 'Your inputs are checked against real local data — market demand, competition, and financials.',
    image: '/images/how-it-works/step2.png',
    alt: 'Assessment created screen showing the analysis checklist complete',
    colorClass: 'text-rose-400',
    marginTopClass: 'lg:mt-16 xl:mt-24',
    arrow: (
      <svg
        className="hidden lg:block absolute top-[4rem] -right-[4rem] xl:-right-[5rem] w-[80px] xl:w-[100px] h-[60px] text-rose-400 pointer-events-none drop-shadow-sm"
        viewBox="0 0 100 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 20 Q 50 -10, 95 45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M80 45 L 95 45 L 90 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'report',
    number: 3,
    title: 'Get your full report',
    description: 'A fit score, financial plan, and matched government scheme — explained in plain language.',
    image: '/images/how-it-works/step3.png',
    alt: 'Dashboard showing fit score, breakdown, and final recommendation',
    colorClass: 'text-emerald-400',
    marginTopClass: 'lg:mt-32 xl:mt-48',
  },
] as const;

export function HowItWorksFlow(): React.JSX.Element {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#F4F6FB] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header matching the image style */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase mb-3">
            How It Works
          </h3>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Start in 3 Easy Steps
          </h2>
        </div>

        {/* Staggered Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 xl:gap-16 pb-10 items-start">
          {FLOW_STEPS.map((step, i) => (
            <div 
              key={step.id} 
              className={`relative flex flex-col bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 ${step.marginTopClass}`}
              style={{ zIndex: 30 - i }}
            >
              {/* Colored Step Number */}
              <div className={`text-4xl sm:text-5xl font-semibold mb-6 ${step.colorClass}`}>
                {step.number}
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium mb-8">
                {step.description}
              </p>

              {/* Retained Image inside the card */}
              <div className="mt-auto w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2 bg-white">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                </div>
                <div className="relative aspect-[4/3] w-full bg-white">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Connective Arrow pointing to next card (Desktop only) */}
              {step.arrow}
              
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}