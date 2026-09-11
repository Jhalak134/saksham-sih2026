// app/(shell)/assessment/completed/page.tsx
import React, { Suspense } from 'react';
import { AssessmentCompleted } from '@/components/assessment/AssessmentCompleted';

export default function AssessmentCompletedPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-4 sm:py-6 lg:py-8">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-slate-500">
            Loading assessment details...
          </div>
        }
      >
        <AssessmentCompleted />
      </Suspense>
    </div>
  );
}
