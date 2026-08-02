'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import type { TermoVersao } from '@/lib/types';

export default function TermosGate() {
  const supabase = createClient();
  const [termo, setTermo] = useState<TermoVersao | null>(null);
  const [precisaAceitar, setPrecisaAceitar] = useState(false);
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function checar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ultimoTermo } = await supabase
        .from('termos_versoes')
        .select('*')
        .eq('ativo', true)
        .order('publicado_em', { ascending: false })
        .limit(1)
        .single<TermoVersao>();

      if (!ultimoTermo) return;

      const { data: aceite } = await supabase
        .from('termos_aceites')
        .select('id')
        .eq('user_id', user.id)
        .eq('termo_id', ultimoTermo.id)
        .maybeSingle();

      if (!aceite) {
        setTermo(ultimoTermo);
        setPrecisaAceitar(true);
      }
    }

    checar();
  }, [supabase]);

  async function aceitar() {
    if (!termo) return;
    setEnviando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('termos_aceites').insert({
      user_id: user.id,
      termo_id: termo.id,
    });

    posthog.capture('termo_aceito', { versao: termo.versao });
    setEnviando(false);
    setPrecisaAceitar(false);
  }

  if (!precisaAceitar || !termo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-lg bg-paper rounded-2xl border border-line max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-line">
          <p className="font-display text-2xl text-brown-deep">{termo.titulo}</p>
        </div>
        <div className="p-6 overflow-y-auto prose prose-sm max-w-none prose-headings:font-display prose-headings:text-brown-deep prose-p:text-ink prose-strong:text-brown-deep">
          <ReactMarkdown>{termo.conteudo_markdown}</ReactMarkdown>
        </div>
        <div className="p-6 border-t border-line">
          <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={marcado}
              onChange={(e) => setMarcado(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-ink">
              Li e concordo com os termos acima.
            </span>
          </label>
          <button
            onClick={aceitar}
            disabled={!marcado || enviando}
            className="w-full bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper text-sm font-medium px-5 py-3 rounded-full transition-colors"
          >
            {enviando ? 'Salvando...' : 'Aceitar e continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
