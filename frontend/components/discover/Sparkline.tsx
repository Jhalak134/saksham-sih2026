// components/discover/Sparkline.tsx
// High quality smooth bezier curve sparkline matching the mockup aesthetics.

import React, { useId } from 'react';

interface SparklineProps {
  /** Numerical trend data points */
  readonly values: readonly number[];
  /** Direction drives stroke and gradient color */
  readonly direction: 'up' | 'down' | 'flat';
  readonly width?: number;
  readonly height?: number;
  readonly fill?: boolean;
}

// Convert points to a smooth cubic bezier SVG path
function buildSmoothPath(values: readonly number[], w: number, h: number): { linePath: string; areaPath: string } {
  if (!values || values.length === 0) return { linePath: '', areaPath: '' };
  if (values.length === 1) {
    const y = h / 2;
    return {
      linePath: `M 0,${y} L ${w},${y}`,
      areaPath: `M 0,${y} L ${w},${y} L ${w},${h} L 0,${h} Z`,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 3;
  const effectiveH = h - padding * 2;
  const step = w / Math.max(values.length - 1, 1);

  const pts = values.map((v, i) => ({
    x: i * step,
    y: h - padding - ((v - min) / range) * effectiveH,
  }));

  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const lastPt = pts[pts.length - 1];
  const firstPt = pts[0];
  const areaPath = `${d} L ${lastPt.x.toFixed(1)},${h} L ${firstPt.x.toFixed(1)},${h} Z`;

  return { linePath: d, areaPath };
}

const STYLES = {
  up: {
    stroke: '#38bdf8', // Vibrant sky blue like the mock
    stopColor: '#38bdf8',
  },
  down: {
    stroke: '#94a3b8', // Slate grey or coral
    stopColor: '#cbd5e1',
  },
  flat: {
    stroke: '#94a3b8',
    stopColor: '#e2e8f0',
  },
};

export function Sparkline({
  values,
  direction,
  width = 80,
  height = 32,
  fill = true,
}: SparklineProps): React.JSX.Element {
  const gradientId = useId();
  const { linePath, areaPath } = buildSmoothPath(values, width, height);
  const theme = STYLES[direction] || STYLES.up;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.stopColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={theme.stopColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {fill && areaPath && (
        <path d={areaPath} fill={`url(#${gradientId})`} />
      )}

      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
