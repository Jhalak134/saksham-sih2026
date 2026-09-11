// tests/auth-context.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { STORAGE_KEYS } from '@/lib/constants';
import * as apiClient from '@/lib/api-client';

function AuthDisplay(): React.JSX.Element {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="isLoading">{String(auth.isLoading)}</span>
      <span data-testid="isAuthenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="isGuest">{String(auth.isGuest)}</span>
      <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</span>
      <span data-testid="error">{auth.error || ''}</span>
      <button
        data-testid="loginBtn"
        onClick={() => void auth.login('9876543210').catch(() => {})}
      >
        login
      </button>
      <button
        data-testid="emptyLoginBtn"
        onClick={() => void auth.login('').catch(() => {})}
      >
        emptyLogin
      </button>
      <button
        data-testid="signupBtn"
        onClick={() =>
          void auth
            .signup({ phone_or_email: '1234567890', preferred_language: 'en' })
            .catch(() => {})
        }
      >
        signup
      </button>
      <button
        data-testid="emptySignupBtn"
        onClick={() =>
          void auth.signup({ phone_or_email: '' }).catch(() => {})
        }
      >
        emptySignup
      </button>
      <button data-testid="logoutBtn" onClick={auth.logout}>
        logout
      </button>
      <button data-testid="clearErrorBtn" onClick={auth.clearError}>
        clearError
      </button>
    </div>
  );
}

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes in guest mode when no stored session exists', async () => {
    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isGuest').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('hydrates authenticated user from localStorage on mount', async () => {
    localStorage.setItem(STORAGE_KEYS.authUser, '9876543210');

    const mockProfile = {
      id: 1,
      phone_or_email: '9876543210',
      home_location: 'Bera, Mathura',
      default_capital: 100000,
      preferred_language: 'en',
    };

    vi.spyOn(apiClient, 'getUserProfile').mockResolvedValueOnce(mockProfile);

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('isGuest').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toContain('9876543210');
  });

  it('reverts to guest session if stored profile fails to hydrate', async () => {
    localStorage.setItem(STORAGE_KEYS.authUser, 'unknown_user');

    vi.spyOn(apiClient, 'getUserProfile').mockRejectedValueOnce(
      new Error('User not found')
    );

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isGuest').textContent).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.authUser)).toBeNull();
  });

  it('logs in successfully and persists identifier to localStorage', async () => {
    const mockProfile = {
      id: 1,
      phone_or_email: '9876543210',
      home_location: 'Bera, Mathura',
      default_capital: 100000,
      preferred_language: 'en',
    };

    const spy = vi.spyOn(apiClient, 'getUserProfile').mockResolvedValueOnce(mockProfile);

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('loginBtn'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('9876543210');
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toContain('9876543210');
      expect(localStorage.getItem(STORAGE_KEYS.authUser)).toBe('9876543210');
    });
  });

  it('handles empty login identifier gracefully', async () => {
    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('emptyLoginBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(
        'Please enter a valid mobile number or email.'
      );
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
  });

  it('sets error state when backend login rejects', async () => {
    vi.spyOn(apiClient, 'getUserProfile').mockRejectedValueOnce(
      new Error('Account not found')
    );

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('loginBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Account not found');
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
  });

  it('signs up successfully and sets user state', async () => {
    const mockProfile = {
      id: 2,
      phone_or_email: '1234567890',
      home_location: null,
      default_capital: null,
      preferred_language: 'en',
    };

    const spy = vi.spyOn(apiClient, 'saveUserProfile').mockResolvedValueOnce(mockProfile);

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('signupBtn'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        phone_or_email: '1234567890',
        preferred_language: 'en',
      });
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toContain('1234567890');
      expect(localStorage.getItem(STORAGE_KEYS.authUser)).toBe('1234567890');
    });
  });

  it('handles empty signup identifier gracefully', async () => {
    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('emptySignupBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(
        'Please enter a valid mobile number or email.'
      );
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
  });

  it('sets error state when backend signup rejects', async () => {
    vi.spyOn(apiClient, 'saveUserProfile').mockRejectedValueOnce(
      new Error('Mobile already registered')
    );

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('signupBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(
        'Mobile already registered'
      );
    });
  });

  it('logs out and reverts to guest mode', async () => {
    localStorage.setItem(STORAGE_KEYS.authUser, '9876543210');
    const mockProfile = {
      id: 1,
      phone_or_email: '9876543210',
      home_location: null,
      default_capital: null,
      preferred_language: 'en',
    };

    vi.spyOn(apiClient, 'getUserProfile').mockResolvedValueOnce(mockProfile);

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });

    fireEvent.click(screen.getByTestId('logoutBtn'));

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isGuest').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem(STORAGE_KEYS.authUser)).toBeNull();
  });

  it('clears error state when clearError is invoked', async () => {
    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('emptyLoginBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).not.toBe('');
    });

    fireEvent.click(screen.getByTestId('clearErrorBtn'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('handles non-Error exception gracefully in login', async () => {
    vi.spyOn(apiClient, 'getUserProfile').mockRejectedValueOnce('string error');

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('loginBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Authentication failed');
    });
  });

  it('handles non-Error exception gracefully in signup', async () => {
    vi.spyOn(apiClient, 'saveUserProfile').mockRejectedValueOnce('string error');

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByTestId('signupBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Failed to create profile');
    });
  });

  it('handles whitespace stored user identifier without attempting fetch', async () => {
    localStorage.setItem(STORAGE_KEYS.authUser, '   ');
    const spy = vi.spyOn(apiClient, 'getUserProfile');

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId('isGuest').textContent).toBe('true');
  });

  it('safely handles unmount during session hydration', async () => {
    localStorage.setItem(STORAGE_KEYS.authUser, '9876543210');
    let resolveProfile: (val: unknown) => void = () => {};
    const deferred = new Promise((res) => {
      resolveProfile = res;
    });

    vi.spyOn(apiClient, 'getUserProfile').mockReturnValueOnce(
      deferred as unknown as Promise<apiClient.UserProfile>
    );

    const { unmount } = render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    unmount();
    resolveProfile({
      id: 1,
      phone_or_email: '9876543210',
      home_location: null,
      default_capital: null,
      preferred_language: 'en',
    });
  });

  it('safely handles unmount when session hydration rejects', async () => {
    localStorage.setItem(STORAGE_KEYS.authUser, '9876543210');
    let rejectProfile: (err: unknown) => void = () => {};
    const deferred = new Promise((_, rej) => {
      rejectProfile = rej;
    });

    vi.spyOn(apiClient, 'getUserProfile').mockReturnValueOnce(
      deferred as unknown as Promise<apiClient.UserProfile>
    );

    const { unmount } = render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>
    );

    unmount();
    rejectProfile(new Error('Network drop'));
  });

  it('throws error when useAuth is called outside AuthProvider', () => {
    // Suppress React console.error for expected uncaught error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<AuthDisplay />)).toThrow(
      'useAuth must be called inside <AuthProvider>'
    );

    spy.mockRestore();
  });
});
