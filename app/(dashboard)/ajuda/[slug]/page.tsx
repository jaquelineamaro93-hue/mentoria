import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { canOpenFeature } from '@/lib/help-center/access';
import { getHelpAccess, getHelpArticle, helpWatermark, listHelpReleases, listHelpArticles } from '@/lib/help-center/server';
import HelpArticleNavigation from '@/components/help/HelpArticleNavigation';
import { helpHeadings, helpReadingMinutes, relatedHelpArticles } from '@/lib/help-center/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import HelpMarkdown from '@/components/help/HelpMarkdown';
import HelpWatermark from '@/components/help/HelpWatermark';
import AskIris from '@/components/help/AskIris';
import ReleaseRead from '@/components/help/ReleaseRead';
import { createAdminClient } from '@/lib/supabase/admin';
import { isHelpId } from '@/lib/help-center/validation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Passo a passo | SOMA', robots: { index: false, follow: false } };
export default async function ArticlePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ novidade?: string }> }) {
  const context = await getHelpAccess();
  if (!context) redirect('/login?next=/ajuda');
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const article = await getHelpArticle(context, 'slug', slug);
  if (!article) notFound();
  const watermark = helpWatermark(context.userId);
  // Records the account associated with the visible code, never a claim that
  // a screenshot was taken. No email, name or personal career data in the mark.
  const { error: auditError } = await createAdminClient().from('soma_help_access_log').insert({
    user_id: context.userId, article_id: article.id, watermark,
  });
  if (auditError) console.error('help_access_log_failed');
  const { novidade } = await searchParams;
  const validRelease = isHelpId(novidade) && (await listHelpReleases(context)).some(r => r.id === novidade && r.article_id === article.id);
  const catalog = (await listHelpArticles(context)).map(({ id, slug, title, summary, category }) => ({ id, slug, title, summary, category }));
  const headings = helpHeadings(article.body);
  const related = relatedHelpArticles(catalog, article);
  const index = catalog.findIndex(item => item.id === article.id);
  const previous = index > 0 ? catalog[index - 1] : null;
  const next = index >= 0 && index + 1 < catalog.length ? catalog[index + 1] : null;
  return <div className="mx-auto max-w-7xl text-black">
    <nav aria-label="Caminho na Central de Ajuda" className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#53685e]">
      <Link href="/ajuda" className="text-[#24594b] underline underline-offset-4">Central de Ajuda</Link>
      <span aria-hidden="true">/</span><Link href={'/ajuda?categoria=' + encodeURIComponent(article.category)} className="text-[#24594b] underline underline-offset-4">{article.category}</Link>
      <span aria-hidden="true">/</span><span aria-current="page">{article.title}</span>
    </nav>
    {validRelease && <ReleaseRead releaseId={novidade} />}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
      <HelpArticleNavigation articles={catalog} currentSlug={article.slug} category={article.category} headings={headings} />
      <div className="min-w-0">
        <article className="relative isolate overflow-hidden rounded-2xl border border-[#d7e3dc] bg-white p-5 sm:p-8">
          <HelpWatermark label={watermark} />
          {article.status !== 'published' && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Prévia administrativa · {article.status === 'draft' ? 'Rascunho' : 'Arquivado'}</p>}
          <p className="text-xs uppercase tracking-widest text-[#53685e]">{article.category}</p>
          <h1 className="mt-2 font-display text-3xl text-[#183f37]">{article.title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#53685e]">{article.summary}</p>
          <div className="mb-7 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#53685e]">
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} aria-hidden="true" /> Leitura de cerca de {helpReadingMinutes(article.body)} min</span>
            <time dateTime={article.updated_at}>Atualizado em {new Date(article.updated_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time>
          </div>
          <HelpMarkdown body={article.body} />
          <div className="mt-8 flex flex-wrap gap-3">
            {canOpenFeature(article.feature_path, context) && <Link href={article.feature_path!} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#183f37] px-4 py-3 text-sm font-semibold text-white">Abrir funcionalidade</Link>}
            {context.access.iris && <AskIris articleId={article.id} title={article.title} />}
          </div>
          <p className="mt-6 text-xs text-[#53685e]">Conteúdo de uso restrito à sua conta.</p>
        </article>
        {(previous || next) && <nav aria-label="Continuar explorando os tutoriais" className="mt-4 grid gap-3 sm:grid-cols-2">
          {previous ? <Link href={'/ajuda/' + previous.slug} prefetch={false} className="rounded-xl border border-[#d7e3dc] bg-white p-4 text-[#183f37] hover:border-[#24594b]"><span className="mb-2 flex items-center gap-2 text-xs text-[#53685e]"><ArrowLeft size={14} aria-hidden="true" /> Artigo anterior</span><span className="text-sm font-semibold">{previous.title}</span></Link> : <span aria-hidden="true" className="hidden sm:block" />}
          {next && <Link href={'/ajuda/' + next.slug} prefetch={false} className="rounded-xl border border-[#d7e3dc] bg-white p-4 text-[#183f37] hover:border-[#24594b]"><span className="mb-2 flex items-center gap-2 text-xs text-[#53685e]">Próximo artigo <ArrowRight size={14} aria-hidden="true" /></span><span className="text-sm font-semibold">{next.title}</span></Link>}
        </nav>}
        {related.length > 0 && <section aria-labelledby="help-related-title" className="mt-8">
          <h2 id="help-related-title" className="mb-4 text-lg font-semibold text-[#183f37]">Artigos relacionados</h2>
          <div className="grid gap-3 sm:grid-cols-2">{related.map(item => <Link key={item.id} href={'/ajuda/' + item.slug} prefetch={false} className="rounded-xl border border-[#d7e3dc] bg-white p-4 hover:border-[#24594b]">
            <BookOpen size={17} aria-hidden="true" className="mb-3 text-[#24594b]" /><span className="block text-sm font-semibold text-[#183f37]">{item.title}</span><span className="mt-2 block text-xs leading-5 text-[#53685e]">{item.summary}</span>
          </Link>)}</div>
        </section>}
        <footer className="mt-8 flex flex-wrap gap-4 border-t border-[#d7e3dc] pt-5 text-sm text-[#24594b]"><Link href="/ajuda" className="underline underline-offset-4">Central de Ajuda</Link><Link href="/novidades" className="underline underline-offset-4">Novidades da SOMA</Link></footer>
      </div>
    </div>
  </div>;
}
