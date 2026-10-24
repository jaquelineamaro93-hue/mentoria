/**
 * Pesquisa pública exclusiva da Íris SOMA.
 * Somente public.crm_radar_jobs_public e registros aprovados de
 * public.agencias_sugeridas. Nunca consultar perfis, CVs, Open to Work,
 * usuários, histórico, favoritos ou matches de outra pessoa.
 *
 * A requisição usa apenas a chave pública ANON, sem cookies e sem JWT
 * de mentorados. Buscas externas usam termos genéricos pré-definidos,
 * não textos individuais nem preferências pessoais da conta.
 */
const API = 'https://rwkbpafpniwzvlkfngag.supabase.co/rest/v1/';
const RADAR = 'https://conexaocrm.com/vagas/';
const MAX_JOBS = 120;
const simplificar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const curto = (v: unknown, n = 140) => typeof v === 'string'
  ? v.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '';
const markdownSeguro = (v: unknown, n = 140) =>
  curto(v, n).replace(/[\[\]()<>*_#|]/g, '').trim();
const campo = (v: unknown) => typeof v === 'string' ? v : '';
type Linha = Record<string, unknown>;
type Area = 'crm' | 'cs' | 'cx' | 'growth' | 'marketing' | 'dados' | 'produto';
export type TipoPesquisaIris = 'consultorias' | 'vagas' | null;
export type ResultadoPesquisaIris = { resposta: string; sugestoes: string[]; href?: string };
type Consultoria = { nome: string; site: string; descricao: string; origem: string };

function linkSeguro(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 650) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password &&
      u.hostname !== 'localhost' && !u.hostname.endsWith('.local') ? u.href : null;
  } catch {
    return null;
  }
}
const recente = (v: unknown, dias: number) => {
  const t = Date.parse(campo(v));
  return Number.isFinite(t) && t <= Date.now() + 86400000 && t >= Date.now() - dias * 86400000;
};

export function detectarPesquisaIris(pedido: string, contexto = ''): TipoPesquisaIris {
  const p = simplificar(pedido).trim();
  const anterior = simplificar(contexto.slice(-3400));
  const continuacao = /^(?:(?:me )?(?:traga|mostre|indique|de|busque|encontre) )?(?:mais|outras|outros|novas|novos|alternativas)\b/.test(p);
  const consultoria = /\b(consultori\w*|agenci\w*|parceir\w* de crm|empresas? especializad\w*)\b/.test(p);
  const vaga = /\b(vagas?|empregos?|oportunidades|posicoes|processos seletivos)\b/.test(p);
  const busca = /\b(bus(c|q)\w*|procur\w*|encontr\w*|pesquis\w*|list\w*|mostre|traga|indique|quais|onde|tem|existem|abert\w*|quero|preciso|mais|outras)\b/.test(p);
  // Consultoria de carreira ou ERP sem CRM não é pesquisa de fornecedores CRM.
  if (consultoria && /\b(crm|salesforce|hubspot|rd station|relacionamento|lifecycle|retencao|revops)\b/.test(p)) return 'consultorias';
  // Pedidos para escrever currículos, analisar compatibilidade ou orientar não são busca externa.
  if (/\b(curricul\w*|\bcv\b|reescrev\w*|analis\w*|compar\w*|compatibilidade|aderencia)\b/.test(p) &&
    !/\b(?:busque|buscar|encontre|encontrar|pesquise|pesquisar|procure|procurar|traga|liste|mostre)\b/.test(p)) return null;
  if (vaga && busca) return 'vagas';
  if (continuacao && /consultorias de crm encontradas/.test(anterior)) return 'consultorias';
  if (continuacao && /vagas publicas encontradas/.test(anterior)) return 'vagas';
  return null;
}

