import type { HelpArticle } from './types';
import { saasCanVisit, type SaasAccess } from '@/lib/saas-access';

export type HelpAccess = { userId: string; admin: boolean; access: SaasAccess };
export function canReadArticle(article: Pick<HelpArticle, 'status' | 'published_at' | 'audience' | 'requires_iris'>, context: HelpAccess, now = Date.now()) {
  if (context.admin) return true;
  if (article.status !== 'published' || !article.published_at || Date.parse(article.published_at) > now) return false;
  if (article.requires_iris && !context.access.iris) return false;
  if (article.audience === 'all') return true;
  if (article.audience === 'admin') return false;
  if (article.audience === 'mentorship') return context.access.mentorship;
  return context.access.mentorship || context.access.modules.includes(article.audience);
}
export function canOpenFeature(path: string | null, context: HelpAccess) {
  return !!path && (context.admin || (context.access.mentorship || context.access.saas) &&
    saasCanVisit(context.access, path.split('?')[0], path.split('?')[1]));
}
export function searchHelpArticles(articles: HelpArticle[], query: string) {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = normalize(query).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['como','usar','utilizar','funciona','acessar','encontrar','onde','fica','encontro','acesso','tutorial','passo','para','pela','pelo','com','uma','meu','minha','soma'].includes(w));
  if (!words.length) return articles;
  return articles.map(article => {
    const title = normalize(article.title + ' ' + article.category);
    const rest = normalize(article.summary + ' ' + article.body);
    return { article, score: words.reduce((sum, word) => sum + (title.includes(word) ? 3 : rest.includes(word) ? 1 : 0), 0) };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.article);
}
