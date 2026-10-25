'use client';
import LocalizedText from '@/components/LocalizedText';
import Link from 'next/link';
export default function PurchaseContractConsent({accepted,onChange,product='adicionais'}:{accepted:boolean;onChange:(value:boolean)=>void;product?:'carreira'|'adicionais'}){
 return <label className="my-4 flex items-start gap-3 text-sm text-black"><input type="checkbox" checked={accepted} onChange={event=>onChange(event.target.checked)} className="mt-1"/><span><LocalizedText text={"Li e aceito o"} /><Link href={`/contratos?produto=${product}`} target="_blank" rel="noopener noreferrer" className="underline"><LocalizedText text={"contrato desta contratação"} /></Link><LocalizedText text={"e o preço e a forma de pagamento apresentados."} /></span></label>;
}
