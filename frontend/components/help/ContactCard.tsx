// components/help/ContactCard.tsx
'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

const MAX_MESSAGE_LENGTH = 500;

export function ContactCard(): React.JSX.Element {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
    setMessage('');
    window.setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  }

  return (
    <section
      aria-labelledby="contact-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-6">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800"
          aria-hidden="true"
        >
          <Mail size={20} strokeWidth={2} />
        </div>
        <div>
          <h2
            id="contact-heading"
            className="text-sm sm:text-base font-bold text-slate-900"
          >
            Still need help?
          </h2>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500">
            We&apos;re here to support you. Share your question or feedback and we&apos;ll get back to you.
          </p>
          <p className="sm:hidden text-xs text-slate-500">
            We&apos;re here to support you.
          </p>
        </div>
      </div>

      {/* Success alert */}
      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-900 shadow-2xs animate-in fade-in"
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>Thank you! Your feedback has been submitted successfully.</span>
        </div>
      )}

      {/* Content Form & Email Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Email support card */}
        <div className="lg:col-span-4 flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 shadow-2xs">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 mt-0.5 shadow-2xs"
            aria-hidden="true"
          >
            <Mail size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email us at
            </span>
            <a
              href="mailto:support@saksham.app"
              className="mt-0.5 block text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors break-all focus:outline-none focus:underline"
            >
              support@saksham.app
            </a>
            <p className="mt-1 text-xs text-slate-500">
              For general support and inquiries.
            </p>
          </div>
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="help-message-input"
              className="text-xs sm:text-sm font-semibold text-slate-900"
            >
              Your message
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-2xs focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
              <textarea
                id="help-message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                placeholder="Tell us how we can help..."
                rows={3}
                aria-label="Your message"
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="flex justify-end pt-1">
                <span className="text-[11px] font-medium text-slate-400">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!message.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-all hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <Send size={15} strokeWidth={2} />
              <span>Send feedback</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
