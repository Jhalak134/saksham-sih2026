// components/screens/MyReports.tsx
// My Reports screen matching mobile & desktop mockups with responsive 2-column grid.

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Bookmark, Sparkles, Loader2 } from 'lucide-react';
import { MOCK_REPORTS, type AssessmentStatus, type ReportSummary, type ConfidenceLevel } from '@/data/reportsData';

import { fetchMyReports } from '@/lib/api-client';
import { getStorageItem } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';
import { ReportCard } from '@/components/reports/ReportCard';
import {
  ReportFilters,
  type SortOption,
  type FitFilterOption,
} from '@/components/reports/ReportFilters';
import { cn } from '@/lib/cn';

function sortReports(reports: readonly ReportSummary[], sort: SortOption): ReportSummary[] {
  const cloned = [...reports];
  if (sort === 'fit-desc') {
    return cloned.sort((a, b) => b.fitScore - a.fitScore);
  }
  if (sort === 'profit-desc') {
    return cloned.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }
  // Default: date-desc
  return cloned.sort((a, b) => b.date.localeCompare(a.date));
}

function filterReports(
  reports: readonly ReportSummary[],
  status: AssessmentStatus | 'All',
  fit: FitFilterOption
): ReportSummary[] {
  return reports.filter((r) => {
    const matchesStatus = status === 'All' || r.status === status;
    const matchesFit =
      fit === 'all' ? true : fit === 'high' ? r.fitScore >= 70 : r.fitScore < 70;
    return matchesStatus && matchesFit;
  });
}

function groupReportsByLocation(
  reports: readonly ReportSummary[]
): Record<string, ReportSummary[]> {
  const grouped: Record<string, ReportSummary[]> = {};
  for (const report of reports) {
    if (!grouped[report.location]) {
      grouped[report.location] = [];
    }
    grouped[report.location].push(report);
  }
  return grouped;
}

function resolveCategoryIcon(category: string): 'dairy' | 'mobile' | 'solar' | 'tailoring' {
  const c = category.toLowerCase();
  if (c.includes('dairy') || c.includes('milk')) return 'dairy';
  if (c.includes('solar') || c.includes('energy')) return 'solar';
  if (c.includes('tailor') || c.includes('textile') || c.includes('garment')) return 'tailoring';
  return 'mobile';
}

export function MyReportsScreen(): React.JSX.Element {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<AssessmentStatus | 'All'>('All');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [fitFilter, setFitFilter] = useState<FitFilterOption>('all');
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const token = getStorageItem(STORAGE_KEYS.authToken);
        if (token) {
          const data = await fetchMyReports(token);
          if (data?.reports && data.reports.length > 0) {
            const mapped: ReportSummary[] = data.reports.map((r) => ({
              id: r.id,
              title: r.category ? `${r.category} Unit` : 'Rural Enterprise',
              category: r.category || 'General',
              location: r.location || 'Local Catchment',
              status: ((r.status === 'Completed' || r.status === 'In Progress' || r.status === 'Saved')
                ? r.status
                : 'Completed') as AssessmentStatus,
              date: r.date || 'Recent',
              estimatedProfit: r.estimatedProfit ?? 25000,
              breakEvenMonths: 8,
              fitScore: r.fitScore ?? 75,
              confidence: ((r.fitScore ?? 75) >= 75 ? 'High' : (r.fitScore ?? 75) >= 50 ? 'Medium' : 'Low') as ConfidenceLevel,
              iconType: resolveCategoryIcon(r.category || ''),
            }));
            setReports(mapped);
            return;
          }
        }
        setReports([...MOCK_REPORTS]);
      } catch {
        setReports([...MOCK_REPORTS]);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const statusCounts = useMemo(() => {
    return {
      All: reports.length,
      Completed: reports.filter((r) => r.status === 'Completed').length,
      'In Progress': reports.filter((r) => r.status === 'In Progress').length,
      Saved: reports.filter((r) => r.status === 'Saved').length,
    };
  }, [reports]);

  const displayedReports = useMemo(() => {
    const filtered = filterReports(reports, selectedStatus, fitFilter);
    return sortReports(filtered, sortOption);
  }, [reports, selectedStatus, fitFilter, sortOption]);

  const groupedReports = useMemo(() => {
    return groupReportsByLocation(displayedReports);
  }, [displayedReports]);

  const locationKeys = Object.keys(groupedReports);

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#167844]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <div className="text-center text-red-600 font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-[#F8FAFC]/60 px-4 py-6 md:px-8 md:py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              My Reports
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
              All your assessments in one place.
            </p>
          </div>

          <Link
            href="/assessment/new"
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5',
              'bg-[#F59E0B] text-slate-950 font-medium text-xs md:text-sm shadow-sm',
              'hover:bg-[#EAB308] active:scale-[0.99] transition-all'
            )}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Assessment</span>
          </Link>
        </div>

        {/* Filter & Sort Controls */}
        <ReportFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusCounts={statusCounts}
          sortOption={sortOption}
          onSortChange={setSortOption}
          fitFilter={fitFilter}
          onFitFilterChange={setFitFilter}
        />

        {/* Location Grouped Reports List */}
        {locationKeys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800">No assessments found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your status or fit score filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('All');
                setFitFilter('all');
              }}
              className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {locationKeys.map((location) => {
              const reportsInLocation = groupedReports[location];
              return (
                <section key={location} aria-labelledby={`heading-${location}`}>
                  {/* Location Header */}
                  <div className="mb-3 flex items-center gap-1.5">
                    <MapPin size={15} className="text-slate-600" />
                    <h2
                      id={`heading-${location}`}
                      className="text-sm font-semibold text-slate-800"
                    >
                      {location}
                    </h2>
                    <span className="text-xs text-slate-400">
                      ({reportsInLocation.length})
                    </span>
                  </div>

                  {/* Responsive Grid: 1 col on mobile, 2 cols on md+ (Desktop) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportsInLocation.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Bottom Tip Card matching mockup */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3.5 text-xs text-amber-900">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Bookmark size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-950">Save ideas to revisit later</p>
            <p className="text-[11px] text-amber-800/90">
              Found something interesting? Save it and come back anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
