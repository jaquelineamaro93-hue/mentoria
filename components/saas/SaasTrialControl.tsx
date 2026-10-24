'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanoSaasCodigo } from '@/lib/soma-saas-entitlements';

const escolhas = [
  { code:'avulso',label:'Módulo avulso' },
  { code:'essencial',label:'SOMA Essencial' },
  { code:'pro',label:'SOMA Pro' },
] as const;

export default function SaasTrialControl({
  modulos, liberado
}: { modulos: { slug:string; title:string }[]; liberado:boolean }) {
  const router = useRouter();
  const [plano, setPlano] = useState<PlanoSaasCodigo>('essencial');
  const [modulo, setModulo] = useState(modulos[0]?.slug || '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  if (!liberado) return null;

  async function iniciar() {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch('/api/saas/trial/start', {
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ plano, modulo:plano==='avulso'?modulo:null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o teste.');
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error?err.message:'Não foi possível iniciar o teste.');
    } finally {
      setCarregando(false);
    }
  }
  return <section aria-labelledby="saas-trial-titulo" className="mt-5 rounded-xl border border-[#cfe3d5] bg-white p-5">
    <h2 id="saas-trial-titulo" className="text-lg font-semibold text-[#1c4336]">Experimente por 7 dias</h2>
    <p className="mt-1 text-sm leading-6 text-[#5c7064]">
      Teste os módulos do plano selecionado sem contratar a mentoria com encontros.
      O teste não inicia cobrança automática.
    </p>
    <label htmlFor="soma-trial-plano" className="mt-4 block text-sm font-semibold">Plano para testar</label>
    <select id="soma-trial-plano" value={plano} onChange={e=>setPlano(e.target.value as PlanoSaasCodigo)}
      className="mt-1 min-h-11 w-full rounded-lg border border-[#aacabd] bg-white px-3">
      {escolhas.map(p=><option key={p.code} value={p.code}>{p.label}</option>)}
    </select>
    {plano==='avulso' && <><label htmlFor="soma-trial-modulo" className="mt-3 block text-sm font-semibold">Módulo</label>
      <select id="soma-trial-modulo" value={modulo} onChange={e=>setModulo(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-lg border border-[#aacabd] bg-white px-3">
        {modulos.map(m=><option key={m.slug} value={m.slug}>{m.title}</option>)}
      </select></>}
    <button type="button" onClick={iniciar} disabled={carregando||(plano==='avulso'&&!modulo)}
      className="mt-4 min-h-11 rounded-xl bg-[#0D8071] px-5 py-2 font-semibold text-white disabled:opacity-50">
      {carregando?'Iniciando teste...':'Começar meus 7 dias gratuitos'}
    </button>
    {erro && <p role="alert" className="mt-2 text-sm text-red-700">{erro}</p>}
  </section>;
}
