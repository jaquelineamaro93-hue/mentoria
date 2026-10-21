import { CheckCircle2, Layers3, LockKeyhole, Sparkles, Workflow } from 'lucide-react';

type Modulo = { slug: string; title: string; description: string | null };
const ofertas = [
  {
    nome: 'Módulo avulso',
    preco: 'R$ 24,90',
    subtitulo: 'por mês e por ferramenta',
    icone: Layers3,
    descricao: 'Acesso a uma ferramenta específica, sem encontros individuais de mentoria.',
    itens: ['Escolha um módulo', 'Seu histórico e suas análises', 'Limites de uso transparentes'],
  },
  {
    nome: 'SOMA Essencial',
    preco: 'R$ 34,90',
    subtitulo: 'por mês, preço regional para o Brasil',
    icone: Workflow,
    descricao: 'Uma jornada de autoconhecimento e desenvolvimento, no seu ritmo.',
    itens: ['Mapa Quem Sou Eu', 'Diagnóstico & Perfil', 'PDI & crescimento'],
  },
  {
    nome: 'SOMA Pro',
    preco: 'R$ 69,90',
    subtitulo: 'por mês',
    icone: Sparkles,
    descricao: 'Plataforma integrada de carreira com Íris Copiloto e ferramentas avançadas.',
    itens: ['Todos os módulos SaaS', 'Íris Copiloto com franquia de IA', 'Currículo, LinkedIn, vagas e entrevistas'],
  },
] as const;

export default function SomaSaasShowcase({ modulos }: { modulos: Modulo[] }) {
  return (
    <section id="soma-saas" className="mt-12 border-t border-gray-faint pt-11 sm:mt-16 sm:pt-14" aria-labelledby="soma-saas-titulo">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-deep">SOMA Plataforma · SaaS</p>
          <h2 id="soma-saas-titulo" className="mt-2 font-display text-3xl text-[#183F37] sm:text-4xl">A tecnologia de carreira, com autonomia</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a645c]">
            A plataforma SOMA também está sendo preparada para contratação independente,
            sem sessões de mentoria. Escolha uma ferramenta, um conjunto de módulos
            ou a experiência integrada com Íris Copiloto.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e2dc] bg-[#f1f7f3] px-4 py-2 text-xs font-semibold text-[#315a49]">
          <LockKeyhole size={14} /> Lançamento em preparação
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ofertas.map(oferta => {
          const Icon = oferta.icone;
          return (
            <article key={oferta.nome} className="flex min-w-0 flex-col rounded-2xl border border-[#dfe6e2] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f4ef] text-mint-deep"><Icon size={21} /></span>
                <h3 className="font-semibold text-[#183F37]">{oferta.nome}</h3>
              </div>
              <p className="text-sm leading-6 text-[#4a645c]">{oferta.descricao}</p>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-[#15362f]">{oferta.preco}</p>
              <p className="mt-1 text-xs text-[#60796f]">{oferta.subtitulo} · valor proposto para lançamento</p>
              <ul className="mt-6 flex-1 space-y-3">
                {oferta.itens.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#33463e]">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-mint-deep" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-6 block rounded-lg border border-[#e4e6e3] bg-[#fafafa] px-4 py-3 text-center text-xs font-medium text-[#66766d]">
                Contratação disponível após validação de segurança
              </span>
            </article>
          );
        })}
      </div>
      {modulos.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[#dde6e0] bg-[#f8faf8] p-5 sm:p-6">
          <h3 className="font-semibold text-[#183F37]">Ferramentas da plataforma</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modulos.map(modulo => (
              <div key={modulo.slug} className="rounded-lg border border-[#e2e9e4] bg-white px-4 py-3">
                <p className="text-sm font-medium text-[#1d4538]">{modulo.title}</p>
                {modulo.description && <p className="mt-1 text-xs leading-5 text-[#6a7972]">{modulo.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-[#65756b]">
        Os valores e limites são propostas comerciais. Não existe checkout SaaS habilitado neste momento.
        Os planos de mentoria acima permanecem independentes e continuam com suas regras atuais.
      </p>
    </section>
  );
}
