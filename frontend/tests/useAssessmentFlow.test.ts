import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessmentFlow } from '@/hooks/useAssessmentFlow';

const FULL_SESSION = {
  idea: 'I want to start a dairy unit in my village',
  category: 'Dairy',
  capital: 100000,
  locationId: 'loc_01',
  locationDisplay: 'Kheragarh, Agra',
};

describe('useAssessmentFlow — initial state', () => {
  it('starts on idea step', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    expect(result.current.currentStep).toBe('idea');
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(4);
  });

  it('pre-fills capital from argument', () => {
    const { result } = renderHook(() => useAssessmentFlow(75000));
    expect(result.current.session.capital).toBe(75000);
  });

  it('canProceed is false on idea step when idea is empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    expect(result.current.canProceed).toBe(false);
  });
});

describe('useAssessmentFlow — canProceed per step', () => {
  it('idea step: false when < 10 chars', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.updateSession({ idea: 'short' }));
    expect(result.current.canProceed).toBe(false);
  });

  it('idea step: true when >= 10 chars', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.updateSession({ idea: '1234567890' }));
    expect(result.current.canProceed).toBe(true);
  });

  it('details step: false when category empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession({ idea: '1234567890' }));
    act(() => result.current.next());
    expect(result.current.canProceed).toBe(false);
  });

  it('details step: false when capital is 0', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.updateSession({ idea: '1234567890' }));
    act(() => result.current.next());
    act(() => result.current.updateSession({ category: 'Dairy' }));
    expect(result.current.canProceed).toBe(false);
  });

  it('details step: true when category and capital filled', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession({ idea: '1234567890' }));
    act(() => result.current.next());
    act(() => result.current.updateSession({ category: 'Dairy' }));
    expect(result.current.canProceed).toBe(true);
  });

  it('location step: false when no location selected', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession({ idea: '1234567890', category: 'Dairy' }));
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.canProceed).toBe(false);
  });

  it('location step: true when locationId filled', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession({ idea: '1234567890', category: 'Dairy' }));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.updateSession({ locationId: 'loc_01', locationDisplay: 'Kheragarh, Agra' }));
    expect(result.current.canProceed).toBe(true);
  });

  it('review step: true when all fields complete', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession(FULL_SESSION));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.currentStep).toBe('review');
    expect(result.current.canProceed).toBe(true);
  });
});

describe('useAssessmentFlow — navigation', () => {
  it('next() advances step', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.next());
    expect(result.current.stepIndex).toBe(1);
  });

  it('back() retreats step', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.next());
    act(() => result.current.back());
    expect(result.current.stepIndex).toBe(0);
  });

  it('back() does not go below 0', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.back());
    expect(result.current.stepIndex).toBe(0);
  });

  it('next() does not exceed last step index', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    for (let i = 0; i < 10; i++) act(() => result.current.next());
    expect(result.current.stepIndex).toBe(3);
  });
});

describe('useAssessmentFlow — updateSession', () => {
  it('merges partial patch into session', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession({ idea: 'Hello world test!' }));
    expect(result.current.session.idea).toBe('Hello world test!');
    expect(result.current.session.capital).toBe(100000);
  });
});

describe('useAssessmentFlow — isComplete()', () => {
  it('idea: false when empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    expect(result.current.isComplete('idea')).toBe(false);
  });

  it('idea: true when >= 10 chars', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.updateSession({ idea: 'long enough idea here' }));
    expect(result.current.isComplete('idea')).toBe(true);
  });

  it('details: false when category missing', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    expect(result.current.isComplete('details')).toBe(false);
  });

  it('details: true when category and capital set', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession({ category: 'Dairy' }));
    expect(result.current.isComplete('details')).toBe(true);
  });

  it('location: false when locationId empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    expect(result.current.isComplete('location')).toBe(false);
  });

  it('location: true when locationId set', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() => result.current.updateSession({ locationId: 'loc_01', locationDisplay: 'X, Y' }));
    expect(result.current.isComplete('location')).toBe(true);
  });

  it('review: false when any field missing', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    expect(result.current.isComplete('review')).toBe(false);
  });

  it('review: true when all fields complete', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession(FULL_SESSION));
    expect(result.current.isComplete('review')).toBe(true);
  });
});
