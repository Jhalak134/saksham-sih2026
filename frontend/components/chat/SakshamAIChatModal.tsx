// components/chat/SakshamAIChatModal.tsx
// Interactive Conversational AI Assistant Modal for SAKSHAM.
// Deeply connected to the ai/ folder knowledge base (PMFME, Dairy Pre-Feasibility,
// MANAGE Handbook, Mathura MSME profile), Census 2011 demographics, and SIH #91 architecture.
// Full Multilingual Support (English, हिन्दी, मराठी, தமிழ், తెలుగు), Voice Dictation & Gemini API Key.

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Briefcase,
  Layers,
  Database,
  Mic,
  MicOff,
  Globe,
  Key,
  Check,
} from 'lucide-react';
import { querySakshamAI, type AIAdvisoryResult, type AICitation } from '@/lib/aiKnowledgeBase';
import { useSpeechRecognition, languageCodeToSpeechLang } from '@/hooks/useSpeechRecognition';
import { useShell } from '@/lib/shell-context';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface ChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'ai';
  readonly text: string;
  readonly timestamp: Date;
  readonly key_points?: readonly string[];
  readonly citations?: readonly AICitation[];
  readonly limitations?: readonly string[];
  readonly warnings?: readonly string[];
  readonly suggested_idea?: string;
  readonly suggested_location?: string;
  readonly grounding_status?: 'fully_grounded' | 'partially_grounded' | 'domain_knowledge' | 'invalid_input';
}

export interface SakshamAIChatModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialQuery?: string;
}

const QUICK_PROMPTS_BY_LANG: Record<string, Array<{ label: string; query: string }>> = {
  hi: [
    { label: '🥛 500L डेयरी व दही इकाई', query: '500 एलपीडी दही और डेयरी इकाई स्थापित करने की लागत और मशीनरी क्या है?' },
    { label: '💰 10% मार्जिन व 90% लोन', query: 'सक्षम में 10% उद्यमी मार्जिन और 90% बैंक ऋण कैसे काम करता है?' },
    { label: '📋 PMFME 35% सब्सिडी', query: 'PMFME योजना के तहत 35% पूंजीगत सब्सिडी कैसे मिलती है?' },
    { label: '📍 मथुरा पायलट क्लस्टर', query: 'मथुरा छाता और कामर क्षेत्र में व्यापार के क्या अवसर हैं?' },
    { label: '🏪 किराना दुकान शुरुआत', query: 'गाँव में किराना दुकान शुरू करने के लिए कितना खर्च और पूंजी चाहिए?' },
  ],
  mr: [
    { label: '🥛 दुग्ध प्रक्रिया प्रकल्प', query: '500 लिटर दही व दुग्ध प्रक्रिया प्रकल्पाचा खर्च आणि मशिनरी काय आहे?' },
    { label: '💰 10% स्वतःचे भांडवल & 90% कर्ज', query: '10% स्वतःचे भांडवल आणि 90% बँक कर्ज योजना कशी काम करते?' },
    { label: '📋 PMFME 35% अनुदान', query: 'PMFME योजनेअंतर्गत 35% भांडवली अनुदान कसे मिळते?' },
  ],
  ta: [
    { label: '🥛 பால் பதப்படுத்தும் பிரிவு', query: '500 லிட்டர் பால் மற்றும் தயிர் தயாரிப்பு பிரிவு அமைப்பதற்கான செலவு என்ன?' },
    { label: '💰 10% முதலீடு & 90% கடன்', query: '10% சொந்த முதலீடு மற்றும் 90% வங்கி கடன் எவ்வாறு செயல்படுகிறது?' },
    { label: '📋 PMFME 35% மானியம்', query: 'PMFME திட்டத்தின் கீழ் 35% அரசு மானியம் பெறுவது எப்படி?' },
  ],
  te: [
    { label: '🥛 పాడి & పెరుగు యూనిట్', query: '500 లీటర్ల పెరుగు ప్రాసెసింగ్ యూనిట్ ఏర్పాటుకు ఖర్చు మరియు యంత్రాల వివరాలు ఏమిటి?' },
    { label: '💰 10% పెట్టుబడి & 90% రుణం', query: '10% సొంత పెట్టుబడి మరియు 90% బ్యాంక్ రుణం ఎలా పనిచేస్తుంది?' },
    { label: '📋 PMFME 35% సబ్సిడీ', query: 'PMFME పథకం కింద 35% సబ్సిడీ ఎలా పొందాలి?' },
  ],
  en: [
    { label: '🥛 Dairy Plant Feasibility (ai/doc)', query: 'What are the setup costs and machinery for a 500 LPD yogurt plant from the dairy pre-feasibility study?' },
    { label: '💰 10% Margin & 90% Loan', query: 'How does the statutory 10% borrower equity margin and 90% bank loan work in SAKSHAM?' },
    { label: '📋 PMFME 35% Subsidy', query: 'What subsidies and capital grants are available under the PMFME scheme?' },
    { label: '📍 Mathura Pilot & Catchments', query: 'Tell me about the Mathura MSME industrial profile and village catchments like Kamar and Chhata.' },
    { label: '📊 Census 2011 & ODOP', query: 'What real Census 2011 demographics and ODOP data does SAKSHAM provide for Uttar Pradesh and other states?' },
    { label: '🎯 4-Factor Fit Score', query: 'How does SAKSHAM calculate the 4-factor feasibility score (Market, Competition, Capital, Infrastructure)?' },
  ],
};

