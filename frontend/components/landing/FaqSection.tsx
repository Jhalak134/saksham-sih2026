// components/landing/FaqSection.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'free',
    question: 'Is SAKSHAM free to use?',
    answer:
      'Yes, SAKSHAM is completely free for all rural and semi-urban entrepreneurs. Our platform is designed to make data-backed business insights and scheme guidance accessible to everyone.',
  },
  {
    id: 'plan',
    question: 'Do I need a business plan to get started?',
    answer:
      'No prior business plan or technical documentation is needed. You can start with just an idea or interest, and SAKSHAM will evaluate local demand, cost structures, and financing options for you.',
  },
  {
    id: 'areas',
    question: 'Which areas does SAKSHAM cover?',
    answer:
      'SAKSHAM covers villages, blocks, and districts across India, pulling hyper-local demographic data, mandi prices, and infrastructure context specific to your chosen location.',
  },
  {
    id: 'languages',
    question: 'In which languages is SAKSHAM available?',
    answer:
      'SAKSHAM supports multiple Indian regional languages, including Hindi and English, allowing you to plan your business in the language you are most comfortable with.',
  },
  {
    id: 'save',
    question: 'Can I save my assessments and come back later?',
    answer:
      'Yes. Every assessment you generate is stored in your account so you can revisit recommendations, monitor changing market trends, and re-calculate financing anytime.',
  },
] as const;

export function FaqSection(): React.JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggleFaq(id: string): void {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function handleOpenAll(): void {
    // If not all open, open all or toggle first
    setOpenId((prev) => (prev ? null : FAQ_ITEMS[0].id));
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            Frequently Asked Questions
          </h2>
          <button
            type="button"
            onClick={handleOpenAll}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {openId ? 'Collapse' : 'See all'}
          </button>
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleFaq(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-4.5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-slate-700'
                    )}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className="px-5 pb-4 pt-1 sm:px-6 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
