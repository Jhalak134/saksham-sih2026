'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
import {
  SIDEBAR_PRIMARY_ITEMS,
  SIDEBAR_SECONDARY_ITEMS,
  SUPPORTED_LANGUAGES,
  type IconName,
  type NavItemConfig,
  type LanguageCode,
} from '@/lib/constants';
import { useShell } from '@/lib/shell-context';
import { useAuth } from '@/lib/auth-context';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/lib/storage';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { getAuthUser, clearAuthUser, type AuthUser } from '@/lib/auth';
import { STORAGE_KEYS } from '@/lib/constants';

// ─── Resize constants ─────────────────────────────────────────────────────────

const MIN_WIDTH = 160;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 200;
const STORAGE_KEY_SIDEBAR_WIDTH = 'saksham_sidebar_width';

function clampWidth(w: number): number {
  return Math.min(Math.max(w, MIN_WIDTH), MAX_WIDTH);
}

function applyWidthVar(px: number): void {
  document.documentElement.style.setProperty('--sidebar-width', `${px}px`);
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/discover') return pathname === '/discover' || pathname === '/';
  return pathname.startsWith(href);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NavRowProps {
  config: NavItemConfig;
  active: boolean;
  badge?: number;
}

function NavRow({ config, active, badge }: NavRowProps): React.JSX.Element {
  const Icon = ICON_MAP[config.icon];
  return (
    <Link
      href={config.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-text-dark)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-dark)]'
      )}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="flex-1 truncate">{config.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-text-dark)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface LanguageRowProps {
  language: LanguageCode;
  onChange: (code: LanguageCode) => void;
}

function LanguageRow({
  language,
  onChange,
}: LanguageRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
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
        className="rounded border border-[var(--color-border)] bg-white px-1.5 py-0.5 text-xs text-[var(--color-text-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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

interface LogOutRowProps {
  onLogOut: () => void;
}

function LogOutRow({ onLogOut }: LogOutRowProps): React.JSX.Element {
  return (
    <button
      onClick={onLogOut}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-dark)]"
    >
      <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
      <span>Log out</span>
    </button>
  );
}

// ─── Resize handle ────────────────────────────────────────────────────────────

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

function ResizeHandle({
  onMouseDown,
  onDoubleClick,
}: ResizeHandleProps): React.JSX.Element {
  return (
    <div
      data-testid="resize-handle"
      aria-hidden="true"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        'absolute right-0 top-0 h-full w-1',
        'cursor-ew-resize',
        'transition-colors hover:bg-[var(--color-border)]',
        'active:bg-[var(--color-accent-blue)]'
      )}
      title="Drag to resize · Double-click to reset"
    />
  );
}

// ─── Resize hook ──────────────────────────────────────────────────────────────

function useSidebarResize() {
  // Always start with DEFAULT_WIDTH so the server HTML and the client's first
  // render match exactly (no hydration mismatch). The persisted value is
  // applied client-side only, after hydration, via useEffect.
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const widthRef = useRef(width);

  // Keep ref in sync so drag closures always read the latest value.
  widthRef.current = width;

  // After mount (client only): load the persisted width from localStorage and
  // apply it. This runs after React has reconciled the server HTML, so it
  // never causes a hydration mismatch.
  useEffect(() => {
    const stored = getStorageItem(STORAGE_KEY_SIDEBAR_WIDTH);
    if (stored !== null) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        const clamped = clampWidth(parsed);
        setWidth(clamped);
        applyWidthVar(clamped);
        return;
      }
    }
    applyWidthVar(DEFAULT_WIDTH);
  }, []);

  // Sync CSS variable on every subsequent width change (drag / reset).
  useEffect(() => {
    applyWidthVar(width);
  }, [width]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widthRef.current;

    function onMouseMove(ev: MouseEvent): void {
      const next = clampWidth(startWidth + ev.clientX - startX);
      widthRef.current = next;
      applyWidthVar(next);
      setWidth(next);
    }

    function onMouseUp(): void {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setStorageItem(STORAGE_KEY_SIDEBAR_WIDTH, String(widthRef.current));
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    setStorageItem(STORAGE_KEY_SIDEBAR_WIDTH, String(DEFAULT_WIDTH));
  }, []);

  return { width, startResize, resetWidth };
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/**
 * Desktop-only persistent left sidebar.
 * Hidden on mobile (md breakpoint). Mobile uses <Drawer> instead.
 * Width is user-resizable by dragging the right edge.
 * Double-clicking the handle resets to the default width (200px).
 * The chosen width is persisted to localStorage.
 */
