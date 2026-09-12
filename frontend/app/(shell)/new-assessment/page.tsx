// app/(shell)/new-assessment/page.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  MapPin,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  X,
  Mic,
  MicOff,
  ArrowRight,
  IndianRupee,
  Building2,
  Check,
} from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { useAuth } from '@/lib/auth-context';
import { CATEGORIES, type Category } from '@/lib/constants';
import { CategoryIcon } from '@/components/assessment/CategoryIcon';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useSpeechRecognition, languageCodeToSpeechLang } from '@/hooks/useSpeechRecognition';
import { createAssessment, formatVillageLocation } from '@/lib/api-client';
import type { VillageLocation } from '@/lib/api-types';
import {
  isMathuraLocation,
  formatLocation,
  POPULAR_MATHURA_PILOT_LOCATIONS,
  type LocationResult,
  searchLocations as searchMockLocations,
} from '@/data/mockLocations';
import { getSavedUserLocation } from '@/lib/geolocation';
import { cn } from '@/lib/cn';

// ─── Keyword mapping for smart category recommendation ───────────────────────

const KEYWORD_MAP: Record<string, Category> = {
  dairy: 'Dairy',
  milk: 'Dairy',
  ghee: 'Dairy',
  paneer: 'Dairy',
  cow: 'Dairy',
  buffalo: 'Dairy',
  tailor: 'Textiles',
  tailoring: 'Textiles',
  textile: 'Textiles',
  textiles: 'Textiles',
  fabric: 'Textiles',
  cloth: 'Textiles',
  clothes: 'Textiles',
  stitch: 'Textiles',
  stitching: 'Textiles',
  boutique: 'Textiles',
  shop: 'Retail',
  kirana: 'Retail',
  grocery: 'Retail',
  store: 'Retail',
  retail: 'Retail',
  food: 'Food Processing',
  snack: 'Food Processing',
  pickle: 'Food Processing',
  processing: 'Food Processing',
  flour: 'Food Processing',
  spice: 'Food Processing',
  transport: 'Logistics',
  delivery: 'Logistics',
  logistics: 'Logistics',
  vehicle: 'Logistics',
  farm: 'Agriculture',
  crop: 'Agriculture',
  agriculture: 'Agriculture',
  fertilizer: 'Agriculture',
  seed: 'Agriculture',
  handicraft: 'Handicrafts',
  craft: 'Handicrafts',
  pottery: 'Handicrafts',
  art: 'Handicrafts',
  school: 'Education',
  coaching: 'Education',
  tutor: 'Education',
  tuition: 'Education',
};

