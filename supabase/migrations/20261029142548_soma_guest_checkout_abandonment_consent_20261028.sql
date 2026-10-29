-- Migration applied to Supabase on 2026-10-29 (version 20261029142548).
-- A guest checkout recovery lead is created only after explicit opt-in and
-- a successful server-side Cloudflare Turnstile verification.
create table if not exists public.soma_guest_checkout_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) between 6 and 254),
  email_hash text not null check (length(email_hash) = 64),
  product text not null check (product in ('plataforma','carreira')),
  plan_code text not null check (length(plan_code) between 1 and 100),
  module_slug text,
  iris boolean not null default false,
  whatsapp boolean not null default false,
  return_path text not null check (length(return_path) between 1 and 600),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  offer_expires_at timestamptz not null default (now() + interval '24 hours'),
  sent_at timestamptz,
  unsubscribed_at timestamptz,
  status text not null default 'reserved'
    check (status in ('reserved','sent','send_failed','unsubscribed')),
  unique(email_hash, product)
);
create index if not exists soma_guest_checkout_leads_created_idx
  on public.soma_guest_checkout_leads(created_at desc);
alter table public.soma_guest_checkout_leads enable row level security;
revoke all on public.soma_guest_checkout_leads from public, anon, authenticated;
grant select, insert, update on public.soma_guest_checkout_leads to service_role;
