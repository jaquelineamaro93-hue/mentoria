'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { normalizeHelpText, type HelpEntry } from '@/lib/help-center/navigation';

export default function HelpWidget({ onNavigate }: { onNavigate: () => void }) {
  const [articles, setArticles] = useState<HelpEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/ajuda', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Ajuda indisponível');
        const data = await response.json() as { articles: HelpEntry[] };
        setArticles(data.articles); setError(false);
      }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const words = normalizeHelpText(query).split(/\s+/).filter(Boolean);
  const filtered = articles.filter(article => words.every(word => normalizeHelpText(`${article.title} ${article.summary} ${article.category}`).includes(word)));
  const categories = [...new Set(filtered.map(article => article.category))];
  return <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
    <h2 className="text-base font-semibold text-[#183f37]">Como podemos ajudar?</h2>
    <label className="mt-4 flex items-center gap-2 rounded-lg border border-[#bbcfc5] bg-white px-3 py-3 focus-within:ring-2 focus-within:ring-[#24594b]">
      <Search size={17} aria-hidden="true" className="shrink-0 text-[#53685e]" /><span className="sr-only">Pesquisar tutoriais</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Qual é a sua dúvida?" className="w-full min-w-0 bg-transparent text-base text-[#213d34] outline-none" />
    </label>
    {loading && <p role="status" className="mt-4 text-sm text-[#53685e]">Carregando tutoriais...</p>}
    {error && <div role="alert" className="mt-4 text-sm text-[#53685e]">Não foi possível carregar a ajuda.<button type="button" className="ml-2 min-h-11 underline" onClick={() => { setLoading(true); setError(false); setAttempt(value => value + 1); }}>Tentar novamente</button></div>}
    {!loading && !error && <>
      <p role="status" className="mt-4 text-xs text-[#53685e]">{filtered.length} {filtered.length === 1 ? 'tutorial disponível' : 'tutoriais disponíveis'}</p>
      <div className="mt-3 divide-y divide-[#d7e3dc]">{categories.map(category => <details key={category} open={query ? true : undefined} className="py-1">
        <summary className="cursor-pointer py-3 text-sm font-semibold text-[#183f37] focus-visible:outline-2 focus-visible:outline-offset-2">{category} <span className="font-normal text-[#53685e]">({filtered.filter(article => article.category === category).length})</span></summary>
        <ul>{filtered.filter(article => article.category === category).map(article => <li key={article.id}>
          <Link href={'/ajuda/' + article.slug} prefetch={false} onClick={onNavigate} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-3 text-sm text-[#24594b] hover:bg-[#f2f7f5] focus-visible:outline-2 focus-visible:-outline-offset-2"><span>{article.title}</span><ChevronRight size={15} aria-hidden="true" className="shrink-0" /></Link>
        </li>)}</ul>
      </details>)}</div>
      {!filtered.length && <p className="mt-4 text-sm text-[#53685e]">Nenhum tutorial encontrado. Tente outra palavra ou converse com a Íris.</p>}
    </>}
    <Link href="/ajuda" onClick={onNavigate} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#24594b] underline underline-offset-4">Abrir Central de Ajuda</Link>
  </div>;
}
