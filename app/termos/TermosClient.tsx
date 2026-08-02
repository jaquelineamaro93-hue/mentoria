'use client';

import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile, TermoVersao } from '@/lib/types';

interface Props {
  profile: Profile | null;
  termo: TermoVersao | null;
  aceitoEm: string | null;
}

export default function TermosClient({ profile, termo, aceitoEm }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-10 md:px-12 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Consulta
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">
          {termo?.titulo ?? 'Termo de Aceite'}
        </h1>

        {aceitoEm && (
          <p className="flex items-center gap-1.5 text-sm text-sky-deep mb-6">
            <CheckCircle2 size={15} />
            Aceito em {new Date(aceitoEm).toLocaleDateString('pt-BR')} às{' '}
            {new Date(aceitoEm).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {termo ? (
          <Panel className="p-6 prose prose-sm max-w-none prose-headings:font-display prose-headings:text-brown-deep prose-p:text-ink prose-strong:text-brown-deep">
            <ReactMarkdown>{termo.conteudo_markdown}</ReactMarkdown>
          </Panel>
        ) : (
          <p className="text-sm text-ink-faint">Nenhum termo publicado ainda.</p>
        )}
      </main>
    </div>
  );
}
