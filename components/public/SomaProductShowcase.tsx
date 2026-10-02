import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileSearch,
  MessageSquare,
  Target,
} from 'lucide-react';

const MARKET_STEPS = [
  {
    etapa: 'ETAPA 01',
    titulo: 'Analisar currículo',
    texto: 'Compare seu currículo com uma vaga e veja o que fortalecer.',
    icon: FileSearch,
  },
  {
    etapa: 'ETAPA 02',
    titulo: 'Vagas & candidaturas',
    texto: 'Compare oportunidades e acompanhe cada processo seletivo.',
    icon: BriefcaseBusiness,
  },
  {
    etapa: 'ETAPA 03',
    titulo: 'Entrevistas & simulações',
    texto: 'Prepare suas histórias e pratique com feedback da IA.',
    icon: MessageSquare,
  },
];

function BrowserFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-faint bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-2 border-b border-gray-faint bg-[#f7f8fa] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f2a7a7]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f0d38a]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#91d2b8]" />
        <div className="ml-2 rounded-md bg-white px-3 py-1 text-[10px] text-gray-text">
          portal SOMA · {label}
        </div>
      </div>
      {children}
    </div>
  );
}

function MarketPreview() {
  return (
    <BrowserFrame label="mercado de trabalho">
      <div className="bg-[#f7f9fb] p-4 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {MARKET_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.etapa}
                className={[
                  'rounded-xl border bg-white p-4',
                  index === 0 ? 'border-mint-deep bg-[#eef7f5]' : 'border-gray-faint',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef1f4]">
                    <Icon size={17} className={index === 0 ? 'text-mint-deep' : 'text-black'} />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.16em] text-gray-text">{step.etapa}</p>
                    <p className="mt-1 text-sm font-semibold text-black">{step.titulo}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-gray-text">{step.texto}</p>
                <div className="mt-4 border-t border-gray-faint pt-3 text-[11px] text-gray-text">
                  {index === 0 ? 'Análise de fit e currículo' : index === 1 ? 'Funil de oportunidades' : 'SOAR + simulação'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BrowserFrame>
  );
}

function PdiPreview() {
  return (
    <BrowserFrame label="plano de desenvolvimento">
      <div className="bg-[#f7f9fb] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-faint pb-4 text-xs">
          <span className="font-semibold text-black">Perguntas Guia</span>
          <span className="text-gray-text">Plano</span>
          <span className="text-gray-text">Acompanhamento</span>
          <span className="text-gray-text">Evidências</span>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-gray-faint bg-white p-4">
            <p className="text-[10px] tracking-[0.16em] text-mint-deep">SEU PDI</p>
            <p className="mt-2 text-sm font-semibold text-black">Plano que vira rotina</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0f2]">
              <div className="h-full w-2/3 rounded-full bg-mint-deep" />
            </div>
            <p className="mt-2 text-[11px] text-gray-text">Acompanhe ações, evolução e próximos ajustes.</p>
          </div>

          <div className="space-y-2 rounded-xl border border-gray-faint bg-white p-4">
            {[
              'Definir prioridade de desenvolvimento',
              'Transformar meta em ação observável',
              'Revisar avanço no check-in mensal',
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-[#fafbfc] px-3 py-2.5">
                {index < 2 ? (
                  <CheckCircle2 size={16} className="shrink-0 text-mint-deep" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded border border-[#d2d7dc]" />
                )}
                <span className="text-xs text-black">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function SelfKnowledgePreview() {
  return (
    <BrowserFrame label="mapa e diagnóstico">
      <div className="bg-[#f7f9fb] p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-faint bg-white p-4">
            <Compass size={19} className="text-mint-deep" />
            <p className="mt-3 text-sm font-semibold text-black">Quem sou eu</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-text">História, valores, forças e padrões que sustentam suas decisões.</p>
          </div>
          <div className="rounded-xl border border-gray-faint bg-white p-4">
            <BarChart3 size={19} className="text-[#e89b55]" />
            <p className="mt-3 text-sm font-semibold text-black">Diagnóstico</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-text">Leitura estruturada do seu momento e do que precisa ganhar clareza.</p>
          </div>
          <div className="rounded-xl border border-gray-faint bg-white p-4">
            <Target size={19} className="text-[#d9707e]" />
            <p className="mt-3 text-sm font-semibold text-black">Direção</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-text">Transforme autoconhecimento em prioridades e próximos movimentos.</p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

const SHOWCASES = [
  {
    tag: '01 · Clareza',
    titulo: 'Você não começa pela vaga. Começa entendendo o seu momento.',
    texto:
      'O portal organiza autoconhecimento, diagnóstico e direção para que sua estratégia não seja baseada em comparação, ansiedade ou tentativa e erro.',
    bullets: ['Mapa Quem Sou Eu', 'Diagnóstico & Perfil', 'Diário de Bordo e histórico da jornada'],
    preview: <SelfKnowledgePreview />,
  },
  {
    tag: '02 · Crescimento',
    titulo: 'Se o objetivo é crescer onde você está, existe um caminho diferente.',
    texto:
      'Primeiros 90 dias, leitura de cenário e PDI ficam separados das ferramentas de recolocação. Assim você não recebe uma resposta genérica para problemas diferentes.',
    bullets: ['Primeiros 90 dias', 'Leitura de cenário', 'PDI com acompanhamento e evidências'],
    preview: <PdiPreview />,
  },
  {
    tag: '03 · Mercado',
    titulo: 'Se o movimento é para o mercado, a preparação acompanha o processo inteiro.',
    texto:
      'Você trabalha currículo, aderência à vaga, candidaturas, LinkedIn e entrevistas dentro da mesma jornada — com contexto do seu perfil e sem precisar recomeçar do zero a cada etapa.',
    bullets: ['Currículo e Gupy & ATS', 'Vagas & candidaturas', 'LinkedIn, networking e entrevistas'],
    preview: <MarketPreview />,
  },
];

export default function SomaProductShowcase() {
  return (
    <section id="portal" className="border-y border-gray-faint bg-[#f7f9fb] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mint-deep">
            Veja a SOMA por dentro
          </p>
          <h2 className="font-display text-4xl text-black md:text-5xl">
            A mentoria não termina quando o encontro acaba.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-gray-text md:text-lg">
            O portal acompanha o que você descobriu, o que decidiu e o que precisa fazer depois.
            Em vez de receber orientação solta, você constrói uma jornada que fica registrada e evolui com você.
          </p>
        </div>

        <div className="space-y-16">
          {SHOWCASES.map((item, index) => (
            <article
              key={item.tag}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-deep">
                  {item.tag}
                </p>
                <h3 className="mt-3 font-display text-3xl leading-tight text-black">
                  {item.titulo}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-text md:text-base">
                  {item.texto}
                </p>
                <ul className="mt-6 space-y-3">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-3 text-sm text-black">
                      <CheckCircle2 size={17} className="shrink-0 text-mint-deep" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>{item.preview}</div>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-[#15201e] px-6 py-8 text-center text-white md:px-10">
          <div className="mx-auto h-px w-12 bg-[#55c9b9]" aria-hidden="true" />
          <p className="mt-4 font-display text-2xl">Humano no que precisa de contexto, tecnologia no que precisa de continuidade.</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            A IA apoia análises e preparação. A mentoria conecta essas informações ao seu momento real,
            às decisões de carreira e ao que você consegue sustentar na prática.
          </p>
        </div>
      </div>
    </section>
  );
}
