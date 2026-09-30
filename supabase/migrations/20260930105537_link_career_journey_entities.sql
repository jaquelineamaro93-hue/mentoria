-- Explicitly connect the career journey: CV analysis -> application -> SOAR interview preparation.

alter table public.vagas_candidatura
  add column if not exists cv_simulacao_id uuid null references public.cv_simulacoes(id) on delete set null;

alter table public.soar_analises
  add column if not exists candidatura_id uuid null references public.vagas_candidatura(id) on delete set null;

create index if not exists vagas_candidatura_cv_simulacao_id_idx
  on public.vagas_candidatura(cv_simulacao_id);

create index if not exists soar_analises_candidatura_id_idx
  on public.soar_analises(candidatura_id);
