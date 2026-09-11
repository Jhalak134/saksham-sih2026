import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CategoryIcon } from '@/components/assessment/CategoryIcon';
import { CATEGORIES, type Category } from '@/lib/constants';

describe('CategoryIcon', () => {
  it.each(CATEGORIES)('renders an icon for category: %s', (category) => {
    const { container } = render(
      <CategoryIcon category={category as Category} />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('applies custom size prop', () => {
    const { container } = render(<CategoryIcon category="Dairy" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CategoryIcon category="Retail" className="test-class" />
    );
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('test-class')).toBe(true);
  });
});
