import LocalizedText from '@/components/LocalizedText';
import ReactMarkdown from 'react-markdown';
type Receipt={id:string;product:string;version:string|null;acceptedAt:string|null;amount:number|null;introAmount?:number|null;status:string;markdown?:string|null;details?:string};
export default function ContractRecords({receipts,title="Meus contratos e aceites"}:{receipts:Receipt[];title?:string}) {
 return <section className="mb-8 space-y-3 text-black"><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm"><LocalizedText text={"O aceite registra as condições escolhidas. A confirmação do pagamento é indicada separadamente."} /></p>
  {!receipts.length&&<p className="rounded-xl border bg-white p-4 text-sm"><LocalizedText text={"Nenhum aceite de contratação registrado nesta conta."} /></p>}
  {receipts.map(receipt=><details key={receipt.id} className="rounded-xl border bg-white p-4"><summary className="cursor-pointer text-sm font-medium">{receipt.product} · {receipt.acceptedAt?new Date(receipt.acceptedAt).toLocaleString('pt-BR'):'Contratação anterior'} · {receipt.status}</summary><div className="mt-4 space-y-3 text-sm">
   {receipt.details&&<p>{receipt.details}</p>}
   {receipt.version&&<p>Versão aceita: {receipt.version}</p>}
   {receipt.amount!==null&&<p>{receipt.introAmount!=null?`Primeira mensalidade: ${receipt.introAmount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}. Valor recorrente: `:'Valor registrado no pedido: '}{receipt.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}.</p>}
   {receipt.markdown?<div className="prose prose-sm max-w-none text-black"><ReactMarkdown>{receipt.markdown}</ReactMarkdown></div>:<p>Este registro mantém a versão e as condições comerciais disponíveis na contratação. O texto integral desta versão não está anexado aqui. As condições atuais abaixo não substituem o documento anterior.</p>}
  </div></details>)}
 </section>;
}
