// components/landing/LandingNavbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

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

export function LandingNavbar(): React.JSX.Element {
  const [selectedLang, setSelectedLang] = useState<string>('English');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleSelect(label: string): void {
    setSelectedLang(label.split(' ')[0]);
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
          aria-label="SAKSHAM Home"
        >
          <span className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            SAKSHAM
          </span>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Language selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-label="Select language"
              className={cn(
                'flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs',
                'hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
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
              'rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs',
              'hover:bg-slate-50 hover:border-slate-300 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
            )}
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
