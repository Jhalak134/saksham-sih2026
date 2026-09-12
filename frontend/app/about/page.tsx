// app/about/page.tsx
import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function AboutPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6FB] text-slate-900 font-sans selection:bg-emerald-200">
      <LandingNavbar />
      
      <main className="flex-1">
        {/* Hero Title Area */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 mb-6">
            About <span className="text-emerald-600">SAKSHAM</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-slate-500 leading-relaxed max-w-3xl mx-auto text-balance">
            We believe that entrepreneurship should not be limited by a lack of information.
          </p>
        </section>

        {/* Narrative & Context */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-24">
          <div className="space-y-8 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            <p>
              India’s farmers work tirelessly to feed the nation, yet the value of their hard work does not always reach them fairly. From limited access to market information to dependence on intermediaries and fluctuating prices, rural communities often face challenges that make it difficult to turn their skills, resources, and hard work into sustainable businesses.
            </p>
            <p>
              At the same time, rural India is witnessing a new wave of entrepreneurship. More people are looking beyond traditional livelihoods and exploring opportunities to build small businesses, create local employment, and become financially independent. But for many aspiring entrepreneurs, one of the biggest challenges is simply knowing <strong className="text-slate-950 font-bold">where to start</strong> — understanding the local market, identifying opportunities, evaluating competition, and deciding whether an idea is actually viable.
            </p>
          </div>
          
          {/* The Pivot / Highlight */}
          <div className="my-16 rounded-2xl bg-white p-8 sm:p-10 border-l-4 border-emerald-500 shadow-md shadow-slate-200/50">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-4 tracking-tight">
              That is where SAKSHAM comes in.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Saksham is our step towards making business decision-making simpler and more accessible for rural entrepreneurs. By bringing together market research, local data, business insights, and financial feasibility into one platform, we aim to reduce the uncertainty and effort involved in turning an idea into a practical business opportunity.
            </p>
          </div>

          {/* The Vision & Sign-off Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
            {/* Subtle decorative background gradient */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-widest mb-6">Our Vision</h3>
              <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed mb-10 text-balance">
                Help rural entrepreneurs make better-informed decisions, discover opportunities around them, and build businesses with greater confidence.
              </p>
              
              <div className="space-y-6 text-base sm:text-lg text-slate-300 font-medium leading-relaxed mb-12">
                <p>
                  Saksham is not just an application we built for a competition. It represents our belief that with the right information and the right tools, local knowledge and hard work can become sustainable opportunities.
                </p>
                <p>
                  We hope Saksham can play even a small role in empowering the people who keep our communities moving forward — one idea, one entrepreneur, and one business at a time.
                </p>
              </div>
              
              {/* Sign-off */}
              <div className="border-t border-slate-700/50 pt-8">
                <p className="font-semibold text-slate-400 mb-2">With hope and determination,</p>
                <p className="text-white font-black tracking-tight text-2xl sm:text-3xl mb-6">Team Saksham</p>
                
                {/* Team Roster */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:text-base font-medium text-emerald-100/70">
                  <span className="text-white">Neha Malhotra</span>
                  <span className="text-emerald-500/50">•</span>
                  <span className="text-white">Jhalak Mittal</span>
                  <span className="text-emerald-500/50">•</span>
                  <span className="text-white">Reshmi Yadav</span>
                  <span className="text-emerald-500/50">•</span>
                  <span className="text-white">Sachin Gola</span>
                  <span className="text-emerald-500/50">•</span>
                  <span className="text-white">Dushyant Sharma</span>
                  <span className="text-emerald-500/50">•</span>
                  <span className="text-white">Divynash</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <LandingFooter />
    </div>
  );
}
