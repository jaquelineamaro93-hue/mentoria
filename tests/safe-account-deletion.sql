begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
insert into auth.users(id,email,raw_user_meta_data) values
 ('ccb79810-015f-412a-b604-40ce2bb3a001','empty-deletion-fixture@example.invalid','{}'),
 ('ccb79810-015f-412a-b604-40ce2bb3a002','history-deletion-fixture@example.invalid','{}'),
 ('ccb79810-015f-412a-b604-40ce2bb3a003','admin-deletion-fixture@example.invalid','{}');
update profiles set is_admin=true where id='ccb79810-015f-412a-b604-40ce2bb3a003';
insert into mapa_essencia(user_id,conteudo_markdown) values('ccb79810-015f-412a-b604-40ce2bb3a002','preserved-history');
insert into mp_pedidos(user_id,email,tipo,forma_pagamento,valor)
 values('ccb79810-015f-412a-b604-40ce2bb3a001','empty-deletion-fixture@example.invalid','credito_simulacao_cv','avista',5);
do $$ declare r jsonb; n integer; begin
 r:=soma_delete_empty_account('ccb79810-015f-412a-b604-40ce2bb3a002','ccb79810-015f-412a-b604-40ce2bb3a003');
 if r->>'reason'<>'saved_history' or not exists(select 1 from mapa_essencia where user_id='ccb79810-015f-412a-b604-40ce2bb3a002') then raise exception 'History deleted'; end if;
 r:=soma_delete_empty_account('ccb79810-015f-412a-b604-40ce2bb3a003','ccb79810-015f-412a-b604-40ce2bb3a003');
 if (r->>'deleted')::boolean then raise exception 'Admin deletion allowed'; end if;
 r:=soma_delete_empty_account('ccb79810-015f-412a-b604-40ce2bb3a001','ccb79810-015f-412a-b604-40ce2bb3a003');
 if not (r->>'deleted')::boolean then raise exception 'Empty deletion failed: %',r; end if;
 if exists(select 1 from auth.users where id='ccb79810-015f-412a-b604-40ce2bb3a001') then raise exception 'Auth user retained'; end if;
 if not exists(select 1 from mp_pedidos where user_id is null and email='empty-deletion-fixture@example.invalid') then raise exception 'Pending order erased'; end if;
 if not exists(select 1 from soma_account_deletion_audit where deleted_user_id='ccb79810-015f-412a-b604-40ce2bb3a001') then raise exception 'Audit missing'; end if;
 insert into soma_legacy_student_registry(user_id) values('ccb79810-015f-412a-b604-40ce2bb3a002');
 r:=soma_delete_empty_account('ccb79810-015f-412a-b604-40ce2bb3a002','ccb79810-015f-412a-b604-40ce2bb3a003');
 if r->>'reason'<>'historical_account' then raise exception 'Legacy registry ignored'; end if;
 if has_function_privilege('authenticated','soma_delete_empty_account(uuid,uuid)','execute') or has_function_privilege('anon','soma_delete_empty_account(uuid,uuid)','execute') then raise exception 'RPC exposed'; end if;
end $$;
rollback;
select 'PASS: empty test account deleted atomically, saved history preserved, order retained, admin protected, audit recorded, client RPC denied; all fixtures rolled back' as result;
