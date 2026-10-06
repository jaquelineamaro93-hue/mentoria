-- Percepção 360: coleta estruturada de feedback externo e síntese para diagnóstico.
-- Migração aditiva. Não altera nem remove dados históricos existentes.

create table if not exists public.feedback_360_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  objetivo text,
  status text not null default 'rascunho'
    check (status in ('rascunho','em_coleta','concluida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.feedback_360_questions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,
  user_id uuid not null,
  ordem integer not null check (ordem between 1 and 30),
  pergunta text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, ordem),
  unique (id, user_id, round_id),
  foreign key (round_id, user_id)
    references public.feedback_360_rounds(id, user_id)
    on delete cascade
);

create table if not exists public.feedback_360_respondents (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,
  user_id uuid not null,
  nome text,
  cargo_funcao text,
  empresa_contexto text,
  relacao text not null default 'outro'
    check (relacao in (
      'gestor_direto',
      'lideranca_indireta',
      'responde_a_mim',
      'par',
      'stakeholder',
      'cliente',
      'fornecedor',
      'colega_faculdade',
      'professor',
      'amigo_pessoal',
      'outro'
    )),
  relacao_outro text,
  convivencia text not null default 'media'
    check (convivencia in ('alta','media','baixa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id, round_id),
  foreign key (round_id, user_id)
    references public.feedback_360_rounds(id, user_id)
    on delete cascade
);

create table if not exists public.feedback_360_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,
  user_id uuid not null,
  respondent_id uuid not null,
  question_id uuid not null,
  resposta text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (respondent_id, question_id),
  foreign key (round_id, user_id)
    references public.feedback_360_rounds(id, user_id)
    on delete cascade,
  foreign key (respondent_id, user_id, round_id)
    references public.feedback_360_respondents(id, user_id, round_id)
    on delete cascade,
  foreign key (question_id, user_id, round_id)
    references public.feedback_360_questions(id, user_id, round_id)
    on delete cascade
);

create table if not exists public.feedback_360_summaries (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,
  user_id uuid not null,
  resumo_json jsonb,
  status text not null default 'pendente'
    check (status in ('pendente','concluida','erro')),
  erro_analise text,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, user_id),
  foreign key (round_id, user_id)
    references public.feedback_360_rounds(id, user_id)
    on delete cascade
);

create index if not exists idx_feedback_360_rounds_user_updated
  on public.feedback_360_rounds(user_id, updated_at desc);

create index if not exists idx_feedback_360_questions_round_order
  on public.feedback_360_questions(round_id, ordem);

create index if not exists idx_feedback_360_respondents_round
  on public.feedback_360_respondents(round_id, created_at);

create index if not exists idx_feedback_360_answers_round
  on public.feedback_360_answers(round_id, respondent_id, question_id);

create index if not exists idx_feedback_360_summaries_user
  on public.feedback_360_summaries(user_id, updated_at desc);

alter table public.feedback_360_rounds enable row level security;
alter table public.feedback_360_questions enable row level security;
alter table public.feedback_360_respondents enable row level security;
alter table public.feedback_360_answers enable row level security;
alter table public.feedback_360_summaries enable row level security;

create policy "feedback360_rounds_select_own"
  on public.feedback_360_rounds for select
  using (auth.uid() = user_id);
create policy "feedback360_rounds_insert_own"
  on public.feedback_360_rounds for insert
  with check (auth.uid() = user_id);
create policy "feedback360_rounds_update_own"
  on public.feedback_360_rounds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "feedback360_rounds_delete_own"
  on public.feedback_360_rounds for delete
  using (auth.uid() = user_id);

create policy "feedback360_questions_select_own"
  on public.feedback_360_questions for select
  using (auth.uid() = user_id);
create policy "feedback360_questions_insert_own"
  on public.feedback_360_questions for insert
  with check (auth.uid() = user_id);
create policy "feedback360_questions_update_own"
  on public.feedback_360_questions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "feedback360_questions_delete_own"
  on public.feedback_360_questions for delete
  using (auth.uid() = user_id);

