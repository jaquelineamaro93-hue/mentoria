'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { calcularRecuperacaoSaas, CATALOGO_SAAS, formatarReais, type PlanoSaas } from '@/lib/soma-saas-pricing';
export type RecoverySource = { id: string; plan_code: PlanoSaas; iris: boolean; whatsapp: boolean };
export type RecoveryOffer = { expires_at: string; accepted_at: string | null; source_order_id: string; order_id: string | null };
export default function SaasRecoveryDialog({ source, offer, serverOffset, busy, error, onClose, onPrice, onAccept }:{
 source: RecoverySource; offer: RecoveryOffer | null; serverOffset: number; busy: boolean; error: string;
 onClose:()=>void; onPrice:()=>void; onAccept:()=>void;
}) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [now, setNow] = useState(Date.now());
 const [accepted, setAccepted] = useState(false);
 useEffect(()=>{ dialog.current?.showModal(); const timer=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(timer); },[]);
 const remaining=offer ? Math.max(0,Math.ceil((Date.parse(offer.expires_at)-now-serverOffset)/1000)) : 0;
 const price=calcularRecuperacaoSaas(source.plan_code,source);
 return <dialog ref={dialog} aria-labelledby="recovery-title" onCancel={onClose} onClose={onClose} className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl bg-emerald-50 p-6 text-black backdrop:bg-black/40 sm:inset-auto sm:bottom-6 sm:left-1/2 sm:w-[34rem] sm:-translate-x-1/2 sm:rounded-2xl">
  <div className="mx-auto max-w-lg space-y-4">
   <button type="button" disabled={busy} onClick={onClose} aria-label="Fechar" className="float-right rounded-lg px-3 py-1 text-black">✕</button>
   {!offer ? <>
    <h2 id="recovery-title" className="pr-10 text-xl font-semibold">O que fez você desistir?</h2>
    <p className="text-sm">Você pode continuar depois. Seu histórico fica guardado.</p>
    <button disabled={busy} onClick={onPrice} className="block w-full rounded-xl border border-emerald-700 bg-white p-3 text-left">Achei caro</button>
    <button disabled={busy} onClick={onClose} className="block w-full rounded-xl border bg-white p-3 text-left">Preciso de mais tempo</button>
    <button disabled={busy} onClick={onClose} className="block w-full rounded-xl border bg-white p-3 text-left">Tive uma dificuldade no pagamento</button>
    <p className="text-xs">Ao escolher “Achei caro”, o checkout pendente será cancelado para preparar uma nova contratação. Nenhuma cobrança será feita sem sua autorização.</p>
   </> : <>
    <h2 id="recovery-title" className="pr-10 text-xl font-semibold">Um incentivo para continuar</h2>
    <p>{CATALOGO_SAAS[source.plan_code].nome}: <strong>{formatarReais(price.primeira)} no primeiro mês</strong>. Depois, {formatarReais(price.recorrente)}/mês até cancelar.</p>
    <p className="text-sm">O desconto vale só para o software. Os agentes escolhidos mantêm seu preço. Não há novo período grátis.</p>
    <p role="timer">{offer.accepted_at ? 'Oferta confirmada. Continue no Mercado Pago.' : remaining>0 ? `Confirme em ${Math.floor(remaining/60).toString().padStart(2,'0')}:${(remaining%60).toString().padStart(2,'0')}` : 'O prazo desta oferta terminou.'}</p>
    <p className="text-xs">Oferta única por conta. O prazo para confirmar não reinicia ao fechar ou atualizar esta página. Após confirmar dentro do prazo, conclua a autorização no Mercado Pago.</p>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1"/><span>Aceito a primeira mensalidade de {formatarReais(price.primeira)}, as seguintes de {formatarReais(price.recorrente)} e os <Link href="/termos" className="underline">termos de uso</Link>.</span></label>
    <button disabled={busy||!accepted||(!offer.accepted_at&&remaining===0)} onClick={onAccept} className="w-full rounded-xl bg-emerald-200 p-3 font-semibold text-black disabled:opacity-50">{busy?'Aguarde…':'Confirmar e continuar no Mercado Pago'}</button>
   </>}
   {error&&<p role="alert" className="text-red-800">{error}</p>}
  </div>
 </dialog>;
}
