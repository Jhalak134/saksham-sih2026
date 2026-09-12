// components/layout/Header.tsx
// Header bar featuring the SAKSHAM AI Search & Chatbot Assistant.
// Connected deeply with the ai/ knowledge base, Census 2011 demographics, and SIH #91 architecture.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Home,
  Menu,
  Briefcase,
  Bot,
} from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { IconButton } from '@/components/ui/IconButton';
import { SakshamAIChatModal } from '@/components/chat/SakshamAIChatModal';
import { cn } from '@/lib/cn';

// ─── Searchable Data Items ───────────────────────────────────────────────────

interface SearchSuggestionItem {
  readonly type: 'idea' | 'location' | 'scheme';
  readonly title: string;
  readonly subtitle: string;
  readonly category?: string;
}

const SEARCH_SUGGESTIONS: readonly SearchSuggestionItem[] = [
  // Business Ideas & Categories
  {
    type: 'idea',
    title: 'Dairy & Livestock',
    subtitle: 'Milk collection, chilling, paneer, curd & sweets',
    category: 'dairy',
  },
  {
    type: 'idea',
    title: 'Retail & Kirana Store',
    subtitle: 'Daily provisions, packaged FMCG & grain retail',
    category: 'retail',
  },
  {
    type: 'idea',
    title: 'Textiles & Handloom',
    subtitle: 'Garments, school uniforms, tailoring & embroidery',
    category: 'textiles',
  },
  {
    type: 'idea',
    title: 'Agri Processing',
    subtitle: 'Mustard oil expeller, mini flour mill & dal mill',
    category: 'agri',
  },
  {
    type: 'idea',
    title: 'Food & Beverages',
    subtitle: 'Bakery rusk, roasted namkeen, snack packaging',
    category: 'food',
  },
  {
    type: 'idea',
    title: 'Handicrafts & Pottery',
    subtitle: 'Terracotta pottery, wooden carving & temple artifacts',
    category: 'handicrafts',
  },
  {
    type: 'idea',
    title: 'Solar & Clean Energy',
    subtitle: 'Solar agricultural pumps, rooftop PV & repair',
    category: 'solar',
  },
  {
    type: 'idea',
    title: 'Services & Farm Repairs',
    subtitle: 'Tractor implement repair, two-wheelers & electricals',
    category: 'services',
  },

  // Locations & Clusters
  {
    type: 'location',
    title: 'Mathura, Uttar Pradesh',
    subtitle: 'Active Pilot Region (Chhata, Kamar, Nandgaon, Barsana)',
  },
  {
    type: 'location',
    title: 'Chhata, Mathura',
    subtitle: 'Dairy, grain processing & logistics cluster',
  },
  {
    type: 'location',
    title: 'Kamar, Mathura',
    subtitle: 'Commercial hub, kirana & dairy collection',
  },
  {
    type: 'location',
    title: 'Barsana, Mathura',
    subtitle: 'Tourism, religious retail & sweets packaging',
  },
  {
    type: 'location',
    title: 'Uttar Pradesh',
    subtitle: 'State Pilot Live · 75 ODOP Districts',
  },
  {
    type: 'location',
    title: 'Maharashtra',
    subtitle: '36 ODOP Districts · Agri Processing & Retail',
  },
  {
    type: 'location',
    title: 'Rajasthan',
    subtitle: '41 ODOP Districts · Solar Energy & Handicrafts',
  },
  {
    type: 'location',
    title: 'Bihar',
    subtitle: '38 ODOP Districts · Makhana & Food Processing',
  },
  {
    type: 'location',
    title: 'Gujarat',
    subtitle: '33 ODOP Districts · Textiles & Dairy Coops',
  },

  // Key Schemes & Subsidies
  {
    type: 'scheme',
    title: 'PMFME Scheme',
    subtitle: '35% capital subsidy up to ₹10 Lakhs for micro units',
  },
  {
    type: 'scheme',
    title: 'PMEGP Scheme',
    subtitle: 'Up to 35% margin money subsidy in rural areas',
  },
  {
    type: 'scheme',
    title: 'PM Mudra Yojana',
    subtitle: 'Zero collateral credit (Shishu up to ₹50k, Kishore up to ₹5L)',
  },
  {
    type: 'scheme',
    title: 'UP State Dairy Development Subsidy',
    subtitle: 'Milch cattle acquisition & rural chilling grants',
  },
  {
    type: 'scheme',
    title: 'One District One Product (ODOP)',
    subtitle: 'State credit guarantees & artisan branding support',
  },
  {
    type: 'scheme',
    title: 'PM Vishwakarma Scheme',
    subtitle: 'Artisan toolkit grants + 5% concessional credit',
  },
];

// ─── Functional Search Bar & AI Chatbot Trigger Component ────────────────────

