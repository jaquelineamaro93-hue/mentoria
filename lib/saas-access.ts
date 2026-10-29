/** Shared route classification. Unknown private routes require mentorship. */
export const SAAS_MODULES = ['autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas'] as const;
export type SaasAccess = { saas: boolean; mentorship: boolean; modules: string[]; iris: boolean; whatsapp: boolean; trialEndsAt: string | null };
export function moduleForPath(path: string, search = ''): string | null {
  const is = (prefix: string) => path === prefix || path.startsWith(prefix + '/');
  if (is('/carreira')) { const step = new URLSearchParams(search).get('etapa'); return step === 'vagas' ? 'vagas' : step === 'entrevista' ? 'entrevistas' : 'curriculo-ats'; }
  if (['/quem-sou-eu','/api/gerar-mapa-essencia','/api/gerar-bussola'].some(is)) return 'autoconhecimento';
  if (['/exercicios','/api/gerar-analise-via','/api/gerar-evolucao-via','/api/extrair-via-pdf','/api/gerar-resumo-perfil'].some(is)) return 'diagnostico';
  if (['/percepcao-360','/api/percepcao-360'].some(is)) return 'percepcao-360';
  if (['/simulador-cv','/gupy','/api/gerar-simulacao-cv','/api/mercadopago/comprar-simulacao-cv','/api/ferramentas-soma/reanalisar-gupy'].some(is)) return 'curriculo-ats';
  if (['/linkedin','/conteudo-linkedin','/api/linkedin-content'].some(is)) return 'linkedin';
  if (['/entrevista','/api/entrevista'].some(is)) return 'entrevistas';
  if (['/meu-pdi','/pdi','/primeiros-90-dias','/leitura-cenario','/api/pdi'].some(is)) return 'desenvolvimento';
  if (is('/network')) return 'networking';
  if (['/vagas','/api/vagas','/api/download-template-vagas'].some(is)) return 'vagas';
  return null;
}
const shared = ['/gravacoes','/api/aprender','/ajuda','/novidades','/api/ajuda','/contratos','/plataforma','/como-funciona','/depoimentos','/payment-success','/payment-pending','/payment-failure','/perfil','/faq','/termos','/planos','/renovar','/login','/checkout','/reset-password','/magic-login','/auth','/api/saas','/api/auth','/api/perfil','/api/activity','/api/product-events','/api/hero-collage','/api/social','/api/webhooks','/api/mercadopago/webhook','/api/mercadopago/criar-assinatura','/api/mercadopago/create-preference'];
export function saasCanVisit(access: SaasAccess, path: string, search = '') {
  if (!access.saas || access.mentorship) return true;
  if (path === '/' || shared.some(prefix => path === prefix || path.startsWith(prefix + '/'))) return true;
  if (path === '/plano-acoes-iris' || path.startsWith('/api/copiloto')) return access.iris;
  const module = moduleForPath(path, search);
  return module !== null && access.modules.includes(module);
}
