import AppShell from '@/components/AppShell';

export default function ExerciciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
