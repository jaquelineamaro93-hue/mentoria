'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ClipboardList, ChevronDown, ExternalLink, History, Maximize2, Minimize2, Plus, Trash2, Send, Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Mascot } from '@/components/soma/CareerJourney';
import { formatarTextoIris, normalizarRespostasRapidas } from '@/lib/iris-comunicacao';

type Proposta = { titulo: string; descricao: string; pilar: string };
type Mensagem = {
  tipo: 'iris' | 'mentorado';
  texto: string;
  href?: string;
  proposta?: Proposta;
  token?: string;
  respostaRef?: string;
  sugestoes?: string[];
  avaliacao?: 'util' | 'nao_util';
};
type ConversaIris = { id: string; title: string; updated_at: string };
type MensagemSalva = { id: string; role: 'user' | 'assistant'; content: string; href: string | null;
  response_ref: string | null; feedback_rating: 'util' | 'nao_util' | null };
const converterMensagens = (rows: MensagemSalva[], nome = ''): Mensagem[] => [
  saudacaoIris(nome),
  ...rows.map(item => ({
    tipo: item.role === 'user' ? 'mentorado' as const : 'iris' as const,
    texto: item.content, href: item.href || undefined,
    respostaRef: item.response_ref || undefined,
    avaliacao: item.feedback_rating || undefined,
  })),
];


const SAUDACAO: Mensagem = {
  tipo: 'iris',
  texto: 'Oi, que bom ter você por aqui. Sou a Íris, sua parceira para pensar a carreira com clareza e transformar ideias em ações. Qual situação você quer destravar agora?',
};
function saudacaoIris(nome = ''): Mensagem {
  return nome
    ? { ...SAUDACAO, texto: 'Oi, ' + nome + '. Que bom te encontrar aqui. Me conta o que você quer destravar na carreira e vamos pensar no próximo passo.' }
    : SAUDACAO;
}

