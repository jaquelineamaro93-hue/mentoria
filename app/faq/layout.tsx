import AppShell from '@/components/AppShell';

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
