export interface SomaAchievement {
  id: string;
  nome: string;
  descricao: string;
  emoji: string;
  pilar: 'sabedoria' | 'objetividade' | 'maestria' | 'alquimia';
  condicao: string;
}

export const SOMA_ACHIEVEMENTS: SomaAchievement[] = [
  // Pilar: Sabedoria Interna
  {
    id: 'autoconhecimento-inicio',
    nome: 'Jornada do Autoconhecimento',
    descricao: 'Completou o Mapa Quem Sou Eu',
    emoji: '🔍',
    pilar: 'sabedoria',
    condicao: 'quem_sou_eu_completo',
  },
  {
    id: 'diagnostico-feito',
    nome: 'Diagnóstico Realizado',
    descricao: 'Completou o Diagnóstico & Perfil com VIA Character Strengths',
    emoji: '📊',
    pilar: 'sabedoria',
    condicao: 'diagnostico_completo',
  },
  {
    id: 'essencia-mapeada',
    nome: 'Essência Mapeada',
    descricao: 'Preencheu o Mapa de Essência completo',
    emoji: '✨',
    pilar: 'sabedoria',
    condicao: 'essencia_completa',
  },
  {
    id: 'bussola-encontrada',
    nome: 'Bússola Encontrada',
    descricao: 'Definiu sua Bússola de Posicionamento',
    emoji: '🧭',
    pilar: 'sabedoria',
    condicao: 'bussola_completa',
  },

  // Pilar: Objetividade Magnética
  {
    id: 'pdi-estruturado',
    nome: 'PDI Estruturado',
    descricao: 'Criou seu Plano de Desenvolvimento Individual completo',
    emoji: '📋',
    pilar: 'objetividade',
    condicao: 'pdi_completo',
  },
  {
    id: 'objetivos-claros',
    nome: 'Objetivos em Foco',
    descricao: 'Definiu metas claras e mensuráveis',
    emoji: '🎯',
    pilar: 'objetividade',
    condicao: 'metas_definidas',
  },
  {
    id: 'primeira-indicacao',
    nome: 'Influenciador',
    descricao: 'Indicou 1 amigo para a Mentoria SOMA',
    emoji: '👥',
    pilar: 'objetividade',
    condicao: 'uma_indicacao',
  },
  {
    id: 'rede-forte',
    nome: 'Multiplicador',
    descricao: 'Indicou 2 amigos para a Mentoria SOMA',
    emoji: '🚀',
    pilar: 'objetividade',
    condicao: 'duas_indicacoes',
  },

  // Pilar: Maestria em Ação
  {
    id: 'diario-iniciado',
    nome: 'Diário da Jornada',
    descricao: 'Iniciou seu Diário de Bordo',
    emoji: '📔',
    pilar: 'maestria',
    condicao: 'diario_comecado',
  },
  {
    id: 'reflexao-consistente',
    nome: 'Reflexão Constante',
    descricao: 'Mantém registro ativo no Diário há 1 mês',
    emoji: '🪞',
    pilar: 'maestria',
    condicao: 'diario_ativo_30dias',
  },
  {
    id: 'encontro-presencial-1',
    nome: 'Presença Real',
    descricao: 'Participou de 1 encontro presencial',
    emoji: '🤝',
    pilar: 'maestria',
    condicao: 'um_encontro_presencial',
  },
  {
    id: 'encontro-presencial-3',
    nome: 'Compromisso Confirmado',
    descricao: 'Participou de 3 encontros presenciais',
    emoji: '💪',
    pilar: 'maestria',
    condicao: 'tres_encontros_presenciais',
  },

  // Pilar: Alquimia de Resultados
  {
    id: 'simulador-cv-usado',
    nome: 'Potencial Revelado',
    descricao: 'Usou o Simulador de CV para análise',
    emoji: '💼',
    pilar: 'alquimia',
    condicao: 'simulador_cv_usado',
  },
  {
    id: 'feedback-trocado',
    nome: 'Feedback Genuíno',
    descricao: 'Trocou feedback com colegas da mentoria',
    emoji: '💬',
    pilar: 'alquimia',
    condicao: 'feedback_trocado',
  },
  {
    id: 'mes-completo',
    nome: 'Mês Reflexivo',
    descricao: 'Completou check-in de feedback mensal',
    emoji: '⭐',
    pilar: 'alquimia',
    condicao: 'checkin_mensal_completo',
  },
  {
    id: 'transformacao-visivel',
    nome: 'Transformação em Curso',
    descricao: 'Progrediu significativamente na jornada SOMA',
    emoji: '🌱',
    pilar: 'alquimia',
    condicao: 'transformacao_30porcento',
  },
];

export function getCoresDosPilares() {
  return {
    sabedoria: '#9e8b7e', // castanho claro
    objetividade: '#8c7a6b', // castanho institucional
    maestria: '#6b5d4f', // castanho médio
    alquimia: '#3c2c1f', // castanho escuro
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
