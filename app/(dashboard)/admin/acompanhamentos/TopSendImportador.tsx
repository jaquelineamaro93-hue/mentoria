'use client';

import { useMemo,useState } from 'react';
import { ClipboardPaste,CheckCircle2,Loader2 } from 'lucide-react';

type Registro={direcao:'entrada'|'saida';conteudo:string;ocorridoEm:string};
type Analise={mensagens:Registro[];desconhecidos:string[];erro:string};
const pad=(n:number)=>String(n).padStart(2,'0');
function normalizar(value:string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}\s]/gu,' ').trim();
}
function remetente(sender:string,nome:string):'entrada'|'saida'|null{
  const s=normalizar(sender);
  if(['iris','lume','soma','agente','assistente','bot','topsend','jaqueline','eu'].includes(s))
    return 'saida';
  if(['mentorado','mentorada','aluno','aluna','cliente','usuario','pessoa','contato'].includes(s))
    return 'entrada';
  const mentorado=normalizar(nome).split(/\s+/)[0];
  if(s===normalizar(nome)|| (mentorado.length>=3 && s.split(/\s+/)[0]===mentorado))
    return 'entrada';
  return null;
}
function convertido(d:string,h:string):string|null {
  const [dia,mes,ano]=d.split('/').map(Number);
  const [hora,min,seg=0]=h.split(':').map(Number);
  if(!dia||dia>31||!mes||mes>12||ano<2020||ano>2100||hora>23||min>59||seg>59)
    return null;
  const iso=ano+'-'+pad(mes)+'-'+pad(dia)+'T'+pad(hora)+':'+pad(min)+':'+pad(seg)+'-03:00';
  const dt=new Date(iso);
  if(!Number.isFinite(dt.getTime()))return null;
  const round=dt.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  if(!round.startsWith(pad(dia)+'/'+pad(mes)+'/'+ano))return null;
  return dt.toISOString();
}
export function interpretarHistoricoTopSend(texto:string,nome:string,autorSimples:'entrada'|'saida',dataSimples:string):Analise{
  const linhas=texto.replace(/\r/g,'').split('\n');
  const mensagens:Registro[]=[];
  const desconhecidos=new Set<string>();
  let erro='';
  let primeiro=true;
  for(const linha of linhas){
    if(!linha.trim()) {
      if(mensagens.length)mensagens[mensagens.length-1].conteudo+='\n';
      continue;
    }
    const colchetes=linha.match(/^\[(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]{1,90}):\s*(.*)$/);
    const exportado=linha.match(/^(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+[-–]\s+([^:]{1,90}):\s*(.*)$/);
    const formato=colchetes||exportado;
    if(formato){
      const direcao=remetente(formato[3],nome);
      if(!direcao){desconhecidos.add(formato[3].trim());continue;}
      const ocorridoEm=convertido(formato[1],formato[2]);
      if(!ocorridoEm){erro='Há uma data inválida no texto copiado.';break;}
      mensagens.push({direcao,ocorridoEm,conteudo:formato[4]});
      primeiro=false;
      continue;
    }
    const simplificado=linha.match(/^(M|MENTORADO|MENTORADA|I|ÍRIS|IRIS)\s*:\s*(.*)$/i);
    if(simplificado){
      if(!dataSimples){erro='Informe a data e hora para mensagens sem horário no texto.';break;}
      const horario=new Date(dataSimples+'-03:00');
      if(!Number.isFinite(horario.getTime())){erro='Data e hora inválidas.';break;}
      const ocorridoEm=horario.toISOString();
      const direcao=/^(I|IRIS|ÍRIS)$/i.test(simplificado[1])?'saida':'entrada';
      mensagens.push({direcao,conteudo:simplificado[2],ocorridoEm});
      primeiro=false;
      continue;
    }
    if(primeiro) {
      if(!dataSimples){erro='Informe data e hora ou cole uma transcrição com os horários originais.';break;}
      const dt=new Date(dataSimples+'-03:00');
      if(!Number.isFinite(dt.getTime())){erro='Data e hora inválidas.';break;}
      mensagens.push({direcao:autorSimples,conteudo:linha,ocorridoEm:dt.toISOString()});
      primeiro=false;
    }else if(mensagens.length){
      mensagens[mensagens.length-1].conteudo+='\n'+linha;
    }
  }
  const clean=mensagens.map(m=>({...m,conteudo:m.conteudo.trim()})).filter(m=>m.conteudo);
  if(clean.length>50)erro='Importe no máximo 50 mensagens por vez.';
  if(clean.some(m=>m.conteudo.length>5000))erro='Uma mensagem ultrapassa 5.000 caracteres.';
  return {mensagens:clean,desconhecidos:[...desconhecidos],erro};
}

export default function TopSendImportador({userId,nome,onImported}:{
  userId:string;nome:string;onImported:()=>Promise<void>;
}){
  const [aberto,setAberto]=useState(false);
  const [texto,setTexto]=useState('');
  const [autor,setAutor]=useState<'entrada'|'saida'>('entrada');
  const [data,setData]=useState('');
  const [insight,setInsight]=useState('');
  const [proximo,setProximo]=useState('');
  const [ocupado,setOcupado]=useState(false);
  const [aviso,setAviso]=useState('');
  const [erro,setErro]=useState('');
  const analise=useMemo(()=>interpretarHistoricoTopSend(texto,nome,autor,data),[texto,nome,autor,data]);
  async function salvar(){
    setErro('');setAviso('');
    if(analise.erro||analise.desconhecidos.length||!analise.mensagens.length){
      setErro(analise.erro||'Revise os autores e as mensagens antes de salvar.');
      return;
    }
    if(!window.confirm('Registrar '+analise.mensagens.length+' mensagem(ns) no histórico de '+nome+'? Nenhuma mensagem será enviada pelo WhatsApp.'))return;
    setOcupado(true);
    try{
      const response=await fetch('/api/admin/iris/importar-topsend',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId,mensagens:analise.mensagens,insight,proximoPasso:proximo}),
      });
      const body=await response.json();
      if(!response.ok)throw Error(body.error||'Não foi possível registrar a conversa.');
      setAviso(body.registradas+' mensagem(ns) registrada(s), '+body.duplicadas+' duplicada(s).'+
        (body.evolucaoRegistrada?' Próximo passo e/ou insight atualizados.':''));
      setTexto('');setInsight('');setProximo('');
      await onImported();
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao registrar');}
    finally{setOcupado(false);}
  }
  return <div className="rounded-lg border border-gray-faint p-3">
    <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-black"
      onClick={()=>setAberto(s=>!s)}>
      <ClipboardPaste size={16}/> {aberto?'Fechar importação':'Registrar conversa da Íris na TopSend'}
    </button>
    {aberto&&<div className="mt-3 space-y-3">
      <p className="text-xs leading-5 text-gray-text">Cole mensagens copiadas do WhatsApp/TopSend com data, hora e remetente. O registro fica vinculado somente a {nome}. A SOMA não consulta automaticamente a TopSend.</p>
      <textarea rows={6} value={texto} onChange={e=>setTexto(e.target.value)}
        placeholder={'[16/10/2026, 16:44] '+nome+': Gostaria de trabalhar meu posicionamento.\n[16/10/2026, 16:45] Íris: Qual foi o primeiro passo?'}
        className="w-full rounded-lg border border-gray-faint p-3 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-gray-text">Autor (quando colar apenas uma mensagem)
          <select value={autor} onChange={e=>setAutor(e.target.value as 'entrada'|'saida')}
            className="mt-1 w-full rounded-lg border border-gray-faint bg-white p-2 text-sm text-black">
            <option value="entrada">Mentorado</option><option value="saida">Íris</option>
          </select>
        </label>
        <label className="text-xs text-gray-text">Data e hora (somente se o texto não tiver horário)
          <input type="datetime-local" value={data} onChange={e=>setData(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-faint bg-white p-2 text-sm text-black"/>
        </label>
      </div>
      {texto.trim()&&<div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-text">
        <p>Prévia: <strong>{analise.mensagens.length} mensagens</strong>,
          {' '}{analise.mensagens.filter(m=>m.direcao==='entrada').length} do mentorado,
          {' '}{analise.mensagens.filter(m=>m.direcao==='saida').length} da Íris</p>
        {analise.desconhecidos.length>0&&<p className="mt-1 text-red-700">Remetente não reconhecido: {analise.desconhecidos.join(', ')}. Substitua no texto por “Mentorado” ou “Íris” antes de importar.</p>}
        {analise.erro&&<p className="mt-1 text-red-700">{analise.erro}</p>}
        {analise.mensagens.slice(0,3).map((m,i)=><p key={i} className="mt-1 break-words">{m.direcao==='entrada'?'Mentorado':'Íris'} · {new Date(m.ocorridoEm).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {m.conteudo.slice(0,110)}</p>)}
      </div>}
      <label className="block text-xs text-gray-text">Insight do acompanhamento (opcional)
        <textarea rows={2} maxLength={1000} value={insight} onChange={e=>setInsight(e.target.value)}
          placeholder="O que a conversa revelou sobre a evolução do mentorado?"
          className="mt-1 w-full rounded-lg border border-gray-faint p-3 text-sm"/>
      </label>
      <label className="block text-xs text-gray-text">Próximo passo combinado (opcional)
        <textarea rows={2} maxLength={600} value={proximo} onChange={e=>setProximo(e.target.value)}
          placeholder="Ação específica para acompanhar na próxima interação"
          className="mt-1 w-full rounded-lg border border-gray-faint p-3 text-sm"/>
      </label>
      <button type="button" disabled={ocupado||!analise.mensagens.length||!!analise.erro||!!analise.desconhecidos.length}
        onClick={()=>void salvar()} className="rounded-lg bg-brown-deep px-4 py-2 text-sm text-white disabled:opacity-50">
        {ocupado?<><Loader2 size={14} className="mr-2 inline animate-spin"/>Salvando...</>:'Registrar na SOMA'}
      </button>
      {aviso&&<p role="status" className="flex items-center gap-1 text-sm text-gray-text"><CheckCircle2 size={15}/>{aviso}</p>}
      {erro&&<p role="alert" className="text-sm text-red-700">{erro}</p>}
      <p className="text-xs text-gray-text">Importação manual, com proteção contra mensagens duplicadas. Não dispara WhatsApp nem repassa a conversa à IA externa.</p>
    </div>}
  </div>;
}
