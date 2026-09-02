'use client';

interface StandardLayoutProps {
  children: React.ReactNode;
}

export default function StandardLayout({ children }: StandardLayoutProps) {
  return <>{children}</>;
}
