alter table public.via_resultados
  add column if not exists analise_status text not null default 'concluida',
  add column if not exists analise_erro text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.via_evolucao_analises
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists geracao_fonte text not null default 'ia';

create index if not exists idx_via_resultados_user_data
  on public.via_resultados (user_id, data_teste desc, created_at desc);

create index if not exists idx_via_evolucao_user_pair_unique
  on public.via_evolucao_analises (user_id, resultado_anterior_id, resultado_atual_id);
