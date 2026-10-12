'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

type Respostas={
 momento_profissional:string;objetivo_principal:string;maior_desafio:string;
 prioridade_90_dias:string;apoio_esperado:string;comunicacao_preferida:string;
};
const inicial:Respostas={momento_profissional:'',objetivo_principal:'',maior_desafio:'',prioridade_90_dias:'',apoio_esperado:'',comunicacao_preferida:'misto'};
const momentos=[
 ['recolocacao','Estou buscando uma nova oportunidade'],
 ['transicao','Quero mudar de área ou carreira'],
 ['crescimento','Quero crescer na empresa atual'],
 ['lideranca','Quero desenvolver minha liderança'],
 ['empreendedorismo','Estou empreendendo ou criando um projeto'],
 ['exploracao','Ainda estou descobrindo meu caminho'],
];
export default function EntrevistaInicialModal({profile}:{profile:Profile|null}){
 const pathname=usePathname();const router=useRouter();
 const [estado,setEstado]=useState<'carregando'|'pendente'|'concluido'>('carregando');
 const [passo,setPasso]=useState(0);
 const [respostas,setRespostas]=useState<Respostas>(inicial);
 const [salvando,setSalvando]=useState(false);
 const [erro,setErro]=useState('');
 const elegivel=Boolean(profile&&!profile.is_admin&&profile.dados_contato_confirmados_em&&
  (profile.trial_status==='active'||profile.trial_status==='converted'||profile.status_assinatura==='ativo'||profile.status_assinatura==='trial')&&!pathname.startsWith('/admin'));
 useEffect(()=>{
  if(!elegivel||!profile){setEstado('carregando');return;}
  let ativo=true;
  const supabase=createClient();
  supabase.from('entrevistas_iniciais').select('user_id').eq('user_id',profile.id).maybeSingle()
   .then(({data,error})=>{if(!ativo)return;setEstado(error?'carregando':data?'concluido':'pendente');if(error)setErro('Não foi possível carregar sua entrevista. Atualize a página.');});
  return ()=>{ativo=false;};
 },[elegivel,profile?.id]);
 if(!elegivel||estado!=='pendente')return null;
 const alterar=(campo:keyof Respostas,valor:string)=>setRespostas(prev=>({...prev,[campo]:valor}));
 const perguntas=[
  <div key="momento"><label htmlFor="entrevista-momento" className="block text-sm font-semibold mb-2">Qual é seu momento profissional hoje?</label><select id="entrevista-momento" value={respostas.momento_profissional} onChange={e=>alterar('momento_profissional',e.target.value)} className="w-full rounded-xl border border-gray-faint p-3 text-sm"><option value="">Selecione a opção mais próxima</option>{momentos.map(([valor,rotulo])=><option key={valor} value={valor}>{rotulo}</option>)}</select></div>,
  <div key="objetivo"><label htmlFor="entrevista-objetivo" className="block text-sm font-semibold mb-2">O que você mais deseja conquistar com a SOMA?</label><p className="mb-2 text-xs text-gray-text">Pode contar com suas palavras. Quanto mais contexto, melhor poderemos acompanhar sua jornada.</p><textarea id="entrevista-objetivo" rows={5} maxLength={1200} value={respostas.objetivo_principal} onChange={e=>alterar('objetivo_principal',e.target.value)} placeholder="Por exemplo, assumir minha primeira liderança, mudar de área ou me sentir mais segura nas entrevistas..." className="w-full rounded-xl border border-gray-faint p-3 text-sm"/></div>,
  <div key="desafio"><label htmlFor="entrevista-desafio" className="block text-sm font-semibold mb-2">O que mais está dificultando esse objetivo hoje?</label><textarea id="entrevista-desafio" rows={5} maxLength={1200} value={respostas.maior_desafio} onChange={e=>alterar('maior_desafio',e.target.value)} placeholder="Conte o que tem tentado, suas dúvidas ou o que sente que está faltando..." className="w-full rounded-xl border border-gray-faint p-3 text-sm"/></div>,
  <div key="prioridade"><label htmlFor="entrevista-prioridade" className="block text-sm font-semibold mb-2">Daqui a 90 dias, qual mudança faria você sentir que avançou?</label><textarea id="entrevista-prioridade" rows={5} maxLength={1200} value={respostas.prioridade_90_dias} onChange={e=>alterar('prioridade_90_dias',e.target.value)} placeholder="Uma mudança concreta, mesmo que pequena..." className="w-full rounded-xl border border-gray-faint p-3 text-sm"/></div>,
  <div key="apoio"><label htmlFor="entrevista-apoio" className="block text-sm font-semibold mb-2">Que tipo de apoio você espera receber da mentoria?</label><textarea id="entrevista-apoio" rows={3} maxLength={500} value={respostas.apoio_esperado} onChange={e=>alterar('apoio_esperado',e.target.value)} placeholder="Ex.: direcionamento, feedback, prática, planejamento, incentivo..." className="w-full rounded-xl border border-gray-faint p-3 text-sm"/><label htmlFor="entrevista-comunicacao" className="mt-5 block text-sm font-semibold mb-2">Que conteúdo seria mais útil para você?</label><select id="entrevista-comunicacao" value={respostas.comunicacao_preferida} onChange={e=>alterar('comunicacao_preferida',e.target.value)} className="w-full rounded-xl border border-gray-faint p-3 text-sm"><option value="misto">Um pouco de cada, conforme minha jornada</option><option value="reflexoes">Reflexões e perguntas de mentoria</option><option value="exercicios">Exercícios e planos de ação</option><option value="oportunidades">Oportunidades, conteúdos e eventos</option></select></div>,
 ];
 const valido=passo===0?Boolean(respostas.momento_profissional):
  passo===1?respostas.objetivo_principal.trim().length>=10:
  passo===2?respostas.maior_desafio.trim().length>=10:
  passo===3?respostas.prioridade_90_dias.trim().length>=10:
  respostas.apoio_esperado.trim().length>=3;
 async function avancar(){
  if(!valido)return;
  if(passo<4){setPasso(x=>x+1);return;}
  if(!profile)return;
  setSalvando(true);setErro('');
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user||user.id!==profile.id){setErro('Sua sessão expirou. Entre novamente.');setSalvando(false);return;}
  const {error}=await supabase.from('entrevistas_iniciais').insert({user_id:profile.id,...respostas,
   objetivo_principal:respostas.objetivo_principal.trim(),maior_desafio:respostas.maior_desafio.trim(),
   prioridade_90_dias:respostas.prioridade_90_dias.trim(),apoio_esperado:respostas.apoio_esperado.trim()});
  if(error){setErro('Não foi possível salvar a entrevista. Tente novamente.');setSalvando(false);return;}
  setEstado('concluido');router.refresh();
 }
 return <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/65 px-4 py-6" role="presentation">
  <section role="dialog" aria-modal="true" aria-labelledby="entrevista-inicial-titulo" className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
   <p className="text-xs font-semibold uppercase tracking-widest text-brown-deep">SOMA Mentoria · Sua jornada começa aqui</p>
   <h2 id="entrevista-inicial-titulo" className="mt-3 font-display text-2xl text-black">Vamos entender seus objetivos?</h2>
   <p className="mt-2 text-sm text-gray-text">Suas respostas vão orientar a mentoria e os acompanhamentos personalizados. Você não precisa ter tudo resolvido agora.</p>
   <div className="mt-5 flex gap-1.5" aria-label={'Etapa '+(passo+1)+' de 5'}>{[0,1,2,3,4].map(i=><span key={i} className={'h-1.5 flex-1 rounded-full '+(i<=passo?'bg-brown-deep':'bg-gray-200')}/>)}</div>
   <p className="my-4 text-xs text-gray-text">Pergunta {passo+1} de 5</p>
   {perguntas[passo]}
   {erro&&<p role="alert" className="mt-4 text-sm text-red-700">{erro}</p>}
   <div className="mt-6 flex gap-3">{passo>0&&<button type="button" onClick={()=>setPasso(x=>x-1)} className="rounded-xl border border-gray-faint px-5 py-3 text-sm">Voltar</button>}<button type="button" disabled={!valido||salvando} onClick={avancar} className="flex-1 rounded-xl bg-brown-deep px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{salvando?'Salvando...':passo===4?'Concluir entrevista':'Continuar'}</button></div>
   <p className="mt-3 text-center text-xs text-gray-text">Estas informações são usadas para personalizar sua experiência na SOMA. O envio de WhatsApp depende de autorização separada.</p>
  </section>
 </div>;
}
