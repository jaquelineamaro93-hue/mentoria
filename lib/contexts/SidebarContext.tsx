'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Recupera estado salvo ao carregar (apenas no cliente)
  useEffect(() => {
    const saved = localStorage.getItem('soma_sidebar_collapsed');
    const isMobile = window.innerWidth < 768;

    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    } else if (isMobile) {
      // Auto-colapsa em mobile se não houver preferência salva
      setIsCollapsed(true);
      localStorage.setItem('soma_sidebar_collapsed', JSON.stringify(true));
    }
    setIsHydrated(true);
  }, []);

  // Atalho de teclado (Cmd+B ou Ctrl+B)
  useEffect(() => {
    if (!isHydrated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHydrated]);

  // Recolhe sidebar ao redimensionar para mobile
  useEffect(() => {
    if (!isHydrated) return;

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const saved = localStorage.getItem('soma_sidebar_collapsed');

      // Se não há preferência salva e é mobile, colapsa
      if (!saved && isMobile) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isHydrated]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('soma_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  // Always render provider with default values during SSR
  // Values will update on client hydration via useEffect
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar deve ser usado dentro de um SidebarProvider');
  }
  return context;
};
