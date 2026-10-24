import ProductContractDocument from '@/components/ProductContractDocument';
export default async function ContractsPage({searchParams}:{searchParams:Promise<{produto?:string;oferta?:string}>}) {
 const query=await searchParams;
 const product=query.produto==='plataforma'?'plataforma':query.produto==='adicionais'?'adicionais':'carreira';
 return <main className="mx-auto max-w-5xl px-5 py-10"><ProductContractDocument product={product} recovery={product==='plataforma'&&query.oferta==='recuperacao'}/></main>;
}
