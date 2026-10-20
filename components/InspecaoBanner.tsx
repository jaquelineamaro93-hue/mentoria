'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

export default function InspecaoBanner(){
  const [ativo,setAtivo]=useState(false);
  const [saindo,setSaindo]=useState(false);
  const [erro,setErro]=useState('');

  useEffect(()=>{
    let mounted=true;
    fetch('/api/inspecao/status',{cache:'no-store',credentials:'same-origin'})
      .then(r=>r.ok?r.json():{ativo:false})
      .then(r=>{if(mounted)setAtivo(!!r.ativo);})
      .catch(()=>{if(mounted)setAtivo(false);});
    return ()=>{mounted=false;};
  },[]);

  async function voltar(){
    if(saindo)return;
    setErro('');
    setSaindo(true);
    try{
      const resposta=await fetch('/api/inspecao/voltar',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:'{}',
      });
      const data=await resposta.json();
      if(!resposta.ok||!data.ok)throw Error(data.error??'Não foi possível restaurar sua conta.');
      // Força reload real das credenciais da sessão restaurada no servidor.
      window.location.replace('/admin');
    }catch(e){
      setErro(e instanceof Error?e.message:'Falha ao voltar ao backoffice.');
      setSaindo(false);
    }
  }

  if(!ativo)return null;
  return <div role="status" className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-2">
      <ShieldCheck size={19} className="mt-0.5 shrink-0" aria-hidden="true"/>
      <div>
        <p className="text-sm font-semibold">Modo de inspeção administrativa</p>
        <p className="text-xs leading-5">Você está navegando em outra conta. Mudanças podem afetar os dados dessa conta.</p>
      </div>
    </div>
    <button type="button" disabled={saindo} onClick={()=>void voltar()}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#253D35] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
      {saindo?<Loader2 size={16} className="animate-spin"/>:<ArrowLeft size={16}/>}
      Voltar ao backoffice
    </button>
    {erro && <p role="alert" className="text-xs text-red-800 sm:basis-full">{erro}</p>}
  </div>;
}
