// components/landing/LandingNavbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, ChevronDown, Check, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isAuthenticated } from '@/lib/auth';

interface LanguageOption {
  code: string;
  label: string;
}

const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
] as const;

interface NavItem {
  label: string;
  href: string;
  isHome?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '/', isHome: true },
  { label: 'About Us', href: '/about' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Feasibility', href: '/#feasibility' },
  { label: 'Schemes', href: '/#schemes' },
  { label: 'Discover', href: '/discover' },
] as const;

export function LandingNavbar(): React.JSX.Element {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<string>('English');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleSelect(label: string): void {
    setSelectedLang(label.split(' ')[0]);
    setIsOpen(false);
  }

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
          {/* Language selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-label="Select language"
              className={cn(
                'flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs',
                'hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900'
              )}
            >
              <Globe size={14} className="text-slate-500 shrink-0" aria-hidden="true" />
              <span>{selectedLang}</span>
              <ChevronDown
                size={14}
                className={cn('text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                  aria-hidden="true"
                />
                <ul
                  role="listbox"
                  className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100"
                >
                  {LANGUAGES.map((lang) => {
                    const isCurrent = selectedLang === lang.label.split(' ')[0];
                    return (
                      <li
                        key={lang.code}
                        role="option"
                        aria-selected={isCurrent}
                        onClick={() => handleSelect(lang.label)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                          isCurrent && 'bg-amber-50/70 font-semibold text-amber-900'
                        )}
                      >
                        <span>{lang.label}</span>
                        {isCurrent && <Check size={14} className="text-amber-600" aria-hidden="true" />}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

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
