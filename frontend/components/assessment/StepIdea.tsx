// components/assessment/StepIdea.tsx
'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

const MIN_CHARS = 10;
const MAX_CHARS = 300;

interface StepIdeaProps {
  value: string;
  onChange: (val: string) => void;
  onContinue: () => void;
  onSkip?: () => void;
}

// ─── Custom Icons matching the design ─────────────────────────────────────────

function CowIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <path d="M19 12V8a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4" />
      <path d="M3 13a2 2 0 0 0 2 2h1v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1z" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function SewingIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19h16" />
      <path d="M6 19V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3" />
      <circle cx="16" cy="14" r="2" />
      <path d="M10 8h.01" />
      <path d="M10 12h.01" />
      <path d="M10 19v-3" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m2 7 3.5-4h13L22 7" />
      <path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
      <path d="M2 7h20" />
      <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
      <path d="M6 7v3a2 2 0 0 0 4 0V7" />
      <path d="M14 7v3a2 2 0 0 0 4 0V7" />
    </svg>
  );
}

function SackIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4a3 3 0 0 1 6 0c0 1.5-1 2.5-1 3.5h-4c0-1-1-2-1-3.5Z" />
      <path d="M7.5 7.5C5 9 4.5 12.5 4.5 17a3.5 3.5 0 0 0 3.5 3.5h8a3.5 3.5 0 0 0 3.5-3.5c0-4.5-.5-8-3-9.5" />
      <path d="M12 12v4" />
      <path d="M10 14h4" />
    </svg>
  );
}

function SproutIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 20h10" />
      <path d="M10 20c0-4 1-6 2-9" />
      <path d="M12 11c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z" />
      <path d="M12 15c-3 0-5-2-5-5 3.5 0 5 2 5 5Z" />
    </svg>
  );
}

// ─── Example Ideas ────────────────────────────────────────────────────────────

interface ExampleIdea {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXAMPLE_IDEAS: readonly ExampleIdea[] = [
  {
    id: 'dairy',
    label: 'Dairy unit',
    prompt: 'I want to start a dairy unit in my village to supply fresh milk and ghee.',
    icon: CowIcon,
  },
  {
    id: 'tailoring',
    label: 'Tailoring shop',
    prompt: 'I want to open a tailoring and boutique shop for custom stitching and alterations.',
    icon: SewingIcon,
  },
  {
    id: 'retail',
    label: 'Retail store',
    prompt: 'I want to open a retail grocery store and daily essentials shop in my village.',
    icon: StoreIcon,
  },
  {
    id: 'food',
    label: 'Food processing',
    prompt: 'I want to set up a small-scale food processing and packaging unit for local produce.',
    icon: SackIcon,
  },
  {
    id: 'agri',
    label: 'Agri services',
    prompt: 'I want to provide agricultural equipment and farm input services to local farmers.',
    icon: SproutIcon,
  },
];

// ─── StepIdea Component ───────────────────────────────────────────────────────

export function StepIdea({
  value,
  onChange,
  onContinue,
  onSkip,
}: StepIdeaProps): React.JSX.Element {
  const trimmedLength = value.trim().length;
  const canProceed = trimmedLength >= MIN_CHARS;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    if (e.target.value.length <= MAX_CHARS) {
      onChange(e.target.value);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canProceed) {
      onContinue();
    }
  }

  return (
    <div className="flex flex-col">
      {/* Title & Subtitle */}
      <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-dark)] sm:text-2xl">
        Tell us about your business idea
      </h2>
      <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
        Describe it in plain language — no technical terms needed.
      </p>

      {/* Textarea container */}
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-3 sm:p-4 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-all">
        <textarea
          id="idea-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={5}
          placeholder="e.g. I want to start a dairy unit in my village..."
          className="w-full resize-none bg-transparent text-sm text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)] focus:outline-none sm:text-base leading-relaxed"
          aria-label="Describe your business idea"
        />
        <div className="flex justify-between items-center pt-2 text-xs text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Ctrl+Enter to continue</span>
          <span className="ml-auto font-mono text-[11px] sm:text-xs">
            {value.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Examples Suggestions */}
      <div className="mt-6 flex flex-col gap-2.5">
        <p className="text-xs font-semibold text-[var(--color-text-dark)] sm:text-sm">
          Not sure where to start? Try an example:
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {EXAMPLE_IDEAS.map((ex) => {
            const Icon = ex.icon;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => onChange(ex.prompt)}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-dark)] shadow-xs transition-all hover:border-gray-300 hover:bg-[var(--color-surface)] active:scale-[0.98] sm:px-3.5 sm:text-sm cursor-pointer"
              >
                <Icon className="shrink-0 text-[var(--color-text-dark)]" />
                <span>{ex.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Skip Link */}
      {onSkip && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-[var(--color-accent-blue)] hover:underline sm:text-sm cursor-pointer"
          >
            Skip — I&apos;ll pick a category manually
          </button>
        </div>
      )}

      {/* Primary CTA & Helper Note */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canProceed}
          className={cn(
            'flex w-full sm:w-auto min-w-[240px] sm:min-w-[280px] items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold sm:text-base transition-all shadow-xs',
            canProceed
              ? 'bg-[var(--color-primary)] text-[var(--color-text-dark)] hover:bg-[var(--color-primary-dark)] active:scale-[0.99] cursor-pointer'
              : 'bg-[#F5C842]/50 text-[var(--color-text-muted)] cursor-not-allowed opacity-60'
          )}
          aria-disabled={!canProceed}
        >
          <span>Continue</span>
          <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
        </button>
        {!canProceed && (
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            Enter at least {MIN_CHARS} characters to continue.
          </p>
        )}
      </div>
    </div>
  );
}
