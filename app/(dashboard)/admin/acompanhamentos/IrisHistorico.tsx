'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, PauseCircle, PlayCircle, History, Bot } from 'lucide-react';

type Mensagem={id:string;tipo:'recebida'|'enviada';texto:string;data:string;status?:string};
type Passo={id:string;acao:string;insight:string|null;situacao:string;criado_em:string};
type Turno={id:string;status:string;criado_em:string;erro_resumido:string|null};
type Historico={
  consentimentoIA:boolean;contatoAutorizado:boolean;canalPronto:boolean;automacaoAtiva:boolean;
  estado:{pausado:boolean;proximo_passo:string|null;ultimo_envio_em:string|null}|null;
  mensagens:Mensagem[];passos:Passo[];turnos:Turno[];
};

export default function IrisHistorico({userId}:{userId:string}) {
  const [aberto,setAberto]=useState(false);
  const [dados,setDados]=useState<Historico|null>(null);
  const [carregando,setCarregando]=useState(false);
  const [erro,setErro]=useState('');
  const horario=(valor:string)=>new Date(valor).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  async function carregar() {
    setCarregando(true);setErro('');
    try{
      const resp=await fetch('/api/admin/iris/historico?userId='+encodeURIComponent(userId),{cache:'no-store'});
      const json=await resp.json();
      if(!resp.ok)throw new Error(json.error||'Falha ao consultar histórico');
      setDados(json);
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao carregar histórico');}
    finally{setCarregando(false);}
  }
  async function alternarPausa() {
    if(!dados)return;
    setCarregando(true);setErro('');
    try{
      const resp=await fetch('/api/admin/iris/historico',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,paused:!dados.estado?.pausado})});
      const body=await resp.json();
      if(!resp.ok)throw new Error(body.error||'Não foi possível alterar o status');
      await carregar();
    }catch(e){setErro(e instanceof Error?e.message:'Erro ao salvar');}
    finally{setCarregando(false);}
  }
  return <div className="mt-4 border-t border-gray-faint pt-3">
    <button type="button" onClick={()=>{setAberto(v=>!v);if(!aberto)void carregar();}}
      className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black">
      <History size={15}/>{aberto?'Ocultar histórico da Íris':'Histórico e próximos passos da Íris'}
      {aberto?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
    </button>
    {aberto&&<div className="mt-3 space-y-4">
      {carregando&&<p className="inline-flex items-center gap-2 text-xs text-gray-text"><Loader2 size={14} className="animate-spin"/> Atualizando...</p>}
      {erro&&<p role="alert" className="text-sm text-red-700">{erro}</p>}
      {dados&&<>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-text">
          <span className="inline-flex items-center gap-1"><Bot size={14}/>
            {!dados.consentimentoIA?'IA não autorizada pela pessoa':!dados.canalPronto?'Canal oficial de WhatsApp pendente':!dados.automacaoAtiva?'Automação desativada':dados.estado?.pausado?'Automação pausada':'Automação liberada'}
          </span>
          {dados.consentimentoIA&&<button type="button" disabled={carregando} onClick={alternarPausa}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-faint px-3 py-2 disabled:opacity-50">
            {dados.estado?.pausado?<PlayCircle size={14}/>:<PauseCircle size={14}/>}
            {dados.estado?.pausado?'Retomar acompanhamento':'Pausar acompanhamento'}
          </button>}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-black">Próximos passos registrados</p>
          {!dados.passos.length?<p className="text-xs text-gray-text">Nenhum próximo passo gerado pela Íris ainda.</p>:
          <div className="space-y-2">{dados.passos.slice(0,5).map(p=><div key={p.id} className="rounded-lg border border-gray-faint p-3 text-sm">
            <p className="font-medium text-black">{p.acao}</p>
            {p.insight&&<p className="mt-1 text-xs text-gray-text">{p.insight}</p>}
            <p className="mt-1 text-[11px] text-gray-text">{horario(p.criado_em)} · {p.situacao}</p>
          </div>)}</div>}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-black">Conversa no WhatsApp</p>
          {!dados.mensagens.length?<p className="text-xs text-gray-text">Nenhuma interação vinculada ao histórico.</p>:
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3">
            {dados.mensagens.slice(0,25).map(m=><div key={m.id} className="rounded-lg border border-gray-faint bg-white p-3">
              <p className="text-[11px] font-medium text-gray-text">{m.tipo==='recebida'?'Mentorado':'Íris (WhatsApp)'} · {horario(m.data)}{m.status?' · '+m.status:''}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-black">{m.texto}</p>
            </div>)}
          </div>}
        </div>
        {dados.turnos.some(t=>t.status==='revisao')&&
          <p className="text-xs text-amber-800">Existe um turno que precisa de revisão humana. Não foi reenviado automaticamente.</p>}
      </>}
    </div>}
  </div>;
}
