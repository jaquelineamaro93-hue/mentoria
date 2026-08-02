'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Loader2, Sparkles, History } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { CvSimulacao, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  userId: string;
  simulacoesIniciais: CvSimulacao[];
}

export default function SimuladorCVClient({ profile, simulacoesIniciais }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [curriculo, setCurriculo] = useState('');
  const [vaga, setVaga] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CvSimulacao | null>(
    simulacoesIniciais[0] ?? null
  );
  const [historico, setHistorico] = useState(simulacoesIniciais);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function analisar() {
    if (!curriculo.trim() || !vaga.trim()) return;
    setGerando(true);
    setErro(null);
    try {
      const res = await fetch('/api/gerar-simulacao-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculo, vaga }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data.simulacao);
      setHistorico((prev) => [data.simulacao, ...prev]);
      posthog.capture('simulacao_cv_gerada');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar a análise agora.');
    }
    setGerando(false);
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-6xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
              Ferramenta de carreira
            </p>
            <h1 className="font-display text-3xl text-brown-deep mb-1">Simulador de CV</h1>
            <p className="text-sm text-ink-faint max-w-xl">
              Cole seu currículo e a vaga desejada. A IA analisa como um recrutador
              exigente, otimiza para ATS e entrega um currículo e uma carta prontos.
            </p>
          </div>
          {historico.length > 0 && (
            <button
              onClick={() => setMostrarHistorico((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-brown transition-colors"
            >
              <History size={13} />
              {mostrarHistorico ? 'Ocultar histórico' : `Histórico (${historico.length})`}
            </button>
          )}
        </div>

        {mostrarHistorico && (
          <div className="flex flex-wrap gap-2 mb-6">
            {historico.map((s) => (
              <button
                key={s.id}
                onClick={() => setResultado(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  resultado?.id === s.id
                    ? 'bg-sky-tint border-sky text-sky-deep'
                    : 'border-line text-ink-faint hover:border-line'
                }`}
              >
                {new Date(s.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </button>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-ink-faint">
              Seu currículo atual
            </span>
            <textarea
              value={curriculo}
              onChange={(e) => setCurriculo(e.target.value)}
              rows={12}
              placeholder="Cole aqui o texto do seu currículo atual, com suas experiências, formação e conquistas..."
              className="bg-cream border border-line rounded-lg px-4 py-3 text-sm text-ink focus:border-sky-deep resize-none font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-ink-faint">
              Descrição da vaga desejada
            </span>
            <textarea
              value={vaga}
              onChange={(e) => setVaga(e.target.value)}
              rows={12}
              placeholder="Cole aqui a descrição completa da vaga que você quer aplicar..."
              className="bg-cream border border-line rounded-lg px-4 py-3 text-sm text-ink focus:border-sky-deep resize-none font-mono"
            />
          </label>
        </div>

        {erro && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        <button
          onClick={analisar}
          disabled={gerando || !curriculo.trim() || !vaga.trim()}
          className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper text-sm font-medium px-6 py-3 rounded-full transition-colors mb-10"
        >
          {gerando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {gerando ? 'Analisando como um recrutador...' : 'Analisar e otimizar'}
        </button>

        {resultado && (
          <section>
            <Eyebrow>
              <FileText size={13} /> Resultado da análise
            </Eyebrow>
            <Panel className="p-6 prose prose-sm max-w-none prose-headings:font-display prose-headings:text-brown-deep prose-p:text-ink prose-p:leading-relaxed prose-p:my-4 prose-strong:text-brown-deep prose-li:text-ink prose-table:text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {resultado.resultado_markdown}
              </ReactMarkdown>
            </Panel>
          </section>
        )}
      </main>
    </div>
  );
}
