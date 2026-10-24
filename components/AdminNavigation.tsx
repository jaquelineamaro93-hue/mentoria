'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const items=[['/admin/ajuda','Conteúdos e novidades'],['/admin/usuarios','Pessoas'],['/admin/gerenciar-planos','Planos e contratos'],['/admin/financeiro','Financeiro'],['/admin/acompanhamentos','Íris e WhatsApp'],['/admin/analytics','Resultados'],['/admin/crescimento','Crescimento'],['/admin/enquetes','Votações'],['/admin/feedbacks','Feedbacks'],['/admin/vagas','Vagas'],['/admin/indicacoes','Indicações']];
export default function AdminNavigation(){
 const path=usePathname();if(path==='/admin')return null;
 return <nav aria-label="Navegação administrativa" className="mb-6 rounded-2xl border bg-white p-4 text-black"><Link href="/admin" className="mb-3 inline-block text-sm font-semibold underline">← Visão geral da administração</Link><div className="flex flex-wrap gap-2">{items.map(([href,title])=><Link key={href} href={href} aria-current={path===href||path.startsWith(href+'/')?'page':undefined} className={`rounded-lg px-3 py-2 text-sm ${path===href||path.startsWith(href+'/')?'bg-emerald-100 font-semibold':'hover:bg-emerald-50'}`}>{title}</Link>)}</div></nav>;
}