create policy "feedback360_respondents_select_own"
  on public.feedback_360_respondents for select
  using (auth.uid() = user_id);
create policy "feedback360_respondents_insert_own"
  on public.feedback_360_respondents for insert
  with check (auth.uid() = user_id);
create policy "feedback360_respondents_update_own"
  on public.feedback_360_respondents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "feedback360_respondents_delete_own"
  on public.feedback_360_respondents for delete
  using (auth.uid() = user_id);

create policy "feedback360_answers_select_own"
  on public.feedback_360_answers for select
  using (auth.uid() = user_id);
create policy "feedback360_answers_insert_own"
  on public.feedback_360_answers for insert
  with check (auth.uid() = user_id);
create policy "feedback360_answers_update_own"
  on public.feedback_360_answers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "feedback360_answers_delete_own"
  on public.feedback_360_answers for delete
  using (auth.uid() = user_id);

create policy "feedback360_summaries_select_own"
  on public.feedback_360_summaries for select
  using (auth.uid() = user_id);
create policy "feedback360_summaries_insert_own"
  on public.feedback_360_summaries for insert
  with check (auth.uid() = user_id);
create policy "feedback360_summaries_update_own"
  on public.feedback_360_summaries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.feedback_360_rounds to authenticated;
grant select, insert, update, delete on public.feedback_360_questions to authenticated;
grant select, insert, update, delete on public.feedback_360_respondents to authenticated;
grant select, insert, update, delete on public.feedback_360_answers to authenticated;
grant select, insert, update on public.feedback_360_summaries to authenticated;

create or replace function public.feedback_360_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_feedback_360_rounds_updated_at on public.feedback_360_rounds;
create trigger trg_feedback_360_rounds_updated_at
before update on public.feedback_360_rounds
for each row execute function public.feedback_360_set_updated_at();

drop trigger if exists trg_feedback_360_questions_updated_at on public.feedback_360_questions;
create trigger trg_feedback_360_questions_updated_at
before update on public.feedback_360_questions
for each row execute function public.feedback_360_set_updated_at();

drop trigger if exists trg_feedback_360_respondents_updated_at on public.feedback_360_respondents;
create trigger trg_feedback_360_respondents_updated_at
before update on public.feedback_360_respondents
for each row execute function public.feedback_360_set_updated_at();

drop trigger if exists trg_feedback_360_answers_updated_at on public.feedback_360_answers;
create trigger trg_feedback_360_answers_updated_at
before update on public.feedback_360_answers
for each row execute function public.feedback_360_set_updated_at();

drop trigger if exists trg_feedback_360_summaries_updated_at on public.feedback_360_summaries;
create trigger trg_feedback_360_summaries_updated_at
before update on public.feedback_360_summaries
for each row execute function public.feedback_360_set_updated_at();

create or replace function public.feedback_360_touch_round()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id uuid;
  v_user_id uuid;
begin
  v_round_id := coalesce(new.round_id, old.round_id);
  v_user_id := coalesce(new.user_id, old.user_id);

  update public.feedback_360_rounds
    set updated_at = now()
  where id = v_round_id and user_id = v_user_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_feedback_360_questions_touch_round on public.feedback_360_questions;
create trigger trg_feedback_360_questions_touch_round
after insert or update or delete on public.feedback_360_questions
for each row execute function public.feedback_360_touch_round();

drop trigger if exists trg_feedback_360_respondents_touch_round on public.feedback_360_respondents;
create trigger trg_feedback_360_respondents_touch_round
after insert or update or delete on public.feedback_360_respondents
for each row execute function public.feedback_360_touch_round();

drop trigger if exists trg_feedback_360_answers_touch_round on public.feedback_360_answers;
create trigger trg_feedback_360_answers_touch_round
after insert or update or delete on public.feedback_360_answers
for each row execute function public.feedback_360_touch_round();

