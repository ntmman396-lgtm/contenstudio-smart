'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { SiteId } from '@/types';

interface SiteContextType {
  currentSite: SiteId;
  setSite: (siteId: SiteId) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

const STORAGE_KEY = 'lc_current_site';

export function SiteProvider({ children }: { children: ReactNode }) {
  const [currentSite, setCurrentSite] = useState<SiteId>('nha-thuoc');

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SiteId | null;
      if (stored === 'nha-thuoc' || stored === 'tiem-chung') {
        setCurrentSite(stored);
      }
    } catch {}
  }, []);

  const setSite = (siteId: SiteId) => {
    setCurrentSite(siteId);
    try {
      localStorage.setItem(STORAGE_KEY, siteId);
    } catch {}
  };

  return (
    <SiteContext.Provider value={{ currentSite, setSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
