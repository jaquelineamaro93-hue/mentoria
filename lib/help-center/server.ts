import 'server-only';
import { createHmac } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canReadArticle, type HelpAccess } from './access';
import type { HelpArticle, HelpRelease, ReleaseItem } from './types';
import type { SaasAccess } from '@/lib/saas-access';

export async function getHelpAccess(): Promise<HelpAccess | null> {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || user.is_anonymous) return null;
  const [profile, state] = await Promise.all([
    db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
    db.rpc('soma_saas_state'),
  ]);
  if (profile.error || !profile.data || state.error || !state.data ||
      !Array.isArray(state.data.modules) || typeof state.data.mentorship !== 'boolean') {
    throw new Error('Não foi possível validar seu acesso à central. Tente novamente.');
  }
  return { userId: user.id, admin: profile.data.is_admin === true, access: state.data as SaasAccess };
}
export function helpWatermark(userId: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Proteção da documentação indisponível.');
  const code = createHmac('sha256', secret).update('soma-docs-v1:' + userId).digest('hex').slice(0, 12).toUpperCase();
  const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `SOMA · Uso restrito · ${code} · ${date}`;
}
// Server-only and never cached across accounts. The service client can read
// these tables only after identity and product access have been verified.
export async function listHelpArticles(context: HelpAccess, includeDrafts = false) {
  let query = createAdminClient().from('soma_help_articles').select('*').order('title');
  if (!includeDrafts || !context.admin) query = query.eq('status', 'published').lte('published_at', new Date().toISOString());
  const { data, error } = await query;
  if (error) throw new Error('Não foi possível carregar os tutoriais. Tente novamente.');
  return (data as HelpArticle[] ?? []).filter(article => canReadArticle(article, context));
}
export async function getHelpArticle(context: HelpAccess, field: 'id' | 'slug', value: string) {
  const { data, error } = await createAdminClient().from('soma_help_articles').select('*').eq(field, value).maybeSingle();
  if (error) throw new Error('Não foi possível carregar este tutorial.');
  if (!data || !canReadArticle(data as HelpArticle, context)) return null;
  return data as HelpArticle;
}
export async function listHelpReleases(context: HelpAccess): Promise<ReleaseItem[]> {
  const db = createAdminClient();
  const [articles, releases, reads] = await Promise.all([
    listHelpArticles(context),
    db.from('soma_help_releases').select('*').eq('archived', false).lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false }).limit(200),
    db.from('soma_help_reads').select('release_id').eq('user_id', context.userId),
  ]);
  if (releases.error || reads.error) throw new Error('Não foi possível carregar as novidades. Tente novamente.');
  const map = new Map(articles.filter(a => a.status === 'published').map(article => [article.id, article]));
  const seen = new Set((reads.data ?? []).map(row => row.release_id));
  return (releases.data as HelpRelease[] ?? []).filter(release => map.has(release.article_id)).map(release => ({
    ...release, article_slug: map.get(release.article_id)!.slug, read: seen.has(release.id),
  }));
}
