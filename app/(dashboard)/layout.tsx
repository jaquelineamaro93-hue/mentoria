'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import posthog from 'posthog-js';

const subscribeToAuthCookie = () => () => {};

const getAuthUserId = () => document.cookie
  .split('; ')
  .find((cookie) => cookie.startsWith('auth_user_id='))
  ?.split('=')[1];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const userId = useSyncExternalStore(
    subscribeToAuthCookie,
    getAuthUserId,
    () => undefined,
  );

  useEffect(() => {
    if (!userId) {
      router.push('/auth');
      return;
    }

    posthog.identify(userId);
  }, [router, userId]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
