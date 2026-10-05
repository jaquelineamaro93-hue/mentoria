'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Compass,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
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

const TABS = [
  { id: 'diagnostico' as Tab, label: 'Diagnóstico', icon: Compass },
  { id: 'via' as Tab, label: 'VIA', icon: Sparkles },
  { id: 'resumo' as Tab, label: 'Resumo de perfil', icon: FileText },
  { id: 'evolucao' as Tab, label: 'Evolução', icon: BarChart3 },
];

function dataPtBr(data?: string | null) {
  if (!data) return 'Data não informada';
  const normalizada = data.length === 10 ? `${data}T00:00:00` : data;
  return new Date(normalizada).toLocaleDateString('pt-BR');
}

function movimento(forca: string, posicaoAtual: number, anterior?: ViaResultado | null) {
  if (!anterior) return { texto: 'Primeira medição', tipo: 'neutro' as const };
  const posicaoAnterior = anterior.forcas.indexOf(forca) + 1;
  if (!posicaoAnterior) return { texto: 'Nova no ranking', tipo: 'subiu' as const };

  const delta = posicaoAnterior - posicaoAtual;
  if (delta > 0) {
    return {
      texto: `Subiu ${delta} ${delta === 1 ? 'posição' : 'posições'}`,
      tipo: 'subiu' as const,
    };
  }
  if (delta < 0) {
    const queda = Math.abs(delta);
    return {
      texto: `Caiu ${queda} ${queda === 1 ? 'posição' : 'posições'}`,
      tipo: 'caiu' as const,
    };
  }
  return { texto: 'Manteve a posição', tipo: 'neutro' as const };
}

