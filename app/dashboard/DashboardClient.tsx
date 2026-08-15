'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Sparkles,
  User as UserIcon,
  ExternalLink,
  NotebookPen,
  FolderOpen,
  CheckCircle2,
  CircleAlert,
  Award,
  Brain,
  Target,
  Zap,
  BarChart3,
  MapPin,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import MuralAtualizado from '@/components/MuralAtualizado';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { SOMA_ACHIEVEMENTS, getNomePilar } from '@/lib/soma-badges';
import type { Announcement, Profile } from '@/lib/types';
import TourPortal from '@/components/TourPortal';

interface Props {
  profile: Profile | null;
  announcements: Announcement[];
}

const DRIVE_URL = 'https://drive.google.com/';

const PILARES_CONFIG = [
  {
    id: 'sabedoria',
    nome: 'Sabedoria Interna',
    icon: Brain,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    descricao: 'Mapa Quem Sou Eu',
    status: 'Essência Mapeada ✓',
  },
  {
    id: 'objetividade',
    nome: 'Objetividade Magnética',
    icon: Target,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    descricao: 'Bússola de Posicionamento',
    status: 'PDI em Progresso',
  },
  {
    id: 'maestria',
    nome: 'Maestria em Ação',
    icon: Zap,
    cor: 'text-yellow-700',
    bg: 'bg-yellow-50',
    descricao: 'Diário da Jornada',
    status: '3 Encontros Presenciais',
  },
  {
    id: 'alquimia',
    nome: 'Alquimia de Resultados',
    icon: BarChart3,
    cor: 'text-pink-700',
    bg: 'bg-pink-50',
    descricao: 'Metas & Check-in Mensal',
    status: 'Transformação Visível',
  },
];

