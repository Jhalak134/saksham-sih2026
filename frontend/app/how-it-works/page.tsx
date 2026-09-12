import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { HowItWorksFlow } from '@/components/landing/HowItWorksFlow';

export default function HowItWorksPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-amber-100 selection:text-slate-900">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Page Content */}
      <main className="flex-1 flex flex-col pt-8">
        <HowItWorksFlow />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
