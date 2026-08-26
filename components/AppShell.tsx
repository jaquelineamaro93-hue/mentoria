'use client';

import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
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
          isCollapsed ? 'left-16' : 'left-[300px]'
        }`}
      >
        <div className="w-full h-full overflow-y-auto">
          {/* Standard padding: 24px horizontal (px-6), 24px vertical (py-6) */}
          {/* Applied to ALL 38 pages in (dashboard) */}
          <div className="px-6 py-6 w-full">
            {/* Quick Tip positioned at top of main content */}
            <div className="mb-6">
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
    <UserProvider>
      <SidebarProvider>
        <AppShellContent>{children}</AppShellContent>
      </SidebarProvider>
    </UserProvider>
  );
}
