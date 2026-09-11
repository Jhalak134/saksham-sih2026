import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StepIdea } from '@/components/assessment/StepIdea';

function setup(value = '', onChange = vi.fn(), onContinue = vi.fn(), onSkip?: () => void) {
  render(
    <StepIdea
      value={value}
      onChange={onChange}
      onContinue={onContinue}
      onSkip={onSkip}
    />
  );
  return { onChange, onContinue };
}

describe('StepIdea — rendering', () => {
  it('renders the title and subtitle', () => {
    setup();
    expect(screen.getByText(/tell us about your business idea/i)).toBeInTheDocument();
    expect(screen.getByText(/describe it in plain language/i)).toBeInTheDocument();
  });

  it('renders the textarea', () => {
    setup();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the Continue button', () => {
    setup();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('renders all example suggestions', () => {
    setup();
    expect(screen.getByRole('button', { name: /dairy unit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tailoring shop/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retail store/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /food processing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agri services/i })).toBeInTheDocument();
  });

  it('shows character counter and helper when text is short', () => {
    setup('abc');
    expect(screen.getByText('3/300')).toBeInTheDocument();
    expect(screen.getByText(/enter at least 10 characters to continue/i)).toBeInTheDocument();
  });

  it('shows character counter when text is long enough', () => {
    setup('1234567890 this is a long enough idea');
    expect(screen.getByText('37/300')).toBeInTheDocument();
    expect(
      screen.queryByText(/enter at least 10 characters to continue/i)
    ).not.toBeInTheDocument();
  });
});

describe('StepIdea — CTA state', () => {
  it('Continue is disabled when value is empty', () => {
    setup('');
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('Continue is disabled when value has fewer than 10 chars', () => {
    setup('short');
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('Continue is enabled when value has >= 10 chars', () => {
    setup('1234567890');
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });
});

describe('StepIdea — interactions', () => {
  it('calls onChange when user types', async () => {
    const onChange = vi.fn();
    render(<StepIdea value="" onChange={onChange} onContinue={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'abc');
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange with prompt when an example chip is clicked', async () => {
    const onChange = vi.fn();
    render(<StepIdea value="" onChange={onChange} onContinue={vi.fn()} />);
    const dairyBtn = screen.getByRole('button', { name: /dairy unit/i });
    await userEvent.click(dairyBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining('dairy unit in my village')
    );
  });

  it('calls onSkip when skip link is clicked', async () => {
    const onSkip = vi.fn();
    render(
      <StepIdea
        value=""
        onChange={vi.fn()}
        onContinue={vi.fn()}
        onSkip={onSkip}
      />
    );
    const skipBtn = screen.getByRole('button', {
      name: /skip — i'll pick a category manually/i,
    });
    await userEvent.click(skipBtn);
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('calls onContinue when Continue is clicked and enabled', async () => {
    const onContinue = vi.fn();
    render(
      <StepIdea
        value="long enough idea here"
        onChange={vi.fn()}
        onContinue={onContinue}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('does not call onContinue when button is disabled', async () => {
    const onContinue = vi.fn();
    render(<StepIdea value="short" onChange={vi.fn()} onContinue={onContinue} />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('calls onContinue on Ctrl+Enter when canProceed is true', async () => {
    const onContinue = vi.fn();
    render(
      <StepIdea
        value="1234567890 long idea"
        onChange={vi.fn()}
        onContinue={onContinue}
      />
    );
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, '{Control>}{Enter}{/Control}');
    expect(onContinue).toHaveBeenCalled();
  });

  it('renders the voice input mic button and language toggles', async () => {
    render(<StepIdea value="" onChange={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByRole('button', { name: /start voice input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /हिन्दी/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument();
  });

  it('allows toggling between Hindi and English speech language', async () => {
    const user = userEvent.setup();
    render(<StepIdea value="" onChange={vi.fn()} onContinue={vi.fn()} />);
    const englishBtn = screen.getByRole('button', { name: /english/i });
    const hindiBtn = screen.getByRole('button', { name: /हिन्दी/i });

    await user.click(englishBtn);
    expect(screen.getByText('Speak')).toBeInTheDocument();

    await user.click(hindiBtn);
    expect(screen.getByText('बोलकर लिखें')).toBeInTheDocument();
  });
});


