 'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { calcularPrecoSaas, CATALOGO_SAAS, formatarReais, type PlanoSaas } from '@/lib/soma-saas-pricing';
import type { SaasAccess } from '@/lib/saas-access';
type Module = {slug:string;title:string;route_path:string};
type Order = {id:string;plan_code:PlanoSaas;amount:number;status:string};
export default function PlataformaClient({modules,initialAccess}:{modules:Module[];initialAccess:SaasAccess}) {
 const query=useSearchParams(); const router=useRouter();
 const requested=query.get('plano');
 const [plan,setPlan]=useState<PlanoSaas>(requested==='avulso'||requested==='pro'?requested:'essencial');
 const [module,setModule]=useState(query.get('modulo')||modules[0]?.slug||'');
 const [iris,setIris]=useState(query.get('iris')==='1'); const [whatsapp,setWhatsapp]=useState(query.get('whatsapp')==='1');
 const [accepted,setAccepted]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const [access,setAccess]=useState(initialAccess); const [orders,setOrders]=useState<Order[]>([]);
 const total=calcularPrecoSaas(plan,{iris,whatsapp}).total;
 async function refresh() {
  const response=await fetch('/api/saas',{cache:'no-store'}); const result=await response.json();
  if(!response.ok) throw new Error(result.error||'Não foi possível atualizar seu acesso.');
  setAccess(result.access);setOrders(result.orders||[]);
 }
 useEffect(()=>{document.cookie='soma_saas_intent=; Path=/; Max-Age=0; SameSite=Lax'; void refresh().catch(e=>setError(e.message));},[]);
 async function act(action:string,orderId?:string) {
  setBusy(true);setError('');
  try {
   const response=await fetch('/api/saas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,plan,module,iris,whatsapp,accepted,orderId})});
   const result=await response.json();if(!response.ok) throw new Error(result.error);
   if(result.checkoutUrl){window.location.assign(result.checkoutUrl);return;}
   await refresh();router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}
 }
 const trialActive=!!access.trialEndsAt&&Date.parse(access.trialEndsAt)>Date.now();
 return <div className="mx-auto max-w-4xl space-y-7">
  <header><p className="text-sm text-mint-deep">SOMA Plataforma</p><h1 className="mt-2 text-3xl font-semibold">Seu plano, suas ferramentas</h1><p className="mt-3 text-gray-600">Escolha seus módulos de carreira. Acompanhamento humano é contratado nos planos SOMA Carreira.</p></header>
  {query.get('retorno')&&<p role="status" className="rounded-xl bg-amber-50 p-4">Estamos aguardando a confirmação do Mercado Pago. Seu acesso pago aparece após a aprovação. <button onClick={()=>void refresh().catch(e=>setError(e.message))} className="underline">Atualizar status</button></p>}
  {trialActive&&<p className="rounded-xl bg-emerald-50 p-4">Seu teste gratuito termina em {new Date(access.trialEndsAt!).toLocaleString('pt-BR')}. Depois dessa data, escolha uma assinatura para continuar.</p>}
  {!!access.modules.length&&access.saas&&<section><h2 className="text-xl font-semibold">Minhas ferramentas</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{modules.filter(m=>access.modules.includes(m.slug)).map(m=><Link key={m.slug} href={m.route_path} className="rounded-xl border p-4 text-mint-deep hover:bg-emerald-50">{m.title} →</Link>)}</div></section>}
  <section className="space-y-5 rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Montar assinatura</h2>
   <label className="block">Plano<select value={plan} onChange={e=>setPlan(e.target.value as PlanoSaas)} className="mt-2 block w-full rounded-lg border p-3">{(['avulso','essencial','pro'] as const).map(p=><option key={p} value={p}>{CATALOGO_SAAS[p].nome}</option>)}</select></label>
   {plan==='avulso'&&<label className="block">Ferramenta<select value={module} onChange={e=>setModule(e.target.value)} className="mt-2 block w-full rounded-lg border p-3">{modules.map(m=><option key={m.slug} value={m.slug}>{m.title}</option>)}</select></label>}
   <p className="text-sm text-gray-600">{CATALOGO_SAAS[plan].itens.join(' · ')}</p>
   <label className="flex gap-3"><input type="checkbox" checked={iris} onChange={e=>setIris(e.target.checked)}/>Adicionar Íris Copiloto, R$ 150,00/mês</label>
   <label className="flex gap-3"><input type="checkbox" checked={whatsapp} onChange={e=>setWhatsapp(e.target.checked)}/>Adicionar agente no WhatsApp, R$ 150,00/mês</label>
   <p className="text-sm text-gray-600">Os dois agentes juntos custam R$ 250,00/mês. Uso sujeito aos limites da plataforma e, no WhatsApp, ao consentimento de contato.</p>
   <p className="text-3xl font-semibold">{formatarReais(total)}<span className="text-base font-normal">/mês</span></p>
   <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6"><strong>7 dias grátis, sem cartão.</strong> O teste vale uma vez por conta e libera somente os módulos e agentes escolhidos. O teste não gera cobrança automática. Ao assinar durante o teste, a recorrência começa após o término dele. Assinatura mensal até cancelar em Minhas assinaturas. O cancelamento encerra o acesso pago. Kit Onboarding e mentoria são compras separadas.</div>
   <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1"/><span>Li e aceito as condições acima e os <Link href="/termos" className="underline">termos de uso</Link>.</span></label>
   {error&&<p role="alert" className="text-red-700">{error}</p>}
   <div className="flex flex-wrap gap-3">{!access.trialEndsAt&&<button disabled={busy||!accepted} onClick={()=>void act('trial')} className="rounded-xl bg-mint-deep px-5 py-3 font-semibold text-white disabled:opacity-50">Experimentar 7 dias grátis</button>}
   <button disabled={busy||!accepted} onClick={()=>void act('checkout')} className="rounded-xl border border-mint-deep px-5 py-3 text-mint-deep disabled:opacity-50">{busy?'Aguarde…':'Assinar com Mercado Pago'}</button></div>
  </section>
  {!!orders.length&&<section className="space-y-3"><h2 className="text-xl font-semibold">Minhas assinaturas</h2>{orders.map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><span>{CATALOGO_SAAS[o.plan_code]?.nome} · {formatarReais(Math.round(Number(o.amount)*100))}/mês · {({PENDING:'Aguardando checkout',AUTHORIZED:'Aguardando pagamento',ACTIVE:'Ativa',PAST_DUE:'Pagamento pendente',CANCELED:'Cancelada',EXPIRED:'Encerrada'} as Record<string,string>)[o.status]||o.status}</span>{['PENDING','AUTHORIZED'].includes(o.status)&&<button disabled={busy} onClick={()=>void act('resume',o.id)} className="text-sm text-mint-deep underline">Continuar pagamento</button>}{!['CANCELED','EXPIRED'].includes(o.status)&&<button disabled={busy} onClick={()=>{if(window.confirm('Cancelar a recorrência e encerrar o acesso pago desta assinatura?'))void act('cancel',o.id);}} className="text-sm text-red-700 underline">Cancelar assinatura</button>}</div>)}</section>}
 </div>;
}
