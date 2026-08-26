'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  ExternalLink,
  Compass,
  NotebookPen,
  FolderOpen,
  CheckCircle2,
  CircleAlert,
  Circle,
  MapPin,
  Sparkles,
  Target,
  Flame,
  Gem,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { SOMA_ACHIEVEMENTS } from '@/lib/soma-badges';
import type {
  Profile,
  Diagnostic,
  BussolaPosicionamento,
  ViaResultado,
  PdiGuiaSecao,
  PdiResposta,
  JournalNote,
} from '@/lib/types';
import TourPortal from '@/components/TourPortal';

interface Props {
  profile: Profile | null;
  diagnostic: Diagnostic | null;
  bussola: BussolaPosicionamento | null;
  viaResultado: ViaResultado | null;
  pdiSecoes: PdiGuiaSecao[];
  pdiRespostas: PdiResposta[];
  journalNotes: JournalNote[];
  votacaoAtiva: boolean;
}

const DRIVE_URL = 'https://drive.google.com/';

type FaseStatus = 'pendente' | 'em_andamento' | 'concluida';

function StatusBadge({ status }: { status: FaseStatus }) {
  const config = {
    concluida: { label: 'Concluída', className: 'bg-lotus-mint/40 border-lotus-mint text-lotus-brown' },
    em_andamento: { label: 'Em andamento', className: 'bg-lotus-coral/15 border-lotus-coral text-lotus-brown' },
    pendente: { label: 'A iniciar', className: 'bg-white border-gray-faint text-gray-text' },
  }[status];
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border shrink-0 ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function DashboardClient({
  profile,
  diagnostic,
  bussola,
  viaResultado,
  pdiSecoes,
  pdiRespostas,
  journalNotes,
  votacaoAtiva,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'Mentorada';

  // ---- Diagnóstico dos sinais disponíveis (sem inventar dados) ----
  const quemSouCompleto = useMemo(
    () => !!diagnostic?.quem_sou_data && Object.keys(diagnostic.quem_sou_data).length > 0,
    [diagnostic]
  );
  const viaCompleto = !!viaResultado?.forcas?.length;
  const bussolaCompleto = !!(
    bussola && (bussola.norte || bussola.sul || bussola.leste || bussola.oeste || bussola.centro)
  );

  const pdiTotal = pdiSecoes.length;
  const pdiConcluidas = pdiRespostas.filter((r) => r.concluido).length;
  const pdiCompleto = pdiTotal > 0 && pdiConcluidas >= pdiTotal;

  const streakSemanas = useMemo(() => {
    if (!journalNotes.length) return 0;
    const semanaMs = 7 * 24 * 60 * 60 * 1000;
    const hoje = new Date();
    const semanasComRegistro = new Set(
      journalNotes.map((n) => Math.floor((hoje.getTime() - new Date(n.encontro_data).getTime()) / semanaMs))
    );
    let streak = 0;
    while (semanasComRegistro.has(streak)) streak++;
    return streak;
  }, [journalNotes]);

  // ---- Status das 3 fases do programa (90 dias) ----
  const fase1Itens = [quemSouCompleto, viaCompleto, bussolaCompleto];
  const fase1Feitos = fase1Itens.filter(Boolean).length;
  const fase1Status: FaseStatus =
    fase1Feitos === fase1Itens.length ? 'concluida' : fase1Feitos > 0 ? 'em_andamento' : 'pendente';

  const fase2Status: FaseStatus = pdiCompleto ? 'concluida' : pdiConcluidas > 0 ? 'em_andamento' : 'pendente';

  const fase3Status: FaseStatus =
    fase1Status === 'concluida' && fase2Status === 'concluida'
      ? streakSemanas >= 4
        ? 'concluida'
        : 'em_andamento'
      : 'pendente';

  const proximoMarco = !quemSouCompleto
    ? 'Preencher o Mapa Quem Sou Eu'
    : !viaCompleto
    ? 'Concluir o teste VIA Character Strengths'
    : !bussolaCompleto
    ? 'Definir sua Bússola de Posicionamento'
    : !pdiCompleto
    ? 'Entrega da versão do PDI Estratégico'
    : streakSemanas < 4
    ? 'Manter o Diário de Bordo ativo por 4 semanas seguidas'
    : 'Consolidação de resultados e check-in final do ciclo';

  const proximoMarcoHref = !quemSouCompleto
    ? '/quem-sou-eu'
    : !viaCompleto
    ? '/exercicios'
    : !bussolaCompleto
    ? '/exercicios'
    : !pdiCompleto
    ? '/pdi'
    : '/diario';

  // ---- Passaporte de conquistas (apenas o que dá para verificar com os dados carregados) ----
  const sinaisDisponiveis: Record<string, boolean> = {
    quem_sou_eu_completo: quemSouCompleto,
    diagnostico_completo: viaCompleto,
    bussola_completa: bussolaCompleto,
    pdi_completo: pdiCompleto,
    diario_comecado: journalNotes.length > 0,
    diario_ativo_30dias: streakSemanas >= 4,
  };
  const conquistasObtidas = SOMA_ACHIEVEMENTS.filter((a) => sinaisDisponiveis[a.condicao]);

  const pilarConfig = [
    {
      key: 'sabedoria',
      titulo: 'Sabedoria Interna',
      style: { backgroundColor: '#EBAEE6', color: '#2D231E', borderColor: '#D98DD3' },
      texto: viaResultado?.forcas?.length
        ? viaResultado.forcas.slice(0, 3).join(' · ')
        : 'Ainda não mapeada, complete o Diagnóstico & Perfil.',
    },
    {
      key: 'objetividade',
      titulo: 'Objetividade Magnética',
      style: { backgroundColor: '#FF857A', color: '#FFFFFF', borderColor: '#E5685D' },
      texto: bussola?.norte
        ? bussola.norte
        : 'Sem posicionamento definido, preencha sua Bússola.',
    },
    {
      key: 'maestria',
      titulo: 'Maestria em Ação',
      style: { backgroundColor: '#ADEBB3', color: '#2D231E', borderColor: '#8DD694' },
      texto:
        streakSemanas > 0
          ? `${streakSemanas} semana${streakSemanas > 1 ? 's' : ''} consecutiva${streakSemanas > 1 ? 's' : ''} de registro`
          : 'Nenhum registro no Diário de Bordo ainda.',
    },
    {
      key: 'alquimia',
      titulo: 'Alquimia de Resultados',
      style: { backgroundColor: '#6B403C', color: '#FFFFFF', borderColor: '#53302D' },
      texto: `${profile?.pontos_total ?? 0} pontos de evolução acumulados no ciclo`,
    },
  ];

  const etapasConcluidas = [quemSouCompleto, viaCompleto, bussolaCompleto, pdiCompleto].filter(Boolean).length;
  const pontosTotais = profile?.pontos_total ?? 0;

  return (
    <>
      {profile && !profile.tour_concluido && (
        <TourPortal userId={profile.id} aberturaAutomatica />
      )}

      <main className="overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full bg-white">
        {/* SEÇÃO 1: Header de impacto e timeline dos 90 dias */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
          {profile?.foto_url ? (
            <img src={profile.foto_url} alt={profile.nome} className="w-16 h-16 rounded-full object-cover border border-lotus-brown/30 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-lotus-brown/10 border border-lotus-brown/30 flex items-center justify-center text-lotus-brown text-xl font-display shrink-0">
              {profile?.nome?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? <UserIcon size={24} strokeWidth={1.5} />}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-lotus-brown">
              {profile?.genero === 'masculino' ? 'Bem-vindo' : 'Bem-vinda'}, {primeiroNome}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] uppercase tracking-wide bg-lotus-brown/10 border border-lotus-brown/30 text-lotus-brown px-2.5 py-1 rounded-full">
                {profile?.genero === 'masculino' ? 'Mentorando' : 'Mentorada'} {profile?.tipo_pacote === 'presencial' ? 'Presencial' : 'Online'}
              </span>
              <span
                className={`flex items-center gap-1 text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                  profile?.onboarding_concluido
                    ? 'bg-lotus-mint/30 border-lotus-mint text-lotus-brown'
                    : 'bg-lotus-coral/10 border-lotus-coral text-lotus-brown'
                }`}
              >
                {profile?.onboarding_concluido ? (
                  <CheckCircle2 size={12} strokeWidth={1.5} />
                ) : (
                  <CircleAlert size={12} strokeWidth={1.5} />
                )}
                Onboarding {profile?.onboarding_concluido ? 'concluído' : 'pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline dos 90 dias */}
        <section className="mb-8">
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { fase: 'Fase 1 · Dias 1–30', titulo: 'Diagnóstico & Mapeamentos', status: fase1Status },
              { fase: 'Fase 2 · Dias 31–60', titulo: 'Posicionamento & Execução', status: fase2Status },
              { fase: 'Fase 3 · Dias 61–90', titulo: 'Alquimia & Consolidação', status: fase3Status },
            ].map((item) => (
              <Panel key={item.fase} className="p-4 border-gray-faint">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gray-text">{item.fase}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-lotus-brown">{item.titulo}</p>
              </Panel>
            ))}
          </div>

          <Panel className="mt-3 p-5 flex items-center justify-between gap-4 border-lotus-brown/30 bg-lotus-brown/5">
            <div className="flex items-center gap-3">
              <Target size={20} strokeWidth={1.5} className="text-lotus-brown shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-text mb-0.5">Próximo marco</p>
                <p className="text-sm text-lotus-brown">{proximoMarco}</p>
              </div>
            </div>
            <Link
              href={proximoMarcoHref}
              className="shrink-0 text-sm font-medium text-lotus-brown border border-lotus-brown/40 hover:bg-lotus-brown hover:text-white transition-colors px-4 py-2 rounded-lg"
            >
              Continuar
            </Link>
          </Panel>
        </section>

        {/* Resumo Estratégico */}
        <section className="mb-8">
          <Eyebrow>
            <TrendingUp size={13} strokeWidth={1.5} /> Resumo estratégico
          </Eyebrow>
          <Panel className="p-6 border-gray-faint">
            <p className="text-sm text-black leading-relaxed mb-4">
              {viaResultado?.forcas?.length && bussolaCompleto
                ? `Suas forças de assinatura (${viaResultado.forcas.slice(0, 2).join(', ')}) combinadas com o posicionamento definido na Bússola formam a base do seu ciclo. O próximo passo é transformar esse mapeamento em ações concretas no PDI.`
                : viaResultado?.forcas?.length
                ? `Suas forças de assinatura já estão mapeadas: ${viaResultado.forcas.slice(0, 3).join(', ')}. Complete a Bússola de Posicionamento para conectar esse perfil com sua direção de carreira.`
                : 'Complete o Diagnóstico & Perfil para gerar sua síntese estratégica personalizada.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-gray-faint bg-white text-black">
                <Target size={12} strokeWidth={1.5} />
                {etapasConcluidas}/4 etapas concluídas
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-gray-faint bg-white text-black">
                <Sparkles size={12} strokeWidth={1.5} />
                {pontosTotais} pts acumulados
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-gray-faint bg-white text-black">
                <NotebookPen size={12} strokeWidth={1.5} />
                {journalNotes.length} registro{journalNotes.length !== 1 ? 's' : ''} no diário
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-gray-faint bg-white text-black">
                <Award size={12} strokeWidth={1.5} />
                {conquistasObtidas.length} selo{conquistasObtidas.length !== 1 ? 's' : ''} conquistado{conquistasObtidas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </Panel>
        </section>

        {/* Passaporte SOMA */}
        <section className="mb-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Panel className="p-6 border-gray-faint flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-text mb-1">Passaporte SOMA</p>
                <p className="font-display text-4xl text-lotus-brown">{pontosTotais} <span className="text-lg">pts</span></p>
              </div>
              <Link href="/passaporte" className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-lotus-brown hover:underline">
                <Award size={14} strokeWidth={1.5} /> Ver passaporte completo
              </Link>
            </Panel>
            <Panel className="p-6 border-gray-faint flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-text mb-1">Selos conquistados</p>
                <p className="font-display text-4xl text-lotus-brown">{conquistasObtidas.length} <span className="text-lg">/ {SOMA_ACHIEVEMENTS.length}</span></p>
              </div>
              <p className="mt-4 text-[13px] text-gray-text">
                {conquistasObtidas.length === 0 ? 'Comece pelo Mapa Quem Sou Eu para abrir sua jornada.'
                  : conquistasObtidas.length >= 5 ? 'Excelente progresso, continue acumulando selos.'
                  : 'Cada etapa completa rende um novo selo.'}
              </p>
            </Panel>
          </div>
        </section>

        {/* Pilares SOMA (cores vibrantes) */}
        <section className="mb-10">
          <Eyebrow>
            <Gem size={13} strokeWidth={1.5} /> Raio-X dos 4 pilares SOMA
          </Eyebrow>
          <div className="grid sm:grid-cols-2 gap-4">
            {pilarConfig.map((p) => (
              <div key={p.key} className="p-5 rounded-xl border" style={p.style}>
                <p className="text-sm font-medium mb-1.5">{p.titulo}</p>
                <p className="text-sm leading-relaxed" style={{ opacity: 0.85 }}>{p.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO 3: Ações imediatas */}
        <section className="mb-10">
          <Eyebrow>
            <Flame size={13} strokeWidth={1.5} /> Ações imediatas
          </Eyebrow>

          {votacaoAtiva && (
            <Panel className="p-5 mb-3 flex items-center justify-between gap-4 border-lotus-coral/40 bg-lotus-coral/10">
              <div className="flex items-center gap-3">
                <MapPin size={18} strokeWidth={1.5} className="text-lotus-brown shrink-0" />
                <p className="text-sm text-lotus-brown">Há uma votação de encontro em aberto para você.</p>
              </div>
              <Link
                href="/votar-encontro"
                className="shrink-0 text-sm font-medium bg-lotus-brown hover:bg-lotus-brown/90 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Votar agora
              </Link>
            </Panel>
          )}

          <Panel className="divide-y divide-line border-gray-faint">
            {[
              { label: 'Mapa Quem Sou Eu', done: quemSouCompleto, href: '/quem-sou-eu' },
              { label: 'Teste VIA Character Strengths', done: viaCompleto, href: '/exercicios' },
              { label: 'Bússola de Posicionamento', done: bussolaCompleto, href: '/exercicios' },
              { label: 'PDI, Plano de Desenvolvimento Individual', done: pdiCompleto, href: '/pdi' },
            ].map((tarefa) => (
              <Link
                key={tarefa.label}
                href={tarefa.href}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white transition-colors"
              >
                {tarefa.done ? (
                  <CheckCircle2 size={17} strokeWidth={1.5} className="text-lotus-brown shrink-0" />
                ) : (
                  <Circle size={17} strokeWidth={1.5} className="text-gray-text shrink-0" />
                )}
                <span className={`text-sm ${tarefa.done ? 'text-gray-text line-through' : 'text-black'}`}>
                  {tarefa.label}
                </span>
              </Link>
            ))}
          </Panel>
        </section>

        {/* Trilha de aprendizado / Drive Hub */}
        <section className="mb-10">
          <Eyebrow>
            <FolderOpen size={13} strokeWidth={1.5} /> Trilha de aprendizado
          </Eyebrow>
          <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gray-faint">
            <div>
              <p className="text-black mb-1">Materiais da Mentoria SOMA</p>
              <p className="text-sm text-gray-text">
                Todo o conteúdo, gravações e templates do programa, centralizados em um só lugar.
              </p>
            </div>
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-lotus-brown hover:bg-lotus-brown/90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Abrir Drive <ExternalLink size={14} strokeWidth={1.5} />
            </a>
          </Panel>
        </section>

        {/* Atalhos */}
        <section className="mb-10">
          <Eyebrow>Continue sua jornada</Eyebrow>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/exercicios">
              <Panel className="p-6 h-full hover:border-lotus-brown/40 transition-colors group border-gray-faint">
                <Compass className="text-lotus-brown mb-3" size={22} strokeWidth={1.5} />
                <p className="text-black mb-1 group-hover:text-lotus-brown transition-colors">
                  Diagnóstico & Perfil
                </p>
                <p className="text-sm text-gray-text">
                  Preencha seu mapa &quot;Quem Sou&quot; e acompanhe sua evolução.
                </p>
              </Panel>
            </Link>
            <Link href="/diario">
              <Panel className="p-6 h-full hover:border-lotus-brown/40 transition-colors group border-gray-faint">
                <NotebookPen className="text-lotus-brown mb-3" size={22} strokeWidth={1.5} />
                <p className="text-black mb-1 group-hover:text-lotus-brown transition-colors">
                  Diário de Bordo
                </p>
                <p className="text-sm text-gray-text">
                  Registre aprendizados e sacadas dos seus encontros.
                </p>
              </Panel>
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
