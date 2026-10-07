-- Link público da Percepção 360.
-- Cada rodada recebe um token próprio, vinculado ao user_id do mentorado.
-- Terceiros podem responder sem login, mas nunca recebem acesso direto às tabelas.

create table if not exists public.feedback_360_share_links (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null unique,
  user_id uuid not null,
  token uuid not null default gen_random_uuid() unique,
  active boolean not null default true,
  responses_count integer not null default 0 check (responses_count >= 0),
  last_response_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (round_id, user_id)
    references public.feedback_360_rounds(id, user_id)
    on delete cascade
);

create index if not exists idx_feedback_360_share_links_user
  on public.feedback_360_share_links(user_id, created_at desc);

alter table public.feedback_360_share_links enable row level security;

drop policy if exists "feedback360_share_links_select_own" on public.feedback_360_share_links;
create policy "feedback360_share_links_select_own"
  on public.feedback_360_share_links for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "feedback360_share_links_update_own" on public.feedback_360_share_links;
create policy "feedback360_share_links_update_own"
  on public.feedback_360_share_links for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, update on public.feedback_360_share_links to authenticated;

drop trigger if exists trg_feedback_360_share_links_updated_at on public.feedback_360_share_links;
create trigger trg_feedback_360_share_links_updated_at
before update on public.feedback_360_share_links
for each row execute function public.feedback_360_set_updated_at();

create or replace function public.feedback_360_create_share_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.feedback_360_share_links(round_id, user_id)
  values (new.id, new.user_id)
  on conflict (round_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_feedback_360_round_create_share_link on public.feedback_360_rounds;
create trigger trg_feedback_360_round_create_share_link
after insert on public.feedback_360_rounds
for each row execute function public.feedback_360_create_share_link();

insert into public.feedback_360_share_links(round_id, user_id)
select r.id, r.user_id
from public.feedback_360_rounds r
on conflict (round_id) do nothing;

create or replace function public.get_feedback_360_public(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'mentor_name', p.nome,
    'title', r.titulo,
    'objective', r.objetivo,
    'questions',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', q.id,
              'order', q.ordem,
              'text', q.pergunta
            )
            order by q.ordem
          )
          from public.feedback_360_questions q
          where q.round_id = r.id
            and q.user_id = r.user_id
        ),
        '[]'::jsonb
      )
  )
  from public.feedback_360_share_links l
  join public.feedback_360_rounds r
    on r.id = l.round_id and r.user_id = l.user_id
  join public.profiles p
    on p.id = l.user_id
  where l.token = p_token
    and l.active = true
  limit 1;
$$;

revoke all on function public.get_feedback_360_public(uuid) from public;
grant execute on function public.get_feedback_360_public(uuid) to anon, authenticated;

create or replace function public.submit_feedback_360_public(
  p_token uuid,
  p_nome text,
  p_cargo_funcao text,
  p_empresa_contexto text,
  p_relacao text,
  p_relacao_outro text,
  p_convivencia text,
  p_respostas jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id uuid;
  v_user_id uuid;
  v_respondent_id uuid;
  v_item jsonb;
  v_question_id uuid;
  v_resposta text;
  v_answer_count integer := 0;
begin
  select l.round_id, l.user_id
    into v_round_id, v_user_id
  from public.feedback_360_share_links l
  where l.token = p_token
    and l.active = true
  limit 1;

  if v_round_id is null or v_user_id is null then
    raise exception 'Link inválido ou desativado';
  end if;

  if p_relacao not in (
    'gestor_direto','lideranca_indireta','responde_a_mim','par','stakeholder',
    'cliente','fornecedor','colega_faculdade','professor','amigo_pessoal','outro'
  ) then
    raise exception 'Relação inválida';
  end if;

  if p_convivencia not in ('alta','media','baixa') then
    raise exception 'Convivência inválida';
  end if;

  if jsonb_typeof(p_respostas) <> 'array'
     or jsonb_array_length(p_respostas) = 0
     or jsonb_array_length(p_respostas) > 30 then
    raise exception 'Inclua pelo menos uma resposta válida';
  end if;

  if length(coalesce(p_nome, '')) > 160
     or length(coalesce(p_cargo_funcao, '')) > 200
     or length(coalesce(p_empresa_contexto, '')) > 250
     or length(coalesce(p_relacao_outro, '')) > 160 then
    raise exception 'Um dos campos de contexto excede o limite permitido';
  end if;

  insert into public.feedback_360_respondents(
    round_id,
    user_id,
    nome,
    cargo_funcao,
    empresa_contexto,
    relacao,
    relacao_outro,
    convivencia
  )
  values (
    v_round_id,
    v_user_id,
    nullif(trim(coalesce(p_nome, '')), ''),
    nullif(trim(coalesce(p_cargo_funcao, '')), ''),
    nullif(trim(coalesce(p_empresa_contexto, '')), ''),
    p_relacao,
    nullif(trim(coalesce(p_relacao_outro, '')), ''),
    p_convivencia
  )
  returning id into v_respondent_id;

  for v_item in
    select value from jsonb_array_elements(p_respostas)
  loop
    begin
      v_question_id := nullif(v_item->>'question_id', '')::uuid;
    exception when invalid_text_representation then
      v_question_id := null;
    end;

    v_resposta := trim(coalesce(v_item->>'resposta', ''));

    if v_question_id is null or v_resposta = '' then
      continue;
    end if;

    if length(v_resposta) > 5000 then
      raise exception 'Uma das respostas excede o limite permitido';
    end if;

    if not exists (
      select 1
      from public.feedback_360_questions q
      where q.id = v_question_id
        and q.round_id = v_round_id
        and q.user_id = v_user_id
    ) then
      raise exception 'Pergunta inválida para esta rodada';
    end if;

    insert into public.feedback_360_answers(
      round_id,
      user_id,
      respondent_id,
      question_id,
      resposta
    )
    values (
      v_round_id,
      v_user_id,
      v_respondent_id,
      v_question_id,
      v_resposta
    );

    v_answer_count := v_answer_count + 1;
  end loop;

  if v_answer_count = 0 then
    raise exception 'Inclua pelo menos uma resposta válida';
  end if;

  update public.feedback_360_rounds
    set status = 'em_coleta', updated_at = now()
  where id = v_round_id
    and user_id = v_user_id;

  update public.feedback_360_share_links
    set responses_count = responses_count + 1,
        last_response_at = now(),
        updated_at = now()
  where token = p_token;

  return v_respondent_id;
end;
$$;

revoke all on function public.submit_feedback_360_public(uuid,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.submit_feedback_360_public(uuid,text,text,text,text,text,text,jsonb) to anon, authenticated;
