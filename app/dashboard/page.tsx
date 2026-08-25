import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
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
    const { data } = await supabase.from('diagnostics').select('*').eq('user_id', user.id).maybeSingle<Diagnostic>();
    diagnostic = data;
  } catch { diagnostic = null; }

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

  let votacaoAtiva = false;
  try {
    const { data } = await supabase.from('enquetes').select('id').eq('ativo', true).eq('tipo', profile?.tipo_pacote === 'presencial' ? 'presencial' : 'online').limit(1);
    votacaoAtiva = !!data && data.length > 0;
  } catch { votacaoAtiva = false; }

  return (
    <DashboardClient
      profile={profile}
      diagnostic={diagnostic}
      bussola={bussola}
      viaResultado={viaResultado}
      pdiSecoes={pdiSecoes}
      pdiRespostas={pdiRespostas}
      journalNotes={journalNotes}
      votacaoAtiva={votacaoAtiva}
    />
  );
}
