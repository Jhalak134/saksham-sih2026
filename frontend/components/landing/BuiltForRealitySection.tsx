// components/landing/BuiltForRealitySection.tsx
'use client';

import React from 'react';
import { BrainCircuit, Calculator, Landmark, Activity, ShieldCheck, BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

export function BuiltForRealitySection(): React.JSX.Element {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 sm:mb-14 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Built on a foundation <span className="block mt-1">of absolute truth.</span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-xl">
            SAKSHAM combines deterministic financial mathematics with grounded AI insights—so you get feasibility answers you can actually bank on.
          </p>
        </div>

        {/* Bento Grid Wrapper */}
        <div className="rounded-[2.5rem] bg-[#111827] p-3 sm:p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Card 1 */}
            <div className="flex flex-col rounded-[2rem] bg-white p-8 sm:p-10 shadow-sm transition-transform hover:scale-[1.02] duration-300">
              <div className="mb-6 inline-flex text-emerald-600">
                <BrainCircuit size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">Grounded AI Advisory</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                AI explains, but data provides the evidence. Every piece of advice is strictly rooted in verified agricultural and business documents.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col rounded-[2rem] bg-transparent p-8 sm:p-10 transition-transform hover:scale-[1.02] duration-300">
              <div className="mb-6 inline-flex text-amber-500">
                <Calculator size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deterministic Financials</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Project costs, EMIs, and loan amounts are calculated by a strict mathematical engine—never guessed or hallucinated by an LLM.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col rounded-[2rem] bg-white p-8 sm:p-10 shadow-sm transition-transform hover:scale-[1.02] duration-300">
              <div className="mb-6 inline-flex text-emerald-600">
                <Landmark size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">Smart Scheme Matching</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Automatically aligns your rural enterprise profile with live government initiatives like PMFME and Micro Finance Term Loans.
              </p>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col rounded-[2rem] bg-transparent p-8 sm:p-10 transition-transform hover:scale-[1.02] duration-300">
              <div className="mb-6 inline-flex text-amber-500">
                <Activity size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Feasibility Scoring</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Get a clear 0-100 fit score and repayment burden category so you know exactly where you stand before committing capital.
              </p>
            </div>

            {/* Card 5 */}
            <div className="flex flex-col rounded-[2rem] bg-white p-8 sm:p-10 shadow-sm transition-transform hover:scale-[1.02] duration-300">
              <div className="mb-6 inline-flex text-emerald-600">
                <ShieldCheck size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">Zero-PII Privacy</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Your personal identity stays secure. Phone numbers and emails are completely stripped out before any AI analysis occurs.
              </p>
            </div>

            {/* Card 6 */}
            <div className="flex flex-col rounded-[2rem] bg-transparent p-8 sm:p-10 transition-transform hover:scale-[1.02] duration-300">
              <div className="mb-6 inline-flex text-amber-500">
                <BookOpenCheck size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Transparent Citations</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Every AI insight includes exact page numbers and document sources. If the historical data isn't there, we don't invent it.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
