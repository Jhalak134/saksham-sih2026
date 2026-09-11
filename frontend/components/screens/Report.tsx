// components/screens/Report.tsx
// Master Feasibility Dashboard screen containing the 5 sub-tabs matching mockups.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { getReportById, type DetailedReport, type AssessmentStatus } from '@/data/reportsData';
import { getAssessmentById, mapBackendResponseToDetailedReport } from '@/lib/api-client';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { MarketTab } from '@/components/dashboard/MarketTab';
import { FinancialsTab } from '@/components/dashboard/FinancialsTab';
import { SchemesTab } from '@/components/dashboard/SchemesTab';
import { NextStepsTab } from '@/components/dashboard/NextStepsTab';
import { cn } from '@/lib/cn';

export type DashboardSubTab = 'Dashboard' | 'Market' | 'Financials' | 'Schemes' | 'Next Steps';

const SUB_TABS: readonly DashboardSubTab[] = [
  'Dashboard',
  'Market',
  'Financials',
  'Schemes',
  'Next Steps',
];

interface ReportScreenProps {
  readonly reportId?: string;
}

function StatusBadge({ status }: { status: AssessmentStatus }): React.JSX.Element {
  const styles: Record<AssessmentStatus, string> = {
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
    Saved: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

export function ReportScreen({ reportId = 'assess_001' }: ReportScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DashboardSubTab>('Dashboard');
  const isMockId = reportId.startsWith('assess_');
  const [liveReport, setLiveReport] = useState<DetailedReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!isMockId);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isMockId) {
      setLiveReport(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    getAssessmentById(reportId)
      .then((backendData) => {
        if (!isMounted) return;
        const mapped = mapBackendResponseToDetailedReport(backendData);
        setLiveReport(mapped);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load report from server.';
        setLoadError(msg);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reportId, isMockId]);

  if (isLoading) {
    return (
      <div className="min-h-full w-full bg-[#F8FAFC]/60 px-4 py-16 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading assessment #{reportId}...</p>
        </div>
      </div>
    );
  }

  if (loadError && !liveReport) {
    return (
      <div className="min-h-full w-full bg-[#F8FAFC]/60 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3 text-lg font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900">Failed to load report</h2>
          <p className="mt-1 text-xs text-slate-500">{loadError}</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/reports"
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Reports
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setLoadError(null);
                getAssessmentById(reportId)
                  .then((backendData) => {
                    setLiveReport(mapBackendResponseToDetailedReport(backendData));
                    setIsLoading(false);
                  })
                  .catch((err: unknown) => {
                    setLoadError(err instanceof Error ? err.message : 'Failed to reload report.');
                    setIsLoading(false);
                  });
              }}
              className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-500 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const report: DetailedReport = liveReport || getReportById(reportId);

  return (
    <div className="min-h-full w-full bg-[#F8FAFC]/60 px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Back Link */}
        <div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to My Reports</span>
          </Link>
        </div>

        {/* Dashboard Title & Meta Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              {report.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {report.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                {report.date}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report.isLiveBackend && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Backend
              </span>
            )}
            <StatusBadge status={report.status} />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              Fit: {report.fitScore}/100
            </span>
          </div>
        </div>

        {/* Horizontal Sub-Tab Strip (strictly horizontal on both viewports per responsive rules) */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1 text-xs">
          {SUB_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'whitespace-nowrap px-3.5 py-2 font-semibold transition-all border-b-2 -mb-1',
                  isActive
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Sub-Tab Content */}
        <div>
          {activeTab === 'Dashboard' && (
            <DashboardTab
              report={report}
              onNavigateFinancials={() => setActiveTab('Financials')}
            />
          )}
          {activeTab === 'Market' && <MarketTab report={report} />}
          {activeTab === 'Financials' && <FinancialsTab report={report} />}
          {activeTab === 'Schemes' && <SchemesTab report={report} />}
          {activeTab === 'Next Steps' && <NextStepsTab report={report} />}
        </div>
      </div>
    </div>
  );
}
