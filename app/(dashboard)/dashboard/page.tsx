import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import type {
  Profile,
  Diagnostic,
  BussolaPosicionamento,
  ViaResultado,
  PdiGuiaSecao,
  PdiResposta,
  JournalNote,
} from '@/lib/types';

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

  let diagnostic: Diagnostic | null = null;
  try {
    const { data } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<Diagnostic>();
    diagnostic = data;
  } catch { diagnostic = null; }

  let quemSouRespostasCompletas = 0;
  try {
    const { data } = await supabase
      .from('quem_sou_eu_respostas')
      .select('bloco, resposta')
      .eq('user_id', user.id);

    const blocosPreenchidos = new Set(
      (data ?? [])
        .filter((item) => typeof item.resposta === 'string' && item.resposta.trim().length > 0)
        .map((item) => item.bloco)
    );

    quemSouRespostasCompletas = BLOCOS_QUEM_SOU_EU.filter((bloco) =>
      blocosPreenchidos.has(bloco.codigo)
    ).length;
  } catch {
    quemSouRespostasCompletas = 0;
  }

  let bussola: BussolaPosicionamento | null = null;
  try {
    const { data } = await supabase.from('bussola_posicionamento').select('*').eq('user_id', user.id).maybeSingle<BussolaPosicionamento>();
    bussola = data;
  } catch { bussola = null; }

  let viaResultado: ViaResultado | null = null;
  try {
    const { data } = await supabase.from('via_resultados').select('*').eq('user_id', user.id).order('data_teste', { ascending: false }).limit(1).maybeSingle<ViaResultado>();
    viaResultado = data;
  } catch { viaResultado = null; }

  let pdiSecoes: PdiGuiaSecao[] = [];
  let pdiRespostas: PdiResposta[] = [];
  try {
    const [{ data: secoes }, { data: respostas }] = await Promise.all([
      supabase.from('pdi_guia_secoes').select('*').order('ordem', { ascending: true }).returns<PdiGuiaSecao[]>(),
      supabase.from('pdi_respostas').select('*').eq('user_id', user.id).returns<PdiResposta[]>(),
    ]);
    pdiSecoes = secoes ?? [];
    pdiRespostas = respostas ?? [];
  } catch { pdiSecoes = []; pdiRespostas = []; }

  let journalNotes: JournalNote[] = [];
  try {
    const { data } = await supabase.from('journal_notes').select('*').eq('user_id', user.id).order('encontro_data', { ascending: false }).limit(12).returns<JournalNote[]>();
    journalNotes = data ?? [];
  } catch { journalNotes = []; }

  let careerJourney = {
    cvAnalyses: [] as Array<{ id: string; resultado_json: any; created_at: string }>,
    applications: [] as Array<{ id: string; empresa: string; cargo: string; etapa: string; fit_score: number | null; updated_at: string }>,
    soarAnalyses: [] as Array<{ id: string; titulo: string | null; created_at: string }>,
  };
  try {
    const [{ data: cvs }, { data: applications }, { data: soars }] = await Promise.all([
      supabase
        .from('cv_simulacoes')
        .select('id, resultado_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('vagas_candidatura')
        .select('id, empresa, cargo, etapa, fit_score, updated_at')
        .eq('mentorado_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('soar_analises')
        .select('id, titulo, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    careerJourney = {
      cvAnalyses: cvs ?? [],
      applications: applications ?? [],
      soarAnalyses: soars ?? [],
    };
  } catch {
    careerJourney = { cvAnalyses: [], applications: [], soarAnalyses: [] };
  }

  let votacaoAtiva = false;
  try {
    const { data } = await supabase.from('enquetes').select('id').eq('ativo', true).eq('tipo', profile?.tipo_pacote === 'presencial' ? 'presencial' : 'online').limit(1);
    votacaoAtiva = !!data && data.length > 0;
  } catch { votacaoAtiva = false; }

  let feedbacks: any[] = [];
  try {
    const { data } = await supabase
      .from('feedback_sessoes')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(5);
    feedbacks = data ?? [];
  } catch { feedbacks = []; }

  return (
    <DashboardClient
      profile={profile}
      diagnostic={diagnostic}
      quemSouRespostasCompletas={quemSouRespostasCompletas}
      totalBlocosQuemSouEu={BLOCOS_QUEM_SOU_EU.length}
      bussola={bussola}
      viaResultado={viaResultado}
      pdiSecoes={pdiSecoes}
      pdiRespostas={pdiRespostas}
      journalNotes={journalNotes}
      votacaoAtiva={votacaoAtiva}
      feedbacks={feedbacks}
      careerJourney={careerJourney}
    />
  );
}
