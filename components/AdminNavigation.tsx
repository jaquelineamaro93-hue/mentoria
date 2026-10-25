'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_AREAS } from '@/lib/admin-navigation';

export default function AdminNavigation() {
  const path = usePathname();
  if (path === '/admin') return null;
  const isPermissions = path.startsWith('/admin/usuarios-permissoes/');
  const current = ADMIN_AREAS.flatMap(group => group.items).find(item => path === item.href || path.startsWith(item.href + '/') || (isPermissions && item.href === '/admin/usuarios'));
  return <nav aria-label="Navegação administrativa" className="mb-6 border-b border-[#d7e3dc] pb-4 text-[#213d34]">
    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><Link href="/admin" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Acompanhamento</Link><span aria-hidden="true">/</span><span aria-current="page">{isPermissions ? 'Permissões da pessoa' : current?.title ?? 'Gerenciamento'}</span></div>
    <details key={path} className="rounded-xl border border-[#d7e3dc] bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">Áreas da administração</summary>
      <div className="grid gap-5 border-t border-[#edf2ef] p-4 md:grid-cols-3">{ADMIN_AREAS.map(group => <section key={group.group} aria-label={group.group}><h2 className="mb-2 text-xs font-semibold text-[#53685e]">{group.group}</h2><ul>{group.items.map(item => <li key={item.href}><Link href={item.href} aria-current={current?.href === item.href ? 'page' : undefined} className={'flex min-h-11 items-center rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 ' + (current?.href === item.href ? 'bg-[#edf5f0] font-semibold text-[#183f37]' : 'hover:bg-[#f5f8f6]')}><span><span className="block">{item.title}</span><span className="mt-1 block text-xs font-normal leading-5 text-[#53685e]">{item.description}</span></span></Link></li>)}</ul></section>)}</div>
    </details>
  </nav>;
}
