/**
 * Logos de empresas citadas em trajetórias profissionais da SOMA e da mentora.
 * Não indicam vínculo empregatício atual, parceria ou disponibilidade para contato.
 * Webmotors: © Lucas Manfre Barreiro, via Wikimedia Commons (atribuição).
 */
const EMPRESAS_REDE: ReadonlyArray<{ nome: string; logoUrl: string }> = [
  { nome: 'Banco do Brasil', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Banco_do_Brasil_Logo.svg' },
  { nome: 'Volvo', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Volvo_logo.svg' },
  { nome: 'Webmotors', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/LogoWebmotors_250px.png' },
  { nome: 'Ansell', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ansell_Logo.svg' },
];

const AREAS_REDE = ['CRM', 'Customer Experience', 'Customer Success', 'Dados', 'Produto', 'Inteligência Artificial'];

export default function SomaNetworking() {
  return (
    <section aria-labelledby="soma-networking-titulo" className="border-y border-[#e5ede9] bg-[#f6faf8] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8071]">Pessoas e conexões</p>
        <h2 id="soma-networking-titulo" className="mx-auto mt-3 max-w-3xl font-display text-3xl leading-tight text-[#172823] sm:text-4xl">
          {EMPRESAS_REDE.length > 0
            ? 'Conecte-se com profissionais de empresas como'
            : 'Conecte-se com profissionais que também investem em si.'}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#526760] sm:text-base">
          Carreira e networking não precisam ser pesados. Podem ser genuínos.
          Aprenda com quem também está investindo em si.
        </p>
        {EMPRESAS_REDE.length > 0 ? (
          <>
            <div aria-label="Empresas presentes em trajetórias profissionais relacionadas à SOMA" className="mt-9 grid grid-cols-2 items-center gap-3 sm:grid-cols-4 sm:gap-5">
              {EMPRESAS_REDE.map(empresa => (
                <div key={empresa.nome} className="flex min-h-24 items-center justify-center rounded-xl border border-[#d9e8e2] bg-white px-4 py-5 shadow-sm transition-colors hover:border-[#a4cec0] sm:min-h-28">
                  {/* Imagens verificadas com origem conhecida, sem scripts ou pixels de rastreamento */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={empresa.nome} src={empresa.logoUrl} loading="lazy" className="max-h-12 max-w-full object-contain" decoding="async" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#74877e]">Marcas presentes em trajetórias profissionais que inspiram a SOMA, sem vínculo de parceria ou patrocínio. A menção não indica vínculo atual nem garante contato com colaboradores.
              <span className="mt-1 block">Logotipo Webmotors: © Lucas Manfre Barreiro, via Wikimedia Commons.</span></p>
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
