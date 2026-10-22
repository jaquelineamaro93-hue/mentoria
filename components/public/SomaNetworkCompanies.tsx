import { Network } from 'lucide-react';

const EMPRESAS = [
  { nome: 'Banco do Brasil', dominio: 'bb.com.br' },
  { nome: 'Loft', dominio: 'loft.com.br' },
  { nome: 'Volvo', dominio: 'volvo.com' },
  { nome: 'Webmotors', dominio: 'webmotors.com.br' },
] as const;

/**
 * Referências de trajetórias profissionais divulgadas pela mentora e pela SOMA.
 * Não são empresas parceiras, empregadoras atuais, patrocinadoras ou organizações
 * que garantam conexões/candidaturas. Validar relação antes de acrescentar logos.
 */
export default function SomaNetworkCompanies() {
  return (
    <section className="border-y border-[#e2eae6] bg-white py-12 sm:py-16" aria-labelledby="empresas-rede-titulo">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="mb-3 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0D8071]">
          <Network size={16} aria-hidden="true" /> Conexões que somam
        </p>
        <h2 id="empresas-rede-titulo" className="mx-auto max-w-4xl font-display text-3xl leading-tight text-[#203f37] sm:text-4xl">
          Conecte-se com profissionais de empresas como
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#536a60] sm:text-base">
          Carreira e networking não precisam ser pesados. Podem ser genuínos.
          Aprenda com quem também está investindo em si.
        </p>

        <div className="mt-9 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4" aria-label="Empresas presentes em trajetórias profissionais">
          {EMPRESAS.map(empresa => (
            <div key={empresa.nome}
              className="flex min-h-24 items-center justify-center gap-2.5 rounded-2xl border border-[#e1e9e5] bg-[#f8faf9] px-3 py-5 transition-colors hover:border-[#b7d9cc] sm:px-4">
              <img
                alt=""
                aria-hidden="true"
                src={'https://www.google.com/s2/favicons?domain=' + empresa.dominio + '&sz=128'}
                width={36} height={36}
                loading="lazy" referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-lg object-contain"
              />
              <span className="text-left text-sm font-bold leading-tight text-[#263a34] sm:text-base">{empresa.nome}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-xs leading-5 text-[#6c8178]">
          Marcas citadas como referências de experiências profissionais presentes na trajetória da mentora e de sua rede.
          A menção não representa parceria, patrocínio ou vínculo atual com a SOMA.
        </p>
      </div>
    </section>
  );
}
