// components/assessment/StepDetails.tsx
'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CATEGORIES, type Category } from '@/lib/constants';
import { CategoryIcon } from './CategoryIcon';

// ─── Category tile ────────────────────────────────────────────────────────────

interface CategoryTileProps {
  category: Category;
  selected: boolean;
  suggested: boolean;
  onSelect: (c: Category) => void;
}

function CategoryTile({
  category,
  selected,
  suggested,
  onSelect,
}: CategoryTileProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col items-center gap-1.5 sm:gap-2 rounded-xl border p-2 sm:p-3 text-xs font-medium transition-colors',
        'min-h-[64px] sm:min-h-[auto]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        selected
          ? 'border-[var(--color-primary)] bg-[#FEF3C7] text-[var(--color-text-dark)]'
          : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)]'
      )}
    >
      <CategoryIcon
        category={category}
        size={20}
        className={selected ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-muted)]'}
      />
      <span className="text-center text-[10px] sm:text-xs leading-tight">{category}</span>
      {suggested && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-text-dark)]">
          Suggested
        </span>
      )}
    </button>
  );
}

// ─── Capital input ────────────────────────────────────────────────────────────

interface CapitalInputProps {
  value: number;
  onChange: (val: number) => void;
}

function CapitalInput({ value, onChange }: CapitalInputProps): React.JSX.Element {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const parsed = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    onChange(Number.isNaN(parsed) ? 0 : parsed);
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="capital-input"
        className="text-sm font-semibold text-[var(--color-text-dark)]"
      >
        Available Capital
      </label>
      <p className="text-sm text-[var(--color-text-muted)]">
        Enter the amount you can invest in this business.
      </p>
      <div className="flex items-center gap-0 rounded-lg border border-[var(--color-border)] bg-white focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-colors">
        <span className="flex items-center pl-4 pr-2 text-sm font-semibold text-[var(--color-text-muted)] select-none">
          ₹
        </span>
        <input
          id="capital-input"
          type="text"
          inputMode="numeric"
          value={value === 0 ? '' : value.toLocaleString('en-IN')}
          onChange={handleChange}
          placeholder="1,00,000"
          className="flex-1 bg-transparent py-3 pr-4 text-sm text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          aria-label="Available capital in rupees"
        />
      </div>
    </div>
  );
}

// ─── Progress hint ────────────────────────────────────────────────────────────

function progressCount(category: string, capital: number): number {
  let count = 0;
  if (category.length > 0) count += 1;
  if (capital > 0) count += 1;
  return count;
}

// ─── StepDetails ─────────────────────────────────────────────────────────────

interface StepDetailsProps {
  category: string;
  capital: number;
  /** Category inferred from Step 1 idea text (empty string = no suggestion) */
  suggestedCategory: string;
  onCategoryChange: (c: string) => void;
  onCapitalChange: (v: number) => void;
  onContinue: () => void;
}

export function StepDetails({
  category,
  capital,
  suggestedCategory,
  onCategoryChange,
  onCapitalChange,
  onContinue,
}: StepDetailsProps): React.JSX.Element {
  const filled = progressCount(category, capital);
  const canProceed = filled === 2;

  function handleSelect(c: Category): void {
    onCategoryChange(c === category ? '' : c);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category selector */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[var(--color-text-dark)]">
          Business Category
        </p>
        {suggestedCategory.length > 0 && (
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            We&apos;ve suggested a category based on your idea. You can change it.
          </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {CATEGORIES.map((cat) => (
          <CategoryTile
            key={cat}
            category={cat}
            selected={category === cat}
            suggested={suggestedCategory === cat}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Capital input */}
      <CapitalInput value={capital} onChange={onCapitalChange} />

      {/* Progress hint + CTA */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]" aria-live="polite">
          {filled} of 2 details added
        </p>
        <button
          onClick={onContinue}
          disabled={!canProceed}
          className={cn(
            'flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold',
            'transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs',
            canProceed
              ? 'bg-[var(--color-primary)] text-[var(--color-text-dark)] hover:bg-[var(--color-primary-dark)] active:scale-[0.99]'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
          )}
          aria-disabled={!canProceed}
        >
          <span>Continue</span>
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
