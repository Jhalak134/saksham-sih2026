// components/discover/CategoryIcons.tsx
// Crisp line icons matching the exact illustrations in the target mock UI.

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export function CowIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Horns */}
      <path d="M7 11C6 7 4 6 3 7" />
      <path d="M25 11C26 7 28 6 29 7" />
      {/* Head contour */}
      <path d="M8 11C8 7 11 5 16 5C21 5 24 7 24 11C24 16 22 18 16 18C10 18 8 16 8 11Z" />
      {/* Eyes */}
      <circle cx="12" cy="11" r="1.25" fill="currentColor" />
      <circle cx="20" cy="11" r="1.25" fill="currentColor" />
      {/* Snout */}
      <rect x="10" y="16" width="12" height="9" rx="4.5" fill="none" />
      {/* Nostrils */}
      <circle cx="13.5" cy="20.5" r="1" fill="currentColor" />
      <circle cx="18.5" cy="20.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function LoomIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="6" width="22" height="20" rx="2" />
      <line x1="11" y1="6" x2="11" y2="26" />
      <line x1="21" y1="6" x2="21" y2="26" />
      <line x1="5" y1="12" x2="27" y2="12" strokeDasharray="1.5 2" />
      <line x1="5" y1="16" x2="27" y2="16" />
      <line x1="5" y1="20" x2="27" y2="20" strokeDasharray="1.5 2" />
    </svg>
  );
}

export function ShopIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12L7 6H25L28 12" />
      <path d="M4 12C4 14 6 15 8 15C10 15 12 14 12 12C12 14 14 15 16 15C18 15 20 14 20 12C20 14 22 15 24 15C26 15 28 14 28 12" />
      <path d="M6 15V26H26V15" />
      <rect x="12" y="19" width="8" height="7" />
    </svg>
  );
}

export function SackIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Tied Top */}
      <path d="M12 6C12 4.5 13.5 3 16 3C18.5 3 20 4.5 20 6" />
      <ellipse cx="16" cy="8" rx="5" ry="2" />
      {/* Body */}
      <path d="M11 8C7 13 6 24 8 27C9 28.5 23 28.5 24 27C26 24 25 13 21 8" />
      {/* Center grain icon / tag */}
      <path d="M16 16V22" />
      <path d="M16 17C14 15 13 17 13 17" />
      <path d="M16 19C18 17 19 19 19 19" />
    </svg>
  );
}

export function TruckIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="17" height="14" rx="2" />
      <path d="M20 12H25L29 16V22H20V12Z" />
      <circle cx="9" cy="24" r="3" />
      <circle cx="24" cy="24" r="3" />
    </svg>
  );
}

export function SproutIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 27V15" />
      <path d="M16 15C16 9 21 7 26 7C26 12 24 17 16 17" />
      <path d="M16 19C16 13 11 11 6 11C6 16 8 21 16 21" />
    </svg>
  );
}

export function SewingIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 23H27" />
      <path d="M8 23V11C8 9 9.5 7 12 7H20C22.5 7 24 9 24 11V15H17" />
      <path d="M17 15V20" />
      <circle cx="20" cy="11" r="2" />
    </svg>
  );
}

export function FactoryIcon({ className = 'text-slate-800', size = 28 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 25V13L11 17V13L18 17V7H28V25H4Z" />
      <line x1="22" y1="12" x2="24" y2="12" />
      <line x1="22" y1="16" x2="24" y2="16" />
    </svg>
  );
}

export function getCategoryIcon(name: string, size = 28, className = 'text-slate-800'): React.JSX.Element {
  const lower = name.toLowerCase();
  if (lower.includes('dairy') || lower.includes('milk')) return <CowIcon size={size} className={className} />;
  if (lower.includes('tailor') || lower.includes('garment')) return <SewingIcon size={size} className={className} />;
  if (lower.includes('textile') || lower.includes('loom') || lower.includes('cloth')) return <LoomIcon size={size} className={className} />;
  if (lower.includes('retail') || lower.includes('shop') || lower.includes('store')) return <ShopIcon size={size} className={className} />;
  if (lower.includes('food') || lower.includes('process')) return <FactoryIcon size={size} className={className} />;
  if (lower.includes('logistic') || lower.includes('transport') || lower.includes('truck')) return <TruckIcon size={size} className={className} />;
  return <SproutIcon size={size} className={className} />;
}
