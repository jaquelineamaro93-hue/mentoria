import LocalizedText from '@/components/LocalizedText';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PRODUCT_CONTRACTS, RECOVERY_CONTRACT_MARKDOWN, RECOVERY_CONTRACT_VERSION } from '@/lib/product-contracts';
export default function ProductContractDocument({product,recovery=false}:{product:keyof typeof PRODUCT_CONTRACTS;recovery?:boolean}) {
 const document=PRODUCT_CONTRACTS[product];
 return <section className="space-y-5 text-black">
  <nav aria-label="Contratos por produto" className="flex flex-wrap gap-2">{Object.entries(PRODUCT_CONTRACTS).map(([key,value])=><Link key={key} href={`/contratos?produto=${key}`} aria-current={product===key?'page':undefined} className={`rounded-xl border px-4 py-3 text-sm ${product===key?'border-emerald-600 bg-emerald-50':'bg-white'}`}>{key==='carreira'?'SOMA Carreira':key==='plataforma'?'SOMA Plataforma':<LocalizedText text="Compras adicionais" />}</Link>)}</nav>
  <header><h1 className="text-2xl font-semibold">{document.title}</h1><p className="mt-2 text-sm"><LocalizedText text="Versão" /> {recovery?RECOVERY_CONTRACT_VERSION:document.version}. <LocalizedText text="Condições para novas contratações." /></p></header>
  <p className="text-sm text-[#526760]"><LocalizedText text="Este documento contratual é apresentado em português, versão original válida para aceite. A tradução da interface não altera suas cláusulas." /></p>
  <div className="prose prose-sm max-w-none rounded-2xl border bg-white p-6 text-black prose-headings:text-black prose-p:text-black prose-li:text-black prose-strong:text-black"><ReactMarkdown remarkPlugins={[remarkGfm]}>{recovery?RECOVERY_CONTRACT_MARKDOWN:document.markdown}</ReactMarkdown></div>
  <p className="text-sm"><LocalizedText text="Consulte os documentos e registros da sua conta em" /> <Link href="/termos" className="underline"><LocalizedText text="Meus contratos e aceites" /></Link>. <LocalizedText text="Documentos anteriores permanecem vinculados à contratação original." /></p>
 </section>;
}