create or replace function public.criar_feedback_360_rodada(
  p_titulo text,
  p_objetivo text,
  p_perguntas jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_round_id uuid;
  v_pergunta text;
  v_ordem integer := 0;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  if nullif(trim(p_titulo), '') is null then
    raise exception 'Título obrigatório';
  end if;

  if jsonb_typeof(p_perguntas) <> 'array' or jsonb_array_length(p_perguntas) = 0 then
    raise exception 'Inclua pelo menos uma pergunta';
  end if;

  insert into public.feedback_360_rounds(user_id, titulo, objetivo, status)
  values (v_user_id, trim(p_titulo), nullif(trim(p_objetivo), ''), 'rascunho')
  returning id into v_round_id;

  for v_pergunta in
    select trim(value #>> '{}')
    from jsonb_array_elements(p_perguntas)
  loop
    if nullif(v_pergunta, '') is null then
      continue;
    end if;

    v_ordem := v_ordem + 1;

    insert into public.feedback_360_questions(round_id, user_id, ordem, pergunta)
    values (v_round_id, v_user_id, v_ordem, v_pergunta);
  end loop;

  if v_ordem = 0 then
    raise exception 'Inclua pelo menos uma pergunta válida';
  end if;

  return v_round_id;
end;
$$;

revoke all on function public.criar_feedback_360_rodada(text,text,jsonb) from public, anon;
grant execute on function public.criar_feedback_360_rodada(text,text,jsonb) to authenticated;

create or replace function public.salvar_feedback_360_respondente(
  p_round_id uuid,
  p_respondent_id uuid,
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
  v_user_id uuid := auth.uid();
  v_respondent_id uuid;
  v_item jsonb;
  v_question_id uuid;
  v_resposta text;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  if not exists (
    select 1 from public.feedback_360_rounds
    where id = p_round_id and user_id = v_user_id
  ) then
    raise exception 'Rodada não encontrada';
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

  if p_respondent_id is null then
    insert into public.feedback_360_respondents(
      round_id,user_id,nome,cargo_funcao,empresa_contexto,relacao,relacao_outro,convivencia
    )
    values (
      p_round_id,v_user_id,nullif(trim(p_nome),''),
      nullif(trim(p_cargo_funcao),''),nullif(trim(p_empresa_contexto),''),
      p_relacao,nullif(trim(p_relacao_outro),''),p_convivencia
    )
    returning id into v_respondent_id;
  else
    update public.feedback_360_respondents
      set nome = nullif(trim(p_nome),''),
          cargo_funcao = nullif(trim(p_cargo_funcao),''),
          empresa_contexto = nullif(trim(p_empresa_contexto),''),
          relacao = p_relacao,
          relacao_outro = nullif(trim(p_relacao_outro),''),
          convivencia = p_convivencia
    where id = p_respondent_id
      and round_id = p_round_id
      and user_id = v_user_id
    returning id into v_respondent_id;

    if v_respondent_id is null then
      raise exception 'Respondente não encontrado';
    end if;
  end if;

  if jsonb_typeof(p_respostas) = 'array' then
    for v_item in select * from jsonb_array_elements(p_respostas)
    loop
      v_question_id := nullif(v_item->>'question_id','')::uuid;
      v_resposta := trim(coalesce(v_item->>'resposta',''));

      if v_question_id is null or v_resposta = '' then
        continue;
      end if;

      if not exists (
        select 1 from public.feedback_360_questions
        where id = v_question_id
          and round_id = p_round_id
          and user_id = v_user_id
      ) then
        raise exception 'Pergunta inválida para esta rodada';
      end if;

      insert into public.feedback_360_answers(
        round_id,user_id,respondent_id,question_id,resposta
      )
      values (
        p_round_id,v_user_id,v_respondent_id,v_question_id,v_resposta
      )
      on conflict (respondent_id, question_id)
      do update set resposta = excluded.resposta, updated_at = now();
    end loop;
  end if;

  update public.feedback_360_rounds
    set status = 'em_coleta', updated_at = now()
  where id = p_round_id and user_id = v_user_id;

  return v_respondent_id;
end;
$$;

revoke all on function public.salvar_feedback_360_respondente(uuid,uuid,text,text,text,text,text,text,jsonb) from public, anon;
grant execute on function public.salvar_feedback_360_respondente(uuid,uuid,text,text,text,text,text,text,jsonb) to authenticated;
