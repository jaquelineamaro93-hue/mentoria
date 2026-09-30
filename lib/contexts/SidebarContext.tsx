'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobile: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
}
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try { setIsCollapsed(localStorage.getItem('soma_sidebar_collapsed') === 'true'); } catch { /* Storage can be unavailable. */ }
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => { setIsMobile(media.matches); setIsMobileOpen(false); };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
  const toggleSidebar = useCallback(() => {
    if (isMobile) { setIsMobileOpen((open) => !open); return; }
    setIsCollapsed((current) => {
      const next = !current;
      try { localStorage.setItem('soma_sidebar_collapsed', String(next)); } catch { /* Keep the in-memory preference. */ }
      return next;
    });
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return <SidebarContext.Provider value={{ isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar }}>{children}</SidebarContext.Provider>;
}
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar deve ser usado dentro de um SidebarProvider');
  return context;
};
