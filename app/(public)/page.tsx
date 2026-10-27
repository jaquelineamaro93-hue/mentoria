import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SomaNetworking from '@/components/public/SomaNetworking';
import SomaSuccessStories from '@/components/public/SomaSuccessStories';
import { SomaSiteHeader, SomaSiteFooter, SomaSiteCallToAction } from '@/components/public/SomaMarketingChrome';
import type { PlanoMentoria } from '@/lib/types';

export const metadata: Metadata = {
  title: 'SOMA Mentoria | Clareza vira movimento',
  description: 'Mentoria de carreira, networking e portal de acompanhamento para desenvolver seu próximo passo profissional com clareza e estratégia.'
};

const moments=[
  {num:'01',title:'Crescer onde estou',description:'Leitura de cenário, posicionamento e plano de desenvolvimento para avançar com consistência',href:'/como-funciona'},
  {num:'02',title:'Encontrar uma nova oportunidade',description:'Currículo, LinkedIn, candidaturas e preparação para entrevistas com contexto',href:'/portal'},
  {num:'03',title:'Entender minha direção',description:'Autoconhecimento, diagnóstico e estratégia para decidir qual é o próximo passo',href:'/como-funciona'},
];
export default async function HomePage() {
  const db=await createClient();
  const { data: raw }=await db.from('planos_mentoria').select('id,codigo,preco_avista,ativo,visivel_checkout').eq('ativo',true).eq('visivel_checkout',true);
  const planos=(raw || []).filter((x:Pick<PlanoMentoria,'codigo'|'preco_avista'>)=>
    Number(x.preco_avista)>=100&&!x.codigo?.toLowerCase().includes('teste'));
  const minPrice=planos.length?Math.min(...planos.map(x=>Number(x.preco_avista))):null;
  return <div className="soma-marketing min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
    <SomaSiteHeader active="/" />
    <main>
      <section id="topo" className="relative isolate overflow-hidden border-b border-[#2C493E]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-60 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(47,125,109,.33),transparent_67%)]"/>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[-380px] left-[15%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(181,83,44,.18),transparent_67%)]"/>
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div>
            <p className="text-sm font-semibold text-[#8FD3BE]">Mentoria de carreira + portal de acompanhamento</p>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(3.8rem,9vw,8rem)] font-bold leading-[.94] tracking-[-.055em]">Clareza vira <em className="font-serif font-normal italic text-[#8FD3BE]">movimento.</em></h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#C3D0CC]">Entenda seu momento, escolha uma direção e siga com um portal que guarda o que você descobriu, decidiu e precisa fazer para crescer na empresa ou mudar de rota.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/planos" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#8FD3BE] px-7 font-semibold text-[#10221c] transition-colors hover:bg-[#C6F0E2]">Ver planos e começar</Link>
              <Link href="/como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#507467] px-7 font-semibold text-[#EEF3F1] transition-colors hover:border-[#8FD3BE]">Conhecer o método</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#8FD3BE]">
              <Link href="/portal" className="hover:text-white">Veja o portal por dentro</Link>
              <Link href="/rede-soma" className="hover:text-white">Conheça a Rede SOMA</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute inset-3 rounded-full border border-[#31685A]"/>
            <div className="overflow-hidden rounded-full border-[14px] border-[#29443A] bg-[#21362F] p-2">
              {/* Foto real da fundadora, já utilizada no projeto */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://drive.google.com/thumbnail?id=1PBOUq65_MSc8HpcRT0oNsqar0W6WPTqP&sz=w1200"
                alt="Jaqueline Amaro, fundadora da SOMA" className="aspect-square w-full rounded-full object-cover object-top" referrerPolicy="no-referrer" />
            </div>
            <span className="absolute -bottom-2 right-1 rounded-full bg-[#8FD3BE] px-5 py-3 text-sm font-semibold text-[#0F1A18] shadow-lg">Jaqueline Amaro · fundadora</span>
          </div>
        </div>
      </section>

      {/* Uma única faixa de colagem na LP, como na referência original */}
      <section aria-label="Encontros e conexões da SOMA" className="relative overflow-hidden border-b border-[#244036]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/soma-network-collage.webp" alt="Encontros, palestras, mentorias e conexões da rede SOMA" className="block h-auto w-full object-contain" />
      </section>

      <section className="border-b border-[#2B403C] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="text-sm font-semibold text-[#8FD3BE]">Seu próximo capítulo</p>
              <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">Em que momento <span className="font-serif font-normal italic text-[#8FD3BE]">você está?</span></h2></div>
            <Link href="/como-funciona" className="text-sm font-semibold text-[#8FD3BE] hover:text-white">Conheça o método SOMA →</Link>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">{moments.map(item=>
            <Link href={item.href} key={item.num} className="group flex min-h-60 flex-col rounded-3xl border border-[#365446] bg-[#182C24] p-6 transition-colors hover:border-[#8FD3BE] sm:p-8">
              <span className="text-xs font-bold text-[#8FD3BE]">{item.num}</span>
              <h3 className="mt-8 font-display text-2xl font-semibold leading-tight">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#A9BAB5]">{item.description}</p>
              <span className="mt-7 text-sm font-semibold text-[#8FD3BE]">Esse é meu momento ↗</span>
            </Link>)}</div>
        </div>
      </section>

      <section id="portal" className="border-b border-[#2B403C] py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div><p className="text-sm font-semibold text-[#8FD3BE]">Portal SOMA</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">A mentoria não termina quando o encontro <span className="font-serif font-normal italic text-[#8FD3BE]">acaba.</span></h2>
            <p className="mt-5 text-base leading-8 text-[#C3D0CC]">O portal organiza autoconhecimento, plano de desenvolvimento, currículo, vagas e preparação para entrevistas. Sua jornada continua entre um encontro e outro.</p>
            <Link href="/portal" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-[#8FD3BE] px-7 font-semibold text-[#8FD3BE] hover:bg-[#234D3E]">Explorar o portal</Link>
          </div>
          <div className="overflow-hidden rounded-3xl border border-[#355446] bg-[#1B3028] p-6 shadow-2xl">
            <p className="text-xs font-semibold tracking-widest text-[#8FD3BE]">PORTAL DE CARREIRA</p>
            <p className="mt-3 font-display text-2xl font-semibold">Seu próximo passo, com contexto</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {['Autoconhecimento','Plano de desenvolvimento','Currículo e vagas','Entrevistas e networking'].map((x,i)=><div key={x} className="rounded-2xl border border-[#446254] bg-[#254034] p-5"><p className="text-xs text-[#8FD3BE]">0{i+1}</p><p className="mt-3 text-sm font-semibold">{x}</p></div>)}
            </div>
            <p className="mt-5 text-xs leading-6 text-[#A9BAB5]">As ferramentas seguem conectadas ao seu momento profissional</p>
          </div>
        </div>
      </section>

      <section id="quem-faz-home" className="border-b border-[#2B403C] py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-[35px] border border-[#345A49] bg-[#264439] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://drive.google.com/thumbnail?id=1PBOUq65_MSc8HpcRT0oNsqar0W6WPTqP&sz=w1200" alt="Jaqueline Amaro, fundadora da SOMA" loading="lazy" referrerPolicy="no-referrer" className="aspect-[4/5] w-full rounded-[24px] object-cover object-top"/>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#8FD3BE]">Quem faz a SOMA</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">Experiência de mercado, escuta e estratégia <em className="font-serif font-normal text-[#8FD3BE]">para a sua carreira.</em></h2>
            <p className="mt-6 text-base leading-8 text-[#C3D0CC]">Sou Jaqueline Amaro, especialista em CRM, Customer Experience e inteligência artificial, com experiência em relacionamento com clientes, tecnologia e liderança de projetos. Criei a SOMA para transformar orientação em uma jornada concreta, com escuta, método e acompanhamento.</p>
            <Link href="/quem-faz" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-[#8FD3BE] px-7 font-semibold text-[#8FD3BE] hover:bg-[#234D3E]">Conhecer minha trajetória</Link>
          </div>
        </div>
      </section>

      <SomaNetworking />

      <section id="historias-reais" className="border-b border-[#2B403C] py-12 sm:py-18">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div><p className="text-sm font-semibold text-[#8FD3BE]">Histórias reais</p>
              <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">O próximo capítulo pode começar <em className="font-serif font-normal text-[#8FD3BE]">com um sim.</em></h2>
            </div>
            <Link href="/depoimentos" className="text-sm font-semibold text-[#8FD3BE] hover:text-white">Conhecer os depoimentos ↗</Link>
          </div>
        </div>
        <SomaSuccessStories />
      </section>

      <section id="planos" className="border-b border-[#2B403C] py-14 text-center sm:py-20">
        <div className="mx-auto max-w-4xl px-5">
          <p className="text-sm font-semibold text-[#8FD3BE]">SOMA Carreira + SOMA Plataforma</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">Escolha como <span className="font-serif font-normal italic text-[#8FD3BE]">começar.</span></h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#C3D0CC]">Acompanhamento humano ou ferramentas para sua jornada. Veja os formatos, o que está incluído e os valores atualizados.</p>
          {minPrice!==null&&<p className="mt-4 text-sm text-[#A9BAB5]">Mentoria a partir de R$ {minPrice.toLocaleString('pt-BR',{minimumFractionDigits:2})}, de acordo com a modalidade</p>}
          <Link href="/planos" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#8FD3BE] px-8 font-semibold text-[#10221c] hover:bg-[#C6F0E2]">Ver todos os planos</Link>
        </div>
      </section>
      <section className="border-b border-[#2B403C] py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-6 max-w-2xl text-center"><h2 className="font-display text-3xl font-semibold sm:text-4xl">Ainda ficou alguma dúvida?</h2><p className="mt-2 text-sm text-[#C3D0CC]">Três respostas rápidas antes de começar</p></div>
          <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {q:'Quanto tempo preciso dedicar?',a:'O ritmo depende dos seus objetivos. Você avança nas atividades do portal e prioriza o que cabe na sua rotina.'},
              {q:'Preciso participar presencialmente?',a:'Não. Existem formatos online e híbridos. Confira o que está incluído no plano escolhido antes de contratar.'},
              {q:'Posso pausar minha mentoria?',a:'Existe opção de pausa programada de até 60 dias, de acordo com as condições do plano. A pausa não suspende automaticamente cobranças.'},
            ].map(item=><details key={item.q} className="group rounded-2xl border border-[#385749] bg-[#172D24] p-5 open:border-[#8FD3BE]"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-medium [&::-webkit-details-marker]:hidden">{item.q}<span aria-hidden="true" className="text-2xl text-[#8FD3BE] group-open:rotate-45">+</span></summary><p className="mt-3 border-t border-white/10 pt-4 text-sm leading-7 text-[#C3D0CC]">{item.a}</p></details>)}
          </div>
        </div>
      </section>
      <SomaSiteCallToAction/>
    </main>
    <SomaSiteFooter/>
  </div>;
}
