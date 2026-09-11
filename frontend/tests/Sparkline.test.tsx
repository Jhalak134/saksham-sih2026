import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Sparkline } from '@/components/discover/Sparkline';

describe('Sparkline', () => {
  it('renders an SVG with a path', () => {
    const { container } = render(
      <Sparkline values={[10, 14, 18, 22, 28, 34]} direction="up" />
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('path')).not.toBeNull();
  });

  it('uses sky blue stroke for up direction', () => {
    const { container } = render(
      <Sparkline values={[1, 2, 3, 4, 5, 6]} direction="up" fill={false} />
    );
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#38bdf8');
  });

  it('uses slate stroke for down direction', () => {
    const { container } = render(
      <Sparkline values={[6, 5, 4, 3, 2, 1]} direction="down" fill={false} />
    );
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#94a3b8');
  });

  it('uses grey stroke for flat direction', () => {
    const { container } = render(
      <Sparkline values={[5, 5, 5, 5, 5, 5]} direction="flat" fill={false} />
    );
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#94a3b8');
  });

  it('respects custom width and height props', () => {
    const { container } = render(
      <Sparkline values={[1, 2, 3]} direction="up" width={100} height={50} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('100');
    expect(svg?.getAttribute('height')).toBe('50');
  });

  it('handles a single-value array without crashing', () => {
    const { container } = render(
      <Sparkline values={[5]} direction="flat" />
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('handles all-equal values without dividing by zero', () => {
    const { container } = render(
      <Sparkline values={[7, 7, 7, 7]} direction="flat" />
    );
    const path = container.querySelector('path');
    expect(path).not.toBeNull();
  });

  it('has aria-hidden on the SVG', () => {
    const { container } = render(
      <Sparkline values={[1, 2, 3]} direction="up" />
    );
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
