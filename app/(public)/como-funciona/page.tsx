import Link from 'next/link';
import { SomaSiteHeader, SomaSiteFooter, SomaSiteCallToAction } from '@/components/public/SomaMarketingChrome';
import { SomaInteractiveMethod, SomaInteractiveMoment } from '@/components/public/SomaInteractiveMethod';

const steps = [
  { name:'Entendemos o contexto', detail:'Sua história, valores, forças e o momento em que você está.' },
  { name:'Organizamos a estratégia', detail:'Prioridades, metas claras e as ferramentas certas para o seu caminho.' },
  { name:'Acompanhamos no portal', detail:'Entre um encontro e outro, a jornada fica registrada e evolui com você.' },
];

export default function ComoFuncionaPage() {
  return <div className="min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
    <SomaSiteHeader active="/como-funciona" />
    <main>
      <SomaInteractiveMethod />
      <SomaInteractiveMoment />
      <section className="border-t border-[#22332F] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="max-w-4xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Do primeiro encontro <span className="font-serif font-normal italic text-[#8FD3BE]">em diante.</span>
          </h2>
          <ol className="mt-10 border-t border-[#2B403C]">
            {steps.map((s,i)=><li key={s.name} className="grid items-center gap-3 border-b border-[#2B403C] py-6 sm:py-8 md:grid-cols-[160px_1fr_1fr] md:gap-9">
              <span aria-hidden="true" className="font-display text-7xl font-bold leading-none text-[#2F7D6D] sm:text-8xl">{i+1}</span>
              <h3 className="font-display text-2xl font-semibold sm:text-3xl">{s.name}</h3>
              <p className="text-base leading-7 text-[#A9BAB5] sm:text-lg">{s.detail} {i===2&&<Link href="/portal" className="font-semibold text-[#8FD3BE] hover:underline">Ver o portal</Link>}</p>
            </li>)}
          </ol>
        </div>
      </section>
      <section className="border-t border-[#22332F] px-5 py-16 text-center sm:py-20">
        <blockquote className="mx-auto max-w-4xl font-serif text-3xl italic leading-snug text-[#EEF3F1] sm:text-5xl">
          Humano no que precisa de contexto, <span className="text-[#8FD3BE]">tecnologia no que precisa de continuidade.</span>
        </blockquote>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#A9BAB5]">A IA apoia análises e preparação. A mentoria conecta essas informações ao seu momento real, às decisões de carreira e ao que você consegue sustentar na prática.</p>
      </section>
      <SomaSiteCallToAction />
    </main>
    <SomaSiteFooter />
  </div>;
}
