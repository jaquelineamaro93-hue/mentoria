'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Users,
  User as UserIcon,
  ExternalLink,
  Compass,
  NotebookPen,
  FolderOpen,
  CheckCircle2,
  CircleAlert,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Announcement, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  announcements: Announcement[];
}

const DRIVE_URL = 'https://drive.google.com/';

export default function DashboardClient({ profile, announcements }: Props) {
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

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-5xl mx-auto w-full">
        {/* Header de boas-vindas */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-300 text-xl font-display shrink-0">
            {profile?.nome
              ?.split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase() ?? <UserIcon size={24} />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cream-faint mb-1">
              Bem-vinda de volta
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-cream">{primeiroNome}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] uppercase tracking-wide bg-gold-500/10 border border-gold-500/30 text-gold-300 px-2.5 py-1 rounded-full">
                Pacote {profile?.tipo_pacote === 'presencial' ? 'Presencial' : 'Online'}
              </span>
              <span
                className={`flex items-center gap-1 text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                  profile?.onboarding_concluido
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {profile?.onboarding_concluido ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <CircleAlert size={12} />
                )}
                Onboarding {profile?.onboarding_concluido ? 'concluído' : 'pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Mural de avisos & próximos encontros */}
        <section className="mb-10">
          <Eyebrow>
            <Calendar size={13} /> Mural de avisos & próximos encontros
          </Eyebrow>

          {announcements.length === 0 ? (
            <Panel className="p-6 text-sm text-cream-faint">
              Nenhum aviso no momento. Fica de olho: novidades sobre encontros aparecem aqui.
            </Panel>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {announcements.map((a) => (
                <Panel key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wide px-2 py-1 rounded-full border shrink-0 ${
                        a.tipo === 'individual'
                          ? 'bg-gold-500/10 border-gold-500/30 text-gold-300'
                          : a.tipo === 'grupo'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : 'bg-panel border-line text-cream-faint'
                      }`}
                    >
                      {a.tipo === 'individual' ? (
                        <UserIcon size={11} />
                      ) : (
                        <Users size={11} />
                      )}
                      {a.tipo === 'individual'
                        ? 'Sessão individual'
                        : a.tipo === 'grupo'
                          ? 'Encontro em grupo'
                          : 'Geral'}
                    </span>
                  </div>
                  <p className="text-sm text-cream mb-1">{a.titulo}</p>
                  {a.descricao && (
                    <p className="text-sm text-cream-faint mb-2">{a.descricao}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-cream-faint">
                      {a.data_evento
                        ? new Date(a.data_evento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Data a definir'}
                    </span>
                    {a.link_url && (
                      <a
                        href={a.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gold-300 hover:text-gold-100 transition-colors"
                      >
                        Acessar <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>

        {/* Trilha de aprendizado / Drive Hub */}
        <section className="mb-10">
          <Eyebrow>
            <FolderOpen size={13} /> Trilha de aprendizado
          </Eyebrow>
          <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-cream mb-1">Materiais da Mentoria SOMA</p>
              <p className="text-sm text-cream-faint">
                Todo o conteúdo, gravações e templates do programa, centralizados em um só lugar.
              </p>
            </div>
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-[#100d12] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Abrir Drive <ExternalLink size={14} />
            </a>
          </Panel>
        </section>

        {/* Atalhos */}
        <section>
          <Eyebrow>Continue sua jornada</Eyebrow>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/exercicios">
              <Panel className="p-6 h-full hover:border-gold-500/40 transition-colors group">
                <Compass className="text-gold-400 mb-3" size={22} strokeWidth={1.75} />
                <p className="text-cream mb-1 group-hover:text-gold-200 transition-colors">
                  Diagnóstico & Perfil
                </p>
                <p className="text-sm text-cream-faint">
                  Preencha seu mapa &quot;Quem Sou&quot; e acompanhe sua evolução.
                </p>
              </Panel>
            </Link>
            <Link href="/diario">
              <Panel className="p-6 h-full hover:border-gold-500/40 transition-colors group">
                <NotebookPen className="text-gold-400 mb-3" size={22} strokeWidth={1.75} />
                <p className="text-cream mb-1 group-hover:text-gold-200 transition-colors">
                  Diário de Bordo
                </p>
                <p className="text-sm text-cream-faint">
                  Registre aprendizados e sacadas dos seus encontros.
                </p>
              </Panel>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
