create table public.soma_learning_suggestions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 4 and 120),
 description text not null check(char_length(description) between 10 and 3000),
 category text not null check(category in ('experiencia','conteudo','acessibilidade','problema')),
 status text not null default 'recebida' check(status in ('recebida','em_analise','planejada','concluida','nao_prevista')),
 response text not null default '' check(char_length(response)<=1500),
 created_at timestamptz not null default now()
);
alter table public.soma_learning_suggestions enable row level security;
revoke all on public.soma_learning_suggestions from public,anon,authenticated;
grant select on public.soma_learning_suggestions to authenticated;
grant all on public.soma_learning_suggestions to service_role;
create policy suggestions_read on public.soma_learning_suggestions for select to authenticated
 using ((select auth.uid())=user_id or (select public.is_admin()));
create index learning_suggestions_user_created on public.soma_learning_suggestions(user_id,created_at desc);
