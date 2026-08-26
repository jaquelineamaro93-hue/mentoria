'use client';

import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <CollapsibleSidebar />

      {/* Main content area - accounts for fixed sidebar */}
      <main
        className={`transition-all duration-300 min-h-screen overflow-x-hidden overflow-y-auto w-full ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
          {children}

          {/* Quick Tip positioned at bottom of main content */}
          <div className="mt-12">
            <QuickTip />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
