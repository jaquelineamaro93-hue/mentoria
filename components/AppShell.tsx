'use client';

import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="relative h-screen w-screen bg-white overflow-hidden">
      <CollapsibleSidebar />

      {/* Main content area - margin adjusts with sidebar state */}
      <main
        className={`absolute top-0 right-0 h-full overflow-x-hidden overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'left-16' : 'left-[280px]'
        }`}
      >
        <div className="w-full h-full overflow-y-auto">
          <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
            {/* Quick Tip positioned at top of main content */}
            <div className="mb-8">
              <QuickTip />
            </div>

            {children}
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
