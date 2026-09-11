'use client';

import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen w-full bg-white overflow-x-hidden">
      <CollapsibleSidebar />

      {/* Main content area - flex-1 with min-w-0 to prevent overflow */}
      <main className="flex-1 min-w-0 h-full overflow-x-hidden overflow-y-auto transition-all duration-300">
        {/* Standard padding: 48px horizontal (px-12), 32px vertical (py-8) */}
        {/* Applied to ALL pages in (dashboard) */}
        <div className="px-12 py-8 w-full">
          {/* Quick Tip positioned at top of main content */}
          <div className="mb-6">
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
    <UserProvider>
      <SidebarProvider>
        <AppShellContent>{children}</AppShellContent>
      </SidebarProvider>
    </UserProvider>
  );
}
