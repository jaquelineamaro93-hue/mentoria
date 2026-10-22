'use client';

import { useState } from 'react';

/**
 * Relação de empregadores informada pela mentora.
 *
 * Logotipos empregados para identificação factual de empresas e trajetórias.
 * Não apresentar como clientes corporativos, patrocinadoras ou parcerias.
 * A imagem tem fallback visual para que a experiência nunca dependa
 * exclusivamente de serviços externos de imagens.
 */
export const EMPRESAS_MENTORADOS = [
  {
    nome: 'Porte',
    dominio: 'porte.com.br',
    url: 'https://porte.com.br/',
    logo: 'https://lp.porte.com.br/corporativo/assets/images/logo-porte-color.png',
  },
  {
    nome: 'credsystem',
    dominio: 'credsystem.com.br',
    url: 'https://www.credsystem.com.br/',
    logo: null,
  },
  {
    nome: 'Lojas Torra',
    dominio: 'lojastorra.com.br',
    url: 'https://www.lojastorra.com.br/',
    logo: 'https://assets.decocache.com/lojastorra-2/070e7415-32ce-4ec0-9d9c-2d1a419a570e/1742417201251-381a78cd-9078-44cc-9816-92490f4d762f',
  },
  {
    nome: 'Whirlpool',
    dominio: 'whirlpool.com.br',
    url: 'https://www.whirlpool.com.br/',
    logo: 'https://www.mckennas.ie/image/catalog/Suppliers%20-%20brands/Whirlpool-logo.jpg',
  },
  {
    nome: 'O Boticário',
    dominio: 'boticario.com.br',
    url: 'https://www.boticario.com.br/',
    logo: 'https://www.boticario.com.py/assets_front/images/social_seo.png',
  },
  {
    nome: 'Monks',
    dominio: 'monks.com',
    url: 'https://www.monks.com/pt',
    logo: 'https://mmx.prnewswire.com/media/MS1580689/Monks-Logo-Large-Black-Logo.jpg?id=OA2923721&p=facebook',
  },
  {
    nome: 'Cielo',
    dominio: 'cielo.com.br',
    url: 'https://www.cielo.com.br/',
    logo: 'https://logospng.org/download/cielo/logo-cielo-2048.png',
  },
  {
    nome: 'Samsung',
    dominio: 'samsung.com',
    url: 'https://www.samsung.com/br/',
    logo: 'https://storage.googleapis.com/strapi-igta/SAMSUNG_e957f7b0e0/SAMSUNG_e957f7b0e0.png',
  },
  {
    nome: 'LWSA',
    dominio: 'lwsa.tech',
    url: 'https://lwsa.tech/',
    logo: 'https://www.sydle.com/assets/lp/ti-pt/lwsa-logo.png',
  },
  {
    nome: 'Embraer',
    dominio: 'embraer.com',
    url: 'https://www.embraer.com/pt/',
    logo: 'https://www.marefa.org/w/images/thumb/5/54/Embraer_logo.svg/2560px-Embraer_logo.svg.png',
  },
  {
    nome: 'Gupy',
    dominio: 'gupy.io',
    url: 'https://portal.gupy.io/',
    logo: 'https://info.gupy.io/hubfs/Web%20Growth%20%28assets%29/Assets%20de%20marca/Rebranding/Logos-Institucionais/large/logo-dark.png',
  },
  {
    nome: 'PicPay',
    dominio: 'picpay.com',
    url: 'https://picpay.com/pt-br/pf',
    logo: null,
  },
  {
    nome: 'Loft',
    dominio: 'loft.com.br',
    url: 'https://loft.teamtailor.com/#jobs',
    logo: 'https://logospng.org/download/loft/loft-2048.png',
  },
] as const;

function MarcaMentoria({ empresa }: { empresa: (typeof EMPRESAS_MENTORADOS)[number] }) {
  const [falhaLogo, setFalhaLogo] = useState(false);
  const [falhaIcone, setFalhaIcone] = useState(false);
  const favicon = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(empresa.dominio) + '&sz=128';
  const usarLogo = empresa.logo !== null && !falhaLogo;

  return (
    <a
      href={empresa.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={'Visitar o site da empresa ' + empresa.nome}
      className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-transparent px-3 py-4 transition-colors duration-200 hover:border-[#dae9e5] hover:bg-[#f4faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071]"
    >
      <div className="flex h-14 w-full items-center justify-center">
        {usarLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={empresa.logo ?? undefined}
            alt={'Logotipo ' + empresa.nome}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFalhaLogo(true)}
            className="max-h-12 max-w-[min(100%,150px)] object-contain transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex items-center justify-center">
            {!falhaIcone ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={favicon}
                alt={'Marca ' + empresa.nome}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFalhaIcone(true)}
                className="h-11 w-11 rounded-md object-contain"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf7f3] text-lg font-semibold text-[#0D8071]">
                {empresa.nome.slice(0, 1)}
              </span>
            )}
          </div>
        )}
      </div>
      <span className="text-center text-xs font-medium text-[#536560]">
        {empresa.nome}
      </span>
    </a>
  );
}

export default function SomaEmpresasMentorados() {
  return (
    <section
      id="onde-estao-mentorados"
      aria-labelledby="soma-empresas-titulo"
      className="border-b border-[#e8efec] bg-white py-12 sm:py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#0D8071]">
            Histórias que avançaram
          </p>
          <h2 id="soma-empresas-titulo" className="mt-3 font-display text-3xl text-[#1A1A1A] sm:text-4xl">
            Onde nossos mentorados estão hoje
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#667570] sm:text-base">
            Profissionais que receberam orientações na mentoria hoje atuam em empresas como estas.
            Cada trajetória é única.
          </p>
        </div>

        <div className="grid grid-cols-2 items-center gap-x-3 gap-y-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {EMPRESAS_MENTORADOS.map((empresa) => (
            <MarcaMentoria key={empresa.nome} empresa={empresa} />
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[#7a8984]">
          Marcas citadas apenas para identificar empresas presentes nas trajetórias profissionais
          relatadas. Não representam patrocínio, parceria comercial ou endosso à SOMA.
        </p>
      </div>
    </section>
  );
}
