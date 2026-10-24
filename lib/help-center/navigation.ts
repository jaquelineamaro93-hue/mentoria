import type { HelpArticle } from './types';

export type HelpEntry = Pick<HelpArticle, 'id' | 'slug' | 'title' | 'summary' | 'category'>;
export type HelpHeading = { id: string; title: string; level: 2 | 3; line: number };
export const normalizeHelpText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Stable IDs for both the server-rendered headings and their navigation links. */
export function helpHeadings(body: string): HelpHeading[] {
  const seen = new Map<string, number>();
  let fence: string | null = null;
  const headings: HelpHeading[] = [];
  body.split('\n').forEach((line, index) => {
    const marker = line.trimStart().match(/^(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return;
    }
    if (fence) return;
    const match = line.match(/^(#{2,3})\s+(.+?)(?:\s+#+)?\s*$/);
    if (!match) return;
    const title = match[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
    const key = normalizeHelpText(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao';
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    headings.push({ id: `ajuda-${key}${count > 1 ? '-' + count : ''}`, title, level: match[1].length as 2 | 3, line: index + 1 });
  });
  return headings;
}

export function helpReadingMinutes(body: string) {
  const plain = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#*_`>]/g, '').trim();
  return Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 200));
}

/** Receives only metadata already authorized by the server. */
export function relatedHelpArticles(articles: HelpEntry[], current: HelpEntry, limit = 3) {
  const common = new Set(['como','para','com','seu','sua','suas','seus','meu','minha','soma','uma','por','que','das','dos','nos','nas','conheca','entenda','usar','preencha','acompanhe','consulte','converse','encontre','registre','responda']);
  const terms = new Set(normalizeHelpText(current.title).split(/\W+/).filter(term => term.length > 2 && !common.has(term)));
  return articles.filter(article => article.id !== current.id).map(article => ({ article,
    score: (article.category === current.category ? 3 : 0) + normalizeHelpText(article.title).split(/\W+/).filter(term => terms.has(term)).length * 4,
  })).sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, 'pt-BR'))
    .slice(0, limit).map(item => item.article);
}