function buildGreetingMessage(language: string): ChatMessage {
  if (language === 'hi') {
    return {
      id: 'greeting-hi',
      sender: 'ai',
      text: 'नमस्ते! मैं सक्षम AI हूँ, आपका ग्रामीण व्यावसायिक सलाहकार। मैं सीधे परियोजना ज्ञानकोष (ai/ नॉलेज बेस), जनगणना 2011 और SIH #91 आर्किटेक्चर से जुड़ा हुआ हूँ:\n\n• **डेयरी प्री-फिजिबिलिटी रिपोर्ट (`dairy_yogurt_plant_project_report`)**: 500 लीटर दही इकाई, ₹3.5 लाख से ₹5 लाख लागत, 22%–32% मुनाफा।\n• **PMFME योजना मार्गदर्शिका (`pmfme_scheme_guidelines`)**: 35% पूंजीगत सब्सिडी (अधिकतम ₹10 लाख), 10% उद्यमी मार्जिन।\n• **मथुरा जिला एमएसएमई प्रोफाइल (`mathura_district_industrial_profile`)**: छाता एग्रो-कॉरिडोर, कामर और शेरगढ़ क्लस्टर।\n• **SIH #91 वित्तीय संरचना**: 10% स्वयं की बचत + 90% प्राथमिकता बैंक ऋण।\n\nआप मुझसे व्यवसाय शुरू करने, ऋण और सरकारी सब्सिडी के बारे में कुछ भी पूछ सकते हैं।',
      timestamp: new Date(),
      key_points: [
        'डेयरी, किराना या खाद्य प्रसंस्करण लागत और मुनाफे के बारे में पूछें',
        '10% अपनी पूँजी और 90% बैंक ऋण की प्रक्रिया जानें',
        'सरकारी सब्सिडी (PMFME, PMEGP, मुद्रा) की जानकारी प्राप्त करें',
      ],
      grounding_status: 'fully_grounded',
    };
  }

  if (language === 'mr') {
    return {
      id: 'greeting-mr',
      sender: 'ai',
      text: 'नमस्कार! मी सक्षम AI आहे, तुमचा व्यवसाय सल्लागार:\n\n• **दुग्ध प्रक्रिया अहवाल (`dairy_yogurt_plant_project_report`)**: 500 लिटर दही प्रकल्प, 10% स्वतःचे भांडवल.\n• **PMFME योजना (`pmfme_scheme_guidelines`)**: 35% भांडवली अनुदान.\n• **मथुरा औद्योगिक प्रोफाइल (`mathura_district_industrial_profile`)**: छाता क्लस्टर.\n• **SIH #91 रचना**: 10% स्वतःचे भांडवल आणि 90% बँक कर्ज.\n\nमी तुम्हाला कशी मदत करू शकतो?',
      timestamp: new Date(),
      grounding_status: 'fully_grounded',
    };
  }

  // English default (preserves all key test phrases)
  return {
    id: 'greeting-en',
    sender: 'ai',
    text: 'Hello! I am SAKSHAM AI, your enterprise decision-support chatbot. I am deeply connected to the project knowledge base, source reports, and official demographic data:\n\n• **Dairy Pre-Feasibility Study (`ai/knowledge_base/dairy_yogurt_plant_project_report`)**: 500 LPD plant, ₹3.5L–₹5L Capex, equipment specs, 22%–32% gross margins.\n• **PMFME Scheme Guidelines (`ai/knowledge_base/pmfme_scheme_guidelines`)**: 35% capital subsidy up to ₹10L, ₹40k SHG seed capital, 10% borrower equity.\n• **Mathura MSME Industrial Profile (`ai/knowledge_base/mathura_district_industrial_profile`)**: Chhata agro-corridor, Kamar, Shergarh Bangar, Peda sweets & brass clusters.\n• **MANAGE Agribusiness Guide (`ai/knowledge_base/manual_entrepreneurship_development`)**: 30-day cash buffer, FSSAI/Udyam statutory licensing.\n• **Official Census 2011 Demographics & ODOP v32**: Verified baseline populations and products across all 34 states/UTs.\n• **SIH #91 Architecture**: 10% equity margin, 90% debt financing, and 4-factor composite feasibility scoring.\n\nHow can I help you plan, evaluate, or finance your enterprise today?',
    timestamp: new Date(),
    key_points: [
      'Ask about Capex, machinery & margins for Dairy, Kirana, or Agro-processing units',
      'Inquire about government subsidies (PMFME, PMEGP, Mudra)',
      'Explore Mathura pilot village catchments and industrial clusters',
      'Learn how SAKSHAM calculates explainable feasibility scores',
    ],
    grounding_status: 'fully_grounded',
  };
}

