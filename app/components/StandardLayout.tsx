'use client';

interface StandardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function StandardLayout({
  children,
  className = '',
}: StandardLayoutProps) {
  return <>{children}</>;
}
