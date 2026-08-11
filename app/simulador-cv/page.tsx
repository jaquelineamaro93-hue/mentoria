import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SimuladorCVClient from './SimuladorCVClient';
import type { CvSimulacao, Profile } from '@/lib/types';

export default async function SimuladorCVPage() {
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

  const { data: simulacoes } = await supabase
    .from('cv_simulacoes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<CvSimulacao[]>();

  const { data: vagas } = await supabase
    .from('vagas_candidatura')
    .select('*')
    .eq('mentorado_id', user.id)
    .order('updated_at', { ascending: false });

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);
  const usadasEsteMes = (simulacoes ?? []).filter(
    (s) => new Date(s.created_at) >= inicioDoMes
  ).length;

  return (
    <SimuladorCVClient
      profile={profile}
      userId={user.id}
      simulacoesIniciais={simulacoes ?? []}
      usadasEsteMes={usadasEsteMes}
      vagasIniciais={vagas ?? []}
    />
  );
}
