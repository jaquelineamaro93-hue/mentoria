'use client';

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

      {/* Main content area - Flexbox with scroll */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
        <div className="w-full px-6 py-6">
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
      <AppShellContent>{children}</AppShellContent>
    </UserProvider>
  );
}
