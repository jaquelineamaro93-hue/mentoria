-- Preferências e registro privado de disparo. Nenhuma alteração em assinaturas.
create table public.soma_newsletter_opt_out(user_id uuid primary key references public.profiles(id) on delete cascade,created_at timestamptz not null default now());
create table public.soma_newsletter_dispatches(
 campaign text not null,user_id uuid not null references public.profiles(id) on delete cascade,email text not null,
 status text not null check(status in ('reserved','accepted','unconfirmed')),created_at timestamptz not null default now(),sent_at timestamptz,
 primary key(campaign,user_id),unique(campaign,email)
);
alter table public.soma_newsletter_opt_out enable row level security;
alter table public.soma_newsletter_dispatches enable row level security;
revoke all on public.soma_newsletter_opt_out,public.soma_newsletter_dispatches from public,anon,authenticated;
grant all on public.soma_newsletter_opt_out,public.soma_newsletter_dispatches to service_role;
-- Auth.users não deve receber concessões amplas. Projeção mínima exclusivamente para backend.
create function private.soma_newsletter_recipients()
returns table(id uuid,nome text,email text) language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service role required' using errcode='42501';end if;
 return query select distinct on(lower(trim(p.email))) p.id,p.nome,lower(trim(p.email)) from public.profiles p join auth.users u on u.id=p.id
 where u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until<now())
 and lower(trim(p.email))=lower(trim(u.email))
 and p.email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 and p.email !~* '(\+(test|teste|qa)|@(example\.|test\.|invalid\.))'
 and not exists(select 1 from public.trial_growth_opt_out o where o.user_id=p.id)
 and not exists(select 1 from public.soma_newsletter_opt_out o where o.user_id=p.id)
 and not exists(select 1 from public.mentoria_pausas o where o.user_id=p.id and o.status='ativa')
 order by lower(trim(p.email)),p.created_at;
end $$;
revoke all on function private.soma_newsletter_recipients() from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.soma_newsletter_recipients() to service_role;
create function public.soma_newsletter_recipients() returns table(id uuid,nome text,email text)
 language sql stable security invoker set search_path=public,pg_temp as $$select * from private.soma_newsletter_recipients()$$;
revoke all on function public.soma_newsletter_recipients() from public,anon,authenticated;
grant execute on function public.soma_newsletter_recipients() to service_role;

-- Novidade e tutorial publicados uma vez. O sino usa esta mesma release.
do $$ declare article uuid;actor uuid;begin
 select id into actor from public.profiles where email='jaqueline.amaro93@gmail.com' and is_admin limit 1;
 insert into public.soma_help_articles(slug,title,summary,category,body,audience,status,published_at,feature_path,updated_by)
 values('biblioteca-aprender-e-aplicar','Biblioteca de aprendizagem: aprenda, aplique e avance',
 'Conheça as trilhas de LinkedIn, currículo e entrevistas, salve sua aplicação prática e acompanhe seu progresso.','Biblioteca de aprendizagem',
 E'## Um espaço para aprender e aplicar\n\nA biblioteca chegou à SOMA com trilhas organizadas por tema. Cada microaula combina um conceito, uma atividade de aplicação e uma pergunta de checagem. Há três trilhas iniciais de leitura e prática: LinkedIn, currículo e entrevistas. Os vídeos cadastrados são assistidos dentro do portal, sem copiar os arquivos do YouTube para a SOMA.\n\n## Como começar\n\n1. Abra **Minha jornada → Biblioteca de aprendizagem**.\n2. Escolha uma trilha e entre na microaula.\n3. Leia o conteúdo e assista ao vídeo quando houver.\n4. Registre sua aplicação prática e responda à pergunta.\n5. Use **Concluir microaula** para salvar a conclusão ou **Salvar e continuar depois** para retomar.\n\nAs trilhas disponíveis seguem seu plano. As gravações anteriores continuam em uma seção própria. Nos vídeos incorporados, o avanço da aula é registrado pela atividade; a posição exata do vídeo depende do provedor.\n\n## Seu progresso conta\n\nCada microaula concluída com a aplicação e a checagem rende **10 Impulsos**, uma única vez, na pontuação da SOMA. Trilhas concluídas aparecem nas conquistas da biblioteca. A checagem é formativa, sem promessa de certificação de competência ou comprovação de tempo assistido.\n\n## Quer compartilhar algo que sabe?\n\nUma ferramenta, uma experiência ou uma forma de resolver um problema pode ajudar outras pessoas. Fale com Jaqueline para propor uma aula e combinar sua publicação. O cadastro de aulas é feito pela administração. Bônus por autoria ainda não está disponível nesta versão.\n\n## Para quem administra\n\nAbra **Administração → Biblioteca e microaulas** para criar trilhas, módulos, aulas e atividades. Publique o vídeo como não listado no YouTube e cole seu link na microaula. Não é necessário enviar o arquivo para a SOMA. Quem tiver o link não listado poderá compartilhá-lo.',
 'all','published',now(),'/gravacoes',actor)
 on conflict(slug) do update set title=excluded.title,summary=excluded.summary,body=excluded.body,status='published',feature_path='/gravacoes',updated_at=now()
 returning id into article;
 if not exists(select 1 from public.soma_help_releases where article_id=article and kind='new') then
 insert into public.soma_help_releases(article_id,title,summary,kind,notify,published_at,created_by)
 values(article,'Chegou a biblioteca de aprendizagem','Trilhas de LinkedIn, currículo e entrevistas, aplicação prática e progresso no seu ritmo. Conheça em Minha jornada → Biblioteca de aprendizagem.','new',true,now(),actor);
 end if;
end $$;
