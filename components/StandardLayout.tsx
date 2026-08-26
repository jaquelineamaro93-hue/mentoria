'use client';

import AppShell from './AppShell';

interface StandardLayoutProps {
  children: React.ReactNode;
}

export default function StandardLayout({ children }: StandardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
