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
  return (
    <main className="min-h-screen bg-[#f8faf8] text-[#183128]">
      <header className="border-b border-[#dfe8e1] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="font-display text-2xl font-semibold text-[#183128]">SOMA Mentoria</Link>
          <nav aria-label="Navegação da página Quem faz" className="flex flex-wrap gap-5 text-sm font-medium text-[#315e4c]">
            <Link href="/" className="hover:underline">Início</Link>
            <Link href="/como-funciona" className="hover:underline">Como funciona</Link>
            <Link href="/planos" className="hover:underline">Planos</Link>
          </nav>
        </div>
      </header>

      <section className="bg-[#e8f0ea] py-14 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0D8071]">Por trás da SOMA</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Sou Jaqueline Amaro. E acredito que carreira se constrói com direção e conexões.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#51675b]">
              Minha trajetória reúne 15 anos de experiência em CRM, Customer Experience e relacionamento com clientes. Trabalhei com tecnologia, varejo e projetos de transformação, liderando iniciativas que exigiam visão de negócio, escuta e capacidade de executar.
            </p>
            <p className="mt-4 max-w-xl text-base leading-8 text-[#51675b]">
              Foi desse repertório que nasceu a SOMA: um espaço para olhar a carreira como um todo, entender o momento de cada pessoa e transformar reflexão em ação, sem perder o lado humano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/como-funciona" className="inline-flex min-h-11 items-center rounded-lg bg-[#0D8071] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0a6459]">Conheça o método SOMA</Link>
              <a href="https://www.linkedin.com/in/jaquelineamaro" target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center rounded-lg border border-[#b6cbbf] px-6 py-3 text-sm font-semibold text-[#225a47] hover:bg-white">Minha trajetória no LinkedIn</a>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[400px]">
            <img src={foto} alt="Retrato profissional de Jaqueline Amaro, fundadora da SOMA Mentoria" referrerPolicy="no-referrer" className="aspect-[3/4] w-full rounded-[28px] border border-[#c7d9ce] object-cover object-top shadow-[0_24px_52px_-36px_rgba(20,55,40,0.4)]" />
            <p className="mt-3 text-xs text-[#63786b]">Fotografia real da fundadora, parte do ensaio profissional.</p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0D8071]">Trajetória</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl leading-tight sm:text-4xl">Experiência que se transforma em repertório para acompanhar pessoas.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-[#60756a]">Alguns capítulos da minha história profissional. Os resultados dessas experiências são parte do meu repertório de mercado, não promessas de resultado para mentorados.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {trajetoria.map((item) => (
              <article key={item.empresa} className="rounded-2xl border border-[#dee9e1] bg-white p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D8071]">{item.periodo}</p>
                <h3 className="mt-3 font-display text-2xl">{item.empresa}</h3>
                <p className="mt-2 text-sm font-semibold text-[#315e4c]">{item.papel}</p>
                <p className="mt-3 leading-7 text-[#60756a]">{item.descricao}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce8e0] bg-white py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0D8071]">Formação e repertório</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Negócios, experiência do cliente e execução.</h2>
            <p className="mt-5 leading-8 text-[#60756a]">
              Minha formação inclui Administração de Empresas, MBA em Customer Experience e estudos em Engenharia de Dados. Essa combinação ajuda a olhar carreira e desenvolvimento com método, análise e sensibilidade para as pessoas envolvidas.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dce8e0] bg-[#f7faf8] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D8071]">Experiência profissional documentada</p>
            <div className="mt-5 grid gap-6">
              <div>
                <p className="font-display text-3xl text-[#185e4e]">15 anos</p>
                <p className="mt-1 text-sm leading-6 text-[#60756a]">em relacionamento com clientes, CX e CRM.</p>
              </div>
              <div className="border-t border-[#dae8de] pt-5">
                <p className="font-display text-3xl text-[#185e4e]">+35%</p>
                <p className="mt-1 text-sm leading-6 text-[#60756a]">em conversão de jornada digital, conforme resultado profissional informado no currículo em projeto da Volvo Cars.</p>
              </div>
              <div className="border-t border-[#dae8de] pt-5">
                <p className="font-display text-3xl text-[#185e4e]">CRM + CX + IA</p>
                <p className="mt-1 text-sm leading-6 text-[#60756a]">experiência conectando estratégia, tecnologia e acompanhamento humano.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#183128] px-4 py-16 text-center text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94d6bb]">Por que a SOMA existe</p>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Sua carreira é maior do que o cargo que você ocupa.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/75">A SOMA foi criada para reunir autoconhecimento, planejamento, conexões e ferramentas práticas. É sobre reconhecer a própria história e fazer escolhas de carreira com intenção.</p>
          <Link href="/planos" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#40ac95] px-7 py-3 font-semibold text-[#102d25] hover:bg-[#5dbba6]">Conhecer os planos da SOMA</Link>
        </div>
      </section>
    </main>
  );
}
