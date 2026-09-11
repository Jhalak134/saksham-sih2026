import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

describe('AnimatedCounter Component', () => {
  it('renders target integer value with prefix and suffix', () => {
    render(<AnimatedCounter value={34} prefix="+" suffix="%" />);
    const el = screen.getByTestId('animated-counter');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('+34%');
  });

  it('renders decimal values with specified decimals prop', () => {
    render(<AnimatedCounter value={67.68} decimals={1} suffix="%" />);
    const el = screen.getByTestId('animated-counter');
    expect(el).toHaveTextContent('67.7%');
  });

  it('formats large numbers in Indian numbering convention', () => {
    render(<AnimatedCounter value={1420} suffix="+" />);
    const el = screen.getByTestId('animated-counter');
    expect(el).toHaveTextContent('1,420+');
  });

  it('supports custom formatter callback', () => {
    render(
      <AnimatedCounter
        value={199812341}
        formatter={(v) => `${(v / 10000000).toFixed(2)} Cr`}
      />
    );
    const el = screen.getByTestId('animated-counter');
    expect(el).toHaveTextContent('19.98 Cr');
  });

  it('handles value 0 gracefully', () => {
    render(<AnimatedCounter value={0} prefix="₹" />);
    const el = screen.getByTestId('animated-counter');
    expect(el).toHaveTextContent('₹0');
  });
});
