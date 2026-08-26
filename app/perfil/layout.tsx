import AppShell from '@/components/AppShell';

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
