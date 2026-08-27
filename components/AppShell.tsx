'use client';

import { SidebarProvider } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar - Fixed width, full height */}
      <aside className="w-[280px] shrink-0 h-full">
        <CollapsibleSidebar />
      </aside>

      {/* Main content area - flex-1 min-w-0 prevents overflow */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        <div className="w-full px-6 md:px-12 py-6 md:py-8 max-w-full">
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
