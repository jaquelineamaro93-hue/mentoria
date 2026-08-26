'use client';

import AppShell from '@/components/AppShell';

interface StandardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function StandardLayout({
  children,
  className = '',
}: StandardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
