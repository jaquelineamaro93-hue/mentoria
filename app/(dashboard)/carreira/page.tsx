import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CarreiraClient from './CarreiraClient';
import type { CvSimulacao, Profile } from '@/lib/types';

type Etapa = 'cv' | 'vagas' | 'entrevista';

export default async function CarreiraPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const etapa: Etapa =
    params.etapa === 'vagas' || params.etapa === 'entrevista' ? params.etapa : 'cv';

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [
    { data: profile },
    { data: simulacoes },
    { data: vagas },
    { count: soarCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase
      .from('cv_simulacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<CvSimulacao[]>(),
    supabase
      .from('vagas_candidatura')
      .select('*')
      .eq('mentorado_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('soar_analises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const simulacoesSeguras = simulacoes ?? [];
  const vagasSeguras = vagas ?? [];
  const usadasEsteMes = simulacoesSeguras.filter(
    (item) => new Date(item.created_at) >= inicioDoMes
  ).length;
  const ultimaSimulacao = simulacoesSeguras[0];

  return (
    <CarreiraClient
      initialStep={etapa}
      profile={profile}
      userId={user.id}
      simulacoes={simulacoesSeguras}
      usadasEsteMes={usadasEsteMes}
      vagas={vagasSeguras}
      soarCount={soarCount ?? 0}
      latestCurriculo={ultimaSimulacao?.curriculo_texto ?? ''}
      latestVaga={ultimaSimulacao?.vaga_texto ?? ''}
    />
  );
}
