'use client';

import { useState } from 'react';
import { FileSearch, Loader2, Sparkles, Upload } from 'lucide-react';
import { extrairTextoPdf } from '@/lib/pdf';
import SomaAnalysisOutput, { type SomaAnaliseResumo } from '@/components/SomaAnalysisOutput';

export default function GupyAuditClient({
  historicoInicial,
}: {
  historicoInicial: SomaAnaliseResumo[];
}) {
  const [cargoAlvo, setCargoAlvo] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [vagas, setVagas] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState(historicoInicial);
  const [atual, setAtual] = useState<SomaAnaliseResumo | null>(historicoInicial[0] ?? null);

  async function analisar() {
    if (!cvFile || !vagas.trim()) {
      setErro('Envie o currículo exportado da Gupy e cole ao menos uma vaga-alvo.');
      return;
    }

    setGerando(true);
    setErro(null);

    try {
      const curriculo = await extrairTextoPdf(cvFile);

      const response = await fetch('/api/ferramentas-soma/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ferramenta: 'gupy',
          curriculo,
          vagas,
          cargoAlvo,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível analisar o currículo.');

      const item = data.analise as SomaAnaliseResumo;
      setAtual(item);
      setHistorico((lista) => [item, ...lista.filter((x) => x.id !== item.id)]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível analisar o currículo.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-10 w-full">
      <header className="max-w-4xl mb-8">
        <p className="text-xs uppercase tracking-[0.16em] text-mint-deep mb-2">Mercado de trabalho</p>
        <h1 className="font-display text-3xl md:text-4xl text-black mb-2">Gupy & ATS</h1>
        <p className="text-sm md:text-base text-gray-text leading-relaxed">
          Avalie o currículo que está dentro da Gupy contra vagas reais e veja onde a narrativa, as palavras-chave,
          os requisitos e a leitura humana podem ser fortalecidos.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-faint bg-white p-5 md:p-6">
        <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-5">
          <div>
            <label className="block">
              <span className="text-sm font-medium text-black">Cargo ou direção alvo</span>
              <input
                value={cargoAlvo}
                onChange={(event) => setCargoAlvo(event.target.value)}
                placeholder="Ex.: Analista de CRM Sênior"
                className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint-deep"
              />
            </label>

            <label className="mt-4 block rounded-xl border border-dashed border-gray-faint bg-[#fbfcfd] p-4 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Upload size={16} className="text-mint-deep" />
                <span className="text-sm font-medium text-black">Currículo baixado da Gupy *</span>
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-text">
                {cvFile?.name || 'Na Gupy: usuário → Minha conta → baixar currículo.'}
              </p>
            </label>

            <div className="mt-4 rounded-xl border border-mint bg-mint-light px-4 py-3">
              <p className="text-xs font-medium text-black mb-1">Antes de analisar</p>
              <p className="text-xs text-gray-text leading-relaxed">
                Confira também se o currículo está visível/compartilhável na plataforma e se os campos do perfil estão atualizados.
              </p>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-black">Vaga(s) alvo *</span>
            <p className="text-xs text-gray-text mt-1 mb-2">
              Cole uma, duas ou até três descrições de vaga. Quanto mais específicas, melhor a comparação.
            </p>
            <textarea
              rows={14}
              value={vagas}
              onChange={(event) => setVagas(event.target.value)}
              placeholder="Cole aqui as descrições completas das vagas..."
              className="w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl bg-[#f8f9fa] border border-gray-faint px-4 py-3 text-xs text-gray-text leading-relaxed">
          A SOMA não tem acesso ao score interno da Gaia nem aos pesos privados da Gupy. A nota exibida é uma
          estimativa própria de aderência baseada no conteúdo do currículo e das vagas informadas.
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
          {gerando ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
          {gerando ? 'Auditando currículo...' : 'Auditar currículo da Gupy'}
        </button>
      </section>

      <SomaAnalysisOutput atual={atual} historico={historico} onSelect={setAtual} />
    </main>
  );
}