function inferCategory(idea: string): Category | null {
  const lower = idea.toLowerCase();
  for (const [keyword, cat] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return null;
}

// ─── Preset Quick Ideas ───────────────────────────────────────────────────────

interface IdeaPreset {
  label: string;
  category: Category;
  prompt: string;
}

const IDEA_PRESETS: IdeaPreset[] = [
  {
    label: 'Dairy Farm (3-5 cows)',
    category: 'Dairy',
    prompt: 'I want to start a small dairy farm with 3-5 cows to supply fresh milk and ghee locally.',
  },
  {
    label: 'Tailoring & Boutique',
    category: 'Textiles',
    prompt: 'I want to open a tailoring and boutique shop for custom clothing stitching and alterations.',
  },
  {
    label: 'Grocery & Kirana Store',
    category: 'Retail',
    prompt: 'I want to open a retail grocery store and daily essentials shop in my village.',
  },
  {
    label: 'Food Processing Unit',
    category: 'Food Processing',
    prompt: 'I want to set up a small-scale food processing and packaging unit for seasonal local produce.',
  },
  {
    label: 'Agri Equipment & Inputs',
    category: 'Agriculture',
    prompt: 'I want to provide agricultural equipment rental and quality farm inputs to local farmers.',
  },
];

const CAPITAL_PRESETS = [
  { label: '₹25,000', value: 25000 },
  { label: '₹50,000', value: 50000 },
  { label: '₹1,00,000', value: 100000 },
  { label: '₹2,50,000', value: 250000 },
  { label: '₹5,00,000', value: 500000 },
];

// ─── Single-Step Assessment Content Component ─────────────────────────────────

function NewAssessmentContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { capital: shellCapital, homeLocation, language } = useShell();
  const { user } = useAuth();

  // Query parameter extraction
  const paramIdea = searchParams ? searchParams.get('idea') ?? '' : '';
  const paramDistrict = searchParams ? searchParams.get('district') ?? '' : '';
  const paramState = searchParams ? searchParams.get('state') ?? '' : '';
  const paramLoc = searchParams ? searchParams.get('location') ?? '' : '';
  const paramCategory = searchParams ? (searchParams.get('category') as Category) ?? null : null;

  // Form State (Single unified step)
  const [locationId, setLocationId] = useState<string>('');
  const [locationDisplay, setLocationDisplay] = useState<string>('');
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [category, setCategory] = useState<Category | ''>('');
  const [idea, setIdea] = useState<string>(paramIdea);
  const [capital, setCapital] = useState<number>(() => {
    return shellCapital && shellCapital > 0 ? shellCapital : 100000;
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Search hook for 874 villages
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    debouncedQuery,
    results: searchResults,
    loading: searchLoading,
    clear: clearSearch,
  } = useLocationSearch(250);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Inferred category from user typing
  const suggestedCategory = useMemo(() => inferCategory(idea), [idea]);

  // Initial location resolution
  useEffect(() => {
    if (paramLoc) {
      setLocationId('loc_param');
      setLocationDisplay(paramLoc);
      return;
    }
    if (paramDistrict) {
      const isMathura = paramDistrict.toLowerCase() === 'mathura';
      setLocationId(isMathura ? 'loc_07' : 'loc_param');
      setLocationDisplay(`${paramDistrict}, ${paramState || 'Uttar Pradesh'}`);
      return;
    }

    // Hydrate from client storage or shell context
    const { location: storedLoc, status: geoStatus } = getSavedUserLocation();
    const candidateLoc =
      storedLoc || (homeLocation && homeLocation !== 'Uttar Pradesh' ? homeLocation : '');

    if (candidateLoc && geoStatus !== 'denied') {
      const matches = searchMockLocations(candidateLoc);
      const bestMatch = matches.find((m) => isMathuraLocation(m));
      if (bestMatch) {
        setLocationId(bestMatch.id);
        setLocationDisplay(`${bestMatch.village}, ${bestMatch.district}`);
      } else {
        setLocationId('loc_saved');
        setLocationDisplay(candidateLoc);
      }
    } else {
      // Default pilot location: Bera, Mathura (Census ID: 123912)
      setLocationId('123912');
      setLocationDisplay('Bera, Mathura');
    }
  }, [paramLoc, paramDistrict, paramState, homeLocation]);

  // Auto-set category if provided in query or inferred
  useEffect(() => {
    if (paramCategory && CATEGORIES.includes(paramCategory)) {
      setCategory(paramCategory);
    } else if (!category && suggestedCategory) {
      setCategory(suggestedCategory);
    }
  }, [paramCategory, suggestedCategory, category]);

  // Voice speech recognition hook
  const baseIdeaRef = useRef<string>('');

  const handleSpeechResult = (fullTranscript: string) => {
    const base = baseIdeaRef.current.trim();
    const cleanSpeech = fullTranscript.trim();
    const combined = base ? `${base} ${cleanSpeech}` : cleanSpeech;
    setIdea(combined.slice(0, 300));
  };

  const {
    isListening,
    language: speechLang,
    setLanguage: setSpeechLang,
    toggleListening,
    resetTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition({
    initialLanguage: languageCodeToSpeechLang(language),
    onTranscriptChange: handleSpeechResult,
  });

  const handleToggleListening = () => {
    if (!isListening) {
      baseIdeaRef.current = idea;
      resetTranscript();
    }
    toggleListening();
  };

  const isPilot = useMemo(() => {
    return isMathuraLocation(locationDisplay || locationId);
  }, [locationDisplay, locationId]);

  // Handler: Select Village
  function handleSelectVillage(v: VillageLocation): void {
    setLocationId(String(v.id));
    setLocationDisplay(formatVillageLocation(v));
    clearSearch();
    setIsEditingLocation(false);
  }

  // Handler: Select Quick Pilot Location
  function handleSelectQuick(loc: LocationResult): void {
    setLocationId(loc.id);
    setLocationDisplay(formatLocation(loc));
    clearSearch();
    setIsEditingLocation(false);
  }

  // Handler: Select Idea Preset
  function handleSelectPreset(preset: IdeaPreset): void {
    setIdea(preset.prompt);
    setCategory(preset.category);
  }

  // Handler: Capital Change
  function handleCapitalInput(e: React.ChangeEvent<HTMLInputElement>): void {
    const parsed = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    setCapital(Number.isNaN(parsed) ? 0 : parsed);
  }

  // Handler: Submit Assessment
  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    const effectiveLocation = locationDisplay.trim() || locationId.trim();
    if (!effectiveLocation) {
      setSubmitError('Please select a business location to analyze.');
      setIsEditingLocation(true);
      return;
    }

    const effectiveCategory = category || suggestedCategory || 'Dairy';
    if (!effectiveCategory) {
      setSubmitError('Please choose a business sector or category.');
      return;
    }

    if (capital <= 0) {
      setSubmitError('Please enter your available investment capital (amount must be greater than ₹0).');
      return;
    }

    setIsSubmitting(true);

    try {
      let parsedVillageId: number | undefined = undefined;
      if (locationId) {
        if (/^\d+$/.test(locationId)) {
          parsedVillageId = Number(locationId);
        } else if (locationId.startsWith('loc_v_')) {
          const idNum = parseInt(locationId.replace('loc_v_', ''), 10);
          if (Number.isFinite(idNum)) {
            parsedVillageId = idNum;
          }
        } else if (locationId === 'loc_07') {
          parsedVillageId = 124296;
        }
      }

      const res = await createAssessment({
        location: effectiveLocation,
        village_id: parsedVillageId,
        category: effectiveCategory,
        capital: capital,
        idea: idea.trim() || undefined,
        language: 'en',
        phone_or_email: user?.phone_or_email ?? undefined,
      });

      router.push(`/assessment/completed?id=${res.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate assessment. Please check your connection and try again.';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Assessment Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
          {/* Header Navigation & Title */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push('/discover')}
              className="group mb-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Back to Discover"
            >
              <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Discover</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    <Sparkles size={11} className="text-emerald-700" />
                    Single-Step Assessment
                  </span>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  New Business Feasibility Assessment
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Provide your business details below to generate instant market demand intelligence, competitor density, financial projections, and eligible government schemes in one step.
                </p>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div
              className="mb-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 flex items-start gap-3 animate-in fade-in"
              role="alert"
            >
              <AlertCircle size={18} className="mt-0.5 text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Please check your inputs</p>
                <p className="mt-0.5 text-xs text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          {/* Section 1: Business Location */}
          <div className="py-6 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <MapPin size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  1. Business Location
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Pilot Active: Mathura (874 Villages)
              </span>
            </div>

            {locationDisplay && !isEditingLocation ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-2xs border border-slate-200 text-emerald-700 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {locationDisplay}
                      </span>
                      {isPilot ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={11} /> Pilot Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Outside Pilot
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPilot
                        ? 'Calibrated with hyper-local village-level Census & market data.'
                        : 'Simulated assessment ready. Pilot regions have full ground truth data.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingLocation(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit2 size={12} />
                  <span>Change Location</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-2xs focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10 transition-all">
                  <Search size={16} className="ml-4 text-slate-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type village or town name (e.g. Bera, Barsana, Govardhan)..."
                    className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => clearSearch()}
                      className="mr-3 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg divide-y divide-slate-100">
                    {searchResults.map((village) => (
                      <button
                        key={village.id}
                        type="button"
                        onClick={() => handleSelectVillage(village)}
                        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-emerald-50/60 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin size={14} className="text-emerald-700 shrink-0" />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900">
                              {village.name}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5">
                              {village.district_name}, {village.state_name}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Pilot Village Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Select:</span>
                  {POPULAR_MATHURA_PILOT_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectQuick(loc)}
                      className={cn(
                        'flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all cursor-pointer shadow-2xs',
                        locationDisplay.includes(loc.village)
                          ? 'bg-emerald-800 text-white font-semibold'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-600 hover:bg-emerald-50/50'
                      )}
                    >
                      <MapPin size={11} className={locationDisplay.includes(loc.village) ? 'text-white' : 'text-emerald-700'} />
                      <span>{loc.village}</span>
                    </button>
                  ))}
                  {locationDisplay && isEditingLocation && (
                    <button
                      type="button"
                      onClick={() => setIsEditingLocation(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline ml-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Business Sector / Category */}
          <div className="py-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Building2 size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  2. Business Sector / Category
                </h2>
              </div>
              {suggestedCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Sparkles size={11} className="text-amber-700" />
                  Suggested: {suggestedCategory}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const isSuggested = suggestedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 sm:p-4 text-center transition-all cursor-pointer',
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-700/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-transform',
                        isSelected ? 'bg-emerald-700 text-white scale-105' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <CategoryIcon category={cat} size={20} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold leading-tight">{cat}</span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-white">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                    {isSuggested && !isSelected && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-bold text-amber-950 shadow-xs">
                        Suggested
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Business Idea / Description (Recommended) */}
          <div className="py-6 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  3. Business Idea & Description
                </h2>
                <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </div>

              {/* Speech-to-text Voice Control */}
              {speechSupported && (
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSpeechLang('hi-IN')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-colors cursor-pointer',
                        speechLang === 'hi-IN' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                      )}
                    >
                      🇮🇳 हिन्दी
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeechLang('en-IN')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-colors cursor-pointer',
                        speechLang === 'en-IN' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                      )}
                    >
                      🇬🇧 En
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleListening}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                      isListening
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                    title={isListening ? 'Stop recording' : 'Speak to describe your idea'}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} className="text-emerald-700" />}
                    <span>{isListening ? 'Listening...' : 'Speak'}</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Describe what products you will offer, scale of operations, or target customers. You can type or use the voice mic.
            </p>

            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="Example: I want to start a small dairy farm with 3-5 cows selling fresh milk, curd, and paneer directly to village households and local sweet shops..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 shadow-2xs transition-all resize-none"
              />
              <div className="flex items-center justify-between pt-1 px-1">
                <span className="text-[11px] text-slate-400">
                  {idea.length >= 10 ? '✓ Good description provided' : 'Optional — helps customize your report'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{idea.length}/300</span>
              </div>
            </div>

            {/* Quick Idea Presets */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Examples:</span>
              {IDEA_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-emerald-600 hover:bg-emerald-50/50 hover:text-emerald-950 transition-colors shadow-2xs cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Available Capital / Investment */}
          <div className="py-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <IndianRupee size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  4. Available Investment Capital
                </h2>
              </div>
              <span className="text-xs font-semibold text-emerald-800">
                ₹{capital.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Enter your budget or funds available (own savings + expected bank/MUDRA loan).
            </p>

            <div className="space-y-3">
              {/* Capital Input */}
              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-2xs focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10 transition-all max-w-md">
                <span className="pl-4 pr-1 text-base font-bold text-slate-500 select-none">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={capital === 0 ? '' : capital.toLocaleString('en-IN')}
                  onChange={handleCapitalInput}
                  placeholder="1,00,000"
                  className="w-full bg-transparent px-2 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                  aria-label="Available capital in rupees"
                />
              </div>

              {/* Capital Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {CAPITAL_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setCapital(p.value)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                      capital === p.value
                        ? 'bg-emerald-800 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-600 hover:bg-emerald-50/60'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission CTA Strip */}
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
            {/* Live Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200/80 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-3 font-medium">
                <span>📍 <strong className="text-slate-800">{locationDisplay || 'Bera, Mathura'}</strong></span>
                <span className="text-slate-300">•</span>
                <span>🏷️ <strong className="text-slate-800">{category || 'Dairy'}</strong></span>
                <span className="text-slate-300">•</span>
                <span>💰 <strong className="text-slate-800">₹{capital.toLocaleString('en-IN')}</strong></span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800">
                Single-Step Verification Ready
              </span>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !locationDisplay || !category || capital <= 0}
              className={cn(
                'group relative w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-base font-bold shadow-md transition-all cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSubmitting
                  ? 'bg-emerald-800 text-white'
                  : 'bg-[#167844] hover:bg-[#126438] active:bg-[#0e4e2c] active:scale-[0.99] text-white hover:shadow-lg'
              )}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Analyzing Local Market & Feasibility...</span>
                </>
              ) : (
                <>
                  <span>Analyze Feasibility & Generate Report</span>
                  <ArrowRight
                    size={18}
                    strokeWidth={2.5}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewAssessmentPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 font-medium">Loading assessment form...</p>
        </div>
      }
    >
      <NewAssessmentContent />
    </Suspense>
  );
}
