-- Hardening dos RPCs/trigger da Percepção 360.
-- Mantém RLS ativo também dentro das funções transacionais.

alter function public.criar_feedback_360_rodada(text,text,jsonb) security invoker;
alter function public.salvar_feedback_360_respondente(uuid,uuid,text,text,text,text,text,text,jsonb) security invoker;
alter function public.feedback_360_touch_round() security invoker;

revoke all on function public.feedback_360_touch_round() from public, anon, authenticated;
revoke all on function public.criar_feedback_360_rodada(text,text,jsonb) from public, anon;
revoke all on function public.salvar_feedback_360_respondente(uuid,uuid,text,text,text,text,text,text,jsonb) from public, anon;

grant execute on function public.criar_feedback_360_rodada(text,text,jsonb) to authenticated;
grant execute on function public.salvar_feedback_360_respondente(uuid,uuid,text,text,text,text,text,text,jsonb) to authenticated;
