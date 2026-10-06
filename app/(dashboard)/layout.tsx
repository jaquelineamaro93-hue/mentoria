import AppShell from '@/components/AppShell';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<Profile>();

    profile = data ?? null;
  }

  return <AppShell initialProfile={profile}>{children}</AppShell>;
}
