'use client';

import Sidebar from './Sidebar';
import type { Profile } from '@/lib/types';

interface StandardLayoutProps {
  profile: Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin' | 'foto_url'> | null;
  onSignOut: () => void;
  children: React.ReactNode;
}

export default function StandardLayout({ profile, onSignOut, children }: StandardLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} onSignOut={onSignOut} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
