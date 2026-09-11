// lib/constants.ts

export const CATEGORIES = [
  'Dairy',
  'Textiles',
  'Retail',
  'Food Processing',
  'Logistics',
  'Agriculture',
  'Handicrafts',
  'Education',
] as const;

export type Category = typeof CATEGORIES[number];

export const SCHEMES = ['Micro Finance Scheme', 'Term Loan Scheme'] as const;

export type Scheme = typeof SCHEMES[number];

export const CONFIDENCE_LEVELS = ['Low', 'Medium', 'High'] as const;

export const DEFAULT_CAPITAL = 100_000;
export const DEFAULT_HOME_LOCATION = 'Kheragarh';

export const STORAGE_KEYS = {
  homeLocation: 'saksham_home_location',
  capital: 'saksham_capital',
  savedCategories: 'saksham_saved_categories',
  emailNotifications: 'saksham_email_notifications',
} as const;

// ─── Navigation ─────────────────────────────────────────────────────────────

export type IconName =
  | 'Home'
  | 'FileText'
  | 'PlusCircle'
  | 'User'
  | 'Bookmark'
  | 'ArrowLeftRight'
  | 'Settings'
  | 'HelpCircle'
  | 'PlayCircle'
  | 'Download'
  | 'Languages'
  | 'LogOut';

export interface NavItemConfig {
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
  readonly badge?: number;
}

export const SIDEBAR_PRIMARY_ITEMS: readonly NavItemConfig[] = [
  { label: 'Discover', href: '/discover', icon: 'Home' },
  { label: 'My Reports', href: '/reports', icon: 'FileText' },
  { label: 'New Assessment', href: '/new-assessment', icon: 'PlusCircle' },
  { label: 'Profile', href: '/profile', icon: 'User' },
] as const;

export const SIDEBAR_SECONDARY_ITEMS: readonly NavItemConfig[] = [
  { label: 'Saved', href: '/saved', icon: 'Bookmark' },
  { label: 'Compare', href: '/compare', icon: 'ArrowLeftRight' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
  { label: 'Help & Support', href: '/help', icon: 'HelpCircle' },
  { label: 'How SAKSHAM Works', href: '/how-it-works', icon: 'PlayCircle' },
  { label: 'Install App', href: '/install', icon: 'Download' },
] as const;

// Mobile bottom nav items (4 tabs)
export const BOTTOM_NAV_ITEMS = [
  { label: 'Discover', href: '/discover', icon: 'Home' as IconName },
  { label: 'My Reports', href: '/reports', icon: 'FileText' as IconName },
  { label: 'New', href: '/new-assessment', icon: 'PlusCircle' as IconName },
  { label: 'Profile', href: '/profile', icon: 'User' as IconName },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];