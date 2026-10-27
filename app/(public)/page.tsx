import type { Metadata } from 'next';
import Link from 'next/link';
import { SomaSiteHeader, SomaSiteFooter } from '@/components/public/SomaMarketingChrome';
import SomaBrandTicker from '@/components/public/SomaBrandTicker';

export const metadata: Metadata = {
  title: 'SOMA Mentoria | Clareza vira movimento',
  description: 'Mentoria de carreira, acompanhamento humano e portal de desenvolvimento. Sua história, seu momento e seus próximos passos.'
};

const quoteCards = [
  {
    tag: 'LinkedIn e recolocação',
    text: 'Depois de reestruturar meu perfil do LinkedIn e ser mais ativo, consegui me recolocar no mercado.',
    name: 'Henrique Silva',
    moment: 'Nova oportunidade',
  },
  {
    tag: 'Entrevistas',
    text: 'Com uma metodologia simples e assertiva minha performance nas entrevistas evoluiu consideravelmente.',
    name: 'Paulo Cézar Silveira',
    moment: 'Evolução em entrevistas',
  },
  {
    tag: 'Transição de carreira',
    text: 'Depois de algumas entrevistas consegui minha transição. Venci a Gupy.',
    name: 'Jéssica Carolina',
    moment: 'Transição profissional',
  },
];

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g,'') || '';
const whatsappHref = whatsapp
  ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá, quero saber mais sobre a SOMA Mentoria')}`
  : 'mailto:consultoria@camarocrm.com?subject=Dúvida%20sobre%20SOMA%20Mentoria';

