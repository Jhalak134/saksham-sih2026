// components/layout/Header.tsx
'use client';

import { MapPin, IndianRupee, ChevronDown, Search, Menu, Home } from 'lucide-react';
import Link from 'next/link';
import { useShell } from '@/lib/shell-context';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';

// ─── Location chip ────────────────────────────────────────────────────────────

interface LocationChipProps {
  location: string;
}

function LocationChip({ location }: LocationChipProps): React.JSX.Element {
  return (
    <button
      className={cn(
        'flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white',
        'px-3.5 py-2 text-sm font-semibold text-slate-900',
        'hover:bg-slate-50 transition-colors shadow-2xs',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
      )}
      aria-label={`Current location: ${location}. Click to change.`}
    >
      <MapPin size={15} strokeWidth={2} className="text-slate-600" aria-hidden="true" />
      <span>{location}</span>
      <ChevronDown size={14} strokeWidth={2} className="text-slate-500" aria-hidden="true" />
    </button>
  );
}

// ─── Capital chip ─────────────────────────────────────────────────────────────

interface CapitalChipProps {
  capital: number;
}

function CapitalChip({ capital }: CapitalChipProps): React.JSX.Element {
  return (
    <Link
      href="/profile"
      className={cn(
        'flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white',
        'px-3.5 py-2 text-sm font-semibold text-slate-900',
        'hover:bg-slate-50 transition-colors shadow-2xs',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
      )}
      aria-label={`Capital: ${formatCurrency(capital)}. Click to update in Profile.`}
    >
      <IndianRupee size={14} strokeWidth={2.25} className="text-slate-600" aria-hidden="true" />
      <span>{formatCurrency(capital)}</span>
      <ChevronDown size={14} strokeWidth={2} className="text-slate-500" aria-hidden="true" />
    </Link>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar(): React.JSX.Element {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2 shadow-2xs">
      <Search
        size={16}
        strokeWidth={2}
        className="shrink-0 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder="Ask SAKSHAM anything..."
        className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        aria-label="Ask SAKSHAM a question"
      />
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header(): React.JSX.Element {
  const { browsingLocation, capital, openDrawer } = useShell();

  return (
    <header
      className="sticky top-0 z-[var(--z-header)] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 sm:px-6 md:px-8"
      style={{ height: '64px' }}
    >
      {/* Mobile: hamburger (hidden on desktop) */}
      <IconButton
        label="Open navigation menu"
        className="md:hidden"
        onClick={openDrawer}
      >
        <Menu size={20} strokeWidth={1.75} />
      </IconButton>

      {/* Mobile: wordmark (hidden on desktop) */}
      <span className="text-sm font-bold tracking-tight text-slate-900 md:hidden">
        SAKSHAM
      </span>

      {/* Desktop: chips + search */}
      <div className="hidden md:flex flex-1 items-center gap-3.5">
        <LocationChip location={browsingLocation} />
        <CapitalChip capital={capital} />
        <SearchBar />
      </div>

      {/* Mobile: chips (compact, right-aligned) */}
      <div className="flex items-center gap-2 md:hidden">
        <LocationChip location={browsingLocation} />
      </div>

      {/* Home link button */}
      <Link
        href="/discover"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label="Navigate to Home / Discover"
      >
        <Home size={19} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </header>
  );
}
