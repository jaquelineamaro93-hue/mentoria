'use client';
import Link from 'next/link';
import { useState } from 'react';
import { releaseLabels, type ReleaseItem } from '@/lib/help-center/types';
export default function ReleaseList({ items }: { items: ReleaseItem[] }) {
  const [read, setRead] = useState(new Set(items.filter(i => i.read).map(i => i.id)));
  const [error, setError] = useState('');
  async function mark(id: string) {
    setError('');
    try {
      const response = await fetch('/api/ajuda/lidas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ release_id: id }) });
      if (!response.ok) throw new Error();
      setRead(previous => new Set([...previous, id]));
      window.dispatchEvent(new Event('soma:help-reads'));
    } catch { setError('Não foi possível registrar a leitura. Tente novamente.'); }
  }
  return <div className="space-y-4">
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    {items.map(item => <article key={item.id} className="rounded-2xl border border-[#d7e3dc] bg-white p-5">
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#53685e]"><span className="rounded-full bg-[#eaf3ee] px-3 py-1 text-[#24594b]">{releaseLabels[item.kind]}</span><time dateTime={item.published_at}>{new Date(item.published_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time>{!read.has(item.id) && <span className="font-semibold text-[#24594b]">Não lida</span>}</div>
      <h2 className="mt-3 text-lg font-semibold text-[#183f37]">{item.title}</h2><p className="mt-2 text-sm leading-6 text-[#53685e]">{item.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4"><Link prefetch={false} href={'/ajuda/' + item.article_slug + '?novidade=' + item.id} className="text-sm font-semibold text-[#24594b] underline underline-offset-4">Ver como funciona</Link>
        {!read.has(item.id) && <button type="button" onClick={() => void mark(item.id)} className="min-h-11 text-sm text-[#53685e] underline underline-offset-4">Marcar como lida</button>}</div>
    </article>)}
    {!items.length && <p className="text-sm text-[#53685e]">As próximas novidades aparecerão aqui. Enquanto isso, explore a Central de Ajuda.</p>}
  </div>;
}
