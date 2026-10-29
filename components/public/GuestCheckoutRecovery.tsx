'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

type Props = {
  product: 'plataforma' | 'carreira';
  planCode: string;
  moduleSlug?: string;
  iris?: boolean;
  whatsapp?: boolean;
  autoPrompt?: boolean;
  label?: string;
};

/** Recovery only for new prospects. No price or payment contract is changed here. */
export default function GuestCheckoutRecovery({ product, planCode, moduleSlug, iris = false, whatsapp = false, autoPrompt = false, label = 'Guardar minha escolha' }: Props) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    if (!autoPrompt || !planCode || !window.matchMedia('(min-width: 768px)').matches) return;
    const marker = 'soma_checkout_exit_seen';
    const onExit = (event: MouseEvent) => {
      if (event.clientY > 0 || dialog.current?.open || busy) return;
      try {
        if (sessionStorage.getItem(marker)) return;
        sessionStorage.setItem(marker, '1');
      } catch { /* Browser may block session storage; dialog still works. */ }
      setOpen(true);
    };
    document.addEventListener('mouseout', onExit);
    return () => document.removeEventListener('mouseout', onExit);
  }, [autoPrompt, planCode, busy]);

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !ready || !siteKey || !widgetContainer.current || !window.turnstile) return;
    const widget = window.turnstile.render(widgetContainer.current, {
      sitekey: siteKey,
      theme: 'light',
      callback: (next: string) => setToken(next),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    });
    return () => { if (window.turnstile && widget) window.turnstile.remove(widget); setToken(''); };
  }, [open, ready, siteKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || !token || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/checkout-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ product, planCode, moduleSlug, iris, whatsapp, email, consent, turnstileToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível registrar seu pedido.');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar seu pedido.');
      setToken('');
      if (widgetContainer.current && window.turnstile) {
        // Close/reopen creates a fresh Turnstile challenge after a failed submission.
        setReady(false);
        setTimeout(() => setReady(true), 0);
      }
    } finally { setBusy(false); }
  }

  return <>
    <button type="button" onClick={() => { setSuccess(false); setError(''); setOpen(true); }}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#779b8e] px-4 py-2 text-sm font-medium text-[#8FD3BE] hover:bg-[#234139] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FD3BE]">
      {label}
    </button>
    {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />}
    <dialog ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
      aria-labelledby="soma-recovery-title"
      className="fixed inset-0 m-auto w-[min(92vw,460px)] max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#bdd9cd] bg-[#f7faf8] p-0 text-[#12231d] shadow-2xl backdrop:bg-black/65">
      <div className="p-5 sm:p-7">
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="float-right rounded-lg p-2 text-[#365b4d] hover:bg-[#e4eee8]">Fechar</button>
        {success ? <>
          <h2 id="soma-recovery-title" className="pr-14 text-2xl font-semibold">Seu plano está guardado</h2>
          <p className="mt-3 text-sm leading-6">Enviamos um e-mail para você retomar de onde parou. Confira também a pasta de spam.</p>
          <button onClick={() => setOpen(false)} className="mt-5 rounded-full bg-[#89cfb7] px-6 py-3 font-semibold">Continuar navegando</button>
        </> : <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-[#287965]">Antes de deixar para depois</p>
          <h2 id="soma-recovery-title" className="pr-14 text-2xl font-semibold">Quer guardar sua escolha?</h2>
          <p className="mt-3 text-sm leading-6">
            {product === 'plataforma'
              ? 'Receba o link para retomar sua SOMA Plataforma. Podemos analisar uma condição especial de 10% na primeira mensalidade, mediante confirmação da equipe.'
              : 'Receba o link do plano SOMA Carreira que você escolheu. A equipe pode ajudar com dúvidas de pagamento e modalidades.'}
          </p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">Seu e-mail
              <input type="email" required autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)}
                placeholder="voce@email.com" className="mt-2 block min-h-11 w-full rounded-xl border border-[#aec9bc] bg-white px-3 text-[#12231d] focus-visible:outline-2 focus-visible:outline-[#287965]" />
            </label>
            <label className="flex items-start gap-3 text-xs leading-5">
              <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#287965]"/>
              <span>Autorizo a SOMA a enviar por e-mail o link para retomar esta contratação e uma comunicação relacionada a esta escolha. Posso cancelar esse contato pelo link na mensagem.</span>
            </label>
            {siteKey ? <div ref={widgetContainer} className="min-h-[66px]"/> : <p className="text-xs text-red-800">A verificação de segurança não está disponível.</p>}
            {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
            <button disabled={busy || !consent || !token || !email.includes('@')} type="submit"
              className="min-h-12 w-full rounded-full bg-[#8FD3BE] px-4 py-3 font-semibold text-[#10221c] disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Enviando...' : 'Receber meu link por e-mail'}
            </button>
            <p className="text-xs leading-5 text-[#526b61]">Nenhuma cobrança é criada aqui. Qualquer preço especial depende de confirmação antes do pagamento.</p>
          </form>
        </>}
      </div>
    </dialog>
  </>;
}
