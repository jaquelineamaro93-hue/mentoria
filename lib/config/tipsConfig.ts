export interface QuickTipData {
  title: string;
  description: string;
}

export const tipsConfig: Record<string, QuickTipData> = {
  // Páginas principais
  '/dashboard': {
    title: 'Bem-vindo ao Portal',
    description: 'Comece preenchendo seu perfil para personalizar sua experiência de mentoria.',
  },
  '/exercicios': {
    title: 'Diagnóstico Estratégico',
    description: 'Preencha cada seção com cuidado. Seus dados ajudam a personalizar sua mentoria.',
  },
  '/primeiros-90-dias': {
    title: 'Planejamento de Transição',
    description: 'Acompanhe a progressão de cada mês e defina suas metas estratégicas de transição.',
  },
  '/diario': {
    title: 'Reflita sua Jornada',
    description: 'Registre seus aprendizados e reflexões para evoluir continuamente.',
  },
  '/vagas': {
    title: 'Gerencie suas Candidaturas',
    description: 'Acompanhe o progresso de cada oportunidade e mantenha uma estratégia clara.',
  },
  '/perfil': {
    title: 'Sua Identidade Profissional',
    description: 'Mantenha seus dados atualizados para que seus mentores entendam seu contexto.',
  },
  '/meu-pdi': {
    title: 'Plano de Desenvolvimento Individual',
    description: 'Estruture seus pilares, metas e roadmap para os próximos meses.',
  },
  '/network': {
    title: 'Círculos de Influência',
    description: 'Cultive relações estratégicas que aceleram sua carreira.',
  },
  '/entrevista': {
    title: 'SOAR Builder',
    description: 'Prepare narrativas de impacto para brilhar em entrevistas.',
  },
  '/meu-plano': {
    title: 'Meu Plano de Mentoria',
    description: 'Visualize seu pacote de mentoria e próximos passos.',
  },
  '/passaporte': {
    title: 'Meu Passaporte Profissional',
    description: 'Documenti suas certificações e conquistas para portfólio.',
  },
  '/simulador-cv': {
    title: 'Simulador de CV',
    description: 'Veja como seu CV se compara com o mercado atual.',
  },
  '/gravacoes': {
    title: 'Sessões Gravadas',
    description: 'Revise mentorias anteriores e internalize os aprendizados.',
  },
  '/feedback-pares': {
    title: 'Feedback entre Colegas',
    description: 'Troque perspectivas com seus pares e cresça mutuamente.',
  },
  '/onboarding': {
    title: 'Bem-vindo à Mentoria SOMA',
    description: 'Siga os passos para configurar sua jornada de desenvolvimento.',
  },
  '/quem-sou-eu': {
    title: 'Mapa Quem Sou Eu',
    description: 'Descubra seus pontos fortes, valores e direção de carreira.',
  },
  '/indique-um-amigo': {
    title: 'Indique um Amigo',
    description: 'Ganhe benefícios ao indicar mentorando(a)s para a comunidade SOMA.',
  },
  '/votar-encontro': {
    title: 'Escolha o Tema do Encontro',
    description: 'Vote no tema que mais te interessa para nossos encontros mensais.',
  },
  '/minha-trilha': {
    title: 'Sua Trilha de Aprendizado',
    description: 'Acompanhe os conteúdos e módulos recomendados para sua jornada.',
  },
  '/termos': {
    title: 'Termos da Mentoria',
    description: 'Conheça os direitos, responsabilidades e políticas da SOMA Mentoria.',
  },
  '/faq': {
    title: 'Perguntas Frequentes',
    description: 'Encontre respostas rápidas para suas dúvidas sobre o programa.',
  },

  // Páginas de admin
  '/admin': {
    title: 'Painel de Administração',
    description: 'Gerencie mentorado(a)s, planos e indicadores do programa.',
  },
  '/admin/crescimento': {
    title: 'Métricas de Crescimento',
    description: 'Acompanhe KPIs de desenvolvimento dos mentorado(a)s.',
  },
  '/admin/financeiro': {
    title: 'Gestão Financeira',
    description: 'Monitore receitas, despesas e indicadores financeiros.',
  },
  '/admin/enquetes': {
    title: 'Gerenciador de Enquetes',
    description: 'Crie e acompanhe pesquisas de satisfação e feedback.',
  },

  // Páginas de checkout e pagamento
  '/checkout': {
    title: 'Finalizar Compra',
    description: 'Complete sua compra com segurança via Mercado Pago.',
  },
  '/payment-success': {
    title: 'Pagamento Confirmado',
    description: 'Seu pagamento foi processado com sucesso!',
  },
  '/payment-pending': {
    title: 'Pagamento Pendente',
    description: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
  },
  '/payment-failure': {
    title: 'Pagamento Recusado',
    description: 'Houve um erro ao processar seu pagamento. Por favor, tente novamente.',
  },
};

export function getQuickTipForPath(pathname: string): QuickTipData | null {
  return tipsConfig[pathname] || null;
}
