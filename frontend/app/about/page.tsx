// app/about/page.tsx
import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const NON_CLAIMS = [
  'A loan approval system — the bank or SCA makes the final call.',
  'A government portal — we guide you toward schemes, not replace the official application.',
  'A guaranteed-success predictor — no tool can promise that.',
  'A replacement for a human financial advisor.',
];

export default function AboutPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <LandingNavbar />
      
      <main className="flex-1 flex flex-col justify-center py-16 sm:py-24">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 w-full">
          
          {/* Main Hero / Intro */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
              Why SAKSHAM exists
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              Government schemes make concessional credit available to first-time rural
              entrepreneurs. But capital alone doesn&apos;t stop a business from failing —
              a lack of local market research and confusion around loan structuring does.
              <strong className="text-slate-900 font-bold ml-1">SAKSHAM exists to close that gap.</strong>
            </p>
          </div>

          {/* Structured Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* What we do */}
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 sm:p-10 shadow-sm transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-950">What we actually do</h2>
              </div>
              <p className="text-base text-slate-700 leading-relaxed font-medium">
                Real census, market, and scheme data feeds a calculation engine that works
                out your fit score and loan structure. The AI never invents a number — it
                only explains, in plain language, what the data and the calculator already
                found.
              </p>
            </div>

            {/* What we are not */}
            <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-8 sm:p-10 shadow-sm transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3 mb-5">
                <XCircle className="h-7 w-7 text-rose-500" />
                <h2 className="text-2xl font-bold text-slate-950">What SAKSHAM is not</h2>
              </div>
              <ul className="space-y-4">
                {NON_CLAIMS.map((line) => (
                  <li key={line} className="flex gap-3 text-base text-slate-700 font-medium">
                    <span className="text-rose-400 mt-0.5 shrink-0">—</span>
                    <span className="leading-snug">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Origin Section */}
          <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50/50 p-8 sm:p-10 flex flex-col sm:flex-row items-start gap-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Info size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Where it came from</h2>
              <p className="text-base text-slate-700 leading-relaxed font-medium">
                Built for Smart India Hackathon, Problem Statement #91 — an AI-driven
                hyper-local business advisory and financial structuring assistant for
                rural micro-entrepreneurs.
              </p>
            </div>
          </div>

        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
