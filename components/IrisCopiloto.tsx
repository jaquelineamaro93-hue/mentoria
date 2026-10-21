'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, ExternalLink, Send, Sparkles, X } from 'lucide-react';

type Proposta = { titulo: string; descricao: string; pilar: string };
type Mensagem = {
  tipo: 'iris' | 'mentorado';
  texto: string;
  href?: string;
  proposta?: Proposta;
  token?: string;
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
  const final = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (aberto) {
      final.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [aberto, mensagens, ocupada]);

  useEffect(() => {
    if (aberto) caixa.current?.focus();
  }, [aberto]);

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
        proposta?: Proposta; token?: string;
      };
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: dados.resposta || dados.erro || 'Não consegui responder neste momento.',
        href: resposta.ok ? dados.href : undefined,
        proposta: resposta.ok ? dados.proposta : undefined,
        token: resposta.ok ? dados.token : undefined,
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
      const data = await res.json() as { resposta?: string; erro?: string; href?: string };
      if (res.ok) {
        setMensagens(anteriores => anteriores.map((m, i) =>
          i === indice ? { ...m, proposta: undefined, token: undefined } : m
        ));
      }
      setMensagens(anteriores => [...anteriores, {
        tipo: 'iris',
        texto: data.resposta || data.erro || 'Não consegui executar essa ação.',
        href: res.ok ? data.href : undefined,
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
    <aside className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6" aria-label="Íris Copiloto de Carreira">
      {!aberto ? (
        <button
          type="button"
          aria-label="Abrir Íris Copiloto"
          aria-expanded={false}
          onClick={() => setAberto(true)}
          className="flex items-center gap-2 rounded-full border border-[#7b5c4c] bg-[#5B453E] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#45322c]"
        >
          <Sparkles size={20} aria-hidden="true" />
          <span>Íris Copiloto</span>
        </button>
      ) : (
        <div className="flex h-[min(660px,calc(100dvh-2rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#d8cec9] bg-white shadow-2xl" role="region" aria-label="Conversa com Íris Copiloto">
          <header className="flex shrink-0 items-center justify-between bg-[#5B453E] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot size={23} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Íris Copiloto</p>
                <p className="text-xs text-white/80">Assistente nativa da SOMA</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar conversa"
              className="rounded-full p-2 hover:bg-white/15"
            >
              <X size={19} />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfaf8] p-4" aria-live="polite" aria-relevant="additions">
            {mensagens.map((m, indice) => (
              <div key={indice} className={m.tipo === 'mentorado' ? 'ml-8' : 'mr-6'}>
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
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => void confirmar(indice, m.proposta as Proposta, m.token as string)}
                          className="rounded-full bg-[#5B453E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Confirmar e salvar
                        </button>
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => setMensagens(anteriores => anteriores.map((item, i) =>
                            i === indice ? { ...item, proposta: undefined, token: undefined } : item
                          ))}
                          className="rounded-full border border-[#cfc3bb] px-3 py-2 text-xs disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {ocupada && <p className="text-xs text-gray-600">Íris está preparando a resposta...</p>}
            <div ref={final} />
          </div>
          {mensagens.length === 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[#eee6df] px-3 py-2">
              {['Como está meu progresso?', 'Analisar uma vaga', 'Criar ação no PDI'].map(sugestao => (
                <button
                  key={sugestao}
                  type="button"
                  disabled={ocupada}
                  onClick={() => void enviar(sugestao)}
                  className="rounded-full border border-[#d9d0c9] px-2.5 py-1.5 text-xs text-[#5B453E] disabled:opacity-50"
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
              className="min-h-12 flex-1 resize-none rounded-xl border border-[#d9d0c9] bg-white px-3 py-2 text-sm text-[#312b27] outline-none focus:border-[#5B453E]"
            />
            <button
              type="submit"
              disabled={ocupada || !texto.trim()}
              aria-label="Enviar mensagem"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#5B453E] text-white disabled:opacity-40"
            >
              {ocupada ? <ChevronDown size={19} /> : <Send size={19} />}
            </button>
          </form>
          <p className="bg-white px-3 pb-2 text-center text-[10px] text-gray-500">
            Ações no PDI só são salvas após sua confirmação.
          </p>
        </div>
      )}
    </aside>
  );
}
