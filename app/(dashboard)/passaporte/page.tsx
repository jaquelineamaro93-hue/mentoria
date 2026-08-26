import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PassaporteClient from './PassaporteClient';
import type { Achievement, Profile, Reward, UserAchievement } from '@/lib/types';

export default async function PassaportePage() {
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

  const { data: conquistas } = await supabase
    .from('achievements')
    .select('*')
    .returns<Achievement[]>();

  const { data: desbloqueadas } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)
    .returns<UserAchievement[]>();

  const { data: recompensas } = await supabase
    .from('rewards')
    .select('*')
    .eq('ativo', true)
    .order('custo_pontos', { ascending: true })
    .returns<Reward[]>();

  return (
    <PassaporteClient
      profile={profile}
      userId={user.id}
      conquistas={conquistas ?? []}
      desbloqueadas={desbloqueadas ?? []}
      recompensas={recompensas ?? []}
    />
  );
}