export default function IrisCopiloto() {
  const [aberto, setAberto] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [nomeMentorado, setNomeMentorado] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([SAUDACAO]);
  const [texto, setTexto] = useState('');
  const [ocupada, setOcupada] = useState(false);
  const [historicoCarregando, setHistoricoCarregando] = useState(true);
  const [historicoErro, setHistoricoErro] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ConversaIris[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [permitirHistorico, setPermitirHistorico] = useState(false);
  const [historicoAceito, setHistoricoAceito] = useState(false);
  const [preferenciaCarregando, setPreferenciaCarregando] = useState(false);
  const [mensagensAntigasLimitadas, setMensagensAntigasLimitadas] = useState(false);
  const [feedbackEdicao, setFeedbackEdicao] = useState<{ indice: number; avaliacao: 'util' | 'nao_util' } | null>(null);
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [feedbackEnviando, setFeedbackEnviando] = useState(false);
  const [feedbackErro, setFeedbackErro] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [visualHeight, setVisualHeight] = useState<number | null>(null);
  const [visualTop, setVisualTop] = useState(0);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const historico = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const acionador = useRef<HTMLButtonElement>(null);
  const abertoUmaVez = useRef(false);
  // Invalidar callbacks de requisições anteriores ao fechar a janela.
  const geracaoConversa = useRef(0);

  // Ler da SOMA, não do armazenamento do dispositivo. Funciona em sessões e
  // dispositivos diferentes, respeitando a autenticação e RLS por usuário.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const r = await fetch('/api/copiloto/historico?list_only=1', { credentials: 'same-origin', cache: 'no-store' });
        const d = await r.json() as { erro?: string; conversas?: ConversaIris[];
          mensagens?: MensagemSalva[]; conversation_id?: string | null; limite_atingido?: boolean; nome?: string;
          historico_aceito?: boolean; historico_ativo?: boolean };
        if (!r.ok) throw new Error(d.erro || 'Não foi possível abrir seu histórico.');
        if (!ativo) return;
        setNomeMentorado(d.nome || '');
        setConversas(d.conversas ?? []);
        // A chegada sempre começa com uma conversa nova; só a lista é carregada.
        setConversationId(null);
        setHistoricoAceito(!!d.historico_aceito);
        setPermitirHistorico(!!d.historico_ativo);
        setMensagens([saudacaoIris(d.nome || '')]);
        setMensagensAntigasLimitadas(false);
      } catch {
        if (ativo) setHistoricoErro('Não foi possível carregar suas conversas. Recarregue antes de enviar uma nova mensagem.');
      } finally {
        if (ativo) setHistoricoCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  async function abrirConversa(id: string) {
    if (ocupada || historicoCarregando) return;
    const geracao = ++geracaoConversa.current;
    setHistoricoCarregando(true); setHistoricoErro(null);
    try {
      const r = await fetch('/api/copiloto/historico?conversation_id=' + encodeURIComponent(id),
        { credentials: 'same-origin', cache: 'no-store' });
      const d = await r.json() as { erro?: string; conversas?: ConversaIris[];
        mensagens?: MensagemSalva[]; conversation_id?: string; limite_atingido?: boolean; nome?: string };
      if (!r.ok) throw new Error(d.erro || 'Conversa indisponível.');
      if (geracao !== geracaoConversa.current) return;
      setMensagens(converterMensagens(d.mensagens ?? [], d.nome || nomeMentorado));
      setConversationId(d.conversation_id ?? id);
      setConversas(d.conversas ?? []);
      setMensagensAntigasLimitadas(!!d.limite_atingido);
      setMostrarHistorico(false);
      setFeedbackEdicao(null);
    } catch (e) {
      if (geracao === geracaoConversa.current)
        setHistoricoErro(e instanceof Error ? e.message : 'Falha ao carregar.');
    } finally {
      setHistoricoCarregando(false);
    }
  }

  function limparConversaVisivel() {
    ++geracaoConversa.current;
    setConversationId(null);
    setMensagens([saudacaoIris(nomeMentorado)]);
    setTexto('');
    setMensagensAntigasLimitadas(false);
    setMostrarHistorico(false);
    setFeedbackEdicao(null);
    setFeedbackTexto('');
    setFeedbackErro(null);
    setHistoricoErro(null);
    // Não altera o consentimento nem apaga as conversas da conta.
  }

  function novaConversa() {
    if (ocupada || historicoCarregando) return;
    limparConversaVisivel();
  }

  function fecharConversa() {
    limparConversaVisivel();
    setExpandido(false);
    setAberto(false);
  }

  async function atualizarPrivacidade(habilitar: boolean) {
    if (preferenciaCarregando || historicoCarregando || ocupada) return;
    const geracao = geracaoConversa.current;
    setPreferenciaCarregando(true);
    setHistoricoErro(null);
    try {
      const res = await fetch('/api/copiloto/historico/consent', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilitar }),
      });
      const d = await res.json() as {
        erro?: string; historico_aceito?: boolean; historico_ativo?: boolean;
      };
      if (!res.ok) throw new Error(d.erro || 'Não foi possível salvar sua escolha.');
      setHistoricoAceito(!!d.historico_aceito);
      setPermitirHistorico(!!d.historico_ativo);
      if (!d.historico_ativo && geracao === geracaoConversa.current) {
        limparConversaVisivel();
        setMostrarHistorico(true);
      }
    } catch (e) {
      setHistoricoErro(e instanceof Error ? e.message : 'Falha ao salvar privacidade.');
    } finally {
      setPreferenciaCarregando(false);
    }
  }

  async function excluirConversa(id: string) {
    if (ocupada || historicoCarregando) return;
    if (!window.confirm('Excluir definitivamente esta conversa e suas mensagens?')) return;
    setHistoricoCarregando(true);
    try {
      const r = await fetch('/api/copiloto/historico', {
        method: 'DELETE', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: id }),
      });
      const d = await r.json() as { erro?: string };
      if (!r.ok) throw new Error(d.erro || 'Falha ao excluir.');
      const atualizadas = conversas.filter(c => c.id !== id);
      setConversas(atualizadas);
      if (conversationId === id) {
        setConversationId(null); setMensagens([saudacaoIris(nomeMentorado)]); setMensagensAntigasLimitadas(false);
      }
    } catch (e) {
      setHistoricoErro(e instanceof Error ? e.message : 'Não foi possível excluir.');
    } finally {
      setHistoricoCarregando(false);
    }
  }

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const sincronizar = () => setMobile(media.matches);
    sincronizar();
    media.addEventListener('change', sincronizar);
    return () => media.removeEventListener('change', sincronizar);
  }, []);

  // Em celulares, acompanha a área realmente visível quando o teclado abre.
  // A janela deve permanecer acessível tanto no Safari como nos demais navegadores.
  useEffect(() => {
    if (!aberto || !mobile) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const atualizar = () => {
      setVisualHeight(Math.round(viewport.height));
      setVisualTop(Math.round(viewport.offsetTop));
    };
    atualizar();
    viewport.addEventListener('resize', atualizar);
    viewport.addEventListener('scroll', atualizar);
    return () => {
      viewport.removeEventListener('resize', atualizar);
      viewport.removeEventListener('scroll', atualizar);
    };
  }, [aberto, mobile, expandido]);

  useEffect(() => {
    if (!aberto) return;
    const area = historico.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [aberto, mensagens, ocupada, visualHeight, expandido]);

  useEffect(() => {
    if (aberto) abertoUmaVez.current = true;
    else if (abertoUmaVez.current) acionador.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    if (mobile || expandido) painel.current?.focus();
    else caixa.current?.focus();
    const teclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        fecharConversa();
      }
      if ((!mobile && !expandido) || event.key !== 'Tab' || !painel.current) return;
      const botoes = [...painel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],textarea:not([disabled]),input:not([disabled])'
      )].filter(element => element.getClientRects().length > 0);
      if (!botoes.length) return;
      const primeiro = botoes[0];
      const ultimo = botoes[botoes.length - 1];
      if (!painel.current.contains(document.activeElement) || document.activeElement === painel.current) {
        event.preventDefault(); (event.shiftKey ? ultimo : primeiro).focus();
      } else if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault(); ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault(); primeiro.focus();
      }
    };
    document.addEventListener('keydown', teclado);
    return () => {
      document.removeEventListener('keydown', teclado);
    };
  }, [aberto, mobile, expandido, nomeMentorado]);

  async function enviar(pedidoExterno?: string) {
    const pedido = (pedidoExterno ?? texto).trim();
    if (!pedido || ocupada || historicoCarregando || preferenciaCarregando ||
        (!!conversationId && !permitirHistorico)) return;
    const geracao = geracaoConversa.current;
    setTexto('');
    setOcupada(true);
    setMensagens(anteriores => [...anteriores, { tipo: 'mentorado', texto: pedido }]);
    try {
      const resposta = await fetch('/api/copiloto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          mensagem: pedido, conversation_id: conversationId, persistir_historico: permitirHistorico,
          // Contexto da sessão apenas quando ainda não há conversa persistida.
          // Vai somente nesta requisição; não é salvo sem consentimento.
          contexto_temporario: !conversationId
            ? mensagens.slice(1).slice(-10).map(m => ({
              role: m.tipo === 'mentorado' ? 'user' : 'assistant',
              content: m.texto.slice(0, 340),
            }))
            : undefined,
        }),
      });
      const dados = await resposta.json() as {
        resposta?: string; erro?: string; href?: string;
        proposta?: Proposta; token?: string; conversation_id?: string;
        resposta_ref?: string; aviso_historico?: string; sugestoes?: string[];
      };
      if (resposta.ok && dados.conversation_id) {
        setConversas(anteriores => [
          { id: dados.conversation_id as string,
            title: anteriores.find(c => c.id === dados.conversation_id)?.title || pedido.replace(/\s+/g, ' ').slice(0, 95),
            updated_at: new Date().toISOString() },
          ...anteriores.filter(c => c.id !== dados.conversation_id),
        ]);
      }
      // Um envio anterior que terminou após o fechamento pode ficar salvo no
      // histórico, mas não deve reaparecer na nova conversa da janela.
      if (geracao !== geracaoConversa.current) return;
      if (resposta.ok && dados.conversation_id) setConversationId(dados.conversation_id);
      if (dados.aviso_historico) setHistoricoErro(dados.aviso_historico);
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: dados.resposta || dados.erro || 'Não consegui responder neste momento.',
        href: resposta.ok ? dados.href : undefined,
        proposta: resposta.ok ? dados.proposta : undefined,
        token: resposta.ok ? dados.token : undefined,
        respostaRef: resposta.ok && dados.resposta ? (dados.resposta_ref || crypto.randomUUID()) : undefined,
        sugestoes: resposta.ok ? normalizarRespostasRapidas(dados.sugestoes) : undefined,
      }]);
    } catch {
      if (geracao === geracaoConversa.current) setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: 'Houve uma falha de conexão. Você pode tentar novamente.',
      }]);
    } finally {
      setOcupada(false);
    }
  }

  async function confirmar(indice: number, proposta: Proposta, token: string) {
    if (ocupada) return;
    const geracao = geracaoConversa.current;
    setOcupada(true);
    try {
      const res = await fetch('/api/copiloto', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ acao: 'confirmar_pdi', proposta, token, conversation_id: conversationId }),
      });
      const data = await res.json() as { resposta?: string; erro?: string; href?: string; resposta_ref?: string; conversation_id?: string; aviso_historico?: string };
      if (geracao !== geracaoConversa.current) return;
      if (res.ok && data.conversation_id) setConversationId(data.conversation_id);
      if (data.aviso_historico) setHistoricoErro(data.aviso_historico);
      if (res.ok) {
        setMensagens(anteriores => anteriores.map((m, i) =>
          i === indice ? { ...m, proposta: undefined, token: undefined } : m
        ));
      }
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: data.resposta || data.erro || 'Não consegui executar essa ação.',
        href: res.ok ? data.href : undefined,
        respostaRef: res.ok && data.resposta ? (data.resposta_ref || crypto.randomUUID()) : undefined,
      }]);
    } catch {
      if (geracao === geracaoConversa.current) setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: 'Falha na conexão. A confirmação não foi concluída.',
      }]);
    } finally {
      setOcupada(false);
    }
  }

  async function enviarFeedback(indice: number, avaliacao: 'util' | 'nao_util') {
    const msg = mensagens[indice];
    if (!msg?.respostaRef || feedbackEnviando || msg.avaliacao) return;
    setFeedbackEnviando(true);
    setFeedbackErro(null);
    try {
      const res = await fetch('/api/copiloto/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          respostaRef: msg.respostaRef,
          avaliacao,
          comentario: feedbackEdicao?.indice === indice ? feedbackTexto : '',
        }),
      });
      const dados = await res.json() as { sucesso?: boolean; erro?: string };
      if (!res.ok || !dados.sucesso) {
        setFeedbackErro(dados.erro || 'Não foi possível salvar sua avaliação.');
        return;
      }
      setMensagens(anteriores => anteriores.map((item, i) => i === indice
        ? { ...item, avaliacao } : item));
      setFeedbackEdicao(null);
      setFeedbackTexto('');
    } catch {
      setFeedbackErro('Houve uma falha de conexão. Tente novamente.');
    } finally {
      setFeedbackEnviando(false);
    }
  }

  return (
    <aside
      className={aberto && (mobile || expandido)
        ? 'fixed inset-0 z-[70] sm:bg-[#141b18]/35 sm:p-5'
        : 'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] sm:bottom-6 sm:right-6'}
      style={aberto && mobile && visualHeight
        ? { height: visualHeight + 'px', top: visualTop + 'px' }
        : undefined}
      aria-label="Íris Copiloto de Carreira"
    >
      {!aberto ? (
        <button
          ref={acionador}
          type="button"
          aria-label="Abrir Íris Copiloto"
          aria-expanded={false}
          onClick={() => setAberto(true)}
          className="flex min-h-12 items-center gap-2 rounded-full border border-[#7b5c4c] bg-[#5B453E] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#45322c]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f0e9fa]" aria-hidden="true"><Mascot index={3} size={28} /></span>
          <span>Íris Copiloto</span>
          {!historicoCarregando && !historicoAceito && (
            <span className="rounded-full bg-[#e3f5f0] px-2 py-0.5 text-[10px] font-medium text-[#285d51]">
              Privacidade
            </span>
          )}
        </button>
      ) : (
        <div
          ref={painel}
          tabIndex={-1}
          className={mobile
            ? 'flex h-full w-full min-w-0 flex-col overflow-hidden bg-white outline-none'
            : expandido
              ? 'mx-auto flex h-full w-full max-w-[1200px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d8cec9] bg-white shadow-2xl outline-none'
              : 'flex h-[min(720px,calc(100dvh-3rem))] w-[min(460px,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d8cec9] bg-white shadow-2xl outline-none'}
          role={mobile || expandido ? 'dialog' : 'region'}
          aria-modal={mobile || expandido ? true : undefined}
          aria-labelledby="iris-copiloto-title"
        >
          <header className="flex shrink-0 items-center justify-between bg-[#5B453E] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 bg-[#f3ecfc]" aria-hidden="true"><Mascot index={3} size={36} /></span>
              <div>
                <p id="iris-copiloto-title" className="text-sm font-semibold">Íris Copiloto</p>
                <p className="text-xs text-white/80">Sua estrategista de carreira</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMostrarHistorico(a => !a)}
                disabled={historicoCarregando || ocupada} aria-label="Ver histórico da Íris"
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50">
                <History size={20} aria-hidden="true" />
              </button>
              <button type="button" onClick={novaConversa}
                disabled={historicoCarregando || ocupada} aria-label="Nova conversa com a Íris"
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50">
                <Plus size={20} aria-hidden="true" />
              </button>
              {!mobile && (
                <button type="button"
                  onClick={() => setExpandido(valor => !valor)}
                  aria-label={expandido ? 'Reduzir janela da Íris' : 'Expandir janela da Íris'}
                  aria-pressed={expandido}
                  title={expandido ? 'Voltar ao tamanho compacto' : 'Expandir conversa'}
                  className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white">
                  {expandido ? <Minimize2 size={19} aria-hidden="true" /> : <Maximize2 size={19} aria-hidden="true" />}
                </button>
              )}
            <button
              type="button"
              onClick={fecharConversa}
              aria-label="Fechar conversa"
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15"
            >
              <X size={19} />
            </button>
            </div>
          </header>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#dce6dd] bg-[#f6faf7] px-3 py-2 text-xs">
            <span className="text-[#5c7467]">Uma conversa de cada vez, com direção</span>
            <Link href="/plano-acoes-iris" className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#0D8071] underline-offset-2 hover:underline">
              <ClipboardList size={15} aria-hidden="true" /> Plano de Ações da Íris <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
          {mostrarHistorico && (
            <div className="max-h-[45%] shrink-0 overflow-y-auto border-b border-[#e8e0dc] bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-[#312b27]">Minhas conversas</h3>
              {historicoAceito && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f2f8f4] px-3 py-2 text-xs text-[#426357]">
                  <span>{permitirHistorico ? 'Salvamento de novas conversas ativo' : 'Salvamento de novas conversas pausado'}</span>
                  <button type="button" onClick={() => void atualizarPrivacidade(!permitirHistorico)}
                    disabled={ocupada || preferenciaCarregando || historicoCarregando}
                    className="min-h-9 rounded-lg border border-[#a9d5c4] bg-white px-3 font-semibold text-[#1b6f5c] disabled:opacity-50">
                    {preferenciaCarregando ? 'Salvando...' : permitirHistorico ? 'Pausar' : 'Reativar'}
                  </button>
                </div>
              )}
              {conversas.length === 0 && <p className="text-xs text-gray-600">Nenhuma conversa salva ainda.</p>}
              {conversas.map(c => (
                <div key={c.id} className="flex items-center gap-1 rounded-lg hover:bg-[#f2f7f5]">
                  <button type="button" onClick={() => void abrirConversa(c.id)}
                    className="min-h-11 min-w-0 flex-1 truncate px-3 text-left text-xs font-medium text-[#24483e]"
                    aria-current={conversationId === c.id ? 'true' : undefined}>{c.title}</button>
                  <button type="button" onClick={() => void excluirConversa(c.id)}
                    aria-label={'Excluir conversa ' + c.title}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[#745c53] hover:bg-[#ffebe6]">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {!historicoAceito && !historicoCarregando && (
            <div className="shrink-0 border-b border-[#e8e0dc] bg-[#f5fbf8] px-3 py-2 text-xs leading-5 text-[#294d42]">
              <label className="flex cursor-pointer items-center gap-2.5 font-semibold">
                <input type="checkbox" checked={false} disabled={preferenciaCarregando}
                  onChange={event => { if (event.target.checked) void atualizarPrivacidade(true); }}
                  className="h-4 w-4 shrink-0 accent-[#0D8071]" />
                <span>{preferenciaCarregando ? 'Salvando sua escolha...' : 'Salvar minhas conversas com a Íris'}</span>
              </label>
              <details className="ml-6 mt-1 text-[11px] text-[#557468]">
                <summary className="cursor-pointer underline-offset-2 hover:underline">
                  Atualização de privacidade: ativar meu histórico
                </summary>
                <p className="mt-2 leading-5">
                  Ao marcar, autorizo a SOMA a armazenar minhas mensagens da Íris Copilot para continuar conversas depois.
                  O histórico fica restrito à minha conta e a equipe autorizada poderá acessá-lo apenas para suporte
                  e segurança, conforme as regras de privacidade. Posso excluir conversas quando quiser.
                  Sem marcar, a Íris continua funcionando sem histórico salvo.
                </p>
              </details>
            </div>
          )}
          {conversationId && !permitirHistorico && (
            <p role="status" className="shrink-0 border-b border-[#dce9e3] bg-[#f4faf7] px-3 py-2 text-xs text-[#416757]">
              Esta conversa foi salva anteriormente. Para continuá-la, reative o salvamento em Histórico,
              ou comece uma nova conversa sem salvar.
            </p>
          )}
          {historicoErro && <p role="alert" className="shrink-0 bg-[#fff3ec] px-3 py-2 text-xs text-[#854938]">{historicoErro}</p>}
          {historicoCarregando && <p role="status" className="shrink-0 px-3 py-2 text-xs text-gray-600">Carregando seu histórico...</p>}
          {mensagensAntigasLimitadas && <p className="shrink-0 px-3 py-2 text-xs text-gray-600">Exibindo as últimas 150 mensagens desta conversa.</p>}
          <div ref={historico} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#fbfaf8] p-3 sm:p-4" aria-live="polite" aria-relevant="additions">
            {mensagens.map((m, indice) => (
              <div key={indice} className={m.tipo === 'mentorado'
                ? 'ml-auto max-w-[72ch]'
                : 'mr-auto max-w-[80ch]'}>
                <div className={m.tipo === 'mentorado'
                  ? 'rounded-2xl rounded-tr-sm bg-[#e3f5f0] p-3 text-sm leading-relaxed text-[#28322e]'
                  : 'rounded-2xl rounded-tl-sm border border-[#e8e0dc] bg-white p-3 text-sm leading-relaxed text-[#312b27]'
                }>
                  {m.tipo === 'iris' ? (
                    <div className="break-words text-sm leading-6 [&>*+*]:mt-3 [&_strong]:font-semibold [&_strong]:text-[#233f34]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        p: ({ children }) => <p className="leading-6">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5">{children}</ol>,
                        li: ({ children }) => <li className="pl-1">{children}</li>,
                        h2: ({ children }) => <h2 className="text-base font-bold text-[#253c33]">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-semibold text-[#253c33]">{children}</h3>,
                        a: ({ href, children }) =>
                          <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0D8071] underline">{children}</a>,
                        table: ({children}) => <div className="overflow-x-auto"><table className="min-w-full border-collapse text-xs">{children}</table></div>,
                        th: ({children}) => <th className="border border-[#e1e7e0] bg-[#f1f7f2] px-2 py-2 text-left">{children}</th>,
                        td: ({children}) => <td className="border border-[#e1e7e0] px-2 py-2 align-top">{children}</td>,
                      }}>{formatarTextoIris(m.texto)}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                  )}
                  {m.tipo === 'iris' && indice === mensagens.length - 1 &&
                    normalizarRespostasRapidas(m.sugestoes).length > 0 && (
                    <section aria-label="Respostas rápidas para continuar a conversa"
                      className="mt-4 rounded-xl border border-[#d4e5dc] bg-[#f7faf8] p-3">
                      <p className="text-xs font-semibold text-[#285c4a]">Como quer continuar?</p>
                      <p id={'iris-escolhas-' + indice} className="mt-1 text-xs leading-5 text-[#567466]">
                        Toque em uma opção para enviar sua resposta à Íris, ou escreva abaixo.
                        Isso não cria tarefas nem salva ações
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {normalizarRespostasRapidas(m.sugestoes).map(sugestao => (
                          <button key={sugestao} type="button" onClick={() => void enviar(sugestao)}
                            aria-label={'Enviar resposta: ' + sugestao}
                            aria-describedby={'iris-escolhas-' + indice}
                            disabled={ocupada || historicoCarregando || preferenciaCarregando ||
                              (!!conversationId && !permitirHistorico)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#b8d7ca] bg-white px-3 py-2 text-left text-xs font-medium text-[#215849] transition hover:bg-[#e4f3ec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071] disabled:opacity-40">
                            <Send size={13} aria-hidden="true" className="shrink-0" />
                            {sugestao}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                  {m.href && !m.proposta && (
                    <a href={m.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#5B453E] underline">
                      {m.href === '/plano-acoes-iris'
                        ? 'Abrir meu Plano de Ações da Íris'
                        : m.href?.startsWith('/meu-pdi') ? 'Abrir meu PDI'
                          : m.href?.startsWith('/carreira') ? 'Abrir currículo e carreira'
                            : 'Abrir ferramenta'} <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                  {m.proposta && m.token && (
                    <div className="mt-3 rounded-lg border border-[#cfc3bb] bg-[#faf7f3] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide">Prévia da ação</p>
                      <p className="mt-2 font-semibold">{m.proposta.titulo}</p>
                      <p className="mt-1 text-xs">{m.proposta.descricao}</p>
                      <p className="mt-1 text-xs text-gray-600">Pilar: {m.proposta.pilar}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => void confirmar(indice, m.proposta as Proposta, m.token as string)}
                          className="min-h-11 rounded-full bg-[#5B453E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Confirmar e salvar
                        </button>
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => setMensagens(anteriores => anteriores.map((item, i) =>
                            i === indice ? { ...item, proposta: undefined, token: undefined } : item
                          ))}
                          className="min-h-11 rounded-full border border-[#cfc3bb] px-3 py-2 text-xs disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {m.tipo === 'iris' && m.respostaRef && (
                    <div className="mt-3 border-t border-[#eee7e2] pt-2">
                      {m.avaliacao ? (
                        <p className="text-xs text-[#42685b]" role="status">
                          <span aria-hidden="true">✓ </span>Avaliação registrada. Obrigada por ajudar a melhorar a Íris.
                        </p>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-xs text-[#746a65]">Esta resposta ajudou?</span>
                            <button type="button" disabled={feedbackEnviando} aria-label="Resposta útil" aria-pressed={feedbackEdicao?.indice === indice && feedbackEdicao.avaliacao === 'util'}
                              onClick={() => { setFeedbackEdicao({ indice, avaliacao: 'util' }); setFeedbackTexto(''); setFeedbackErro(null); }}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#d8d0cb] px-3 py-2 text-xs text-[#5B453E] hover:bg-[#e9f7f3] disabled:opacity-50">
                              <ThumbsUp size={15} aria-hidden="true" /> Útil
                            </button>
                            <button type="button" disabled={feedbackEnviando} aria-label="Resposta não ajudou" aria-pressed={feedbackEdicao?.indice === indice && feedbackEdicao.avaliacao === 'nao_util'}
                              onClick={() => { setFeedbackEdicao({ indice, avaliacao: 'nao_util' }); setFeedbackTexto(''); setFeedbackErro(null); }}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#d8d0cb] px-3 py-2 text-xs text-[#5B453E] hover:bg-[#fff3ee] disabled:opacity-50">
                              <ThumbsDown size={15} aria-hidden="true" /> Não ajudou
                            </button>
                          </div>
                          {feedbackEdicao?.indice === indice && (
                            <div className="mt-3 space-y-2">
                              <label htmlFor={`iris-feedback-${indice}`} className="block text-xs font-medium text-[#5B453E]">
                                Quer contar o motivo? (opcional)
                              </label>
                              <textarea id={`iris-feedback-${indice}`} rows={2} maxLength={300}
                                value={feedbackTexto} onChange={event => setFeedbackTexto(event.target.value)}
                                placeholder="O que a Íris pode melhorar?"
                                className="w-full resize-y rounded-lg border border-[#d8d0cb] bg-white p-2 text-sm text-[#312b27] outline-none focus:border-[#0D8071]" />
                              {feedbackErro && <p role="alert" className="text-xs text-red-700">{feedbackErro}</p>}
                              <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={feedbackEnviando}
                                  onClick={() => void enviarFeedback(indice, feedbackEdicao.avaliacao)}
                                  className="min-h-10 rounded-lg bg-[#0D8071] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                                  {feedbackEnviando ? 'Enviando...' : 'Enviar avaliação'}
                                </button>
                                <button type="button" onClick={() => { setFeedbackEdicao(null); setFeedbackTexto(''); setFeedbackErro(null); }}
                                  className="min-h-10 rounded-lg border border-[#d8d0cb] px-3 py-2 text-xs">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {ocupada && <p className="text-xs text-gray-600">Íris está preparando a resposta...</p>}
          </div>
          {mensagens.length === 1 && (
            <section aria-label="Mensagens rápidas para começar" className="shrink-0 border-t border-[#eee6df] bg-[#f8faf8] px-3 py-3">
              <p className="text-xs font-semibold text-[#365c4c]">Quer começar por algum destes assuntos?</p>
              <p className="mt-1 text-xs text-[#687c70]">Toque para enviar sua escolha, ou escreva sua pergunta.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Quero um plano para 7 dias', 'Quero entender meu próximo passo', 'Quero treinar uma entrevista'].map(sugestao => (
                  <button
                    key={sugestao}
                    type="button"
                    disabled={ocupada || historicoCarregando || preferenciaCarregando}
                    onClick={() => void enviar(sugestao)}
                    aria-label={'Enviar resposta: ' + sugestao}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#d9e5dc] bg-white px-3 py-2 text-xs text-[#275a48] hover:bg-[#eaf5ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071] disabled:opacity-50"
                  >
                    <Send size={12} aria-hidden="true" />
                    {sugestao}
                  </button>
                ))}
              </div>
            </section>
          )}
          <form
            className="flex shrink-0 items-end gap-2 border-t border-[#eee6df] bg-white p-3"
            onSubmit={event => { event.preventDefault(); void enviar(); }}
          >
            <textarea
              ref={caixa}
              rows={2}
              maxLength={4000}
              value={texto}
              onChange={event => setTexto(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void enviar();
                }
              }}
              disabled={!!conversationId && !permitirHistorico}
              placeholder={conversationId && !permitirHistorico
                ? 'Reative o histórico ou comece uma nova conversa'
                : 'O que você precisa resolver na carreira agora?'}
              aria-label="Mensagem para Íris Copiloto"
              className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-[#d9d0c9] bg-white px-3 py-2 text-base text-[#312b27] outline-none focus:border-[#5B453E]"
            />
            <button
              type="submit"
              disabled={ocupada || historicoCarregando || preferenciaCarregando ||
                (!!conversationId && !permitirHistorico) || !texto.trim()}
              aria-label="Enviar mensagem"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#5B453E] text-white disabled:opacity-40"
            >
              {ocupada ? <ChevronDown size={19} /> : <Send size={19} />}
            </button>
          </form>
          <p className="shrink-0 bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] text-gray-600">
            {permitirHistorico ? 'Histórico ativo' : 'Conversa sem salvamento'} · Ações no PDI exigem confirmação.
          </p>
        </div>
      )}
    </aside>
  );
}
