// components/landing/HowItWorksFlow.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface FlowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  image: string;
  alt: string;
}

const FLOW_STEPS: readonly FlowStep[] = [
  {
    id: 'form',
    number: 1,
    title: 'Tell us about your idea',
    description: 'Pick your location, business type, and how much capital you have. Takes under a minute.',
    image: '/images/how-it-works/step1.png',
    alt: 'New business feasibility assessment form showing location, category, and capital inputs',
  },
  {
    id: 'processing',
    number: 2,
    title: 'We do the analysis',
    description: 'Your inputs are checked against real local data — market demand, competition, and financials.',
    image: '/images/how-it-works/step2.png',
    alt: 'Assessment created screen showing the analysis checklist complete',
  },
  {
    id: 'report',
    number: 3,
    title: 'Get your full report',
    description: 'A fit score, financial plan, and matched government scheme — explained in plain language.',
    image: '/images/how-it-works/step3.png',
    alt: 'Dashboard showing fit score, breakdown, and final recommendation',
  },
] as const;

export function HowItWorksFlow(): React.JSX.Element {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            How it works
          </h2>
          <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-xl">
            Three simple steps to go from an idea to a fully validated, scheme-matched business plan.
          </p>
        </div>

        <div className="relative">
          {/* Background connected line (Desktop only) */}
          <div 
            className="hidden lg:block absolute top-6 left-[15%] right-[15%] h-[2px] bg-slate-200" 
            aria-hidden="true" 
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.id} className="relative flex flex-col items-center text-center group">
                
                {/* Step Node */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold shadow-md ring-8 ring-white mb-6 transition-transform group-hover:scale-110 duration-300">
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center w-full px-4">
                  <h3 className="text-lg font-bold text-slate-950 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-[28ch] mb-8">
                    {step.description}
                  </p>

                  {/* Flowchart Image Card */}
                  <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 transition-transform group-hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                    <div className="relative aspect-[4/3] w-full bg-slate-50">
                      <Image
                        src={step.image}
                        alt={step.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Connector Arrow */}
                {i < FLOW_STEPS.length - 1 && (
                  <div className="lg:hidden mt-10 text-slate-300">
                    <ArrowDown size={32} strokeWidth={2} />
                  </div>
                )}
                
                {/* Desktop Connector Arrow */}
                {i < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 right-[-2.5rem] -mt-[12px] bg-white px-2 text-slate-300 z-10">
                    <ArrowRight size={24} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}