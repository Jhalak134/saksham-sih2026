// tests/auth-ui.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, AuthContext, type AuthContextValue } from '@/lib/auth-context';
import { ShellProvider } from '@/lib/shell-context';
import { Header } from '@/components/layout/Header';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { LogoutCard } from '@/components/profile/LogoutCard';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const mockLogout = vi.fn();

const guestAuthValue: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isGuest: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  signup: vi.fn(),
  logout: mockLogout,
  clearError: vi.fn(),
};

const authenticatedAuthValue: AuthContextValue = {
  user: {
    id: 10,
    phone_or_email: '9876543210',
    home_location: 'Bera, Mathura',
    default_capital: 150000,
    preferred_language: 'en',
  },
  isAuthenticated: true,
  isGuest: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  signup: vi.fn(),
  logout: mockLogout,
  clearError: vi.fn(),
};

describe('Auth UI Integration — Guest vs Authenticated States', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLogout.mockClear();
  });

  describe('Header Auth Indicator', () => {
    it('renders "Sign In" link when user is in guest mode', () => {
      render(
        <AuthContext.Provider value={guestAuthValue}>
          <ShellProvider>
            <Header />
          </ShellProvider>
        </AuthContext.Provider>
      );

      const signInLink = screen.getByRole('link', { name: /sign in or register/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('renders user account link with phone/email when user is authenticated', () => {
      render(
        <AuthContext.Provider value={authenticatedAuthValue}>
          <ShellProvider>
            <Header />
          </ShellProvider>
        </AuthContext.Provider>
      );

      const profileLink = screen.getByRole('link', {
        name: /signed in as 9876543210/i,
      });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute('href', '/profile');
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });
  });

  describe('ProfileForm Account Status', () => {
    it('displays Guest Mode badge and Sign In / Register CTA for guest', () => {
      render(
        <AuthContext.Provider value={guestAuthValue}>
          <ShellProvider>
            <ProfileForm />
          </ShellProvider>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Guest Session')).toBeInTheDocument();
      expect(screen.getByText('Guest Mode')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /sign in \/ register/i })
      ).toHaveAttribute('href', '/login');
    });

    it('displays Active Account badge and user identifier for authenticated session', () => {
      render(
        <AuthContext.Provider value={authenticatedAuthValue}>
          <ShellProvider>
            <ProfileForm />
          </ShellProvider>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Active Account')).toBeInTheDocument();
      expect(screen.getByText('9876543210')).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /sign in \/ register/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('LogoutCard Behavior', () => {
    it('displays guest exit description and calls logout when clicked', () => {
      const originalLocation = window.location;
      // @ts-expect-error Mocking window.location for test
      delete window.location;
      window.location = { href: '' } as unknown as Location;

      render(
        <AuthContext.Provider value={guestAuthValue}>
          <LogoutCard />
        </AuthContext.Provider>
      );

      expect(
        screen.getByText(/End guest session and return to the landing page\./i)
      ).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(btn);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/');

      window.location = originalLocation;
    });

    it('displays authenticated user session description and calls logout', () => {
      const originalLocation = window.location;
      // @ts-expect-error Mocking window.location for test
      delete window.location;
      window.location = { href: '' } as unknown as Location;

      render(
        <AuthContext.Provider value={authenticatedAuthValue}>
          <LogoutCard />
        </AuthContext.Provider>
      );

      expect(
        screen.getByText(/End session for 9876543210\./i)
      ).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(btn);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/');

      window.location = originalLocation;
    });
  });
});
