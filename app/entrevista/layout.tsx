import AppShell from '@/components/AppShell';

export default function EntrevistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
