'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import type { Profile } from '@/lib/types';

interface StandardLayoutProps {
  profile: Profile | null;
  onSignOut: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function StandardLayout({
  profile,
  onSignOut,
  children,
  className = '',
}: StandardLayoutProps) {
  return (
    <div className="flex flex-row w-full h-screen bg-white">
      <Sidebar profile={profile} onSignOut={onSignOut} />
      <main className={`flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full bg-white ${className}`}>
        {children}
      </main>
    </div>
  );
}
