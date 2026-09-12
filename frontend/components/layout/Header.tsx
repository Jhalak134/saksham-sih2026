// components/layout/Header.tsx
// Header bar featuring the SAKSHAM AI Search & Chatbot Assistant.
// Dropdown displays only past sent messages; submitting asks the AI chatbot directly.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  X,
  Sparkles,
  Home,
  Menu,
  Clock,
  History,
  ArrowRight,
  User as UserIcon,
} from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { useAuth } from '@/lib/auth-context';
import { IconButton } from '@/components/ui/IconButton';
import { SakshamAIChatModal } from '@/components/chat/SakshamAIChatModal';
import { isQueryValid } from '@/lib/aiKnowledgeBase';
import { cn } from '@/lib/cn';

const STORAGE_KEY_PAST_MESSAGES = 'saksham_past_sent_queries';

// ─── Functional Search Bar & AI Chatbot Component ────────────────────────────

function SearchBar(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState('');
  const [pastMessages, setPastMessages] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load past sent messages from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PAST_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPastMessages(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Save new message into history
  const addPastMessage = useCallback((msg: string) => {
    const clean = msg.trim();
    if (!clean) return;
    setPastMessages((prev) => {
      const filtered = prev.filter((m) => m.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY_PAST_MESSAGES, JSON.stringify(updated));
      } catch {
        // Ignore storage write errors
      }
      return updated;
    });
  }, []);

  const clearPastMessages = useCallback(() => {
    setPastMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY_PAST_MESSAGES);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const removePastMessage = useCallback((msgToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPastMessages((prev) => {
      const updated = prev.filter((m) => m !== msgToRemove);
      try {
        localStorage.setItem(STORAGE_KEY_PAST_MESSAGES, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAskAI = useCallback((queryText: string) => {
    const clean = queryText.trim();
    if (clean && isQueryValid(clean).isValid) {
      addPastMessage(clean);
    }
    setIsOpen(false);
    setChatInitialQuery(clean);
    setIsAIChatOpen(true);
  }, [addPastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    handleAskAI(query);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={containerRef} className="relative flex-1 w-full max-w-2xl">
        <form
          role="search"
          onSubmit={handleSubmit}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 transition-all shadow-2xs',
            isOpen
              ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
              : 'border-slate-200/90 hover:border-slate-300'
          )}
        >
          <Search
            size={16}
            strokeWidth={2.2}
            className="shrink-0 text-slate-400"
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            placeholder="Ask SAKSHAM anything... (e.g. Dairy, Grocery, Mathura, PMFME)"
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-label="Ask SAKSHAM a question"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
          />

          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}

          {/* AI Chatbot Launcher Button */}
          <button
            type="button"
            onClick={() => handleAskAI(query)}
            aria-label="Ask SAKSHAM AI"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 sm:px-3 py-1 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Sparkles size={12} strokeWidth={2.2} className="text-emerald-200" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        {/* Dropdown displaying ONLY Past Sent Messages */}
        {isOpen && (
          <div
            role="listbox"
            aria-label="Past sent messages"
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1"
          >
            {pastMessages.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <History size={12} className="text-slate-500" />
                    <span>Past Sent Messages</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearPastMessages}
                    aria-label="Clear all past messages"
                    className="text-[10.5px] font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                <div className="mt-1 space-y-0.5">
                  {pastMessages.map((msg, index) => (
                    <div
                      key={`${msg}-${index}`}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleAskAI(msg)}
                      className="group flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                          <Clock size={13} />
                        </div>
                        <span className="text-xs font-medium text-slate-800 truncate group-hover:text-emerald-900 transition-colors">
                          {msg}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => removePastMessage(msg, e)}
                          aria-label={`Remove "${msg}"`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-slate-600 rounded transition-all cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                        <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                <div className="flex justify-center mb-1 text-slate-400">
                  <History size={16} />
                </div>
                <p className="font-medium text-slate-700">No past sent messages</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Type your question and press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono">Enter</kbd> to ask SAKSHAM AI.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SAKSHAM Conversational AI Assistant Modal */}
      <SakshamAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        initialQuery={chatInitialQuery}
      />
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header(): React.JSX.Element {
  const { openDrawer } = useShell();
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isDiscoverPage = pathname === '/discover';

  return (
    <header
      className="sticky top-0 z-[var(--z-header)] flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 sm:px-6 md:px-8"
      style={{ height: '64px' }}
    >
      {/* Left: Mobile menu toggle + Wordmark */}
      <div className="flex items-center gap-2.5">
        <IconButton
          label="Open navigation menu"
          className="md:hidden"
          onClick={openDrawer}
        >
          <Menu size={20} strokeWidth={1.75} />
        </IconButton>

        <Link
          href="/discover"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          aria-label="SAKSHAM Discover"
        >
          <img
            src="/icon.svg"
            alt=""
            className="h-7 w-7 object-contain"
          />
          <span className="text-base font-bold tracking-tight text-[#00284D]">
            SAKSH<span className="text-[#FBAC05]">AM</span>
          </span>
        </Link>
      </div>

      {/* Center: Search & AI Chatbot Bar (Hidden on /discover per user request) */}
      <div className="flex flex-1 items-center justify-center px-2 md:px-6">
        {!isDiscoverPage && <SearchBar />}
      </div>


      {/* Right: Auth indicator & Home link */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            aria-label={`Signed in as ${user.phone_or_email}. View Profile.`}
          >
            <UserIcon size={13} className="text-emerald-700 shrink-0" aria-hidden="true" />
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

        <Link
          href="/discover"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="Navigate to Home / Discover"
        >
          <Home size={19} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