function SearchBar(): React.JSX.Element {
  const router = useRouter();
  const { setBrowsingLocation } = useShell();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Filter suggestions in real-time
  const trimmed = query.trim().toLowerCase();
  const filteredSuggestions = trimmed.length === 0
    ? SEARCH_SUGGESTIONS.slice(0, 7) // Curated quick start items
    : SEARCH_SUGGESTIONS.filter(
        (item) =>
          item.title.toLowerCase().includes(trimmed) ||
          item.subtitle.toLowerCase().includes(trimmed) ||
          (item.category && item.category.toLowerCase().includes(trimmed))
      );

  const handleOpenAIChat = useCallback((customQuery?: string) => {
    setIsOpen(false);
    setChatInitialQuery(customQuery !== undefined ? customQuery : query);
    setIsAIChatOpen(true);
  }, [query]);

  const handleSelect = useCallback(
    (item: SearchSuggestionItem) => {
      setIsOpen(false);
      setQuery('');

      if (item.type === 'idea') {
        const catParam = item.category ? `&category=${encodeURIComponent(item.category)}` : '';
        router.push(`/new-assessment?idea=${encodeURIComponent(item.title)}${catParam}`);
      } else if (item.type === 'location') {
        setBrowsingLocation(item.title);
        router.push('/discover');
      } else if (item.type === 'scheme') {
        // Schemes can trigger deep AI explanation
        handleOpenAIChat(`Tell me about ${item.title} subsidy and eligibility guidelines`);
      }
    },
    [router, setBrowsingLocation, handleOpenAIChat]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;

    setIsOpen(false);

    // If query looks like a question or requests explanation/subsidies, launch AI chatbot
    const isQuestionOrAiIntent =
      trimmed.endsWith('?') ||
      trimmed.startsWith('how') ||
      trimmed.startsWith('what') ||
      trimmed.startsWith('why') ||
      trimmed.startsWith('where') ||
      trimmed.startsWith('tell') ||
      trimmed.startsWith('explain') ||
      trimmed.includes('subsidy') ||
      trimmed.includes('pmfme') ||
      trimmed.includes('margin') ||
      trimmed.includes('formula') ||
      trimmed.includes('scheme') ||
      trimmed.includes('census');

    if (isQuestionOrAiIntent) {
      handleOpenAIChat(query);
      return;
    }

    // Check if query matches a known location
    const matchedLoc = SEARCH_SUGGESTIONS.find(
      (s) => s.type === 'location' && s.title.toLowerCase().includes(trimmed)
    );

    if (matchedLoc) {
      setBrowsingLocation(matchedLoc.title);
      router.push('/discover');
    } else {
      // Direct to assessment for the queried business idea
      router.push(`/new-assessment?idea=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={containerRef} className="relative flex-1 w-full max-w-2xl">
        <form
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
            onClick={() => handleOpenAIChat(query)}
            aria-label="Ask SAKSHAM AI"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 sm:px-3 py-1 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Sparkles size={12} strokeWidth={2.2} className="text-emerald-200" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        {/* Interactive Autocomplete & AI Chatbot Suggestions Dropdown */}
        {isOpen && (
          <div
            role="listbox"
            aria-label="Search suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1"
          >
            {/* Ask SAKSHAM AI Conversational Banner */}
            <div
              role="option"
              aria-selected={false}
              onClick={() => handleOpenAIChat(query)}
              className="group mb-2 flex items-center justify-between gap-2.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 p-2.5 hover:from-emerald-100 hover:to-teal-100 transition-all cursor-pointer border border-emerald-300/80 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                  <Bot size={14} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-950 truncate">
                      {trimmed.length > 0 ? `Ask AI: "${query.trim()}"` : 'Chat with SAKSHAM AI Assistant'}
                    </span>
                    <span className="rounded-md bg-emerald-200/90 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-emerald-900 tracking-tight">
                      AI Chatbot
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-emerald-700 truncate">
                    Deep knowledge from ai/ reports, Census 2011 & 10% loan model
                  </span>
                </div>
              </div>
              <ArrowRight size={13} className="text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Custom Query Instant Action for Assessment (when query is typed) */}
            {trimmed.length > 0 && (
              <div
                role="option"
                aria-selected={false}
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/new-assessment?idea=${encodeURIComponent(query.trim())}`);
                }}
                className="group mb-1.5 flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 p-2.5 hover:bg-slate-100/80 transition-colors cursor-pointer border border-slate-200/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white">
                    <Briefcase size={13} />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900">
                      Assess &quot;{query.trim()}&quot;
                    </span>
                    <span className="block text-[10.5px] text-slate-500 truncate">
                      Launch 4-factor feasibility evaluation
                    </span>
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            )}

            {/* Section Heading */}
            <div className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              {trimmed.length === 0 ? 'Popular Ideas, Regions & Schemes' : 'Suggestions & Matches'}
            </div>

            {/* Filtered Suggestion Items */}
            <div className="space-y-0.5">
              {filteredSuggestions.map((item) => (
                <div
                  key={`${item.type}-${item.title}`}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(item)}
                  className="group flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-slate-700',
                        item.type === 'idea' && 'bg-amber-50 border-amber-200 text-amber-800',
                        item.type === 'location' && 'bg-blue-50 border-blue-200 text-blue-800',
                        item.type === 'scheme' && 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      )}
                    >
                      {item.type === 'idea' && <Briefcase size={13} />}
                      {item.type === 'location' && <MapPin size={13} />}
                      {item.type === 'scheme' && <ShieldCheck size={13} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-tight',
                            item.type === 'idea' && 'bg-amber-100/70 text-amber-800',
                            item.type === 'location' && 'bg-blue-100/70 text-blue-800',
                            item.type === 'scheme' && 'bg-emerald-100/70 text-emerald-800'
                          )}
                        >
                          {item.type}
                        </span>
                      </div>
                      <span className="block text-[10.5px] text-slate-500 truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-300 group-hover:text-slate-600 transition-colors shrink-0">
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}

              {filteredSuggestions.length === 0 && trimmed.length > 0 && (
                <div className="p-3 text-center text-xs text-slate-500">
                  <span>No direct matches. Click &quot;Ask AI&quot; or press Enter to consult SAKSHAM AI.</span>
                </div>
              )}
            </div>
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
          className="text-sm font-bold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors"
        >
          SAKSHAM
        </Link>
      </div>

      {/* Center: Search & AI Chatbot Bar */}
      <div className="flex flex-1 items-center justify-center px-2 md:px-6">
        <SearchBar />
      </div>

      {/* Right: Home / Discover link icon */}
      <Link
        href="/discover"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label="Navigate to Home / Discover"
      >
        <Home size={19} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </header>
  );
}
