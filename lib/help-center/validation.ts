import { HELP_AUDIENCES, safeHelpPath, type HelpArticle, type HelpRelease } from './types';

const str = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const isHelpId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function parseHelpArticle(body: Record<string, unknown>) {
  const title = str(body.title, 140), slug = str(body.slug, 120);
  const summary = str(body.summary, 500), content = str(body.body, 30000), category = str(body.category, 80);
  if (title.length < 4 || summary.length < 10 || content.length < 20 || !category ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Preencha título, endereço, resumo, categoria e passo a passo.');
  if (!HELP_AUDIENCES.includes(body.audience as HelpArticle['audience']) ||
      !['draft', 'published', 'archived'].includes(String(body.status))) throw new Error('Público ou situação inválidos.');
  const feature = body.feature_path ? safeHelpPath(body.feature_path) : null;
  if (body.feature_path && !feature) throw new Error('Escolha um endereço interno válido da SOMA.');
  return { title, slug, summary, body: content, category,
    audience: body.audience as HelpArticle['audience'], status: body.status as HelpArticle['status'],
    requires_iris: body.requires_iris === true, feature_path: feature, iris_prompt: str(body.iris_prompt, 500) || null };
}
export function parseHelpRelease(body: Record<string, unknown>) {
  const title = str(body.title, 140), summary = str(body.summary, 500);
  if (title.length < 4 || summary.length < 10 || !isHelpId(body.article_id) ||
      !['new', 'improvement', 'guide', 'notice'].includes(String(body.kind))) throw new Error('Preencha título, resumo, tutorial e tipo da novidade.');
  return { title, summary, article_id: body.article_id, kind: body.kind as HelpRelease['kind'], notify: body.notify === true };
}
