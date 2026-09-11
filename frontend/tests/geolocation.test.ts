// tests/geolocation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestUserLocation,
  reverseGeocodeCoordinates,
  getSavedUserLocation,
  GEO_STATUS_KEY,
} from '@/lib/geolocation';
import { STORAGE_KEYS } from '@/lib/constants';

describe('geolocation utility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reverse-geocodes Mathura bounding box coordinates to Mathura location', async () => {
    // Vrindavan coordinates: [lat: 27.58, lon: 77.70]
    const res = await reverseGeocodeCoordinates(27.58, 77.7);
    expect(res.district).toBe('Mathura');
    expect(res.isPilot).toBe(true);
  });

  it('handles permission denied from navigator.geolocation', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          PERMISSION_DENIED: 1,
          message: 'User denied Geolocation',
        });
      }),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    const result = await requestUserLocation();
    expect(result.permissionStatus).toBe('denied');
    expect(result.locationString).toBe('');
    expect(localStorage.getItem(GEO_STATUS_KEY)).toBe('denied');

    const saved = getSavedUserLocation();
    expect(saved.status).toBe('denied');
  });

  it('handles permission granted and persists location', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 27.58,
            longitude: 77.7,
          },
        });
      }),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    const result = await requestUserLocation();
    expect(result.permissionStatus).toBe('granted');
    expect(result.district).toBe('Mathura');
    expect(localStorage.getItem(GEO_STATUS_KEY)).toBe('granted');
    expect(localStorage.getItem(STORAGE_KEYS.homeLocation)).toBeDefined();

    const saved = getSavedUserLocation();
    expect(saved.status).toBe('granted');
    expect(saved.location).toBe(result.locationString);
  });
});
