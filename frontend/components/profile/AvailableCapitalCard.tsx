// components/profile/AvailableCapitalCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface AvailableCapitalCardProps {
  initialCapital: number;
  onSave: (capital: number) => void;
}

const MIN_CAPITAL = 0;
const MAX_CAPITAL = 100_000_000;

function parseRawAmount(val: string): number {
  const digits = val.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  if (num > MAX_CAPITAL) return MAX_CAPITAL;
  return num;
}

function formatRupees(amount: number): string {
  return `₹ ${new Intl.NumberFormat('en-IN').format(amount)}`;
}

export function AvailableCapitalCard({
  initialCapital,
  onSave,
}: AvailableCapitalCardProps): React.JSX.Element {
  const [capital, setCapital] = useState<number>(initialCapital);
  const [displayValue, setDisplayValue] = useState<string>(
    formatRupees(initialCapital)
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCapital(initialCapital);
    setDisplayValue(formatRupees(initialCapital));
  }, [initialCapital]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const raw = e.target.value;
    const parsed = parseRawAmount(raw);
    setCapital(parsed);
    setDisplayValue(formatRupees(parsed));
  }

  function handleSave(): void {
    onSave(capital);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800"
              aria-hidden="true"
            >
              <IndianRupee size={20} strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Available Capital
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                The amount you can invest in your business.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            aria-label="Save available capital"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FACC15] px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-slate-900 transition-colors hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-2xs"
          >
            {saved ? (
              <>
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>

        {/* Input box */}
        <div className="mt-1">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <input
              type="text"
              id="available-capital-input"
              value={displayValue}
              onChange={handleChange}
              placeholder="₹ 50,000"
              aria-label="Available capital amount in rupees"
              className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Enter a valid amount (e.g. 50000).
          </p>
        </div>
      </div>
    </div>
  );
}
