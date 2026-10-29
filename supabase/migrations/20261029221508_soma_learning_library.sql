-- Biblioteca SOMA. Alteração aditiva: gravações e pontuações existentes preservadas.
create table public.soma_learning_courses (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 category text not null default 'Carreira',cover_url text not null default '',
 required_module text check(required_module in ('autoconhecimento','diagnostico','percepcao-360','curriculo-ats','linkedin','entrevistas','desenvolvimento','networking','vagas')),
 published boolean not null default false,position integer not null default 0,created_at timestamptz not null default now()
);
create table public.soma_learning_lessons (
 id uuid primary key default gen_random_uuid(),course_id uuid not null references public.soma_learning_courses(id),
 module_title text not null,title text not null,summary text not null,body text not null,exercise text not null,
 quiz_question text not null,quiz_options jsonb not null check(jsonb_array_length(quiz_options) between 2 and 5),
 quiz_answer integer not null check(quiz_answer between 0 and 4),media_url text not null default '',material_url text not null default '',
 duration_minutes integer not null default 5 check(duration_minutes between 1 and 240),
 position integer not null default 0,published boolean not null default false,created_at timestamptz not null default now()
);
create index soma_lessons_course on public.soma_learning_lessons(course_id,position);
create table public.soma_learning_progress (
 user_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id uuid not null references public.soma_learning_lessons(id),position_seconds integer not null default 0 check(position_seconds between 0 and 86400),
 reflection text not null default '' check(char_length(reflection)<=5000),completed_at timestamptz,updated_at timestamptz not null default now(),
 primary key(user_id,lesson_id)
);
alter table public.soma_learning_courses enable row level security;
alter table public.soma_learning_lessons enable row level security;
alter table public.soma_learning_progress enable row level security;
revoke all on public.soma_learning_courses,public.soma_learning_lessons,public.soma_learning_progress from public,anon,authenticated;
grant select on public.soma_learning_courses,public.soma_learning_progress to authenticated;
grant select(id,course_id,module_title,title,summary,duration_minutes,position,published) on public.soma_learning_lessons to authenticated;
grant all on public.soma_learning_courses,public.soma_learning_lessons,public.soma_learning_progress to service_role;
-- NULL = mentoria; os demais módulos usam exatamente o acesso já contratado.
create policy learning_courses_read on public.soma_learning_courses for select to authenticated using (
 public.is_admin() or (published and (public.soma_has_mentorship_entitlement() or
 (required_module is not null and public.soma_can_access_module_for(auth.uid(),required_module))))
);
create policy learning_lessons_read on public.soma_learning_lessons for select to authenticated using (
 (published or public.is_admin()) and exists(select 1 from public.soma_learning_courses c where c.id=course_id)
);
create policy learning_progress_own on public.soma_learning_progress for select to authenticated using ((select auth.uid())=user_id);
-- Apenas o backend pode escrever conclusão e pontuar. Idempotência também em chamadas simultâneas.
create function public.soma_save_learning_progress(p_user uuid,p_lesson uuid,p_position integer,p_reflection text,p_complete boolean)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare result public.soma_learning_progress; bonus integer;
begin
 if p_user is null or p_lesson is null or char_length(p_reflection)>5000 then raise exception 'Invalid progress'; end if;
 insert into public.soma_learning_progress(user_id,lesson_id,position_seconds,reflection,completed_at)
 values(p_user,p_lesson,p_position,p_reflection,case when p_complete then now() else null end)
 on conflict(user_id,lesson_id) do update set position_seconds=excluded.position_seconds,
 reflection=case when soma_learning_progress.completed_at is not null then soma_learning_progress.reflection else excluded.reflection end,
 completed_at=coalesce(soma_learning_progress.completed_at,excluded.completed_at),updated_at=now()
 returning * into result;
 if result.completed_at is not null and exists(select 1 from public.profiles where id=p_user and not is_admin) then
  insert into public.user_xp(user_id,action,points) values(p_user,'microaula:'||p_lesson::text,10) on conflict(user_id,action) do nothing;
  get diagnostics bonus=row_count;
  if bonus=1 then update public.profiles set pontos_total=coalesce(pontos_total,0)+10,updated_at=now() where id=p_user; end if;
 end if;
 return to_jsonb(result);
