// lib/geolocation.ts
// Geolocation detection, reverse-geocoding, and persistent user location helper.

import { STORAGE_KEYS } from './constants';
import { getStorageItem, setStorageItem } from './storage';
import { isMathuraLocation } from '@/data/mockLocations';

export interface UserLocationResult {
  readonly locationString: string;
  readonly village?: string;
  readonly district?: string;
  readonly state?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly permissionStatus: 'granted' | 'denied' | 'unsupported' | 'error';
  readonly error?: string;
  readonly isPilot: boolean;
}

export const GEO_STATUS_KEY = 'saksham_geo_permission_status';

/**
 * Reverse geocode latitude/longitude coordinates to an Indian location name.
 * Uses Nominatim with fallback to pilot region coordinates approximation.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{ locationString: string; village?: string; district?: string; state?: string; isPilot: boolean }> {
  // Check Mathura Pilot district bounding box approximation [77.20, 27.15] to [78.08, 28.05]
  const isWithinMathuraBounds =
    longitude >= 77.2 && longitude <= 78.08 && latitude >= 27.15 && latitude <= 28.05;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const village = addr.village || addr.suburb || addr.town || addr.city_district || addr.hamlet || '';
      const district = addr.county || addr.district || addr.state_district || (isWithinMathuraBounds ? 'Mathura' : '');
      const state = addr.state || 'Uttar Pradesh';

      let locationString = '';
      if (village && district) {
        locationString = `${village}, ${district}`;
      } else if (district && state) {
        locationString = `${district}, ${state}`;
      } else if (village && state) {
        locationString = `${village}, ${state}`;
      } else if (data.display_name) {
        const parts = (data.display_name as string).split(',').map((s) => s.trim());
        locationString = parts.slice(0, 2).join(', ');
      } else {
        locationString = isWithinMathuraBounds ? 'Vrindavan, Mathura' : 'Mathura, Uttar Pradesh';
      }

      const isPilot = isMathuraLocation(locationString) || isWithinMathuraBounds;
      return { locationString, village, district, state, isPilot };
    }
  } catch {
    // Network failure / timeout fallback
  }

  // Graceful fallback based on bounding coordinate check
  if (isWithinMathuraBounds) {
    return {
      locationString: 'Vrindavan, Mathura',
      village: 'Vrindavan',
      district: 'Mathura',
      state: 'Uttar Pradesh',
      isPilot: true,
    };
  }

  return {
    locationString: 'Mathura, Uttar Pradesh',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    isPilot: true,
  };
}

/**
 * Request browser geolocation, reverse-geocode coordinates, and persist to storage.
 */
export function requestUserLocation(): Promise<UserLocationResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStorageItem(GEO_STATUS_KEY, 'unsupported');
      resolve({
        locationString: '',
        permissionStatus: 'unsupported',
        error: 'Geolocation is not supported by your browser',
        isPilot: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const geocoded = await reverseGeocodeCoordinates(lat, lng);
        setStorageItem(GEO_STATUS_KEY, 'granted');
        setStorageItem(STORAGE_KEYS.homeLocation, geocoded.locationString);

        resolve({
          locationString: geocoded.locationString,
          village: geocoded.village,
          district: geocoded.district,
          state: geocoded.state,
          latitude: lat,
          longitude: lng,
          permissionStatus: 'granted',
          isPilot: geocoded.isPilot,
        });
      },
      (error) => {
        const isDenied = error.code === error.PERMISSION_DENIED;
        const status = isDenied ? 'denied' : 'error';
        setStorageItem(GEO_STATUS_KEY, status);

        resolve({
          locationString: '',
          permissionStatus: status,
          error: error.message || 'Location permission denied',
          isPilot: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Get previously saved user location if permission was granted earlier.
 */
export function getSavedUserLocation(): { location: string | null; status: string | null } {
  const status = getStorageItem(GEO_STATUS_KEY);
  const location = getStorageItem(STORAGE_KEYS.homeLocation);
  return {
    location,
    status,
  };
}
