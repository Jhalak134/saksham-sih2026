// components/discover/CompareBar.tsx
// Comparison bar matching the mockup layout and gold-accent styling.

'use client';

import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompareBarProps {
  readonly selected: ReadonlySet<string>;
  readonly onClear: () => void;
}

export function CompareBar({ selected }: CompareBarProps): React.JSX.Element {
  const router = useRouter();

  // If nothing selected or 1 item selected, show default mockup preview
  const selectedList = selected.size >= 2 ? [...selected] : ['Dairy', 'Textiles'];
  const label = selectedList.slice(0, 2).join(' vs ');

  function handleView(): void {
    const params = selectedList.map((c) => `c=${encodeURIComponent(c)}`).join('&');
    router.push(`/compare?${params}`);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#FDE68A] bg-[#FEFCE8] p-5 shadow-xs transition-all">
      {/* Left side: Icon + Title + Subtitle */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
          <ArrowLeftRight size={22} strokeWidth={2.25} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Comparing: {label}
          </h3>
          <p className="mt-0.5 text-xs text-slate-600">
            See how these opportunities stack up in your area.
          </p>
        </div>
      </div>

      {/* Right side: Action button */}
      <button
        type="button"
        onClick={handleView}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-2.5 text-sm font-bold text-slate-950 shadow-xs transition-all hover:bg-[#D97706] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <span>View Comparison</span>
        <ArrowRight size={15} strokeWidth={2.25} />
      </button>
    </div>
  );
}
