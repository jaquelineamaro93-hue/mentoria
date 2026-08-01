import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import type { Announcement, Profile } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('data_evento', { ascending: true })
    .limit(6)
    .returns<Announcement[]>();

  return <DashboardClient profile={profile} announcements={announcements ?? []} />;
}
