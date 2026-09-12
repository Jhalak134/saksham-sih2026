// hooks/useSpeechRecognition.ts
// Speech-to-text hook supporting both English (en-IN) and Hindi (hi-IN) via Web Speech API.

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type SpeechLanguage =
  | 'en-IN'
  | 'hi-IN'
  | 'mr-IN'
  | 'ta-IN'
  | 'te-IN'
  | string;

export function languageCodeToSpeechLang(code: string): SpeechLanguage {
  switch (code) {
    case 'hi':
      return 'hi-IN';
    case 'mr':
      return 'mr-IN';
    case 'ta':
      return 'ta-IN';
    case 'te':
      return 'te-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

export interface UseSpeechRecognitionOptions {
  readonly initialLanguage?: SpeechLanguage;
  readonly onTranscriptChange?: (text: string) => void;
  readonly onFinalChunk?: (chunk: string) => void;
}

export interface UseSpeechRecognitionResult {
  readonly isListening: boolean;
  readonly transcript: string;
  readonly interimTranscript: string;
  readonly isSupported: boolean;
  readonly language: SpeechLanguage;
  readonly setLanguage: (lang: SpeechLanguage) => void;
  readonly startListening: () => void;
  readonly stopListening: () => void;
  readonly toggleListening: () => void;
  readonly resetTranscript: () => void;
  readonly error: string | null;
}

// Browser interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeechRecognition({
  initialLanguage = 'hi-IN',
  onTranscriptChange,
  onFinalChunk,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [language, setLanguageState] = useState<SpeechLanguage>(initialLanguage);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onFinalChunkRef = useRef(onFinalChunk);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    onFinalChunkRef.current = onFinalChunk;
  }, [onFinalChunk]);

  useEffect(() => {
    setLanguageState(initialLanguage);
  }, [initialLanguage]);

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognitionClass));
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError('Speech recognition is not supported in this browser. Please try Chrome, Edge or Safari.');
      return;
    }

    setError(null);
    isManuallyStoppedRef.current = false;

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignored
      }
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptPiece = result[0]?.transcript || '';
          if (result.isFinal) {
            finalChunk += transcriptPiece;
          } else {
            interimChunk += transcriptPiece;
          }
        }

        if (finalChunk) {
          const cleanFinal = finalChunk.trim();
          setTranscript((prev) => {
            const next = prev ? `${prev} ${cleanFinal}` : cleanFinal;
            if (onTranscriptChangeRef.current) {
              onTranscriptChangeRef.current(next);
            }
            return next;
          });
          if (onFinalChunkRef.current) {
            onFinalChunkRef.current(cleanFinal);
          }
        }
        setInterimTranscript(interimChunk);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal when user pauses; keep listening or report gently
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else {
          setError(`Speech recognition error: ${event.error || 'unknown'}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (!isManuallyStoppedRef.current && isListening) {
          // Restart if ended unexpectedly while still supposed to be listening
          try {
            recognition.start();
            return;
          } catch {
            // Ignored
          }
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setError(err?.message || 'Could not start speech recognition');
      setIsListening(false);
    }
  }, [language, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const setLanguage = useCallback((newLang: SpeechLanguage) => {
    setLanguageState(newLang);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.lang = newLang;
      } catch {
        // Ignored
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignored
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    language,
    setLanguage,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    error,
  };
}
