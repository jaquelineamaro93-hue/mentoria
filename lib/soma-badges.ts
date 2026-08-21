export interface SomaAchievement {
  id: string;
  nome: string;
  descricao: string;
  icon: string; // nome do ícone lucide-react
  pilar: 'sabedoria' | 'objetividade' | 'maestria' | 'alquimia';
  condicao: string;
}

export const SOMA_ACHIEVEMENTS: SomaAchievement[] = [
  // Pilar: Sabedoria Interna
  {
    id: 'autoconhecimento-inicio',
    nome: 'Jornada do Autoconhecimento',
    descricao: 'Completou o Mapa Quem Sou Eu',
    icon: 'Search',
    pilar: 'sabedoria',
    condicao: 'quem_sou_eu_completo',
  },
  {
    id: 'diagnostico-feito',
    nome: 'Diagnóstico Realizado',
    descricao: 'Completou o Diagnóstico e Perfil com VIA Character Strengths',
    icon: 'BarChart3',
    pilar: 'sabedoria',
    condicao: 'diagnostico_completo',
  },
  {
    id: 'essencia-mapeada',
    nome: 'Essência Mapeada',
    descricao: 'Preencheu o Mapa de Essência completo',
    icon: 'Sparkles',
    pilar: 'sabedoria',
    condicao: 'essencia_completa',
  },
  {
    id: 'bussola-encontrada',
    nome: 'Bússola Encontrada',
    descricao: 'Definiu sua Bússola de Posicionamento',
    icon: 'Compass',
    pilar: 'sabedoria',
    condicao: 'bussola_completa',
  },

  // Pilar: Objetividade Magnética
  {
    id: 'pdi-estruturado',
    nome: 'PDI Estruturado',
    descricao: 'Criou seu Plano de Desenvolvimento Individual completo',
    icon: 'ClipboardList',
    pilar: 'objetividade',
    condicao: 'pdi_completo',
  },
  {
    id: 'objetivos-claros',
    nome: 'Objetivos em Foco',
    descricao: 'Definiu metas claras e mensuráveis',
    icon: 'Target',
    pilar: 'objetividade',
    condicao: 'metas_definidas',
  },
  {
    id: 'primeira-indicacao',
    nome: 'Influenciador',
    descricao: 'Indicou 1 amigo para a Mentoria SOMA',
    icon: 'Users',
    pilar: 'objetividade',
    condicao: 'uma_indicacao',
  },
  {
    id: 'rede-forte',
    nome: 'Multiplicador',
    descricao: 'Indicou 2 amigos para a Mentoria SOMA',
    icon: 'Rocket',
    pilar: 'objetividade',
    condicao: 'duas_indicacoes',
  },

  // Pilar: Maestria em Ação
  {
    id: 'diario-iniciado',
    nome: 'Diário da Jornada',
    descricao: 'Iniciou seu Diário de Bordo',
    icon: 'NotebookPen',
    pilar: 'maestria',
    condicao: 'diario_comecado',
  },
  {
    id: 'reflexao-consistente',
    nome: 'Reflexão Constante',
    descricao: 'Mantém registro ativo no Diário há 1 mês',
    icon: 'RefreshCw',
    pilar: 'maestria',
    condicao: 'diario_ativo_30dias',
  },
  {
    id: 'encontro-presencial-1',
    nome: 'Presença Real',
    descricao: 'Participou de 1 encontro presencial',
    icon: 'Handshake',
    pilar: 'maestria',
    condicao: 'um_encontro_presencial',
  },
  {
    id: 'encontro-presencial-3',
    nome: 'Compromisso Confirmado',
    descricao: 'Participou de 3 encontros presenciais',
    icon: 'ShieldCheck',
    pilar: 'maestria',
    condicao: 'tres_encontros_presenciais',
  },

  // Pilar: Alquimia de Resultados
  {
    id: 'simulador-cv-usado',
    nome: 'Potencial Revelado',
    descricao: 'Usou o Simulador de CV para análise',
    icon: 'Briefcase',
    pilar: 'alquimia',
    condicao: 'simulador_cv_usado',
  },
  {
    id: 'feedback-trocado',
    nome: 'Feedback Genuíno',
    descricao: 'Trocou feedback com colegas da mentoria',
    icon: 'MessageCircle',
    pilar: 'alquimia',
    condicao: 'feedback_trocado',
  },
  {
    id: 'mes-completo',
    nome: 'Mês Reflexivo',
    descricao: 'Completou check-in de feedback mensal',
    icon: 'Star',
    pilar: 'alquimia',
    condicao: 'checkin_mensal_completo',
  },
  {
    id: 'transformacao-visivel',
    nome: 'Transformação em Curso',
    descricao: 'Progrediu significativamente na jornada SOMA',
    icon: 'Sprout',
    pilar: 'alquimia',
    condicao: 'transformacao_30porcento',
  },
];

export function getCoresDosPilares() {
  return {
    sabedoria: '#2E6F40',
    objetividade: '#8E0A1E',
    maestria: '#31606F',
    alquimia: '#8A6800',
  };
}

export function getFundosDosPilares() {
  return {
    sabedoria: '#EAF3EC',
    objetividade: '#FBEBED',
    maestria: '#EAF4F8',
    alquimia: '#FDF3D4',
  };
}

export function getBordasDosPilares() {
  return {
    sabedoria: '#CBDFD0',
    objetividade: '#EBC9CE',
    maestria: '#C3D9E2',
    alquimia: '#F2DFA0',
  };
}

export function getNomePilar(pilar: string): string {
  const nomes: Record<string, string> = {
    sabedoria: 'Sabedoria Interna',
    objetividade: 'Objetividade Magnética',
    maestria: 'Maestria em Ação',
    alquimia: 'Alquimia de Resultados',
  };
  return nomes[pilar] || pilar;
}