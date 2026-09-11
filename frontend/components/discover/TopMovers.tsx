// components/discover/TopMovers.tsx
// High fidelity Top Movers ticker row matching the approved mockup.

import { TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sparkline } from './Sparkline';
import { getCategoryIcon } from './CategoryIcons';
import type { TopMover } from '@/lib/discover-types';

interface MoverCardProps {
  readonly mover: TopMover;
}

function getStatusPillClass(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('high') || lower.includes('demand')) {
    return 'bg-[#E0F2FE] text-[#0369A1]';
  }
  if (lower.includes('grow') || lower.includes('emerging') || lower.includes('opportunity')) {
    return 'bg-[#E0F2FE] text-[#0369A1]';
  }
  return 'bg-slate-100 text-slate-600';
}

function MoverCard({ mover }: MoverCardProps): React.JSX.Element {
  const isUp = mover.direction === 'up';
  const isDown = mover.direction === 'down';

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      {/* Top Row: Category Title + Trend % */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
          {mover.category}
        </span>
        <span
          className={cn(
            'flex items-center text-xs font-bold whitespace-nowrap',
            isUp && 'text-[#2563EB]',
            isDown && 'text-slate-700',
            !isUp && !isDown && 'text-slate-500'
          )}
        >
          {isUp && <span className="mr-0.5 text-[10px]">▲</span>}
          {isDown && <span className="mr-0.5 text-[10px]">▼</span>}
          {!isUp && !isDown && <Minus size={10} className="mr-0.5" />}
          {Math.abs(mover.trendPercent)}%
        </span>
      </div>

      {/* Middle: Category Icon + Smooth Sparkline Wave */}
      <div className="my-3 flex items-center justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-800">
          {getCategoryIcon(mover.category, 26, 'text-slate-800')}
        </div>
        <div className="flex flex-1 justify-end">
          <Sparkline
            values={mover.sparkline}
            direction={mover.direction}
            width={76}
            height={30}
            fill={true}
          />
        </div>
      </div>

      {/* Bottom: Status Pill */}
      <div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-medium tracking-tight',
            getStatusPillClass(mover.label)
          )}
        >
          {mover.label}
        </span>
      </div>
    </div>
  );
}

interface TopMoversProps {
  readonly movers: readonly TopMover[];
  readonly scope: string;
  readonly onSeeAll?: () => void;
}

export function TopMovers({ movers, scope, onSeeAll }: TopMoversProps): React.JSX.Element {
  return (
    <section aria-label="Top movers" className="w-full">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <TrendingUp size={19} strokeWidth={2.25} className="text-slate-800" aria-hidden="true" />
          <span>Top Movers · {scope}</span>
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
          >
            See all
            <span className="text-xs">→</span>
          </button>
        )}
      </div>

      {/* 5-Column Grid on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {movers.slice(0, 5).map((mover) => (
          <MoverCard key={mover.category} mover={mover} />
        ))}
      </div>
    </section>
  );
}
