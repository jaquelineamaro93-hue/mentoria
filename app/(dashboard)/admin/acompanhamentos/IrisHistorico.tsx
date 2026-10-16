'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, PauseCircle, PlayCircle, History, Bot } from 'lucide-react';
import TopSendImportador from './TopSendImportador';

type Mensagem={id:string;tipo:'recebida'|'enviada'|'acionada';texto:string;data:string;status?:string;origem?:'whatsapp_business_importado'|'topsend_importado'|'meta_cloud_api'|'topsend_automacao'|'topsend_retorno'};
type Passo={id:string;acao:string;insight:string|null;situacao:string;criado_em:string};
type Turno={id:string;status:string;criado_em:string;erro_resumido:string|null;origem_id?:string;resposta_gerada?:string|null;insight?:string|null;proximo_passo?:string|null};
type Historico={
  consentimentoIA:boolean;contatoAutorizado:boolean;canalPronto:boolean;automacaoAtiva:boolean;
  topsendPronto:boolean;topsendRetornoPronto:boolean;
  topsendDespachos:{id:string;turno_id:string;status:string;criado_em:string}[];
  estado:{pausado:boolean;proximo_passo:string|null;ultimo_envio_em:string|null}|null;
  mensagens:Mensagem[];passos:Passo[];turnos:Turno[];
};

export default function IrisHistorico({userId,nome,whatsappNumero}:{userId:string;nome:string;whatsappNumero?:string|null}) {
  const [aberto,setAberto]=useState(false);
  const [dados,setDados]=useState<Historico|null>(null);
  const [carregando,setCarregando]=useState(false);
  const [erro,setErro]=useState('');
  const [copiado,setCopiado]=useState<string|null>(null);
  const [disparando,setDisparando]=useState<string|null>(null);
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
  async function dispararTopSend(turnoId:string) {
    if(!dados?.topsendPronto)return;
    const confirmado=window.confirm('Acionar agora a automação TopSend para esta mensagem? A entrega ainda dependerá da TopSend.');
    if(!confirmado)return;
    setDisparando(turnoId);setErro('');
    try {
      const response=await fetch('/api/admin/topsend/disparar',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({turnoId,userId}),
      });
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||'Não foi possível acionar a TopSend.');
      await carregar();
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao disparar');}
    finally{setDisparando(null);}
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
          {dados.topsendPronto&&!dados.topsendRetornoPronto&&
            <p className="w-full text-xs text-amber-800">TopSend envia pelo gatilho, mas o retorno de mensagens ainda exige configurar o webhook de entrada da SOMA.</p>}
          {dados.consentimentoIA&&<button type="button" disabled={carregando} onClick={alternarPausa}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-faint px-3 py-2 disabled:opacity-50">
            {dados.estado?.pausado?<PlayCircle size={14}/>:<PauseCircle size={14}/>}
            {dados.estado?.pausado?'Retomar acompanhamento':'Pausar acompanhamento'}
          </button>}
        </div>
        <TopSendImportador userId={userId} nome={nome} onImported={carregar}/>
        {dados.turnos.some(t=>t.origem_id?.startsWith('manual-rascunho-iris-')&&t.resposta_gerada)&&
          <div>
            <p className="mb-2 text-sm font-semibold text-black">Próxima mensagem para enviar</p>
            <div className="space-y-3">
              {dados.turnos.filter(t=>t.origem_id?.startsWith('manual-rascunho-iris-')&&t.resposta_gerada).map(t=>
                <div key={t.id} className="rounded-lg border border-gray-faint bg-white p-3">
                  <p className="mb-2 text-xs text-gray-text">Rascunho preparado a partir da conversa importada. Ainda não enviado.</p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-black">{t.resposta_gerada}</p>
                  <button type="button" onClick={()=>{
                    if(!t.resposta_gerada)return;
                    navigator.clipboard.writeText(t.resposta_gerada).then(()=>setCopiado(t.id)).catch(()=>setErro('Não foi possível copiar a mensagem.'));
                  }} className="mt-3 rounded-lg border border-gray-faint px-3 py-2 text-xs text-black">
                    {copiado===t.id?'Mensagem copiada':'Copiar mensagem'}
                  </button>
                  {dados.topsendPronto && !dados.topsendDespachos.some(d=>d.turno_id===t.id) &&
                    <button type="button" disabled={disparando===t.id||carregando}
                      onClick={()=>void dispararTopSend(t.id)}
                      className="ml-2 mt-3 rounded-lg bg-black px-3 py-2 text-xs text-white disabled:opacity-50">
                      {disparando===t.id?'Acionando...':'Enviar pela TopSend'}
                    </button>}
                  {dados.topsendDespachos.filter(d=>d.turno_id===t.id).map(d=>
                    <p key={d.id} className="mt-2 text-xs text-gray-text">TopSend: {d.status==='acionado'?'Gatilho acionado, aguardando confirmação de entrega':d.status==='incerto'?'Resultado incerto, conferir no painel TopSend':'Disparo reservado'}</p>
                  )}
                  {whatsappNumero && /^55[1-9][0-9]{9,10}$/.test(whatsappNumero) && t.resposta_gerada &&
                    <a href={'https://wa.me/'+whatsappNumero+'?text='+encodeURIComponent(t.resposta_gerada)}
                      target="_blank" rel="noopener noreferrer"
                      className="ml-3 inline-flex items-center text-xs text-gray-text underline underline-offset-2">
                      Abrir no WhatsApp
                    </a>}
                </div>
              )}
            </div>
          </div>}
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
              <p className="text-[11px] font-medium text-gray-text">{m.origem==='whatsapp_business_importado'
                ? (m.tipo==='recebida'?'Mentorado (WhatsApp Business)':'Lume (WhatsApp Business)')
                : m.origem==='topsend_importado'
                    ? (m.tipo==='recebida'?'Mentorado (TopSend, importado)':'Íris (TopSend, importado)')
                : m.origem==='topsend_retorno'?'Mentorado (TopSend)'
                : m.origem==='topsend_automacao'?'TopSend (automação acionada)'
                : (m.tipo==='recebida'?'Mentorado':'Íris (WhatsApp)')} · {horario(m.data)}
                {['whatsapp_business_importado','topsend_importado'].includes(m.origem??'')?' · histórico importado manualmente':''}
                {m.status?' · '+m.status:''}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-black">{m.texto}</p>
            </div>)}
          </div>}
        </div>
        {dados.turnos.some(t=>t.status==='revisao'&&!t.origem_id?.startsWith('manual-rascunho-iris-'))&&
          <p className="text-xs text-amber-800">Existe um turno que precisa de revisão humana. Não foi reenviado automaticamente.</p>}
      </>}
    </div>}
  </div>;
}
