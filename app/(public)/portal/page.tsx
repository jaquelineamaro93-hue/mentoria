import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, Compass, FileSearch, MessageSquare, Target, TrendingUp } from 'lucide-react';
import { SomaSiteHeader, SomaSiteFooter, SomaSiteCallToAction } from '@/components/public/SomaMarketingChrome';

const journeys=[
  {
    number:'01',tag:'Clareza',title:'Você não começa pela vaga. Começa entendendo o seu momento.',
    text:'Autoconhecimento, diagnóstico e direção para que sua estratégia não seja baseada em comparação, ansiedade ou tentativa e erro.',
    items:['Mapa Quem Sou Eu','Diagnóstico & Perfil','Diário de Bordo e histórico da jornada'],
    preview:'Descubra suas forças',icons:[Compass,Target,MessageSquare]
  },
  {
    number:'02',tag:'Crescimento',title:'Se o objetivo é crescer onde você está, existe um caminho diferente.',
    text:'Primeiros 90 dias, leitura de cenário e PDI ficam separados das ferramentas de recolocação. Assim você não recebe uma resposta genérica para problemas diferentes.',
    items:['Primeiros 90 dias','Leitura de cenário','PDI com acompanhamento e evidências'],
    preview:'Seu PDI',icons:[TrendingUp,CheckCircle2,Target]
  },
  {
    number:'03',tag:'Mercado',title:'Se o movimento é para o mercado, a preparação acompanha o processo inteiro.',
    text:'Currículo, aderência à vaga, candidaturas, LinkedIn e entrevistas dentro da mesma jornada, com contexto do seu perfil.',
    items:['Currículo e Gupy & ATS','Vagas & candidaturas','LinkedIn, networking e entrevistas'],
    preview:'Mercado de trabalho',icons:[FileSearch,BriefcaseBusiness,MessageSquare]
  }
];

export default function PortalPublicPage() {
 return <div className="soma-marketing min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
   <SomaSiteHeader active="/portal" />
   <main>
     <section className="mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
       <p className="text-sm font-semibold tracking-wide text-[#8FD3BE]">Portal SOMA</p>
       <h1 className="mt-5 max-w-5xl font-display text-5xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-7xl">A mentoria não termina quando o encontro <em className="font-serif font-normal text-[#8FD3BE]">acaba.</em></h1>
       <p className="mt-7 max-w-3xl text-lg leading-8 text-[#C3D0CC]">O portal acompanha o que você descobriu, o que decidiu e o que precisa fazer depois. Em vez de orientação solta, uma jornada registrada que evolui com você.</p>
       <div className="mt-9 flex flex-wrap gap-3"><Link href="/planos" className="inline-flex min-h-12 items-center rounded-full bg-[#8FD3BE] px-7 font-semibold text-[#10221c] hover:bg-[#C6F0E2]">Conhecer os planos</Link><Link href="/como-funciona" className="inline-flex min-h-12 items-center rounded-full border border-[#476E5D] px-7 font-semibold text-white hover:border-[#8FD3BE]">Entender o método</Link></div>
     </section>
     {journeys.map((item,index)=><section key={item.number} className="border-t border-[#2B403C]">
       <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-20">
         <div className={index%2===1?'lg:order-2':''}>
           <p className="text-sm font-semibold text-[#8FD3BE]">{item.number} · {item.tag}</p>
           <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">{item.title}</h2>
           <p className="mt-5 max-w-xl text-base leading-7 text-[#A9BAB5]">{item.text}</p>
           <ul className="mt-7 grid gap-3">{item.items.map(x=><li key={x} className="flex items-center gap-3 text-sm text-[#EEF3F1]"><CheckCircle2 aria-hidden="true" size={18} className="text-[#8FD3BE]"/>{x}</li>)}</ul>
         </div>
         <div className={`overflow-hidden rounded-3xl border border-[#395448] bg-[#152720] shadow-2xl ${index%2===1?'lg:order-1':''}`}>
           <div className="flex h-11 items-center gap-2 border-b border-[#354A41] bg-[#182E26] px-5"><span className="h-2.5 w-2.5 rounded-full bg-[#E9B49A]"/><span className="h-2.5 w-2.5 rounded-full bg-[#E7D18E]"/><span className="h-2.5 w-2.5 rounded-full bg-[#8FD3BE]"/><span className="ml-3 text-xs text-[#A9BAB5]">portal SOMA · {item.preview}</span></div>
           <div className="p-6 sm:p-9">
             <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#8FD3BE]">Sua jornada</p><h3 className="mt-2 font-display text-2xl font-semibold">{item.preview}</h3>
             <div className="mt-8 grid gap-3 sm:grid-cols-3">{item.items.map((x,i)=>{const Icon=item.icons[i];return <div key={x} className="rounded-2xl border border-[#3E594D] bg-[#20382D] p-4"><Icon size={23} className="text-[#8FD3BE]"/><span className="mt-4 block text-sm font-medium leading-5">{x}</span></div>})}</div>
             <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#2D443A]"><div className="h-full w-2/3 rounded-full bg-[#8FD3BE]"/></div><p className="mt-3 text-xs text-[#A9BAB5]">Acompanhe suas ações, revisões e próximos passos</p>
           </div>
         </div>
       </div>
     </section>)}
     <section className="border-t border-[#2B403C] px-5 py-16 text-center">
       <h2 className="mx-auto max-w-4xl font-display text-4xl font-semibold sm:text-5xl">Sua jornada, organizada <span className="font-serif font-normal italic text-[#8FD3BE]">do começo ao fim.</span></h2>
       <p className="mx-auto mt-5 max-w-2xl text-base text-[#C3D0CC]">Humano no que precisa de contexto, tecnologia no que precisa de continuidade</p>
     </section>
     <SomaSiteCallToAction />
   </main>
   <SomaSiteFooter/>
 </div>;
}
