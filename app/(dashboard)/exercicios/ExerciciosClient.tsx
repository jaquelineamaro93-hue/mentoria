'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Compass,
  FileText,
  History,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  TrendingUp,
  Upload,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Panel, Eyebrow } from '@/components/Panel';
import { posthog } from '@/lib/posthog';
import { VIA_FORCAS } from '@/lib/prompts';
import { extrairTextoPdf } from '@/lib/pdf';
import type { Diagnostic, Profile, ResumoPerfil, ViaResultado } from '@/lib/types';

interface Props {
  profile: Profile | null;
  diagnostics: Diagnostic[];
  userId: string;
  viaResultadosIniciais?: ViaResultado[];
  resumoPerfilInicial?: ResumoPerfil | null;
}

type Tab = 'diagnostico' | 'via' | 'resumo' | 'evolucao';

const TABS: Array<{
  id: Tab;
  label: string;
  icon: typeof Compass;
}> = [
  { id: 'diagnostico', label: 'Diagnóstico', icon: Compass },
  { id: 'via', label: 'Teste VIA', icon: Sparkles },
  { id: 'resumo', label: 'Resumo de perfil', icon: FileText },
  { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
];

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

const VIA_TESTE_URL = 'https://www.viacharacter.org/Survey//Account/Register';

function formatarData(data?: string | null) {
  if (!data) return 'Data não informada';
  const normalizada = data.length === 10 ? `${data}T00:00:00` : data;
  return new Date(normalizada).toLocaleDateString('pt-BR');
}

export default function ExerciciosClient({
  profile,
  diagnostics,
  userId,
  viaResultadosIniciais = [],
  resumoPerfilInicial = null,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tabInicial = TABS.some((tab) => tab.id === tabParam)
    ? (tabParam as Tab)
    : 'diagnostico';

  const [activeTab, setActiveTab] = useState<Tab>(tabInicial);
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

  const [viaResultados, setViaResultados] = useState<ViaResultado[]>(viaResultadosIniciais);
  const [viaForcas, setViaForcas] = useState<string[]>(Array(24).fill(''));
  const [viaData, setViaData] = useState('');
  const [enviandoVia, setEnviandoVia] = useState(false);
  const [erroVia, setErroVia] = useState<string | null>(null);
  const [extraindoPdf, setExtraindoPdf] = useState(false);
  const [mostrarFormularioVia, setMostrarFormularioVia] = useState(viaResultadosIniciais.length === 0);

  const [resumoPerfil, setResumoPerfil] = useState<ResumoPerfil | null>(resumoPerfilInicial);
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState<string | null>(null);

  const viaResultadoAtual = viaResultados[0] ?? null;
  const viaResultadoAnterior = viaResultados[1] ?? null;
  const primeiro = diagnostics[0];
  const ultimo = diagnostics[diagnostics.length - 1];

  function abrirTab(tab: Tab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }

  function prepararNovoVia() {
    setViaForcas(Array(24).fill(''));
    setViaData('');
    setErroVia(null);
    setMostrarFormularioVia(true);
  }

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
    const preenchidas = viaForcas.filter(Boolean);
    if (preenchidas.length !== 24) {
      setErroVia('Preencha as 24 forças antes de salvar.');
      return;
    }

    if (new Set(preenchidas).size !== 24) {
      setErroVia('Cada força deve aparecer apenas uma vez no ranking.');
      return;
    }

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

      const novoResultado = data.resultado as ViaResultado;
      setViaResultados((anteriores) => [
        novoResultado,
        ...anteriores.filter((item) => item.id !== novoResultado.id),
      ]);
      setMostrarFormularioVia(false);
      setViaForcas(Array(24).fill(''));
      setViaData('');
      posthog.capture('via_analise_gerada', {
        quantidade_resultados_anteriores: viaResultados.length,
      });
      router.refresh();
    } catch (e) {
      setErroVia(e instanceof Error ? e.message : 'Não foi possível gerar a análise agora.');
    }

    setEnviandoVia(false);
  }

  function toggleForca(forca: string) {
    setForcasSelecionadas((prev) =>
      prev.includes(forca) ? prev.filter((f) => f !== forca) : [...prev, forca]
    );
  }

  async function handleSalvarDiagnostico() {
    setSalvando(true);
    setMensagem(null);

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

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

    setMensagem('Diagnóstico salvo. O novo registro já entra na sua evolução.');
    router.refresh();
  }

  const viaDuplicada =
    viaForcas.filter(Boolean).length > 0 &&
    new Set(viaForcas.filter(Boolean)).size !== viaForcas.filter(Boolean).length;

  return (
    <>
      <div className="border-b border-gray-faint bg-white px-6 md:px-12 py-4 sticky top-0 z-10">
        <div
          className="flex gap-2 sm:gap-5 overflow-x-auto"
          role="tablist"
          aria-label="Diagnóstico e perfil"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const ativa = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => abrirTab(tab.id)}
                className={[
                  'inline-flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap',
                  ativa
                    ? 'border-b-2 border-mint-deep text-black'
                    : 'border-b-2 border-transparent text-gray-text hover:text-black',
                ].join(' ')}
              >
                <Icon size={16} strokeWidth={1.6} />
                {tab.label}
                {tab.id === 'via' && viaResultados.length > 1 && (
                  <span className="rounded-full bg-mint-light px-2 py-0.5 text-[10px] text-mint-deep">
                    {viaResultados.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-6 py-8 md:px-12 md:py-10 w-full">
        {activeTab === 'diagnostico' && (
          <section className="max-w-6xl">
            <div className="mb-6">
              <Eyebrow>
                <Compass size={13} /> Diagnóstico de carreira
              </Eyebrow>
              <h1 className="font-display text-3xl text-black">Seu momento agora</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-text">
                Atualize este diagnóstico sempre que seu contexto mudar. Cada salvamento cria um
                novo ponto na sua linha de evolução, sem apagar o anterior.
              </p>
            </div>

            <Panel className="p-6">
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase tracking-wide text-gray-text">
                    Momento atual de carreira
                  </span>
                  <textarea
                    value={momentoCarreira}
                    onChange={(e) => setMomentoCarreira(e.target.value)}
                    rows={4}
                    placeholder="Descreva onde você está profissionalmente agora..."
                    className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-y min-h-28"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase tracking-wide text-gray-text">
                    Objetivos com a mentoria
                  </span>
                  <textarea
                    value={objetivos}
                    onChange={(e) => setObjetivos(e.target.value)}
                    rows={4}
                    placeholder="O que você quer alcançar até o fim do programa?"
                    className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-y min-h-28"
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
                              : 'bg-white border-gray-faint text-gray-text hover:border-mint'
                          }`}
                        >
                          {forca}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {mensagem && (
                  <p className="text-sm text-black bg-mint-light border border-mint rounded-md px-4 py-3">
                    {mensagem}
                  </p>
                )}

                <button
                  onClick={handleSalvarDiagnostico}
                  disabled={salvando}
                  className="self-start flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {salvando ? 'Salvando...' : diagnostics.length ? 'Salvar novo momento' : 'Salvar diagnóstico'}
                </button>
              </div>
            </Panel>
          </section>
        )}

        {activeTab === 'via' && (
          <section className="max-w-6xl">
            <div className="flex flex-col gap-5 mb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Eyebrow>
                  <Sparkles size={13} /> VIA Character Strengths
                </Eyebrow>
                <h1 className="font-display text-3xl text-black">Suas forças de caráter</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-text">
                  Faça o teste oficial, salve o resultado aqui e repita ao longo da mentoria.
                  Cada novo envio fica no histórico para você comparar como seu ranking evolui.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={VIA_TESTE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-mint px-4 py-2.5 text-sm font-medium text-mint-deep hover:bg-mint-light transition-colors"
                >
                  <Sparkles size={15} />
                  Fazer o teste VIA
                </a>
                {viaResultadoAtual && (
                  <button
                    type="button"
                    onClick={prepararNovoVia}
                    className="inline-flex items-center gap-2 rounded-lg bg-brown px-4 py-2.5 text-sm font-medium text-white hover:bg-brown-deep transition-colors"
                  >
                    <RotateCcw size={15} />
                    Subir novo resultado
                  </button>
                )}
              </div>
            </div>

            {viaResultadoAtual && !mostrarFormularioVia && (
              <Panel className="p-6 mb-6">
                <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-text">Resultado mais recente</p>
                    <p className="mt-1 text-sm text-black">
                      Teste feito em {formatarData(viaResultadoAtual.data_teste)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirTab('evolucao')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-mint-deep"
                  >
                    <History size={15} />
                    Ver evolução
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {viaResultadoAtual.forcas.slice(0, 5).map((f, i) => (
                    <span
                      key={f}
                      className="text-xs px-3 py-1.5 rounded-full bg-mint-light border border-mint text-mint-deep"
                    >
                      {i + 1}º {f}
                    </span>
                  ))}
                </div>

                {viaResultadoAtual.analise_ia && (
                  <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-7 prose-li:text-black prose-li:leading-7">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {viaResultadoAtual.analise_ia}
                    </ReactMarkdown>
                  </div>
                )}
              </Panel>
            )}

            {(mostrarFormularioVia || !viaResultadoAtual) && (
              <Panel className="p-6">
                <div className="mb-5">
                  <p className="font-medium text-black">
                    {viaResultadoAtual ? 'Adicionar um novo resultado VIA' : 'Registrar seu primeiro resultado VIA'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-text">
                    O novo envio cria um registro separado. Seus resultados anteriores continuam
                    disponíveis na aba Evolução.
                  </p>
                </div>

                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <label className="flex items-center gap-2 text-sm bg-mint-light hover:bg-mint/20 text-mint-deep border border-mint/30 px-4 py-2.5 rounded-lg cursor-pointer transition-colors">
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
                  <span className="text-xs text-gray-text">ou preencha manualmente o ranking abaixo</span>
                </div>

                <label className="flex flex-col gap-1.5 mb-5 max-w-xs">
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

                <div className="grid lg:grid-cols-2 gap-2.5 mb-5">
                  {viaForcas.map((valor, i) => (
                    <label key={i} className="flex items-center gap-2.5">
                      <span className="text-xs text-gray-text w-7 text-right shrink-0">
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
                        {VIA_FORCAS.map((forca) => (
                          <option key={forca} value={forca}>
                            {forca}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {viaDuplicada && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-4">
                    Há forças repetidas no ranking. Cada uma das 24 forças deve aparecer uma única vez.
                  </p>
                )}

                {erroVia && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
                    {erroVia}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={enviarVia}
                    disabled={enviandoVia || viaForcas.some((f) => !f) || !viaData || viaDuplicada}
                    className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                  >
                    {enviandoVia ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Sparkles size={15} />
                    )}
                    {enviandoVia ? 'Gerando análise...' : 'Salvar e gerar análise'}
                  </button>

                  {viaResultadoAtual && (
                    <button
                      type="button"
                      onClick={() => setMostrarFormularioVia(false)}
                      className="px-5 py-2.5 rounded-lg border border-gray-faint text-sm text-gray-text hover:text-black"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </Panel>
            )}
          </section>
        )}

        {activeTab === 'resumo' && (
          <section className="max-w-6xl">
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Eyebrow>
                  <FileText size={13} /> Resumo de perfil
                </Eyebrow>
                <h1 className="font-display text-3xl text-black">Síntese estratégica do seu perfil</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-text">
                  A IA cruza seu Mapa Quem Sou Eu, diagnóstico e resultado VIA mais recente.
                  Atualize o resumo sempre que houver uma mudança relevante.
                </p>
              </div>

              <button
                onClick={gerarResumoPerfil}
                disabled={gerandoResumo}
                className="shrink-0 flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {gerandoResumo ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {gerandoResumo ? 'Gerando...' : resumoPerfil ? 'Atualizar resumo' : 'Gerar resumo'}
              </button>
            </div>

            {erroResumo && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
                {erroResumo}
              </p>
            )}

            {!resumoPerfil ? (
              <Panel className="p-6">
                <p className="text-black mb-1">Seu resumo ainda não foi gerado.</p>
                <p className="text-sm text-gray-text max-w-3xl">
                  Preencha ao menos uma das etapas de autoconhecimento e gere sua primeira síntese.
                </p>
              </Panel>
            ) : (
              <Panel className="p-6">
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-7 prose-li:text-black prose-li:leading-7 prose-strong:text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resumoPerfil.conteudo_markdown}
                  </ReactMarkdown>
                </div>
              </Panel>
            )}
          </section>
        )}

        {activeTab === 'evolucao' && (
          <section className="max-w-6xl">
            <div className="mb-6">
              <Eyebrow>
                <TrendingUp size={13} /> Evolução do mentorado
              </Eyebrow>
              <h1 className="font-display text-3xl text-black">Sua evolução ao longo do tempo</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-text">
                Compare seus diagnósticos e seus resultados VIA sem perder o histórico.
                O objetivo é enxergar mudanças, permanências e novos sinais ao longo da jornada.
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-mint-deep">VIA Character Strengths</p>
                    <h2 className="font-display text-2xl text-black">Histórico das suas forças</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      abrirTab('via');
                      prepararNovoVia();
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-mint-deep"
                  >
                    <RotateCcw size={15} />
                    Adicionar novo teste
                  </button>
                </div>

                {viaResultados.length === 0 ? (
                  <Panel className="p-6">
                    <p className="text-sm text-gray-text">
                      Você ainda não tem resultados VIA salvos. Faça o teste e registre o primeiro
                      resultado para criar sua linha de evolução.
                    </p>
                  </Panel>
                ) : (
                  <>
                    {viaResultadoAnterior && viaResultadoAtual && (
                      <Panel className="p-6 mb-4 border-mint">
                        <p className="text-xs uppercase tracking-[0.14em] text-mint-deep mb-1">
                          Comparação mais recente
                        </p>
                        <p className="text-sm text-gray-text mb-5">
                          {formatarData(viaResultadoAnterior.data_teste)} → {formatarData(viaResultadoAtual.data_teste)}
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          {viaResultadoAtual.forcas.slice(0, 5).map((forca, indiceAtual) => {
                            const posicaoAnterior = viaResultadoAnterior.forcas.indexOf(forca);
                            const anterior = posicaoAnterior >= 0 ? posicaoAnterior + 1 : null;
                            const atual = indiceAtual + 1;
                            const delta = anterior ? anterior - atual : null;

                            return (
                              <div key={forca} className="rounded-xl border border-gray-faint bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wide text-gray-text">#{atual}</p>
                                <p className="mt-1 font-medium text-black">{forca}</p>
                                <p className="mt-2 text-xs text-gray-text">
                                  {anterior === null
                                    ? 'Sem comparação anterior'
                                    : delta === 0
                                      ? `Manteve a posição #${atual}`
                                      : delta > 0
                                        ? `Subiu de #${anterior} para #${atual}`
                                        : `Foi de #${anterior} para #${atual}`}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </Panel>
                    )}

                    {viaResultados.length === 1 && (
                      <Panel className="p-5 mb-4 bg-mint-light/30 border-mint/30">
                        <p className="text-sm text-black">
                          Este é seu primeiro resultado VIA. Quando você registrar um novo teste,
                          a comparação de posições aparecerá aqui automaticamente.
                        </p>
                      </Panel>
                    )}

                    <div className="space-y-3">
                      {viaResultados.map((resultado, index) => (
                        <details
                          key={resultado.id}
                          className="group rounded-xl border border-gray-faint bg-white"
                          open={index === 0}
                        >
                          <summary className="cursor-pointer list-none p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-gray-text">
                                {index === 0 ? 'Mais recente' : `Registro ${viaResultados.length - index}`}
                              </p>
                              <p className="mt-1 font-medium text-black">
                                {formatarData(resultado.data_teste)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {resultado.forcas.slice(0, 5).map((forca, i) => (
                                <span
                                  key={forca}
                                  className="text-[11px] px-2.5 py-1 rounded-full bg-mint-light border border-mint/50 text-mint-deep"
                                >
                                  {i + 1}º {forca}
                                </span>
                              ))}
                            </div>
                          </summary>

                          {resultado.analise_ia && (
                            <div className="border-t border-gray-faint px-5 py-5">
                              <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-7 prose-li:text-black prose-li:leading-7">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {resultado.analise_ia}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </details>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-mint-deep">Diagnóstico de carreira</p>
                <h2 className="font-display text-2xl text-black mb-4">Do início ao momento atual</h2>

                {diagnostics.length === 0 ? (
                  <Panel className="p-6 text-sm text-gray-text">
                    Salve seu primeiro diagnóstico para começar esta comparação.
                  </Panel>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-4">
                    <Panel className="p-6">
                      <p className="text-[11px] uppercase tracking-wide text-gray-text mb-3">
                        Diagnóstico inicial · {formatarData(primeiro.created_at)}
                      </p>
                      <p className="text-base text-black leading-relaxed">
                        {primeiro.momento_carreira || 'Sem registro de momento de carreira.'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {((primeiro.habilidades?.forcas as string[]) ?? []).map((forca) => (
                          <span
                            key={forca}
                            className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-faint text-gray-text"
                          >
                            {forca}
                          </span>
                        ))}
                      </div>
                    </Panel>

                    <Panel className="p-6 border-mint">
                      <p className="text-[11px] uppercase tracking-wide text-mint-deep mb-3">
                        Momento atual · {formatarData(ultimo.created_at)}
                      </p>
                      <p className="text-base text-black leading-relaxed">
                        {ultimo.momento_carreira || 'Sem registro de momento de carreira.'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {((ultimo.habilidades?.forcas as string[]) ?? []).map((forca) => (
                          <span
                            key={forca}
                            className="text-[11px] px-2 py-1 rounded-full bg-mint-light border border-mint text-black"
                          >
                            {forca}
                          </span>
                        ))}
                      </div>
                    </Panel>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
