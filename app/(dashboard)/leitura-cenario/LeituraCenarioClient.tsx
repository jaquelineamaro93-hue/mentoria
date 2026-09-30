'use client';

import { useState } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import SomaAnalysisOutput, { type SomaAnaliseResumo } from '@/components/SomaAnalysisOutput';

export default function LeituraCenarioClient({
  historicoInicial,
}: {
  historicoInicial: SomaAnaliseResumo[];
}) {
  const [titulo, setTitulo] = useState('');
  const [situacao, setSituacao] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [envolvidos, setEnvolvidos] = useState('');
  const [discurso, setDiscurso] = useState('');
  const [pratica, setPratica] = useState('');
  const [restricoes, setRestricoes] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState(historicoInicial);
  const [atual, setAtual] = useState<SomaAnaliseResumo | null>(historicoInicial[0] ?? null);

  async function analisar() {
    if (!situacao.trim() || !objetivo.trim()) {
      setErro('Descreva a situação e o que você quer alcançar.');
      return;
    }

    setGerando(true);
    setErro(null);

    try {
      const response = await fetch('/api/ferramentas-soma/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ferramenta: 'cenario',
          titulo,
          situacao,
          objetivo,
          envolvidos,
          discurso,
          pratica,
          restricoes,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível analisar o cenário.');

      const item = data.analise as SomaAnaliseResumo;
      setAtual(item);
      setHistorico((lista) => [item, ...lista.filter((x) => x.id !== item.id)]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível analisar o cenário.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-10 w-full">
      <header className="max-w-4xl mb-8">
        <p className="text-xs uppercase tracking-[0.16em] text-mint-deep mb-2">Crescimento na empresa</p>
        <h1 className="font-display text-3xl md:text-4xl text-black mb-2">Leitura de cenário</h1>
        <p className="text-sm md:text-base text-gray-text leading-relaxed">
          Organize uma situação real do trabalho antes de agir. A SOMA separa fatos de hipóteses, lê você, as outras
          pessoas e o ambiente, mapeia riscos e oportunidades e transforma isso em próximos movimentos.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-faint bg-white p-5 md:p-6">
        <div className="rounded-xl border border-mint bg-mint-light px-4 py-3 mb-5">
          <p className="text-sm font-medium text-black">Não é leitura de mente.</p>
          <p className="text-xs text-gray-text mt-1 leading-relaxed">
            A ferramenta trabalha com fatos, hipóteses e sinais observáveis. O objetivo é aumentar clareza para tomar
            decisões melhores, não adivinhar intenções ou ensinar manipulação.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-black">Título do cenário</span>
            <input
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ex.: Minha proposta não ganha espaço nas reuniões"
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-black">O que está acontecendo? *</span>
            <textarea
              rows={6}
              value={situacao}
              onChange={(event) => setSituacao(event.target.value)}
              placeholder="Conte o contexto, o que aconteceu, quando começou, o que já tentou e quais fatos você observou."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">O que você quer alcançar? *</span>
            <textarea
              rows={4}
              value={objetivo}
              onChange={(event) => setObjetivo(event.target.value)}
              placeholder="Ex.: ganhar autonomia, alinhar expectativa, conseguir apoio, pedir promoção..."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">Quem está envolvido?</span>
            <textarea
              rows={4}
              value={envolvidos}
              onChange={(event) => setEnvolvidos(event.target.value)}
              placeholder="Pessoas, áreas, liderança, pares, clientes internos..."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">O que é dito ou combinado?</span>
            <textarea
              rows={4}
              value={discurso}
              onChange={(event) => setDiscurso(event.target.value)}
              placeholder="Ex.: dizem que há autonomia, que a prioridade é X, que a decisão será compartilhada..."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">O que acontece na prática?</span>
            <textarea
              rows={4}
              value={pratica}
              onChange={(event) => setPratica(event.target.value)}
              placeholder="Traga comportamentos e acontecimentos observáveis, sem tentar explicar a intenção."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-black">Restrições, riscos ou sensibilidades já percebidas</span>
            <textarea
              rows={3}
              value={restricoes}
              onChange={(event) => setRestricoes(event.target.value)}
              placeholder="Ex.: mudança de liderança, relação política, prazo curto, orçamento, conflito anterior..."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>
        </div>

        {erro && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <button
          type="button"
          onClick={analisar}
          disabled={gerando}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-mint-deep px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {gerando ? <Loader2 size={16} className="animate-spin" /> : <Compass size={16} />}
          {gerando ? 'Lendo cenário...' : 'Construir leitura de cenário'}
        </button>
      </section>

      <SomaAnalysisOutput atual={atual} historico={historico} onSelect={setAtual} />
    </main>
  );
}