export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const { compareCount, language, setLanguage } = useShell();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const { width, startResize, resetWidth } = useSidebarResize();

  const [showLogOutModal, setShowLogOutModal] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  function handleLogOutClick(): void {
    setShowLogOutModal(true);
  }

  function handleConfirmLogOut(): void {
    setShowLogOutModal(false);
    logout();
    clearAuthUser();
    removeStorageItem(STORAGE_KEYS.authToken);
    window.location.href = '/';
  }

  const displayName = authUser?.phone_or_email || user?.name || (user?.phone ? `+91 ${user.phone}` : 'Rural Entrepreneur');
  const displaySub = isAuthenticated && authUser
    ? (authUser.home_location || 'Verified Profile')
    : user?.email || (user?.phone ? 'Verified Profile' : 'My Profile');
  const userInitials = authUser?.phone_or_email
    ? authUser.phone_or_email.slice(0, 2).toUpperCase()
    : user?.name
      ? user.name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'RE';

  return (
    <aside
      className="hidden md:flex flex-col fixed inset-y-0 left-0 bg-white border-r border-[var(--color-border)]"
      style={{ width, zIndex: 'var(--z-sidebar)' }}
      aria-label="Main navigation"
    >
      {/* Drag handle — right edge */}
      <ResizeHandle onMouseDown={startResize} onDoubleClick={resetWidth} />

      {/* Brand */}
      <div className="px-4 py-4 border-b border-[var(--color-border)] flex items-center gap-2.5">
        <img src="/icon.svg" alt="" className="h-8 w-8 object-contain shrink-0" />
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight text-[#00284D] truncate">
            SAKSH<span className="text-[#FBAC05]">AM</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)] leading-tight truncate">
            Your business. A stronger tomorrow.
          </p>
        </div>
      </div>


      {/* Scrollable nav area */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3 gap-0.5">
        {SIDEBAR_PRIMARY_ITEMS.map((item) => (
          <NavRow
            key={item.href}
            config={item}
            active={isNavActive(pathname, item.href)}
          />
        ))}

        <div className="my-2 border-t border-[var(--color-border)]" />

        {SIDEBAR_SECONDARY_ITEMS.map((item) => (
          <NavRow
            key={item.href}
            config={item}
            active={isNavActive(pathname, item.href)}
            badge={item.href === '/compare' ? compareCount : undefined}
          />
        ))}

        <LanguageRow language={language} onChange={setLanguage} />
      </nav>

      {/* Bottom Profile & Log Out Section */}
      <div className="border-t border-[var(--color-border)] p-2 bg-slate-50/70 space-y-1">
        {/* Profile Card */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-white hover:shadow-xs transition-all group"
          title="Manage Profile"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shadow-xs">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-[var(--color-accent)]">
              {displayName}
            </p>
            <p className="truncate text-[10px] text-slate-500">
              {displaySub}
            </p>
          </div>
        </Link>

        {/* Log Out button positioned directly under the profile */}
        <div className="pt-0.5">
          <LogOutRow onLogOut={handleLogOutClick} />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogOutModal}
        onClose={() => setShowLogOutModal(false)}
        onConfirm={handleConfirmLogOut}
      />
    </aside>
  );
}
