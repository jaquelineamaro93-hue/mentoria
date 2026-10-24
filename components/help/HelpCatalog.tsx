'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, BookOpen } from 'lucide-react';
import type { HelpArticle } from '@/lib/help-center/types';
type Entry = Pick<HelpArticle, 'id' | 'slug' | 'title' | 'summary' | 'category'>;
export default function HelpCatalog({ articles }: { articles: Entry[] }) {
  const [search, setSearch] = useState('');
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = normalize(search).split(/\s+/).filter(Boolean);
  const filtered = articles.filter(a => words.every(w => normalize(a.title + ' ' + a.summary + ' ' + a.category).includes(w)));
  const categories = [...new Set(filtered.map(a => a.category))];
  return <>
    <label className="mb-8 flex max-w-2xl items-center gap-3 rounded-xl border border-[#bbcfc5] bg-white px-4 py-3">
      <Search size={19} aria-hidden="true" className="shrink-0 text-[#53685e]" /><span className="sr-only">Buscar tutoriais</span>
      <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="O que você quer fazer na SOMA?"
        className="min-w-0 w-full bg-transparent text-base text-black outline-none" />
    </label>
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
