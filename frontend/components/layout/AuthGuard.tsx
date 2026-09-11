'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStorageItem } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Only run on client
    const token = getStorageItem(STORAGE_KEYS.authToken);
    if (!token) {
      // Redirect to login if trying to access protected routes
      if (pathname !== '/login') {
        router.replace('/login');
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // Optionally show a loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#167844]" />
      </div>
    );
  }

  return <>{children}</>;
}
