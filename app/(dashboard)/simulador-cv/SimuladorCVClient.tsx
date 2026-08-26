'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Loader2,
  Sparkles,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Panel } from '@/components/Panel';
import KanbanTab from '@/app/(dashboard)/vagas/tabs/KanbanTab';
import RankingTab from '@/app/(dashboard)/vagas/tabs/RankingTab';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { formatarTituloInsight } from '@/lib/string-utils';
import type { CvSimulacao, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  userId: string;
  simulacoesIniciais: CvSimulacao[];
  usadasEsteMes: number;
  vagasIniciais?: any[];
}

const LIMITE_GRATIS_MES = 3;

type Aba = 'compatibilidade' | 'curriculo' | 'palavras' | 'entrevista' | 'minhas-vagas' | 'ranking';

export default function SimuladorCVClient({
  profile,
  simulacoesIniciais,
  usadasEsteMes,
  vagasIniciais = [],
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [curriculo, setCurriculo] = useState('');
  const [vaga, setVaga] = useState('');
  const [gerando, setGerando] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [limiteAtingido, setLimiteAtingido] = useState(false);
  const [usadas, setUsadas] = useState(usadasEsteMes);
  const [creditos, setCreditos] = useState(profile?.creditos_simulacao_cv ?? 0);
  const [resultado, setResultado] = useState<CvSimulacao | null>(
    simulacoesIniciais[0] ?? null
  );
  const [historico, setHistorico] = useState(simulacoesIniciais);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [aba, setAba] = useState<Aba>('compatibilidade');
  const [vagas, setVagas] = useState(vagasIniciais ?? []);

  async function handleVagaAtualizada() {
    try {
      const res = await fetch('/api/vagas');
      const data = await res.json();
      setVagas(data.vagas);
    } catch (erro) {
      console.error('Erro ao recarregar vagas:', erro);
    }
  }

  const restantesGratis = Math.max(0, LIMITE_GRATIS_MES - usadas);

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
    setLimiteAtingido(false);
    try {
      const res = await fetch('/api/gerar-simulacao-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculo, vaga }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setLimiteAtingido(true);
        setErro(data.mensagem ?? 'Limite gratuito atingido.');
        setGerando(false);
        return;
      }

      if (!res.ok) throw new Error(data.error);

      setResultado(data.simulacao);
      setHistorico((prev) => [data.simulacao, ...prev]);
      setAba('compatibilidade');
      if (usadas >= LIMITE_GRATIS_MES) {
        setCreditos((c) => Math.max(0, c - 1));
      } else {
        setUsadas((u) => u + 1);
      }
      posthog.capture('simulacao_cv_gerada');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar a análise agora.');
    }
    setGerando(false);
  }

  async function comprarSimulacaoExtra() {
    setComprando(true);
    setErro(null);
    try {
      const res = await fetch('/api/mercadopago/comprar-simulacao-cv', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      posthog.capture('compra_simulacao_cv_iniciada');
      window.location.href = data.init_point;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível iniciar a compra agora.');
    }
    setComprando(false);
  }

  const r = resultado?.resultado_json;

  const corFit = !r
    ? 'text-gray-text'
    : r.fit_percentual >= 70
      ? 'text-green-600'
      : r.fit_percentual >= 45
        ? 'text-amber-600'
        : 'text-red-600';

  const barraFit = !r
    ? 'bg-line'
    : r.fit_percentual >= 70
      ? 'bg-green-500'
      : r.fit_percentual >= 45
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
              Ferramenta de carreira
            </p>
            <h1 className="font-display text-3xl text-black mb-1">Simulador de CV</h1>
            <p className="text-sm text-gray-text">
              Cole seu currículo e a vaga desejada. A IA analisa como um recrutador
              exigente, otimiza para ATS e entrega um currículo e uma carta prontos.
            </p>
          </div>
          {historico.length > 0 && (
            <button
              onClick={() => setMostrarHistorico((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-text hover:text-orange transition-colors"
            >
              <History size={13} />
              {mostrarHistorico ? 'Ocultar histórico' : `Histórico (${historico.length})`}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs px-3 py-1.5 rounded-full bg-mint-light border border-mint text-mint">
            {restantesGratis > 0
              ? `${restantesGratis} simulação${restantesGratis > 1 ? 'ões' : ''} grátis restante${restantesGratis > 1 ? 's' : ''} este mês`
              : 'Simulações grátis deste mês esgotadas'}
          </span>
          {creditos > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#f1e6d6] border border-brown/30 text-brown">
              {creditos} crédito{creditos > 1 ? 's' : ''} extra
            </span>
          )}
          {restantesGratis === 0 && creditos === 0 && (
            <button
              onClick={comprarSimulacaoExtra}
              disabled={comprando}
              className="text-xs px-3 py-1.5 rounded-full bg-brown text-white hover:bg-brown-deep transition-colors disabled:opacity-60"
            >
              {comprando ? 'Abrindo...' : 'Comprar crédito extra (R$ 5)'}
            </button>
          )}
          
        </div>

        {mostrarHistorico && (
          <div className="flex flex-wrap gap-2 mb-6">
            {historico.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setResultado(s);
                  setAba('compatibilidade');
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  resultado?.id === s.id
                    ? 'bg-mint-light border-mint text-mint'
                    : 'border-gray-faint text-gray-text hover:border-gray-faint'
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

        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-gray-text">
              Seu currículo atual
            </span>
            <textarea
              value={curriculo}
              onChange={(e) => setCurriculo(e.target.value)}
              rows={10}
              placeholder="Cole aqui o texto do seu currículo atual, com suas experiências, formação e conquistas..."
              className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-none font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-gray-text">
              Descrição da vaga desejada
            </span>
            <textarea
              value={vaga}
              onChange={(e) => setVaga(e.target.value)}
              rows={10}
              placeholder="Cole aqui a descrição completa da vaga. Se for um link do LinkedIn, abra a vaga, copie o texto da descrição e cole aqui (links do LinkedIn exigem login e não funcionam direto)."
              className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-none font-mono"
            />
          </label>
        </div>

        {erro && !limiteAtingido && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        {limiteAtingido && (
          <Panel className="p-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-black mb-1">Limite gratuito deste mês atingido</p>
              <p className="text-sm text-gray-text">{erro}</p>
            </div>
            <button
              onClick={comprarSimulacaoExtra}
              disabled={comprando}
              className="shrink-0 flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
            >
              {comprando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {comprando ? 'Abrindo pagamento...' : 'Comprar simulação extra (R$ 5)'}
            </button>
          </Panel>
        )}

        <button
          onClick={analisar}
          disabled={gerando || !curriculo.trim() || !vaga.trim() || (limiteAtingido && creditos === 0)}
          className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-white text-sm font-medium px-6 py-3 rounded-full transition-colors mb-10"
        >
          {gerando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {gerando ? 'Analisando como um recrutador...' : 'Analisar e otimizar'}
        </button>

        {r && (
          <section>
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-faint">
              {(
                [
                  ['compatibilidade', 'Compatibilidade'],
                  ['curriculo', 'Currículo'],
                  ['palavras', 'Palavras-chave'],
                  ['entrevista', 'Entrevista'],
                  ['minhas-vagas', 'Minhas Vagas'],
                  ['ranking', 'Ranking'],
                ] as [Aba, string][]
              ).map(([valor, label]) => (
                <button
                  key={valor}
                  onClick={() => setAba(valor)}
                  className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                    aba === valor
                      ? 'border-brown text-black'
                      : 'border-transparent text-gray-text hover:text-gray-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {aba === 'compatibilidade' && (
              <div className="flex flex-col gap-6">
                <Panel className="p-6">
                  <div className="flex items-center gap-6 flex-wrap">
                    <p className={`font-display text-5xl ${corFit}`}>
                      {r.fit_percentual}%
                    </p>
                    <div>
                      <p className="text-black font-medium">{r.fit_label}</p>
                      <p className="text-sm text-gray-text">
                        Sua compatibilidade estimada com essa vaga
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-line rounded-full mt-4 overflow-hidden">
                    <div
                      className={`h-full ${barraFit} transition-all`}
                      style={{ width: `${r.fit_percentual}%` }}
                    />
                  </div>
                </Panel>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Panel className="p-5">
                    <p className="text-xs uppercase tracking-wide text-green-700 mb-3 flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Pontos fortes
                    </p>
                    <ul className="flex flex-col gap-2">
                      {r.pontos_fortes.map((p, i) => (
                        <li key={i} className="text-sm text-black leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                  <Panel className="p-5">
                    <p className="text-xs uppercase tracking-wide text-amber-700 mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={13} /> Pontos de atenção
                    </p>
                    <ul className="flex flex-col gap-2">
                      {r.pontos_atencao.map((p, i) => (
                        <li key={i} className="text-sm text-black leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>

                <Panel className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-text mb-1">
                    Faixa salarial estimada
                  </p>
                  <p className="text-lg text-black font-medium">
                    {r.faixa_salarial_estimada}
                  </p>
                </Panel>

                <div>
                  <p className="text-xs uppercase tracking-wide text-red-700 mb-3 flex items-center gap-1.5">
                    <XCircle size={13} /> Os 6 sabotadores do seu currículo
                  </p>
                  <div className="flex flex-col gap-3">
                    {r.sabotadores.map((s, i) => (
                      <Panel key={i} className="p-5">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-red-50 border border-red-300 text-red-700 text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-black font-medium mb-1">{formatarTituloInsight(s.titulo)}</p>
                            <p className="text-sm text-gray-text mb-2">{s.motivo}</p>
                            <p className="text-sm text-mint">{s.correcao}</p>
                          </div>
                        </div>
                      </Panel>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {aba === 'curriculo' && (
              <Panel className="p-6 prose prose-sm  prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-relaxed prose-p:my-3 prose-strong:text-black prose-li:text-black">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {r.curriculo_final_markdown}
                </ReactMarkdown>
                <hr className="my-6" />
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {r.carta_apresentacao_markdown}
                </ReactMarkdown>
              </Panel>
            )}

            {aba === 'palavras' && (
              <Panel className="p-6">
                <p className="text-sm text-gray-text mb-4">
                  Inclua essas palavras no seu currículo para passar pelos filtros ATS:
                </p>
                <div className="flex flex-wrap gap-2">
                  {r.palavras_chave_ausentes.map((p, i) => (
                    <span
                      key={i}
                      className="text-sm px-3 py-1.5 rounded-full bg-mint-light border border-mint text-mint"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </Panel>
            )}

            {aba === 'entrevista' && (
              <Panel className="p-6">
                <p className="text-sm text-gray-text mb-4">
                  Perguntas prováveis com base na vaga e no seu perfil:
                </p>
                <div className="flex flex-col gap-3">
                  {r.perguntas_entrevista.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-mint-light border border-mint text-mint text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-black leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {aba === 'minhas-vagas' && (
              <KanbanTab vagas={vagas} onVagaAtualizada={handleVagaAtualizada} />
            )}

            {aba === 'ranking' && (
              <RankingTab vagas={vagas} />
            )}
          </section>
        )}
      </>
  );
}
