// tests/Login.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
    vi.useFakeTimers();
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

  it('successfully submits valid form and redirects to /discover', () => {
    render(<LoginPage />);
    const mobileInput = screen.getByPlaceholderText(/enter your mobile number/i);
    const pwdInput = screen.getByPlaceholderText(/enter your password/i);
    const form = mobileInput.closest('form')!;

    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();

    vi.advanceTimersByTime(700);
    expect(mockPush).toHaveBeenCalledWith('/discover');
  });

  it('handles Google authentication redirect', () => {
    render(<LoginPage />);
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    vi.advanceTimersByTime(700);
    expect(mockPush).toHaveBeenCalledWith('/discover');
  });

  it('defaults to Sign up mode when mode=signup query param is present', () => {
    mockSearchParams = new URLSearchParams('mode=signup');
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
  });
});
