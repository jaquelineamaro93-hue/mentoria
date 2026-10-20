/**
 * Ponto único de mapeamento de módulos para páginas e ações de API.
 * Rotas que fazem parte da Mentoria, como gravações de sessões e
 * agendamentos 1:1, NÃO são módulos comercializados.
 * Habilitar enforce_access no catálogo ativa estes gates.
 */
export type ModuleSlug =
  | 'autoconhecimento' | 'diagnostico' | 'percepcao-360'
  | 'curriculo-ats' | 'linkedin' | 'entrevistas'
  | 'desenvolvimento' | 'networking' | 'vagas';

const apiActions:Record<string,ModuleSlug>={
  '/api/gerar-mapa-essencia':'autoconhecimento',
  '/api/gerar-bussola':'autoconhecimento',
  '/api/gerar-evolucao-via':'diagnostico',
  '/api/pdi/reflexao':'desenvolvimento',
  '/api/pdi/gerar-plano':'desenvolvimento',
};

export function moduleForRequest(pathname:string,search:URLSearchParams):ModuleSlug|null {
  const path=pathname.replace(/\/+$/,'')||'/';
  if(apiActions[path])return apiActions[path];
  if(path==='/quem-sou-eu'||path.startsWith('/quem-sou-eu/'))return 'autoconhecimento';
  if(path==='/exercicios'||path.startsWith('/exercicios/'))return 'diagnostico';
  if(path==='/percepcao-360'||path.startsWith('/percepcao-360/'))return 'percepcao-360';
  if(path==='/simulador-cv'||path==='/gupy'||path.startsWith('/simulador-cv/'))return 'curriculo-ats';
  if(path==='/linkedin'||path==='/conteudo-linkedin'||path.startsWith('/linkedin/'))return 'linkedin';
  if(path==='/entrevista'||path.startsWith('/entrevista/'))return 'entrevistas';
  if(path==='/meu-pdi'||path==='/pdi'||path==='/leitura-cenario'||path==='/primeiros-90-dias')return 'desenvolvimento';
  if(path==='/network'||path.startsWith('/network/'))return 'networking';
  if(path==='/vagas'||path.startsWith('/vagas/'))return 'vagas';
  if(path==='/carreira'||path.startsWith('/carreira/')){
    const step=search.get('etapa')||'cv';
    if(step==='cv')return 'curriculo-ats';
    if(step==='entrevista')return 'entrevistas';
    if(step==='vagas')return 'vagas';
  }
  return null;
}
