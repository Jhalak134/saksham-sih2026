// data/stateDistrictsData.ts
// Typed helper functions for district maps and pins across all Indian states.

import rawStateData from './stateDistricts.json';

export interface DistrictLocation {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly center: { readonly x: number; readonly y: number };
  readonly hub?: boolean;
  readonly tag?: string;
}

export interface StateDistrictMap {
  readonly viewBox: string;
  readonly districtCount: number;
  readonly districts: readonly DistrictLocation[];
}

export const STATE_DISTRICT_MAPS: Record<string, StateDistrictMap> =
  rawStateData as Record<string, StateDistrictMap>;

export function getStateDistricts(stateName: string): StateDistrictMap | null {
  if (!stateName) return null;
  const clean = stateName.trim().toLowerCase();

  const exactKey = Object.keys(STATE_DISTRICT_MAPS).find(
    (k) => k.toLowerCase() === clean
  );
  if (exactKey) return STATE_DISTRICT_MAPS[exactKey];

  const partialKey = Object.keys(STATE_DISTRICT_MAPS).find(
    (k) => k.toLowerCase().includes(clean) || clean.includes(k.toLowerCase())
  );
  return partialKey ? STATE_DISTRICT_MAPS[partialKey] : null;
}
