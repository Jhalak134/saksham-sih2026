// components/ui/LogoutModal.tsx
'use client';

import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutModalProps): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      aria-describedby="logout-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[var(--color-border)] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <LogOut size={22} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <h3
              id="logout-modal-title"
              className="text-lg font-bold text-slate-900 leading-snug"
            >
              Are you sure you want to log out?
            </h3>
            <p
              id="logout-modal-desc"
              className="mt-1.5 text-sm text-slate-500 leading-relaxed"
            >
              You will need to log in again to view your saved reports, feasibility assessments, and preferences.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto px-5 font-semibold text-slate-700"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-md font-semibold text-sm h-11 px-5 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