export default function ExerciciosClient({
  profile: _profile,
  diagnostics,
  userId,
  viaResultadosIniciais = [],
  resumoPerfilInicial = null,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('diagnostico');
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
  const [mostrarFormularioVia, setMostrarFormularioVia] = useState(
    viaResultadosIniciais.length === 0
  );
  const [enviandoVia, setEnviandoVia] = useState(false);
  const [extraindoPdf, setExtraindoPdf] = useState(false);
  const [erroVia, setErroVia] = useState<string | null>(null);

  const [resumoPerfil, setResumoPerfil] = useState<ResumoPerfil | null>(resumoPerfilInicial);
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState<string | null>(null);

  const viaAtual = viaResultados[0] ?? null;
  const viaAnterior = viaResultados[1] ?? null;
  const primeiro = diagnostics[0];
  const ultimo = diagnostics[diagnostics.length - 1];
  const rankingCompleto = viaForcas.every(Boolean);
  const viaTemDuplicadas = rankingCompleto && new Set(viaForcas).size !== 24;

  const comparacaoTop5 = useMemo(
    () =>
      viaAtual?.forcas.slice(0, 5).map((forca, i) => ({
        forca,
        posicao: i + 1,
        movimento: movimento(forca, i + 1, viaAnterior),
      })) ?? [],
    [viaAtual, viaAnterior]
  );

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
    setMensagem('Diagnóstico salvo. Ele já entrou na sua linha de evolução.');
    router.refresh();
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
    } finally {
      setExtraindoPdf(false);
      e.target.value = '';
    }
  }

  function abrirNovoVia() {
    setMostrarFormularioVia(true);
    setErroVia(null);
    setViaForcas(Array(24).fill(''));
    setViaData('');
  }

  async function enviarVia() {
    if (viaTemDuplicadas) {
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

      const novo = data.resultado as ViaResultado;
      setViaResultados((anteriores) => [novo, ...anteriores]);
      setMostrarFormularioVia(false);
      setViaForcas(Array(24).fill(''));
      setViaData('');
      posthog.capture('via_analise_gerada', {
        repeticao: viaResultados.length > 0,
        numero_resultado: viaResultados.length + 1,
      });
      router.refresh();
    } catch (e) {
      setErroVia(e instanceof Error ? e.message : 'Não foi possível gerar a análise agora.');
    } finally {
      setEnviandoVia(false);
    }
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
    } finally {
      setGerandoResumo(false);
    }
  }

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
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'inline-flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap',
                  ativa
                    ? 'border-b-2 border-mint-deep text-black'
                    : 'border-b-2 border-transparent text-gray-text hover:text-black',
                ].join(' ')}
              >
                <Icon size={16} strokeWidth={1.6} />
                {tab.label}
                {tab.id === 'via' && viaResultados.length > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-mint-light text-[10px] text-black inline-flex items-center justify-center">
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
          <section>
            <Eyebrow>
              <Compass size={13} /> Diagnóstico de carreira
            </Eyebrow>
            <h1 className="font-display text-2xl md:text-3xl text-black mt-3">
              Registre seu momento atual
            </h1>
            <p className="text-sm text-gray-text mt-2 mb-6 max-w-2xl">
              Volte a este diagnóstico ao longo da mentoria. Cada novo registro é preservado para
              mostrar sua evolução.
            </p>

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
                    className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-y"
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
                    className="bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-y"
                  />
                </label>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-text block mb-2">
                    Pontos fortes
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
                              : 'bg-white border-gray-faint text-gray-text hover:text-black'
                          }`}
                        >
                          {forca}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {mensagem && (
                  <p className="text-sm leading-6 text-black bg-mint-light border border-mint rounded-lg px-4 py-3 max-w-2xl">
                    {mensagem}
                  </p>
                )}

                <button
                  onClick={handleSalvarDiagnostico}
                  disabled={salvando}
                  className="self-start flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {salvando ? 'Salvando...' : 'Salvar novo diagnóstico'}
                </button>
              </div>
            </Panel>
          </section>
        )}

        {activeTab === 'via' && (
          <section>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <Eyebrow>
                  <Sparkles size={13} /> VIA Character Strengths
                </Eyebrow>
                <h1 className="font-display text-2xl md:text-3xl text-black mt-3">
                  Suas forças de caráter
                </h1>
                <p className="text-sm text-gray-text mt-2 max-w-2xl">
                  Salve cada aplicação do VIA para acompanhar mudanças no seu ranking de forças ao
                  longo do tempo.
                </p>
              </div>
              {viaAtual && !mostrarFormularioVia && (
                <button
                  type="button"
                  onClick={abrirNovoVia}
                  className="self-start inline-flex items-center gap-2 bg-brown hover:bg-brown-deep text-white text-sm font-medium px-5 py-2.5 rounded-lg"
                >
                  <RefreshCw size={15} /> Fazer novo teste
                </button>
              )}
            </div>

            {viaAtual && !mostrarFormularioVia && (
              <Panel className="p-6 md:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-text">
                      Resultado mais recente
                    </p>
                    <p className="text-sm text-black mt-1">
                      Teste realizado em {dataPtBr(viaAtual.data_teste)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('evolucao')}
                    className="text-sm text-brown-deep hover:underline self-start"
                  >
                    Ver histórico e evolução
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
                  {viaAtual.forcas.slice(0, 5).map((forca, i) => (
                    <div
                      key={forca}
                      className="rounded-xl border border-mint bg-mint-light/60 p-4 min-h-24"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-gray-text mb-2">
                        {i + 1}ª força
                      </p>
                      <p className="text-sm font-medium text-black leading-5">{forca}</p>
                    </div>
                  ))}
                </div>

                {viaAtual.analise_ia && (
                  <div className="border-t border-gray-faint pt-6">
                    <p className="text-xs uppercase tracking-wide text-gray-text mb-3">
                      Leitura do seu resultado
                    </p>
                    <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-7 prose-li:text-black prose-li:leading-6 prose-strong:text-black">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {viaAtual.analise_ia}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {mostrarFormularioVia && (
              <Panel className="p-6 md:p-7">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="font-medium text-black">
                      {viaAtual ? 'Adicionar uma nova medição' : 'Faça seu primeiro registro VIA'}
                    </p>
                    <p className="text-sm leading-6 text-gray-text mt-1 max-w-2xl">
                      Primeiro faça o teste oficial do VIA Character Strengths. Depois volte para a
                      SOMA e envie o PDF do resultado ou informe as 24 forças manualmente.
                    </p>
                  </div>
                  {viaAtual && (
                    <button
                      type="button"
                      onClick={() => setMostrarFormularioVia(false)}
                      className="text-sm text-gray-text hover:text-black"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-mint bg-mint-light/45 p-5 mb-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-mint-deep mb-1">
                        Passo 1
                      </p>
                      <p className="font-medium text-black">Faça o teste no site oficial do VIA</p>
                      <p className="text-sm leading-6 text-gray-text mt-1 max-w-2xl">
                        O teste é feito fora da SOMA. Use o site oficial abaixo e, ao terminar,
                        salve o relatório em PDF para importar aqui.
                      </p>
                    </div>

                    <a
                      href="https://www.viacharacter.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => posthog.capture('via_site_oficial_aberto')}
                      className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-brown hover:bg-brown-deep text-white text-sm font-medium px-4 py-2.5 transition-colors"
                    >
                      Abrir site oficial do VIA
                      <ExternalLink size={15} />
                    </a>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      ['1', 'Acesse viacharacter.org e clique em “Take the Free Survey”.'],
                      ['2', 'Para maiores de 18 anos, escolha “VIA Adult Survey” e responda o teste.'],
                      ['3', 'Ao terminar, abra seus resultados para visualizar o ranking completo das 24 forças.'],
                      ['4', 'Role a página de resultados até o final e clique em “Save as PDF”. Depois volte para a SOMA.'],
                    ].map(([numero, texto]) => (
                      <div
                        key={numero}
                        className="flex items-start gap-3 rounded-lg border border-mint/70 bg-white/75 p-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-mint-deep text-white text-xs font-medium grid place-items-center shrink-0">
                          {numero}
                        </span>
                        <p className="text-sm leading-5 text-black">{texto}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs leading-5 text-gray-text mt-4">
                    O visual do site VIA pode mudar com o tempo. Se os nomes dos botões estiverem
                    diferentes, procure a opção de fazer o teste gratuito e, na tela de resultados,
                    a opção para salvar o relatório em PDF.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-faint p-4 mb-5">
                  <div className="mb-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-gray-text">Passo 2</p>
                    <p className="text-sm font-medium text-black mt-1">Envie o PDF do resultado</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm bg-mint-light text-black px-4 py-2.5 rounded-lg cursor-pointer">
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
                    <span className="text-xs text-gray-text">
                      O PDF preenche o ranking abaixo automaticamente.
                    </span>
                  </div>
                </div>

                <label className="flex flex-col gap-1.5 mb-5 max-w-sm">
                  <span className="text-xs uppercase tracking-wide text-gray-text">
                    Data em que fez o teste
                  </span>
                  <input
                    type="date"
                    value={viaData}
                    onChange={(e) => setViaData(e.target.value)}
                    className="bg-white border border-gray-faint rounded-lg px-4 py-2.5 text-sm text-black"
                  />
                </label>

                <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
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
                          setErroVia(null);
                        }}
                        className="flex-1 bg-white border border-gray-faint rounded-lg px-3 py-2 text-sm text-black"
                      >
                        <option value="">Selecione...</option>
                        {VIA_FORCAS.map((forca) => (
                          <option
                            key={forca}
                            value={forca}
                            disabled={viaForcas.includes(forca) && forca !== valor}
                          >
                            {forca}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {viaTemDuplicadas && !erroVia && (
                  <p className="text-sm leading-6 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                    Há forças repetidas. Cada força deve aparecer apenas uma vez.
                  </p>
                )}
                {erroVia && (
                  <p className="text-sm leading-6 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                    {erroVia}
                  </p>
                )}

                <button
                  onClick={enviarVia}
                  disabled={enviandoVia || !rankingCompleto || !viaData || viaTemDuplicadas}
                  className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
                >
                  {enviandoVia ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  {enviandoVia
                    ? 'Gerando análise...'
                    : viaAtual
                      ? 'Salvar nova medição e comparar'
                      : 'Salvar e gerar análise'}
                </button>
              </Panel>
            )}
          </section>
        )}

        {activeTab === 'resumo' && (
          <section>
            <Eyebrow>
              <FileText size={13} /> Resumo de perfil
            </Eyebrow>
            <h1 className="font-display text-2xl md:text-3xl text-black mt-3">
              Sua síntese estratégica
            </h1>
            <p className="text-sm text-gray-text mt-2 mb-6 max-w-2xl">
              Uma leitura única que cruza Mapa Quem Sou Eu, diagnóstico e VIA.
            </p>

            {erroResumo && (
              <p className="text-sm leading-6 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                {erroResumo}
              </p>
            )}

            {!resumoPerfil ? (
              <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <p className="text-black mb-1">Cruze o que você já preencheu</p>
                  <p className="text-sm leading-6 text-gray-text max-w-2xl">
                    A IA organiza suas informações em características, forças, pontos de atenção e
                    foco recomendado.
                  </p>
                </div>
                <button
                  onClick={gerarResumoPerfil}
                  disabled={gerandoResumo}
                  className="shrink-0 flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
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
              <Panel className="p-6 md:p-7">
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-7 prose-li:text-black prose-li:leading-6 prose-strong:text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resumoPerfil.conteudo_markdown}
                  </ReactMarkdown>
                </div>
              </Panel>
            )}
          </section>
        )}

        {activeTab === 'evolucao' && (
          <section>
            <Eyebrow>
              <BarChart3 size={13} /> Evolução
            </Eyebrow>
            <h1 className="font-display text-2xl md:text-3xl text-black mt-3">
              O que mudou na sua jornada
            </h1>
            <p className="text-sm text-gray-text mt-2 mb-7 max-w-2xl">
              Compare medições ao longo do tempo, sem perder os resultados anteriores.
            </p>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-display text-xl text-black">Evolução VIA</h2>
                    <p className="text-sm text-gray-text mt-1">
                      {viaResultados.length > 1
                        ? `${viaResultados.length} medições salvas`
                        : viaResultados.length === 1
                          ? '1 medição salva — refaça no futuro para comparar'
                          : 'Nenhuma medição salva ainda'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('via')}
                    className="text-sm text-brown-deep hover:underline"
                  >
                    {viaAtual ? 'Novo teste' : 'Fazer VIA'}
                  </button>
                </div>

                {viaAtual ? (
                  <Panel className="p-6">
                    {viaAnterior ? (
                      <>
                        <p className="text-sm text-black mb-5">
                          Comparando {dataPtBr(viaAnterior.data_teste)} →{' '}
                          {dataPtBr(viaAtual.data_teste)}
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                          {comparacaoTop5.map(({ forca, posicao, movimento: mov }) => (
                            <div key={forca} className="rounded-xl border border-gray-faint p-4">
                              <p className="text-[11px] uppercase tracking-wide text-gray-text">
                                {posicao}ª agora
                              </p>
                              <p className="text-sm font-medium text-black mt-1.5 leading-5">
                                {forca}
                              </p>
                              <div
                                className={[
                                  'mt-3 inline-flex items-center gap-1 text-xs',
                                  mov.tipo === 'subiu'
                                    ? 'text-emerald-700'
                                    : mov.tipo === 'caiu'
                                      ? 'text-amber-700'
                                      : 'text-gray-text',
                                ].join(' ')}
                              >
                                {mov.tipo === 'subiu' && <TrendingUp size={13} />}
                                {mov.tipo === 'caiu' && <TrendingDown size={13} />}
                                {mov.texto}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm leading-6 text-gray-text mb-6">
                        Sua primeira referência está salva. Quando houver uma nova medição, esta
                        área mostrará o movimento de cada força.
                      </p>
                    )}

                    <div className="border-t border-gray-faint pt-5">
                      <p className="text-xs uppercase tracking-wide text-gray-text mb-3">
                        Histórico de aplicações
                      </p>
                      <div className="space-y-3">
                        {viaResultados.map((resultado, indice) => (
                          <div
                            key={resultado.id}
                            className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 rounded-xl border border-gray-faint px-4 py-4"
                          >
                            <div className="lg:w-40 shrink-0">
                              <p className="text-sm font-medium text-black">
                                {indice === 0
                                  ? 'Mais recente'
                                  : `Medição ${viaResultados.length - indice}`}
                              </p>
                              <p className="text-xs text-gray-text mt-0.5">
                                {dataPtBr(resultado.data_teste)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {resultado.forcas.slice(0, 5).map((forca, i) => (
                                <span
                                  key={`${resultado.id}-${forca}`}
                                  className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-faint text-black"
                                >
                                  {i + 1}º {forca}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>
                ) : (
                  <Panel className="p-6 text-sm leading-6 text-gray-text">
                    Faça o primeiro VIA para começar sua linha de evolução.
                  </Panel>
                )}
              </div>

              <div>
                <h2 className="font-display text-xl text-black">Evolução do diagnóstico</h2>
                <p className="text-sm text-gray-text mt-1 mb-3">
                  Primeiro registro versus momento mais recente.
                </p>

                {diagnostics.length === 0 ? (
                  <Panel className="p-6 text-sm leading-6 text-gray-text">
                    Salve seu primeiro diagnóstico para começar esta linha.
                  </Panel>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Panel className="p-6">
                      <p className="text-[11px] uppercase tracking-wide text-gray-text mb-3">
                        Inicial · {dataPtBr(primeiro.created_at)}
                      </p>
                      <p className="text-sm text-black leading-7">
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
                      <p className="text-[11px] uppercase tracking-wide text-brown-deep mb-3">
                        Atual · {dataPtBr(ultimo.created_at)}
                      </p>
                      <p className="text-sm text-black leading-7">
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
