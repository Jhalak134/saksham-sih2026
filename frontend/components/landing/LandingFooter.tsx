// components/landing/LandingFooter.tsx
'use client';

import React from 'react';
import Link from 'next/link';

function YoutubeIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedinIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
    </svg>
  );
}

function XIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LandingFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-slate-200/90 bg-white py-8 sm:py-10 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: Brand + Nav Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-black tracking-tight text-[#00284D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
              aria-label="SAKSHAM Home"
            >
              <img src="/icon.svg" alt="" className="h-5 w-5 object-contain" />
              <span>
                SAKSH<span className="text-[#FBAC05]">AM</span>
              </span>
            </Link>

            <nav className="flex items-center gap-5 sm:gap-6 font-medium text-slate-600">
              <Link href="/about" className="hover:text-slate-950 transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-slate-950 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-950 transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-slate-950 transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          {/* Right: Social icons + Copyright */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-3 text-slate-400">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SAKSHAM on YouTube"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <YoutubeIcon />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SAKSHAM on LinkedIn"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <LinkedinIcon />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SAKSHAM on X"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <XIcon />
              </a>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-400">
              © 2025 SAKSHAM. Built for a more inclusive and prosperous rural India.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
