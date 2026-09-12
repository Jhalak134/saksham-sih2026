// components/discover/StateArticles.tsx
'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Pause, Play } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { cn } from '@/lib/cn';
import type { ArticleItem } from '@/app/api/articles/route';

interface StateArticlesProps {
  /** Explicit selected state from parent component or map, if provided */
  readonly selectedState?: string | null;
  /** Optional custom class */
  readonly className?: string;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function StateArticles({
  selectedState,
  className,
}: StateArticlesProps): React.JSX.Element {
  let browsingLocation: string | undefined;
  try {
    const shell = useShell();
    browsingLocation = shell?.browsingLocation;
  } catch {
    browsingLocation = undefined;
  }

  // Resolve active state name
  const rawState =
    selectedState !== undefined
      ? selectedState
      : browsingLocation?.includes(',')
        ? browsingLocation.split(',').pop()?.trim()
        : browsingLocation;

  const activeState = rawState && rawState.trim().length > 0 ? rawState.trim() : 'India';

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchArticles() {
      setLoading(true);
      setError(false);
      setCurrentIndex(0);

      try {
        const response = await fetch(
          `/api/articles?state=${encodeURIComponent(activeState)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.statusText}`);
        }
        const data = await response.json();
        if (!isCancelled) {
          if (Array.isArray(data)) {
            setArticles(data);
          } else if (data && Array.isArray(data.articles)) {
            setArticles(data.articles);
          } else {
            setArticles([]);
          }
        }
      } catch (err) {
        console.error('Error loading state articles:', err);
        if (!isCancelled) {
          setError(true);
          setArticles([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchArticles();

    return () => {
      isCancelled = true;
    };
  }, [activeState]);

  // Auto-slide every 3 seconds (pauses only if explicitly paused by user toggle)
  useEffect(() => {
    if (articles.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [articles.length, isPaused]);

  const handlePrev = () => {
    if (articles.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const handleNext = () => {
    if (articles.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  const currentArticle = articles[currentIndex];

  return (
    <div className={cn('flex h-full w-full flex-col justify-between', className)}>
      {/* Header with Title + Slide Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#2E6FF2]">
            <Newspaper size={16} />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
              News · {activeState}
            </h3>
            <span className="text-[10.5px] text-slate-500">
              Live business & MSME updates
            </span>
          </div>
        </div>

        {/* Slide Controls & Progress Counter */}
        {!loading && articles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              {currentIndex + 1} / {articles.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Resume auto slide' : 'Pause auto slide'}
                title={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg border text-slate-600 shadow-xs active:scale-95 transition-all cursor-pointer',
                  isPaused
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                )}
              >
                {isPaused ? <Play size={13} className="fill-current" /> : <Pause size={13} className="fill-current" />}
              </button>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous article"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next article"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-1 flex-col justify-between rounded-xl border border-slate-100 bg-white overflow-hidden animate-pulse min-h-[320px]">
          <div className="h-44 sm:h-48 w-full bg-slate-200" />
          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-5/6 bg-slate-200 rounded mt-2.5" />
              <div className="h-3 w-full bg-slate-100 rounded mt-2" />
            </div>
            <div className="h-3 w-20 bg-slate-200 rounded mt-2.5" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center min-h-[320px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-2">
            <Newspaper size={20} />
          </div>
          <p className="text-xs md:text-sm font-bold text-slate-800">
            {error ? 'Unable to load news at this moment' : 'No recent articles found'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
            {error
              ? 'Please check your connection and try refreshing.'
              : `There are currently no featured MSME articles for ${activeState}.`}
          </p>
          {error && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(false);
                fetch(`/api/articles?state=${encodeURIComponent(activeState)}`)
                  .then((res) => res.json())
                  .then((data) => setArticles(Array.isArray(data) ? data : []))
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Single Slideable Article Card with visual transitions */}
      {!loading && currentArticle && (
        <div className="flex flex-1 flex-col justify-between rounded-xl border border-slate-100 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-all">
          <div
            key={currentArticle.link || currentIndex}
            className="flex flex-1 flex-col justify-between transition-opacity duration-300 ease-in-out"
          >
            <a
              href={currentArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-1 flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6FF2]"
            >
              {/* 1. Article Image Thumbnail */}
              <div className="relative h-44 sm:h-48 md:h-52 w-full bg-slate-100 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    currentArticle.imageUrl ||
                    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={currentArticle.title}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.dataset.failed) return;
                    e.currentTarget.dataset.failed = 'true';
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {/* Visual animated 3s slide progress bar */}
                {!isPaused && articles.length > 1 && (
                  <div
                    key={`bar-${currentIndex}`}
                    className="absolute bottom-0 left-0 h-1 bg-[#2E6FF2]/80 animate-[progress_3s_linear]"
                    style={{
                      animation: 'shrinkProgress 3000ms linear infinite',
                    }}
                  />
                )}
              </div>

              {/* 2. Content Body */}
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-4.5">
                <div>
                  {/* Meta Row: Source on Left + Date on Right */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="font-bold text-[#2E6FF2] truncate max-w-[200px]">
                      {currentArticle.source}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {formatDate(currentArticle.publishedAt)}
                    </span>
                  </div>

                  {/* Bold Headline Title */}
                  <h4 className="mt-2 text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#2E6FF2] transition-colors">
                    {currentArticle.title}
                  </h4>

                  {/* Snippet / Description */}
                  {currentArticle.snippet && (
                    <p className="mt-1.5 text-xs sm:text-[12.5px] text-slate-600 line-clamp-2 leading-relaxed">
                      {currentArticle.snippet}
                    </p>
                  )}
                </div>

                {/* 3. Read More Link */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs sm:text-[13px] font-bold text-[#2E6FF2] group-hover:underline">
                    <span>Read more</span>
                    <span className="text-xs">→</span>
                  </span>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-[#2E6FF2] transition-colors" />
                </div>
              </div>
            </a>
          </div>

          {/* Slide Indicator Dots */}
          {articles.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2 border-t border-slate-50 bg-slate-50/40">
              {articles.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all cursor-pointer',
                    idx === currentIndex
                      ? 'w-5 bg-[#2E6FF2]'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
