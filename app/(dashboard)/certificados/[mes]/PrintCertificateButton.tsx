'use client';
import { Printer } from 'lucide-react';
export default function PrintCertificateButton(){return <button type="button" onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#183F37] px-4 py-2.5 text-sm font-semibold text-white"><Printer size={16}/> Imprimir ou salvar em PDF</button>}