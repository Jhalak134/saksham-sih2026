// data/mockLocations.ts
// Fake location search results — replaced by real API in Part 13.

export interface LocationResult {
  id: string;
  village: string;
  block: string;
  district: string;
  state: string;
}

export const MOCK_LOCATIONS: readonly LocationResult[] = [
  { id: 'loc_01', village: 'Kheragarh',    block: 'Kheragarh', district: 'Agra',     state: 'Uttar Pradesh' },
  { id: 'loc_02', village: 'Rampur',        block: 'Maholi',    district: 'Mathura',  state: 'Uttar Pradesh' },
  { id: 'loc_03', village: 'Nagla Padam',   block: 'Etmadpur',  district: 'Agra',     state: 'Uttar Pradesh' },
  { id: 'loc_04', village: 'Sirsaganj',     block: 'Sirsaganj', district: 'Firozabad',state: 'Uttar Pradesh' },
  { id: 'loc_05', village: 'Kasganj',       block: 'Kasganj',   district: 'Etah',     state: 'Uttar Pradesh' },
  { id: 'loc_06', village: 'Hathras',       block: 'Hathras',   district: 'Hathras',  state: 'Uttar Pradesh' },
  { id: 'loc_07', village: 'Vrindavan',     block: 'Mathura',   district: 'Mathura',  state: 'Uttar Pradesh' },
  { id: 'loc_08', village: 'Jalesar',       block: 'Jalesar',   district: 'Etah',     state: 'Uttar Pradesh' },
] as const;

/** Search mock locations by query string (case-insensitive, multi-field). */
export function searchLocations(query: string): LocationResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return MOCK_LOCATIONS.filter(
    (l) =>
      l.village.toLowerCase().includes(q) ||
      l.block.toLowerCase().includes(q) ||
      l.district.toLowerCase().includes(q)
  );
}

/** Format a location result as a human-readable display string. */
export function formatLocation(loc: LocationResult): string {
  return `${loc.village}, ${loc.district}`;
}
