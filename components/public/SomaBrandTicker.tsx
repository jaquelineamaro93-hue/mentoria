import { SOMA_COMPANIES } from '@/components/public/SomaNetworking';

const displayOrder = [
  'Itaú','Mercado Livre','Samsung','Embraer','Cielo','O Boticário',
  'PicPay','Renner','Capgemini','Whirlpool','Gupy','RD Saúde',
] as const;
const companies = displayOrder.map(name => SOMA_COMPANIES.find(c => c.nome === name)).filter(
  (c): c is (typeof SOMA_COMPANIES)[number] => !!c,
);

/** Reusa logos existentes da Rede SOMA, sem inventar arquivos ou parcerias. */
export default function SomaBrandTicker() {
 const repeated = [...companies, ...companies];
 return <section aria-label="Empresas na trajetória profissional de mentorados e alunos" className="soma-brand-band overflow-hidden border-y border-[#22332F] py-5">
   <p className="mb-3 text-center text-[13px] text-[#93A6A1]">Mentorados atuam em</p>
   <div className="soma-ticker-track flex w-max gap-4">
     {repeated.map((company,i) => {
       const image = company.logoUrl || (company.dominio ? `https://www.google.com/s2/favicons?domain=${company.dominio}&sz=128` : '');
       return <div key={company.nome+'-'+i} aria-hidden={i>=companies.length} className="flex h-16 w-40 shrink-0 flex-col items-center justify-center rounded-[14px] bg-white px-4 text-[#1B1F1D]">
         {image ? <img loading="lazy" decoding="async" referrerPolicy="no-referrer" src={image} width={104} height={33} alt="" className="h-8 max-w-[118px] object-contain" /> : null}
         <span className="mt-1 max-w-full truncate text-center text-[12px] font-bold leading-4">{company.nome}</span>
       </div>;
     })}
   </div>
   <p className="sr-only">As marcas mostram trajetórias profissionais, não parcerias com a SOMA</p>
 </section>;
}
