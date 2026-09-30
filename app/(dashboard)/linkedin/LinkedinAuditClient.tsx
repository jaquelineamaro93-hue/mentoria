'use client';

import { useState } from 'react';
import { FileText, Linkedin, Loader2, Search, Sparkles, Upload } from 'lucide-react';
import { extrairTextoPdf } from '@/lib/pdf';
import SomaAnalysisOutput, { type SomaAnaliseResumo } from '@/components/SomaAnalysisOutput';

export default function LinkedinAuditClient({
  historicoInicial,
}: {
  historicoInicial: SomaAnaliseResumo[];
}) {
  const [cargoAlvo, setCargoAlvo] = useState('');
  const [ferramentas, setFerramentas] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [diagFile, setDiagFile] = useState<File | null>(null);
  const [diagTexto, setDiagTexto] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState(historicoInicial);
  const [atual, setAtual] = useState<SomaAnaliseResumo | null>(historicoInicial[0] ?? null);

  async function analisar() {
    if (!cvFile || !linkedinFile || !cargoAlvo.trim()) {
      setErro('Envie o CV, o PDF do LinkedIn e informe o cargo-alvo.');
      return;
    }

    setGerando(true);
    setErro(null);

    try {
      const [cv, linkedin, diagnosticoPdf] = await Promise.all([
        extrairTextoPdf(cvFile),
        extrairTextoPdf(linkedinFile),
        diagFile ? extrairTextoPdf(diagFile) : Promise.resolve(''),
      ]);

      const diagnostico = [diagnosticoPdf, diagTexto.trim()].filter(Boolean).join('\n\n');

      const response = await fetch('/api/ferramentas-soma/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ferramenta: 'linkedin',
          cv,
          linkedin,
          diagnostico,
          cargoAlvo,
          ferramentas,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível analisar o LinkedIn.');

      const item = data.analise as SomaAnaliseResumo;
      setAtual(item);
      setHistorico((lista) => [item, ...lista.filter((x) => x.id !== item.id)]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível analisar o LinkedIn.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-10 w-full">
      <header className="max-w-4xl mb-8">
        <p className="text-xs uppercase tracking-[0.16em] text-mint-deep mb-2">Mercado de trabalho</p>
        <h1 className="font-display text-3xl md:text-4xl text-black mb-2">LinkedIn estratégico</h1>
        <p className="text-sm md:text-base text-gray-text leading-relaxed">
          Cruze seu currículo com o perfil atual e seu objetivo profissional para melhorar posicionamento,
          palavras-chave, headline, Sobre, experiências e abordagem de networking.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-faint bg-white p-5 md:p-6">
        <div className="grid lg:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-black">Cargo ou direção alvo *</span>
            <input
              value={cargoAlvo}
              onChange={(event) => setCargoAlvo(event.target.value)}
              placeholder="Ex.: Head de CRM, Gerente de CX, Liderança de Produto"
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">Ferramentas e metodologias que você domina</span>
            <input
              value={ferramentas}
              onChange={(event) => setFerramentas(event.target.value)}
              placeholder="Salesforce, SQL, Power BI, LTV, Churn..."
              className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint-deep"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-5">
          {[
            {
              label: 'Seu CV em PDF *',
              file: cvFile,
              setter: setCvFile,
              hint: 'Use a versão mais atual.',
            },
            {
              label: 'Seu LinkedIn em PDF *',
              file: linkedinFile,
              setter: setLinkedinFile,
              hint: 'No LinkedIn: perfil → Mais → Salvar como PDF.',
            },
            {
              label: 'Diagnóstico complementar',
              file: diagFile,
              setter: setDiagFile,
              hint: 'Opcional: PDF do Link-me ou outro diagnóstico.',
            },
          ].map((item) => (
            <label key={item.label} className="rounded-xl border border-dashed border-gray-faint bg-[#fbfcfd] p-4 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Upload size={16} className="text-mint-deep" />
                <span className="text-sm font-medium text-black">{item.label}</span>
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => item.setter(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-text">{item.file?.name || item.hint}</p>
            </label>
          ))}
        </div>

        <label className="block mt-5">
          <span className="text-sm font-medium text-black">Ou cole o resultado do diagnóstico</span>
          <textarea
            rows={4}
            value={diagTexto}
            onChange={(event) => setDiagTexto(event.target.value)}
            placeholder="Cole aqui o diagnóstico do Link-me ou outro material de apoio..."
            className="mt-2 w-full rounded-lg border border-gray-faint px-4 py-3 text-sm resize-y focus:outline-none focus:border-mint-deep"
          />
        </label>

        <div className="mt-5 rounded-xl bg-mint-light border border-mint px-4 py-3 text-xs text-black leading-relaxed">
          A análise usa palavras-chave e padrões de leitura de recrutadores como referência. A SOMA não tem acesso
          a pesos secretos ou ao algoritmo interno do LinkedIn e não inventa métricas ausentes.
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
          {gerando ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {gerando ? 'Analisando perfil...' : 'Analisar meu LinkedIn'}
        </button>
      </section>

      <SomaAnalysisOutput atual={atual} historico={historico} onSelect={setAtual} />
    </main>
  );
}
