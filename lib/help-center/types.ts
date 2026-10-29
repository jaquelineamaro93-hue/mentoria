import { SAAS_MODULES } from '@/lib/saas-access';

export const HELP_AUDIENCES = ['all', 'mentorship', 'admin', ...SAAS_MODULES] as const;
export type HelpAudience = typeof HELP_AUDIENCES[number];
export type HelpArticle = {
  id: string; slug: string; title: string; summary: string; category: string;
  body: string; audience: HelpAudience; requires_iris: boolean;
  feature_path: string | null; iris_prompt: string | null;
  status: 'draft' | 'published' | 'archived'; published_at: string | null;
  updated_at: string; created_at: string;
};
export type HelpRelease = {
  id: string; article_id: string; title: string; summary: string;
  kind: 'new' | 'improvement' | 'guide' | 'notice';
  published_at: string; archived: boolean; notify: boolean;
};
export type ReleaseItem = HelpRelease & { article_slug: string; read: boolean };
export const releaseLabels: Record<HelpRelease['kind'], string> = {
  new: 'Novidade', improvement: 'Melhoria', guide: 'Conheça este recurso', notice: 'Aviso',
};
export function safeHelpPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 250 || !value.startsWith('/') ||
      value.startsWith('//') || /[\\\s#]/.test(value)) return null;
  const allowed = ['/gravacoes','/dashboard', '/onboarding', '/quem-sou-eu', '/exercicios', '/meu-pdi',
    '/pdi', '/diario', '/carreira', '/gupy', '/linkedin', '/conteudo-linkedin', '/network',
    '/percepcao-360', '/primeiros-90-dias', '/leitura-cenario', '/plano-acoes-iris',
    '/meu-plano', '/plataforma', '/perfil', '/passaporte', '/contratos'];
  try {
    const url = new URL(value, 'https://soma.invalid');
    return url.origin === 'https://soma.invalid' && allowed.includes(url.pathname) ? value : null;
  } catch { return null; }
}
