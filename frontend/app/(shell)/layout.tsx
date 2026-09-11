import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Drawer } from '@/components/layout/Drawer';

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop: fixed left sidebar */}
      <Sidebar />

      {/* Main area: offset from sidebar on md+, full width on mobile */}
      <div
        className="flex flex-1 flex-col min-h-screen md:pl-[var(--sidebar-width)]"
      >
        <Header />
        {/* Content scrolls independently; Header is sticky inside this column */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-[var(--bottom-nav-height)] lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile: bottom tab bar (hidden on lg+) */}
      <BottomNav />

      {/* Mobile: slide-out drawer (hidden on lg+, toggled via ShellContext) */}
      <Drawer />
    </div>
  );
}
