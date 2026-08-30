'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

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
          {/* Standard padding: 48px horizontal (px-12), 32px vertical (py-8) */}
          {/* Applied to ALL 38 pages in (dashboard) */}
          <div className="px-12 py-8 w-full">
            {isDashboard && (
              <div className="mb-6">
                <QuickTip />
              </div>
            )}
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
