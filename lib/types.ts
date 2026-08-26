export type TipoPacote = 'online' | 'presencial';
export type TipoEncontro = 'grupo' | 'individual' | 'pessoal';
export type TipoAviso = 'grupo' | 'individual' | 'geral';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  tipo_pacote: TipoPacote;
  foto_url: string | null;
  genero?: 'masculino' | 'feminino' | null;
  onboarding_concluido: boolean;
  tour_concluido: boolean;
  pontos_total: number;
  is_admin: boolean;
  last_login_at: string | null;
  status_assinatura: 'ativo' | 'inadimplente' | 'encerrado';
  origem_assinatura: 'manual' | 'mercadopago';
  proxima_cobranca: string | null;
  observacao_pagamento: string | null;
  creditos_simulacao_cv: number;
  codigo_indicacao: string | null;
  indicado_por_id: string | null;
  sessoes_bonus_resgatadas: number;
  plano_id: string | null;
  forma_pagamento_escolhida: 'avista' | 'cartao' | 'recorrente' | null;
  data_fim_acesso: string | null;
  created_at: string;
  updated_at: string;
}

export interface Diagnostic {
  id: string;
  user_id: string;
  quem_sou_data: Record<string, unknown>;
  personality_results: Record<string, unknown>;
  habilidades: Record<string, unknown>;
  momento_carreira: string | null;
  objetivos: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalNote {
  id: string;
  user_id: string;
  encontro_data: string;
  tipo_encontro: TipoEncontro | null;
  anotacoes: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuemSouEuResposta {
  id: string;
  user_id: string;
  bloco: string;
  resposta: string;
  created_at: string;
  updated_at: string;
}

export interface MapaEssencia {
  id: string;
  user_id: string;
  conteudo_markdown: string;
  gerado_em: string;
}

export interface BussolaPosicionamento {
  id: string;
  user_id: string;
  norte: string | null;
  sul: string | null;
  leste: string | null;
  oeste: string | null;
  centro: string | null;
  gerado_em: string;
}

export interface ViaResultado {
  id: string;
  user_id: string;
  forcas: string[];
  data_teste: string;
  analise_ia: string | null;
  arquivo_original_url: string | null;
  created_at: string;
}

export interface PdiGuiaSecao {
  id: string;
  codigo: string;
  ordem: number;
  titulo: string;
  instrucoes: string | null;
}

export interface PdiResposta {
  id: string;
  user_id: string;
  secao: string;
  dados: { texto?: string };
  concluido: boolean;
  updated_at: string;
}

export interface Recording {
  id: string;
  titulo: string;
  tipo: 'individual' | 'grupo' | null;
  data_encontro: string | null;
  drive_url: string;
  descricao: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  pontos: number;
  icone: string | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Reward {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  custo_pontos: number;
  ativo: boolean;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pendente' | 'aprovado' | 'entregue' | 'negado';
  created_at: string;
}

export interface ResumoPerfil {
  id: string;
  user_id: string;
  conteudo_markdown: string;
  gerado_em: string;
}

export interface TermoVersao {
  id: string;
  versao: string;
  titulo: string;
  conteudo_markdown: string;
  publicado_em: string;
}

export interface TermoAceite {
  id: string;
  user_id: string;
  termo_id: string;
  aceito_em: string;
}

export interface Pagamento {
  id: string;
  user_id: string;
  plano_id: string | null;
  valor_centavos: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'estornado';
  provedor: string;
  provedor_pagamento_id: string | null;
  origem: 'automatico' | 'manual';
  created_at: string;
}

export interface MentoradoPublico {
  id: string;
  nome: string;
}

export interface PeerFeedback {
  id: string;
  de_user_id: string;
  para_user_id: string;
  mensagem: string;
  created_at: string;
}

export interface CvSimulacaoResultado {
  fit_percentual: number;
  fit_label: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  faixa_salarial_estimada: string;
  sabotadores: { titulo: string; motivo: string; correcao: string }[];
  palavras_chave_ausentes: string[];
  curriculo_final_markdown: string;
  carta_apresentacao_markdown: string;
  perguntas_entrevista: string[];
}

export interface CvSimulacao {
  id: string;
  user_id: string;
  curriculo_texto: string;
  vaga_texto: string;
  resultado_markdown: string;
  resultado_json: CvSimulacaoResultado | null;
  created_at: string;
}

export interface PlanoMentoria {
  id: string;
  codigo: string;
  nome: string;
  duracao_meses: number;
  foco: string | null;
  preco_avista: number;
  preco_cartao: number;
  preco_recorrente_total: number;
  parcelas_recorrente: number;
  descricao_encontros: string | null;
  itens_inclusos: string[];
  ativo: boolean;
  visivel_checkout: boolean;
  ordem: number;
}

export interface Announcement {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoAviso | null;
  data_evento: string | null;
  link_url: string | null;
  created_at: string;
}

export interface Indicacao {
  id: string;
  indicador_id: string;
  indicado_id: string | null;
  indicado_nome: string;
  indicado_email: string;
  status: 'pendente' | 'convertido';
  created_at: string;
  convertido_em: string | null;
}

export interface CheckinMensal {
  id: string;
  user_id: string;
  mes_referencia: string;
  nota: number;
  feedback_texto: string | null;
  sugestao_melhoria: string | null;
  created_at: string;
}
