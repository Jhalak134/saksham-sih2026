// components/layout/GlobalAISearchModal.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  FileText,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AIQueryResponse, Citation } from '@/lib/api-types';

interface GlobalAISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  response: AIQueryResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function GroundingBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'grounded') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Grounded Evidence
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200">
        🟡 Partially Grounded
      </span>
    );
  }
  if (status === 'no_match') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
        ⚪ No Knowledge-Base Match
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200">
      ⚙️ Rule-based Advisory
    </span>
  );
}

function CitationCard({ citation, index }: { citation: Citation; index: number }): React.JSX.Element {
  const isTemplate =
    Boolean(citation.is_template_data) ||
    citation.document_id === 'dairy_yogurt_plant_project_report';
  const isMathura2011 =
    citation.document_id === 'mathura_district_industrial_profile' ||
    Boolean(citation.source?.includes('mathura_district_industrial_profile'));
  const excerptText = citation.text || citation.excerpt || '';

  return (
    <div
      key={citation.chunk_id || index}
      className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 text-xs space-y-1.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="font-semibold text-slate-800">{citation.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {isTemplate && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
              ⚠️ Template / Model Estimate
            </span>
          )}
          {isMathura2011 && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
              ℹ️ Mathura Profile (2011 Historical)
            </span>
          )}
          <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 font-mono">
            p.{citation.page_start}
            {citation.page_end && citation.page_end !== citation.page_start
              ? `-${citation.page_end}`
              : ''}
          </span>
          {citation.chunk_id && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 border border-slate-200/60">
              {citation.chunk_id}
            </span>
          )}
        </div>
      </div>
      {excerptText && (
        <p className="text-[11px] text-slate-600 italic border-l-2 border-slate-300 pl-2 line-clamp-3 leading-relaxed">
          &ldquo;{excerptText}&rdquo;
        </p>
      )}
    </div>
  );
}

export function GlobalAISearchModal({
  isOpen,
  onClose,
  query,
  response,
  loading,
  error,
  onRetry,
}: GlobalAISearchModalProps): React.JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-search-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/50 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Sparkles size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 id="ai-search-title" className="text-sm font-bold text-slate-900">
                SAKSHAM AI Advisory
              </h2>
              <p className="text-[11px] text-slate-500">
                Grounded search &amp; policy evidence across Mathura pilot dataset
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User query banner */}
        <div className="border-b border-slate-100 bg-white px-5 py-2.5 text-xs text-slate-600 flex items-center gap-2">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Query:
          </span>
          <span className="font-medium text-slate-900 truncate">&ldquo;{query}&rdquo;</span>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-amber-600" />
              <p className="text-sm font-semibold text-slate-800">
                Consulting SAKSHAM Grounded Knowledge Base...
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Retrieving verified policy guidelines, PMFME scheme provisions, and Mathura district data.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-3" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-red-900">Unable to retrieve AI advisory</h3>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Retry Inquiry</span>
              </button>
            </div>
          )}

          {!loading && !error && response && (
            <div className="space-y-4">
              {/* Grounding status header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <BookOpen size={14} className="text-amber-600" />
                  <span className="font-semibold text-slate-700">Advisory Summary</span>
                </div>
                <GroundingBadge status={response.grounding_status} />
              </div>

              {/* Explanation / text */}
              <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line">
                <p>{response.explanation || response.summary || response.recommendation}</p>
              </div>

              {/* Highlights / key points */}
              {response.key_points && response.key_points.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Advisory Highlights
                  </h3>
                  <ul className="grid grid-cols-1 gap-2 text-xs text-slate-700">
                    {response.key_points.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 bg-slate-50/70 rounded-lg p-2.5 border border-slate-100"
                      >
                        <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citations / Provenance */}
              {response.citations && response.citations.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText size={13} className="text-slate-400" />
                      Retrieved Provenance &amp; Citations ({response.citations.length})
                    </h3>
                    <span className="text-[10px] text-slate-400">Zero-hallucination source verification</span>
                  </div>
                  <div className="space-y-2">
                    {response.citations.map((c, i) => (
                      <CitationCard key={c.chunk_id || i} citation={c} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations */}
              {response.limitations && response.limitations.length > 0 && (
                <div className="rounded-lg bg-amber-50/60 border border-amber-200/80 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                    <AlertTriangle size={13} className="text-amber-700" />
                    <span>Advisory Scope &amp; Limitations</span>
                  </div>
                  <ul className="list-disc list-inside text-amber-900 text-[11px] space-y-0.5 pl-1 leading-relaxed">
                    {response.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {response.warnings && response.warnings.length > 0 && (
                <div className="rounded-lg bg-red-50/60 border border-red-200/80 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-900 text-[11px] uppercase tracking-wider">
                    <AlertCircle size={13} className="text-red-700" />
                    <span>Important Guidelines &amp; Warnings</span>
                  </div>
                  <ul className="list-disc list-inside text-red-900 text-[11px] space-y-0.5 pl-1 leading-relaxed">
                    {response.warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Data provides evidence · AI explains</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
