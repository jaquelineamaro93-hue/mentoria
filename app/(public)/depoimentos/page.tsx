import Link from 'next/link';
import SomaSuccessStories from '@/components/public/SomaSuccessStories';
import { SomaSiteHeader, SomaSiteFooter, SomaSiteCallToAction } from '@/components/public/SomaMarketingChrome';

const depoimentos = [
  {
    nome: 'Maria Laura Soares',
    cargo: 'CRM & Lifecycle Marketing',
    iniciais: 'ML',
    texto: '"Percebi que alguns dos meus pontos fortes eu nunca tinha parado para identificar de forma consciente. Os primeiros encontros já ampliaram tanto minha visão, estou imaginando tudo o que tem pela frente."',
    href: 'https://lnkd.in/p/esE9t5fr',
    cor: '#0D8071',
    bg: 'rgba(13, 128, 113, 0.08)',
  },
  {
    nome: 'Giulia Gomes',
    cargo: 'CRM Analyst & Lifecycle Marketing',
    iniciais: 'GG',
    texto: '"É uma mentoria muito voltada para carreira mesmo. Tenho saído desses encontros com aquela sensação de que estou ajustando o caminho, não só fazendo mais, mas fazendo melhor."',
    href: 'https://lnkd.in/p/eetWmSiv',
    cor: '#B24D5B',
    bg: 'rgba(178, 77, 91, 0.08)',
  },
  {
    nome: 'Rita Alecrim',
    cargo: 'CRM Senior / Product Owner',
    iniciais: 'RA',
    texto: '"Que mentoria incrível! Foram horas de muito conteúdo, trocas e aprendizado prático. Saio dessa mentoria com a bagagem cheia e com a expectativa de aplicar as novas estratégias."',
    href: 'https://lnkd.in/p/euSGD_V9',
    cor: '#A85D24',
    bg: 'rgba(168, 93, 36, 0.08)',
  },
];

export default function DepoimentosPage() {
 return <div className="min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
   <SomaSiteHeader active="/depoimentos"/>
   <main>
     <section className="border-b border-[#294138] px-5 pb-12 pt-16 sm:pb-20 sm:pt-24">
       <div className="mx-auto max-w-7xl sm:px-3">
         <p className="text-sm font-semibold text-[#8FD3BE]">Depoimentos · histórias recebidas, resultados reais</p>
         <h1 className="mt-5 max-w-5xl font-display text-5xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-7xl">O próximo capítulo pode começar <span className="font-serif font-normal italic text-[#8FD3BE]">com um sim.</span></h1>
         <p className="mt-6 max-w-3xl text-lg leading-8 text-[#C3D0CC]">Relatos de pessoas que passaram pela mentoria ou compartilharam experiências com a comunidade. Cada trajetória é única e tem seu próprio ritmo.</p>
         <Link href="/planos" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#8FD3BE] px-7 font-semibold text-[#10221c] hover:bg-[#C6F0E2]">Conhecer os planos</Link>
       </div>
     </section>
     <section id="depoimentos-linkedin" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
       <div className="flex flex-wrap items-end justify-between gap-6">
         <div><p className="text-sm font-semibold text-[#8FD3BE]">Histórias compartilhadas</p><h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-5xl">Relatos publicados <span className="font-serif font-normal italic text-[#8FD3BE]">no LinkedIn.</span></h2></div>
         <p className="max-w-sm text-sm leading-7 text-[#A9BAB5]">Posts originais, com acesso direto à publicação. Nenhum resultado é garantia de contratação ou promoção.</p>
       </div>
       <div className="mt-9 grid items-stretch gap-5 md:grid-cols-3">
         {depoimentos.map(item=><a key={item.nome} href={item.href} target="_blank" rel="noopener noreferrer"
           className="flex flex-col rounded-3xl border border-[#395649] bg-[#1B312B] p-6 transition-transform hover:-translate-y-1 hover:border-[#8FD3BE]">
           <span className="text-4xl font-serif italic text-[#8FD3BE]" aria-hidden="true">“</span>
           <p className="mt-3 flex-1 text-base leading-7 text-[#EEF3F1]">{item.texto}</p>
           <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-6">
             <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#305845] font-bold text-[#C6F0E2]">{item.iniciais}</span>
             <span><strong className="block text-sm text-white">{item.nome}</strong><span className="mt-1 block text-xs text-[#A9BAB5]">{item.cargo}</span></span>
           </div>
           <span className="mt-4 text-xs font-semibold text-[#8FD3BE]">Ver publicação no LinkedIn ↗</span>
         </a>)}
       </div>
     </section>
     <div className="soma-redesign-stories"><SomaSuccessStories completo /></div>
     <SomaSiteCallToAction title="A próxima história pode ser a sua."/>
   </main>
   <SomaSiteFooter/>
 </div>;
}
