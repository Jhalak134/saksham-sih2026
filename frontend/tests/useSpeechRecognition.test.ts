// tests/useSpeechRecognition.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

describe('useSpeechRecognition hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects when SpeechRecognition is unsupported gracefully', () => {
    // Ensure no window.SpeechRecognition
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isListening).toBe(false);
    expect(result.current.language).toBe('hi-IN');
  });

  it('allows changing speech language between Hindi and English', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.language).toBe('hi-IN');

    act(() => {
      result.current.setLanguage('en-IN');
    });
    expect(result.current.language).toBe('en-IN');

    act(() => {
      result.current.setLanguage('hi-IN');
    });
    expect(result.current.language).toBe('hi-IN');
  });

  it('starts and stops speech recognition when SpeechRecognition mock is present', () => {
    const mockStart = vi.fn();
    const mockStop = vi.fn();
    const mockAbort = vi.fn();

    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      start = mockStart;
      stop = mockStop;
      abort = mockAbort;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onresult: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
    }

    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);

    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);

    act(() => {
      result.current.startListening();
    });

    expect(mockStart).toHaveBeenCalled();

    act(() => {
      result.current.stopListening();
    });
    expect(mockStop).toHaveBeenCalled();
  });
});