export default function HomePage() {
 return <div className="soma-marketing min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
  <SomaSiteHeader active="/" />
  <main>
    {/* Hero: original Direção B, sem foto nem módulos extras ao lado */}
    <section className="relative isolate overflow-hidden border-b border-[#22332F]">
      <div aria-hidden="true" className="soma-home-blob-one pointer-events-none absolute -right-40 -top-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,rgba(47,125,109,.55),transparent_65%)]"/>
      <div aria-hidden="true" className="soma-home-blob-two pointer-events-none absolute -bottom-[340px] left-[18%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(181,83,44,.32),transparent_65%)]"/>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-7 px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-[88px]">
        <p className="text-sm font-semibold text-[#8FD3BE]">Mentoria de carreira + portal de acompanhamento</p>
        <h1 className="max-w-6xl font-display text-[clamp(3.9rem,10.4vw,8rem)] font-bold leading-[.9] tracking-[-.045em]">
          Clareza vira<br/>
          <span className="font-serif font-normal italic tracking-[-.02em] text-[#8FD3BE]">movimento.</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-8 lg:gap-16">
          <p className="max-w-[27em] text-lg leading-[1.65] text-[#C3D0CC] sm:text-xl">Entenda seu momento, escolha uma direção e siga com um portal que guarda o que você descobriu, decidiu e precisa fazer, para crescer na empresa ou mudar de rota.</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2.5">
              <Link href="/planos" className="inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#8FD3BE] px-7 text-base font-semibold text-[#0F1A18] transition-colors hover:bg-[#C6F0E2]">Ver planos</Link>
              <a href={whatsappHref} target={whatsapp?'_blank':undefined} rel={whatsapp?'noopener noreferrer':undefined} className="inline-flex min-h-[58px] items-center justify-center rounded-full border border-[#3C5550] px-6 text-base text-[#EEF3F1] transition-colors hover:border-[#8FD3BE]">{whatsapp?'WhatsApp':'Fale com a SOMA'}</a>
            </div>
            <span className="text-sm text-[#93A6A1]">Veja os valores atualizados de cada modalidade nos planos</span>
          </div>
        </div>
      </div>
    </section>

    <SomaBrandTicker />

    {/* Quem faz a SOMA: texto à esquerda e retrato real circular à direita */}
    <section aria-labelledby="quem-faz-home" className="mx-auto flex max-w-7xl flex-wrap items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:gap-14">
      <div className="min-w-0 flex-[1_1_460px]">
        <p className="text-sm font-semibold text-[#8FD3BE]">Quem faz a SOMA</p>
        <h2 id="quem-faz-home" className="mt-5 max-w-2xl font-display text-[clamp(2.65rem,4.4vw,3.5rem)] font-bold leading-[1.02] tracking-[-.03em]">
          Experiência de mercado, escuta e <span className="font-serif font-normal italic">estratégia para a sua carreira.</span>
        </h2>
        <p className="mt-6 max-w-[36em] text-base leading-[1.7] text-[#C3D0CC] sm:text-lg">Sou Jaqueline Amaro, especialista em CRM, Customer Experience e Inteligência Artificial, com experiência em relacionamento com clientes, tecnologia e liderança de projetos. Criei a SOMA em 2022 para conectar o que aprendi na prática com um acompanhamento que respeita a trajetória e o momento de cada pessoa. Sem fórmulas prontas.</p>
        <div className="mt-7 grid grid-cols-3 border-t border-[#2B403C]">
          <div className="min-w-0 py-4 pr-2">
            <strong className="block font-serif text-3xl font-normal italic leading-none text-[#8FD3BE] sm:text-[40px]">15 anos</strong>
            <span className="mt-2 block text-xs text-[#A9BAB5] sm:text-sm">em CRM, CX e negócios</span>
          </div>
          <div className="min-w-0 border-l border-[#2B403C] px-3 py-4 sm:px-4">
            <strong className="block font-serif text-3xl font-normal italic leading-none text-[#8FD3BE] sm:text-[40px]">MBA</strong>
            <span className="mt-2 block text-xs text-[#A9BAB5] sm:text-sm">em Customer Experience</span>
          </div>
          <div className="min-w-0 border-l border-[#2B403C] py-4 pl-3 sm:pl-4">
            <strong className="block font-serif text-3xl font-normal italic leading-none text-[#8FD3BE] sm:text-[40px]">2022</strong>
            <span className="mt-2 block text-xs text-[#A9BAB5] sm:text-sm">início da SOMA</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-[#8FD3BE]">
          <Link href="/como-funciona" className="hover:text-white">Conheça o método →</Link>
          <Link href="/portal" className="hover:text-white">Veja o portal por dentro →</Link>
          <Link href="/quem-faz" className="hover:text-white">Conheça minha trajetória →</Link>
        </div>
      </div>
      <div className="mx-auto flex min-w-0 flex-[1_1_360px] justify-center">
        <div className="relative aspect-square w-full max-w-[440px] rounded-full border border-[#2F5A50] p-3 sm:p-[22px]">
          {/* Foto real já aprovada para a seção institucional */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://drive.google.com/thumbnail?id=1PBOUq65_MSc8HpcRT0oNsqar0W6WPTqP&sz=w1200" alt="Jaqueline Amaro, fundadora da SOMA" referrerPolicy="no-referrer" loading="lazy" decoding="async" className="aspect-square h-full w-full rounded-full object-cover object-[center_20%]"/>
          <span className="absolute bottom-5 right-0 max-w-[80%] rounded-full bg-[#8FD3BE] px-4 py-2 text-center text-xs font-semibold text-[#0F1A18] sm:bottom-9 sm:text-sm">Jaqueline Amaro · fundadora</span>
        </div>
      </div>
    </section>

    {/* Colagem com UMA imagem e depoimento na mesma seção, sem um segundo mosaico */}
    <section aria-label="Encontros e conexões da SOMA" className="relative isolate overflow-hidden bg-[#0F1A18]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/soma-network-collage.webp" alt="Encontros, palestras e rodas de conversa da comunidade SOMA" className="block h-auto w-full object-contain"/>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F1A18]/95 via-[#0F1A18]/55 to-transparent"/>
      <figure className="absolute inset-x-0 bottom-0 mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5 pb-4 sm:gap-6 sm:px-8 sm:pb-12">
        <blockquote className="max-w-[23em] font-display text-[clamp(1.4rem,3.4vw,2.75rem)] font-semibold leading-[1.06] tracking-[-.02em]">“Passei no processo seletivo depois de 2 meses buscando emprego. <span className="font-serif font-normal italic text-[#8FD3BE]">Venci a Gupy.”</span></blockquote>
        <figcaption className="text-sm"><strong className="block font-semibold">Nathalia Ferlin</strong><span className="mt-1 block text-[#A9BAB5]">Recolocação profissional</span></figcaption>
      </figure>
    </section>

    {/* Apenas as três histórias presentes no HTML aprovado; histórico completo permanece em Depoimentos */}
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-[72px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 className="max-w-[23em] font-display text-4xl font-bold leading-[1.03] tracking-[-.03em] sm:text-5xl">O próximo capítulo pode começar com um <span className="font-serif font-normal italic text-[#8FD3BE]">sim.</span></h2>
        <Link href="/depoimentos" className="text-sm font-semibold text-[#8FD3BE] hover:text-white">Ver as histórias →</Link>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {quoteCards.map(item=><figure key={item.name} className="flex h-full flex-col gap-4 rounded-[20px] border border-[#2B403C] bg-[#162522] p-6">
          <span className="self-start rounded-full border border-[#2F5A50] px-3 py-1 text-xs font-semibold text-[#8FD3BE]">{item.tag}</span>
          <blockquote className="flex-1 font-serif text-2xl italic leading-[1.3] text-[#EEF3F1]">“{item.text}”</blockquote>
          <figcaption className="mt-auto text-sm"><strong className="block">{item.name}</strong><span className="text-[#A9BAB5]">{item.moment}</span></figcaption>
        </figure>)}
      </div>
    </section>

    <section className="border-t border-[#22332F]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 py-14 sm:px-8 sm:py-16">
        <h2 className="max-w-4xl font-display text-4xl font-bold leading-[.98] tracking-[-.035em] sm:text-6xl">É o momento de <span className="font-serif font-normal italic text-[#8FD3BE]">somar suas forças.</span></h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/planos" className="inline-flex min-h-[58px] items-center rounded-full bg-[#8FD3BE] px-7 font-semibold text-[#0F1A18] hover:bg-[#C6F0E2]">Ver planos e começar</Link>
          <a href={whatsappHref} target={whatsapp?'_blank':undefined} rel={whatsapp?'noopener noreferrer':undefined} className="inline-flex min-h-[58px] items-center rounded-full border border-[#3C5550] px-6 text-[#EEF3F1] hover:border-[#8FD3BE]">{whatsapp?'WhatsApp':'Fale com a SOMA'}</a>
        </div>
      </div>
    </section>
  </main>
  <SomaSiteFooter />
 </div>;
}
