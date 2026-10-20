'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Loader2, Layers3 } from 'lucide-react';
import { ModuleAccessBadge,type ModuleCardStatus } from '@/components/modules/ModuleAccessBadge';

interface ModuleItem {
 slug:string;title:string;description:string|null;route_path:string;
 monthly_price:number|null;enforce_access:boolean;purchasable:boolean;
 status:ModuleCardStatus;subscriptionId?:string|null;
}
function formatPrice(price:number){
 return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(price);
}
export default function ModuleCatalogClient({modules,authenticated}:{
 modules:ModuleItem[];authenticated:boolean;
}){
 const [working,setWorking]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [acceptedTerms,setAcceptedTerms]=useState(false);
 async function subscribe(slug:string){
  if(!authenticated){window.location.assign('/login');return;}
  if(!acceptedTerms){
   setError('Leia e aceite as condições da assinatura mensal antes de prosseguir.');
   return;
  }
  setWorking(slug);setError(null);
  try{
   const response=await fetch('/api/modulos/assinar',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({slug,acceptTerms:true}),
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error??'Não foi possível abrir o pagamento.');
   const link=new URL(data.init_point);
   if(link.protocol!=='https:' || !['mercadopago.com','mercadopago.com.br'].some(host=>
      link.hostname===host||link.hostname.endsWith('.'+host)))
      throw Error('Endereço de pagamento não reconhecido.');
   window.location.assign(link.toString());
  }catch(e){
   setError(e instanceof Error?e.message:'Falha ao iniciar assinatura.');
   setWorking(null);
  }
 }
 async function cancel(subscriptionId:string,slug:string){
  if(!window.confirm('Cancelar esta assinatura modular? O acesso a este módulo será revogado. Outros módulos e o plano da Mentoria não serão afetados.'))return;
  setWorking(slug);setError(null);
  try{
   const response=await fetch('/api/modulos/cancelar',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({subscriptionId}),
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error??'Não foi possível cancelar.');
   window.location.reload();
  }catch(e){
   setError(e instanceof Error?e.message:'Falha ao cancelar a assinatura.');
   setWorking(null);
  }
 }
 return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
  <header className="mb-8">
   <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mint-deep">SOMA · Biblioteca de módulos</p>
   <h1 className="font-display text-3xl text-lotus-brown sm:text-4xl">Construa sua jornada, no seu ritmo</h1>
   <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-text">
    Escolha somente as ferramentas de que você precisa. Cada módulo tem assinatura independente.
    Quem participa da Mentoria SOMA recebe automaticamente acesso completo aos módulos atuais e futuros.
   </p>
   <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
    <Link href="/planos" className="text-mint-deep underline underline-offset-4">Conhecer a Mentoria completa</Link>
    {!authenticated&&<Link href="/login" className="text-mint-deep underline underline-offset-4">Já tenho conta · Entrar</Link>}
    {authenticated&&<Link href="/dashboard" className="text-mint-deep underline underline-offset-4">Minha SOMA</Link>}
   </div>
  </header>
  {error&&<p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  <div className="mb-6 rounded-xl border border-gray-faint bg-white p-4">
    <label className="flex items-start gap-3 text-sm leading-6 text-black">
      <input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)}
       className="mt-1.5 h-4 w-4 accent-[#315a48]"/>
      <span>Li e aceito as <Link href="/modulos/condicoes" target="_blank"
       className="font-medium text-mint-deep underline underline-offset-4">
        condições da assinatura modular
       </Link>, incluindo cobrança mensal recorrente pelo Mercado Pago, renovação
       enquanto a assinatura estiver ativa e possibilidade de cancelamento individual.
       Esta confirmação é exigida apenas para iniciar uma nova assinatura paga.</span>
    </label>
  </div>
  <section aria-label="Módulos disponíveis" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   {modules.map(m=><article key={m.slug} className="flex flex-col rounded-2xl border border-gray-faint bg-white p-5">
     <div className="flex items-start justify-between gap-3">
      <Layers3 size={22} className="text-mint-deep" aria-hidden="true"/>
      <ModuleAccessBadge status={m.status}/>
     </div>
     <h2 className="mt-4 text-lg font-semibold text-lotus-brown">{m.title}</h2>
     <p className="mt-2 flex-1 text-sm leading-6 text-gray-text">{m.description}</p>
     <div className="mt-5 border-t border-gray-faint pt-4">
      {m.purchasable&&m.monthly_price!==null&&m.status!=='mentor'&&m.status!=='owned'&&m.status!=='trial'&&
       <p className="mb-3 text-lg font-semibold text-lotus-brown">
        {formatPrice(m.monthly_price)}<span className="text-xs font-normal text-gray-text"> / mês</span>
       </p>}
      {['mentor','owned','trial','legacy'].includes(m.status)
        ?<Link href={m.route_path} className="inline-flex items-center gap-2 rounded-lg bg-brown-deep px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
           {m.status==='legacy'?'Conhecer módulo':'Acessar'}<ArrowRight size={16}/>
         </Link>
        :m.status==='pending'
        ?<div className="flex flex-col gap-2">
          <p className="text-xs leading-5 text-gray-text">Há uma assinatura deste módulo aguardando confirmação ou regularização.</p>
          {m.subscriptionId&&<button disabled={!!working} onClick={()=>void cancel(m.subscriptionId!,m.slug)}
           className="self-start text-sm font-medium text-red-800 underline disabled:opacity-50">
            Cancelar assinatura anterior
           </button>}
         </div>
        :m.purchasable&&m.monthly_price!==null
        ?<button disabled={working!==null} onClick={()=>void subscribe(m.slug)}
          className="inline-flex items-center gap-2 rounded-lg bg-brown-deep px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {working===m.slug?<Loader2 size={16} className="animate-spin"/>:<ExternalLink size={16}/>}
          Assinar este módulo
         </button>
        :<span className="text-xs text-gray-text">Assinatura disponível em breve</span>}
      {m.status==='owned'&&m.subscriptionId&&<button onClick={()=>void cancel(m.subscriptionId!,m.slug)}
        disabled={working!==null} className="mt-3 block text-xs text-gray-text underline disabled:opacity-50">
          Cancelar assinatura deste módulo
        </button>}
     </div>
    </article>)}
  </section>
  <p className="mt-8 max-w-4xl text-xs leading-5 text-gray-text">
   Os pagamentos são feitos no Mercado Pago. O acesso é ativado apenas após confirmação do pagamento,
   e a suspensão de um módulo não altera os outros. A Mentoria inclui acompanhamento e benefícios
   próprios, além de acesso às ferramentas.
  </p>
 </main>;
}
