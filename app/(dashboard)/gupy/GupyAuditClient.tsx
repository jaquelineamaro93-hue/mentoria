'use client';

import { useState } from 'react';
import { FileSearch, Loader2, Upload, ShieldCheck, Info, TrendingDown, Link2, ExternalLink } from 'lucide-react';
import type { VagaPublica } from '@/lib/gupy-public-job';
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
  const [links, setLinks] = useState(['', '', '']);
  const [vagasExtraidas, setVagasExtraidas] = useState<VagaPublica[]>([]);
  const [falhasLinks, setFalhasLinks] = useState<string[]>([]);
  const [buscandoLinks, setBuscandoLinks] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [reanalisandoId, setReanalisandoId] = useState<string | null>(null);
  const [erroReanalise, setErroReanalise] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState(historicoInicial);
  const [atual, setAtual] = useState<SomaAnaliseResumo | null>(historicoInicial[0] ?? null);

  async function analisar() {
    const descricoesExtraidas = vagasExtraidas.map((vaga, index) =>
      'VAGA EXTRAÍDA ' + (index + 1) + ': ' + vaga.titulo + '\nOrigem: ' + vaga.url + '\n' + vaga.descricao
    ).join('\n\n------\n\n');
    const vagasParaAnalise = [vagas.trim(), descricoesExtraidas].filter(Boolean).join('\n\n------\n\n');
    if (!cvFile || !vagasParaAnalise.trim()) {
      setErro('Envie o currículo exportado da Gupy e informe ao menos uma descrição de vaga ou importe um link público.');

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
          vagas: vagasParaAnalise.slice(0, 38000),
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

  async function buscarLinksPublicos() {
    const selecionados = links.map(x => x.trim()).filter(Boolean);
    if (!selecionados.length) {
      setErro('Adicione ao menos um link de vaga da Gupy.');
      return;
    }
    setBuscandoLinks(true);
    setErro(null);
    setFalhasLinks([]);
    setVagasExtraidas([]);
    try {
      const response = await fetch('/api/ferramentas-soma/gupy-vagas-publicas', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: selecionados }),
        cache: 'no-store',
      });
      const json = await response.json() as {
        error?: string;
        resultados?: Array<{ url: string; ok: boolean; vaga?: VagaPublica; erro?: string }>;
      };
      if (!response.ok) throw new Error(json.error || 'Não foi possível consultar as vagas.');
      const validas = (json.resultados || []).filter(x => x.ok && x.vaga).map(x => x.vaga as VagaPublica);
      setVagasExtraidas(validas);
      const falhas = (json.resultados || []).filter(x => !x.ok).map((x, i) =>
        'Link ' + (i + 1) + ': ' + (x.erro || 'Cole a descrição manualmente.')
      );
      setFalhasLinks(falhas);
      if (!validas.length) setErro('Não foi possível extrair essas páginas. Cole a descrição da vaga no campo abaixo.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha na leitura das vagas.');
    } finally {
      setBuscandoLinks(false);
    }
  }

  async function reanalisarDoHistorico(item: SomaAnaliseResumo) {
    if (gerando || reanalisandoId) return;
    setReanalisandoId(item.id);
    setErroReanalise(null);
    try {
      const response = await fetch('/api/ferramentas-soma/reanalisar-gupy', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ analiseId: item.id }),
      });
      const data = await response.json() as { analise?: SomaAnaliseResumo; error?: string };
      if (!response.ok || !data.analise) throw new Error(data.error || 'Não foi possível gerar a nova leitura.');
      setAtual(data.analise);
      setHistorico(lista => [data.analise as SomaAnaliseResumo, ...lista.filter(x => x.id !== data.analise?.id)]);
    } catch (err) {
      setErroReanalise(err instanceof Error ? err.message : 'Não foi possível gerar a nova análise.');
    } finally {
      setReanalisandoId(null);
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

          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-[#cce2dc] bg-[#f5faf8] p-4">
              <div className="flex items-center gap-2">
                <Link2 size={17} className="text-mint-deep" aria-hidden="true" />
                <p className="text-sm font-semibold text-black">Importar até 3 vagas por link</p>
              </div>
              <p className="mt-1 text-xs leading-5 text-gray-text">
                Cole links individuais de vagas públicas da Gupy. A SOMA tenta ler a descrição,
                requisitos e atividades. Se a página bloquear a leitura, use o texto manual abaixo.
              </p>
              <div className="mt-3 space-y-2">
                {links.map((link, indice) => (
                  <label key={indice} className="block">
                    <span className="sr-only">Link público da vaga {indice + 1}</span>
                    <input
                      type="url"
                      value={link}
                      placeholder={indice === 0 ? 'https://empresa.gupy.io/jobs/123456' : 'Link ' + (indice + 1) + ' (opcional)'}
                      onChange={event => {
                        const novo = [...links];
                        novo[indice] = event.target.value;
                        setLinks(novo);
                        setVagasExtraidas([]);
                        setFalhasLinks([]);
                      }}
                      disabled={gerando || buscandoLinks}
                      className="w-full min-w-0 rounded-lg border border-[#dae9e4] bg-white px-3 py-2.5 text-sm focus:border-mint-deep focus:outline-none disabled:opacity-60"
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={buscarLinksPublicos}
                disabled={buscandoLinks || gerando || !links.some(x => x.trim())}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-mint-deep px-4 py-2 text-sm font-semibold text-mint-deep hover:bg-[#edf7f2] disabled:opacity-50"
              >
                {buscandoLinks ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                {buscandoLinks ? 'Consultando vagas...' : 'Buscar descrições'}
              </button>
              {vagasExtraidas.length > 0 && (
                <div className="mt-4 space-y-2" role="status" aria-live="polite">
                  {vagasExtraidas.map(vaga => (
                    <div key={vaga.url} className="rounded-lg border border-[#bfdfd5] bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#145647]">{vaga.titulo}</p>
                        <a href={vaga.url} target="_blank" rel="noopener noreferrer" aria-label={'Abrir vaga ' + vaga.titulo} className="shrink-0 text-mint-deep">
                          <ExternalLink size={16} aria-hidden="true" />
                        </a>
                      </div>
                      <p className="mt-1 text-xs text-gray-text">{vaga.descricao.length} caracteres importados para comparar</p>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-text">{vaga.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
              {falhasLinks.length > 0 && (
                <div role="alert" className="mt-3 space-y-1 text-xs leading-5 text-[#9a4d39]">
                  {falhasLinks.map((msg, i) => <p key={i}>{msg}</p>)}
                </div>
              )}
            </div>
            <label className="block">
              <span className="text-sm font-medium text-black">Descrição manual (opcional se importou links)</span>
            <p className="text-xs text-gray-text mt-1 mb-2">
              Caso não consiga importar a vaga ou queira acrescentar detalhes, cole sua descrição aqui.
            </p>
            <textarea
              rows={14}
              value={vagas}
              onChange={(event) => setVagas(event.target.value)}
              placeholder="Cole aqui a descrição da vaga quando não houver acesso público pelo link..."
              className="w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
            />
            </label>
          </div>
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
          disabled={gerando || buscandoLinks}
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
      <GupyAnalysisOutput
        atual={atual}
        historico={historico}
        onSelect={setAtual}
        onReanalisar={reanalisarDoHistorico}
        reanalisandoId={reanalisandoId}
        erroReanalise={erroReanalise}
      />
    </main>
  );
}
