'use client';
import { useState } from 'react';
import ContractRecords from '@/components/ContractRecords';
type Entry={id:string;person:string;product:string;version:string|null;acceptedAt:string|null;amount:number|null;introAmount?:number|null;status:string;markdown?:string|null};
export default function AdminContractRegister({entries}:{entries:Entry[]}){
 const [search,setSearch]=useState('');
 const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filtered=entries.filter(entry=>normalize(entry.person+' '+entry.product+' '+entry.version).includes(normalize(search)));
 return <details className="mb-6 rounded-2xl border bg-white p-5 text-black"><summary className="cursor-pointer font-semibold">Contratos e aceites ({entries.length})</summary><div className="mt-4 space-y-4"><label className="block text-sm">Buscar por pessoa, e-mail ou produto<input value={search} onChange={event=>setSearch(event.target.value)} className="mt-2 block w-full rounded-lg border p-3" placeholder="Nome, e-mail ou produto"/></label><ContractRecords title="Aceites de contratação" receipts={filtered.map(entry=>({...entry,product:entry.person+' · '+entry.product}))}/></div></details>;
}
