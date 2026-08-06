-- Migração: Plano de Desenvolvimento gerado a partir do Meu PDI (20 seções)
-- Objetivo: resolver o problema de "preencho o PDI e não aparece nada depois".
-- Cria o registro do plano gerado por IA, a lista de ações (com status feito/não feito)
-- e a reflexão mensal do mentorado.

create extension if not exists "pgcrypto";

-- 1. Plano gerado --------------------------------------------------------
create table if not exists pdi_planos (
  id uuid primary key default gen_random_uuid(),
  mentorado_id uuid not null references profiles(id) on delete cascade,
  ciclo text not null default to_char(now(), 'YYYY') || '-' || to_char(now() + interval '1 year', 'YYYY'),
  diagnostico jsonb not null default '{}'::jsonb,   -- { sintese, conflito_central, alertas_sobrecarga: [] }
  equacao text,                                      -- ex: "Técnica + Liderança / Equilíbrio Sistêmico"
  pilares jsonb not null default '[]'::jsonb,         -- array de pilares (ver formato no route.ts)
  roadmap jsonb not null default '[]'::jsonb,         -- array { periodo, foco, marcos }
  alertas jsonb not null default '[]'::jsonb,         -- array { tipo, cor, descricao }
  status text not null default 'ativo' check (status in ('ativo', 'arquivado')),
  versao int not null default 1,
  gerado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_pdi_planos_mentorado on pdi_planos(mentorado_id, status);

-- 2. Ações do plano (o que faltava para o mentorado acompanhar) ----------
create table if not exists pdi_acoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references pdi_planos(id) on delete cascade,
  mentorado_id uuid not null references profiles(id) on delete cascade,
  pilar_titulo text not null,
  titulo text not null,
  descricao text,
  prazo date,
  concluida boolean not null default false,
  concluida_em timestamptz,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_pdi_acoes_plano on pdi_acoes(plano_id, ordem);
create index if not exists idx_pdi_acoes_mentorado on pdi_acoes(mentorado_id, concluida);

-- 3. Reflexão mensal (check-in de acompanhamento, 1x por mês) ------------
create table if not exists pdi_reflexoes_mensais (
  id uuid primary key default gen_random_uuid(),
  mentorado_id uuid not null references profiles(id) on delete cascade,
  plano_id uuid not null references pdi_planos(id) on delete cascade,
  mes_referencia date not null,          -- sempre dia 1 do mês, ex: 2026-08-01
  energia text check (energia in ('alta', 'media', 'baixa')),
  o_que_avancou text,
  o_que_travou text,
  ajuste_para_o_proximo_mes text,
  criado_em timestamptz not null default now(),
  unique (mentorado_id, plano_id, mes_referencia)
);

create index if not exists idx_pdi_reflexoes_mentorado on pdi_reflexoes_mensais(mentorado_id, mes_referencia desc);

-- 4. RLS -------------------------------------------------------------------
alter table pdi_planos enable row level security;
alter table pdi_acoes enable row level security;
alter table pdi_reflexoes_mensais enable row level security;

-- mentorado vê e edita só o que é dele; admin vê tudo
create policy "mentorado le proprio plano" on pdi_planos
  for select using (mentorado_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "sistema cria plano" on pdi_planos
  for insert with check (mentorado_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "mentorado le proprias acoes" on pdi_acoes
  for select using (mentorado_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "mentorado marca acao feita" on pdi_acoes
  for update using (mentorado_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "sistema cria acoes" on pdi_acoes
  for insert with check (mentorado_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "mentorado le propria reflexao" on pdi_reflexoes_mensais
  for select using (mentorado_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "mentorado cria propria reflexao" on pdi_reflexoes_mensais
  for insert with check (mentorado_id = auth.uid());

create policy "mentorado edita propria reflexao do mes" on pdi_reflexoes_mensais
  for update using (mentorado_id = auth.uid());
