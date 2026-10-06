begin;
create table public.mp_pedidos (
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), email text not null,
 tipo text not null check(tipo in ('plano','credito_simulacao_cv','sessao_extra')), plano_id uuid references public.planos_mentoria(id),
 forma_pagamento text not null, valor numeric(12,2) not null check(valor>0), mp_resource_id text,
 status text not null default 'pendente', concedido boolean not null default false, created_at timestamptz not null default now()
);
create table public.mp_eventos(resource_id text primary key, pedido_id uuid not null references public.mp_pedidos(id), status text not null, updated_at timestamptz not null default now());
create table public.mp_sessoes_extras(pedido_id uuid primary key references public.mp_pedidos(id), user_id uuid not null references public.profiles(id), status text not null default 'disponivel');
alter table public.mp_pedidos enable row level security;
alter table public.mp_eventos enable row level security;
alter table public.mp_sessoes_extras enable row level security;
create policy mp_pedidos_read on public.mp_pedidos for select to authenticated using(user_id=auth.uid());
create policy mp_sessoes_read on public.mp_sessoes_extras for select to authenticated using(user_id=auth.uid());
revoke all on public.mp_pedidos,public.mp_eventos,public.mp_sessoes_extras from anon,authenticated;
grant select on public.mp_pedidos,public.mp_sessoes_extras to authenticated;
grant all on public.mp_pedidos,public.mp_eventos,public.mp_sessoes_extras to service_role;
create or replace function public.processar_mp_pagamento(p_pedido uuid,p_payment_id text,p_status text,p_valor numeric,p_currency text)
returns text language plpgsql security definer set search_path=public as $$
declare pedido public.mp_pedidos%rowtype; previous public.mp_eventos%rowtype;
begin
 select * into pedido from public.mp_pedidos where id=p_pedido for update;
 if not found then return 'pedido_desconhecido'; end if;
 if p_currency is distinct from 'BRL' or p_valor is distinct from pedido.valor then raise exception 'Valor ou moeda divergente'; end if;
 select * into previous from public.mp_eventos where resource_id=p_payment_id;
 if found and previous.pedido_id<>p_pedido then raise exception 'Pagamento vinculado a outro pedido'; end if;
 if found and previous.status=p_status then return 'duplicado'; end if;
 if found and previous.status in ('refunded','charged_back') then return 'evento_antigo'; end if;
 insert into public.mp_eventos(resource_id,pedido_id,status) values(p_payment_id,p_pedido,p_status)
 on conflict(resource_id) do update set status=excluded.status,updated_at=now();
 update public.mp_pedidos set status=p_status where id=p_pedido;
 -- Preserve guest purchases without granting access to an unverified identity.
 if pedido.user_id is null then return 'aguarda_vinculo'; end if;
 if not exists(select 1 from public.pagamentos_historico where mp_payment_id=p_payment_id and user_id=pedido.user_id) then
  insert into public.pagamentos_historico(user_id,valor,status,mp_payment_id) values(pedido.user_id,p_valor,p_status,p_payment_id);
 else
  update public.pagamentos_historico set status=p_status,valor=p_valor where mp_payment_id=p_payment_id and user_id=pedido.user_id;
 end if;
 if p_status='approved' and not pedido.concedido then
  if pedido.tipo='credito_simulacao_cv' then
   update public.profiles set creditos_simulacao_cv=coalesce(creditos_simulacao_cv,0)+1 where id=pedido.user_id;
  elsif pedido.tipo='sessao_extra' then
   insert into public.mp_sessoes_extras(pedido_id,user_id) values(p_pedido,pedido.user_id);
  else
   update public.profiles set plano_id=pedido.plano_id,forma_pagamento_escolhida=pedido.forma_pagamento,status_assinatura='ativo',origem_assinatura='mercadopago',
    trial_status=case when trial_started_at is not null then 'converted' else trial_status end,
    trial_converted_at=case when trial_started_at is not null then coalesce(trial_converted_at,now()) else trial_converted_at end
    where id=pedido.user_id;
  end if;
  update public.mp_pedidos set concedido=true where id=p_pedido;
 elsif p_status in ('refunded','charged_back') and pedido.concedido
  and not exists(select 1 from public.mp_eventos where pedido_id=p_pedido and resource_id<>p_payment_id and status='approved') then
  if pedido.tipo='credito_simulacao_cv' then
   update public.profiles set creditos_simulacao_cv=greatest(coalesce(creditos_simulacao_cv,0)-1,0) where id=pedido.user_id;
  elsif pedido.tipo='sessao_extra' then
   update public.mp_sessoes_extras set status='cancelado' where pedido_id=p_pedido;
  elsif not exists(select 1 from public.mp_pedidos where user_id=pedido.user_id and tipo='plano' and concedido and id<>p_pedido) then
   update public.profiles set status_assinatura='encerrado' where id=pedido.user_id and origem_assinatura='mercadopago';
  end if;
  update public.mp_pedidos set concedido=false where id=p_pedido;
 end if;
 return 'processado';
end; $$;
revoke all on function public.processar_mp_pagamento(uuid,text,text,numeric,text) from public,anon,authenticated;
grant execute on function public.processar_mp_pagamento(uuid,text,text,numeric,text) to service_role;
-- Prevent direct authenticated profile writes from minting paid benefits.
create or replace function public.proteger_creditos_mp() returns trigger
language plpgsql set search_path=public as $$
begin
 if auth.uid() is not null and not public.is_admin()
  and coalesce(new.creditos_simulacao_cv,0) > coalesce(old.creditos_simulacao_cv,0) then
  new.creditos_simulacao_cv := old.creditos_simulacao_cv;
 end if;
 return new;
end; $$;
create trigger trg_proteger_creditos_mp before update on public.profiles
for each row execute function public.proteger_creditos_mp();
commit;
