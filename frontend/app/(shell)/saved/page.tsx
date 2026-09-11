import { Bookmark } from 'lucide-react';

export default function SavedPage(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-var(--header-height))] gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Bookmark size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
      </div>
      <div>
        <p className="text-lg font-semibold text-[var(--color-text-dark)]">Saved</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Bookmarked categories and assessments.</p>
      </div>
    </div>
  );
}
