'use client';

/**
 * Mobile bottom tab bar — hidden on desktop (lg+).
 * Full interactive implementation arrives in the mobile responsive pass.
 * For now this renders a structural placeholder at the correct height so
 * the shell layout spacing is correct during desktop development.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  PlusCircle,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { BOTTOM_NAV_ITEMS, type IconName } from '@/lib/constants';

const MOBILE_ICON_MAP: Record<IconName, LucideIcon> = {
  Home,
  FileText,
  PlusCircle,
  User,
  // Other icons that appear in SIDEBAR_SECONDARY_ITEMS — not used in bottom
  // nav but required to satisfy the Record type.
  Bookmark: Home,
  ArrowLeftRight: Home,
  Settings: Home,
  HelpCircle: Home,
  PlayCircle: Home,
  Download: Home,
  Languages: Home,
  LogOut: Home,
};

function isTabActive(pathname: string, href: string): boolean {
  if (href === '/discover') return pathname === '/discover' || pathname === '/';
  return pathname.startsWith(href);
}

interface TabItemProps {
  label: string;
  href: string;
  icon: IconName;
  isNew?: boolean;
  active: boolean;
}

function TabItem({
  label,
  href,
  icon,
  isNew = false,
  active,
}: TabItemProps): React.JSX.Element {
  const Icon = MOBILE_ICON_MAP[icon];
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
      aria-current={active ? 'page' : undefined}
    >
      {isNew ? (
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            'bg-[var(--color-accent)] text-white shadow-sm'
          )}
        >
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
        </span>
      ) : (
        <Icon
          size={22}
          strokeWidth={active ? 2.25 : 1.75}
          aria-hidden="true"
          className={active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}
        />
      )}
      <span
        className={cn(
          'text-[10px] font-medium',
          active && !isNew
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)]'
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function BottomNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[var(--z-header)] flex items-stretch border-t border-[var(--color-border)] bg-white md:hidden"
      style={{ height: 'var(--bottom-nav-height)' }}
      aria-label="Mobile navigation"
    >
      {BOTTOM_NAV_ITEMS.map((item) => (
        <TabItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          isNew={item.href === '/new-assessment'}
          active={isTabActive(pathname, item.href)}
        />
      ))}
    </nav>
  );
}
