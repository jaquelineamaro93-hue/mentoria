'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, Send, Sparkles, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Mascot } from '@/components/soma/CareerJourney';

type Proposta = { titulo: string; descricao: string; pilar: string };
type Mensagem = {
  tipo: 'iris' | 'mentorado';
  texto: string;
  href?: string;
  proposta?: Proposta;
  token?: string;
  responseId?: string;
  intent?: 'progresso' | 'vaga' | 'pdi' | 'orientacao';
  rating?: 'positivo' | 'negativo';
  feedbackAberto?: boolean;
  comentario?: string;
  feedbackErro?: string;
};

const SAUDACAO: Mensagem = {
  tipo: 'iris',
  texto: 'Sou a Íris, sua Copiloto de Carreira dentro da SOMA. Posso consultar sua evolução, analisar uma vaga com seu currículo ou preparar uma ação para o PDI, sempre pedindo confirmação antes de salvar.',
};

export default function IrisCopiloto() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([SAUDACAO]);
  const [texto, setTexto] = useState('');
  const [ocupada, setOcupada] = useState(false);
  const [avaliandoId, setAvaliandoId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [visualHeight, setVisualHeight] = useState<number | null>(null);
  const [visualTop, setVisualTop] = useState(0);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const historico = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const acionador = useRef<HTMLButtonElement>(null);
  const abertoUmaVez = useRef(false);

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
  }, [aberto, mobile]);

  useEffect(() => {
    if (!aberto) return;
    const area = historico.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [aberto, mensagens, ocupada, visualHeight]);

  useEffect(() => {
    if (aberto) abertoUmaVez.current = true;
    else if (abertoUmaVez.current) acionador.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    if (mobile) painel.current?.focus();
    else caixa.current?.focus();
    const teclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setAberto(false);
      }
      if (!mobile || event.key !== 'Tab' || !painel.current) return;
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
  }, [aberto, mobile]);

  function detectarIntencao(pedido: string): 'progresso' | 'vaga' | 'pdi' | 'orientacao' {
    if (/progresso|status|complet|conclu|finalizad|pendência/i.test(pedido)) return 'progresso';
    if (/vaga|currículo|candidatura/i.test(pedido)) return 'vaga';
    if (/pdi|plano de desenvolvimento|criar ação/i.test(pedido)) return 'pdi';
    return 'orientacao';
  }

  async function avaliarResposta(indice: number, rating: 'positivo' | 'negativo', comentario?: string) {
    const msg = mensagens[indice];
    if (!msg?.responseId || !msg.intent || avaliandoId) return;
    setAvaliandoId(msg.responseId);
    try {
      const res = await fetch('/api/copiloto/feedback', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: msg.responseId,
          intent: msg.intent,
          rating,
          reason: (comentario ?? '').slice(0, 350),
        }),
      });
      const data = await res.json() as { ok?: boolean; erro?: string };
      if (!res.ok || !data.ok) throw new Error(data.erro || 'Não foi possível salvar seu feedback.');
      setMensagens(anteriores => anteriores.map((m, i) => i === indice
        ? { ...m, rating, feedbackAberto: rating === 'negativo' && comentario === undefined,
            feedbackErro: undefined } : m));
    } catch (erro) {
      setMensagens(anteriores => anteriores.map((m, i) => i === indice
        ? { ...m, feedbackErro: erro instanceof Error ? erro.message : 'Não foi possível salvar.' } : m));
    } finally {
      setAvaliandoId(null);
    }
  }

  async function enviar(pedidoExterno?: string) {
    const pedido = (pedidoExterno ?? texto).trim();
    if (!pedido || ocupada) return;
    setTexto('');
    setOcupada(true);
    setMensagens(anteriores => [...anteriores, { tipo: 'mentorado', texto: pedido }]);
    try {
      const resposta = await fetch('/api/copiloto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ mensagem: pedido }),
      });
      const dados = await resposta.json() as {
        resposta?: string; erro?: string; href?: string;
        proposta?: Proposta; token?: string; response_id?: string;
      };
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: dados.resposta || dados.erro || 'Não consegui responder neste momento.',
        href: resposta.ok ? dados.href : undefined,
        proposta: resposta.ok ? dados.proposta : undefined,
        token: resposta.ok ? dados.token : undefined,
        responseId: resposta.ok ? dados.response_id : undefined,
        intent: resposta.ok ? detectarIntencao(pedido) : undefined,
      }]);
    } catch {
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: 'Houve uma falha de conexão. Você pode tentar novamente.',
      }]);
    } finally {
      setOcupada(false);
    }
  }

  async function confirmar(indice: number, proposta: Proposta, token: string) {
    if (ocupada) return;
    setOcupada(true);
    try {
      const res = await fetch('/api/copiloto', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ acao: 'confirmar_pdi', proposta, token }),
      });
      const data = await res.json() as { resposta?: string; erro?: string; href?: string; response_id?: string };
      if (res.ok) {
        setMensagens(anteriores => anteriores.map((m, i) =>
          i === indice ? { ...m, proposta: undefined, token: undefined } : m
        ));
      }
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: data.resposta || data.erro || 'Não consegui executar essa ação.',
        href: res.ok ? data.href : undefined,
        responseId: res.ok ? data.response_id : undefined,
        intent: res.ok ? 'pdi' : undefined,
      }]);
    } catch {
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: 'Falha na conexão. A confirmação não foi concluída.',
      }]);
    } finally {
      setOcupada(false);
    }
  }

  return (
    <aside
      className={aberto && mobile
        ? 'fixed inset-0 z-[70]'
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
        </button>
      ) : (
        <div
          ref={painel}
          tabIndex={-1}
          className={mobile
            ? 'flex h-full w-full min-w-0 flex-col overflow-hidden bg-white outline-none'
            : 'flex h-[min(720px,calc(100dvh-3rem))] w-[min(460px,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d8cec9] bg-white shadow-2xl outline-none'}
          role={mobile ? 'dialog' : 'region'}
          aria-modal={mobile ? true : undefined}
          aria-labelledby="iris-copiloto-title"
        >
          <header className="flex shrink-0 items-center justify-between bg-[#5B453E] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 bg-[#f3ecfc]" aria-hidden="true"><Mascot index={3} size={36} /></span>
              <div>
                <p id="iris-copiloto-title" className="text-sm font-semibold">Íris Copiloto</p>
                <p className="text-xs text-white/80">Assistente nativa da SOMA</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar conversa"
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15"
            >
              <X size={19} />
            </button>
          </header>
          <div ref={historico} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#fbfaf8] p-3 sm:p-4" aria-live="polite" aria-relevant="additions">
            {mensagens.map((m, indice) => (
              <div key={indice} className={m.tipo === 'mentorado' ? 'ml-5 sm:ml-8' : 'mr-3 sm:mr-6'}>
                <div className={m.tipo === 'mentorado'
                  ? 'rounded-2xl rounded-tr-sm bg-[#e3f5f0] p-3 text-sm leading-relaxed text-[#28322e]'
                  : 'rounded-2xl rounded-tl-sm border border-[#e8e0dc] bg-white p-3 text-sm leading-relaxed text-[#312b27]'
                }>
                  <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                  {m.href && !m.proposta && (
                    <a href={m.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#5B453E] underline">
                      Abrir ferramenta <ExternalLink size={12} aria-hidden="true" />
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
                </div>
                {m.tipo === 'iris' && m.responseId && (
                  <div className="mt-1.5 flex flex-col gap-1 pl-1">
                    <div className="flex items-center gap-1 text-[#79675d]">
                      <span className="mr-1 text-[11px]">Esta resposta ajudou?</span>
                      <button type="button" aria-label="Resposta útil, gostei" title="Gostei"
                        aria-pressed={m.rating === 'positivo'} disabled={avaliandoId === m.responseId}
                        onClick={() => void avaliarResposta(indice, 'positivo')}
                        className={'grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-[#5B453E] ' + (m.rating === 'positivo' ? 'bg-[#dcf5e8] text-[#12694a]' : 'hover:bg-[#ebe6e1]')}
                      ><ThumbsUp size={18} aria-hidden="true" /></button>
                      <button type="button" aria-label="Resposta não ajudou, enviar feedback" title="Pode melhorar"
                        aria-pressed={m.rating === 'negativo'} disabled={avaliandoId === m.responseId}
                        onClick={() => void avaliarResposta(indice, 'negativo')}
                        className={'grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-[#5B453E] ' + (m.rating === 'negativo' ? 'bg-[#f7e9e3] text-[#854938]' : 'hover:bg-[#ebe6e1]')}
                      ><ThumbsDown size={18} aria-hidden="true" /></button>
                      {m.rating && <span className="ml-1 text-[11px] text-[#516b60]">Avaliação registrada</span>}
                    </div>
                    {m.rating === 'negativo' && m.feedbackAberto && (
                      <form className="rounded-xl border border-[#e8e0dc] bg-white p-2"
                        onSubmit={event => { event.preventDefault(); void avaliarResposta(indice, 'negativo', m.comentario?.trim() || ''); }}>
                        <label className="block text-xs font-medium text-[#5B453E]" htmlFor={'feedback-iris-' + indice}>
                          O que a Íris poderia melhorar? (opcional)
                        </label>
                        <textarea id={'feedback-iris-' + indice} rows={2} maxLength={350}
                          value={m.comentario ?? ''}
                          onChange={event => setMensagens(anteriores => anteriores.map((item, i) => i === indice
                            ? { ...item, comentario: event.target.value } : item))}
                          placeholder="Ex.: faltou um próximo passo claro"
                          className="mt-2 w-full resize-y rounded-lg border border-[#d9d0c9] p-2 text-sm outline-none focus:border-[#5B453E]" />
                        <div className="mt-2 flex items-center gap-2">
                          <button type="submit" disabled={avaliandoId === m.responseId}
                            className="min-h-11 rounded-lg bg-[#5B453E] px-3 text-xs font-semibold text-white disabled:opacity-50">
                            Enviar comentário
                          </button>
                          <button type="button" onClick={() => setMensagens(anteriores => anteriores.map((item, i) =>
                            i === indice ? { ...item, feedbackAberto: false } : item))}
                            className="min-h-11 px-3 text-xs text-[#5B453E]">Agora não</button>
                        </div>
                      </form>
                    )}
                    {m.feedbackErro && <p role="alert" className="text-xs text-red-700">{m.feedbackErro}</p>}
                  </div>
                )}
              </div>
            ))}
            {ocupada && <p className="text-xs text-gray-600">Íris está preparando a resposta...</p>}
          </div>
          {mensagens.length === 1 && (
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto border-t border-[#eee6df] px-3 py-2">
              {['Como está meu progresso?', 'Analisar uma vaga', 'Criar ação no PDI'].map(sugestao => (
                <button
                  key={sugestao}
                  type="button"
                  disabled={ocupada}
                  onClick={() => void enviar(sugestao)}
                  className="min-h-10 rounded-full border border-[#d9d0c9] px-3 py-2 text-xs text-[#5B453E] disabled:opacity-50"
                >
                  {sugestao}
                </button>
              ))}
            </div>
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
              placeholder="Peça uma análise ou ação..."
              aria-label="Mensagem para Íris Copiloto"
              className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-[#d9d0c9] bg-white px-3 py-2 text-base text-[#312b27] outline-none focus:border-[#5B453E]"
            />
            <button
              type="submit"
              disabled={ocupada || !texto.trim()}
              aria-label="Enviar mensagem"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#5B453E] text-white disabled:opacity-40"
            >
              {ocupada ? <ChevronDown size={19} /> : <Send size={19} />}
            </button>
          </form>
          <p className="shrink-0 bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] text-gray-600">
            Ações no PDI só são salvas após sua confirmação.
          </p>
        </div>
      )}
    </aside>
  );
}
