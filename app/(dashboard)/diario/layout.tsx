import AppShell from '@/components/AppShell';

export default function DiarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
