// components/discover/CategoryIcons.tsx
// Crisp, modern SVG line icons matching the Saksham design system.

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. Spool / Thread Yarn Icon (Textiles & Handloom)
export function SpoolIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Spool top & bottom flanges */}
      <rect x="5" y="3" width="14" height="2.5" rx="1.25" />
      <rect x="5" y="18.5" width="14" height="2.5" rx="1.25" />
      {/* Spool body */}
      <path d="M7 5.5V18.5" />
      <path d="M17 5.5V18.5" />
      {/* Thread wraps */}
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="10.5" x2="17" y2="10.5" />
      <line x1="7" y1="13" x2="17" y2="13" />
      <line x1="7" y1="15.5" x2="17" y2="15.5" />
    </svg>
  );
}

// 2. Retail / Storefront Icon (Retail & Kirana)
export function StoreIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9L5 4H19L21 9" />
      <path d="M3 9C3 10.5 4.2 11.5 5.5 11.5C6.8 11.5 8 10.5 8 9C8 10.5 9.2 11.5 10.5 11.5C11.8 11.5 13 10.5 13 9C13 10.5 14.2 11.5 15.5 11.5C16.8 11.5 18 10.5 18 9C18 10.5 19.2 11.5 20.5 11.5C21.8 11.5 23 10.5 23 9" />
      <path d="M4 11.5V20H20V11.5" />
      <rect x="9" y="14" width="6" height="6" rx="0.5" />
    </svg>
  );
}

// 3. Leaf / Plant Icon (Agri Processing)
export function LeafIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 20C17 20 20 15 20 4C9 4 4 9 4 15C4 17.5 5.5 20 8 20" />
      <path d="M4 20L11 13" />
      <path d="M11 13C12.5 10.5 15 9 17 8" />
    </svg>
  );
}

// 4. Dairy / Milk Carton Icon (Dairy & Livestock)
export function MilkCartonIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Top peak */}
      <path d="M8 3H16L19 7H5L8 3Z" />
      {/* Carton body */}
      <rect x="5" y="7" width="14" height="14" rx="1" />
      {/* Center drop / label detail */}
      <path d="M12 11C12 11 10 13 10 14.5C10 15.6 10.9 16.5 12 16.5C13.1 16.5 14 15.6 14 14.5C14 13 12 11 12 11Z" />
    </svg>
  );
}

// 5. Utensils / Fork & Knife Icon (Food & Beverages)
export function UtensilsIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 3V21" />
      <path d="M15 3H21V8C21 9.5 19.5 11 18 11V3Z" />
      <path d="M6 3V10C6 11.5 7.5 12 9 12V21" />
      <path d="M9 3V12" />
      <path d="M12 3V10C12 11.5 10.5 12 9 12" />
      <path d="M6 3H12" />
    </svg>
  );
}

// 6. Pottery / Vase Icon (Handicrafts)
export function PotteryIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Vase Rim */}
      <ellipse cx="12" cy="4.5" rx="4" ry="1.5" />
      {/* Vase Body */}
      <path d="M8 5C7.5 8 4 10 4 14C4 18 7.5 20.5 12 20.5C16.5 20.5 20 18 20 14C20 10 16.5 8 16 5" />
      {/* Vase base */}
      <path d="M8.5 20.5H15.5" />
      {/* Decorative center arc */}
      <path d="M7 13.5C9.5 15 14.5 15 17 13.5" />
    </svg>
  );
}

// 7. Sun / Solar Icon (Solar & Clean Energy)
export function SolarSunIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
      <line x1="4.93" y1="19.07" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.07" y2="4.93" />
    </svg>
  );
}

// 8. Wrench / Repair Icon (Services & Repairs)
export function WrenchToolIcon({ className = 'text-slate-800', size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3C15.6 5.4 16.9 5 18.2 5.2C18.6 5.3 18.8 5.7 18.6 6.1L16.8 8.9L18.9 11L21.7 9.2C22.1 9 22.5 9.2 22.6 9.6C22.8 10.9 22.4 12.2 21.5 13.1C20.1 14.5 18 14.8 16.3 14L8.8 21.5C8.4 21.9 7.8 21.9 7.4 21.5L2.5 16.6C2.1 16.2 2.1 15.6 2.5 15.2L10 7.7C9.2 6 9.5 3.9 10.9 2.5C11.8 1.6 13.1 1.2 14.4 1.4C14.8 1.5 15 1.9 14.8 2.3L13 5.1L15.1 7.2L17.9 5.4C18.3 5.2 18.7 5.4 18.8 5.8" />
    </svg>
  );
}

// Legacy aliases for backward compatibility with existing components
export const CowIcon = MilkCartonIcon;
export const LoomIcon = SpoolIcon;
export const ShopIcon = StoreIcon;
export const SackIcon = LeafIcon;
export const SproutIcon = LeafIcon;
export const TruckIcon = StoreIcon;
export const SewingIcon = SpoolIcon;
export const FactoryIcon = LeafIcon;

export function getCategoryIcon(name: string, size = 24, className = 'text-slate-800'): React.JSX.Element {
  const lower = name.toLowerCase();
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('livestock') || lower.includes('cattle')) {
    return <MilkCartonIcon size={size} className={className} />;
  }
  if (lower.includes('textile') || lower.includes('handloom') || lower.includes('garment') || lower.includes('weaving') || lower.includes('spool')) {
    return <SpoolIcon size={size} className={className} />;
  }
  if (lower.includes('retail') || lower.includes('kirana') || lower.includes('shop') || lower.includes('store') || lower.includes('fmcg')) {
    return <StoreIcon size={size} className={className} />;
  }
  if (lower.includes('agri') || lower.includes('farm') || lower.includes('grain') || lower.includes('crop') || lower.includes('leaf') || lower.includes('plant')) {
    return <LeafIcon size={size} className={className} />;
  }
  if (lower.includes('food') || lower.includes('beverage') || lower.includes('snack') || lower.includes('bakery') || lower.includes('restaurant')) {
    return <UtensilsIcon size={size} className={className} />;
  }
  if (lower.includes('handicraft') || lower.includes('pottery') || lower.includes('craft') || lower.includes('art') || lower.includes('jute')) {
    return <PotteryIcon size={size} className={className} />;
  }
  if (lower.includes('solar') || lower.includes('clean energy') || lower.includes('sun') || lower.includes('power') || lower.includes('renewable')) {
    return <SolarSunIcon size={size} className={className} />;
  }
  if (lower.includes('service') || lower.includes('repair') || lower.includes('wrench') || lower.includes('maintenance') || lower.includes('mechanic')) {
    return <WrenchToolIcon size={size} className={className} />;
  }
  return <LeafIcon size={size} className={className} />;
}