export function areaDaBusca(pedido: string, contexto = ''): Area {
  const p = simplificar(pedido);
  const anterior = simplificar(contexto.slice(-650));
  const t = /\b(crm|customer success|sucesso do cliente|customer experience|experiencia do cliente|growth|marketing|dados|produto)\b/.test(p)
    ? p : p + ' ' + anterior;
  if (/customer success|sucesso do cliente/.test(t)) return 'cs';
  if (/customer experience|experiencia do cliente|\bcx\b/.test(t)) return 'cx';
  if (/\bgrowth\b/.test(t)) return 'growth';
  if (!/\bcrm\b/.test(t) && /marketing|martech/.test(t)) return 'marketing';
  if (!/\bcrm\b/.test(t) && /dados|analytics|data analyst/.test(t)) return 'dados';
  if (!/\bcrm\b/.test(t) && /produto|product manager|product owner/.test(t)) return 'produto';
  return 'crm';
}
const areas: Record<Area, { nome: string; termo: string; filtro: RegExp }> = {
  crm: { nome: 'CRM', termo: 'CRM', filtro: /\bcrm\b|lifecycle|marketing cloud|salesforce marketing|relacionamento com cliente/i },
  cs: { nome: 'Customer Success', termo: 'Customer Success', filtro: /customer success|sucesso do cliente/i },
  cx: { nome: 'Experiência do Cliente', termo: 'Customer Experience', filtro: /customer experience|experi[eê]ncia do cliente|\bcx\b/i },
  growth: { nome: 'Growth', termo: 'Growth', filtro: /\bgrowth\b|crescimento/i },
  marketing: { nome: 'Marketing', termo: 'Marketing', filtro: /marketing|martech/i },
  dados: { nome: 'Dados', termo: 'Dados', filtro: /dados|analytics|data analyst|business intelligence/i },
  produto: { nome: 'Produto', termo: 'Produto', filtro: /produto|product manager|product owner/i },
};
function linkedin(tema: string): string {
  const u = new URL('https://www.linkedin.com/jobs/search/');
  u.searchParams.set('keywords', tema);
  u.searchParams.set('location', 'Brasil');
  u.searchParams.set('f_TPR', 'r2592000');
  return u.href;
}
/** Nenhum parâmetro é derivado de nome, CV, cidade pessoal ou perfil do usuário. */
async function lerColecao(
  table: 'crm_radar_jobs_public' | 'agencias_sugeridas',
  query: Record<string, string>,
  fetcher: typeof fetch
): Promise<Linha[] | null> {
  const chave = process.env.CONEXAO_CRM_PUBLIC_ANON_KEY?.trim();
  if (!chave || chave.length < 60 || /\s/.test(chave)) return null;
  const u = new URL(table, API);
  for (const [key, value] of Object.entries(query)) u.searchParams.set(key, value);
  try {
    const r = await fetcher(u.href, {
      method: 'GET',
      headers: { apikey: chave, Authorization: 'Bearer ' + chave, Accept: 'application/json' },
      cache: 'no-store', redirect: 'error', credentials: 'omit',
      signal: AbortSignal.timeout(6500),
    });
    if (!r.ok) return null;
    const data: unknown = await r.json();
    if (!Array.isArray(data)) return null;
    return data.slice(0, MAX_JOBS).filter(
      (value): value is Linha => !!value && typeof value === 'object' && !Array.isArray(value)
    );
  } catch { return null; }
}
const complementares: Consultoria[] = [
  { nome: 'Pmweb', site: 'https://www.pmweb.com.br/',
    descricao: 'Consultoria de CRM, jornadas e marketing de relacionamento.',
    origem: 'Serviços confirmados no site institucional' },
  { nome: 'Monks', site: 'https://www.monks.com/',
    descricao: 'Serviços de CRM, automação e estratégia de relacionamento.',
    origem: 'Atuação em CRM confirmada no site institucional' },
];

