'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { ADMIN_AREAS } from '@/lib/admin-navigation';
import { normalizeHelpText } from '@/lib/help-center/navigation';

export default function AdminAreaDirectory() {
  const [query, setQuery] = useState('');
  const words = normalizeHelpText(query).split(/\s+/).filter(Boolean);
  const groups = ADMIN_AREAS.map(group => ({ ...group, items: group.items.filter(item => words.every(word => normalizeHelpText(`${group.group} ${item.title} ${item.description}`).includes(word))) })).filter(group => group.items.length);
  return <>
    <label className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-[#bbcfc5] bg-white px-3 py-3 focus-within:ring-2 focus-within:ring-[#24594b]">
      <Search size={17} aria-hidden="true" className="text-[#53685e]" /><span className="sr-only">Encontrar área administrativa</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="O que você precisa gerenciar?" className="w-full min-w-0 bg-transparent text-base text-[#213d34] outline-none" />
    </label>
    <div className="grid items-start gap-6 lg:grid-cols-3">{groups.map(group => <section key={group.group} aria-label={group.group}>
      <h2 className="mb-3 text-sm font-semibold text-[#183f37]">{group.group}</h2>
      <ul className="divide-y divide-[#edf2ef] rounded-xl border border-[#d7e3dc] bg-white">{group.items.map(item => <li key={item.href}><Link href={item.href} className="flex min-h-14 items-center justify-between gap-3 rounded-lg px-4 py-3 hover:bg-[#f5f8f6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#24594b]">
        <span><span className="block text-sm font-medium text-[#213d34]">{item.title}</span><span className="mt-1 block text-xs leading-5 text-[#53685e]">{item.description}</span></span><ChevronRight size={16} aria-hidden="true" className="shrink-0 text-[#53685e]" />
      </Link></li>)}</ul>
    </section>)}</div>
    <p role="status" className={groups.length ? 'sr-only' : 'text-sm text-[#53685e]'}>{groups.length ? `${groups.reduce((count, group) => count + group.items.length, 0)} áreas encontradas` : 'Nenhuma área encontrada. Tente outro termo.'}</p>
  </>;
}
