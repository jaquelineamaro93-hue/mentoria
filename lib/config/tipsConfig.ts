export interface QuickTipData {
  title: string;
  description?: string;
}

export const tipsConfig: Record<string, QuickTipData> = {
  // Páginas principais
  '/dashboard': {
    title: 'Bem-vindo ao Portal',
  },
  '/exercicios': {
    title: 'Diagnóstico Estratégico',
  },
  '/percepcao-360': {
    title: 'Percepção 360',
    description: 'Registre como pessoas de contextos diferentes percebem suas forças e pontos de desenvolvimento.',
  },
  '/primeiros-90-dias': {
    title: 'Planejamento de Transição',
  },
  '/diario': {
    title: 'Reflita sua Jornada',
  },
  '/carreira': {
    title: 'Sua Jornada de Carreira',
    description: 'CV, vagas e preparação para entrevistas conectados em um único fluxo.',
  },
  '/vagas': {
    title: 'Gerencie suas Candidaturas',
  },
  '/perfil': {
    title: 'Sua Identidade Profissional',
  },
  '/meu-pdi': {
    title: 'Plano de Desenvolvimento Individual',
  },
  '/network': {
    title: 'Círculos de Influência',
  },
  '/entrevista': {
    title: 'SOAR Builder',
  },
  '/meu-plano': {
    title: 'Meu Plano de Mentoria',
  },
  '/passaporte': {
    title: 'Meu Passaporte Profissional',
  },
  '/simulador-cv': {
    title: 'Simulador de CV',
  },
  '/gravacoes': {
    title: 'Sessões Gravadas',
  },
  '/feedback-pares': {
    title: 'Feedback entre Colegas',
  },
  '/onboarding': {
    title: 'Bem-vindo à Mentoria SOMA',
  },
  '/quem-sou-eu': {
    title: 'Mapa Quem Sou Eu',
  },
  '/indique-um-amigo': {
    title: 'Indique um Amigo',
  },
  '/votar-encontro': {
    title: 'Escolha o Tema do Encontro',
  },
  '/minha-trilha': {
    title: 'Avalie sua experiência com a SOMA',
  },
  '/feedbacks': {
    title: 'Seu histórico de feedbacks',
  },
  '/linkedin': {
    title: 'Posicione seu LinkedIn para o mercado',
  },
  '/conteudo-linkedin': {
    title: 'Transforme sua experiência em conteúdo',
    description: 'Ideias, voz, posicionamento e rascunhos conectados ao que você já construiu na SOMA.',
  },
  '/gupy': {
    title: 'Audite seu currículo para ATS',
  },
  '/leitura-cenario': {
    title: 'Leia o cenário antes de agir',
  },
  '/termos': {
    title: 'Termos da Mentoria',
  },
  '/faq': {
    title: 'Perguntas Frequentes',
  },

  // Páginas de admin
  '/admin': {
    title: 'Painel de Administração',
  },
  '/admin/crescimento': {
    title: 'Métricas de Crescimento',
  },
  '/admin/financeiro': {
    title: 'Gestão Financeira',
  },
  '/admin/enquetes': {
    title: 'Gerenciador de Enquetes',
  },

  // Páginas de checkout e pagamento
  '/checkout': {
    title: 'Finalizar Compra',
  },
  '/payment-success': {
    title: 'Pagamento Confirmado',
  },
  '/payment-pending': {
    title: 'Pagamento Pendente',
  },
  '/payment-failure': {
    title: 'Pagamento Recusado',
  },
};

export function getQuickTipForPath(pathname: string): QuickTipData | null {
  return tipsConfig[pathname] || null;
}