/** Nunca sugerir ERP isolado como consultoria de CRM. */
export function filtrarConsultorias(linhas: Linha[], contexto = '', outras = false): Consultoria[] {
  const aprovadas: Consultoria[] = [];
  for (const r of linhas) {
    if (r.aprovado !== true) continue;
    const nome = markdownSeguro(r.nome, 90), site = linkSeguro(r.site);
    const especialidade = markdownSeguro(r.especialidade, 100);
    const descricao = markdownSeguro(r.descricao, 380);
    if (!nome || !site) continue;
    const evidencias = nome + ' ' + especialidade + ' ' + descricao;
    if (!/\bcrm\b|customer relationship|lifecycle|salesforce|hubspot|fideliza[cç][aã]o|reten[cç][aã]o|revops|automa[cç][aã]o de marketing/i.test(evidencias)) continue;
    aprovadas.push({
      nome, site, descricao: descricao || especialidade || 'Consultoria especializada em CRM',
      origem: 'Diretório público de agências aprovadas da Conexão CRM',
    });
  }
  const unicas = [...aprovadas, ...complementares].filter(
    (c, i, all) => all.findIndex(z => simplificar(z.nome) === simplificar(c.nome)) === i
  );
  return (outras ? unicas.filter(c => !simplificar(contexto).includes(simplificar(c.nome))) : unicas).slice(0, 3);
}
export type VagaIris = { titulo: string; empresa?: string; local?: string; modelo?: string;
  url: string; origem: string; tipo: 'bot' | 'comunidade' };
export function filtrarVagas(linhas: Linha[], area: Area, contexto = '', outras = false): VagaIris[] {
  const vagas: VagaIris[] = [], links = new Set<string>();
  for (const r of linhas) {
    if (r.availability_status !== 'listed') continue;
    const titulo = markdownSeguro(r.title || r.cargo, 100);
    const descricao = curto(r.descricao_resumo, 180);
    if (!titulo || !areas[area].filtro.test(titulo + ' ' + descricao + ' ' + campo(r.categoria_slug))) continue;
    if (!recente(r.published_at || r.found_at || r.created_at, 25)) continue;
    const comunidade = r.job_origin === 'community';
    if (!comunidade && !recente(r.availability_checked_at, 2)) continue;
    const url = linkSeguro(r.url);
    if (!url || links.has(url) || (outras && contexto.includes(url))) continue;
    links.add(url);
    const empresa = markdownSeguro(r.company || r.empresa, 95);
    const local = markdownSeguro(r.location || r.regiao, 90);
    const modelo = markdownSeguro(r.modalidade_normalizada || r.modelo, 55);
    vagas.push({ titulo, empresa: empresa || undefined, local: local || undefined,
      modelo: modelo && simplificar(modelo) !== simplificar(local) ? modelo : undefined,
      url, origem: comunidade ? 'Conexão CRM, comunidade' : 'Conexão CRM, Radar',
      tipo: comunidade ? 'comunidade' : 'bot' });
    if (vagas.length >= 5) break;
  }
  return vagas;
}

