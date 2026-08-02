export type TipoPacote = 'online' | 'presencial';
export type TipoEncontro = 'grupo' | 'individual';
export type TipoAviso = 'grupo' | 'individual' | 'geral';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  tipo_pacote: TipoPacote;
  foto_url: string | null;
  onboarding_concluido: boolean;
  pontos_total: number;
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

export interface Announcement {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoAviso | null;
  data_evento: string | null;
  link_url: string | null;
  created_at: string;
}
