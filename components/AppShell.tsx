'use client';

import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="h-screen w-full overflow-hidden bg-white">
      <CollapsibleSidebar />

      {/* Main content area - single scroll container with margin for fixed sidebar */}
      <main
        className={`h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-[280px]'
        }`}
      >
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
