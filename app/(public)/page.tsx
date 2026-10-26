import { Metadata } from 'next';
import Link from 'next/link';
import { Menu, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoMentoria } from '@/lib/types';
import SomaProductShowcase from '@/components/public/SomaProductShowcase';
import SomaSuccessStories from '@/components/public/SomaSuccessStories';
import SomaNetworking from '@/components/public/SomaNetworking';
import LocalizedText from '@/components/LocalizedText';
import { LanguageSwitcher } from '@/components/LocaleProvider';

export const metadata: Metadata = {
  title: 'SOMA Mentoria - Transforme sua Carreira',
  description: 'Mentoria de carreira com acompanhamento humano e portal próprio para autoconhecimento, crescimento na empresa, currículo, vagas, LinkedIn, entrevistas e plano de desenvolvimento.',
};

const PILARES_SOMA = [
  {
    letra: 'S',
    titulo: 'Sabedoria Interna',
    texto: 'A base de tudo é o acesso à sua verdade. Identificar seus diferenciais únicos e silenciar o ruído externo para ouvir o que sua trajetória e seus valores dizem sobre o seu próximo passo.',
  },
  {
    letra: 'O',
    titulo: 'Objetividade Magnética',
    texto: 'Ter propósito sem direção é apenas sonho. Transformamos sua essência em metas claras, com uma estratégia que atrai as oportunidades certas porque você sabe exatamente o que está buscando.',
  },
  {
    letra: 'M',
    titulo: 'Maestria em Ação',
    texto: 'O conhecimento só se torna poder quando aplicado. Excelência na execução, refinamento das suas habilidades e coragem de agir com autoridade e presença no mercado.',
  },
  {
    letra: 'A',
    titulo: 'Alquimia de Resultados',
    texto: 'Onde a estratégia encontra a realização. O estágio de colheita e expansão, onde você transforma desafios em crescimento contínuo e sustenta o sucesso com equilíbrio e propósito.',
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: planosRaw } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true });

  const planos = (planosRaw ?? []).filter((p: PlanoMentoria) => Number(p.preco_avista) >= 100);

  const whatsappMessage = encodeURIComponent(
    'Olá, vim pelo site da SOMA Mentoria e gostaria de tirar algumas dúvidas.'
  );
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '');
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2D2D2D' }}>
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between gap-3 lg:gap-6">
          <a href="#topo" className="font-display text-lg sm:text-2xl text-white whitespace-nowrap">SOMA Mentoria</a>
          <nav aria-label="Navegação principal da SOMA" className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-6 text-sm text-white/75">
            <Link href="/como-funciona" className="hover:text-white transition-colors"><LocalizedText text={"Como funciona"} /></Link>
            <a href="#portal" className="hover:text-white transition-colors"><LocalizedText text={"Portal"} /></a>
            <a href="#rede-soma" className="hover:text-white transition-colors"><LocalizedText text={"Rede SOMA"} /></a>
            <Link href="/depoimentos" className="hover:text-white transition-colors"><LocalizedText text={"Depoimentos"} /></Link>
            <Link href="/cases" className="hover:text-white transition-colors"><LocalizedText text={"Cases"} /></Link>
            <a href="#planos" className="hover:text-white transition-colors"><LocalizedText text={"Planos"} /></a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <details className="group relative lg:hidden">
              <summary aria-label="Abrir menu da SOMA" className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-white/25 px-2.5 text-xs font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
                <Menu size={18} aria-hidden="true" />
                <span className="hidden sm:inline"><LocalizedText text={"Menu"} /></span>
              </summary>
              <nav aria-label="Navegação móvel da SOMA" className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col gap-1 rounded-xl border border-white/15 bg-[#1A1A1A] p-2 shadow-2xl">
                <Link href="/como-funciona" className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"><LocalizedText text={"Como funciona"} /></Link>
                <a href="#portal" className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"><LocalizedText text={"Portal"} /></a>
                <a href="#rede-soma" className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"><LocalizedText text={"Rede SOMA"} /></a>
                <Link href="/depoimentos" className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"><LocalizedText text={"Depoimentos no LinkedIn"} /></Link>
                <Link href="/cases" className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"><LocalizedText text={"Cases"} /></Link>
                <a href="#planos" className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"><LocalizedText text={"Planos"} /></a>
              </nav>
            </details>
            <Link href="/login" className="text-white hover:text-white opacity-90 font-medium text-xs sm:text-sm">
              Entrar
            </Link>
            <Link
              href="/planos"
              className="px-3 sm:px-5 py-2.5 rounded-lg font-medium transition-colors hover:opacity-90 text-xs sm:text-sm text-white whitespace-nowrap"
              style={{ backgroundColor: '#0D8071' }}
            >
              Começar
            </Link>
            <LanguageSwitcher placement="inline" />
          </div>
        </div>
      </header>

      {/* Hero — mesma estrutura aprovada, agora com colagem real das 10 fotos */}
      <section
        id="topo"
        className="relative isolate overflow-hidden w-full px-4 sm:px-6 py-14 sm:py-18 md:py-24 text-center text-white"
        style={{ backgroundColor: '#101513' }}
      >
        {/* Usa a montagem original inteira como fundo; sem alterar a foto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/api/hero-collage?v=20261002-2')",
          }}
        />
        {/* O efeito escuro vem somente deste overlay, como nas referências enviadas. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-black/60"
        />
        <div className="relative z-20 mx-auto w-full max-w-[1120px]">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: '#55C9B9' }}>
            <LocalizedText text={"Mentoria de carreira + portal de acompanhamento"} />
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.04] mb-5 sm:mb-6">
            <LocalizedText text={"Entenda seu momento. Escolha uma direção. Transforme clareza em movimento."} />
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-7 sm:mb-8 max-w-3xl mx-auto text-white/80 leading-relaxed"><LocalizedText text={"A SOMA une autoconhecimento, estratégia e execução para quem quer crescer na empresa, buscar uma nova oportunidade ou simplesmente parar de tomar decisões de carreira no escuro. E o portal mantém sua jornada organizada entre um encontro e outro."} /></p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#portal"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: '#0D8071' }}
            >
              <LocalizedText text={"Ver a SOMA por dentro"} />
            </a>
            <Link
              href="/planos"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-lg border border-white/25 text-white font-medium hover:bg-white/5 transition-colors"
            >
              <LocalizedText text={"Ver planos"} />
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg border border-white/25 text-white font-medium hover:bg-white/5 transition-colors"
            >
              <MessageCircle size={18} />
              Tirar dúvidas
            </a>
          </div>

          <p className="mt-5 text-xs text-white/45">
            <LocalizedText text={"Portal do mentorado · acompanhamento humano · ferramentas práticas de carreira"} />
          </p>
        </div>
      </section>

      {/* Para qual momento */}
      <section className="bg-white py-12 sm:py-16 border-b border-gray-faint">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] mb-3 text-mint-deep"><LocalizedText text={"Seu momento importa"} /></p>
            <h3 className="font-display text-3xl md:text-4xl text-black">
              <LocalizedText text={"A mesma carreira pode pedir estratégias completamente diferentes."} />
            </h3>
            <p className="mt-4 text-gray-text leading-relaxed"><LocalizedText text={"Por isso a SOMA não coloca todo mundo no mesmo caminho. Primeiro entendemos o contexto, depois organizamos a estratégia e as ferramentas certas para ele."} /></p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-gray-faint p-6 transition-transform duration-200 hover:-translate-y-1">
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[#0D8071]/30 bg-[#0D8071]/[0.07] px-2 text-[11px] font-semibold tracking-[0.14em] text-[#0D8071]">01</span>
              <h4 className="font-display text-xl text-black mt-4"><LocalizedText text={"Quero crescer onde estou"} /></h4>
              <p className="text-sm text-gray-text mt-2 leading-relaxed">
                <LocalizedText text={"Leitura de cenário, primeiros 90 dias, posicionamento interno e plano de desenvolvimento."} />
              </p>
            </div>
            <div className="rounded-2xl border border-gray-faint p-6 transition-transform duration-200 hover:-translate-y-1">
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[#8E3F4A]/25 bg-[#8E3F4A]/[0.06] px-2 text-[11px] font-semibold tracking-[0.14em] text-[#8E3F4A]">02</span>
              <h4 className="font-display text-xl text-black mt-4"><LocalizedText text={"Quero uma nova oportunidade"} /></h4>
              <p className="text-sm text-gray-text mt-2 leading-relaxed">
                <LocalizedText text={"Currículo, Gupy & ATS, LinkedIn, networking, vagas, candidaturas e entrevistas."} />
              </p>
            </div>
            <div className="rounded-2xl border border-gray-faint p-6 transition-transform duration-200 hover:-translate-y-1">
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[#8A4B1D]/25 bg-[#8A4B1D]/[0.06] px-2 text-[11px] font-semibold tracking-[0.14em] text-[#8A4B1D]">03</span>
              <h4 className="font-display text-xl text-black mt-4"><LocalizedText text={"Ainda preciso entender minha direção"} /></h4>
              <p className="text-sm text-gray-text mt-2 leading-relaxed">
                <LocalizedText text={"Mapa Quem Sou Eu, diagnóstico, forças, diário e acompanhamento para sair da dúvida com contexto."} />
              </p>
            </div>
          </div>
        </div>
      </section>

      <SomaProductShowcase />

      {/* Prova social real, relatos sem nomes ou prints privados */}
      <SomaNetworking />
      <SomaSuccessStories />

      {/* Sobre a mentora — compacto e horizontal */}
      <section className="bg-white py-14" style={{ borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: '#0D8071' }}><LocalizedText text={"Sobre a mentora"} /></p>
              <h3 className="font-display text-3xl mb-4" style={{ color: '#1A1A1A' }}>Jaqueline Amaro</h3>
              <div className="leading-relaxed space-y-3 max-w-3xl" style={{ color: '#808080' }}>
                <p>Administradora e Head de CRM, com trajetória na intersecção entre dados, tecnologia e negócios e passagens por empresas como Banco do Brasil, Loft, Ansell e Guanabara Rodoviário.</p>
                <p><LocalizedText text={"Na SOMA, transforma essa vivência em orientação prática para quem precisa ganhar clareza, se posicionar melhor e transformar estratégia em movimento de carreira."} /></p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-faint bg-[#f7f9fb] p-6">
              <div className="flex items-center gap-4">
                <img src="https://lh3.googleusercontent.com/a/ACg8ocK5UM1XQO5ZsfxXR9UFYwL0AMIwJbtOw8azK85UTGZE2ljwqCzksQ=s192-c" alt="Jaqueline Amaro" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-black"><LocalizedText text={"Jaqueline, a mentora"} /></p>
                  <p className="mt-1 text-sm text-gray-text"><LocalizedText text={"Estratégia de carreira com repertório real de mercado."} /></p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-gray-text sm:grid-cols-3 lg:grid-cols-1">
                <span><LocalizedText text={"Dados + negócios"} /></span>
                <span>Posicionamento + execução</span>
                <span><LocalizedText text={"Mentoria + acompanhamento"} /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOMA Pilares — compacto */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-8">
            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: '#0D8071' }}><LocalizedText text={"A metodologia"} /></p>
            <h3 className="font-display text-3xl mb-3" style={{ color: '#1A1A1A' }}>SOMA: sua totalidade</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#808080' }}><LocalizedText text={"Quatro pilares para integrar autoconhecimento, direção, execução e resultado sem fragmentar sua trajetória."} /></p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILARES_SOMA.map((pilar) => {
              const cores: any = { S: '#0D8071', O: '#B24D5B', M: '#A85D24', A: '#1A1A1A' };
              return (
                <div key={pilar.letra} className="border rounded-2xl p-5 bg-white" style={{ borderColor: '#E8E8E8' }}>
                  <div className="w-9 h-9 rounded-full text-white flex items-center justify-center font-display text-base mb-3" style={{ backgroundColor: cores[pilar.letra] }}>
                    {pilar.letra}
                  </div>
                  <h4 className="font-display text-base mb-2" style={{ color: '#1A1A1A' }}><LocalizedText text={pilar.titulo} /></h4>
                  <p className="text-xs leading-relaxed" style={{ color: '#808080' }}><LocalizedText text={pilar.texto} /></p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Planos — resumo compacto */}
      <section id="planos" className="scroll-mt-24 py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-3 mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: '#0D8071' }}><LocalizedText text={"Planos"} /></p>
              <h3 className="font-display text-3xl" style={{ color: '#1A1A1A' }}><LocalizedText text={"Escolha o tempo da sua jornada."} /></h3>
            </div>
            <p className="max-w-lg text-sm leading-relaxed" style={{ color: '#808080' }}>
              <LocalizedText text={"Formatos online e híbridos. Valores atualizados pela mesma base do checkout."} />
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[6, 12].map((duracao) => {
              const opcoes = planos.filter((plano) => Number(plano.duracao_meses) === duracao);
              const menorPreco = opcoes.length
                ? Math.min(...opcoes.map((plano) => Number(plano.preco_avista)))
                : null;

              return (
                <div key={duracao} className="rounded-2xl border border-gray-faint p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-text">SOMA</p>
                      <h4 className="mt-1 font-display text-2xl text-black">{duracao} meses</h4>
                      <p className="mt-2 text-sm text-gray-text">{duracao === 6 ? 'Movimento e posicionamento' : 'Consistência e alta performance'}</p>
                    </div>
                    {menorPreco !== null && (
                      <div className="text-right">
                        <p className="text-[11px] text-gray-text"><LocalizedText text={"a partir de"} /></p>
                        <p className="font-display text-xl text-black">
                          R$ {menorPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                  <Link href="/planos" className="mt-5 inline-flex items-center text-sm font-semibold text-mint-deep">
                    <LocalizedText text={"Ver formatos e condições →"} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      

      {/* CTA Final — Preto */}
      <section style={{ backgroundColor: '#1A1A1A' }} className="w-full px-6 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mx-auto mb-4 h-px w-12 bg-[#55C9B9]" aria-hidden="true" />
          <h3 className="font-display text-3xl mb-3 text-white"><LocalizedText text={"É o momento de somar suas forças"} /></h3>
          <p className="mb-6 max-w-2xl mx-auto text-white/75"><LocalizedText text={"Clareza para decidir, estratégia para se posicionar e acompanhamento para continuar avançando."} /></p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/planos" className="inline-flex justify-center px-7 py-3.5 rounded-lg font-medium text-white" style={{ backgroundColor: '#0D8071' }}>
              <LocalizedText text={"Ver Planos e Começar"} />
            </Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-white/25 font-medium text-white hover:bg-white/5 transition-colors">
              <MessageCircle size={18} />
              <LocalizedText text={"Falar comigo no WhatsApp"} />
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="cases-teaser-title" className="bg-[#f4f8f5] px-5 py-12 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 rounded-2xl border border-[#cee5d9] bg-white p-7 sm:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0D8071]"><LocalizedText text={"Histórias de carreira"} /></p>
            <h2 id="cases-teaser-title" className="mt-3 font-display text-3xl text-[#13211D]"><LocalizedText text={"Resultados contados por quem viveu a jornada"} /></h2>
            <p className="mt-3 text-sm leading-7 text-[#53675f]"><LocalizedText text={"Recolocação, LinkedIn e entrevistas em relatos reais, com contexto e depoimentos originais."} /></p>
          </div>
          <Link href="/cases" className="inline-flex min-h-11 items-center rounded-lg bg-[#0D8071] px-6 py-3 text-sm font-semibold text-white"><LocalizedText text={"Ver os cases"} /></Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-14 bg-white" style={{ borderTop: '1px solid #E8E8E8' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-4xl text-center text-black mb-2"><LocalizedText text={"Perguntas Frequentes"} /></h2>
          <p className="text-center text-gray-text mb-8 text-base"><LocalizedText text={"Tire suas dúvidas sobre como a mentoria SOMA funciona"} /></p>

          <div className="space-y-4">
            <details className="border border-gray-faint rounded-lg p-5 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span><LocalizedText text={"Como a mentoria SOMA funciona?"} /></span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed"><LocalizedText text={"A mentoria SOMA funciona em dois momentos. Primeiro você tem encontros online onde a gente mapeia quem você é, identifica seus diferenciais e desenha um plano prático de 90 dias. Depois você participa de encontros presenciais em grupo onde a gente trabalha networking, posicionamento profissional e aprende juntos com pessoas que buscam o mesmo nível de excelência que você."} /></p>
            </details>

            <details className="border border-gray-faint rounded-lg p-5 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span><LocalizedText text={"O que eu encontro dentro do portal?"} /></span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed"><LocalizedText text={"O portal organiza sua jornada em três frentes: autoconhecimento, crescimento na empresa e mercado de trabalho. Você encontra diagnóstico, Mapa Quem Sou Eu, diário, PDI, primeiros 90 dias, leitura de cenário, currículo, Gupy & ATS, LinkedIn, acompanhamento de vagas e preparação para entrevistas. As ferramentas são apoio para a mentoria — não substituem o contexto humano dos encontros."} /></p>
            </details>

            <details className="border border-gray-faint rounded-lg p-5 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span><LocalizedText text={"Quanto tempo preciso dedicar à mentoria?"} /></span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed"><LocalizedText text={"Oferecemos planos de 6 meses ou 12 meses conforme sua necessidade. A mentoria se adapta ao seu contexto, seja você começando algo novo, enfrentando uma crise ou buscando fazer as coisas com mais excelência. O tempo depende do quanto você quer evoluir e do quanto está disposto a se dedicar."} /></p>
            </details>

            <details className="border border-gray-faint rounded-lg p-5 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span><LocalizedText text={"Qual é o investimento?"} /></span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed"><LocalizedText text={"A gente oferece flexibilidade total. Você pode pagar à vista com PIX, em uma parcela no cartão ou parcelar ao longo dos meses. Depois que você confirma o pagamento, já ganha acesso ao portal com todos os materiais, agendamento dos encontros e começa a jornada. Tudo fica guardado lá pra você acompanhar seu progresso."} /></p>
            </details>

            <details className="border border-gray-faint rounded-lg p-5 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span><LocalizedText text={"Preciso vir presencialmente?"} /></span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed"><LocalizedText text={"Temos planos 100% online e planos presenciais. Se você não consegue vir pessoalmente, sem problema. Os encontros em grupo podem ser virtuais. O importante é que você realmente quer mudar de patamar na carreira e está aberto pra aprender com quem já passou pelo mesmo que você."} /></p>
            </details>

            <details className="border border-gray-faint rounded-lg p-5 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span><LocalizedText text={"Posso ver quem já fez a mentoria?"} /></span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed"><LocalizedText text={"Com certeza. A página de Depoimentos reúne histórias reais de quem já passou pela SOMA, com links para os relatos completos no LinkedIn. Você acessa essa página pelo menu no topo do site."} /></p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer — Preto */}
      <footer style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2D2D2D' }} className="py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-6">
          <p style={{ color: '#999999' }}><LocalizedText text={"© 2026 SOMA Mentoria. Todos os direitos reservados."} /></p>
          <div className="mt-4 space-x-6">
            <Link href="/termos" style={{ color: '#999999', textDecoration: 'none' }}><LocalizedText text={"Termos"} /></Link>
            <a href="https://instagram.com/jaquedocrm1112" target="_blank" rel="noopener noreferrer" style={{ color: '#999999', textDecoration: 'none' }}>Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
