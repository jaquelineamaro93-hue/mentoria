export type ProductFeature = {
  key: string;
  label: string;
  group: string;
};

const ROUTES: Array<{ match: (pathname: string, search: URLSearchParams) => boolean; feature: ProductFeature }> = [
  { match: (p) => p === '/dashboard', feature: { key: 'dashboard', label: 'Visão geral', group: 'Portal' } },
  { match: (p) => p.startsWith('/onboarding'), feature: { key: 'onboarding', label: 'Primeiros passos', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/quem-sou-eu'), feature: { key: 'quem_sou_eu', label: 'Mapa Quem Sou Eu', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/exercicios'), feature: { key: 'diagnostico_perfil', label: 'Diagnóstico & Perfil', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/percepcao-360'), feature: { key: 'percepcao_360', label: 'Percepção 360', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/diario'), feature: { key: 'diario', label: 'Diário de Bordo', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/feedbacks'), feature: { key: 'feedbacks_mentoria', label: 'Feedbacks recebidos', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/gravacoes'), feature: { key: 'gravacoes', label: 'Gravações', group: 'Minha jornada' } },
  { match: (p) => p.startsWith('/primeiros-90-dias'), feature: { key: 'primeiros_90_dias', label: 'Primeiros 90 dias', group: 'Crescimento na empresa' } },
  { match: (p) => p.startsWith('/leitura-cenario'), feature: { key: 'leitura_cenario', label: 'Leitura de cenário', group: 'Crescimento na empresa' } },
  { match: (p) => p.startsWith('/meu-pdi') || p.startsWith('/pdi'), feature: { key: 'pdi', label: 'Plano de desenvolvimento', group: 'Crescimento na empresa' } },
  {
    match: (p, s) => (p === '/carreira' && (s.get('etapa') ?? 'cv') === 'cv') || p.startsWith('/simulador-cv'),
    feature: { key: 'curriculo', label: 'Analisar currículo', group: 'Mercado de trabalho' },
  },
  { match: (p) => p.startsWith('/gupy'), feature: { key: 'gupy', label: 'Gupy & ATS', group: 'Mercado de trabalho' } },
  { match: (p) => p.startsWith('/linkedin') && !p.startsWith('/conteudo-linkedin'), feature: { key: 'linkedin', label: 'LinkedIn estratégico', group: 'Mercado de trabalho' } },
  { match: (p) => p.startsWith('/conteudo-linkedin'), feature: { key: 'conteudo_linkedin', label: 'Conteúdo & marca pessoal', group: 'Mercado de trabalho' } },
  {
    match: (p, s) => (p === '/carreira' && s.get('etapa') === 'vagas') || p.startsWith('/vagas'),
    feature: { key: 'vagas', label: 'Vagas & candidaturas', group: 'Mercado de trabalho' },
  },
  { match: (p) => p.startsWith('/network'), feature: { key: 'network', label: 'Rede & oportunidades', group: 'Mercado de trabalho' } },
  {
    match: (p, s) => (p === '/carreira' && s.get('etapa') === 'entrevista') || p.startsWith('/entrevista'),
    feature: { key: 'entrevista', label: 'Entrevistas & simulações', group: 'Mercado de trabalho' },
  },
  { match: (p) => p.startsWith('/minha-trilha'), feature: { key: 'avaliacao_mentoria', label: 'Avaliar a mentoria', group: 'Sua experiência' } },
  { match: (p) => p.startsWith('/feedback-pares'), feature: { key: 'feedback_pares', label: 'Feedback entre Colegas', group: 'Comunidade' } },
  { match: (p) => p.startsWith('/votar-encontro'), feature: { key: 'votar_encontro', label: 'Votar Encontro', group: 'Comunidade' } },
  { match: (p) => p.startsWith('/indique-um-amigo'), feature: { key: 'indicacao', label: 'Indique um Amigo', group: 'Comunidade' } },
  { match: (p) => p.startsWith('/passaporte'), feature: { key: 'passaporte', label: 'Meu Passaporte', group: 'Meu espaço' } },
  { match: (p) => p.startsWith('/meu-plano'), feature: { key: 'meu_plano', label: 'Meu Plano', group: 'Meu espaço' } },
];

export function resolveProductFeature(pathname: string, currentSearch = ''): ProductFeature | null {
  const search = new URLSearchParams(currentSearch);
  return ROUTES.find((item) => item.match(pathname, search))?.feature ?? null;
}

export function getProductSessionId() {
  if (typeof window === 'undefined') return null;
  const key = 'soma_product_session_id';
  let value = window.sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.sessionStorage.setItem(key, value);
  }
  return value;
}
