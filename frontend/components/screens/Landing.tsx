// components/screens/Landing.tsx
'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { BuiltForRealitySection } from '@/components/landing/BuiltForRealitySection';
import { VideoSection } from '@/components/landing/VideoSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { MobileCommunityCard } from '@/components/landing/MobileCommunityCard';
import { LandingFooter } from '@/components/landing/LandingFooter';

export function LandingScreen(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-amber-100 selection:text-slate-900">
      {/* 1. Top Navbar */}
      <LandingNavbar />

      {/* 2. Main Page Content */}
      <main className="flex-1">
        <HeroSection />
        <BuiltForRealitySection />
        <VideoSection />
        <FaqSection />
        <MobileCommunityCard />
      </main>

      {/* 3. Footer */}
      <LandingFooter />
    </div>
  );
}
