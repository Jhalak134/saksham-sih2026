import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessmentFlow } from '@/hooks/useAssessmentFlow';

const FULL_SESSION = {
  idea: 'I want to start a dairy unit in my village',
  category: 'Dairy',
  capital: 100000,
  locationId: 'loc_07',
  locationDisplay: 'Vrindavan, Mathura',
};

describe('useAssessmentFlow — initial state', () => {
  it('starts on location step', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    expect(result.current.currentStep).toBe('location');
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(4);
  });

  it('pre-fills capital from argument', () => {
    const { result } = renderHook(() => useAssessmentFlow(75000));
    expect(result.current.session.capital).toBe(75000);
  });

  it('canProceed is false on location step when location is empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    expect(result.current.canProceed).toBe(false);
  });
});

describe('useAssessmentFlow — canProceed per step', () => {
  it('location step: false when no location selected', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    expect(result.current.canProceed).toBe(false);
  });

  it('location step: false when non-Mathura location selected', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_01',
        locationDisplay: 'Kheragarh, Agra',
      })
    );
    expect(result.current.canProceed).toBe(false);
  });

  it('location step: true when Mathura location selected', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
      })
    );
    expect(result.current.canProceed).toBe(true);
  });

  it('idea step: false when < 10 chars', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
      })
    );
    act(() => result.current.next());
    expect(result.current.currentStep).toBe('idea');
    act(() => result.current.updateSession({ idea: 'short' }));
    expect(result.current.canProceed).toBe(false);
  });

  it('idea step: true when >= 10 chars', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
      })
    );
    act(() => result.current.next());
    act(() => result.current.updateSession({ idea: '1234567890' }));
    expect(result.current.canProceed).toBe(true);
  });

  it('details step: false when category empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
        idea: '1234567890',
      })
    );
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.currentStep).toBe('details');
    expect(result.current.canProceed).toBe(false);
  });

  it('details step: false when capital is 0', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
        idea: '1234567890',
      })
    );
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.updateSession({ category: 'Dairy' }));
    expect(result.current.canProceed).toBe(false);
  });

  it('details step: true when category and capital filled', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
        idea: '1234567890',
      })
    );
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.updateSession({ category: 'Dairy' }));
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
  it('location: false when locationId empty', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    expect(result.current.isComplete('location')).toBe(false);
  });

  it('location: false when location is not in Mathura', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_01',
        locationDisplay: 'Kheragarh, Agra',
      })
    );
    expect(result.current.isComplete('location')).toBe(false);
  });

  it('location: true when Mathura location is set', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    act(() =>
      result.current.updateSession({
        locationId: 'loc_07',
        locationDisplay: 'Vrindavan, Mathura',
      })
    );
    expect(result.current.isComplete('location')).toBe(true);
  });

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

  it('review: false when any field missing or not in Mathura', () => {
    const { result } = renderHook(() => useAssessmentFlow(0));
    expect(result.current.isComplete('review')).toBe(false);
  });

  it('review: true when all fields complete including Mathura location', () => {
    const { result } = renderHook(() => useAssessmentFlow(100000));
    act(() => result.current.updateSession(FULL_SESSION));
    expect(result.current.isComplete('review')).toBe(true);
  });
});