export function SakshamAIChatModal({
  isOpen,
  onClose,
  initialQuery,
}: SakshamAIChatModalProps): React.JSX.Element | null {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    router = null;
  }
  const { setBrowsingLocation, language, setLanguage } = useShell();

  const [messages, setMessages] = useState<readonly ChatMessage[]>(() => [buildGreetingMessage(language)]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const baseInputRef = useRef<string>('');

  // Load Gemini key from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saksham_gemini_api_key') || '';
      setGeminiApiKey(saved);
      setKeyInput(saved);
    }
  }, []);

  // Update initial greeting if user changes language and no conversation has occurred yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'ai') {
        return [buildGreetingMessage(language)];
      }
      return prev;
    });
  }, [language]);

  // Voice speech recognition hook
  const handleSpeechResult = useCallback((fullTranscript: string) => {
    const base = baseInputRef.current.trim();
    const speech = fullTranscript.trim();
    const combined = base ? `${base} ${speech}` : speech;
    setInputText(combined);
  }, []);

  const {
    isListening,
    toggleListening,
    resetTranscript,
    isSupported: isSpeechSupported,
    error: speechError,
  } = useSpeechRecognition({
    initialLanguage: languageCodeToSpeechLang(language),
    onTranscriptChange: handleSpeechResult,
  });

  const handleToggleVoice = useCallback(() => {
    if (!isListening) {
      baseInputRef.current = inputText;
      resetTranscript();
    }
    toggleListening();
  }, [isListening, inputText, resetTranscript, toggleListening]);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isKeyModalOpen) {
      scrollToBottom();
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isKeyModalOpen, messages, scrollToBottom]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        if (isKeyModalOpen) {
          setIsKeyModalOpen(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isKeyModalOpen, onClose]);

  // Execute a user query
  const handleSend = useCallback(
    async (queryToSend: string) => {
      const clean = queryToSend.trim();
      if (!clean || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        sender: 'user',
        text: clean,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      baseInputRef.current = '';
      setIsLoading(true);

      try {
        const result: AIAdvisoryResult = await querySakshamAI(clean, language, geminiApiKey);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random()}`,
          sender: 'ai',
          text: result.answer,
          timestamp: new Date(),
          key_points: result.key_points,
          citations: result.citations,
          limitations: result.limitations,
          warnings: result.warnings,
          suggested_idea: result.suggested_idea,
          suggested_location: result.suggested_location,
          grounding_status: result.grounding_status,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text:
            language === 'hi'
              ? 'जानकारी प्राप्त करने में त्रुटि हुई। हालांकि, सक्षम SIH #91 के तहत 10% उद्यमी मार्जिन और 90% ऋण संरचना पर संचालित होता है।'
              : 'I encountered an error retrieving information. However, SAKSHAM operates under SIH #91 guidelines with a 10% borrower equity margin and 90% debt financing structure.',
          timestamp: new Date(),
          grounding_status: 'domain_knowledge',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, language, geminiApiKey]
  );

  // If initialQuery is passed when opened, trigger it once
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim().length > 0 && !hasProcessedInitialQuery) {
      setHasProcessedInitialQuery(true);
      void handleSend(initialQuery.trim());
    }
  }, [isOpen, initialQuery, hasProcessedInitialQuery, handleSend]);

  // Reset initial query flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasProcessedInitialQuery(false);
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    setMessages([buildGreetingMessage(language)]);
    setInputText('');
    baseInputRef.current = '';
  };

  const handleLaunchAssessment = (ideaName: string) => {
    onClose();
    if (router) {
      router.push(`/new-assessment?idea=${encodeURIComponent(ideaName)}`);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/new-assessment?idea=${encodeURIComponent(ideaName)}`;
    }
  };

  const handleExploreLocation = (locName: string) => {
    onClose();
    setBrowsingLocation(locName);
    if (router) {
      router.push('/discover');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/discover';
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = keyInput.trim();
    setGeminiApiKey(clean);
    if (typeof window !== 'undefined') {
      if (clean) {
        localStorage.setItem('saksham_gemini_api_key', clean);
      } else {
        localStorage.removeItem('saksham_gemini_api_key');
      }
    }
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 2000);
    setIsKeyModalOpen(false);
  };

  const handleRemoveKey = () => {
    setGeminiApiKey('');
    setKeyInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saksham_gemini_api_key');
    }
    setIsKeyModalOpen(false);
  };

  const quickPrompts = useMemo(() => {
    return QUICK_PROMPTS_BY_LANG[language] || QUICK_PROMPTS_BY_LANG.en;
  }, [language]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saksham-chat-title"
      className="fixed inset-0 z-[45] flex flex-col bg-[#F8FAFC] animate-in fade-in duration-200 md:pl-[var(--sidebar-width)] overflow-hidden"
    >
      <div className="relative flex flex-col w-full h-full bg-white overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-200/90 bg-gradient-to-r from-slate-900 via-slate-800 to-[#00284D] text-white shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="SAKSHAM"
              className="h-8 w-8 object-contain shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="saksham-chat-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                  SAKSH<span className="text-[#FBAC05]">AM</span> AI Assistant
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ai/ Knowledge Base Live
                </span>

                {/* Interactive Assistant Language Selector */}
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-400/40">
                  <Globe size={11} className="text-amber-300 shrink-0" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    aria-label="Select Assistant Language"
                    className="bg-transparent text-[11px] font-bold text-amber-300 focus:outline-none cursor-pointer [&>option]:text-slate-900"
                  >
                    {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Connected to source pre-feasibility reports, Census 2011, and SIH #91 architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Optional Gemini API Key button */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              title="Configure Google Gemini API Key"
              aria-label="Configure Gemini API Key"
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer border',
                geminiApiKey
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20 hover:text-white'
              )}
            >
              <Key size={12} className={geminiApiKey ? 'text-amber-400' : 'text-slate-400'} />
              <span className="hidden md:inline">{geminiApiKey ? 'Gemini Active' : 'Gemini Key'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear Conversation"
              aria-label="Clear chat history"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close modal"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer border border-white/20 shadow-xs"
            >
              <span>Close</span>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Optional Gemini Key Modal */}
        {isKeyModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                    <Key size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google Gemini API Key</h3>
                    <p className="text-[11px] text-slate-500">Optional: Enables live Gemini 1.5 Flash responses</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveKey} className="mt-4 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your Google Gemini API key to unlock dynamic multilingual intelligence. Even without a key, SAKSHAM uses its built-in full knowledge engine for all 5 languages.
                </p>
                <div>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {geminiApiKey && (
                    <button
                      type="button"
                      onClick={handleRemoveKey}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove Key
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-[92%] sm:max-w-[85%]',
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs',
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-emerald-700 shadow-2xs'
                )}
              >
                {msg.sender === 'user' ? 'You' : <Sparkles size={15} />}
              </div>

              {/* Bubble Body */}
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs',
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : msg.grounding_status === 'invalid_input'
                    ? 'bg-amber-50/40 text-slate-800 border border-amber-200/90 rounded-tl-xs space-y-2'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs space-y-2.5'
                )}
              >
                {msg.grounding_status === 'invalid_input' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300/80 w-fit">
                    <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                    <span>Input Not Recognized</span>
                  </div>
                )}

                {/* Main Text Content */}
                <div className="whitespace-pre-line">
                  {msg.text}
                </div>

                {/* Key Points / Structured Takeaways */}
                {msg.key_points && msg.key_points.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      Key Specifications & Findings:
                    </span>
                    <ul className="space-y-1 pl-1">
                      {msg.key_points.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Citations from ai/ knowledge base */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                      <FileText size={11} className="text-slate-400" />
                      Knowledge Citations (ai/ folder):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-mono text-slate-700 border border-slate-200/80"
                        >
                          <Database size={10} className="text-emerald-600" />
                          <span className="font-semibold text-slate-900">{c.document_id}</span>
                          {c.page_start && (
                            <span className="text-slate-500">
                              (p.{c.page_start}{c.page_end ? `-${c.page_end}` : ''})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Shortcuts */}
                {(msg.suggested_idea || msg.suggested_location) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.suggested_idea && (
                      <button
                        type="button"
                        onClick={() => handleLaunchAssessment(msg.suggested_idea!)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70 transition-colors cursor-pointer"
                      >
                        <Briefcase size={12} />
                        <span>Start Assessment for {msg.suggested_idea}</span>
                        <ArrowRight size={11} />
                      </button>
                    )}

                    {msg.suggested_location && (
                      <button
                        type="button"
                        onClick={() => handleExploreLocation(msg.suggested_location!)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer"
                      >
                        <MapPin size={12} />
                        <span>Explore {msg.suggested_location} in Discover</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                )}

                {/* Warnings / Limitations */}
                {msg.warnings && msg.warnings.length > 0 && (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800 border border-amber-200/70 flex items-start gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>{msg.warnings.join(' ')}</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-emerald-700 shadow-2xs">
                <Sparkles size={15} className="animate-spin text-emerald-600" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200 text-slate-600 text-xs flex items-center gap-2 shadow-2xs">
                <span className="flex space-x-1">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" />
                </span>
                <span className="font-medium text-slate-700">
                  {language === 'hi'
                    ? 'ज्ञानकोष और आंकड़ों की जाँच हो रही है...'
                    : 'Consulting ai/ knowledge base & Census 2011 data...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="border-t border-slate-200 bg-white px-4 py-2.5 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
            <Layers size={10} />
            {language === 'hi' ? 'त्वरित विषय (क्लिक करें):' : 'Quick SAKSHAM Knowledge Topics:'}
          </div>
          <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1 no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void handleSend(qp.query)}
                disabled={isLoading}
                className="shrink-0 rounded-full bg-slate-100 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 px-3 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/80 transition-all cursor-pointer disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Listening Banner */}
        {isListening && (
          <div className="px-4 py-1.5 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-700 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
              <span className="font-semibold">
                Listening in {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'your language'}... Speak now
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoice}
              className="text-[11px] font-bold underline cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center gap-1.5">
            <AlertTriangle size={13} className="shrink-0 text-amber-600" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Input Form */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend(inputText);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'व्यवसाय, लागत, बैंक लोन, PMFME, या गाँव की जानकारी के बारे में पूछें...'
                  : 'Ask anything about SAKSHAM, business setup, PMFME, Mathura, Census 2011...'
              }
              disabled={isLoading}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
              aria-label="Ask SAKSHAM AI a question"
            />

            {/* Voice Dictation Button */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={handleToggleVoice}
                aria-label={isListening ? 'Stop voice recording' : 'Speak your query'}
                title={
                  isListening
                    ? 'Stop listening'
                    : `Speak in ${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'your language'}`
                }
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all cursor-pointer shadow-2xs',
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                )}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} className="text-emerald-700" />}
              </button>
            )}

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              aria-label="Send query"
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all cursor-pointer',
                inputText.trim() && !isLoading
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Send size={14} strokeWidth={2.2} />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span>
              {geminiApiKey ? '✨ Powered by Google Gemini AI & SAKSHAM Knowledge Engine' : 'Powered by SAKSHAM AI Knowledge Engine · Smart India Hackathon #91'}
            </span>
            <span>Press Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
