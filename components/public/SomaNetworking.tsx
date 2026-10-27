import Link from 'next/link';
import LocalizedText from '@/components/LocalizedText';

/**
 * Empresas presentes em trajetórias da rede SOMA.
 * A marca não indica parceria, patrocínio, vínculo atual ou acesso a colaboradores.
 * As URLs de logos mantêm os recursos já usados na aplicação.
 */
type Empresa = {
  nome: string;
  site?: string;
  dominio?: string;
  logoUrl?: string;
};

const EMPRESAS: ReadonlyArray<Empresa> = [
  { nome: 'Porte', site: 'https://porte.com.br/', dominio: 'porte.com.br' },
  { nome: 'Credsystem', site: 'https://www.credsystem.com.br/', dominio: 'credsystem.com.br' },
  { nome: 'Lojas Torra', site: 'https://www.lojastorra.com.br/', dominio: 'lojastorra.com.br' },
  { nome: 'Whirlpool', site: 'https://www.whirlpool.com.br/', dominio: 'whirlpool.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Whirlpool_Corporation_Logo.png' },
  { nome: 'O Boticário', site: 'https://www.boticario.com.br/', dominio: 'boticario.com.br' },
  { nome: 'Monks', site: 'https://www.monks.com/pt', dominio: 'monks.com' },
  { nome: 'Cielo', site: 'https://www.cielo.com.br/', dominio: 'cielo.com.br', logoUrl: '/images/cielo-mentorado.svg' },
  { nome: 'Renner', site: 'https://www.lojasrenner.com.br/', dominio: 'lojasrenner.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Logotipo_das_Lojas_Renner.svg' },
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
  { nome: 'Banco do Brasil', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Banco_do_Brasil_Logo.svg' },
  { nome: 'Volvo', logoUrl: '/images/volvo-wordmark.svg' },
  { nome: 'Webmotors', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/LogoWebmotors_250px.png' },
  { nome: 'Ansell', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ansell_Logo.svg' },
];

function EmpresaCard({ empresa }: { empresa: Empresa }) {
  const imagem = empresa.logoUrl ?? `https://www.google.com/s2/favicons?domain=${empresa.dominio}&sz=128`;
  const logo = (
    <>
      <span className={empresa.nome === 'Cielo'
        ? 'flex h-12 w-full items-center justify-center rounded-lg bg-[#214880] px-2'
        : 'flex h-12 w-full items-center justify-center'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagem}
          alt=""
          aria-hidden="true"
          width={empresa.logoUrl ? 144 : 48}
          height={48}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={empresa.logoUrl ? 'max-h-11 max-w-[90%] object-contain' : 'h-10 w-10 object-contain'}
        />
      </span>
      <span className="mt-2 text-center text-sm font-semibold leading-tight text-[#21372d]">{empresa.nome}</span>
    </>
  );
  const className = 'flex min-h-28 flex-col items-center justify-center rounded-2xl border border-[#dbe7df] bg-white px-3 py-4 shadow-sm transition-colors hover:border-[#8FD3BE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FD3BE]';
  return empresa.site ? (
    <a href={empresa.site} target="_blank" rel="noopener noreferrer" title={`Visitar o site de ${empresa.nome}`} className={className}>
      {logo}
    </a>
  ) : (
    <div className={className}>{logo}</div>
  );
}

export default function SomaNetworking() {
  return (
    <section id="rede-soma" aria-labelledby="soma-networking-titulo" className="scroll-mt-24 bg-[#0F1A18] py-14 text-[#EEF3F1] sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FD3BE]"><LocalizedText text={"Rede SOMA · pessoas e conexões"} /></p>
            <h2 id="soma-networking-titulo" className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              <LocalizedText text={"Mentorado também é conexão"} />
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#C3D0CC]"><LocalizedText text={"Carreira e networking não precisam ser pesados. Podem ser genuínos. Aprenda com quem também está investindo em si."} /></p>
          </div>
          <div className="flex gap-8 sm:gap-12" aria-label="Informações da rede">
            <div><strong className="block text-3xl sm:text-4xl">{EMPRESAS.length}</strong><span className="text-xs text-[#A9BAB5]">empresas na trajetória da rede</span></div>
            <div><strong className="block text-3xl sm:text-4xl">2022</strong><span className="text-xs text-[#A9BAB5]">início da SOMA</span></div>
          </div>
        </div>
        {/* A colagem original das conexões permanece como conteúdo central da seção */}
        <div className="relative mt-8 overflow-hidden rounded-2xl sm:mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/soma-network-collage.webp" alt="Encontros, conversas e conexões da comunidade SOMA" loading="lazy" className="h-auto max-h-[360px] w-full object-cover object-center sm:max-h-[480px]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0F1A18] to-transparent" />
        </div>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-4">
          <h3 className="max-w-2xl font-display text-2xl leading-tight sm:text-3xl"><LocalizedText text={"Onde mentorados e alunos constroem carreira"} /></h3>
          <p className="max-w-sm text-sm leading-6 text-[#A9BAB5]"><LocalizedText text={"Estas são algumas das empresas presentes nas trajetórias profissionais de mentorados e alunos da SOMA."} /></p>
        </div>
        <div aria-label={`${EMPRESAS.length} empresas da rede SOMA`} className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {EMPRESAS.map(empresa => <EmpresaCard key={empresa.nome} empresa={empresa} />)}
        </div>
        <p className="mt-6 max-w-5xl text-xs leading-6 text-[#A9BAB5]"><LocalizedText text={"As marcas representam a atuação profissional de mentorados e alunos, atual ou anterior. Não há parceria, patrocínio ou endosso dessas empresas à SOMA, nem promessa de contato com seus colaboradores."} /> <span>Logotipo Webmotors: © Lucas Manfre Barreiro, via Wikimedia Commons.</span></p>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-white/15 pt-8">
          <Link href="/planos" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#8FD3BE] px-6 text-sm font-semibold text-[#0F1A18] hover:bg-[#b9e7d7]">Ver planos</Link>
          <Link href="/depoimentos" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#43665a] px-6 text-sm font-semibold text-white hover:border-[#8FD3BE]">Ler depoimentos</Link>
        </div>
      </div>
    </section>
  );
}
