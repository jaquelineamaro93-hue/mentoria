'use client';

import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="relative min-h-screen w-full bg-white">
      <CollapsibleSidebar />

      {/* Main content area - margin-left accounts for fixed sidebar */}
      <main
        className={`min-h-screen overflow-x-hidden overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-[280px]'
        }`}
      >
        <div className="p-8 md:p-12">
          {/* Quick Tip positioned at top of main content */}
          <div className="mb-8">
            <QuickTip />
          </div>

          {children}
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
