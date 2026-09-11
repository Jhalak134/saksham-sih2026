import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CompareHeader } from '@/components/compare/CompareHeader';
import { CompareCard } from '@/components/compare/CompareCard';
import { TrendComparisonChart } from '@/components/compare/TrendComparisonChart';
import { CompareNextSteps } from '@/components/compare/CompareNextSteps';
import { CompareScreen } from '@/components/compare/CompareScreen';
import { getCategoryComparison } from '@/data/compareData';
import { ShellProvider } from '@/lib/shell-context';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('CompareHeader', () => {
  it('renders title, category comparison subheading, and description', () => {
    render(
      <CompareHeader
        title1="Dairy"
        title2="Food Processing"
        onClear={vi.fn()}
        hasComparison={true}
      />
    );
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Dairy vs Food Processing')).toBeInTheDocument();
    expect(
      screen.getByText('Compare key insights to choose the right opportunity for you.')
    ).toBeInTheDocument();
  });

  it('renders clear button when hasComparison is true and handles click', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <CompareHeader
        title1="Dairy"
        title2="Food Processing"
        onClear={onClear}
        hasComparison={true}
      />
    );
    const clearBtn = screen.getByText('Clear comparison');
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('hides clear button when hasComparison is false', () => {
    render(
      <CompareHeader
        title1="Dairy"
        title2="Food Processing"
        onClear={vi.fn()}
        hasComparison={false}
      />
    );
    expect(screen.queryByText('Clear comparison')).not.toBeInTheDocument();
  });
});

describe('CompareCard', () => {
  it('renders category info, metrics, badges, and setup cost', () => {
    const data = getCategoryComparison('Dairy');
    render(<CompareCard data={data} capital={100000} />);

    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('High demand')).toBeInTheDocument();
    expect(screen.getByText(/34%/)).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Good fit')).toBeInTheDocument();
    expect(screen.getByText('₹50,000 – ₹2,00,000')).toBeInTheDocument();
    expect(
      screen.getByText(/Consistent demand for milk and dairy products/)
    ).toBeInTheDocument();
  });

  it('renders different demand and budget badges properly', () => {
    const foodData = getCategoryComparison('Food Processing');
    render(<CompareCard data={foodData} capital={100000} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    const logisticsData = getCategoryComparison('Logistics');
    render(<CompareCard data={logisticsData} capital={100000} />);
    expect(screen.getByText('Needs loan')).toBeInTheDocument();

    const retailData = getCategoryComparison('Retail');
    render(<CompareCard data={retailData} capital={100000} />);
    expect(screen.getByText(/▼ 8%/)).toBeInTheDocument();
  });

  it('handles onSelect callback when chevron is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const data = getCategoryComparison('Dairy');
    render(<CompareCard data={data} capital={100000} onSelect={onSelect} />);

    const button = screen.getByLabelText('View details for Dairy');
    await user.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});

describe('TrendComparisonChart', () => {
  it('renders trend comparison header, legend, and SVG chart', () => {
    const dairy = getCategoryComparison('Dairy');
    const food = getCategoryComparison('Food Processing');
    render(
      <TrendComparisonChart
        category1={dairy.category}
        category2={food.category}
        series1={dairy.monthlyTrends}
        series2={food.monthlyTrends}
      />
    );

    expect(screen.getByText('Trend Comparison')).toBeInTheDocument();
    expect(
      screen.getByText('Market interest over time (relative index)')
    ).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Food Processing')).toBeInTheDocument();
  });

  it('allows changing time range filter', async () => {
    const user = userEvent.setup();
    const dairy = getCategoryComparison('Dairy');
    const food = getCategoryComparison('Food Processing');
    render(
      <TrendComparisonChart
        category1={dairy.category}
        category2={food.category}
        series1={dairy.monthlyTrends}
        series2={food.monthlyTrends}
      />
    );

    const select = screen.getByLabelText('Select comparison time range');
    await user.selectOptions(select, '6m');
    expect((select as HTMLSelectElement).value).toBe('6m');
  });

  it('shows tooltip on month hover and hides on mouse leave', () => {
    const dairy = getCategoryComparison('Dairy');
    const food = getCategoryComparison('Food Processing');
    const { container } = render(
      <TrendComparisonChart
        category1={dairy.category}
        category2={food.category}
        series1={dairy.monthlyTrends}
        series2={food.monthlyTrends}
      />
    );

    const hoverGroups = container.querySelectorAll('g.cursor-pointer');
    expect(hoverGroups.length).toBeGreaterThan(0);

    // Hover first month (Jan)
    fireEvent.mouseEnter(hoverGroups[0]);
    expect(screen.getByText('Jan 2026')).toBeInTheDocument();

    // Mouse leave
    fireEvent.mouseLeave(hoverGroups[0]);
    expect(screen.queryByText('Jan 2026')).not.toBeInTheDocument();
  });
});

describe('CompareNextSteps', () => {
  it('renders callout text and assessment links for both categories', () => {
    render(<CompareNextSteps category1="Dairy" category2="Food Processing" />);

    expect(screen.getByText('Ready to take the next step?')).toBeInTheDocument();
    expect(
      screen.getByText('Start a detailed assessment for one of these opportunities.')
    ).toBeInTheDocument();
    expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
    expect(screen.getByText('Start Food Processing Assessment')).toBeInTheDocument();
  });
});

describe('CompareScreen', () => {
  it('renders default Dairy vs Food Processing comparison', () => {
    mockSearchParams = new URLSearchParams();
    render(
      <ShellProvider>
        <CompareScreen />
      </ShellProvider>
    );

    expect(screen.getByText('Dairy vs Food Processing')).toBeInTheDocument();
    expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
    expect(screen.getByText('Start Food Processing Assessment')).toBeInTheDocument();
  });

  it('reads categories from search params if provided', () => {
    mockSearchParams = new URLSearchParams('c=Textiles&c=Agriculture');
    render(
      <ShellProvider>
        <CompareScreen />
      </ShellProvider>
    );

    expect(screen.getByText('Textiles vs Agriculture')).toBeInTheDocument();
    expect(screen.getByText('Start Textiles Assessment')).toBeInTheDocument();
    expect(screen.getByText('Start Agriculture Assessment')).toBeInTheDocument();
  });

  it('handles single category param with automatic second category', () => {
    mockSearchParams = new URLSearchParams('c=Retail');
    render(
      <ShellProvider>
        <CompareScreen />
      </ShellProvider>
    );

    expect(screen.getByText('Retail vs Dairy')).toBeInTheDocument();
  });

  it('allows clearing comparison, picking two categories, and resetting to default', async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams();
    render(
      <ShellProvider>
        <CompareScreen />
      </ShellProvider>
    );

    const clearBtn = screen.getByText('Clear comparison');
    await user.click(clearBtn);

    expect(screen.getByText('Select categories to compare')).toBeInTheDocument();
    expect(screen.getByText('+ Dairy')).toBeInTheDocument();

    // Select category 1
    await user.click(screen.getByText('+ Textiles'));
    expect(screen.getByText(/1 selected \(Textiles\)/)).toBeInTheDocument();

    // Select category 2
    await user.click(screen.getByText('+ Agriculture'));
    expect(screen.getByText('Textiles vs Agriculture')).toBeInTheDocument();

    // Clear and test reset button
    const clearBtn2 = screen.getByText('Clear comparison');
    await user.click(clearBtn2);

    const resetBtn = screen.getByText('Reset to Dairy vs Food Processing');
    await user.click(resetBtn);
    expect(screen.getByText('Dairy vs Food Processing')).toBeInTheDocument();
  });
});