end $$;
revoke all on function public.soma_save_learning_progress(uuid,uuid,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.soma_save_learning_progress(uuid,uuid,integer,text,boolean) to service_role;

-- Conteúdo autoral inicial de leitura + aplicação. Nenhum vídeo fictício ou de terceiro.
do $$ declare c uuid; begin
 insert into public.soma_learning_courses(title,description,category,required_module,published,position)
 values('LinkedIn que comunica seu valor','Três microaulas para escolher seu foco, escrever uma headline clara e apresentar resultados que você consegue comprovar.','LinkedIn','linkedin',true,1) returning id into c;
 insert into public.soma_learning_lessons(course_id,module_title,title,summary,body,exercise,quiz_question,quiz_options,quiz_answer,duration_minutes,position,published) values
 (c,'1. Posicionamento','Escolha uma direção antes de editar o perfil','Defina o cargo e o contexto de trabalho que devem orientar sua apresentação.',
 'Um perfil claro começa com uma direção. Antes de alterar palavras, escolha qual trabalho você quer realizar e para quem. Isso ajuda a decidir quais experiências merecem destaque.\n\nListe duas ou três vagas reais que fazem sentido para seu momento. Compare responsabilidades, senioridade e competências recorrentes. Separe o que você já demonstra do que ainda precisa desenvolver.\n\nEscreva uma frase com cargo-alvo, contexto de atuação e contribuição. Exemplo: “Quero atuar como coordenadora de CRM em negócios digitais, conectando relacionamento e retenção”. O exemplo é um ponto de partida: adapte à sua história. Não acrescente ferramentas ou resultados que não consegue comprovar.',
 'Escreva seu cargo-alvo, o contexto em que quer atuar e uma contribuição apoiada na sua experiência.',
 'Qual é o melhor ponto de partida para revisar seu posicionamento?', '["Adicionar todas as competências populares","Definir uma direção e comparar vagas reais","Copiar o perfil de outra pessoa"]',1,4,1,true),
 (c,'2. Narrativa','Transforme sua headline em uma apresentação','Crie uma frase que diga o que você faz e em qual problema contribui.',
 'A headline deve ajudar alguém a entender rapidamente sua atuação. Escolha um papel ou área e complemente com competências que você realmente usa. Prefira termos compreensíveis e relevantes para as vagas que procura.\n\nUma estrutura possível é: área ou papel | especialidade | contribuição. Exemplo: “CRM e relacionamento | Segmentação e automação | Retenção de clientes”. Não há uma estrutura obrigatória e nenhuma frase garante alcance ou entrevistas.\n\nRevise palavras genéricas como “apaixonada por desafios”. Troque por uma competência ou contexto concreto. Leia em voz alta: outra pessoa entende seu foco sem precisar pedir uma explicação?',
 'Escreva uma headline baseada no seu foco. Inclua apenas competências que você pode demonstrar.',
 'O que torna uma headline mais clara?', '["Promessas de resultados sem evidência","Uma lista longa de adjetivos","Área de atuação e competências demonstráveis"]',2,5,2,true),
 (c,'3. Evidências','Conte o resultado da sua experiência','Troque uma lista de tarefas por exemplos concretos e verificáveis.',
 'Uma experiência fica mais compreensível quando mostra contexto, ação e resultado. Comece pelo problema ou objetivo. Explique sua participação e descreva a mudança observada.\n\nSe tiver uma métrica confiável, informe também o período e o contexto. Se não tiver, use evidências qualitativas: um processo documentado, uma rotina implantada ou um problema resolvido. Não invente percentuais para deixar o texto mais impressionante.\n\nExemplo sem número: “Organizei a rotina de acompanhamento de clientes e documentei critérios de priorização para a equipe”. A frase mostra uma entrega específica. Diferencie o que você fez individualmente do resultado coletivo.',
 'Escolha uma experiência e descreva o contexto, sua ação e o resultado. Use apenas evidências que consegue sustentar.',
 'O que fazer quando você não tem uma métrica confiável?', '["Descrever uma entrega qualitativa concreta","Inventar um percentual aproximado","Apagar a experiência"]',0,5,3,true);
end $$;

-- Outras trilhas iniciais de leitura e aplicação.
do $$ declare c uuid; begin
insert into public.soma_learning_courses(title,description,category,required_module,published,position) values('Currículo com evidências','Prepare um currículo com foco na vaga e entregas verificáveis.','Currículo','curriculo-ats',true,2) returning id into c;
insert into public.soma_learning_lessons(course_id,module_title,title,summary,body,exercise,quiz_question,quiz_options,quiz_answer,duration_minutes,position,published) values(c,'1. Foco na vaga','Separe requisitos de palavras soltas','Leia a vaga e identifique o que precisa demonstrar.','Antes de adaptar o currículo, leia a descrição da vaga e separe responsabilidades, requisitos obrigatórios e diferenciais. Compare com sua experiência real. Uma palavra pode ajudar a localizar uma competência, mas não substitui evidência de que você a utilizou.

Escolha duas responsabilidades importantes e escreva qual entrega sua pode demonstrar cada uma. Se faltar um requisito, trate como uma lacuna para desenvolver. Não adicione ferramentas que você não domina apenas para coincidir com o anúncio.

A SOMA ajuda a organizar essa comparação. Nenhum currículo garante entrevista ou aprovação. A decisão depende também do contexto e dos critérios da empresa.','Escolha uma vaga e relacione dois requisitos a exemplos reais da sua experiência.','Como adaptar seu currículo de forma responsável?','["Copiar todos os requisitos mesmo sem experiência", "Relacionar os requisitos às experiências que consegue demonstrar", "Repetir o nome do cargo em todas as linhas"]',1,5,1,true);
insert into public.soma_learning_lessons(course_id,module_title,title,summary,body,exercise,quiz_question,quiz_options,quiz_answer,duration_minutes,position,published) values(c,'2. Evidências','Escreva uma entrega com contexto','Mostre sua participação e a mudança que ajudou a produzir.','Para revisar uma experiência, pergunte: qual era a necessidade, o que eu fiz e qual foi a entrega? Evite descrever apenas a ferramenta utilizada. Explique para que ela serviu e como você participou.

Se o resultado foi coletivo, deixe clara sua contribuição. Métricas precisam de uma fonte e de um contexto. Uma melhoria documentada, mesmo sem percentual, pode comunicar mais do que um número sem sustentação.

Depois, confira datas, cargos, contatos e legibilidade. Leia o arquivo exportado para verificar se o texto ficou completo. Uma revisão final pode revelar cortes ou campos esquecidos.','Reescreva uma experiência com contexto, ação e uma entrega verificável.','Qual descrição comunica uma entrega com mais clareza?','["Responsável por tudo na área", "Profissional excepcional e proativa", "Documentei os critérios de segmentação usados nas campanhas da equipe"]',2,5,2,true);
insert into public.soma_learning_courses(title,description,category,required_module,published,position) values('Entrevistas com exemplos reais','Prepare respostas que conectem sua experiência ao desafio da vaga.','Entrevistas','entrevistas',true,3) returning id into c;
insert into public.soma_learning_lessons(course_id,module_title,title,summary,body,exercise,quiz_question,quiz_options,quiz_answer,duration_minutes,position,published) values(c,'1. Preparação','Construa seu banco de histórias','Selecione situações reais antes de ensaiar as respostas.','Escolha situações em que você precisou resolver um problema, aprender algo ou trabalhar com outras pessoas. Cada história deve deixar claro o contexto, o objetivo, sua ação e o resultado observado.

Não decore um discurso inteiro. Anote os pontos essenciais para conseguir adaptar a resposta à pergunta. Se o entrevistador pedir detalhes, você precisa conseguir explicar as decisões e os limites da sua participação.

Inclua também um exemplo em que algo não saiu como esperado. Conte o que percebeu, como reagiu e o que faria diferente. Aprendizado concreto comunica mais do que uma falha artificial apresentada como qualidade.','Descreva uma situação real com contexto, objetivo, sua ação e resultado ou aprendizado.','O que torna uma história de entrevista mais útil?','["Ter um exemplo real com sua contribuição clara", "Ser decorada palavra por palavra", "Atribuir todos os resultados da equipe a você"]',0,5,1,true);
insert into public.soma_learning_lessons(course_id,module_title,title,summary,body,exercise,quiz_question,quiz_options,quiz_answer,duration_minutes,position,published) values(c,'2. Conversa','Prepare perguntas para a empresa','Use a entrevista também para avaliar se a oportunidade faz sentido.','Uma entrevista ajuda os dois lados a entender a relação de trabalho. Além de apresentar sua experiência, busque compreender prioridades, expectativas e formas de colaboração.

Você pode perguntar quais problemas precisam de atenção nos primeiros meses, como a equipe acompanha resultados e quais áreas trabalham juntas. Adapte as perguntas ao que já foi conversado, para não repetir algo que a pessoa acabou de explicar.

Depois da conversa, registre o que ficou claro e o que ainda precisa confirmar. Compare a oportunidade com seus critérios de carreira. Aceitar ou seguir no processo depende também do seu momento e das suas condições.','Escreva duas perguntas sobre a função que ajudem você a avaliar a oportunidade.','Qual pergunta ajuda a compreender as expectativas da função?','["Qual é a resposta certa para eu ser contratada?", "Quais problemas a pessoa contratada deve priorizar nos primeiros meses?", "Posso assumir que o trabalho é igual ao meu anterior?"]',1,5,2,true);
end $$;
