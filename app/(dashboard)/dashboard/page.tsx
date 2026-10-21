import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import type {
  Profile, Diagnostic, BussolaPosicionamento,
  ViaResultado, PdiGuiaSecao, PdiResposta, JournalNote,
} from '@/lib/types';

// Todas as consultas são independentes e filtradas pela sessão autenticada.
// Executá-las em paralelo remove viagens sequenciais desnecessárias ao Supabase.
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    profileResult,
    entrevistaResult,
    diagnosticResult,
    quemSouResult,
    bussolaResult,
    viaResult,
    secoesResult,
    respostasResult,
    journalResult,
    cvsResult,
    candidaturasResult,
    soarsResult,
    enquetesResult,
    feedbacksResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('entrevistas_iniciais')
      .select('momento_profissional,objetivo_principal,maior_desafio,prioridade_90_dias')
      .eq('user_id', user.id).maybeSingle(),
    supabase.from('diagnostics').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle<Diagnostic>(),
    supabase.from('quem_sou_eu_respostas').select('bloco,resposta').eq('user_id', user.id),
    supabase.from('bussola_posicionamento').select('*').eq('user_id', user.id)
      .order('gerado_em', { ascending: false }).limit(1).maybeSingle<BussolaPosicionamento>(),
    supabase.from('via_resultados').select('*').eq('user_id', user.id)
      .order('data_teste', { ascending: false }).limit(1).maybeSingle<ViaResultado>(),
    supabase.from('pdi_guia_secoes').select('*').order('ordem', { ascending: true }).returns<PdiGuiaSecao[]>(),
    supabase.from('pdi_respostas').select('*').eq('user_id', user.id).returns<PdiResposta[]>(),
    supabase.from('journal_notes').select('*').eq('user_id', user.id)
      .order('encontro_data', { ascending: false }).limit(12).returns<JournalNote[]>(),
    supabase.from('cv_simulacoes').select('id,resultado_json,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
    supabase.from('vagas_candidatura').select('id,empresa,cargo,etapa,fit_score,updated_at')
      .eq('mentorado_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('soar_analises').select('id,titulo,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('enquetes').select('id,tipo').eq('ativo', true),
    supabase.from('feedback_sessoes').select('*').eq('user_id', user.id)
      .order('data', { ascending: false }).limit(5),
  ]);

  const profile = profileResult.data ?? null;
  const preenchidos = new Set(
    (quemSouResult.data ?? [])
      .filter(item => typeof item.resposta === 'string' && item.resposta.trim().length > 0)
      .map(item => item.bloco)
  );
  const quemSouRespostasCompletas = BLOCOS_QUEM_SOU_EU.filter(bloco =>
    preenchidos.has(bloco.codigo)
  ).length;

  const careerJourney = {
    cvAnalyses: cvsResult.data ?? [],
    applications: candidaturasResult.data ?? [],
    soarAnalyses: soarsResult.data ?? [],
  };
  const votacaoAtiva = !!enquetesResult.data?.some(enquete =>
    enquete.tipo === (profile?.tipo_pacote === 'presencial' ? 'presencial' : 'online')
  );

  return (
    <DashboardClient
      profile={profile}
      entrevista={entrevistaResult.data ?? null}
      diagnostic={diagnosticResult.data ?? null}
      quemSouRespostasCompletas={quemSouRespostasCompletas}
      totalBlocosQuemSouEu={BLOCOS_QUEM_SOU_EU.length}
      bussola={bussolaResult.data ?? null}
      viaResultado={viaResult.data ?? null}
      pdiSecoes={secoesResult.data ?? []}
      pdiRespostas={respostasResult.data ?? []}
      journalNotes={journalResult.data ?? []}
      votacaoAtiva={votacaoAtiva}
      feedbacks={feedbacksResult.data ?? []}
      careerJourney={careerJourney}
    />
  );
}
