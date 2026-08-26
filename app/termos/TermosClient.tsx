'use client';

import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import StandardLayout from '@/components/StandardLayout';
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
    <StandardLayout>
      <div className="flex flex-col md:flex-row w-full">

      <main className="flex-1 px-6 py-10 md:px-12 max-w-5xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
          Consulta
        </p>
        <h1 className="font-display text-3xl text-black mb-1">
          {termo?.titulo ?? 'Termo de Aceite'}
        </h1>

        {aceitoEm && (
          <p className="flex items-center gap-1.5 text-sm text-mint mb-6">
            <CheckCircle2 size={15} />
            Aceito em {new Date(aceitoEm).toLocaleDateString('pt-BR')} às{' '}
            {new Date(aceitoEm).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {termo ? (
          <Panel className="p-6">
            <div className="mb-5 pb-5 border-b border-gray-faint grid sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-text mb-0.5">
                  Programa
                </p>
                <p className="text-sm text-black">SOMA Mentoria</p>
                <p className="text-xs text-gray-text">Programa de Desenvolvimento de Carreira</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-text mb-0.5">
                  Mentoranda
                </p>
                <p className="text-sm text-black">{profile?.nome ?? 'Não identificado'}</p>
                <p className="text-xs text-gray-text">{profile?.email}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-relaxed prose-p:my-4 prose-strong:text-black prose-li:text-black prose-li:my-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{termo.conteudo_markdown}</ReactMarkdown>
            </div>
          </Panel>
        ) : (
          <p className="text-sm text-gray-text">Nenhum termo publicado ainda.</p>
        )}
      </main>
    </div>
    </StandardLayout>
  );
}
