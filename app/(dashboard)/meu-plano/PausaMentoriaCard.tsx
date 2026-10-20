'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {CalendarDays,Clock3,PauseCircle,PlayCircle,CheckCircle2,Loader2} from 'lucide-react';

type Pausa={id:string;status:string;inicio_em:string;fim_previsto_em:string;
  finalizado_em:string|null;dias_solicitados:number;dias_utilizados:number;
  vencimento_antes:string;vencimento_depois:string|null};
type Estado={pausaAtiva:Pausa|null;pausas:Pausa[];diasDisponiveis:number;
  vencimento:string|null;assinaturaRecorrente:boolean;
  elegivel:boolean;termoAtualizado:boolean;termoAceito:boolean};
function datePt(d:string|null|undefined) {
  if(!d)return 'não definido';
  const [a,m,dia]=d.split('-');
  return dia+'/'+m+'/'+a;
}
function addDays(date:string,n:number):string {
  const dia=new Date(date+'T12:00:00Z');
  dia.setUTCDate(dia.getUTCDate()+n);
  return dia.toISOString().slice(0,10);
}
export default function PausaMentoriaCard() {
  const [data,setData]=useState<Estado|null>(null);
  const [carregando,setCarregando]=useState(true);
  const [dias,setDias]=useState(30);
  const [confirmou,setConfirmou]=useState(false);
  const [busy,setBusy]=useState(false);
  const [erro,setErro]=useState('');
  const [mensagem,setMensagem]=useState('');
  const carregar=useCallback(async()=>{
    const r=await fetch('/api/mentoria/pausa',{cache:'no-store'});
    if(!r.ok)throw new Error('Não foi possível consultar sua situação de pausa.');
    setData(await r.json() as Estado);
  },[]);
  useEffect(()=>{
    void carregar().catch(e=>setErro(e instanceof Error?e.message:'Erro ao carregar'))
      .finally(()=>setCarregando(false));
  },[carregar]);
  const maxDias=Math.max(0,Math.min(60,data?.diasDisponiveis??60));
  const diasSelecionados=Math.max(1,Math.min(maxDias||1,dias));
  const fimEstimado=useMemo(()=>data?.vencimento?addDays(data.vencimento,diasSelecionados):null,
    [data?.vencimento,diasSelecionados]);
  async function alterar(acao:'solicitar'|'retomar'){
    setErro('');setMensagem('');
    if(acao==='solicitar' && !confirmou)return;
    const texto=acao==='retomar'
      ?'Deseja retomar sua mentoria agora? O vencimento será prorrogado apenas pelos dias efetivamente pausados.'
      :'Deseja pausar a mentoria por '+diasSelecionados+' dias? A retomada será programada e as parcelas de pagamentos recorrentes não serão alteradas.';
    if(!window.confirm(texto))return;
    setBusy(true);
    try{
      const r=await fetch('/api/mentoria/pausa',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({acao,dias:diasSelecionados,confirmou}),
      });
      const result=await r.json() as {ok?:boolean;error?:string};
      if(!r.ok)throw new Error(result.error||'Não foi possível processar a pausa.');
      setMensagem(acao==='solicitar'
        ?'Pausa confirmada. A SOMA guardou suas datas e cuidará da retomada.'
        :'Bem-vinda de volta. Seus dias de pausa já foram acrescentados ao prazo da mentoria.');
      setConfirmou(false);
      await carregar();
    }catch(e){setErro(e instanceof Error?e.message:'Erro ao processar solicitação');}
    finally{setBusy(false);}
  }
  return <section className="mb-8 rounded-2xl border border-[#DCE8DF] bg-[#F7FAF7] p-5 sm:p-6">
    <div className="mb-3 flex items-center gap-2 text-[#2F674E]">
      <PauseCircle size={19} aria-hidden="true"/>
      <p className="text-xs font-semibold uppercase tracking-[0.14em]">Seu tempo, seu ritmo</p>
    </div>
    <h2 className="font-display text-2xl text-black">Pausa programada da mentoria</h2>
    <p className="mt-2 text-sm leading-6 text-gray-text">
      Imprevistos acontecem. Você pode fazer uma pausa de até 60 dias acumulados no ciclo,
      preservando seus materiais, Impulsos, conquistas e histórico.
    </p>
    {carregando?<p className="mt-5 text-sm text-gray-text"><Loader2 size={15} className="mr-2 inline animate-spin"/>Carregando...</p>
    :data?.pausaAtiva?<div className="mt-5 space-y-4">
      <div className="rounded-xl border border-[#C6DFCC] bg-white p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2F674E]"><Clock3 size={17}/> Pausa em andamento</p>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-gray-text">Início</p><p className="font-medium">{datePt(data.pausaAtiva.inicio_em)}</p></div>
          <div><p className="text-xs text-gray-text">Retomada programada</p><p className="font-medium">{datePt(data.pausaAtiva.fim_previsto_em)}</p></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-text">
          O vencimento será estendido no encerramento pelo número de dias efetivamente utilizados.
          Durante a pausa, lembretes de engajamento e o check-in da ofensiva ficam suspensos.
        </p>
      </div>
      <button type="button" disabled={busy} onClick={()=>void alterar('retomar')}
        className="inline-flex items-center gap-2 rounded-full bg-brown-deep px-4 py-2.5 text-sm text-white disabled:opacity-50">
        <PlayCircle size={17}/>{busy?'Processando...':'Retomar minha mentoria agora'}
      </button>
    </div>
    :!data?.elegivel?<p className="mt-5 rounded-lg bg-white p-4 text-sm text-gray-text">
      {data?.vencimento
       ?'A pausa programada está disponível para planos pagos com vigência ativa. Se precisar de ajuda, entre em contato com a equipe da SOMA.'
       :'Seu plano ainda não tem uma data de vencimento registrada. Solicite à equipe da SOMA a conferência do prazo para habilitar a pausa com segurança.'}
    </p>
    :maxDias<1?<p className="mt-4 text-sm text-gray-text">Você já utilizou os 60 dias de pausa deste ciclo de mentoria.</p>
    :<div className="mt-5 space-y-4 rounded-xl border border-gray-faint bg-white p-4">
      {!data.termoAtualizado||!data.termoAceito?
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-black">Antes de pausar, leia e aceite a nova versão dos termos com a regra de até 60 dias.</p>
          <Link href="/termos" className="mt-2 inline-block text-sm font-semibold text-[#5B453E] underline">Ler os termos atualizados</Link>
          <p className="mt-1 text-xs text-gray-text">Se já aceitou nesta sessão, atualize a página.</p>
        </div>:null}
      <label className="block text-sm font-medium text-black">Quantos dias você deseja pausar?
        <select value={diasSelecionados} disabled={busy}
          onChange={e=>{setDias(Number(e.target.value));setConfirmou(false);}}
          className="mt-2 w-full rounded-lg border border-gray-faint bg-white px-3 py-2.5 text-sm">
          {[7,14,15,21,30,45,60,maxDias].filter((n,i,a)=>n<=maxDias&&a.indexOf(n)===i).sort((a,b)=>a-b)
            .map(n=><option value={n} key={n}>{n} dias</option>)}
        </select>
      </label>
      <div className="grid gap-3 rounded-lg bg-[#F6F8F5] p-3 text-sm sm:grid-cols-2">
        <div><span className="block text-xs text-gray-text">Vencimento atual</span>
          <strong>{datePt(data.vencimento)}</strong></div>
        <div><span className="block text-xs text-gray-text">Vencimento se usar todos os dias</span>
          <strong>{datePt(fimEstimado)}</strong></div>
      </div>
      <p className="text-xs leading-5 text-gray-text">
        Você tem até {maxDias} dias disponíveis neste ciclo. Se voltar antes, somaremos apenas os dias utilizados.
        Os pagamentos parcelados ou recorrentes seguem o contrato de cobrança vigente e não são suspensos automaticamente.
      </p>
      <label className="flex items-start gap-3 text-sm text-black">
        <input type="checkbox" className="mt-1" checked={confirmou} onChange={e=>setConfirmou(e.target.checked)}/>
        <span>Entendo as datas, o limite de 60 dias e que a pausa da participação não interrompe automaticamente cobranças contratadas.</span>
      </label>
      <button type="button" disabled={busy||!confirmou||!data.termoAtualizado||!data.termoAceito}
        onClick={()=>void alterar('solicitar')}
        className="rounded-full bg-brown-deep px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
        {busy?'Confirmando...':'Confirmar pausa'}
      </button>
    </div>}
    {data?.pausas?.some(p=>p.status==='finalizada')&&
      <p className="mt-4 flex items-center gap-1 text-xs text-gray-text">
        <CalendarDays size={13}/> Histórico de pausas preservado. Última conclusão: {datePt(data.pausas.find(p=>p.status==='finalizada')?.finalizado_em)}
      </p>}
    {mensagem&&<p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#2F674E]"><CheckCircle2 size={16}/>{mensagem}</p>}
    {erro&&<p role="alert" className="mt-3 text-sm text-red-700">{erro}</p>}
  </section>;
}
