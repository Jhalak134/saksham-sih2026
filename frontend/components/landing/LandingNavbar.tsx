// components/landing/LandingNavbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isAuthenticated } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  isHome?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '/', isHome: true },
  { label: 'About Us', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
] as const;

export function LandingNavbar(): React.JSX.Element {
  const router = useRouter();

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if ((href === '/discover' || href === '/new-assessment') && !isAuthenticated()) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 bg-[#FAFAF8]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-lg group"
          aria-label="SAKSHAM Home"
        >
          <img
            src="/icon.svg"
            alt=""
            className="h-9 w-9 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#00284D] sm:text-2xl">
              SAKSH<span className="text-[#FBAC05]">AM</span>
            </span>
          </div>
        </Link>


        {/* Center: Floating Pill Navbar */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1.5 shadow-2xs backdrop-blur-sm"
        >
          {NAV_ITEMS.map((item) =>
            item.isHome ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800"
              >
                <Home size={13} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-950 hover:bg-slate-100/70"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">

          {/* Login button */}
          <Link
            href="/login"
            className={cn(
              'rounded-full border border-slate-200 bg-white px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs',
              'hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 transition-all cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600'
            )}
          >
            Log in
          </Link>

          {/* Sign up Free button */}
          <Link
            href="/login?mode=signup"
            className={cn(
              'rounded-full bg-[#167844] hover:bg-[#126438] active:bg-[#0e4e2c] text-white px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-2xs',
              'transition-all hover:shadow-xs cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600'
            )}
          >
            Sign up Free
          </Link>
        </div>
      </div>
    </header>
  );
}
