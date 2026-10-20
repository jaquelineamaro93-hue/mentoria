'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft,CheckCircle2,Loader2,ShieldAlert } from 'lucide-react';

type ModuleRow={
 slug:string;title:string;description:string|null;route_path:string;
 enabled:boolean;monthly_price:number|null;enforce_access:boolean;purchasable:boolean;
};

export default function GerenciarModulosClient({initialModules}:{initialModules:ModuleRow[]}){
 const [modules,setModules]=useState(initialModules);
 const [loading,setLoading]=useState<string|null>(null);
 const [result,setResult]=useState('');
 const [error,setError]=useState('');

 function update(slug:string,patch:Partial<ModuleRow>){
  setModules(prev=>prev.map(m=>m.slug===slug?{...m,...patch}:m));
 }
 async function save(m:ModuleRow){
  setError('');setResult('');
  if(m.purchasable&&(!m.enforce_access||m.monthly_price===null)){
   setError('Defina um preço e ative o controle de acesso antes de disponibilizar para compra.');
   return;
  }
  if(m.enforce_access&&!window.confirm('Atenção: ativar o controle de acesso bloqueará este módulo para usuários sem assinatura, trial ou Mentoria. Deseja continuar?'))return;
  setLoading(m.slug);
  try{
   const response=await fetch('/api/admin/modulos',{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     slug:m.slug,monthlyPrice:m.monthly_price,
     enforceAccess:m.enforce_access,purchasable:m.purchasable,
    }),
   });
   const json=await response.json();
   if(!response.ok)throw Error(json.error??'Não foi possível salvar.');
   update(m.slug,{monthly_price:json.module.monthly_price==null?null:Number(json.module.monthly_price),
    enforce_access:json.module.enforce_access,purchasable:json.module.purchasable});
   setResult('Configuração salva para '+m.title+'.');
  }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar.');}
  finally{setLoading(null);}
 }
 return <main className="mx-auto max-w-6xl px-4 py-8">
  <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-mint-deep">
   <ArrowLeft size={16}/> Voltar à administração
  </Link>
  <h1 className="mt-5 font-display text-3xl text-lotus-brown">Módulos & Assinaturas</h1>
  <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-text">
   Configure os módulos independentes. Os preços ficam no servidor, nunca no navegador.
   Os planos de Mentoria ativos continuam com acesso total, inclusive a futuros módulos.
  </p>
  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
   <ShieldAlert size={20} className="shrink-0 text-amber-800"/>
   <p className="text-sm leading-6 text-amber-950">
    A ativação é gradual. Primeiro informe o valor mensal, depois ative o controle de acesso
    e por último disponibilize a assinatura. Até ativar o controle, o módulo mantém o acesso
    existente na SOMA. Não habilite cobrança sem revisar a experiência do usuário.
   </p>
  </div>
  {result&&<p role="status" className="mt-4 flex items-center gap-2 text-sm text-mint-deep"><CheckCircle2 size={16}/>{result}</p>}
  {error&&<p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
  <div className="mt-6 grid gap-4 lg:grid-cols-2">
   {modules.map(m=><article key={m.slug} className="rounded-xl border border-gray-faint bg-white p-5">
    <div className="flex items-start justify-between gap-2">
      <h2 className="text-lg font-semibold text-lotus-brown">{m.title}</h2>
      <code className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-text">{m.slug}</code>
    </div>
    <p className="mt-2 text-xs leading-5 text-gray-text">{m.description}</p>
    <label className="mt-5 block text-sm font-medium text-black">
     Preço mensal (R$)
     <input type="number" min={5} max={10000} step="0.01" disabled={!!loading}
       value={m.monthly_price??''} onChange={e=>update(m.slug,{
         monthly_price:e.target.value===''?null:Number(e.target.value),
       })} placeholder="Definir preço antes de cobrar"
       className="mt-2 w-full rounded-lg border border-gray-faint bg-white px-3 py-2 text-sm"/>
    </label>
    <label className="mt-4 flex items-start gap-2 text-sm">
     <input type="checkbox" checked={m.enforce_access} disabled={!!loading}
      onChange={e=>update(m.slug,{enforce_access:e.target.checked,
        purchasable:e.target.checked?m.purchasable:false})}
      className="mt-1 accent-[#335e4a]"/>
     <span><strong>Proteger módulo</strong>
       <span className="block text-xs leading-5 text-gray-text">Apenas Mentoria, trial vigente ou assinantes deste módulo poderão acessar.</span>
     </span>
    </label>
    <label className="mt-3 flex items-start gap-2 text-sm">
     <input type="checkbox" checked={m.purchasable} disabled={!!loading||!m.enforce_access||m.monthly_price===null}
      onChange={e=>update(m.slug,{purchasable:e.target.checked})}
      className="mt-1 accent-[#335e4a]"/>
     <span><strong>Permitir assinatura</strong>
      <span className="block text-xs leading-5 text-gray-text">Exibe o checkout recorrente deste módulo no catálogo.</span>
     </span>
    </label>
    <div className="mt-5 flex items-center justify-between gap-3">
      <button onClick={()=>void save(m)} disabled={!!loading}
       className="inline-flex items-center gap-2 rounded-lg bg-brown-deep px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
       {loading===m.slug&&<Loader2 size={15} className="animate-spin"/>} Salvar módulo
      </button>
      <Link href="/modulos" className="text-xs text-mint-deep underline">Ver catálogo</Link>
    </div>
   </article>)}
  </div>
 </main>;
}
