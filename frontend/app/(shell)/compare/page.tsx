// app/(shell)/compare/page.tsx
import React, { Suspense } from 'react';
import { CompareScreen } from '@/components/compare/CompareScreen';

export default function ComparePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <CompareScreen />
    </Suspense>
  );
}
