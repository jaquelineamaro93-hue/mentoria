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

export interface Announcement {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoAviso | null;
  data_evento: string | null;
  link_url: string | null;
  created_at: string;
}
