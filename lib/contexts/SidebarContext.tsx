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
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
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
