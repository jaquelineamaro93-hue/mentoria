-- QA performance hardening for high-frequency portal journeys.
-- Index-only migration: no rows are changed or removed.

create index if not exists idx_profiles_ranking_active
  on public.profiles (is_admin, status_assinatura, pontos_total desc);

create index if not exists idx_resumo_perfil_user_latest
  on public.resumo_perfil (user_id, gerado_em desc);

create index if not exists idx_mapa_essencia_user_latest
  on public.mapa_essencia (user_id, gerado_em desc);

create index if not exists idx_bussola_user_latest
  on public.bussola_posicionamento (user_id, gerado_em desc);

create index if not exists idx_via_user_latest
  on public.via_resultados (user_id, data_teste desc);

create index if not exists idx_journal_user_latest
  on public.journal_notes (user_id, encontro_data desc);

create index if not exists idx_diagnostics_user_latest
  on public.diagnostics (user_id, updated_at desc);

create index if not exists idx_reward_redemptions_reward_id
  on public.reward_redemptions (reward_id);
