// components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import { MapPin, IndianRupee, ChevronDown, Search, Menu, Home, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useShell } from '@/lib/shell-context';
import { useAuth } from '@/lib/auth-context';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { queryAI } from '@/lib/api-client';
import type { AIQueryResponse } from '@/lib/api-types';
import { GlobalAISearchModal } from './GlobalAISearchModal';

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

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  loading: boolean;
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
}: SearchBarProps): React.JSX.Element {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2 shadow-2xs focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-colors"
    >
      {loading ? (
        <Loader2
          size={16}
          strokeWidth={2.5}
          className="shrink-0 animate-spin text-amber-600"
          aria-hidden="true"
        />
      ) : (
        <Search
          size={16}
          strokeWidth={2}
          className="shrink-0 text-slate-400"
          aria-hidden="true"
        />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask SAKSHAM anything (e.g. PMFME dairy scheme, Bera market)..."
        className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        aria-label="Ask SAKSHAM a question"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className="hidden sm:inline-flex items-center rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Ask
      </button>
    </form>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header(): React.JSX.Element {
  const { browsingLocation, capital, openDrawer, language } = useShell();
  const { user, isAuthenticated } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function executeSearch(queryText: string): Promise<void> {
    const cleanQ = queryText.trim();
    if (!cleanQ) return;

    setActiveQuery(cleanQ);
    setIsModalOpen(true);
    setLoading(true);
    setError(null);

    try {
      const langParam = language === 'hi' ? 'hi' : 'en';
      const result = await queryAI({
        query: cleanQ,
        language: langParam,
        top_k: 5,
      });
      setAiResponse(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'AI advisory query failed. Please check your connection.';
      setError(msg);
      setAiResponse(null);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenMobileSearch(): void {
    setIsModalOpen(true);
    if (!activeQuery) {
      const defaultQ = 'What dairy business opportunities are relevant around Bera?';
      setSearchInput(defaultQ);
      executeSearch(defaultQ);
    }
  }

  return (
    <>
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
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={executeSearch}
            loading={loading}
          />
        </div>

        {/* Mobile: chips & search action */}
        <div className="flex items-center gap-2 md:hidden">
          <LocationChip location={browsingLocation} />
          <button
            type="button"
            onClick={handleOpenMobileSearch}
            aria-label="Open AI Advisory Search"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Search size={16} strokeWidth={2} />
          </button>
        </div>

        {/* User Account / Auth Indicator */}
        {isAuthenticated && user ? (
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            aria-label={`Signed in as ${user.phone_or_email}. View Profile.`}
          >
            <User size={13} className="text-emerald-700 shrink-0" aria-hidden="true" />
            <span className="max-w-[100px] truncate hidden sm:inline">{user.phone_or_email}</span>
            <span className="sm:hidden">Account</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            aria-label="Sign in or register"
          >
            <span>Sign In</span>
          </Link>
        )}

        {/* Home link button */}
        <Link
          href="/discover"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Navigate to Home / Discover"
        >
          <Home size={19} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </header>

      {/* Grounded AI Search Modal */}
      <GlobalAISearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        query={activeQuery}
        response={aiResponse}
        loading={loading}
        error={error}
        onRetry={() => executeSearch(activeQuery)}
      />
    </>
  );
}
