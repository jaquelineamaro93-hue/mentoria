'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HELP_AUDIENCES, releaseLabels, type HelpArticle, type HelpRelease } from '@/lib/help-center/types';

type Form = Pick<HelpArticle, 'title' | 'slug' | 'summary' | 'body' | 'category' | 'audience' | 'requires_iris' | 'feature_path' | 'iris_prompt' | 'status'> & { id?: string; updated_at?: string };
const blank: Form = { title: '', slug: '', summary: '', body: '', category: 'Comece por aqui', audience: 'all', requires_iris: false, feature_path: '', iris_prompt: '', status: 'draft' };
const field = 'mt-1 w-full rounded-lg border border-[#b9cec3] bg-white px-3 py-2.5 text-base text-black focus-visible:outline-2 focus-visible:outline-[#24594b]';
const action = 'min-h-11 rounded-lg border border-[#24594b] px-4 py-2 text-sm font-semibold text-[#183f37] disabled:opacity-50';
export default function HelpAdmin({ articles, releases }: { articles: HelpArticle[]; releases: HelpRelease[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<'articles' | 'releases'>('articles');
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [release, setRelease] = useState({ title: '', summary: '', article_id: '', kind: 'guide' as HelpRelease['kind'], notify: true });
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  async function send(payload: object) {
    setBusy(true); setError(''); setFeedback('');
    try {
      const response = await fetch('/api/admin/ajuda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.');
      setFeedback('Alteração salva.'); router.refresh(); return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); return false; }
    finally { setBusy(false); }
  }
  async function upload() {
    if (!file || !form?.id) return;
    setBusy(true); setError('');
    try {
      const data = new FormData(); data.set('file', file); data.set('article_id', form.id);
      const response = await fetch('/api/admin/ajuda/midia', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setUploadUrl(`![Descrição da imagem](${result.url})`); setFile(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível enviar a imagem.'); }
    finally { setBusy(false); }
  }
  function edit(article?: HelpArticle) { setForm(article ? { ...article } : { ...blank }); setError(''); setFeedback(''); setUploadUrl(''); }
  return <div className="mx-auto max-w-6xl text-black">
    <p className="text-xs uppercase tracking-widest text-[#53685e]">Comunicação e adoção</p>
    <h1 className="mt-2 font-display text-3xl text-[#183f37]">Conteúdos e novidades</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#53685e]">Publique o passo a passo uma vez. A Central de Ajuda, o sino e a Íris usam o mesmo conteúdo e respeitam o público escolhido.</p>
    <div className="my-5 flex flex-wrap gap-3"><Link href="/ajuda" className="text-sm font-semibold text-[#24594b] underline">Ver central</Link><Link href="/novidades" className="text-sm font-semibold text-[#24594b] underline">Ver novidades</Link></div>
    <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Gestão de conteúdo">
      <button type="button" role="tab" id="help-articles-tab" aria-controls="help-articles-panel" aria-selected={tab === 'articles'} onClick={() => setTab('articles')} className={action + (tab === 'articles' ? ' bg-[#eaf3ee]' : ' bg-white')}>Tutoriais</button>
      <button type="button" role="tab" id="help-releases-tab" aria-controls="help-releases-panel" aria-selected={tab === 'releases'} onClick={() => setTab('releases')} className={action + (tab === 'releases' ? ' bg-[#eaf3ee]' : ' bg-white')}>Novidades e avisos</button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {feedback && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">{feedback}</p>}
    {tab === 'articles' && <section id="help-articles-panel" role="tabpanel" aria-labelledby="help-articles-tab">
      {!form ? <><button type="button" className={action + ' mb-5 bg-white'} onClick={() => edit()}>Novo tutorial</button><div className="space-y-3">{articles.map(article => <div key={article.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"><div><h2 className="font-semibold">{article.title}</h2><p className="mt-1 text-xs text-[#53685e]">{article.category} · {article.audience} · {article.status === 'published' ? 'Publicado' : article.status === 'draft' ? 'Rascunho' : 'Arquivado'}</p></div><div className="flex flex-wrap gap-3"><button type="button" className={action} onClick={() => edit(article)}>Editar</button><Link href={'/ajuda/' + article.slug} className={action}>Visualizar</Link></div></div>)}</div></> :
      <form onSubmit={async event => { event.preventDefault(); if (form.status === 'published' && !window.confirm('Publicar este conteúdo para o público selecionado?')) return; if (await send({ ...form, action: 'article' })) setForm(null); }} className="rounded-2xl border bg-white p-5 sm:p-7">
        <h2 className="mb-5 text-xl font-semibold">{form.id ? 'Editar tutorial' : 'Novo tutorial'}</h2>
        <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">Título<input required minLength={4} maxLength={140} className={field} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-sm">Endereço do artigo<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} className={field} placeholder="como-usar-o-pdi" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></label>
          <label className="text-sm md:col-span-2">Resumo<textarea required minLength={10} maxLength={500} rows={2} className={field} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></label>
          <label className="text-sm">Categoria<input required maxLength={80} className={field} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
          <label className="text-sm">Quem pode acessar<select className={field} value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as Form['audience'] })}>{HELP_AUDIENCES.map(a => <option key={a} value={a}>{a === 'all' ? 'Todas as contas autenticadas' : a === 'mentorship' ? 'SOMA Carreira / Mentoria' : a === 'admin' ? 'Somente administradores' : 'Módulo: ' + a}</option>)}</select></label>
          <label className="text-sm">Situação<select className={field} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Form['status'] })}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={form.requires_iris} onChange={e => setForm({ ...form, requires_iris: e.target.checked })} />Exigir também acesso à Íris</label>
          <label className="text-sm md:col-span-2">Passo a passo<textarea required minLength={20} maxLength={30000} rows={14} className={field} placeholder={'## Para que serve\n\n1. Abra a funcionalidade.\n2. Siga os passos.'} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /><span className="mt-1 block text-xs text-[#53685e]">Use títulos com ## e listas numeradas. HTML e mídias externas não são exibidos.</span></label>
          <label className="text-sm">Funcionalidade relacionada<input maxLength={250} className={field} placeholder="/meu-pdi" value={form.feature_path ?? ''} onChange={e => setForm({ ...form, feature_path: e.target.value })} /></label>
          <label className="text-sm">Orientação para a Íris<input maxLength={500} className={field} placeholder="Ajude a pessoa a começar pelo objetivo do PDI." value={form.iris_prompt ?? ''} onChange={e => setForm({ ...form, iris_prompt: e.target.value })} /></label>
        </fieldset>
        {form.id && <div className="mt-5 rounded-xl border p-4"><label className="block text-sm">Imagem protegida do tutorial<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm" disabled={busy} /></label><p className="mt-2 text-xs text-[#53685e]">PNG, JPEG ou WebP, até 4 MB. A imagem herda o acesso deste tutorial.</p><button type="button" className={action + ' mt-3'} disabled={busy || !file} onClick={() => void upload()}>Enviar imagem</button>{uploadUrl && <div className="mt-3"><p className="text-xs">Copie para o passo a passo e troque a descrição:</p><textarea readOnly aria-label="Código da imagem protegida" value={uploadUrl} className={field} /></div>}</div>}
        <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={busy} className={action + ' bg-[#eaf3ee]'}>{busy ? 'Salvando...' : form.status === 'published' ? 'Salvar e publicar tutorial' : 'Salvar tutorial'}</button><button type="button" disabled={busy} className={action} onClick={() => setForm(null)}>Cancelar</button></div>
      </form>}
    </section>}
    {tab === 'releases' && <section id="help-releases-panel" role="tabpanel" aria-labelledby="help-releases-tab"><form onSubmit={async e => { e.preventDefault(); if (!window.confirm('Publicar esta novidade? Se o aviso estiver ativado, aparecerá no sino das contas elegíveis.')) return; if (await send({ ...release, action: 'release' })) setRelease({ title: '', summary: '', article_id: '', kind: 'guide', notify: true }); }} className="mb-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Publicar uma novidade</h2><p className="mb-4 text-sm text-[#53685e]">O público e as permissões são herdados do tutorial. Use “Conheça este recurso” para apresentar funcionalidades que já existiam.</p>
      <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2"><label className="text-sm">Título<input required minLength={4} maxLength={140} value={release.title} onChange={e => setRelease({ ...release, title: e.target.value })} className={field} /></label><label className="text-sm">Tipo<select className={field} value={release.kind} onChange={e => setRelease({ ...release, kind: e.target.value as HelpRelease['kind'] })}>{Object.entries(releaseLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-sm md:col-span-2">Resumo<textarea required minLength={10} maxLength={500} rows={3} value={release.summary} onChange={e => setRelease({ ...release, summary: e.target.value })} className={field} /></label><label className="text-sm">Tutorial relacionado<select required className={field} value={release.article_id} onChange={e => setRelease({ ...release, article_id: e.target.value })}><option value="">Selecione um tutorial publicado</option>{articles.filter(a => a.status === 'published').map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={release.notify} onChange={e => setRelease({ ...release, notify: e.target.checked })} />Mostrar contador de não lida no sino</label></fieldset><button disabled={busy} className={action + ' mt-5 bg-[#eaf3ee]'}>{busy ? 'Publicando...' : 'Publicar novidade'}</button>
    </form><div className="space-y-3">{releases.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-[#53685e]">{releaseLabels[item.kind]} · {item.archived ? 'Arquivada' : 'Publicada'} · {new Date(item.published_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p></div>{!item.archived && <button type="button" disabled={busy} className={action} onClick={() => { if (window.confirm('Arquivar esta novidade?')) void send({ action: 'archive-release', id: item.id }); }}>Arquivar</button>}</div>)}</div></section>}
  </div>;
}
