'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ContextoStatus = {
  mapa: boolean;
  bussola: boolean;
  via: boolean;
  pdi: boolean;
  linkedin: boolean;
  resumo: boolean;
};

type Draft = {
  id: string;
  titulo: string | null;
  ideia: string;
  objetivo: string | null;
  audiencia: string | null;
  formato: string | null;
  angulo: string | null;
  cta_tipo: string | null;
  hook_escolhido: string | null;
  conteudo: string;
  resultado_json: any;
  status: string;
  created_at: string;
  updated_at: string;
};

type Hook = {
  tipo: string;
  texto: string;
  por_que_funciona?: string;
};

type Idea = {
  titulo: string;
  premissa: string;
  formato: string;
  angulo: string;
  evidencia_contexto?: string;
};

type Pilar = {
  nome: string;
  por_que: string;
  subtemas: string[];
};

const objetivos = [
  ['autoridade', 'Construir autoridade'],
  ['oportunidades', 'Atrair oportunidades'],
  ['networking', 'Criar conversas e networking'],
  ['ensinar', 'Ensinar algo útil'],
  ['case', 'Mostrar um case ou resultado'],
];

const formatos = [
  ['texto', 'Post de texto'],
  ['micropost', 'Micropost'],
  ['case', 'Case'],
  ['lista', 'Lista prática'],
  ['carrossel', 'Roteiro de carrossel'],
];

const angulos = [
  ['direto', 'Direto'],
  ['pessoal', 'Pessoal'],
  ['contraintuitivo', 'Contraintuitivo'],
  ['educativo', 'Educativo'],
  ['bastidor', 'Bastidor'],
  ['reflexivo', 'Reflexivo'],
];

const ctas = [
  ['conversa', 'Abrir conversa'],
  ['acao', 'Pedir uma ação'],
  ['valor', 'Reforçar o benefício'],
  ['nenhum', 'Sem CTA'],
];