export default function DashboardClient({ profile, announcements }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [naoVotouEncontro, setNaoVotouEncontro] = useState(false);
  const [ultimosFeedbacks, setUltimosFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        if (profile?.id) {
          const { data: votos } = await supabase
            .from('votos_encontro')
            .select('id')
            .eq('user_id', profile.id)
            .eq('tipo', 'presencial')
            .single()
            .catch(() => ({ data: null }));

          setNaoVotouEncontro(!votos);

          const { data: respostas } = await supabase
            .from('pdi_respostas')
            .select('secao, updated_at')
            .eq('user_id', profile.id)
            .order('updated_at', { ascending: false })
            .limit(3)
            .catch(() => ({ data: [] }));

          setUltimosFeedbacks(respostas || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    }

    carregarDados();
  }, [profile?.id, supabase]);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'Mentorado(a)';
  const saudacao = naoVotouEncontro
    ? `Atenção, ${primeiroNome}! 🎯`
    : `Excelente, ${primeiroNome}! 🌟`;

  const contagemMapeamentos = ultimosFeedbacks.length;
  const progressoGeral = Math.min(contagemMapeamentos * 25, 100);

  return (
    <div className="flex flex-row w-full h-screen">
      {profile && !profile.tour_concluido && (
        <TourPortal userId={profile.id} aberturaAutomatica />
      )}
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-sky-tint border border-sky flex items-center justify-center text-brown-deep text-xl font-display shrink-0">
                {profile?.nome
                  ?.split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() ?? <UserIcon size={24} />}
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl text-brown-deep">
                  {saudacao}
                </h1>
                <p className="text-sm text-ink-faint mt-1">
                  Raio-X da sua jornada SOMA
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-[11px] uppercase tracking-wide bg-sky-tint border border-sky text-brown-deep px-2.5 py-1 rounded-full">
                {profile?.tipo_pacote === 'presencial' ? '🏙️ Presencial' : '💻 Online'}
              </span>
              <span
                className={`flex items-center gap-1 text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                  profile?.onboarding_concluido
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}
              >
                {profile?.onboarding_concluido ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <CircleAlert size={12} />
                )}
                {profile?.onboarding_concluido ? 'Onboarding ✓' : 'Onboarding'}
              </span>
            </div>
          </div>

          {naoVotouEncontro && (
            <Panel className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-amber-800 font-semibold flex items-center gap-2 mb-1">
                    <MapPin size={16} />
                    Encontro Presencial em Pinheiros (SP)
                  </p>
                  <p className="text-sm text-amber-700">
                    A votação está aberta! Defina sua data preferida até terça-feira para garantir sua presença.
                  </p>
                </div>
                <Link
                  href="/votar-encontro"
                  className="shrink-0 flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Votar Agora <ArrowRight size={14} />
                </Link>
              </div>
            </Panel>
          )}

          <Panel className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-xs text-ink-faint uppercase tracking-wide mb-2">
                  Progresso Geral da Trilha SOMA
                </p>
                <h2 className="text-3xl font-display text-brown-deep mb-3">
                  {progressoGeral}%
                </h2>
                <div className="w-full bg-cream rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-brown-deep to-brown transition-all duration-700"
                    style={{ width: `${progressoGeral}%` }}
                  />
                </div>
                <p className="text-sm text-ink-faint">
                  Você completou {contagemMapeamentos} de 4 mapeamentos estratégicos
                </p>
              </div>
              <div className="text-center text-brown-deep">
                <p className="text-5xl font-display">🎯</p>
                <p className="text-xs text-ink-faint mt-2">Evolução em curso</p>
              </div>
            </div>
          </Panel>
        </div>

        <section className="mb-10">
          <Eyebrow>Status dos 4 Pilares SOMA</Eyebrow>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILARES_CONFIG.map((pilar) => {
              const IconComponent = pilar.icon;
              return (
                <Panel key={pilar.id} className={`p-6 ${pilar.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <IconComponent size={24} className={pilar.cor} strokeWidth={1.5} />
                    <CheckCircle2 size={16} className="text-green-600" />
                  </div>
                  <h3 className={`font-medium text-sm ${pilar.cor} mb-1`}>{pilar.nome}</h3>
                  <p className="text-xs text-ink-faint mb-3">{pilar.descricao}</p>
                  <p className="text-xs font-medium text-ink-soft">{pilar.status}</p>
                </Panel>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <Eyebrow>
            <Calendar size={13} /> Mural de avisos & próximos encontros
          </Eyebrow>
          <MuralAtualizado avisos={announcements} />
        </section>

        <section className="mb-10">
          <Eyebrow>Suas Conquistas SOMA</Eyebrow>
          <div className="grid sm:grid-cols-3 gap-4">
            {SOMA_ACHIEVEMENTS.slice(0, 3).map((badge) => (
              <Panel key={badge.id} className="p-4">
                <div className="text-center">
                  <p className="text-4xl mb-2">{badge.emoji}</p>
                  <h3 className="font-medium text-sm text-brown-deep mb-1">{badge.nome}</h3>
                  <p className="text-xs text-ink-faint">{badge.descricao}</p>
                  <span className="inline-block text-[10px] mt-2 px-2.5 py-1 rounded-full bg-cream text-ink-soft">
                    {getNomePilar(badge.pilar)}
                  </span>
                </div>
              </Panel>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/passaporte"
              className="inline-flex items-center gap-2 text-brown-deep hover:text-brown-deep/80 font-medium text-sm"
            >
              Ver Passaporte Completo <Award size={14} />
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <Eyebrow>
            <FolderOpen size={13} /> Trilha de aprendizado
          </Eyebrow>
          <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-ink mb-1">Materiais da Mentoria SOMA</p>
              <p className="text-sm text-ink-faint">
                Conteúdo, gravações e templates do programa, sempre à mão.
              </p>
            </div>
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-brown hover:bg-brown-deep text-paper text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Abrir Drive <ExternalLink size={14} />
            </a>
          </Panel>
        </section>

        <section>
          <Eyebrow>Atalhos da Sua Jornada</Eyebrow>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/meu-pdi">
              <Panel className="p-6 h-full hover:border-brown-deep transition-colors group cursor-pointer">
                <Sparkles className="text-brown mb-3 group-hover:text-brown-deep transition-colors" size={22} strokeWidth={1.75} />
                <p className="text-ink mb-1 font-medium group-hover:text-brown-deep transition-colors">
                  PDI & Documentos
                </p>
                <p className="text-sm text-ink-faint">Gerencie seu plano e anexe recursos.</p>
              </Panel>
            </Link>
            <Link href="/diario">
              <Panel className="p-6 h-full hover:border-brown-deep transition-colors group cursor-pointer">
                <NotebookPen className="text-brown mb-3 group-hover:text-brown-deep transition-colors" size={22} strokeWidth={1.75} />
                <p className="text-ink mb-1 font-medium group-hover:text-brown-deep transition-colors">
                  Diário de Bordo
                </p>
                <p className="text-sm text-ink-faint">Registre sua jornada semana a semana.</p>
              </Panel>
            </Link>
            <Link href="/meu-plano">
              <Panel className="p-6 h-full hover:border-brown-deep transition-colors group cursor-pointer">
                <Award className="text-brown mb-3 group-hover:text-brown-deep transition-colors" size={22} strokeWidth={1.75} />
                <p className="text-ink mb-1 font-medium group-hover:text-brown-deep transition-colors">
                  Meu Plano SOMA
                </p>
                <p className="text-sm text-ink-faint">Visualize seu progresso e metas.</p>
              </Panel>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
