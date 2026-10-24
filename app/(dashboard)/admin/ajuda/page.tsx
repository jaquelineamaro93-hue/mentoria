import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import HelpAdmin from './HelpAdmin';
import type { HelpArticle, HelpRelease } from '@/lib/help-center/types';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Conteúdos e novidades | SOMA', robots: { index: false, follow: false } };
export default async function HelpAdminPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect('/login');
  const db = createAdminClient();
  const [articles, releases] = await Promise.all([
    db.from('soma_help_articles').select('*').order('updated_at', { ascending: false }),
    db.from('soma_help_releases').select('*').order('published_at', { ascending: false }).limit(200),
  ]);
  if (articles.error || releases.error) return <p role="alert" className="rounded-xl border p-5 text-black">Não foi possível carregar os conteúdos. Recarregue a página para tentar novamente.</p>;
  return <HelpAdmin articles={articles.data as HelpArticle[]} releases={releases.data as HelpRelease[]} />;
}
