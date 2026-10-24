import 'server-only';
import { getHelpAccess, getHelpArticle, listHelpArticles, listHelpReleases } from './server';
import { searchHelpArticles, canOpenFeature } from './access';
import { isHelpId } from './validation';

export async function helpForIris(body: Record<string, unknown>, userId: string) {
  const message = typeof body.mensagem === 'string' ? body.mensagem.slice(0, 1000) : '';
  const news = !body.acao && /(?:o que (?:h[aá]|tem) de novo|novidades(?: da soma)?|[uú]ltimas atualiza[cç][õo]es|releases da soma)/i.test(message);
  // Explicit help requests only: career advice and PDI execution retain their flows.
  const tutorial = body.acao === 'ajuda_artigo' || (!body.acao && /(?:tutorial|passo a passo|como (?:usar|utilizar|funciona|acessar|encontrar)|onde (?:fica|encontro|acesso))/i.test(message));
  if (!news && !tutorial) return null;
  const context = await getHelpAccess();
  if (!context || context.userId !== userId) return { status: 403, payload: { erro: 'Acesso à ajuda indisponível.' } };
  if (news) {
    const releases = (await listHelpReleases(context)).slice(0, 4);
    return { status: 200, payload: { resposta: releases.length
      ? 'Estas são as novidades disponíveis para você:\n\n' + releases.map(r => `**${r.title}**\n${r.summary}\n[Ver passo a passo](/ajuda/${r.article_slug})`).join('\n\n')
      : 'As próximas novidades aparecerão aqui. Você já pode consultar o passo a passo das ferramentas na Central de Ajuda.', href: '/novidades' } };
  }
  const article = body.acao === 'ajuda_artigo'
    ? isHelpId(body.artigo_id) ? await getHelpArticle(context, 'id', body.artigo_id) : null
    : searchHelpArticles(await listHelpArticles(context), message)[0];
  if (!article) return body.acao === 'ajuda_artigo'
    ? { status: 404, payload: { erro: 'Este tutorial não está disponível para sua conta.' } }
    : { status: 200, payload: { resposta: 'Ainda não encontrei um tutorial publicado para essa pergunta. Você pode buscar na Central de Ajuda ou me contar qual etapa está tentando realizar.', href: '/ajuda' } };
  // Published content is read directly, never sent to an external model.
  const bodyWithoutImages = article.body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').slice(0, 6000);
  return { status: 200, payload: {
    resposta: `**${article.title}**\n\n${bodyWithoutImages}\n\n[Ver tutorial completo](/ajuda/${article.slug})`,
    href: canOpenFeature(article.feature_path, context) ? article.feature_path : '/ajuda/' + article.slug,
    sugestoes: article.iris_prompt ? [article.iris_prompt] : undefined,
  } };
}