export async function pesquisarPublicamente(
  tipo: Exclude<TipoPesquisaIris, null>, pedido: string, contexto = '',
  fetcher: typeof fetch = fetch
): Promise<ResultadoPesquisaIris> {
  const outras = /\b(outras|outros|mais|novas|novos|alternativas)\b/.test(simplificar(pedido));
  if (tipo === 'consultorias') {
    const linhas = await lerColecao('agencias_sugeridas', {
      select: 'nome,especialidade,descricao,site,aprovado',
      aprovado: 'is.true', order: 'nome.asc', limit: '70',
    }, fetcher);
    if (linhas === null) return {
      resposta: '**A consulta ao diretório público de CRM está indisponível agora.** Não vou inventar nomes ou substituir consultorias de CRM por empresas que atuam apenas com ERP.',
      sugestoes: ['Quero tentar buscar consultorias de CRM novamente'],
    };
    const empresas = filtrarConsultorias(linhas, contexto, outras);
    if (!empresas.length) return {
      resposta: '**Consultei o diretório e não encontrei outras consultorias de CRM diferentes das já apresentadas.** Prefiro não repetir nomes nem incluir empresas de ERP sem comprovação de atuação em CRM.',
      sugestoes: ['Quero buscar vagas de CRM'],
    };
    const itens = empresas.map((a, i) => String(i + 1) + '. **[' + a.nome + '](' + a.site + ')**: ' +
      a.descricao + '\n   Fonte: ' + a.origem).join('\n\n');
    return {
      resposta: '**Consultorias de CRM encontradas:**\n\n' + itens +
        '\n\nSelecionei empresas com evidência de atuação em CRM. Não incluí consultorias que trabalham apenas com ERP.',
      sugestoes: ['Quero ver outras consultorias de CRM', 'Quero buscar vagas de CRM'],
      href: 'https://conexaocrm.com/',
    };
  }

  const area = areaDaBusca(pedido, contexto), regra = areas[area];
  const urlLinkedin = linkedin(regra.termo);
  // Os filtros externos são genéricos. Nunca enviamos currículo ou pedido integral.
  const filtro = '(title.ilike.*' + regra.termo + '*,cargo.ilike.*' + regra.termo +
    '*,categoria_slug.ilike.*' + regra.termo.replace(/\s/g, '-') + '*)';
  const linhas = await lerColecao('crm_radar_jobs_public', {
    select: 'title,cargo,company,empresa,descricao_resumo,url,categoria_slug,location,regiao,modelo,modalidade_normalizada,published_at,found_at,created_at,availability_status,availability_checked_at,job_origin',
    availability_status: 'eq.listed', or: filtro,
    order: 'published_at.desc.nullslast', limit: String(MAX_JOBS),
  }, fetcher);
  if (linhas === null) return {
    resposta: '**Não consegui consultar agora o Radar público de vagas.** Não vou inventar anúncios.\n\nA [busca pública no LinkedIn](' +
      urlLinkedin + ') está preparada como alternativa. Não consultei os resultados do LinkedIn nesta resposta.',
    sugestoes: ['Quero tentar buscar vagas novamente'], href: RADAR,
  };
  const vagas = filtrarVagas(linhas, area, contexto, outras);
  if (!vagas.length) return {
    resposta: '**Consultei o Radar de Vagas da Conexão CRM e não encontrei ' +
      (outras ? 'outras oportunidades diferentes das já indicadas' : 'anúncios recentes com foco em ' + regra.nome) +
      ' que atendam aos critérios de publicação e disponibilidade.**\n\n' +
      'Também há uma [busca preparada no LinkedIn](' + urlLinkedin +
      '), mas esses resultados ainda não foram verificados pela Íris.',
    sugestoes: ['Quero tentar outra área de vagas'], href: RADAR,
  };
  const lista = vagas.map((v, i) =>
    String(i + 1) + '. **[' + v.titulo + '](' + v.url + ')**' +
    (v.empresa ? ', ' + v.empresa : '') +
    (v.local || v.modelo ? '\n   ' + [v.local, v.modelo].filter(Boolean).join(' / ') : '') +
    '\n   Fonte: ' + v.origem + (v.tipo === 'bot'
      ? '. Anúncio checado recentemente.' : '. Publicada pela comunidade.')).join('\n\n');
  return {
    resposta: '**Vagas públicas encontradas para ' + regra.nome + ':**\n\n' + lista +
      '\n\nSão anúncios dos últimos 25 dias marcados como listados. Confirme no anúncio original antes de se candidatar. ' +
      '[Abrir Radar completo](' + RADAR + ').\n\n' +
      'Se quiser ampliar, há também a [busca do LinkedIn](' + urlLinkedin +
      '), que não foi consultada automaticamente.',
    sugestoes: ['Quero ver outras vagas dessa área', 'Quero analisar uma dessas oportunidades'],
    href: RADAR,
  };
}
