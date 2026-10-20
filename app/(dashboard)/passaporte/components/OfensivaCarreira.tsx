'use client';

import { useCallback,useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import { Flame,CheckCircle2,CalendarDays,Target,Loader2,ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Tipo='ingles'|'curriculo'|'linkedin'|'networking'|'candidatura'|'entrevista'|'pdi'|'aprendizado'|'reflexao';
type Checkin={dia:string;tipo:Tipo;evidencia:string;criado_em:string};
const TIPOS:Record<Tipo,{nome:string;acao:string;href:string}>={
  ingles:{nome:'Praticar inglês',acao:'O que praticou hoje e em qual situação pretende usar?',href:'/diario'},
  curriculo:{nome:'Melhorar o currículo',acao:'Que conquista ou informação melhorou no currículo?',href:'/carreira?etapa=cv'},
  linkedin:{nome:'Trabalhar o LinkedIn',acao:'Que melhoria fez no perfil ou publicação?',href:'/linkedin'},
  networking:{nome:'Criar conexões',acao:'Que conversa iniciou e o que aprendeu?',href:'/network'},
  candidatura:{nome:'Avançar em uma vaga',acao:'O que fez para se aproximar de uma oportunidade?',href:'/vagas'},
  entrevista:{nome:'Treinar entrevistas',acao:'Qual resposta ou competência praticou?',href:'/carreira?etapa=entrevista'},
  pdi:{nome:'Evoluir no PDI',acao:'Qual ação do plano colocou em prática?',href:'/meu-pdi'},
  aprendizado:{nome:'Aprender algo novo',acao:'O que estudou e como vai aplicar na carreira?',href:'/diario'},
  reflexao:{nome:'Refletir sobre a carreira',acao:'Qual aprendizado ou decisão anotou hoje?',href:'/diario'},
};
function diaSaoPaulo(now=new Date()):string{
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'})
    .formatToParts(now);
  const get=(name:string)=>p.find(v=>v.type===name)?.value??'00';
  return get('year')+'-'+get('month')+'-'+get('day');
}
function ontem(dia:string):string{
  const d=new Date(dia+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);
  return d.toISOString().slice(0,10);
}
function sequencias(lista:Checkin[],hoje:string):{atual:number;recorde:number;diasNaSemana:number}{
  const datas=[...new Set(lista.map(x=>x.dia))].sort();
  const set=new Set(datas);
  let cursor=set.has(hoje)?hoje:ontem(hoje);
  let atual=0;
  while(set.has(cursor)){atual++;cursor=ontem(cursor);}
  let recorde=0;let bloco=0;let anterior='';
  for(const dia of datas){
    bloco=anterior===ontem(dia)?bloco+1:1;
    recorde=Math.max(recorde,bloco);anterior=dia;
  }
  const hojeObj=new Date(hoje+'T12:00:00Z');
  const weekday=hojeObj.getUTCDay();
  const shift=(weekday+6)%7;
  const segunda=new Date(hojeObj);segunda.setUTCDate(segunda.getUTCDate()-shift);
  const inicio=segunda.toISOString().slice(0,10);
  return {atual,recorde,diasNaSemana:datas.filter(x=>x>=inicio&&x<=hoje).length};
}
export default function OfensivaCarreira({userId}:{userId:string}){
  const supabase=useMemo(()=>createClient(),[]);
  const [acoes,setAcoes]=useState<Checkin[]>([]);
  const [carregando,setCarregando]=useState(true);
  const [salvando,setSalvando]=useState(false);
  const [tipo,setTipo]=useState<Tipo>('ingles');
  const [texto,setTexto]=useState('');
  const [erro,setErro]=useState('');
  const [sucesso,setSucesso]=useState('');
  const hoje=diaSaoPaulo();
  const [ativa,setAtiva]=useState(false);
  const carregar=useCallback(async()=>{
    const {data,error}=await supabase.from('carreira_checkins')
      .select('dia,tipo,evidencia,criado_em').eq('user_id',userId)
      .order('dia',{ascending:false}).limit(365);
    if(error)setErro('Não foi possível carregar sua ofensiva agora.');
    else setAcoes((data??[]) as Checkin[]);
    setCarregando(false);
  },[userId,supabase]);
  useEffect(()=>{void carregar();},[carregar]);
  const jaRegistrou=acoes.some(x=>x.dia===hoje);
  const {atual,recorde,diasNaSemana}=useMemo(()=>sequencias(acoes,hoje),[acoes,hoje]);
  const atualData=acoes.find(x=>x.dia===hoje);
  async function registrar(){
    setErro('');setSucesso('');
    if(jaRegistrou||salvando)return;
    if(texto.trim().length<20||texto.trim().length>500){
      setErro('Conte, em pelo menos 20 caracteres, o que você realmente fez hoje.');
      return;
    }
    setSalvando(true);
    try{
      const {data,error}=await supabase.rpc('registrar_checkin_carreira',{
        p_tipo:tipo,p_evidencia:texto.trim(),
      });
      if(error)throw Error(error.message);
      const resultado=Array.isArray(data)?data[0]:data;
      if(resultado?.registrado){
        setSucesso('Ação registrada! Você ganhou 5 Impulsos por cuidar da sua carreira hoje.');
        setTexto('');setAtiva(false);
      }else setSucesso('O check-in de hoje já foi registrado. Amanhã tem mais.');
      await carregar();
    }catch(e){setErro(e instanceof Error?e.message:'Não foi possível registrar sua ação.');}
    finally{setSalvando(false);}
  }
  return <section className="mb-6 rounded-2xl border border-[#DDE6E0] bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-[#366756]">
          <Flame size={16} aria-hidden="true"/> Ofensiva de carreira
        </p>
        <h2 className="font-display text-2xl text-black">Um pequeno passo por dia</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-text">
          Inglês, currículo, entrevistas ou networking. Registre uma ação real e mantenha sua carreira em movimento.
          Sem comparação com a trajetória dos outros.
        </p>
      </div>
      <span className="rounded-full bg-[#ECF5ED] px-3 py-1 text-xs font-medium text-[#295946]">+5 Impulsos por dia</span>
    </div>
    <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
      <div className="rounded-xl bg-[#F3F7F3] p-3"><Flame size={19} className="mb-2 text-[#37684E]" aria-hidden="true"/>
        <p className="text-2xl font-semibold text-black">{atual}</p><p className="text-xs text-gray-text">Dias seguidos</p></div>
      <div className="rounded-xl bg-[#F3F7F3] p-3"><CalendarDays size={19} className="mb-2 text-[#37684E]" aria-hidden="true"/>
        <p className="text-2xl font-semibold text-black">{diasNaSemana}/3</p><p className="text-xs text-gray-text">Meta semanal</p></div>
      <div className="rounded-xl bg-[#F3F7F3] p-3"><Target size={19} className="mb-2 text-[#37684E]" aria-hidden="true"/>
        <p className="text-2xl font-semibold text-black">{recorde}</p><p className="text-xs text-gray-text">Melhor sequência</p></div>
    </div>
    <p className="mt-3 text-xs leading-5 text-gray-text">
      Meta sugerida: cuidar da carreira em três dias por semana. Sua sequência diária é um incentivo, não uma obrigação.
      Se perder um dia, seus Impulsos e conquistas continuam com você.
    </p>
    {!carregando && jaRegistrou ?
      <div className="mt-5 rounded-xl border border-[#C9E0CF] bg-[#F4FAF5] p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-[#295946]"><CheckCircle2 size={17}/> Ação de hoje concluída</p>
        {atualData&&<p className="mt-1 text-sm text-gray-text">{TIPOS[atualData.tipo]?.nome??'Ação registrada'}: {atualData.evidencia}</p>}
      </div>
    :<div className="mt-5">
      {!ativa?
        <button type="button" disabled={carregando} onClick={()=>setAtiva(true)}
          className="rounded-full bg-brown-deep px-5 py-3 text-sm font-medium text-white disabled:opacity-50">
          {carregando?'Carregando...':'Registrar meu progresso de hoje'}
        </button>
      :<div className="space-y-3 rounded-xl border border-gray-faint bg-[#FCFDFC] p-4">
        <label className="block text-sm font-medium text-black">Qual ação você realizou?
          <select className="mt-2 w-full rounded-lg border border-gray-faint bg-white p-3 text-sm"
            value={tipo} onChange={e=>setTipo(e.target.value as Tipo)}>
            {Object.entries(TIPOS).map(([key,x])=><option key={key} value={key}>{x.nome}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-black">{TIPOS[tipo].acao}
          <textarea rows={3} maxLength={500} value={texto} onChange={e=>setTexto(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-faint bg-white p-3 text-sm"
            placeholder="Conte o que você fez de verdade, mesmo que tenha sido uma ação pequena."/>
        </label>
        <p className="text-xs text-gray-text">20 a 500 caracteres. Uma ação registrada por dia. Não há prêmio por apenas abrir a página.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={()=>void registrar()} disabled={salvando||texto.trim().length<20}
            className="rounded-full bg-brown-deep px-5 py-2 text-sm text-white disabled:opacity-50">
            {salvando?<><Loader2 size={15} className="mr-2 inline animate-spin"/>Salvando...</>:'Confirmar minha ação'}
          </button>
          <button type="button" onClick={()=>{setAtiva(false);setErro('');}} className="text-sm text-gray-text">Cancelar</button>
          <Link href={TIPOS[tipo].href} className="inline-flex items-center gap-1 text-xs text-[#295946] underline">
            Abrir ferramenta <ArrowRight size={13}/>
          </Link>
        </div>
      </div>}
    </div>}
    {erro&&<p role="alert" className="mt-3 text-sm text-red-700">{erro}</p>}
    {sucesso&&<p role="status" className="mt-3 text-sm text-[#295946]">{sucesso}</p>}
  </section>;
}
