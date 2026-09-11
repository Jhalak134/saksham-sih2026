// tests/api-auth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserProfile, saveUserProfile } from '@/lib/api-client';

describe('api-client — Auth & User Profile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getUserProfile', () => {
    it('throws error when identifier is empty or whitespace', async () => {
      await expect(getUserProfile('')).rejects.toThrow('Identifier cannot be empty');
      await expect(getUserProfile('   ')).rejects.toThrow('Identifier cannot be empty');
    });

    it('fetches user profile successfully on 200 OK', async () => {
      const mockProfile = {
        id: 5,
        phone_or_email: '9876543210',
        home_location: 'Bera, Mathura',
        default_capital: 100000,
        preferred_language: 'en',
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockProfile,
        })
      );

      const profile = await getUserProfile('9876543210');
      expect(profile).toEqual(mockProfile);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/profile/9876543210'),
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      );
    });

    it('throws friendly message when user is not found (HTTP 404)', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: async () => ({ detail: 'User not found.' }),
        })
      );

      await expect(getUserProfile('9999999999')).rejects.toThrow(
        'Account not found. Please check your mobile number or sign up.'
      );
    });

    it('throws generic error when backend returns non-404 error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Database error' }),
        })
      );

      await expect(getUserProfile('9876543210')).rejects.toThrow(
        'Failed to fetch user profile (HTTP 500)'
      );
    });
  });

  describe('saveUserProfile', () => {
    it('throws error when phone_or_email is empty or whitespace', async () => {
      await expect(
        saveUserProfile({ phone_or_email: '', preferred_language: 'en' })
      ).rejects.toThrow('Phone or email cannot be empty');

      await expect(
        saveUserProfile({ phone_or_email: '   ', preferred_language: 'en' })
      ).rejects.toThrow('Phone or email cannot be empty');
    });

    it('saves user profile successfully via POST /api/v1/auth/profile', async () => {
      const mockSaved = {
        id: 7,
        phone_or_email: 'newuser@saksham.gov.in',
        home_location: 'Mathura',
        default_capital: 50000,
        preferred_language: 'hi',
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSaved,
        })
      );

      const res = await saveUserProfile({
        phone_or_email: 'newuser@saksham.gov.in',
        home_location: 'Mathura',
        default_capital: 50000,
        preferred_language: 'hi',
      });

      expect(res).toEqual(mockSaved);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/profile'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            phone_or_email: 'newuser@saksham.gov.in',
            home_location: 'Mathura',
            default_capital: 50000,
            preferred_language: 'hi',
          }),
        })
      );
    });

    it('throws error when backend returns HTTP error on save', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
        })
      );

      await expect(
        saveUserProfile({
          phone_or_email: 'baduser',
        })
      ).rejects.toThrow('Failed to save user profile (HTTP 400)');
    });
  });
});
