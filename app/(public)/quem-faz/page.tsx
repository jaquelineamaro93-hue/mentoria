import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quem faz a SOMA | Jaqueline Amaro',
  description: 'Conheça a trajetória profissional de Jaqueline Amaro, fundadora da SOMA Mentoria, e como experiência em CRM, CX, liderança, dados e tecnologia se transforma em desenvolvimento de carreira.',
  alternates: { canonical: '/quem-faz' },
};

const experiencia = [
  {
    etapa: 'Tecnologia e inteligência artificial',
    titulo: 'Nuvia AI',
    texto: 'Implementação e evolução de soluções de IA, integração de sistemas e jornadas de relacionamento com o cliente. Experiência na conexão entre tecnologia, times e desafios reais de negócio.',
  },
  {
    etapa: 'Setor automotivo',
    titulo: 'Volvo Cars',
    texto: 'Gestão de CRM, construção de jornadas de clientes e colaboração com áreas de negócio e times multidisciplinares em projetos de relacionamento e conversão.',
  },
  {
    etapa: 'Varejo e relacionamento',
    titulo: 'CRM e Customer Insights',
    texto: 'Estratégias de segmentação, fidelização, automação e análise de dados, sempre conectando resultados de negócio à experiência das pessoas.',
  },
  {
    etapa: 'Carreira e comunidade',
    titulo: 'SOMA Mentoria',
    texto: 'Uma proposta de desenvolvimento que combina repertório profissional, escuta, estratégia e ferramentas práticas para transformar intenção em próximos passos.',
  },
] as const;

export default function QuemFazPage() {
  return (
    <main className="min-h-screen bg-white text-[#172823]">
      <header className="border-b border-[#DDE8E1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight text-[#172823]">
            SOMA Mentoria
          </Link>
          <nav aria-label="Navegação da página Quem faz" className="flex items-center gap-4 text-sm">
            <Link className="text-[#425B50] hover:text-[#0D8071]" href="/">Início</Link>
            <Link className="rounded-lg bg-[#0D8071] px-4 py-2.5 font-semibold text-white hover:bg-[#096A5D]" href="/planos">
              Conhecer planos
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-[#F5F9F6] py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:gap-20">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#0D8071]">A pessoa por trás da SOMA</p>
            <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Antes de falar de carreira, quero falar de pessoas.
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#455E52]">
              Sou Jaqueline Amaro, fundadora da SOMA. Ao longo de 15 anos trabalhando com relacionamento, CRM, Customer Experience e tecnologia, aprendi que nenhuma trajetória se constrói sozinha.
            </p>
            <p className="mt-4 text-base leading-8 text-[#52685D]">
              Foram projetos, times, mudanças de direção e muitas conexões. Esse repertório é o que trago para uma mentoria que começa pela sua história, não por uma fórmula pronta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0D8071] px-6 py-3 text-sm font-semibold text-white hover:bg-[#096A5D]">
                Como funciona a SOMA
              </Link>
              <a href="https://www.linkedin.com/in/jaquelineamaro" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#B9CFC3] px-6 py-3 text-sm font-semibold text-[#1C5846] hover:bg-white">
                Ver trajetória no LinkedIn
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-[28px] bg-[#E8EFEA] shadow-[0_24px_65px_rgba(12,51,36,0.12)]">
            <img
              src="/images/jaqueline-amaro-retrato.svg"
              alt="Fotografia real de Jaqueline Amaro, criadora da SOMA Mentoria"
              width={1024}
              height={1536}
              className="aspect-[4/5] w-full object-cover object-[center_32%]"
            />
            <figcaption className="px-5 py-4 text-xs text-[#607468]">
              Jaqueline Amaro · Fundadora da SOMA Mentoria
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="trajetoria">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D8071]">Repertório real</p>
            <h2 id="trajetoria" className="mt-3 font-display text-3xl sm:text-4xl">Uma trajetória que conecta pessoas, dados e decisões.</h2>
            <p className="mt-4 text-base leading-8 text-[#52685D]">
              Atuei em projetos de tecnologia, varejo e no setor automotivo, com liderança de equipes, estratégias de relacionamento e experiências digitais. A formação em Administração, o MBA em Customer Experience e os estudos em dados ajudaram a construir uma visão multidisciplinar sobre negócios e pessoas.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {experiencia.map(item => (
              <article key={item.titulo} className="rounded-2xl border border-[#DDE9E1] bg-[#FAFCFA] p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0D8071]">{item.etapa}</p>
                <h3 className="mt-3 font-display text-2xl">{item.titulo}</h3>
                <p className="mt-3 text-sm leading-7 text-[#4B6257]">{item.texto}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-[#65766D]">
            As empresas e experiências citadas fazem parte de uma trajetória profissional e não representam parcerias ou endosso à SOMA.
          </p>
        </div>
      </section>

      <section className="border-y border-[#DFEBE3] bg-[#F4F8F5] py-16 sm:py-20" aria-labelledby="metodo">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D8071]">Por que criei a SOMA</p>
              <h2 id="metodo" className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                Porque clareza de carreira não deveria depender de enfrentar tudo sozinho.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#4A6156]">
              <p>
                Construir relacionamentos sempre fez parte do meu trabalho. E percebi que muitos profissionais se dedicam intensamente às entregas, mas nem sempre encontram espaço para cuidar das próprias escolhas, conexões e próximos passos.
              </p>
              <p>
                Na SOMA, autoconhecimento, objetividade, ação e resultados não são partes isoladas. São uma jornada que combina conversa, planejamento e continuidade, apoiada por ferramentas que ajudam a aplicar o que foi construído nos encontros.
              </p>
              <p className="font-medium text-[#1C4F3D]">
                O objetivo é que a pessoa saia com mais autonomia, repertório e direção, sem promessas de emprego ou resultados garantidos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl">Sua carreira também merece atenção.</h2>
          <p className="mt-5 text-base leading-8 text-[#52685D]">Se você está buscando uma nova oportunidade, quer crescer onde está ou precisa entender sua direção, podemos começar pelo seu momento.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/planos" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0D8071] px-7 py-3 font-semibold text-white hover:bg-[#096A5D]">Conhecer a SOMA</Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#BDD2C7] px-7 py-3 font-semibold text-[#1C5846] hover:bg-[#F6F9F7]">Voltar para a página inicial</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
