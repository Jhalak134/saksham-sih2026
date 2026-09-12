// tests/Login.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

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

vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

const mockGetUserProfile = vi.fn();
const mockSaveUserProfile = vi.fn();

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/api-client');
  return {
    ...actual,
    getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
    saveUserProfile: (...args: unknown[]) => mockSaveUserProfile(...args),
  };
});

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetUserProfile.mockReset();
    mockSaveUserProfile.mockReset();
    mockSearchParams = new URLSearchParams();
    localStorage.clear();
  });

  it('renders login tab active by default and displays heading "Welcome back"', () => {
    render(<LoginPage />);
    expect(screen.getByRole('tab', { name: /^log in$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^sign up$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument();
  });

  it('renders mobile number and password inputs with icons and placeholders', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/enter your mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('renders forgot password link, log in CTA, and Google button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^log in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue as guest/i })).toHaveAttribute('href', '/discover');
  });

  it('toggles password visibility when eye icon button is clicked', () => {
    render(<LoginPage />);
    const pwdInput = screen.getByPlaceholderText(/enter your password/i);
    expect(pwdInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideBtn);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });

  it('switches to Sign up mode when clicking Sign up tab', () => {
    render(<LoginPage />);
    const signupTab = screen.getByRole('tab', { name: /^sign up$/i });
    fireEvent.click(signupTab);

    expect(screen.getByRole('heading', { level: 1, name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /forgot password\?/i })).not.toBeInTheDocument();
  });

  it('displays validation error when submitting empty fields', () => {
    render(<LoginPage />);
    const form = screen.getByPlaceholderText(/enter your mobile number/i).closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText(/please enter your mobile number/i)).toBeInTheDocument();
  });

  it('validates mobile number length and password length', () => {
    render(<LoginPage />);
    const mobileInput = screen.getByPlaceholderText(/enter your mobile number/i);
    const pwdInput = screen.getByPlaceholderText(/enter your password/i);
    const form = mobileInput.closest('form')!;

    fireEvent.change(mobileInput, { target: { value: '123' } });
    fireEvent.submit(form);
    expect(screen.getByText(/valid 10-digit mobile number/i)).toBeInTheDocument();

    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.submit(form);
    expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();

    fireEvent.change(pwdInput, { target: { value: '123' } });
    fireEvent.submit(form);
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it('successfully logs in with verified account and redirects to /discover', async () => {
    mockGetUserProfile.mockResolvedValueOnce({
      id: 1,
      phone_or_email: '9876543210',
      home_location: 'Bera, Mathura',
      default_capital: 50000,
      preferred_language: 'en',
    });

    render(<LoginPage />);
    const mobileInput = screen.getByPlaceholderText(/enter your mobile number/i);
    const pwdInput = screen.getByPlaceholderText(/enter your password/i);
    const form = mobileInput.closest('form')!;

    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledWith('9876543210');
      expect(mockPush).toHaveBeenCalledWith('/discover');
    });
  });

  it('displays backend error message when login fails', async () => {
    mockGetUserProfile.mockRejectedValueOnce(
      new Error('Account not found. Please check your mobile number or sign up.')
    );

    render(<LoginPage />);
    const mobileInput = screen.getByPlaceholderText(/enter your mobile number/i);
    const pwdInput = screen.getByPlaceholderText(/enter your password/i);
    const form = mobileInput.closest('form')!;

    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText(/Account not found\. Please check your mobile number or sign up\./i)
      ).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('successfully signs up new user and redirects to /discover', async () => {
    mockSaveUserProfile.mockResolvedValueOnce({
      id: 2,
      phone_or_email: '9876543210',
      home_location: null,
      default_capital: null,
      preferred_language: 'en',
    });

    render(<LoginPage />);
    const signupTab = screen.getByRole('tab', { name: /^sign up$/i });
    fireEvent.click(signupTab);

    const nameInput = screen.getByPlaceholderText(/enter your full name/i);
    const mobileInput = screen.getByPlaceholderText(/enter your mobile number/i);
    const pwdInput = screen.getByPlaceholderText(/enter your password/i);
    const form = mobileInput.closest('form')!;

    // Validation: name required
    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });
    fireEvent.submit(form);
    expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument();

    // Fill name and submit
    fireEvent.change(nameInput, { target: { value: 'Ramesh Patel' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSaveUserProfile).toHaveBeenCalledWith({
        phone_or_email: '9876543210',
        preferred_language: 'en',
      });
      expect(screen.getByText(/saksham wants to access your location/i)).toBeInTheDocument();
    });

    const allowBtn = screen.getByRole('button', { name: /allow location access/i });
    fireEvent.click(allowBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/discover');
    });
  });

  it('displays honest notice when Google authentication is clicked in login mode', () => {
    render(<LoginPage />);
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    expect(
      screen.getByText(/Google Sign-In is not configured in this pilot environment/i)
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('defaults to Sign up mode when mode=signup query param is present', () => {
    mockSearchParams = new URLSearchParams('mode=signup');
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
  });

  it('prompts for location modal when signing up with Google', async () => {
    render(<LoginPage />);
    const signupTab = screen.getByRole('tab', { name: /^sign up$/i });
    fireEvent.click(signupTab);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    expect(screen.getByText(/saksham wants to access your location/i)).toBeInTheDocument();

    const allowBtn = screen.getByRole('button', { name: /allow location access/i });
    fireEvent.click(allowBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/discover');
    });
  });

  it('allows skipping location access from modal during Google signup', () => {
    render(<LoginPage />);
    const signupTab = screen.getByRole('tab', { name: /^sign up$/i });
    fireEvent.click(signupTab);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    expect(screen.getByText(/saksham wants to access your location/i)).toBeInTheDocument();

    const skipBtn = screen.getByRole('button', { name: /not now, i'll fill manually/i });
    fireEvent.click(skipBtn);

    expect(mockPush).toHaveBeenCalledWith('/discover');
  });
});

