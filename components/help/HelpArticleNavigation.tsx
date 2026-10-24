'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, Search } from 'lucide-react';
import { normalizeHelpText, type HelpEntry, type HelpHeading } from '@/lib/help-center/navigation';

export default function HelpArticleNavigation({ articles, currentSlug, category, headings }: {
  articles: HelpEntry[]; currentSlug: string; category: string; headings: HelpHeading[];
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const words = normalizeHelpText(query).split(/\s+/).filter(Boolean);
  const filtered = articles.filter(article => words.every(word => normalizeHelpText(`${article.title} ${article.summary} ${article.category}`).includes(word)));
  const categories = [...new Set(filtered.map(article => article.category))].sort((a, b) => a === category ? -1 : b === category ? 1 : a.localeCompare(b, 'pt-BR'));

  return <aside aria-label="Navegação da Central de Ajuda" className="order-first min-w-0 self-start xl:order-last xl:sticky xl:top-5">
    <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="help-article-navigation"
      className="mb-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#d7e3dc] bg-white px-4 py-3 text-sm font-semibold text-[#183f37] xl:hidden">
      <span className="inline-flex items-center gap-2"><BookOpen size={17} aria-hidden="true" /> Explorar outros artigos</span><ChevronDown size={17} aria-hidden="true" className={expanded ? 'rotate-180' : ''} />
    </button>
    <div id="help-article-navigation" className={(expanded ? 'block' : 'hidden xl:block') + ' rounded-2xl border border-[#d7e3dc] bg-white p-5 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto'}>
      <label className="flex items-center gap-2 rounded-lg border border-[#bbcfc5] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#24594b]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-[#53685e]" /><span className="sr-only">Buscar outros artigos</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Pesquisar artigos" className="w-full min-w-0 bg-transparent text-base text-black outline-none xl:text-sm" />
      </label>
      {!query && headings.length > 0 && <nav aria-label="Neste artigo" className="mt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#53685e]">Neste artigo</h2>
        <ul className="space-y-1.5 border-l border-[#d7e3dc] pl-3">{headings.map(heading => <li key={heading.id} className={heading.level === 3 ? 'pl-3' : undefined}>
          <a href={'#' + heading.id} onClick={() => setExpanded(false)} className="block rounded-md py-1.5 text-sm leading-5 text-[#24594b] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">{heading.title}</a>
        </li>)}</ul>
      </nav>}
      <nav aria-label="Artigos disponíveis para sua conta" className="mt-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#53685e]">Explore a Central</h2>
        <p role="status" className="sr-only">{filtered.length} artigos encontrados</p>
        {categories.map(name => <section key={name} className="mb-4 last:mb-0" aria-label={name}>
          <h3 className="mb-2 text-xs font-semibold text-[#53685e]">{name}</h3>
          <ul className="space-y-1">{filtered.filter(article => article.category === name).map(article => <li key={article.id}>
            <Link href={'/ajuda/' + article.slug} prefetch={false} aria-current={article.slug === currentSlug ? 'page' : undefined}
              className={'block rounded-lg px-3 py-2.5 text-sm leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 ' + (article.slug === currentSlug ? 'bg-[#eaf3ee] font-semibold text-[#183f37]' : 'text-[#53685e] hover:bg-[#f5f8f6] hover:text-[#183f37]')}>
              {article.title}
            </Link>
          </li>)}</ul>
        </section>)}
        {!filtered.length && <p className="text-sm leading-6 text-[#53685e]">Nenhum artigo encontrado. Tente outra palavra.</p>}
      </nav>
      <Link href="/ajuda" className="mt-5 block border-t border-[#d7e3dc] pt-4 text-sm font-semibold text-[#24594b] underline underline-offset-4">Ver todos os tutoriais</Link>
    </div>
  </aside>;
}
