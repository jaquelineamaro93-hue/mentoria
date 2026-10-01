import { BriefcaseBusiness, FileSearch, MessageSquareText, Target } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    label: 'Autoconhecimento',
    title: 'Entenda quem você é antes de decidir para onde ir',
    body: 'Mapa Quem Sou Eu, diagnóstico e diário organizam forças, padrões e contexto sem transformar sua carreira em um teste genérico.',
    preview: (
      <div className="grid grid-cols-3 gap-2">
        {['Quem sou eu', 'Diagnóstico', 'Direção'].map((item, index) => (
          <div key={item} className="rounded-lg border border-[#E1E5E8] bg-white p-3">
            <div className="mb-3 h-1.5 w-8 rounded-full bg-[#0D8071]" style={{ opacity: 1 - index * 0.2 }} />
            <p className="text-[11px] font-semibold text-[#1A1A1A]">{item}</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 rounded-full bg-[#E9ECEF]" />
              <div className="h-1.5 w-3/4 rounded-full bg-[#E9ECEF]" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '02',
    label: 'Crescimento na empresa',
    title: 'Transforme desenvolvimento em um plano que você acompanha',
    body: 'Primeiros 90 dias, leitura de cenário e PDI ficam conectados ao seu momento dentro da empresa, com ações e acompanhamento.',
    preview: (
      <div className="rounded-xl border border-[#E1E5E8] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5F6368]">Plano de desenvolvimento</p>
            <p className="mt-1 text-sm font-semibold text-[#1A1A1A]">Seu próximo ciclo</p>
          </div>
          <Target size={18} className="text-[#0D8071]" strokeWidth={1.8} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E9ECEF]">
          <div className="h-full w-[68%] rounded-full bg-[#0D8071]" />
        </div>
        <div className="mt-4 space-y-2">
          {['Prioridade definida', 'Ação em andamento', 'Revisão mensal'].map((item, index) => (
            <div key={item} className="flex items-center gap-2 text-[11px] text-[#5F6368]">
              <span className={`h-3 w-3 rounded-full border ${index < 2 ? 'border-[#0D8071] bg-[#DDF1ED]' : 'border-[#C9CED3] bg-white'}`} />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '03',
    label: 'Mercado de trabalho',
    title: 'Prepare currículo, vagas e entrevistas sem recomeçar do zero',
    body: 'O portal reaproveita o contexto da sua jornada para apoiar currículo, Gupy & ATS, LinkedIn, candidaturas e preparação para entrevistas.',
    preview: (
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { label: 'Currículo', icon: FileSearch },
          { label: 'Vagas', icon: BriefcaseBusiness },
          { label: 'Entrevistas', icon: MessageSquareText },
        ].map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-[#E1E5E8] bg-white p-3">
            <Icon size={17} className="text-[#1A1A1A]" strokeWidth={1.7} />
            <p className="mt-3 text-[11px] font-semibold text-[#1A1A1A]">{label}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#6B7075]">Contexto + próximo passo</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function SomaPortalPreview() {
  return (
    <section className="bg-[#F7F8F8] py-20" style={{ borderTop: '1px solid #E1E5E8', borderBottom: '1px solid #E1E5E8' }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#0D8071]">
          Veja a SOMA por dentro
        </p>
        <h3 className="mx-auto max-w-3xl text-center font-display text-3xl text-[#1A1A1A]">
          A mentoria continua entre um encontro e outro
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[#5F6368]">
          O portal registra sua jornada e deixa claro o que você já entendeu, o que está construindo e qual é o próximo movimento.
        </p>

        <div className="mt-12 space-y-5">
          {STEPS.map((step) => (
            <article key={step.number} className="grid items-center gap-6 rounded-2xl border border-[#E1E5E8] bg-white p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#8A9095]">{step.number}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0D8071]">{step.label}</span>
                </div>
                <h4 className="mt-3 font-display text-2xl leading-tight text-[#1A1A1A]">{step.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-[#5F6368]">{step.body}</p>
              </div>

              <div className="rounded-xl bg-[#F4F6F7] p-4 md:p-5">
                <div className="mb-4 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#C8CDD1]" />
                  <span className="h-2 w-2 rounded-full bg-[#C8CDD1]" />
                  <span className="h-2 w-2 rounded-full bg-[#C8CDD1]" />
                  <span className="ml-2 text-[10px] text-[#8A9095]">portal SOMA</span>
                </div>
                {step.preview}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
