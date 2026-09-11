// components/settings/DataPrivacyCard.tsx
'use client';

import React, { useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { ClearDataModal } from './ClearDataModal';

interface DataPrivacyCardProps {
  onClearData: () => void;
}

export function DataPrivacyCard({
  onClearData,
}: DataPrivacyCardProps): React.JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);

  function handleConfirmClear(): void {
    setModalOpen(false);
    onClearData();
  }

  return (
    <section
      aria-labelledby="data-privacy-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800"
          aria-hidden="true"
        >
          <Database size={20} strokeWidth={2} />
        </div>
        <div>
          <h2
            id="data-privacy-heading"
            className="text-sm sm:text-base font-bold text-slate-900"
          >
            Data & Privacy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your app data.
          </p>
        </div>
      </div>

      {/* Clear Local Data Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100/70 text-red-600 mt-0.5"
            aria-hidden="true"
          >
            <Trash2 size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
              Clear local data
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              This will remove all your saved preferences, bookmarked categories and assessment data from this device.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="self-end sm:self-center shrink-0 rounded-xl border border-red-200 bg-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Clear data
        </button>
      </div>

      <ClearDataModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmClear}
      />
    </section>
  );
}
