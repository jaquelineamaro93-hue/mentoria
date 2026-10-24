create or replace function public.listar_mentorados_publicos()
returns table(id uuid,nome text) language sql stable security definer set search_path=public as $$
 select p.id,p.nome from profiles p where public.soma_saas_table_gate(array[]::text[]) and p.is_admin=false and p.id<>auth.uid() order by p.nome;
$$;
create or replace function public.listar_ranking_comunidade()
returns table(user_id uuid,nome text,foto_url text,pontos integer) language sql stable security definer set search_path=public as $$
 select p.id,coalesce(nullif(trim(p.nome),''),'Sem nome'),p.foto_url,coalesce(p.pontos_total,0)::integer
 from profiles p where public.soma_saas_table_gate(array[]::text[]) and coalesce(p.is_admin,false)=false and coalesce(p.status_assinatura,'ativo')='ativo'
 order by coalesce(p.pontos_total,0) desc,coalesce(p.nome,'') asc,p.id asc;
$$;
revoke all on function listar_mentorados_publicos(),listar_ranking_comunidade() from public,anon;
grant execute on function listar_mentorados_publicos(),listar_ranking_comunidade() to authenticated,service_role;