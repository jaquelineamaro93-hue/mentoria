'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { limparIdentidade } from '@/lib/posthog';
import type { Plano, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  planos: Plano[];
}

export default function AssinaturaClient({ profile, planos }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function pagar(planoId: string) {
    setProcessando(planoId);
    setErro(null);
    try {
      const res = await fetch('/api/pagamento/criar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.init_point;
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível iniciar o pagamento agora. Tente novamente em instantes.'
      );
      setProcessando(null);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-display text-3xl text-brown-deep">
            SOMA <span className="text-sky-deep">MENTORIA</span>
          </p>
          <div className="h-px w-12 bg-brown mx-auto my-3" />
        </div>

        <div className="rounded-xl border border-line bg-paper p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center mx-auto mb-5">
            <Lock size={22} className="text-amber-700" />
          </div>
          <h1 className="font-display text-2xl text-brown-deep mb-2">
            Seu acesso está pausado
          </h1>
          <p className="text-sm text-ink-faint mb-6">
            {profile?.nome?.split(' ')[0] ?? 'Olá'}, seu período de acesso à Mentoria SOMA
            chegou ao fim. Renove abaixo pra continuar de onde parou.
          </p>

          {erro && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-4 py-2.5 mb-4 text-left">
              {erro}
            </p>
          )}

          {planos.length === 0 ? (
            <p className="text-sm text-ink-faint">
              Nenhum plano de renovação disponível no momento. Fale diretamente com a Jaque.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mb-6">
              {planos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border border-line rounded-lg px-4 py-3"
                >
                  <div className="text-left">
                    <p className="text-sm text-ink">{p.titulo}</p>
                    <p className="text-xs text-ink-faint">
                      {(p.valor_centavos / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => pagar(p.id)}
                    disabled={processando === p.id}
                    className="flex items-center gap-1.5 bg-brown hover:bg-brown-deep disabled:opacity-60 text-paper text-xs font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                  >
                    {processando === p.id && <Loader2 size={12} className="animate-spin" />}
                    Renovar
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-brown transition-colors mx-auto"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </div>
    </div>
  );
}
