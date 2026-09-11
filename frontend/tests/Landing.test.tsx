// tests/Landing.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItHelpsSection } from '@/components/landing/HowItHelpsSection';
import { BuiltForRealitySection } from '@/components/landing/BuiltForRealitySection';
import { CtaBannerSection } from '@/components/landing/CtaBannerSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { MobileCommunityCard } from '@/components/landing/MobileCommunityCard';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingScreen } from '@/components/screens/Landing';

describe('LandingNavbar', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders SAKSHAM wordmark and login button', () => {
    render(<LandingNavbar />);
    expect(screen.getByRole('link', { name: /saksham home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('toggles language dropdown when clicking language selector', () => {
    render(<LandingNavbar />);
    const langBtn = screen.getByRole('button', { name: /select language/i });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(langBtn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText(/हिंदी/i)).toBeInTheDocument();

    // Select Hindi
    fireEvent.click(screen.getByText(/हिंदी/i));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('हिंदी')).toBeInTheDocument();
  });

  it('renders floating pill nav items and sign up button', () => {
    render(<LandingNavbar />);
    expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /feasibility/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /schemes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up free/i })).toBeInTheDocument();
  });
});

describe('HeroSection', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders headline and subtitle', () => {
    render(<HeroSection />);
    expect(screen.getByText(/bring fresh growth/i)).toBeInTheDocument();
    expect(screen.getByText(/to agriculture\./i)).toBeInTheDocument();
    expect(screen.getByText(/make confident business decisions for a better tomorrow/i)).toBeInTheDocument();
  });

  it('renders visual card with overlay quote', () => {
    render(<HeroSection />);
    expect(screen.getByText('Local data.')).toBeInTheDocument();
    expect(screen.getByText('Real opportunities.')).toBeInTheDocument();
    expect(screen.getByText('Stronger businesses.')).toBeInTheDocument();
  });

  it('renders Bring Fresh Growth headline and panoramic illustration of rural entrepreneur', () => {
    render(<HeroSection />);
    expect(screen.getByText(/bring fresh growth/i)).toBeInTheDocument();
    expect(screen.getByText(/to agriculture\./i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /rural entrepreneur in lush crop field/i })).toBeInTheDocument();
  });
});

describe('HowItHelpsSection', () => {
  it('renders 3 help cards with correct headings and links', () => {
    render(<HowItHelpsSection />);
    expect(screen.getByText('How SAKSHAM helps')).toBeInTheDocument();
    expect(screen.getByText('Understand your market')).toBeInTheDocument();
    expect(screen.getByText('Test your business')).toBeInTheDocument();
    expect(screen.getByText('Plan your financing')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /understand your market/i })).toHaveAttribute('href', '/discover');
    expect(screen.getByRole('link', { name: /test your business/i })).toHaveAttribute('href', '/new-assessment');
    expect(screen.getByRole('link', { name: /plan your financing/i })).toHaveAttribute('href', '/how-it-works');
  });
});

describe('BuiltForRealitySection', () => {
  it('renders 4 reality features in grid', () => {
    render(<BuiltForRealitySection />);
    expect(screen.getByText('Built for your reality')).toBeInTheDocument();
    expect(screen.getByText('Village and block-level context')).toBeInTheDocument();
    expect(screen.getByText('Local market signals')).toBeInTheDocument();
    expect(screen.getByText('Scheme-aware financing')).toBeInTheDocument();
    expect(screen.getByText('Multilingual support')).toBeInTheDocument();
  });
});

describe('CtaBannerSection', () => {
  it('renders CTA banner headline and action button', () => {
    render(<CtaBannerSection />);
    expect(screen.getByText(/your ideas\./i)).toBeInTheDocument();
    expect(screen.getByText(/a stronger tomorrow\./i)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /start your assessment/i });
    expect(cta).toHaveAttribute('href', '/new-assessment');
  });
});

describe('FaqSection', () => {
  it('renders FAQ questions and toggles accordion answers', () => {
    render(<FaqSection />);
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();

    const q1 = screen.getByRole('button', { name: /is saksham free to use\?/i });
    expect(screen.queryByText(/saksham is completely free for all rural/i)).not.toBeInTheDocument();

    fireEvent.click(q1);
    expect(screen.getByText(/saksham is completely free for all rural/i)).toBeInTheDocument();

    // Toggle close
    fireEvent.click(q1);
    expect(screen.queryByText(/saksham is completely free for all rural/i)).not.toBeInTheDocument();
  });

  it('handles "See all" / "Collapse" toggle', () => {
    render(<FaqSection />);
    const toggleBtn = screen.getByRole('button', { name: /see all/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/saksham is completely free/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
  });
});

describe('MobileCommunityCard', () => {
  it('renders community empowerment message', () => {
    render(<MobileCommunityCard />);
    expect(screen.getByText('Stronger businesses. Stronger communities.')).toBeInTheDocument();
  });
});

describe('LandingFooter', () => {
  it('renders footer links, social links, and copyright', () => {
    render(<LandingFooter />);
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: /saksham on youtube/i })).toBeInTheDocument();
    expect(screen.getByText(/© 2025 SAKSHAM/i)).toBeInTheDocument();
  });
});

describe('LandingScreen', () => {
  it('renders the complete landing page hierarchy without errors', () => {
    render(<LandingScreen />);
    expect(screen.getAllByRole('link', { name: /saksham home/i })[0]).toBeInTheDocument();
    expect(screen.getByText(/make confident business decisions/i)).toBeInTheDocument();
    expect(screen.getByText('How SAKSHAM helps')).toBeInTheDocument();
    expect(screen.getByText('Built for your reality')).toBeInTheDocument();
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
  });
});
