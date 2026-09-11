// components/install/MobileInstallView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  BarChart2,
  WifiOff,
  Download,
  Info,
  Sparkles,
  Plus,
  Bookmark,
  History,
  PlusSquare,
  Settings,
} from 'lucide-react';
import { InstallAppIcon } from './InstallAppIcon';
import { IosInstallCard } from './IosInstallCard';
import { cn } from '@/lib/cn';

interface MobileInstallViewProps {
  onInstall: () => void;
  isInstallable?: boolean;
}

type PlatformTab = 'android' | 'ios';

export function MobileInstallView({
  onInstall,
  isInstallable = false,
}: MobileInstallViewProps): React.JSX.Element {
  const [platform, setPlatform] = useState<PlatformTab>('android');
  const [showAndroidFallback, setShowAndroidFallback] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('ios');
      } else {
        setPlatform('android');
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-5 lg:hidden">
      {/* Platform Switcher Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setPlatform('android')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
            platform === 'android'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          Android (Chrome)
        </button>
        <button
          type="button"
          onClick={() => setPlatform('ios')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
            platform === 'ios'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          iOS (Safari)
        </button>
      </div>

      {/* Android View */}
      {platform === 'android' && (
        <div className="flex flex-col gap-4">
          {!showAndroidFallback ? (
            /* Android State A: Prompt & Features */
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              {/* Graphic Mockup */}
              <div className="relative my-3 flex justify-center items-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-amber-100/60">
                  <Sparkles
                    size={20}
                    className="absolute right-2 top-2 text-amber-500"
                    aria-hidden="true"
                  />
                  <div className="w-24 h-32 rounded-2xl border-4 border-slate-700 bg-slate-100 p-2 flex flex-col items-center justify-center shadow-md">
                    <InstallAppIcon size="sm" />
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="flex flex-col gap-3 my-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <Zap size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Quick access
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Open SAKSHAM directly from your home screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <BarChart2 size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      A faster experience
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Get to insights and opportunities in one tap.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <WifiOff size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Works like an app
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      A clean, distraction-free experience in your browser.
                    </p>
                  </div>
                </div>
              </div>

              {/* Install CTA */}
              <button
                type="button"
                onClick={onInstall}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] py-3 px-4 text-xs font-bold text-slate-900 shadow-2xs hover:bg-[#EAB308] transition-colors"
              >
                <Download size={16} strokeWidth={2.5} />
                <span>Install App</span>
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                You&apos;ll see your browser&apos;s install prompt.
              </p>

              {/* Toggle to view fallback guide */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowAndroidFallback(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Don&apos;t see the install prompt?
                </button>
              </div>
            </div>
          ) : (
            /* Android State B: Fallback Guide */
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              {/* Menu illustration */}
              <div className="my-2 flex justify-center">
                <div className="w-52 rounded-2xl border-4 border-slate-700 bg-slate-100 p-2 shadow-sm">
                  <div className="flex justify-end pr-1 text-slate-600 font-bold text-xs">
                    ⋮
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl bg-white p-2 shadow-2xs text-[11px] text-slate-700 font-medium">
                    <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                      <Plus size={12} />
                      <span>New tab</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                      <Bookmark size={12} />
                      <span>Bookmarks</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                      <History size={12} />
                      <span>Recent tabs</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-100/70 text-slate-900 font-bold border border-amber-200">
                      <PlusSquare size={13} className="text-amber-800" />
                      <span>Add to Home screen</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                      <Settings size={12} />
                      <span>Settings</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Don&apos;t see the install prompt?
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Look for &quot;Add to Home screen&quot; or &quot;Install App&quot; in your browser&apos;s menu (three dots in the top right).
                </p>
              </div>

              {/* Tip info */}
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-900">
                <Info size={16} className="shrink-0 text-sky-600" />
                <span>Tip: Use Google Chrome on Android for the best experience.</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowAndroidFallback(false)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  ← Back to Install
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* iOS View */}
      {platform === 'ios' && <IosInstallCard showTip={true} />}
    </div>
  );
}
