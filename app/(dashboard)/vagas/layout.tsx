import AppShell from '@/components/AppShell';

export default function VagasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
