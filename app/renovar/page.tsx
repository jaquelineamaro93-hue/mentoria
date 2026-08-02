import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RenovarClient from './RenovarClient';
import type { Profile } from '@/lib/types';

export default async function RenovarPage() {
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

  return <RenovarClient profile={profile} />;
}
