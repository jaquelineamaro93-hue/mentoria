'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { releaseLabels, type ReleaseItem } from '@/lib/help-center/types';

export default function NewsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ReleaseItem[]>([]);
  const [error, setError] = useState('');
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/ajuda?view=novidades', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (active) { setItems(data.releases ?? []); setError(''); }
      } catch { if (active) setError('Não foi possível carregar as novidades.'); }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    void load();
    window.addEventListener('soma:help-reads', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.removeEventListener('soma:help-reads', onVisible); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('keydown', escape); document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  const unread = items.filter(item => item.notify && !item.read).length;
  return <div ref={container} className="relative shrink-0">
    <button ref={button} type="button" onClick={() => setOpen(value => !value)} aria-label={unread ? `Novidades da SOMA, ${unread} não lidas` : 'Novidades da SOMA'} aria-expanded={open} aria-controls="soma-news-panel"
      className="relative grid size-11 place-items-center rounded-xl text-[#183f37] hover:bg-[#edf4ef] focus-visible:outline-2 focus-visible:outline-offset-2">
      <Bell size={21} aria-hidden="true" />{unread > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-[#183f37] px-1 text-center text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <div id="soma-news-panel" ref={panel} tabIndex={-1} role="dialog" aria-label="Novidades da SOMA" className="absolute right-0 top-14 z-[90] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-[#d7e3dc] bg-white p-4 text-black shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold text-[#183f37]">Novidades da SOMA</h2><button type="button" onClick={() => { setOpen(false); button.current?.focus(); }} aria-label="Fechar novidades" className="grid size-10 place-items-center rounded-lg hover:bg-gray-100"><X size={18} aria-hidden="true" /></button></div>
      {error ? <p role="status" className="text-sm text-[#53685e]">{error}</p> : items.slice(0, 4).map(item => <Link key={item.id} prefetch={false} href={'/ajuda/' + item.article_slug + '?novidade=' + item.id} onClick={() => setOpen(false)} className="mb-2 block rounded-xl border border-[#e3eae5] p-3 hover:bg-[#f4f8f5]">
        <span className="text-xs text-[#53685e]">{releaseLabels[item.kind]}{!item.read ? ' · Não lida' : ''}</span><strong className="mt-1 block text-sm text-[#183f37]">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-[#53685e]">{item.summary}</span>
      </Link>)}
      {!error && !items.length && <p className="py-3 text-sm text-[#53685e]">As próximas novidades aparecerão aqui.</p>}
      <div className="mt-3 flex flex-wrap gap-4 border-t pt-3 text-sm font-semibold text-[#24594b]"><Link href="/novidades" onClick={() => setOpen(false)}>Ver todas</Link><Link href="/ajuda" onClick={() => setOpen(false)}>Central de Ajuda</Link></div>
    </div>}
  </div>;
}
