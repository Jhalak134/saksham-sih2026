// app/(shell)/assessment/completed/page.tsx
import React, { Suspense } from 'react';
import { AssessmentCompleted } from '@/components/assessment/AssessmentCompleted';

export default function AssessmentCompletedPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-6 sm:py-8 lg:py-10 w-full">
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
