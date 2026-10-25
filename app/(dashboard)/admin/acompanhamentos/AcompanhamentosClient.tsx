'use client';
import { useState } from 'react';
import Link from 'next/link';
import CueConnection from './CueConnection';
import IrisHistorico from './IrisHistorico';

type Mentorado = {id:string;nome:string;email:string;genero:string|null;whatsapp_numero:string|null;whatsapp_consentimento_em:string|null;whatsapp_validado_em:string|null;trial_status:string|null;last_activity_at:string|null;onboarding_concluido:boolean};
type Registro = {id:string;user_id:string;semana_inicio:string;objetivo:string|null;progresso:string|null;insight:string|null;proxima_acao:string|null;mensagem_whatsapp:string|null;status:string};
export default function AcompanhamentosClient({mentorados,registros:iniciais}:{mentorados:Mentorado[];registros:Registro[]}) {
 const [busca,setBusca]=useState('');
 const [filtro,setFiltro]=useState('todos');
 const [registros,setRegistros]=useState(iniciais);
 const [numeros,setNumeros]=useState<Record<string,string>>({});
 const [mensagens,setMensagens]=useState<Record<string,string>>({});
 const [ocupado,setOcupado]=useState<string|null>(null);
 const [aviso,setAviso]=useState('');
 const [erros,setErros]=useState<Record<string,string>>({});
 const formatarMensagem=(valor:string)=>valor.replace(/\\n/g,'\n');
 const [respostas,setRespostas]=useState<Record<string,Array<{id:string;tipo:string;conteudo:string;recebido_em:string}>>>({});
 const [csv,setCsv]=useState('');
 const [importando,setImportando]=useState(false);
 const semana=new Date(); semana.setDate(semana.getDate()-((semana.getDay()+6)%7));
 const semanaInicio=semana.toISOString().slice(0,10);
 async function acao(body:Record<string,unknown>) {
   const res=await fetch('/api/admin/acompanhamentos',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await res.json(); if(!res.ok)throw new Error(data.error||'Falha ao salvar');
   return data;
 }
 async function salvarNumero(m:Mentorado) {
   setOcupado(m.id);setAviso('');
   try {const data=await acao({action:'contact',userId:m.id,phone:numeros[m.id]??m.whatsapp_numero??''});setAviso(data.changed?'Número alterado. O novo WhatsApp precisa de autorização no perfil.':'Número mantido. O consentimento já registrado foi preservado.');if(data.changed)window.location.reload();}catch(e){setAviso(String(e));}finally{setOcupado(null);}
 }
 async function gerar(m:Mentorado) {
   const anterior=registros.find(x=>x.user_id===m.id&&x.semana_inicio===semanaInicio);
   if(anterior?.status==='enviado'){setErros(p=>({...p,[m.id]:'Este acompanhamento já foi enviado e não pode ser substituído.'}));return;}
   if(anterior?.status==='aprovado'&&!window.confirm('Este resumo está aprovado. Deseja gerar outro e voltar ao status de rascunho?'))return;
   setOcupado(m.id);setAviso('');setErros(p=>({...p,[m.id]:''}));
   try {
     const data=await acao({action:'draft',userId:m.id,week:semanaInicio,regenerate:true});
     setRegistros(prev=>[data.registro,...prev.filter(x=>!(x.user_id===m.id&&x.semana_inicio===semanaInicio))]);
     setMensagens(prev=>({...prev,[m.id]:formatarMensagem(data.registro.mensagem_whatsapp||'')}));
     setAviso('Análise atualizada com os dados disponíveis. Revise a mensagem antes de aprovar.');
   }catch(e){setErros(p=>({...p,[m.id]:(e instanceof Error?e.message:'Falha ao gerar resumo')+(anterior?' O rascunho exibido abaixo é da análise anterior e NÃO foi atualizado.':' Nenhum rascunho foi gerado.')}));}
   finally{setOcupado(null);}
 }
 async function salvarMensagem(m:Mentorado,r:Registro,status:string) {
   setOcupado(m.id);setAviso('');
   try {const data=await acao({action:'message',userId:m.id,week:r.semana_inicio,message:mensagens[m.id]??r.mensagem_whatsapp??'',status});setRegistros(prev=>prev.map(x=>x.id===r.id?data.registro:x));setAviso('Mensagem e status atualizados. Nenhum WhatsApp foi enviado automaticamente.');}catch(e){setAviso(String(e));}finally{setOcupado(null);}
 }
 async function consultarRespostas(m:Mentorado) {
   setOcupado(m.id);setAviso('');
   try {const response=await fetch('/api/admin/whatsapp-respostas?userId='+encodeURIComponent(m.id),{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha ao consultar respostas');setRespostas(prev=>({...prev,[m.id]:data.respostas}));}catch(e){setAviso(String(e));}finally{setOcupado(null);}
 }
 async function importar() {
   setImportando(true);setAviso('');
   try {const rows=csv.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const cells=line.split(/[;,\t]/).map(v=>v.trim().replace(/^"|"$/g,''));return {email:cells[0],phone:cells[1]};}).filter(x=>x.email.includes('@'));const data=await acao({action:'import',rows});setAviso(data.updated+' contatos processados. Consentimentos existentes foram preservados para números iguais; novos números precisam de autorização.');setCsv('');window.location.reload();}catch(e){setAviso(String(e));}finally{setImportando(false);}
 }
 const filtrados=mentorados.filter(m=>(m.nome+' '+m.email).toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))&&(filtro==='todos'||(filtro==='com_numero'?!!m.whatsapp_numero:filtro==='autorizados'?!!m.whatsapp_consentimento_em:!m.whatsapp_numero)));
 return <main className="mx-auto max-w-6xl px-4 py-8">
   
   <h1 className="mt-4 font-display text-3xl text-black">Acompanhamento Inteligente</h1>
   <p className="mt-2 text-sm text-gray-text">Contatos, consentimento e acompanhamento semanal por mentorado. Rascunhos precisam de revisão humana. A SOMA registra conversas do WhatsApp e da Íris. O atendimento pela TopSend pode ser registrado manualmente enquanto não houver integração de retorno.</p>
   <CueConnection />
   <div className="my-6 grid gap-3 sm:grid-cols-3">{[{t:'Mentorados',v:mentorados.length},{t:'Com WhatsApp',v:mentorados.filter(m=>m.whatsapp_numero).length},{t:'Autorizaram mensagens',v:mentorados.filter(m=>m.whatsapp_consentimento_em).length}].map(x=><div key={x.t} className="rounded-xl border border-gray-faint bg-white p-4"><p className="text-2xl font-semibold">{x.v}</p><p className="text-xs text-gray-text">{x.t}</p></div>)}</div>
   <section className="mb-6 rounded-xl border border-gray-faint bg-white p-5">
    <h2 className="font-semibold">Importar WhatsApps existentes</h2><p className="mt-1 text-xs text-gray-text">Cole uma linha por pessoa no formato email;whatsapp. Exemplo: pessoa@exemplo.com;11999999999. A importação NÃO autoriza disparos.</p>
    <textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={3} placeholder="email;whatsapp" className="mt-3 w-full rounded-lg border border-gray-faint p-3 text-sm"/>
    <button disabled={importando||!csv.trim()} onClick={importar} className="mt-2 rounded-lg bg-brown-deep px-4 py-2 text-sm text-white disabled:opacity-50">Importar contatos</button>
   </section>
   <div className="mb-4 flex flex-wrap gap-3"><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome ou email" className="min-w-56 flex-1 rounded-lg border border-gray-faint p-3 text-sm"/><select value={filtro} onChange={e=>setFiltro(e.target.value)} className="rounded-lg border border-gray-faint p-3 text-sm"><option value="todos">Todos</option><option value="com_numero">Com WhatsApp</option><option value="autorizados">Com consentimento</option><option value="sem_numero">Sem WhatsApp</option></select></div>
   {aviso&&<p role="status" className="mb-4 rounded-lg bg-white p-3 text-sm">{aviso}</p>}
   <div className="space-y-4">{filtrados.map(m=>{const r=registros.find(x=>x.user_id===m.id&&x.semana_inicio===semanaInicio);const liberado=!!m.whatsapp_numero&&!!m.whatsapp_consentimento_em;
     return <section key={m.id} className="rounded-xl border border-gray-faint bg-white p-5">
       <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">{m.nome||m.email}</h3><p className="text-xs text-gray-text">{m.email} · {m.genero||'Gênero não informado'}</p></div><span className="text-xs text-gray-text">{liberado?'Contato autorizado':m.whatsapp_numero?'Aguardando consentimento':'Sem número'}</span></div>
       <div className="mt-3"><button onClick={()=>consultarRespostas(m)} disabled={ocupado===m.id} className="rounded-lg border border-gray-faint px-3 py-2 text-sm">Consultar respostas recebidas</button>{respostas[m.id]&&<div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm">{respostas[m.id].length===0?<p>Nenhuma resposta vinculada até o momento.</p>:respostas[m.id].map(resposta=><div key={resposta.id} className="border-b border-gray-200 pb-2"><span className="text-xs text-gray-text">{new Date(resposta.recebido_em).toLocaleString('pt-BR')}</span><p className="whitespace-pre-wrap break-words">{resposta.conteudo}</p></div>)}</div>}</div><div className="mt-3 flex flex-wrap gap-2"><input type="tel" placeholder="55 + DDD + número" value={numeros[m.id]??m.whatsapp_numero??''} onChange={e=>setNumeros(p=>({...p,[m.id]:e.target.value}))} className="min-w-44 flex-1 rounded-lg border border-gray-faint p-2 text-sm"/><button onClick={()=>salvarNumero(m)} disabled={ocupado===m.id} className="rounded-lg border border-gray-faint px-3 py-2 text-sm">Salvar número</button><button onClick={()=>gerar(m)} disabled={ocupado===m.id} className="rounded-lg bg-brown-deep px-3 py-2 text-sm text-white">{r?'Refazer análise e mensagem':'Gerar resumo semanal'}</button></div>
       {erros[m.id]&&<p role="alert" className="mt-2 text-sm text-red-700">{erros[m.id]}</p>}
       {!liberado && <p className="mt-2 text-xs text-gray-text">{m.whatsapp_numero?<>Autorização pendente. O mentorado pode confirmar o contato em <Link className="underline" href="/perfil">Meu perfil</Link>.</>:'Cadastre um número de WhatsApp para iniciar a confirmação de contato.'}</p>}
       {r&&<div className="mt-4 space-y-2 border-t border-gray-faint pt-4 text-sm">{erros[m.id]&&<p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">Rascunho anterior mantido. A nova análise falhou e não substituiu este conteúdo. Não aprove sem revisar.</p>}<p><strong>Objetivo:</strong> {r.objetivo||'Não declarado'}</p><p><strong>Progresso:</strong> {r.progresso||'Sem evidências'}</p><div><strong>Insight:</strong> <p className="mt-1 whitespace-pre-line text-gray-text">{(r.insight||'Sem análise').replace(/\\n/g,'\n')}</p></div><p><strong>Próxima ação:</strong> {r.proxima_acao||'Não definida'}</p><p className="font-semibold text-sm">Mensagem pronta para WhatsApp (revise antes de aprovar)</p><textarea rows={6} maxLength={750} value={formatarMensagem(mensagens[m.id]??r.mensagem_whatsapp??'')} onChange={e=>setMensagens(p=>({...p,[m.id]:e.target.value}))} className="w-full rounded-lg border border-gray-faint p-3"/><div className="flex flex-wrap gap-2"><button onClick={()=>{navigator.clipboard.writeText(formatarMensagem(mensagens[m.id]??r.mensagem_whatsapp??'')).then(()=>setAviso('Mensagem copiada para revisão.')).catch(()=>setAviso('Não foi possível copiar.'));}} className="rounded-lg border border-gray-faint px-3 py-2">Copiar mensagem</button><button disabled={ocupado===m.id} onClick={()=>salvarMensagem(m,r,'rascunho')} className="rounded-lg border border-gray-faint px-3 py-2">Salvar rascunho</button><button disabled={ocupado===m.id||!liberado} onClick={()=>salvarMensagem(m,r,'aprovado')} className="rounded-lg bg-brown-deep px-3 py-2 text-white disabled:opacity-50">Aprovar para o agente</button><span className="self-center text-xs text-gray-text">Status: {r.status}</span></div></div>}
       <IrisHistorico userId={m.id} nome={m.nome||m.email} whatsappNumero={m.whatsapp_numero}/>
     </section>})}</div>
 </main>;
}
