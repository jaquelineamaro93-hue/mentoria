alter table public.entrevista_simulacoes
  add column if not exists curriculo text null,
  add column if not exists descricao_vaga text null,
  add column if not exists resumo_final jsonb null;
