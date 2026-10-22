/**
 * Marcas só podem ser adicionadas aqui após confirmar que profissionais da rede
 * atuam na empresa. Nenhuma marca da LP de referência é prova de associação.
 *
 * Exemplo de entrada validada:
 * { nome: 'Empresa', logoUrl: '/logos/empresa.svg' }
 */
const EMPRESAS_REDE: ReadonlyArray<{ nome: string; logoUrl: string }> = [];

const AREAS_REDE = ['CRM', 'Customer Experience', 'Customer Success', 'Dados', 'Produto', 'Inteligência Artificial'];

export default function SomaNetworking() {
  return (
    <section aria-labelledby="soma-networking-titulo" className="border-y border-[#e5ede9] bg-[#f6faf8] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8071]">Pessoas e conexões</p>
        <h2 id="soma-networking-titulo" className="mx-auto mt-3 max-w-3xl font-display text-3xl leading-tight text-[#172823] sm:text-4xl">
          {EMPRESAS_REDE.length > 0
            ? 'Conecte-se com profissionais de empresas como estas.'
            : 'Conecte-se com profissionais que também estão evoluindo.'}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#526760] sm:text-base">
          Carreira e networking não precisam ser pesados ou artificiais. Construa conexões genuínas,
          compartilhe experiências e aprenda com pessoas que também estão investindo
          no próprio desenvolvimento.
        </p>
        {EMPRESAS_REDE.length > 0 ? (
          <>
            <div aria-label="Empresas onde atuam profissionais da rede" className="mt-9 grid grid-cols-2 items-center gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {EMPRESAS_REDE.map(empresa => (
                <div key={empresa.nome} className="flex min-h-24 items-center justify-center rounded-xl border border-[#d9e8e2] bg-white px-5 py-4">
                  {/* Logos locais verificados, sem rastreadores externos */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={empresa.nome} src={empresa.logoUrl} loading="lazy" className="max-h-11 max-w-full object-contain" />
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#74877e]">Marcas empregadoras dos participantes, sem vínculo de parceria ou patrocínio com a SOMA.</p>
          </>
        ) : (
          <div aria-label="Áreas de atuação presentes na proposta de networking" className="mx-auto mt-9 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {AREAS_REDE.map(area => (
              <span key={area} className="rounded-full border border-[#bdd8cf] bg-white px-4 py-2 text-sm font-medium text-[#1e5d51]">{area}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
