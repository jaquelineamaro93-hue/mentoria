'use client';

import { SidebarProvider } from '@/lib/contexts/SidebarContext';

export default function Primeiros90DiasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}
