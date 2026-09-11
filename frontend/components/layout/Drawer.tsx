'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Home,
  FileText,
  PlusCircle,
  User,
  Bookmark,
  ArrowLeftRight,
  Settings,
  HelpCircle,
  PlayCircle,
  Download,
  Languages,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useShell } from '@/lib/shell-context';
import {
  SIDEBAR_PRIMARY_ITEMS,
  SIDEBAR_SECONDARY_ITEMS,
  SUPPORTED_LANGUAGES,
  type IconName,
  type NavItemConfig,
  type LanguageCode,
} from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';

// ─── Icon registry ────────────────────────────────────────────────────────────

const ICON_MAP: Record<IconName, LucideIcon> = {
  Home,
  FileText,
  PlusCircle,
  User,
  Bookmark,
  ArrowLeftRight,
  Settings,
  HelpCircle,
  PlayCircle,
  Download,
  Languages,
  LogOut,
};

// ─── Drawer nav row ───────────────────────────────────────────────────────────

interface DrawerNavRowProps {
  config: NavItemConfig;
  active: boolean;
  badge?: number;
  onClick: () => void;
}

function DrawerNavRow({
  config,
  active,
  badge,
  onClick,
}: DrawerNavRowProps): React.JSX.Element {
  const Icon = ICON_MAP[config.icon];
  return (
    <Link
      href={config.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors min-h-[48px]',
        active
          ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-text-dark)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-dark)]'
      )}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="flex-1">{config.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-text-dark)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Drawer language row ──────────────────────────────────────────────────────

interface DrawerLanguageRowProps {
  language: LanguageCode;
  onChange: (code: LanguageCode) => void;
}

function DrawerLanguageRow({
  language,
  onChange,
}: DrawerLanguageRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
      <Languages
        size={18}
        strokeWidth={1.75}
        className="text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-medium text-[var(--color-text-muted)]">
        Language
      </span>
      <select
        value={language}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="rounded border border-[var(--color-border)] bg-white px-1.5 py-1 text-xs text-[var(--color-text-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

/**
 * Mobile-only slide-out navigation drawer.
 * Shown when `drawerOpen` is true in ShellContext.
 * Hidden on desktop (lg+) — Sidebar is used there instead.
 */
export function Drawer(): React.JSX.Element {
  const { drawerOpen, closeDrawer, compareCount, language, setLanguage } =
    useShell();
  const pathname = usePathname();

  // Close drawer when route changes (navigation completed).
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Trap keyboard: close on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, closeDrawer]);

  function isNavActive(href: string): boolean {
    if (href === '/discover') return pathname === '/discover' || pathname === '/';
    return pathname.startsWith(href);
  }

  function handleLogOut(): void {
    closeDrawer();
    import('@/lib/storage').then(({ removeStorageItem }) => {
      removeStorageItem('auth_token');
      window.location.href = '/login';
    });
  }

  return (
    <div className="md:hidden" aria-hidden={!drawerOpen}>
      {/* Backdrop overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 transition-opacity',
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ zIndex: 'var(--z-overlay)' }}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'fixed inset-y-0 left-0 flex flex-col bg-white shadow-xl',
          'transition-transform duration-300',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          width: 'var(--drawer-width, 280px)',
          zIndex: 'var(--z-drawer)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--color-text-dark)]">
            SAKSHAM
          </p>
          <IconButton label="Close navigation menu" onClick={closeDrawer}>
            <X size={18} strokeWidth={2} />
          </IconButton>
        </div>

        {/* Scrollable nav items */}
        <nav className="flex flex-1 flex-col overflow-y-auto divide-y divide-[var(--color-border)]">
          {/* Primary group */}
          <div className="py-1">
            {SIDEBAR_PRIMARY_ITEMS.map((item) => (
              <DrawerNavRow
                key={item.href}
                config={item}
                active={isNavActive(item.href)}
                onClick={closeDrawer}
              />
            ))}
          </div>

          {/* Secondary group */}
          <div className="py-1">
            {SIDEBAR_SECONDARY_ITEMS.map((item) => (
              <DrawerNavRow
                key={item.href}
                config={item}
                active={isNavActive(item.href)}
                badge={item.href === '/compare' ? compareCount : undefined}
                onClick={closeDrawer}
              />
            ))}
            <DrawerLanguageRow language={language} onChange={setLanguage} />
          </div>

          {/* Log out */}
          <div className="py-1">
            <button
              onClick={handleLogOut}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-dark)] min-h-[48px]"
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <p className="text-[11px] font-medium text-[var(--color-text-dark)]">
            SAKSHAM v1.0.0
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Built for rural entrepreneurs.
          </p>
        </div>
      </div>
    </div>
  );
}
