import { ArrowLeftRight } from 'lucide-react';

export default function ComparePage(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-var(--header-height))] gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <ArrowLeftRight size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
      </div>
      <div>
        <p className="text-lg font-semibold text-[var(--color-text-dark)]">Compare</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Side-by-side category comparison with overlaid trend lines.</p>
      </div>
    </div>
  );
}
