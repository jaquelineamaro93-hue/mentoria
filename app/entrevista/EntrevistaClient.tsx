'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Briefcase, AlertCircle, Copy, CheckCircle2, Download, ChevronDown, ChevronUp, Trash2, Target, MessageSquare, Loader2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import StandardLayout from '@/components/StandardLayout';
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

interface AnaliseSalva {
  id: string;
  titulo: string;
  created_at: string;
  analise: AnaliseSoar;
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

/**
 * Renderiza o texto vindo da IA convertendo **destaques** em negrito.
 * Só trata negrito — nada de HTML cru, o conteúdo entra sempre como texto.
 */
function Texto({ children, className }: { children: string; className?: string }) {
  const partes = (children ?? '').split(/\*\*(.+?)\*\*/g);
  return (
    <p className={className}>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-black">
            {parte}
          </strong>
        ) : (
          parte
        )
      )}
    </p>
  );
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
  const [expandida, setExpandida] = useState<number | null>(null);
  const [analises, setAnalises] = useState<AnaliseSalva[]>([]);
  const [selecionada, setSelecionada] = useState<string | null>(null);

  useEffect(() => {
    async function carregarAnalises() {
      const { data, error } = await supabase
        .from('soar_analises')
        .select('id, titulo, created_at, analise')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnalises(data as AnaliseSalva[]);
        if (data.length > 0) {
          setSelecionada(data[0].id);
          setAnalise(data[0].analise as AnaliseSoar);
        }
      }
    }
    carregarAnalises();
  }, []);

  const handleAbrirAnalise = (item: AnaliseSalva) => {
    setSelecionada(item.id);
    setAnalise(item.analise);
    setExpandida(null);
  };

  const handleApagarAnalise = async (id: string) => {
    if (!confirm('Apagar esta análise?')) return;
    const { error } = await supabase.from('soar_analises').delete().eq('id', id);
    if (error) {
      alert(`Não consegui apagar: ${error.message}`);
      return;
    }
    const restantes = analises.filter((a) => a.id !== id);
    setAnalises(restantes);
    if (selecionada === id) {
      setSelecionada(restantes[0]?.id ?? null);
      setAnalise(restantes[0]?.analise ?? null);
    }
  };

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao gerar análise SOAR');
      }

      setAnalise(data.analise);

      // Guarda no banco para a análise não sumir ao sair da página.
      const { data: salva, error: erroSalvar } = await supabase
        .from('soar_analises')
        .insert({
          user_id: userId,
          titulo: descricaoVaga.trim().split('\n')[0].slice(0, 80),
          curriculo,
          descricao_vaga: descricaoVaga,
          analise: data.analise,
        })
        .select('id, titulo, created_at, analise')
        .single();

      if (erroSalvar) {
        console.error('Erro ao salvar análise:', erroSalvar);
        alert(
          `A análise foi gerada, mas não consegui salvar: ${erroSalvar.message}. Copie o que precisar antes de sair da página.`
        );
      } else if (salva) {
        setAnalises([salva as AnaliseSalva, ...analises]);
        setSelecionada(salva.id);
      }

      setAba('minhas');
    } catch (erro) {
      console.error('Erro:', erro);
      alert(erro instanceof Error ? erro.message : 'Erro ao gerar análise SOAR');
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
    <main className="w-full px-6 py-10 md:px-12">
        <Eyebrow>
          <Sparkles size={14} />
          Preparação para Entrevistas
        </Eyebrow>
        <h1 className="font-display text-3xl text-black mb-1">SOAR Builder</h1>
        <p className="text-sm text-gray-text max-w-xl mb-8">
          Mapeie suas experiências com o framework SOAR e receba respostas prontas para entrevistas.
        </p>

        <div className="flex gap-4 mb-8 border-b border-gray-faint">
          <button
            onClick={() => setAba('novo')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'novo'
                ? 'border-b-2 border-brown text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <Sparkles size={18} className="inline mr-2" />
            Gerar SOAR
          </button>
          <button
            onClick={() => setAba('minhas')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'minhas'
                ? 'border-b-2 border-brown text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <BookOpen size={18} className="inline mr-2" />
            Minhas Análises
          </button>
        </div>

        {aba === 'novo' && (
          <div className="space-y-6">
            <Panel className="bg-mint-light border border-mint p-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-mint flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-mint font-medium mb-1">
                    <strong>SOAR</strong> = Situation, Obstacle, Action, Result
                  </p>
                  <p className="text-sm text-mint">
                    Vamos mapear suas experiências alinhadas com a vaga que você está disputando.
                  </p>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel className="p-6">
                <h3 className="font-medium text-black mb-3 flex items-center gap-2">
                  <Briefcase size={18} />
                  Seu Currículo / Experiências
                </h3>
                <textarea
                  value={curriculo}
                  onChange={(e) => setCurriculo(e.target.value)}
                  placeholder="Cole suas experiências profissionais aqui:&#10;- Período, Empresa, Cargo&#10;- O que você fez&#10;- Resultados quantificáveis&#10;- Projetos relevantes&#10;&#10;Quanto mais detalhado, melhor a análise!"
                  className="w-full h-72 p-4 border border-gray-faint rounded-lg font-mono text-sm focus:outline-none focus:border-brown resize-none bg-white"
                />
              </Panel>

              <Panel className="p-6">
                <h3 className="font-medium text-black mb-3 flex items-center gap-2">
                  <Briefcase size={18} />
                  Descrição da Vaga
                </h3>
                <textarea
                  value={descricaoVaga}
                  onChange={(e) => setDescricaoVaga(e.target.value)}
                  placeholder="Cole a descrição completa da vaga aqui:&#10;- Responsabilidades&#10;- Requisitos&#10;- Diferenciais&#10;- Valores da empresa&#10;- Benefícios"
                  className="w-full h-72 p-4 border border-gray-faint rounded-lg font-mono text-sm focus:outline-none focus:border-brown resize-none bg-white"
                />
              </Panel>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleGerarSOAR}
                disabled={gerando || !curriculo.trim() || !descricaoVaga.trim()}
                className="bg-brown-deep text-white px-8 py-3 rounded-lg font-medium hover:bg-brown transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {gerando ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
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
            {analises.length > 0 && (
              <Panel className="p-4">
                <h3 className="text-xs uppercase tracking-wider text-gray-text mb-3">
                  Análises salvas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analises.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selecionada === item.id
                          ? 'bg-mint-light border-mint text-black'
                          : 'bg-white border-gray-faint text-gray-text hover:border-brown-deep'
                      }`}
                    >
                      <button
                        onClick={() => handleAbrirAnalise(item)}
                        className="text-left font-medium"
                      >
                        {item.titulo || 'Análise sem título'}
                        <span className="block text-xs text-gray-text font-normal">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </button>
                      <button
                        onClick={() => handleApagarAnalise(item.id)}
                        title="Apagar análise"
                        className="text-gray-text hover:text-black"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {!analise ? (
              <Panel className="text-center py-12 p-6">
                <BookOpen size={48} className="mx-auto text-black mb-4" />
                <p className="text-gray-text mb-4">Nenhuma análise SOAR gerada ainda</p>
                <button
                  onClick={() => setAba('novo')}
                  className="text-black hover:text-orange transition underline font-medium"
                >
                  Gerar sua primeira análise
                </button>
              </Panel>
            ) : (
              <>
                <Panel className="bg-mint-light border border-mint p-6">
                  <h3 className="font-display text-lg text-mint mb-3 flex items-center gap-2"><Target size={18} />Sua Abertura (3 frases)</h3>
                  <div className="bg-white p-4 rounded-lg border border-mint">
                    <Texto className="text-sm text-black leading-relaxed">{analise.abertura}</Texto>
                  </div>
                </Panel>

                <Panel className="p-6">
                  <h3 className="font-display text-lg text-black mb-4 flex items-center gap-2"><BookOpen size={18} />3 Histórias Âncora Prontas</h3>
                  <div className="space-y-4">
                    {analise.historiasAncora.map((historia, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-gray-faint">
                        <h4 className="font-medium text-black mb-2">História #{idx + 1}</h4>
                        <Texto className="text-sm text-black leading-relaxed mb-3">{historia}</Texto>
                        <button
                          onClick={() => handleCopiar(historia)}
                          className={`text-xs font-medium flex items-center gap-1 transition ${
                            copiado === historia
                              ? 'text-green-700'
                              : 'text-black hover:text-brown'
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

                <Panel className="p-6">
                  <h3 className="font-display text-lg text-black mb-4 flex items-center gap-2"><MessageSquare size={18} />Respostas Prontas</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-faint">
                      <h4 className="font-medium text-black mb-2">Por que quer sair da empresa atual?</h4>
                      <Texto className="text-sm text-black mb-3">{analise.resposta_por_que_sair}</Texto>
                      <button
                        onClick={() => handleCopiar(analise.resposta_por_que_sair)}
                        className={`text-xs font-medium flex items-center gap-1 transition ${
                          copiado === analise.resposta_por_que_sair
                            ? 'text-green-700'
                            : 'text-black hover:text-brown'
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

                    <div className="bg-white p-4 rounded-lg border border-gray-faint">
                      <h4 className="font-medium text-black mb-2">Por que quer essa vaga?</h4>
                      <Texto className="text-sm text-black mb-3">{analise.resposta_por_que_vaga}</Texto>
                      <button
                        onClick={() => handleCopiar(analise.resposta_por_que_vaga)}
                        className={`text-xs font-medium flex items-center gap-1 transition ${
                          copiado === analise.resposta_por_que_vaga
                            ? 'text-green-700'
                            : 'text-black hover:text-brown'
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

                    <div className="bg-white p-4 rounded-lg border border-gray-faint">
                      <h4 className="font-medium text-black mb-2">Como você trata seus gaps?</h4>
                      <Texto className="text-sm text-black mb-3">{analise.tratamento_gaps}</Texto>
                      <button
                        onClick={() => handleCopiar(analise.tratamento_gaps)}
                        className={`text-xs font-medium flex items-center gap-1 transition ${
                          copiado === analise.tratamento_gaps
                            ? 'text-green-700'
                            : 'text-black hover:text-brown'
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
                  <h3 className="font-display text-lg text-black mb-4 flex items-center gap-2"><Briefcase size={18} />Experiências Mapeadas</h3>
                  <div className="space-y-4">
                    {analise.experiencias.map((exp, idx) => (
                      <div key={idx} className="border border-gray-faint p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-black">{exp.cargo}</h4>
                            <p className="text-xs text-gray-text">
                              {exp.empresa} • {exp.periodo}
                            </p>
                          </div>
                          <span className="bg-mint-light text-black border border-mint px-3 py-1 rounded-full text-xs font-medium shrink-0">
                            Força {exp.forca}/5
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandida(expandida === idx ? null : idx)}
                          aria-expanded={expandida === idx}
                          className="flex items-center gap-1.5 text-sm font-medium text-black hover:text-orange transition"
                        >
                          {expandida === idx ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                          Ver detalhes SOAR
                        </button>

                        {expandida === idx && (
                          <div className="bg-white border border-gray-faint p-4 rounded-lg space-y-3 mt-3 text-black">
                            <div>
                              <strong className="text-black text-sm">Situação &amp; Obstáculos:</strong>
                              <Texto className="mt-1 text-sm">{exp.situacao}</Texto>
                            </div>
                            <div>
                              <strong className="text-black text-sm">Ações:</strong>
                              <Texto className="mt-1 text-sm">{exp.acoes}</Texto>
                            </div>
                            <div>
                              <strong className="text-black text-sm">Resultados:</strong>
                              <Texto className="mt-1 text-sm">{exp.resultados}</Texto>
                            </div>
                            <div className="bg-mint-light p-3 rounded-lg border border-mint">
                              <strong className="text-black text-xs">Sumário para contar:</strong>
                              <Texto className="text-black text-xs italic mt-2">{exp.sumario}</Texto>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>

                <div className="flex justify-center gap-3">
                  <button className="flex items-center gap-2 bg-brown-deep text-white px-6 py-2 rounded-lg font-medium hover:bg-brown transition">
                    <Download size={18} />
                    Baixar em PDF
                  </button>
                  <button
                    onClick={() => setAba('novo')}
                    className="border border-brown-deep text-black px-6 py-2 rounded-lg font-medium hover:bg-white transition"
                  >
                    + Gerar novo SOAR
                  </button>
                </div>
              </>
            )}
          </div>
        )}
    </main>
  );
}
