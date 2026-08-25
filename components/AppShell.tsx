'use client';

import { SidebarProvider } from '@/lib/contexts/SidebarContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white">
        <CollapsibleSidebar />

        {/* Main content area - accounts for fixed sidebar */}
        <main className="ml-20 md:ml-64 transition-all duration-300 min-h-screen overflow-y-auto">
          <div className="p-8 md:p-12 max-w-7xl mx-auto">
            {children}

            {/* Quick Tip positioned at bottom of main content */}
            <div className="mt-12">
              <QuickTip />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
