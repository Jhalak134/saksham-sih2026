// lib/discover-types.ts
// Shared types for the Discover screen, mirroring /insights/{location} API response.

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TopMover {
  readonly category: string;
  readonly trendPercent: number;
  readonly direction: TrendDirection;
  readonly sparkline: readonly number[];
  readonly label: string;
}

export interface InsightsData {
  readonly population: number;
  readonly populationGrowthPercent: number;
  readonly keyDemand: {
    readonly category: string;
    readonly level: 'Low' | 'Medium' | 'High';
  };
  readonly nearbyMarkets: number;
}

export interface CategoryRow {
  readonly category: string;
  readonly trendPercent: number;
  readonly direction: TrendDirection;
  readonly tag: string | null;
  readonly withinBudget: boolean;
  readonly bookmarked: boolean;
  readonly sparkline: readonly number[];
  readonly icon: string;
  readonly description: string;
}

export interface InsightsPayload {
  readonly location: {
    readonly village: string;
    readonly district: string;
    readonly state: string;
  };
  readonly topMovers: readonly TopMover[];
  readonly stateSelected: string;
  readonly insights: InsightsData;
  readonly categories: readonly CategoryRow[];
}
