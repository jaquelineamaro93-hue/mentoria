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
import MuralAtualizado from '@/components/MuralAtualizado';
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
    <div className="flex flex-row w-full h-screen">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
        {/* Header de boas-vindas */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-sky-tint border border-sky flex items-center justify-center text-brown-deep text-xl font-display shrink-0">
            {profile?.nome
              ?.split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase() ?? <UserIcon size={24} />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint mb-1">
              Bem-vinda de volta
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-brown-deep">{primeiroNome}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] uppercase tracking-wide bg-sky-tint border border-sky text-brown-deep px-2.5 py-1 rounded-full">
                Pacote {profile?.tipo_pacote === 'presencial' ? 'Presencial' : 'Online'}
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
          <MuralAtualizado avisos={announcements} />
        </section>

        {/* Trilha de aprendizado / Drive Hub */}
        <section className="mb-10">
          <Eyebrow>
            <FolderOpen size={13} /> Trilha de aprendizado
          </Eyebrow>
          <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-ink mb-1">Materiais da Mentoria SOMA</p>
              <p className="text-sm text-ink-faint">
                Todo o conteúdo, gravações e templates do programa, centralizados em um só lugar.
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

        {/* Atalhos */}
        <section>
          <Eyebrow>Continue sua jornada</Eyebrow>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/exercicios">
              <Panel className="p-6 h-full hover:border-sky transition-colors group">
                <Compass className="text-brown mb-3" size={22} strokeWidth={1.75} />
                <p className="text-ink mb-1 group-hover:text-brown-deep transition-colors">
                  Diagnóstico & Perfil
                </p>
                <p className="text-sm text-ink-faint">
                  Preencha seu mapa &quot;Quem Sou&quot; e acompanhe sua evolução.
                </p>
              </Panel>
            </Link>
            <Link href="/diario">
              <Panel className="p-6 h-full hover:border-sky transition-colors group">
                <NotebookPen className="text-brown mb-3" size={22} strokeWidth={1.75} />
                <p className="text-ink mb-1 group-hover:text-brown-deep transition-colors">
                  Diário de Bordo
                </p>
                <p className="text-sm text-ink-faint">
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
