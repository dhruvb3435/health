'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';

export function useMobileNavigation() {
  const pathname = usePathname();
  const { setIsMobileMenuOpen } = useUIStore();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, setIsMobileMenuOpen]);
}
