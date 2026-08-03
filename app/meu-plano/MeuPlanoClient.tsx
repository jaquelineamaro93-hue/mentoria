'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import Sidebar from '@/components/Sidebar';
import { Calendar, Users, Video, FileText, Clock } from 'lucide-react';
import type { Profile, PlanoMentoria } from '@/lib/types';

export default function MeuPlanoClient({
  profile,
  plano,
}: {
  profile: Profile | null;
  plano: PlanoMentoria | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (!plano || plano.codigo === 'teste' || plano.preco_avista === 0.01) {
    return (
      <div className="flex flex-col md:flex-row w-full">
        <Sidebar profile={profile} onSignOut={handleSignOut} />
        <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
          <p className="text-sm text-ink-faint">Nenhum plano ativo no momento. Em breve você verá seu plano aqui.</p>
        </main>
      </div>
    );
  }

  const mesesRestantes = plano.duracao_meses;
  const encontrosOnlineIndividuais = 1;
  const encontrosOnlineColetivos = 6;
  const encontrosPresenciais = 6;

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Seu investimento
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">{plano.nome}</h1>
        <p className="text-sm text-ink-faint max-w-xl mb-8">{plano.foco}</p>

        <div className="bg-white border border-line rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-ink-faint mb-1">Duração total</p>
              <p className="text-2xl font-display text-brown-deep">{mesesRestantes} meses</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-faint mb-1">Status</p>
              <p className="text-sm font-medium text-green-600">Ativo</p>
            </div>
          </div>
          <p className="text-sm text-ink-faint">{plano.descricao_encontros}</p>
        </div>

        <h2 className="font-display text-xl text-brown-deep mb-4">O que você tem incluído</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-line rounded-xl p-4">
            <Video size={18} className="text-sky-deep mb-2" />
            <p className="text-sm font-medium text-brown-deep mb-1">Encontros online</p>
            <p className="text-2xl font-display text-brown-deep mb-2">{encontrosOnlineIndividuais + encontrosOnlineColetivos}</p>
            <p className="text-xs text-ink-faint">{encontrosOnlineIndividuais} individual + {encontrosOnlineColetivos} coletivos</p>
          </div>

          <div className="bg-white border border-line rounded-xl p-4">
            <Users size={18} className="text-sky-deep mb-2" />
            <p className="text-sm font-medium text-brown-deep mb-1">Encontros presenciais</p>
            <p className="text-2xl font-display text-brown-deep mb-2">{encontrosPresenciais}</p>
            <p className="text-xs text-ink-faint">Troca de experiências em grupo</p>
          </div>

          <div className="bg-white border border-line rounded-xl p-4">
            <FileText size={18} className="text-sky-deep mb-2" />
            <p className="text-sm font-medium text-brown-deep mb-1">Ferramentas incluídas</p>
            <p className="text-xs text-ink-faint">PDI, Diagnóstico, Mapa Quem Sou Eu, Simulador de CV e mais</p>
          </div>

          <div className="bg-white border border-line rounded-xl p-4">
            <Clock size={18} className="text-sky-deep mb-2" />
            <p className="text-sm font-medium text-brown-deep mb-1">Seu ritmo</p>
            <p className="text-xs text-ink-faint">Acesso ao portal 24/7 para trabalhar quando quiser</p>
          </div>
        </div>

        <div className="mt-8 bg-sky-deep/10 border border-sky-deep/30 rounded-2xl p-5">
          <p className="text-sm text-brown-deep">
            Tem dúvidas sobre seu plano? Me chama que a gente conversa sobre o melhor caminho pra você.
          </p>
        </div>
      </main>
    </div>
  );
}
