'use client';
import { SomaSiteHeader, SomaSiteFooter } from '@/components/public/SomaMarketingChrome';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import CaseVideoShowcase from '@/components/public/CaseVideoShowcase';
import { ArrowRight, ArrowLeft, Quote, BookOpen, Users, BriefcaseBusiness } from 'lucide-react';

const copy={
 'pt-BR':{
  kicker:'Cases SOMA · Histórias de carreira', title:'Experiências reais. Próximos passos possíveis.',
  subtitle:'Recolocação, transição e crescimento profissional contados por pessoas que utilizaram a mentoria ou compartilharam experiências com a comunidade.',
  cta:'Conhecer os planos', back:'Voltar à página inicial', read:'Explorar os relatos', section:'O que mudou na trajetória',
  steps:['Desafio','Caminho construído','Relato compartilhado'],
  stories:[
   {kind:'Recolocação',title:'Do processo seletivo à conquista da vaga',challenge:'Retomar a busca por trabalho com clareza e preparação para processos seletivos.',path:'Organização da estratégia de carreira e preparação para candidaturas.',quote:'Queria avisar que passei no processo seletivo, depois de 2 meses buscando emprego. Venci a Gupy.',name:'Nathalia Ferlin'},
   {kind:'LinkedIn',title:'Posicionamento para voltar ao mercado',challenge:'Tornar a experiência profissional mais clara e visível no LinkedIn.',path:'Reestruturação do perfil e presença mais ativa na rede.',quote:'Depois de reestruturar melhor meu perfil do LinkedIn e ser mais ativo, consegui me recolocar de volta no mercado.',name:'Henrique Silva'},
   {kind:'Entrevistas',title:'Mais preparo para contar a própria história',challenge:'Comunicar experiências e resultados com segurança durante entrevistas.',path:'Prática guiada para construir narrativas profissionais.',quote:'Com uma metodologia simples e assertiva minha performance nas entrevistas evoluiu consideravelmente.',name:'Paulo Cézar Silveira'},
  ],note:'Relatos compartilhados com autorização. As falas são mantidas no idioma original. Resultados individuais não garantem contratações ou aprovações.',
 },
 en:{
  kicker:'SOMA stories · Real career journeys', title:'Real experiences. Meaningful next steps.',
  subtitle:'Job searches, career changes and professional growth through stories from people who joined the mentorship or shared their experience with the community.',
  cta:'Explore plans',back:'Back to home',read:'Explore stories',section:'What changed along the way',
  steps:['Challenge','Approach','Original testimonial'],
  stories:[
   {kind:'Job search',title:'From application to a job offer',challenge:'Return to the job market with more structure and interview preparation.',path:'A clearer career strategy and stronger application preparation.',quote:'Queria avisar que passei no processo seletivo, depois de 2 meses buscando emprego. Venci a Gupy.',name:'Nathalia Ferlin'},
   {kind:'LinkedIn',title:'A stronger professional presence',challenge:'Communicate professional experience clearly on LinkedIn.',path:'A reworked profile and more consistent activity.',quote:'Depois de reestruturar melhor meu perfil do LinkedIn e ser mais ativo, consegui me recolocar de volta no mercado.',name:'Henrique Silva'},
   {kind:'Interviews',title:'Tell your career story with confidence',challenge:'Present professional experience and results during interviews.',path:'Guided practice to structure professional stories.',quote:'Com uma metodologia simples e assertiva minha performance nas entrevistas evoluiu consideravelmente.',name:'Paulo Cézar Silveira'},
  ],note:'Testimonials are shared with permission and kept in their original language. Individual outcomes do not guarantee employment or offers.',
 },
 'es-419':{
  kicker:'Casos SOMA · Historias profesionales', title:'Experiencias reales. Nuevos pasos posibles.',
  subtitle:'Búsqueda de empleo, transición y crecimiento profesional en historias de personas que participaron en la mentoría o compartieron experiencias con la comunidad.',
  cta:'Conocer los planes',back:'Volver al inicio',read:'Explorar historias',section:'Qué cambió en su trayectoria',
  steps:['Desafío','Camino recorrido','Testimonio original'],
  stories:[
   {kind:'Reinserción laboral',title:'Del proceso de selección a una nueva oportunidad',challenge:'Volver a buscar empleo con claridad y preparación.',path:'Organización de la estrategia profesional y preparación para postulaciones.',quote:'Queria avisar que passei no processo seletivo, depois de 2 meses buscando emprego. Venci a Gupy.',name:'Nathalia Ferlin'},
   {kind:'LinkedIn',title:'Mejor posicionamiento profesional',challenge:'Comunicar mejor la experiencia laboral en LinkedIn.',path:'Actualización del perfil y participación más activa en la red.',quote:'Depois de reestruturar melhor meu perfil do LinkedIn e ser mais ativo, consegui me recolocar de volta no mercado.',name:'Henrique Silva'},
   {kind:'Entrevistas',title:'Más seguridad al contar la propia historia',challenge:'Presentar experiencia y resultados en entrevistas.',path:'Práctica guiada para estructurar historias profesionales.',quote:'Com uma metodologia simples e assertiva minha performance nas entrevistas evoluiu consideravelmente.',name:'Paulo Cézar Silveira'},
  ],note:'Los testimonios se comparten con autorización y se conservan en su idioma original. Los resultados individuales no garantizan contrataciones.',
 }
} as const;
export default function CasesPage(){
 const {locale}=useLocale(); const t=copy[locale];
 return <div className="soma-marketing min-h-screen bg-[#0F1A18] text-[#EEF3F1]"><SomaSiteHeader active="/cases"/><main className="min-h-screen bg-[#0F1A18] text-[#EEF3F1]">
  
  <section className="border-b border-[#365246] bg-[#10261F] px-5 py-16 text-white md:py-24">
   <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CE2D0]">{t.kicker}</p>
    <h1 className="mt-5 max-w-4xl font-display text-4xl leading-tight md:text-6xl">{t.title}</h1>
    <p className="mt-6 max-w-2xl text-base leading-8 text-[#D2E4DD]">{t.subtitle}</p>
    <a href="#historias" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#B6EDDB] px-6 py-3 text-sm font-semibold text-[#10261F]">{t.read}<ArrowRight size={17}/></a>
   </div>
  </section>
  <section id="historias" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-12 md:py-20">
   <div className="mb-8 flex items-center gap-3"><BookOpen className="text-[#8FD3BE]"/><h2 className="font-display text-2xl md:text-3xl">{t.section}</h2></div>
   <div className="grid gap-6 lg:grid-cols-3">
    {t.stories.map((s,i)=><article key={s.name} className="flex flex-col rounded-2xl border border-[#365246] bg-[#1B312B] p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#0D8071]">{s.kind}</p><h3 className="mt-4 min-h-[4.5rem] font-display text-2xl leading-tight">{s.title}</h3>
      <div className="mt-6 space-y-5 text-sm leading-6">
       <div><p className="mb-1 font-semibold text-[#0D8071]">01 · {t.steps[0]}</p><p>{s.challenge}</p></div>
       <div><p className="mb-1 font-semibold text-[#0D8071]">02 · {t.steps[1]}</p><p>{s.path}</p></div>
       <div><p className="mb-2 flex items-center gap-2 font-semibold text-[#0D8071]"><Quote size={15}/>03 · {t.steps[2]}</p>
       <blockquote lang="pt-BR" className="rounded-xl bg-[#264437] p-4 italic text-[#EEF3F1]">“{s.quote}”</blockquote><p className="mt-2 font-semibold">{s.name}</p></div>
      </div>
     </article>)}
   </div>
   <p className="mt-8 max-w-4xl text-xs leading-6 text-[#A9BAB5]">{t.note}</p>
  </section>
  <CaseVideoShowcase />
  <section className="bg-[#1B312B] px-5 py-12"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
    <div className="flex gap-3 text-[#0D8071]"><Users size={24}/><BriefcaseBusiness size={24}/></div>
    <Link href="/planos" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#8FD3BE] px-6 py-3 text-sm font-semibold text-[#10221c]">{t.cta}<ArrowRight size={17}/></Link>
  </div></section>
 </main><SomaSiteFooter/></div>;
}