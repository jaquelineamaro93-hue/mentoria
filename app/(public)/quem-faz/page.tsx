import { SomaSiteHeader, SomaSiteFooter, SomaSiteCallToAction } from '@/components/public/SomaMarketingChrome';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quem faz a SOMA | Jaqueline Amaro',
  description: 'Conheça Jaqueline Amaro, fundadora da SOMA Mentoria. Trajetória em CRM, experiência do cliente, inteligência artificial, liderança e o método de desenvolvimento de carreira da SOMA.',
};

const foto = 'https://drive.google.com/thumbnail?id=1PBOUq65_MSc8HpcRT0oNsqar0W6WPTqP&sz=w1200';

const trajetoria = [
  {
    periodo: '2026',
    empresa: 'Nuvia AI',
    papel: 'Inteligência artificial, CRM e experiência do cliente',
    descricao: 'Atuação em projetos de agentes conversacionais, integrações, automação e capacitação de equipes, conectando desafios reais de negócio com tecnologia aplicada.',
  },
  {
    periodo: '2025 a 2026',
    empresa: 'Volvo Cars, via Casulo Colab',
    papel: 'Gestão de CRM',
    descricao: 'Estruturação de processos, relacionamento com stakeholders e evolução de jornadas digitais para apoiar o relacionamento e o crescimento comercial.',
  },
  {
    periodo: '2024 a 2025',
    empresa: 'Plurix',
    papel: 'CRM e Marketing Cloud no varejo',
    descricao: 'Liderança de iniciativas de segmentação, fidelização, campanhas e inteligência de clientes, conectando dados à experiência de quem compra.',
  },
  {
    periodo: 'Experiências anteriores',
    empresa: 'Gipsyy e CASSI',
    papel: 'Projetos e operações de CRM',
    descricao: 'Desenvolvimento de repertório em jornadas de relacionamento, Salesforce, integração entre equipes e execução orientada a resultados.',
  },
] as const;


export default function QuemFazPage() {
 return <div className="soma-marketing min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
  <SomaSiteHeader active="/quem-faz" />
  <main>
   <section className="border-b border-[#324B40] px-5 py-16 sm:py-24">
    <div className="mx-auto grid max-w-7xl items-center gap-10 sm:px-3 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
      <div>
       <p className="text-sm font-semibold text-[#8FD3BE]">Por trás da SOMA</p>
       <h1 className="mt-4 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">Sou Jaqueline Amaro. Acredito que carreira se constrói com <em className="font-serif font-normal text-[#8FD3BE]">direção e conexões.</em></h1>
       <p className="mt-7 max-w-2xl text-base leading-8 text-[#C3D0CC]">Minha trajetória reúne experiência em CRM, Customer Experience, tecnologia, relacionamento com clientes e projetos de transformação. A SOMA nasceu para conectar essa experiência com acompanhamento que respeita a história e o momento de cada pessoa.</p>
       <div className="mt-8 flex flex-wrap gap-3">
         <Link href="/como-funciona" className="inline-flex min-h-12 items-center rounded-full border border-[#8FD3BE] px-6 font-semibold text-[#8FD3BE] hover:bg-[#234D3E]">Conheça o método</Link>
         <Link href="/planos" className="inline-flex min-h-12 items-center rounded-full bg-[#8FD3BE] px-6 font-semibold text-[#10221c] hover:bg-[#C6F0E2]">Ver planos</Link>
       </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-[#315443] bg-[#18342C] p-3">
       {/* eslint-disable-next-line @next/next/no-img-element */}
       <img src={foto} alt="Jaqueline Amaro, fundadora da SOMA" referrerPolicy="no-referrer" className="aspect-[4/5] w-full rounded-2xl object-cover object-top"/>
      </div>
    </div>
   </section>
   <section className="border-b border-[#324B40] px-5 py-14 sm:py-20">
     <div className="mx-auto max-w-7xl sm:px-3">
       <p className="text-sm font-semibold text-[#8FD3BE]">Minha trajetória</p>
       <h2 className="mt-4 max-w-4xl font-display text-4xl font-semibold sm:text-5xl">Uma carreira que une <em className="font-serif font-normal text-[#8FD3BE]">tecnologia e pessoas.</em></h2>
       <div className="mt-10 border-t border-[#355548]">
       {trajetoria.map((item,i)=><div key={item.empresa} className="grid gap-4 border-b border-[#355548] py-7 sm:grid-cols-[.8fr_1.25fr_2fr] sm:gap-9">
         <span className="text-sm font-semibold text-[#8FD3BE]">{item.periodo}</span>
         <div><h3 className="font-display text-xl font-semibold">{item.empresa}</h3><p className="mt-2 text-sm text-[#C3D0CC]">{item.papel}</p></div>
         <p className="text-sm leading-7 text-[#A9BAB5]">{item.descricao}</p>
       </div>)}
       </div>
     </div>
   </section>
   <section className="border-b border-[#324B40] px-5 py-16 sm:py-20">
    <div className="mx-auto max-w-5xl text-center">
     <p className="text-sm font-semibold text-[#8FD3BE]">Por que a SOMA existe</p>
     <h2 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-6xl">Sua carreira é maior do que <em className="font-serif font-normal text-[#8FD3BE]">o cargo que você ocupa.</em></h2>
     <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#C3D0CC]">Criei a SOMA para reunir autoconhecimento, planejamento, conexões e ferramentas práticas. Não é sobre fórmulas prontas, mas sobre reconhecer a própria história e fazer escolhas de carreira com intenção.</p>
    </div>
   </section>
   <SomaSiteCallToAction title="Sua jornada merece novas possibilidades"/>
  </main>
  <SomaSiteFooter />
 </div>;
}
