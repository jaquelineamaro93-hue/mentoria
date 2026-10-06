import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ExerciciosClient from './ExerciciosClient';
import type { Diagnostic, Feedback360Summary, Profile, ResumoPerfil, ViaResultado } from '@/lib/types';

export default async function ExerciciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [
    { data: profile },
    { data: diagnostics },
    { data: viaResultados },
    { data: resumosPerfil },
    { data: feedback360Summaries },
  ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
      supabase
        .from('diagnostics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .returns<Diagnostic[]>(),
      supabase
        .from('via_resultados')
        .select('*')
        .eq('user_id', user.id)
        .order('data_teste', { ascending: false })
        .order('created_at', { ascending: false })
        .returns<ViaResultado[]>(),
      supabase
        .from('resumo_perfil')
        .select('*')
        .eq('user_id', user.id)
        .order('gerado_em', { ascending: false })
        .limit(1)
        .returns<ResumoPerfil[]>(),
      supabase
        .from('feedback_360_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'concluida')
        .not('resumo_json', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .returns<Feedback360Summary[]>(),
    ]);

  return (
    <ExerciciosClient
      profile={profile}
      diagnostics={diagnostics ?? []}
      userId={user.id}
      viaResultadosIniciais={viaResultados ?? []}
      resumoPerfilInicial={resumosPerfil?.[0] ?? null}
      feedback360SummaryInicial={feedback360Summaries?.[0] ?? null}
    />
  );
}