const contextoItems = [
  { key: 'mapa', label: 'Mapa Quem Sou Eu', href: '/quem-sou-eu' },
  { key: 'bussola', label: 'Bússola', href: '/quem-sou-eu' },
  { key: 'via', label: 'Forças VIA', href: '/exercicios' },
  { key: 'pdi', label: 'PDI', href: '/meu-pdi' },
  { key: 'linkedin', label: 'LinkedIn', href: '/linkedin' },
  { key: 'resumo', label: 'Resumo de perfil', href: '/exercicios' },
] as const;

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-gray-text">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-faint bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function LinkedinContentStudioClient({
  nome,
  contextoStatus,
  vozInicial,
  historicoInicial,
}: {
  nome: string;
  contextoStatus: ContextoStatus;
  vozInicial: Record<string, any> | null;
  historicoInicial: Draft[];
}) {
  const supabase = createClient();
  const [aba, setAba] = useState<'criar' | 'ideias' | 'voz' | 'rascunhos'>('criar');
  const [ideia, setIdeia] = useState('');
  const [objetivo, setObjetivo] = useState('autoridade');
  const [audiencia, setAudiencia] = useState('');
  const [formato, setFormato] = useState('texto');
  const [angulo, setAngulo] = useState('direto');
  const [ctaTipo, setCtaTipo] = useState('conversa');
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [hook, setHook] = useState('');
  const [post, setPost] = useState('');
  const [carousel, setCarousel] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [verificar, setVerificar] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<Draft[]>(historicoInicial);
  const [ideias, setIdeias] = useState<Idea[]>([]);
  const [pilares, setPilares] = useState<Pilar[]>([]);
  const [voz, setVoz] = useState<Record<string, any> | null>(vozInicial);
  const [amostras, setAmostras] = useState(['', '', '']);

  const conectados = useMemo(
    () => Object.values(contextoStatus).filter(Boolean).length,
    [contextoStatus]
  );

  async function chamarIA(action: string, extras: Record<string, unknown> = {}) {
    setLoading(action);
    setErro(null);
    try {
      const response = await fetch('/api/linkedin-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ideia,
          objetivo,
          audiencia,
          formato,
          angulo,
          ctaTipo,
          hook,
          ...extras,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar agora.');
      return data.resultado;
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível gerar agora.');
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function gerarHooks() {
    const resultado = await chamarIA('hooks');
    if (!resultado) return;
    setHooks(resultado.hooks || []);
    setHook(resultado.hooks?.[0]?.texto || '');
  }

  async function gerarPost() {
    const resultado = await chamarIA('post');
    if (!resultado) return;
    const texto = resultado.post || '';
    setPost(texto);
    setCarousel(resultado.carousel_outline || []);
    setEvidencias(resultado.evidencias_usadas || []);
    setVerificar(resultado.verificar_antes_de_publicar || []);
    await persistirRascunho(texto, resultado);
  }

  async function refinar(instrucao: string) {
    if (!post.trim()) return;
    const resultado = await chamarIA('refine', {
      postAtual: post,
      instrucaoRefino: instrucao,
    });
    if (!resultado) return;
    const texto = resultado.post || post;
    setPost(texto);
    await persistirRascunho(texto, {
      ...(historico.find((x) => x.id === draftId)?.resultado_json || {}),
      refinado: true,
      mudancas: resultado.mudancas || [],
    });
  }

  async function persistirRascunho(conteudo: string, resultadoJson: any) {
    if (!conteudo.trim()) return;
    const payload = {
      titulo: ideia.trim().slice(0, 90) || 'Rascunho LinkedIn',
      ideia: ideia.trim(),
      objetivo,
      audiencia: audiencia.trim(),
      formato,
      angulo,
      cta_tipo: ctaTipo,
      hook_escolhido: hook,
      conteudo,
      resultado_json: resultadoJson || {},
      status: 'rascunho',
      updated_at: new Date().toISOString(),
    };

    if (draftId) {
      const { data, error } = await supabase
        .from('linkedin_content_drafts')
        .update(payload)
        .eq('id', draftId)
        .select('*')
        .single();
      if (!error && data) {
        setHistorico((lista) => [data as Draft, ...lista.filter((x) => x.id !== data.id)]);
      }
      return;
    }

    const { data, error } = await supabase
      .from('linkedin_content_drafts')
      .insert(payload)
      .select('*')
      .single();

    if (!error && data) {
      setDraftId(data.id);
      setHistorico((lista) => [data as Draft, ...lista]);
    }
  }

  async function salvar() {
    await persistirRascunho(post, { carousel, evidencias, verificar });
  }

  async function marcarSalvo() {
    if (!draftId) {
      await salvar();
      return;
    }
    const { data } = await supabase
      .from('linkedin_content_drafts')
      .update({ status: 'salvo', updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .select('*')
      .single();
    if (data) setHistorico((lista) => [data as Draft, ...lista.filter((x) => x.id !== data.id)]);
  }

  async function excluirDraft(id: string) {
    await supabase.from('linkedin_content_drafts').delete().eq('id', id);
    setHistorico((lista) => lista.filter((x) => x.id !== id));
    if (draftId === id) {
      setDraftId(null);
      setPost('');
    }
  }

  function abrirDraft(item: Draft) {
    setIdeia(item.ideia || '');
    setObjetivo(item.objetivo || 'autoridade');
    setAudiencia(item.audiencia || '');
    setFormato(item.formato || 'texto');
    setAngulo(item.angulo || 'direto');
    setCtaTipo(item.cta_tipo || 'conversa');
    setHook(item.hook_escolhido || '');
    setPost(item.conteudo || '');
    setCarousel(item.resultado_json?.carousel_outline || item.resultado_json?.carousel || []);
    setEvidencias(item.resultado_json?.evidencias_usadas || item.resultado_json?.evidencias || []);
    setVerificar(item.resultado_json?.verificar_antes_de_publicar || item.resultado_json?.verificar || []);
    setDraftId(item.id);
    setAba('criar');
  }

  async function copiar() {
    if (!post) return;
    await navigator.clipboard.writeText(post);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1600);
  }

  async function gerarIdeias() {
    const resultado = await chamarIA('ideas');
    if (!resultado) return;
    setPilares(resultado.pilares || []);
    setIdeias(resultado.ideias || []);
  }

  function usarIdeia(item: Idea) {
    setIdeia(item.premissa || item.titulo);
    setFormato(item.formato || 'texto');
    setAngulo(item.angulo || 'direto');
    setHook('');
    setHooks([]);
    setPost('');
    setDraftId(null);
    setAba('criar');
  }

  async function treinarVoz() {
    setLoading('voice');
    setErro(null);
    try {
      const response = await fetch('/api/linkedin-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'voice', amostrasVoz: amostras }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível analisar sua voz.');
      setVoz(data.resultado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível analisar sua voz.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="w-full px-4 py-6 sm:px-6 md:px-12 md:py-10">
      <header className="mb-6 max-w-5xl">
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-mint-deep">Marca pessoal e conteúdo</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl text-black md:text-4xl">Estúdio LinkedIn</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-text md:text-base">
              Transforme uma ideia bruta em conteúdo com a sua voz, usando o contexto que você já construiu na SOMA.
              A IA organiza a narrativa, mas experiência, fatos e opinião continuam sendo seus.
            </p>
          </div>
          <Link
            href="/linkedin"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-faint bg-white px-4 py-2.5 text-sm font-medium text-black hover:border-mint-deep"
          >
            Revisar meu perfil
            <ChevronRight size={16} />
          </Link>
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-gray-faint bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-black">Contexto conectado: {conectados}/6</p>
            <p className="mt-1 text-xs text-gray-text">
              Quanto mais contexto real existe, menos genérico o texto fica. O Jev seleciona apenas o que é útil antes da geração.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {contextoItems.map((item) => {
              const ativo = contextoStatus[item.key];
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    ativo
                      ? 'inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint-light px-3 py-1.5 text-xs text-black'
                      : 'inline-flex items-center gap-1.5 rounded-full border border-gray-faint bg-[#fafbfc] px-3 py-1.5 text-xs text-gray-text'
                  }
                >
                  {ativo ? <CheckCircle2 size={13} className="text-mint-deep" /> : <span className="h-2 w-2 rounded-full bg-gray-300" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          ['criar', 'Criar', WandSparkles],
          ['ideias', 'Banco de ideias', Lightbulb],
          ['voz', 'Minha voz', UserRound],
          ['rascunhos', 'Rascunhos', Archive],
        ].map(([id, label, Icon]: any) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={
              aba === id
                ? 'inline-flex shrink-0 items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white'
                : 'inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-faint bg-white px-4 py-2.5 text-sm font-medium text-gray-text hover:text-black'
            }
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {erro && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {aba === 'criar' && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.14em] text-mint-deep">1. Comece do seu jeito</p>
              <h2 className="mt-1 font-display text-2xl text-black">Qual é a ideia?</h2>
              <p className="mt-1 text-sm text-gray-text">Pode ser bagunçada. Conte o que aconteceu, o que você percebeu ou o que quer defender.</p>
            </div>

            <textarea
              value={ideia}
              onChange={(e) => setIdeia(e.target.value)}
              rows={7}
              placeholder="Ex.: participei de uma reunião hoje e percebi que todo mundo queria mais dados, mas ninguém tinha combinado qual decisão aqueles dados precisavam apoiar..."
              className="w-full resize-y rounded-xl border border-gray-faint px-4 py-3 text-sm leading-relaxed text-black outline-none focus:border-mint-deep"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Select label="Objetivo" value={objetivo} onChange={setObjetivo} options={objetivos} />
              <Select label="Formato" value={formato} onChange={setFormato} options={formatos} />
              <Select label="Ângulo" value={angulo} onChange={setAngulo} options={angulos} />
              <Select label="Fechamento" value={ctaTipo} onChange={setCtaTipo} options={ctas} />
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-gray-text">Para quem você quer falar?</span>
              <input
                value={audiencia}
                onChange={(e) => setAudiencia(e.target.value)}
                placeholder="Ex.: lideranças de CRM, recrutadores, pessoas migrando para dados..."
                className="mt-2 w-full rounded-lg border border-gray-faint px-3 py-2.5 text-sm text-black outline-none focus:border-mint-deep"
              />
            </label>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={gerarHooks}
                disabled={loading !== null || !ideia.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-mint-deep px-4 py-2.5 text-sm font-medium text-mint-deep hover:bg-mint-light disabled:opacity-50"
              >
                {loading === 'hooks' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Gerar 6 aberturas
              </button>
              <button
                type="button"
                onClick={gerarPost}
                disabled={loading !== null || !ideia.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-mint-deep px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading === 'post' ? <Loader2 size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                Gerar post
              </button>
            </div>

            {hooks.length > 0 && (
              <div className="mt-6 border-t border-gray-faint pt-5">
                <p className="mb-3 text-sm font-semibold text-black">Escolha a abertura que parece mais com você</p>
                <div className="space-y-2">
                  {hooks.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setHook(item.texto)}
                      className={
                        hook === item.texto
                          ? 'w-full rounded-xl border border-mint-deep bg-mint-light p-3 text-left'
                          : 'w-full rounded-xl border border-gray-faint bg-white p-3 text-left hover:border-mint'
                      }
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                          {item.tipo}
                        </span>
                        <p className="text-sm leading-relaxed text-black">{item.texto}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-faint bg-[#f7f9fb] p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gray-text">Prévia</p>
                <h2 className="font-display text-2xl text-black">Seu post</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copiar}
                  disabled={!post}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-faint bg-white px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
                >
                  {copiado ? <Check size={15} /> : <Clipboard size={15} />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={marcarSalvo}
                  disabled={!post}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-faint bg-white px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
                >
                  <Save size={15} />
                  Salvar
                </button>
              </div>
            </div>

            <div className="min-h-[360px] rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
              {post ? (
                <>
                  <div className="mb-5 flex items-center gap-3 border-b border-gray-faint pb-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e8eeed] text-sm font-semibold text-black">
                      {nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{nome}</p>
                      <p className="text-xs text-gray-text">Prévia de conteúdo no LinkedIn</p>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-[15px] leading-[1.6] text-black">{post}</div>
                  <div className="mt-5 border-t border-gray-faint pt-3 text-xs text-gray-text">
                    {post.length.toLocaleString('pt-BR')} caracteres
                  </div>
                </>
              ) : (
                <div className="flex min-h-[310px] flex-col items-center justify-center text-center">
                  <MessageSquareText size={28} className="text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-black">O texto aparece aqui</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-text">
                    Primeiro conte uma ideia real. Você pode gerar aberturas antes ou ir direto para uma primeira versão.
                  </p>
                </div>
              )}
            </div>

            {post && (
              <>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-text">Refinar sem recomeçar</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['Deixar mais natural', 'deixe mais natural e falado, sem perder profundidade'],
                      ['Mais direto', 'reduza rodeios e deixe mais direto'],
                      ['Mais pessoal', 'aproxime da experiência pessoal sem inventar nada'],
                      ['Mais técnico', 'aumente precisão e autoridade técnica usando somente fatos existentes'],
                      ['Encurtar 25%', 'reduza aproximadamente 25% mantendo a mensagem'],
                      ['Melhorar fechamento', 'melhore apenas a conclusão e o fechamento'],
                    ].map(([label, instruction]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => refinar(instruction)}
                        disabled={loading !== null}
                        className="rounded-full border border-gray-faint bg-white px-3 py-1.5 text-xs text-black hover:border-mint-deep disabled:opacity-50"
                      >
                        {loading === 'refine' ? 'Refinando...' : label}
                      </button>
                    ))}
                  </div>
                </div>

                {(evidencias.length > 0 || verificar.length > 0) && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-mint/30 bg-mint-light p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mint-deep">Base real usada</p>
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-black">
                        {evidencias.length ? evidencias.map((x, i) => <li key={i}>• {x}</li>) : <li>Nenhuma evidência específica foi necessária.</li>}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-[#efd7b7] bg-[#fffaf3] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A4B1D]">Cheque antes de publicar</p>
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-black">
                        {verificar.length ? verificar.map((x, i) => <li key={i}>• {x}</li>) : <li>Nada pendente de validação.</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {carousel.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-faint bg-white p-4">
                    <p className="text-sm font-semibold text-black">Roteiro do carrossel</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {carousel.map((slide: any, index: number) => (
                        <div key={index} className="rounded-lg bg-[#f7f9fb] p-3">
                          <p className="text-[10px] uppercase tracking-wide text-gray-text">Slide {slide.slide || index + 1}</p>
                          <p className="mt-1 text-sm font-semibold text-black">{slide.titulo}</p>
                          <p className="mt-1 text-xs leading-relaxed text-gray-text">{slide.texto}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {aba === 'ideias' && (
        <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-mint-deep">Consistência sem repetição</p>
              <h2 className="mt-1 font-display text-2xl text-black">Banco de ideias a partir do seu contexto</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-text">
                Em vez de buscar temas aleatórios, a SOMA cruza posicionamento, objetivos e experiências para sugerir assuntos que você consegue sustentar.
              </p>
            </div>
            <button
              type="button"
              onClick={gerarIdeias}
              disabled={loading !== null}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-mint-deep px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading === 'ideas' ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
              Gerar 9 ideias
            </button>
          </div>

          {pilares.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {pilares.map((pilar, index) => (
                <div key={index} className="rounded-xl border border-gray-faint bg-[#f7f9fb] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-gray-text">Pilar {index + 1}</p>
                  <h3 className="mt-1 font-display text-xl text-black">{pilar.nome}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-text">{pilar.por_que}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(pilar.subtemas || []).map((x) => (
                      <span key={x} className="rounded-full border border-gray-faint bg-white px-2.5 py-1 text-[11px] text-black">{x}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {ideias.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ideias.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => usarIdeia(item)}
                  className="group rounded-xl border border-gray-faint bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-mint-deep hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-mint-light px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-mint-deep">
                      {item.formato}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-mint-deep" />
                  </div>
                  <h3 className="mt-3 font-semibold text-black">{item.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-text">{item.premissa}</p>
                  <p className="mt-3 text-xs text-black"><strong>Ângulo:</strong> {item.angulo}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-gray-faint bg-[#fbfcfd] p-8 text-center">
              <Lightbulb size={24} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-medium text-black">Seu banco ainda está vazio</p>
              <p className="mt-1 text-xs text-gray-text">Gere ideias a partir do que você já respondeu na SOMA.</p>
            </div>
          )}
        </section>
      )}

      {aba === 'voz' && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-mint-deep">IA com autenticidade</p>
            <h2 className="mt-1 font-display text-2xl text-black">Ensine a SOMA a escrever como você</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-text">
              Cole de 2 a 5 posts seus que você realmente goste. Não precisam ter performado bem, precisam parecer com você.
            </p>

            <div className="mt-5 space-y-3">
              {amostras.map((amostra, index) => (
                <textarea
                  key={index}
                  value={amostra}
                  onChange={(e) => setAmostras((lista) => lista.map((x, i) => (i === index ? e.target.value : x)))}
                  rows={5}
                  placeholder={`Post ${index + 1}`}
                  className="w-full resize-y rounded-xl border border-gray-faint px-4 py-3 text-sm leading-relaxed outline-none focus:border-mint-deep"
                />
              ))}
            </div>

            {amostras.length < 5 && (
              <button
                type="button"
                onClick={() => setAmostras((lista) => [...lista, ''])}
                className="mt-3 text-sm font-medium text-mint-deep"
              >
                + Adicionar outro post
              </button>
            )}

            <button
              type="button"
              onClick={treinarVoz}
              disabled={loading !== null}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-mint-deep px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading === 'voice' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Analisar minha voz
            </button>
          </section>

          <section className="rounded-2xl border border-gray-faint bg-[#f7f9fb] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-gray-text">Perfil discursivo</p>
            {voz ? (
              <div className="mt-3 space-y-4">
                <div className="rounded-xl border border-gray-faint bg-white p-4">
                  <p className="text-sm font-semibold text-black">Como você soa</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-text">{String(voz.resumo || '')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Tom', voz.tom],
                    ['Ritmo', voz.ritmo],
                    ['Estrutura', voz.estrutura],
                    ['Pontuação', voz.pontuacao],
                    ['CTA', voz.cta],
                    ['Evitar', voz.evitar],
                  ].map(([label, value]: any) => (
                    <div key={label} className="rounded-xl border border-gray-faint bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-text">{label}</p>
                      {Array.isArray(value) ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {value.map((x: string) => (
                            <span key={x} className="rounded-full bg-[#f3f5f6] px-2.5 py-1 text-xs text-black">{x}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm leading-relaxed text-black">{String(value || '')}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-mint/30 bg-mint-light p-4 text-xs leading-relaxed text-black">
                  Esse perfil fica salvo e entra automaticamente nas próximas gerações. Você pode retreinar quando sua forma de escrever mudar.
                </div>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <UserRound size={28} className="text-gray-300" />
                <p className="mt-3 text-sm font-medium text-black">Sua voz ainda não foi treinada</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-text">
                  Mesmo sem isso, a SOMA usa seu contexto. Com amostras reais, a linguagem fica mais próxima do seu jeito de escrever.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {aba === 'rascunhos' && (
        <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.14em] text-mint-deep">Histórico</p>
            <h2 className="mt-1 font-display text-2xl text-black">Rascunhos salvos</h2>
          </div>

          {historico.length ? (
            <div className="space-y-3">
              {historico.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-faint p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button type="button" onClick={() => abrirDraft(item)} className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f3f5f6] px-2.5 py-1 text-[10px] uppercase tracking-wide text-gray-text">
                          {item.formato || 'texto'}
                        </span>
                        {item.status === 'salvo' && (
                          <span className="rounded-full bg-mint-light px-2.5 py-1 text-[10px] uppercase tracking-wide text-mint-deep">salvo</span>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold text-black">{item.titulo || item.ideia || 'Rascunho LinkedIn'}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-text">{item.conteudo}</p>
                      <p className="mt-2 text-[11px] text-gray-text">
                        Atualizado em {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirDraft(item.id)}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-faint px-3 py-2 text-xs text-gray-text hover:border-red-200 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-faint bg-[#fbfcfd] p-8 text-center">
              <FileText size={24} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-medium text-black">Nenhum rascunho ainda</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
