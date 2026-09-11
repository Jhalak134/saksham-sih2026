// components/compare/TrendComparisonChart.tsx
'use client';

import React, { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { MONTH_LABELS } from '@/data/compareData';

interface TrendComparisonChartProps {
  readonly category1: string;
  readonly category2: string;
  readonly series1: readonly number[];
  readonly series2: readonly number[];
}

export function TrendComparisonChart({
  category1,
  category2,
  series1,
  series2,
}: TrendComparisonChartProps): React.JSX.Element {
  const [activeMonthIdx, setActiveMonthIdx] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'12m' | '6m' | '3m'>('12m');

  // SVG dimensions
  const width = 800;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [100, 75, 50, 25, 0];

  function getY(val: number): number {
    const clamped = Math.max(0, Math.min(100, val));
    return paddingTop + (1 - clamped / 100) * chartHeight;
  }

  function getX(index: number, total: number): number {
    return paddingLeft + (index / (total - 1)) * chartWidth;
  }

  // Generate smooth SVG path using Catmull-Rom or cubic Bezier
  function generateSmoothPath(points: readonly number[]): string {
    if (points.length === 0) return '';
    const coords = points.map((val, idx) => ({
      x: getX(idx, points.length),
      y: getY(val),
    }));

    let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const ctrlX = (curr.x + next.x) / 2;
      path += ` C ${ctrlX.toFixed(1)} ${curr.y.toFixed(1)}, ${ctrlX.toFixed(1)} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }

    return path;
  }

  const path1 = generateSmoothPath(series1);
  const path2 = generateSmoothPath(series2);

  const area1 =
    series1.length > 0
      ? `${path1} L ${getX(series1.length - 1, series1.length).toFixed(1)} ${(
          paddingTop + chartHeight
        ).toFixed(1)} L ${getX(0, series1.length).toFixed(1)} ${(
          paddingTop + chartHeight
        ).toFixed(1)} Z`
      : '';

  const area2 =
    series2.length > 0
      ? `${path2} L ${getX(series2.length - 1, series2.length).toFixed(1)} ${(
          paddingTop + chartHeight
        ).toFixed(1)} L ${getX(0, series2.length).toFixed(1)} ${(
          paddingTop + chartHeight
        ).toFixed(1)} Z`
      : '';

  return (
    <section
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
      aria-label="Trend Comparison Chart"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp size={20} strokeWidth={2.25} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Trend Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Market interest over time (relative index)
            </p>
          </div>
        </div>

        {/* Legend & Filter */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              <span>{category1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              <span>{category2}</span>
            </div>
          </div>

          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as '12m' | '6m' | '3m')
              }
              className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Select comparison time range"
            >
              <option value="12m">Last 12 months</option>
              <option value="6m">Last 6 months</option>
              <option value="3m">Last 3 months</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Card */}
      {activeMonthIdx !== null && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-xs border border-slate-200/80">
          <span className="font-bold text-slate-800">
            {MONTH_LABELS[activeMonthIdx]} 2026
          </span>
          <div className="flex items-center gap-4 font-semibold">
            <span className="text-[#2563EB]">
              {category1}: {series1[activeMonthIdx] ?? 0}
            </span>
            <span className="text-[#D97706]">
              {category2}: {series2[activeMonthIdx] ?? 0}
            </span>
          </div>
        </div>
      )}

      {/* SVG Chart Container */}
      <div className="mt-4 w-full overflow-x-auto overflow-y-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px] select-none"
          role="img"
          aria-label={`Comparison chart between ${category1} and ${category2}`}
        >
          <defs>
            <linearGradient id="gradient-cat1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-cat2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & Y-axis labels */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? undefined : '2 2'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-medium fill-slate-400"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {area2 && <path d={area2} fill="url(#gradient-cat2)" />}
          {area1 && <path d={area1} fill="url(#gradient-cat1)" />}

          {/* Line Strokes */}
          {path2 && (
            <path
              d={path2}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {path1 && (
            <path
              d={path1}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Month Data Points & Hover Targets */}
          {MONTH_LABELS.map((month, idx) => {
            const x = getX(idx, MONTH_LABELS.length);
            const val1 = series1[idx] ?? 0;
            const val2 = series2[idx] ?? 0;
            const y1 = getY(val1);
            const y2 = getY(val2);
            const isHovered = activeMonthIdx === idx;

            return (
              <g
                key={month}
                onMouseEnter={() => setActiveMonthIdx(idx)}
                onMouseLeave={() => setActiveMonthIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover trigger column */}
                <rect
                  x={x - chartWidth / (MONTH_LABELS.length * 2)}
                  y={paddingTop}
                  width={chartWidth / MONTH_LABELS.length}
                  height={chartHeight + 20}
                  fill="transparent"
                />

                {/* Vertical active guide line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartHeight}
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Data point circle: Category 2 */}
                <circle
                  cx={x}
                  cy={y2}
                  r={isHovered ? 6 : 4}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Data point circle: Category 1 */}
                <circle
                  cx={x}
                  cy={y1}
                  r={isHovered ? 6 : 4}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* X-axis Month Label */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-slate-900 font-bold'
                      : 'fill-slate-400'
                  }`}
                >
                  {month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
