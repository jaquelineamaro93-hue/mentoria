'use client';

import { useState } from 'react';
import { BASE_SAAS_CENTAVOS, CATALOGO_SAAS,
  calcularPrecoSaas, formatarReais, type PlanoSaas } from '@/lib/soma-saas-pricing';

const PLANOS: PlanoSaas[]=['avulso','essencial','pro'];
type Module={slug:string;title:string};

export default function SaasCheckoutControl({modulos,disponivel}:{
  modulos:Module[]; disponivel:boolean
}) {
  const [plano,setPlano]=useState<PlanoSaas>('essencial');
  const [modulo,setModulo]=useState(modulos[0]?.slug||'');
  const [iris,setIris]=useState(false);
  const [whatsapp,setWhatsapp]=useState(false);
  const [aceite,setAceite]=useState(false);
  const [ocupado,setOcupado]=useState(false);
  const [erro,setErro]=useState('');
  const total=calcularPrecoSaas(plano,{iris,whatsapp});

  async function contratar(){
    if(!aceite || ocupado || !disponivel) return;
    setOcupado(true);setErro('');
    try{
      const res=await fetch('/api/saas/checkout',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          plano,modulo:plano==='avulso'?modulo:null,iris,whatsapp,
          aceite:true,
        }),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Não foi possível preparar o pagamento.');
      if(typeof data.init_point!=='string')throw new Error('Link de pagamento não recebido.');
      const url=new URL(data.init_point);
      const host=url.hostname.toLowerCase();
      if(url.protocol!=='https:' || !(host==='mercadopago.com' ||
        host.endsWith('.mercadopago.com') ||
        host==='mercadopago.com.br' || host.endsWith('.mercadopago.com.br'))) {
        throw new Error('Link de pagamento inválido.');
      }
      window.location.assign(url.href);
    } catch(e) {
      setErro(e instanceof Error?e.message:'Não foi possível continuar.');
      setOcupado(false);
    }
  }
  return <section className="mt-6 rounded-2xl border border-[#d4e5dc] bg-white p-5" aria-labelledby="saas-contratar">
    <h2 id="saas-contratar" className="text-lg font-semibold text-[#244838]">Contratar SOMA Plataforma</h2>
    <p className="mt-2 text-sm leading-6 text-[#5b7567]">
      Escolha seus módulos e agentes. A cobrança da Plataforma é independente da mentoria.
    </p>
    <label htmlFor="checkout-saas-plano" className="mt-4 block text-sm font-semibold">Plano</label>
    <select id="checkout-saas-plano" value={plano} onChange={e=>setPlano(e.target.value as PlanoSaas)}
      className="mt-1 min-h-11 w-full rounded-lg border border-[#adcbbd] bg-white px-3">
      {PLANOS.map(id=><option key={id} value={id}>
        {CATALOGO_SAAS[id].nome} ({formatarReais(BASE_SAAS_CENTAVOS[id])}/mês)
      </option>)}
    </select>
    {plano==='avulso'&&<>
      <label htmlFor="checkout-saas-modulo" className="mt-3 block text-sm font-semibold">Módulo</label>
      <select id="checkout-saas-modulo" value={modulo} onChange={e=>setModulo(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-lg border border-[#adcbbd] bg-white px-3">
        {modulos.map(m=><option value={m.slug} key={m.slug}>{m.title}</option>)}
      </select>
    </>}
    <fieldset className="mt-4 space-y-3">
      <legend className="mb-2 text-sm font-semibold">Agentes opcionais</legend>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={iris} onChange={e=>setIris(e.target.checked)}/>
        Íris Copiloto (+ R$ 150/mês)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={whatsapp} onChange={e=>setWhatsapp(e.target.checked)}/>
        Agente WhatsApp (+ R$ 150/mês, ou R$ 250 pelos dois)
      </label>
    </fieldset>
    <p className="mt-4 text-xl font-bold text-[#18493a]" aria-live="polite">
      {formatarReais(total.total)} por mês
    </p>
    <p className="mt-1 text-xs leading-5 text-[#63796c]">
      O Kit Onboarding, quando escolhido, é uma compra avulsa e não entra na recorrência mensal.
    </p>
    <label className="mt-4 flex items-start gap-2 text-xs leading-5">
      <input type="checkbox" checked={aceite} onChange={e=>setAceite(e.target.checked)}
        className="mt-1"/>
      Concordo com as condições da assinatura recorrente e autorizo o encaminhamento seguro ao Mercado Pago.
    </label>
    {disponivel && <button type="button" onClick={contratar} disabled={!aceite||ocupado||(plano==='avulso'&&!modulo)}
      className="mt-4 min-h-11 rounded-xl bg-[#0D8071] px-5 text-sm font-semibold text-white disabled:opacity-50">
      {ocupado?'Abrindo Mercado Pago...':'Continuar no Mercado Pago'}
    </button>}
    {erro&&<p className="mt-3 text-sm text-red-700" role="alert">{erro}</p>}
  </section>;
}
