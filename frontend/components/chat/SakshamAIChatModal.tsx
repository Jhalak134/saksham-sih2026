// components/chat/SakshamAIChatModal.tsx
// Interactive Conversational AI Assistant Modal for SAKSHAM.
// Deeply connected to the ai/ folder knowledge base (PMFME, Dairy Pre-Feasibility,
// MANAGE Handbook, Mathura MSME profile), Census 2011 demographics, and SIH #91 architecture.

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Bot,
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
} from 'lucide-react';
import { querySakshamAI, type AIAdvisoryResult, type AICitation } from '@/lib/aiKnowledgeBase';
import { useShell } from '@/lib/shell-context';
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

const QUICK_PROMPTS = [
  { label: '🥛 Dairy Plant Feasibility (ai/doc)', query: 'What are the setup costs and machinery for a 500 LPD yogurt plant from the dairy pre-feasibility study?' },
  { label: '💰 10% Margin & 90% Loan', query: 'How does the statutory 10% borrower equity margin and 90% bank loan work in SAKSHAM?' },
  { label: '📋 PMFME 35% Subsidy', query: 'What subsidies and capital grants are available under the PMFME scheme?' },
  { label: '📍 Mathura Pilot & Catchments', query: 'Tell me about the Mathura MSME industrial profile and village catchments like Kamar and Chhata.' },
  { label: '📊 Census 2011 & ODOP', query: 'What real Census 2011 demographics and ODOP data does SAKSHAM provide for Uttar Pradesh and other states?' },
  { label: '🎯 4-Factor Fit Score', query: 'How does SAKSHAM calculate the 4-factor feasibility score (Market, Competition, Capital, Infrastructure)?' },
];

const INITIAL_AI_GREETING: ChatMessage = {
  id: 'greeting-001',
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
  const { setBrowsingLocation } = useShell();

  const [messages, setMessages] = useState<readonly ChatMessage[]>([INITIAL_AI_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input on open
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      setIsLoading(true);

      try {
        const result: AIAdvisoryResult = await querySakshamAI(clean);

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
          text: 'I encountered an error retrieving information. However, SAKSHAM operates under SIH #91 guidelines with a 10% borrower equity margin and 90% debt financing structure.',
          timestamp: new Date(),
          grounding_status: 'domain_knowledge',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
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
    setMessages([INITIAL_AI_GREETING]);
  };

  const handleLaunchAssessment = (idea: string) => {
    onClose();
    router?.push(`/new-assessment?idea=${encodeURIComponent(idea)}`);
  };

  const handleExploreLocation = (location: string) => {
    setBrowsingLocation(location);
    onClose();
    router?.push('/discover');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saksham-chat-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl h-[88vh] max-h-[780px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/90 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <Bot size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="saksham-chat-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                  SAKSHAM AI Assistant
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ai/ Knowledge Base Live
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Connected to source pre-feasibility reports, Census 2011, and SIH #91 architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear Conversation"
              aria-label="Clear chat history"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close modal"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

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
                  Consulting ai/ knowledge base & Census 2011 data...
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
            Quick SAKSHAM Knowledge Topics:
          </div>
          <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1 no-scrollbar">
            {QUICK_PROMPTS.map((qp, idx) => (
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
              placeholder="Ask anything about SAKSHAM, business setup, PMFME, Mathura, Census 2011..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
              aria-label="Ask SAKSHAM AI a question"
            />

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
            <span>Powered by SAKSHAM AI Knowledge Engine · Smart India Hackathon #91</span>
            <span>Press Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
