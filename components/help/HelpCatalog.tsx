'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, BookOpen } from 'lucide-react';
import { normalizeHelpText, type HelpEntry } from '@/lib/help-center/navigation';
export default function HelpCatalog({ articles, initialCategory }: { articles: HelpEntry[]; initialCategory?: string }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory ?? '');
  const allCategories = [...new Set(articles.map(article => article.category))];
  const words = normalizeHelpText(search).split(/\s+/).filter(Boolean);
  const filtered = articles.filter(a => (!category || a.category === category) && words.every(w => normalizeHelpText(a.title + ' ' + a.summary + ' ' + a.category).includes(w)));
  const categories = [...new Set(filtered.map(a => a.category))];
  return <>
    <label className="mb-5 flex w-full items-center gap-3 rounded-xl border border-[#bbcfc5] bg-white px-4 py-4 focus-within:ring-2 focus-within:ring-[#24594b]">
      <Search size={19} aria-hidden="true" className="shrink-0 text-[#53685e]" /><span className="sr-only">Buscar tutoriais</span>
      <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="O que você quer fazer na SOMA?"
        className="min-w-0 w-full bg-transparent text-base text-black outline-none" />
    </label>
    <div role="group" aria-label="Filtrar artigos por coleção" className="mb-6 flex flex-wrap gap-2">
      {[{ name: 'Todos', value: '', count: articles.length }, ...allCategories.map(name => ({ name, value: name, count: articles.filter(article => article.category === name).length }))].map(item =>
        <button key={item.value} type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)}
          className={'min-h-11 rounded-xl border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ' + (category === item.value ? 'border-[#24594b] bg-[#eaf3ee] font-semibold text-[#183f37]' : 'border-[#d7e3dc] bg-white text-[#53685e] hover:border-[#24594b]')}>
          {item.name} <span className="ml-1 text-xs">({item.count})</span>
        </button>)}
    </div>
    <p className="mb-6 text-sm text-[#53685e]">{filtered.length} {filtered.length === 1 ? 'artigo disponível' : 'artigos disponíveis'}{category ? ' em ' + category : ' para sua conta'}</p>
    <p className="sr-only" role="status">{filtered.length} tutoriais encontrados</p>
    {categories.map(category => <section key={category} className="mb-8" aria-label={category}>
      <h2 className="mb-3 text-lg font-semibold text-[#183f37]">{category}</h2>
      <div className="grid gap-3 md:grid-cols-2">{filtered.filter(a => a.category === category).map(article =>
        <Link key={article.id} href={'/ajuda/' + article.slug} prefetch={false} className="group rounded-2xl border border-[#d7e3dc] bg-white p-5 text-black transition hover:border-[#24594b] focus-visible:outline-2 focus-visible:outline-offset-2">
          <BookOpen size={19} className="mb-3 text-[#24594b]" aria-hidden="true" />
          <h3 className="font-semibold">{article.title}</h3><p className="mt-2 text-sm leading-6 text-[#53685e]">{article.summary}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#24594b]">Ver passo a passo <ArrowRight size={15} aria-hidden="true" /></span>
        </Link>)}</div>
    </section>)}
    {!filtered.length && <p className="rounded-xl border p-5 text-sm text-[#53685e]">Não encontramos um tutorial para essa busca. Tente outra palavra ou consulte as novidades.</p>}
  </>;
}
