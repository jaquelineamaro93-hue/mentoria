/** Rotas explicitamente autorizadas para assinantes somente de SaaS.
 * Permissões no navegador NUNCA substituem RLS e verificação no backend.
 */
export function moduloSaasParaRota(path: string, search: string): string | null {
  if (path === '/quem-sou-eu' || path.startsWith('/quem-sou-eu/')) return 'autoconhecimento';
  if (path === '/exercicios' || path.startsWith('/exercicios/')) return 'diagnostico';
  if (path === '/percepcao-360' || path.startsWith('/percepcao-360/')) return 'percepcao-360';
  if (/^\/(meu-pdi|pdi|primeiros-90-dias|leitura-cenario)(?:\/|$)/.test(path)) return 'desenvolvimento';
  if (path === '/gupy' || path.startsWith('/gupy/') ||
      path === '/simulador-cv') return 'curriculo-ats';
  if (path === '/linkedin' || path.startsWith('/linkedin/') ||
      path === '/conteudo-linkedin' || path.startsWith('/conteudo-linkedin/')) return 'linkedin';
  if (path === '/network' || path.startsWith('/network/')) return 'networking';
  if (path === '/vagas') return 'vagas';
  if (path === '/entrevista') return 'entrevistas';
  if (path === '/carreira' || path.startsWith('/carreira/')) {
    const etapa = new URLSearchParams(search).get('etapa') || 'cv';
    if (etapa === 'cv') return 'curriculo-ats';
    if (etapa === 'vagas') return 'vagas';
    if (etapa === 'entrevista') return 'entrevistas';
    return null;
  }
  if (path.startsWith('/api/pdi/')) return 'desenvolvimento';
  if (path.startsWith('/api/ferramentas-soma/reanalisar-gupy')) return 'curriculo-ats';
  return null;
}

export function rotaBasicaSaas(path: string): boolean {
  return [
    '/minha-assinatura-saas', '/planos', '/perfil',
    '/login', '/logout', '/reset-password', '/checkout',
    '/termos', '/faq', '/politica-de-privacidade',
  ].some(prefix => path === prefix || path.startsWith(prefix + '/')) ||
  [
    '/api/saas/', '/api/auth/', '/api/mercadopago/', '/api/termos/',
    '/api/product-events', '/api/profile/', '/api/trial/state',
  ].some(prefix => path === prefix || path.startsWith(prefix));
}
