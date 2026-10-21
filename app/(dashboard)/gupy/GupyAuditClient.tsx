'use client';

import { useState } from 'react';
import { FileSearch, Loader2, Upload, ShieldCheck, ListChecks, Info, TrendingDown } from 'lucide-react';
import { extrairTextoPdf } from '@/lib/pdf';
import type { SomaAnaliseResumo } from '@/components/SomaAnalysisOutput';
import GupyAnalysisOutput from '@/components/GupyAnalysisOutput';

export default function GupyAuditClient({
  historicoInicial,
}: {
  historicoInicial: SomaAnaliseResumo[];
}) {
  const [cargoAlvo, setCargoAlvo] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [vagas, setVagas] = useState('');
  const [observacoes, setObservacoes] = useState('');
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
          observacoes,
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
    <main className="min-w-0 w-full px-3 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
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

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="text-sm font-medium text-black">Histórico e sinais de triagem (opcional)</span>
            <p className="mb-2 mt-1 text-xs leading-relaxed text-gray-text">
              Conte, se desejar, o que você observou em processos anteriores, como candidaturas
              em várias vagas da mesma empresa, reprovações ou mudanças após atualizar seu perfil.
              Não informe CPF, e-mail ou dados de outras pessoas.
            </p>
            <textarea
              rows={5}
              value={observacoes}
              maxLength={1800}
              onChange={(event) => setObservacoes(event.target.value)}
              placeholder="Ex.: Candidatei-me a três vagas da mesma empresa e notei mudanças no retorno. Não sei a causa."
              className="w-full rounded-lg border border-gray-faint px-4 py-3 text-base resize-y focus:border-mint-deep focus:outline-none"
            />
          </label>
          <section className="rounded-xl border border-[#d5e9e3] bg-[#f5fbf8] p-4" aria-labelledby="praticas-gupy-titulo">
            <h2 id="praticas-gupy-titulo" className="flex items-center gap-2 text-sm font-semibold text-[#154c42]">
              <ListChecks size={17} aria-hidden="true" />
              Aprendizados de três anos de testes
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#3e5b52]">
              Conteúdo derivado do Guia GUPY da mentora. As estratégias abaixo refletem
              observações práticas acumuladas em três anos e os recursos visíveis na
              interface de recrutamento. Resultados relatados não são uma garantia para toda candidatura.
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#344c43]">
              <li><strong>Perfil completo:</strong> descreva experiências, datas, cursos e requisitos realmente atendidos.</li>
              <li><strong>Candidaturas na mesma empresa:</strong> o guia registra que inscrições repetidas podem afetar a triagem percebida. Escolha vagas com aderência real e acompanhe o histórico de cada candidatura.</li>
              <li><strong>Likes e dislikes:</strong> a interface de recrutamento apresentada no guia permite curtir e descurtir candidaturas. A mentora observou efeitos no histórico ao longo dos testes, sem acesso aos pesos internos.</li>
              <li><strong>Reorganização e novo cadastro:</strong> o guia documenta experimentos de exclusão e recriação de perfil. A SOMA apresenta a experiência como relato de campo, sem inventar bloqueios permanentes ou garantir que notas sejam apagadas.</li>
            </ul>
          </section>
        </div>

        <div className="mt-5 rounded-xl bg-[#f8f9fa] border border-gray-faint px-4 py-3 text-xs text-gray-text leading-relaxed">
          <span className="inline-flex items-center gap-1 font-semibold"><Info size={14} aria-hidden="true" /> Como ler suas notas</span>
          <span className="mt-1 block">
            A SOMA não tem acesso às notas internas da Gupy nem aos pesos privados dos Agentes de IA.
            A nota de 0 a 100 exibida na análise é uma <strong>estimativa da SOMA para a vaga informada</strong>,
            não o score da Gupy. A ferramenta relaciona fatores verificáveis na vaga e no currículo
            e destaca as observações da mentora sobre histórico e interação de recrutadores, sem atribuir números secretos.
          </span>
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

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-faint bg-white px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-black"><TrendingDown size={17} className="text-[#ad634e]" aria-hidden="true" /> O que pode baixar sua aderência?</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-text">Requisitos essenciais ausentes, informações incompletas, experiência pouco demonstrada e currículo genérico. Confira os motivos na análise.</p>
        </div>
        <div className="rounded-xl border border-gray-faint bg-white px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-black"><ShieldCheck size={17} className="text-mint-deep" aria-hidden="true" /> O que a SOMA não faz</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-text">Não acessa notas privadas, não altera candidaturas na Gupy e não promete aprovação ou reversão de avaliações internas.</p>
        </div>
      </section>
      <GupyAnalysisOutput atual={atual} historico={historico} onSelect={setAtual} />
    </main>
  );
}
