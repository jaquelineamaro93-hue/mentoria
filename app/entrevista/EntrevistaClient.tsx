'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Briefcase, AlertCircle, Copy, CheckCircle2, Download } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface SOARExperiencia {
  periodo: string;
  empresa: string;
  cargo: string;
  situacao: string;
  acoes: string;
  resultados: string;
  sumario: string;
  competencias: string[];
  aprendizado: string;
  gap: string;
  conexaoVaga: string;
  forca: number;
}

interface AnaliseSoar {
  experiencias: SOARExperiencia[];
  mapaCompetencias: Record<string, string>;
  abertura: string;
  historiasAncora: string[];
  resposta_por_que_sair: string;
  resposta_por_que_vaga: string;
  tratamento_gaps: string;
}

export default function EntrevistaClient({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [aba, setAba] = useState<'novo' | 'minhas'>('novo');
  const [curriculo, setCurriculo] = useState('');
  const [descricaoVaga, setDescricaoVaga] = useState('');
  const [analise, setAnalise] = useState<AnaliseSoar | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const handleGerarSOAR = async () => {
    if (!curriculo.trim() || !descricaoVaga.trim()) {
      alert('Preencha seu currículo e a descrição da vaga');
      return;
    }

    setGerando(true);
    try {
      const res = await fetch('/api/entrevista/gerar-soar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculo,
          descricaoVaga,
        }),
      });

      if (!res.ok) throw new Error('Erro ao gerar análise');

      const data = await res.json();
      setAnalise(data.analise);
      setAba('minhas');
    } catch (erro) {
      console.error('Erro:', erro);
      alert('Erro ao gerar análise SOAR');
    } finally {
      setGerando(false);
    }
  };

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(texto);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-10 md:px-12 max-w-5xl mx-auto w-full">
        <Eyebrow>
          <Sparkles size={14} />
          Preparação para Entrevistas
        </Eyebrow>
        <h1 className="font-display text-3xl text-brown-deep mb-1">SOAR Builder</h1>
        <p className="text-sm text-ink-faint max-w-xl mb-8">
          Mapeie suas experiências com o framework SOAR e receba respostas prontas para entrevistas.
        </p>

        <div className="flex gap-4 mb-8 border-b border-line">
          <button
            onClick={() => setAba('novo')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'novo'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Sparkles size={18} className="inline mr-2" />
            Gerar SOAR
          </button>
          <button
            onClick={() => setAba('minhas')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'minhas'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <BookOpen size={18} className="inline mr-2" />
            Minhas Análises
          </button>
        </div>

        {aba === 'novo' && (
          <div className="space-y-6">
            <Panel className="bg-sky-tint border border-sky p-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-sky-deep flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-sky-deep font-medium mb-1">
                    <strong>SOAR</strong> = Situation, Obstacle, Action, Result
                  </p>
                  <p className="text-sm text-sky-deep">
                    Vamos mapear suas experiências alinhadas com a vaga que você está disputando.
                  </p>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel className="p-6">
                <h3 className="font-medium text-brown-deep mb-3 flex items-center gap-2">
                  <Briefcase size={18} />
                  Seu Currículo / Experiências
                </h3>
                <textarea
                  value={curriculo}
                  onChange={(e) => setCurriculo(e.target.value)}
                  placeholder="Cole suas experiências profissionais aqui:&#10;- Período, Empresa, Cargo&#10;- O que você fez&#10;- Resultados quantificáveis&#10;- Projetos relevantes&#10;&#10;Quanto mais detalhado, melhor a análise!"
                  className="w-full h-72 p-4 border border-line rounded-lg font-mono text-sm focus:outline-none focus:border-brown resize-none bg-cream"
                />
              </Panel>

              <Panel className="p-6">
                <h3 className="font-medium text-brown-deep mb-3 flex items-center gap-2">
                  <Briefcase size={18} />
                  Descrição da Vaga
                </h3>
                <textarea
                  value={descricaoVaga}
                  onChange={(e) => setDescricaoVaga(e.target.value)}
                  placeholder="Cole a descrição completa da vaga aqui:&#10;- Responsabilidades&#10;- Requisitos&#10;- Diferenciais&#10;- Valores da empresa&#10;- Benefícios"
                  className="w-full h-72 p-4 border border-line rounded-lg font-mono text-sm focus:outline-none focus:border-brown resize-none bg-cream"
                />
              </Panel>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleGerarSOAR}
                disabled={gerando || !curriculo.trim() || !descricaoVaga.trim()}
                className="bg-brown-deep text-paper px-8 py-3 rounded-lg font-medium hover:bg-brown transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {gerando ? (
                  <>
                    <div className="animate-spin">⚙️</div>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Gerar Análise SOAR
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {aba === 'minhas' && (
          <div className="space-y-6">
            {!analise ? (
              <Panel className="text-center py-12 p-6">
                <BookOpen size={48} className="mx-auto text-brown-deep mb-4" />
                <p className="text-ink-soft mb-4">Nenhuma análise SOAR gerada ainda</p>
                <button
                  onClick={() => setAba('novo')}
                  className="text-brown-deep hover:text-brown transition underline font-medium"
                >
                  Gerar sua primeira análise
                </button>
              </Panel>
            ) : (
              <>
                <Panel className="bg-sky-tint border border-sky p-6">
                  <h3 className="font-display text-lg text-sky-deep mb-3">🎯 Sua Abertura (3 frases)</h3>
                  <div className="bg-white p-4 rounded border border-sky text-sm text-ink leading-relaxed">
                    {analise.abertura}
                  </div>
                </Panel>

                <Panel className="p-6">
                  <h3 className="font-display text-lg text-brown-deep mb-4">📖 3 Histórias Âncora Prontas</h3>
                  <div className="space-y-4">
                    {analise.historiasAncora.map((historia, idx) => (
                      <div key={idx} className="bg-cream p-4 rounded-lg border border-line">
                        <h4 className="font-medium text-brown-deep mb-2">História #{idx + 1}</h4>
                        <p className="text-sm text-ink leading-relaxed mb-3">{historia}</p>
                        <button
                          onClick={() => handleCopiar(historia)}
                          className={`text-xs font-medium flex items-center gap-1 transition ${
                            copiado === historia
                              ? 'text-green-700'
                              : 'text-brown-deep hover:text-brown'
                          }`}
                        >
                          {copiado === historia ? (
                            <>
                              <CheckCircle2 size={14} />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copiar história
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="bg-yellow-50 border border-yellow-200 p-6">
                  <h3 className="font-display text-lg text-brown-deep mb-4">🤔 Respostas Prontas</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border border-yellow-200">
                      <h4 className="font-medium text-brown-deep mb-2">Por que quer sair da empresa atual?</h4>
                      <p className="text-sm text-ink mb-3">{analise.resposta_por_que_sair}</p>
                      <button
                        onClick={() => handleCopiar(analise.resposta_por_que_sair)}
                        className={`text-xs font-medium flex items-center gap-1 transition ${
                          copiado === analise.resposta_por_que_sair
                            ? 'text-green-700'
                            : 'text-brown-deep hover:text-brown'
                        }`}
                      >
                        {copiado === analise.resposta_por_que_sair ? (
                          <>
                            <CheckCircle2 size={14} />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copiar resposta
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded border border-yellow-200">
                      <h4 className="font-medium text-brown-deep mb-2">Por que quer essa vaga?</h4>
                      <p className="text-sm text-ink mb-3">{analise.resposta_por_que_vaga}</p>
                      <button
                        onClick={() => handleCopiar(analise.resposta_por_que_vaga)}
                        className={`text-xs font-medium flex items-center gap-1 transition ${
                          copiado === analise.resposta_por_que_vaga
                            ? 'text-green-700'
                            : 'text-brown-deep hover:text-brown'
                        }`}
                      >
                        {copiado === analise.resposta_por_que_vaga ? (
                          <>
                            <CheckCircle2 size={14} />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copiar resposta
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded border border-yellow-200">
                      <h4 className="font-medium text-brown-deep mb-2">Como você trata seus gaps?</h4>
                      <p className="text-sm text-ink mb-3">{analise.tratamento_gaps}</p>
                      <button
                        onClick={() => handleCopiar(analise.tratamento_gaps)}
                        className={`text-xs font-medium flex items-center gap-1 transition ${
                          copiado === analise.tratamento_gaps
                            ? 'text-green-700'
                            : 'text-brown-deep hover:text-brown'
                        }`}
                      >
                        {copiado === analise.tratamento_gaps ? (
                          <>
                            <CheckCircle2 size={14} />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copiar resposta
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Panel>

                <Panel className="p-6">
                  <h3 className="font-display text-lg text-brown-deep mb-4">💼 Experiências Mapeadas</h3>
                  <div className="space-y-4">
                    {analise.experiencias.map((exp, idx) => (
                      <div key={idx} className="border border-line p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-brown-deep">{exp.cargo}</h4>
                            <p className="text-xs text-ink-soft">
                              {exp.empresa} • {exp.periodo}
                            </p>
                          </div>
                          <div className="bg-brown-deep text-paper px-3 py-1 rounded-full text-xs font-bold shrink-0">
                            Força: {exp.forca}/5
                          </div>
                        </div>

                        <details className="text-sm space-y-2">
                          <summary className="cursor-pointer font-medium text-brown-deep hover:text-brown transition">
                            Ver detalhes SOAR
                          </summary>
                          <div className="bg-paper p-3 rounded space-y-2 mt-3 text-ink">
                            <div>
                              <strong className="text-brown-deep text-sm">Situação &amp; Obstáculos:</strong>
                              <p className="mt-1 text-sm">{exp.situacao}</p>
                            </div>
                            <div>
                              <strong className="text-brown-deep text-sm">Ações:</strong>
                              <p className="mt-1 text-sm">{exp.acoes}</p>
                            </div>
                            <div>
                              <strong className="text-brown-deep text-sm">Resultados:</strong>
                              <p className="mt-1 text-sm">{exp.resultados}</p>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                              <strong className="text-brown-deep text-xs">Sumário para contar:</strong>
                              <p className="text-ink text-xs italic mt-2">{exp.sumario}</p>
                            </div>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </Panel>

                <div className="flex justify-center gap-3">
                  <button className="flex items-center gap-2 bg-brown-deep text-paper px-6 py-2 rounded-lg font-medium hover:bg-brown transition">
                    <Download size={18} />
                    Baixar em PDF
                  </button>
                  <button
                    onClick={() => setAba('novo')}
                    className="border border-brown-deep text-brown-deep px-6 py-2 rounded-lg font-medium hover:bg-cream transition"
                  >
                    + Gerar novo SOAR
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
