// components/screens/Report.tsx
// Master Feasibility Dashboard screen containing the 5 sub-tabs matching mockups.

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { getReportById, type DetailedReport, type AssessmentStatus } from '@/data/reportsData';
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
  const report: DetailedReport = getReportById(reportId);

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
