'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sparkles, TrendingUp, Save, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { VIA_FORCAS } from '@/lib/prompts';
import { extrairTextoPdf } from '@/lib/pdf';
import { Upload } from 'lucide-react';
import type { Diagnostic, Profile, ResumoPerfil, ViaResultado } from '@/lib/types';

interface Props {
  profile: Profile | null;
  diagnostics: Diagnostic[];
  userId: string;
  viaResultadoInicial?: ViaResultado | null;
}

const FORCAS = [
  'Comunicação',
  'Organização',
  'Análise de dados',
  'Liderança',
  'Criatividade',
  'Negociação',
  'Empatia',
  'Execução',
];

export default function ExerciciosClient({
  profile,
  diagnostics,
  userId,
  viaResultadoInicial = null,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [momentoCarreira, setMomentoCarreira] = useState(
    diagnostics[diagnostics.length - 1]?.momento_carreira ?? ''
  );
  const [objetivos, setObjetivos] = useState(
    diagnostics[diagnostics.length - 1]?.objetivos ?? ''
  );
  const [forcasSelecionadas, setForcasSelecionadas] = useState<string[]>(
    (diagnostics[diagnostics.length - 1]?.habilidades?.forcas as string[]) ?? []
  );

  const [viaResultado, setViaResultado] = useState<ViaResultado | null>(viaResultadoInicial);
  const [viaForcas, setViaForcas] = useState<string[]>(Array(24).fill(''));
  const [viaData, setViaData] = useState('');
  const [enviandoVia, setEnviandoVia] = useState(false);
  const [erroVia, setErroVia] = useState<string | null>(null);
  const [extraindoPdf, setExtraindoPdf] = useState(false);

  const [resumoPerfil, setResumoPerfil] = useState<ResumoPerfil | null>(null);
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState<string | null>(null);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setExtraindoPdf(true);
    setErroVia(null);
    try {
      const texto = await extrairTextoPdf(arquivo);
      const res = await fetch('/api/extrair-via-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setViaForcas(data.forcas);
      posthog.capture('via_pdf_extraido');
    } catch (err) {
      setErroVia(
        err instanceof Error
          ? err.message
          : 'Não consegui ler esse PDF. Tente preencher manualmente.'
      );
    }
    setExtraindoPdf(false);
    e.target.value = '';
  }

  async function gerarResumoPerfil() {
    setGerandoResumo(true);
    setErroResumo(null);
    try {
      const res = await fetch('/api/gerar-resumo-perfil', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResumoPerfil(data.resumo);
      posthog.capture('resumo_perfil_gerado');
    } catch (e) {
      setErroResumo(e instanceof Error ? e.message : 'Não foi possível gerar o resumo agora.');
    }
    setGerandoResumo(false);
  }

  async function enviarVia() {
    setEnviandoVia(true);
    setErroVia(null);
    try {
      const res = await fetch('/api/gerar-analise-via', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forcas: viaForcas, data_teste: viaData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setViaResultado(data.resultado);
      posthog.capture('via_analise_gerada');
    } catch (e) {
      setErroVia(e instanceof Error ? e.message : 'Não foi possível gerar a análise agora.');
    }
    setEnviandoVia(false);
  }

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  function toggleForca(forca: string) {
    setForcasSelecionadas((prev) =>
      prev.includes(forca) ? prev.filter((f) => f !== forca) : [...prev, forca]
    );
  }

  async function handleSalvarDiagnostico() {
    setSalvando(true);
    setMensagem(null);

    const { error } = await supabase.from('diagnostics').insert({
      user_id: userId,
      momento_carreira: momentoCarreira,
      objetivos,
      quem_sou_data: { momento_carreira: momentoCarreira, objetivos },
      habilidades: { forcas: forcasSelecionadas },
      personality_results: {},
    });

    setSalvando(false);

    if (error) {
      posthog.capture('diagnostico_falhou');
      setMensagem('Não foi possível salvar agora. Tente novamente em instantes.');
      return;
    }

    posthog.capture('diagnostico_preenchido', {
      quantidade_diagnosticos_anteriores: diagnostics.length,
      quantidade_forcas_selecionadas: forcasSelecionadas.length,
    });

    setMensagem('Diagnóstico salvo! Ele já aparece na sua linha de evolução.');
    router.refresh();
  }

  const primeiro = diagnostics[0];
  const ultimo = diagnostics[diagnostics.length - 1];

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-6xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-orange mb-2">
            Área de diagnóstico
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-black">Diagnóstico & Perfil</h1>
          <p className="text-sm text-gray-text mt-2">
            Entenda onde você está agora e acompanhe como isso muda ao longo da mentoria.
          </p>
        </div>

        {/* Mapa Quem Sou */}
        <section className="mb-10">
          <Eyebrow>
            <Compass size={13} /> Mapa &quot;Quem Sou&quot;
          </Eyebrow>
          <Panel className="p-6">
            <div className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-gray-text">
                  Momento atual de carreira
                </span>
                <textarea
                  value={momentoCarreira}
                  onChange={(e) => setMomentoCarreira(e.target.value)}
                  rows={3}
                  placeholder="Descreva onde você está profissionalmente agora..."
                  className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-gray-text">
                  Objetivos com a mentoria
                </span>
                <textarea
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  rows={3}
                  placeholder="O que você quer alcançar até o fim do programa?"
                  className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-none"
                />
              </label>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-text block mb-2">
                  Pontos fortes (selecione quantos quiser)
                </span>
                <div className="flex flex-wrap gap-2">
                  {FORCAS.map((forca) => {
                    const ativo = forcasSelecionadas.includes(forca);
                    return (
                      <button
                        key={forca}
                        type="button"
                        onClick={() => toggleForca(forca)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          ativo
                            ? 'bg-mint-light border-mint text-black'
                            : 'bg-white border-gray-faint text-gray-text hover:border-gray-faint hover:text-gray-text'
                        }`}
                      >
                        {forca}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mensagem && (
                <p className="text-sm text-black bg-mint-light border border-mint rounded-md px-4 py-2.5">
                  {mensagem}
                </p>
              )}

              <button
                onClick={handleSalvarDiagnostico}
                disabled={salvando}
                className="self-start flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-paper text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {salvando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {salvando ? 'Salvando...' : 'Salvar diagnóstico'}
              </button>
            </div>
          </Panel>
        </section>

        {/* VIA Character Strengths */}
        <section className="mb-10">
          <Eyebrow>
            <Sparkles size={13} /> VIA Character Strengths
          </Eyebrow>

          {viaResultado ? (
            <Panel className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-text">
                  Feito em{' '}
                  {new Date(viaResultado.data_teste + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {viaResultado.forcas.slice(0, 5).map((f, i) => (
                  <span
                    key={f}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-mint-light border border-mint text-mint"
                  >
                    {i + 1}º {f}
                  </span>
                ))}
              </div>
              {viaResultado.analise_ia && (
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-li:text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{viaResultado.analise_ia}</ReactMarkdown>
                </div>
              )}
            </Panel>
          ) : (
            <Panel className="p-6">
              <p className="text-sm text-black mb-1">
                Você já fez o VIA em{' '}
                <a
                  href="https://www.viacharacter.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mint underline"
                >
                  viacharacter.org
                </a>
                ?
              </p>
              <p className="text-sm text-gray-text mb-5">
                Envie o PDF do seu resultado (mais rápido) ou preencha manualmente as 24
                forças na ordem exata, da 1ª (mais natural) à 24ª (mais escondida). Você
                receberá uma análise gerada a partir da sua combinação única.
              </p>

              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <label className="flex items-center gap-2 text-sm bg-mint-light hover:bg-mint/20 text-mint px-4 py-2.5 rounded-full cursor-pointer transition-colors">
                  {extraindoPdf ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}
                  {extraindoPdf ? 'Lendo o PDF...' : 'Enviar PDF do resultado'}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={extraindoPdf}
                    onChange={handlePdfUpload}
                  />
                </label>
                <span className="text-xs text-gray-text">ou preencha manualmente abaixo</span>
              </div>

              <label className="flex flex-col gap-1.5 mb-4 max-w-[220px]">
                <span className="text-xs uppercase tracking-wide text-gray-text">
                  Data em que fez o teste
                </span>
                <input
                  type="date"
                  value={viaData}
                  onChange={(e) => setViaData(e.target.value)}
                  className="bg-white border border-gray-faint rounded-lg px-4 py-2.5 text-sm text-black focus:border-mint-deep"
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
                {viaForcas.map((valor, i) => (
                  <label key={i} className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-text w-6 text-right shrink-0">
                      {i + 1}º
                    </span>
                    <select
                      value={valor}
                      onChange={(e) => {
                        const novo = [...viaForcas];
                        novo[i] = e.target.value;
                        setViaForcas(novo);
                      }}
                      className="flex-1 bg-white border border-gray-faint rounded-lg px-3 py-2 text-sm text-black focus:border-mint-deep"
                    >
                      <option value="">Selecione...</option>
                      {VIA_FORCAS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {erroVia && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-4">
                  {erroVia}
                </p>
              )}

              <button
                onClick={enviarVia}
                disabled={enviandoVia || viaForcas.some((f) => !f) || !viaData}
                className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                {enviandoVia ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                {enviandoVia ? 'Gerando análise...' : 'Salvar e gerar análise'}
              </button>
            </Panel>
          )}
        </section>

        {/* Resumo de Perfil */}
        <section className="mb-10">
          <Eyebrow>
            <Compass size={13} /> Resumo de perfil
          </Eyebrow>

          {erroResumo && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-4">
              {erroResumo}
            </p>
          )}

          {!resumoPerfil ? (
            <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-black mb-1">Cruzamento de tudo que você já preencheu</p>
                <p className="text-sm text-gray-text">
                  A IA cruza seu Mapa Quem Sou Eu, o diagnóstico e o VIA para gerar um resumo
                  com características, pontos fortes, pontos de atenção e onde focar agora.
                </p>
              </div>
              <button
                onClick={gerarResumoPerfil}
                disabled={gerandoResumo}
                className="shrink-0 flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-paper text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                {gerandoResumo ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                {gerandoResumo ? 'Gerando...' : 'Gerar resumo de perfil'}
              </button>
            </Panel>
          ) : (
            <Panel className="p-6 prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-li:text-black prose-strong:text-black">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumoPerfil.conteudo_markdown}</ReactMarkdown>
            </Panel>
          )}
        </section>

        {/* Evolução do mentorado */}
        <section>
          <Eyebrow>
            <TrendingUp size={13} /> Evolução do mentorado
          </Eyebrow>

          {diagnostics.length === 0 ? (
            <Panel className="p-6 text-sm text-gray-text">
              Salve seu primeiro diagnóstico acima para começar sua linha de evolução.
            </Panel>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <Panel className="p-6">
                <p className="text-[11px] uppercase tracking-wide text-gray-text mb-3">
                  Diagnóstico inicial ·{' '}
                  {new Date(primeiro.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-black leading-relaxed">
                  {primeiro.momento_carreira || 'Sem registro de momento de carreira.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {((primeiro.habilidades?.forcas as string[]) ?? []).map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-faint text-gray-text"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel className="p-6 border-mint">
                <p className="text-[11px] uppercase tracking-wide text-orange mb-3">
                  Momento atual ·{' '}
                  {new Date(ultimo.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-black leading-relaxed">
                  {ultimo.momento_carreira || 'Sem registro de momento de carreira.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {((ultimo.habilidades?.forcas as string[]) ?? []).map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-1 rounded-full bg-mint-light border border-mint text-black"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
