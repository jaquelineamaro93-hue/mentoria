import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { canOpenFeature } from '@/lib/help-center/access';
import { getHelpAccess, getHelpArticle, helpWatermark, listHelpReleases } from '@/lib/help-center/server';
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
  return <div className="mx-auto max-w-4xl text-black">
    <Link href="/ajuda" className="text-sm text-[#24594b] underline underline-offset-4">← Central de Ajuda</Link>
    {validRelease && <ReleaseRead releaseId={novidade} />}
    <article className="relative mt-5 isolate overflow-hidden rounded-2xl border border-[#d7e3dc] bg-white p-5 sm:p-8">
      <HelpWatermark label={watermark} />
      {article.status !== 'published' && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Prévia administrativa · {article.status === 'draft' ? 'Rascunho' : 'Arquivado'}</p>}
      <p className="text-xs uppercase tracking-widest text-[#53685e]">{article.category}</p>
      <h1 className="mt-2 font-display text-3xl text-[#183f37]">{article.title}</h1>
      <p className="mb-7 mt-3 text-sm leading-6 text-[#53685e]">{article.summary}</p>
      <HelpMarkdown body={article.body} />
      <div className="mt-8 flex flex-wrap gap-3">
        {canOpenFeature(article.feature_path, context) && <Link href={article.feature_path!} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#183f37] px-4 py-3 text-sm font-semibold text-white">Abrir funcionalidade</Link>}
        {context.access.iris && <AskIris articleId={article.id} title={article.title} />}
      </div>
      <p className="mt-6 text-xs text-[#53685e]">Atualizado em {new Date(article.updated_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · Conteúdo de uso restrito.</p>
    </article>
  </div>;
}
