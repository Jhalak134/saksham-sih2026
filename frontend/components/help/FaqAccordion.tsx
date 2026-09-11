// components/help/FaqAccordion.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_DATA, type FaqItem } from './faq-data';
import { cn } from '@/lib/cn';

const INITIAL_VISIBLE_COUNT = 5;

export function FaqAccordion(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [showAllMobile, setShowAllMobile] = useState(false);

  function toggleItem(id: string): void {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const totalCount = filteredItems.length;
  const hiddenOnMobileCount = Math.max(0, totalCount - INITIAL_VISIBLE_COUNT);

  return (
    <section
      aria-labelledby="faq-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      {/* Header with Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800"
            aria-hidden="true"
          >
            <BookOpen size={20} strokeWidth={2} />
          </div>
          <div>
            <h2
              id="faq-heading"
              className="text-sm sm:text-base font-bold text-slate-900"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Find answers to common questions about SAKSHAM.
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            aria-label="Search questions"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all shadow-2xs"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Zero results */}
      {filteredItems.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">No questions found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search terms or contact us below.
          </p>
        </div>
      )}

      {/* FAQ Accordion List */}
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white overflow-hidden">
        {filteredItems.map((item, index) => {
          const isOpen = openIds.has(item.id);
          const isHiddenOnMobile =
            !isSearching && !showAllMobile && index >= INITIAL_VISIBLE_COUNT;

          return (
            <div
              key={item.id}
              className={cn(
                'transition-colors',
                isHiddenOnMobile && 'hidden md:block'
              )}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-ans-${item.id}`}
                className="flex w-full items-center justify-between gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                    {item.number}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {item.question}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    'shrink-0 text-slate-400 transition-transform duration-200',
                    isOpen && 'rotate-180 text-slate-700'
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  id={`faq-ans-${item.id}`}
                  className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 pl-13 sm:pl-14 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more toggle button for mobile */}
      {!isSearching && hiddenOnMobileCount > 0 && (
        <div className="mt-4 flex justify-center md:hidden">
          <button
            type="button"
            onClick={() => setShowAllMobile((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {showAllMobile ? (
              <>
                <span>Show fewer questions</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Show {hiddenOnMobileCount} more questions</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
