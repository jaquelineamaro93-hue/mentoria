'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { AlertCircle, Clock } from 'lucide-react';
import type { Profile } from '@/lib/types';
import StandardLayout from '@/components/StandardLayout';

export default function SessaoExtraClient({
  perfil,
}: {
  perfil: Partial<Profile>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [processando, setProcessando] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function comprarSessaoExtra() {
    setProcessando(true);

    try {
      const res = await fetch('/api/mercadopago/sessao-extra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preco: 200,
          tipo: 'sessao-extra',
        }),
      });

      const data = await res.json();
      if (data.init_point) {
        posthog.capture('sessao_extra_checkout', { user_id: perfil.id });
        window.location.href = data.init_point;
      } else {
        alert('Erro ao gerar link de pagamento. Tenta de novo.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao processar. Tenta de novo.');
    }
    setProcessando(false);
  }

  return (
    <StandardLayout> className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">Sessão Individual</p>
        <h1 className="font-display text-3xl text-black mb-1">Compre sua sessão extra</h1>
        <p className="text-sm text-gray-text max-w-xl mb-8">
          Você é mentorado(a) SOMA. Aqui você consegue comprar sessões individuais extras com seu mentor/mentora.
        </p>

        <div className="bg-white border-2 border-brown-deep rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-8">
            <Clock size={24} className="text-black flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl text-black mb-2">Sessão Individual Extra</h2>
              <p className="text-sm text-gray-text mb-4">
                Duração: 60 minutos
                <br />
                Formato: Online via Google Meet
                <br />
                Uso: Estratégia de carreira, feedback, alinhamento de metas
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mb-8">
            <p className="text-sm text-gray-text mb-2">Valor único</p>
            <p className="font-display text-3xl text-black">R$ 200,00</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex gap-3">
              <AlertCircle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">
                Após confirmar o pagamento, você receberá um email com instruções pra agendar sua sessão.
              </p>
            </div>
          </div>

          <button
            onClick={comprarSessaoExtra}
            disabled={processando}
            className="w-full bg-brown-deep text-white font-medium py-3 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
          >
            {processando ? 'Processando...' : 'Pagar R$ 200,00'}
          </button>
        </div>

        <p className="text-xs text-gray-text text-center">
          Dúvidas? Fale com seu mentor/mentora por email ou WhatsApp.
        </p>
      </StandardLayout>
  );
}
