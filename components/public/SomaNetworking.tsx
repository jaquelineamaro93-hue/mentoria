import LocalizedText from '@/components/LocalizedText';
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

/** Empresas informadas pela criadora como locais de atuação de mentorados atuais.
 * A presença da marca não representa parceria, patrocínio ou endosso corporativo.
 * O domínio serve apenas para buscar o ícone de marca; nada vem da conta do mentorado.
 */
const EMPRESAS_MENTORADOS: ReadonlyArray<{ nome: string; site: string; dominio: string; logoUrl?: string }> = [
  { nome: 'Porte', site: 'https://porte.com.br/', dominio: 'porte.com.br' },
  { nome: 'Credsystem', site: 'https://www.credsystem.com.br/', dominio: 'credsystem.com.br' },
  { nome: 'Lojas Torra', site: 'https://www.lojastorra.com.br/', dominio: 'lojastorra.com.br' },
  { nome: 'Whirlpool', site: 'https://www.whirlpool.com.br/', dominio: 'whirlpool.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Whirlpool_Corporation_Logo.png' },
  { nome: 'O Boticário', site: 'https://www.boticario.com.br/', dominio: 'boticario.com.br' },
  { nome: 'Monks', site: 'https://www.monks.com/pt', dominio: 'monks.com' },
  { nome: 'Cielo', site: 'https://www.cielo.com.br/', dominio: 'cielo.com.br' },
  { nome: 'Samsung', site: 'https://www.samsung.com/br/', dominio: 'samsung.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Samsung_wordmark.svg' },
  { nome: 'LWSA', site: 'https://lwsa.tech/', dominio: 'lwsa.tech' },
  { nome: 'Embraer', site: 'https://www.embraer.com/pt/', dominio: 'embraer.com' },
  { nome: 'Gupy', site: 'https://portal.gupy.io/', dominio: 'gupy.io' },
  { nome: 'PicPay', site: 'https://picpay.com/pt-br/pf', dominio: 'picpay.com' },
  { nome: 'Loft', site: 'https://loft.teamtailor.com/#jobs', dominio: 'loft.com.br' },
  { nome: 'Capgemini', site: 'https://www.capgemini.com/br-pt/', dominio: 'capgemini.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg' },
  { nome: 'Mercado Livre', site: 'https://www.mercadolivre.com.br/', dominio: 'mercadolivre.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Mercado_Livre_wordmark_%28Portuguese_version%29.svg' },
  { nome: 'RD Saúde', site: 'https://rdsaude.com.br/', dominio: 'rdsaude.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Logo_RD_Saude.png' },
  { nome: 'Itaú', site: 'https://www.itau.com.br/', dominio: 'itau.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/ITAU_LOGO.svg' },
];

const AREAS_REDE = ['CRM', 'Customer Experience', 'Customer Success', 'Dados', 'Produto', 'Inteligência Artificial'];

export default function SomaNetworking() {
  return (
    <section id="rede-soma" aria-labelledby="soma-networking-titulo" className="scroll-mt-24 border-y border-[#e5ede9] bg-[#f6faf8] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8071]"><LocalizedText text={"Pessoas e conexões"} /></p>
        <h2 id="soma-networking-titulo" className="mx-auto mt-3 max-w-3xl font-display text-3xl leading-tight text-[#172823] sm:text-4xl">
          {EMPRESAS_REDE.length > 0
            ? 'Conecte-se com profissionais de empresas como'
            : 'Conecte-se com profissionais que também investem em si.'}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#526760] sm:text-base"><LocalizedText text={"Carreira e networking não precisam ser pesados. Podem ser genuínos. Aprenda com quem também está investindo em si."} /></p>

        <div className="mt-11 border-t border-[#d9e8e2] pt-9 sm:mt-14 sm:pt-11">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8071]"><LocalizedText text={"Mentorado também é conexão"} /></p>
          <h3 className="mx-auto mt-3 max-w-3xl font-display text-2xl leading-tight text-[#172823] sm:text-3xl"><LocalizedText text={"Empresas onde nossos mentorados atuam"} /></h3>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-[#526760] sm:text-base"><LocalizedText text={"A SOMA reúne profissionais com diferentes histórias e desafios de carreira. Estas são algumas das empresas presentes na trajetória dos mentorados."} /></p>
          <div
            role="list"
            aria-label={`${EMPRESAS_MENTORADOS.length} empresas onde atuam mentorados da SOMA`}
            className="mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 md:grid-cols-4 lg:grid-cols-5"
          >
            {EMPRESAS_MENTORADOS.map(empresa => (
              <a
                role="listitem"
                key={empresa.nome}
                href={empresa.site}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visitar o site da ${empresa.nome}`}
                className="group flex min-h-32 w-40 shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl border border-[#d9e8e2] bg-white px-3 py-5 shadow-sm transition-colors hover:border-[#82b7a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071] sm:w-auto"
              >
                <span className={empresa.nome === 'Cielo'
                  ? 'flex h-14 w-28 items-center justify-center overflow-hidden rounded-lg bg-[#214880]'
                  : empresa.logoUrl
                    ? 'flex h-14 w-full max-w-36 items-center justify-center rounded-xl bg-white px-1'
                    : 'flex h-14 w-14 items-center justify-center rounded-xl bg-[#f6faf8]'}>
                  {/* Logos completas de origem verificada; favicon apenas como fallback para outras marcas. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={empresa.nome === 'Cielo'
                      ? '/images/cielo-mentorado.svg'
                      : empresa.logoUrl ?? `https://www.google.com/s2/favicons?domain=${empresa.dominio}&sz=128`}
                    alt=""
                    aria-hidden="true"
                    width={empresa.nome === 'Cielo' || empresa.logoUrl ? 144 : 48}
                    height={empresa.nome === 'Cielo' || empresa.logoUrl ? 56 : 48}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className={empresa.nome === 'Cielo' ? 'h-11 w-28 object-contain' : empresa.logoUrl ? 'h-12 max-w-full object-contain' : 'h-12 w-12 object-contain'}
                  />
                </span>
                <span className="text-center text-sm font-semibold leading-tight text-[#293b35] group-hover:text-[#0D8071]">
                  {empresa.nome}
                </span>
              </a>
            ))}
          </div>
          <p className="mt-1 text-xs text-[#74877e] sm:hidden"><LocalizedText text={"Deslize para o lado para conhecer todas as empresas."} /></p>
          <p className="mx-auto mt-5 max-w-4xl text-xs leading-5 text-[#74877e]"><LocalizedText text={"As marcas representam apenas a atuação profissional de mentorados. Não há indicação de parceria, patrocínio ou endosso dessas empresas à SOMA, nem promessa de contato com seus colaboradores."} /></p>
        </div>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-[#74877e]"><LocalizedText text={"Outras trajetórias profissionais que inspiram a SOMA"} /></p>
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
            <p className="mt-5 text-xs text-[#74877e]"><LocalizedText text={"Marcas presentes em trajetórias profissionais que inspiram a SOMA, sem vínculo de parceria ou patrocínio. A menção não indica vínculo atual nem garante contato com colaboradores."} /><span className="mt-1 block">Logotipo Webmotors: © Lucas Manfre Barreiro, via Wikimedia Commons.</span></p>
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
