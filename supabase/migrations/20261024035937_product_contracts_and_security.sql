-- Keep historical contracts, signatures, student answers and payment rows intact.
create table public.product_contract_versions (
 version text primary key,
 product text not null check(product in ('carreira','plataforma','adicionais')),
 title text not null,
 content_markdown text not null,
 published_at timestamptz not null default now()
);
alter table public.product_contract_versions enable row level security;
revoke all on public.product_contract_versions from public,anon,authenticated;
grant select on public.product_contract_versions to authenticated;
grant all on public.product_contract_versions to service_role;
create policy product_contract_versions_read on public.product_contract_versions for select to authenticated using(true);
alter table public.mp_pedidos add column terms_version text references public.product_contract_versions(version), add column terms_accepted_at timestamptz, add column contract_snapshot jsonb;
create function public.soma_has_career_contract() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and exists(select 1 from public.mp_pedidos where user_id=auth.uid() and tipo='plano' and terms_version='carreira-2026-10-24' and terms_accepted_at is not null)
$$;
revoke all on function public.soma_has_career_contract() from public,anon;
grant execute on function public.soma_has_career_contract() to authenticated,service_role;
alter table public.soma_saas_accounts alter column terms_version set default 'saas-2026-10-24-v2';
alter table public.soma_module_orders drop constraint soma_module_orders_explicit_consent;
alter table public.soma_module_orders add constraint soma_module_orders_explicit_consent check(terms_version in ('modular-1.0','saas-2026-10-24','saas-recovery-2026-10-24','saas-2026-10-24-v2','saas-recovery-2026-10-24-v2') and terms_accepted_at is not null);

-- Account creation is performed by the existing auth trigger, not by arbitrary
-- profile INSERT requests that could supply an admin role or paid entitlement.
revoke insert on public.profiles from anon,authenticated;
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prorettype='trigger'::regtype and p.prosecdef
 loop execute format('revoke execute on function %s from public,anon,authenticated',f.signature); end loop;
end $$;

CREATE OR REPLACE FUNCTION public.soma_saas_create_order(p_user uuid, p_config jsonb, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare o public.soma_module_orders%rowtype; mods text[]; expected numeric;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 mods:=array(select jsonb_array_elements_text(p_config->'modules'));
 expected:=case p_config->>'plan_code' when 'avulso' then 24.90 when 'essencial' then 34.90 when 'pro' then 69.90 end
  + case when (p_config->>'iris')::boolean and (p_config->>'whatsapp')::boolean then 250
    when (p_config->>'iris')::boolean or (p_config->>'whatsapp')::boolean then 150 else 0 end;
 if expected is null or expected<>p_amount or cardinality(mods)<1 then raise exception 'Invalid amount'; end if;
 select * into o from soma_module_orders where user_id=p_user and plan_code is not null
  and status not in ('CANCELED','EXPIRED','FAILED') order by created_at desc limit 1 for update;
 if found then
  if o.status='PENDING' and o.plan_code=p_config->>'plan_code' and o.modules=mods
   and o.iris=(p_config->>'iris')::boolean and o.whatsapp=(p_config->>'whatsapp')::boolean then return o.id; end if;
  raise exception 'Existing subscription';
 end if;
 insert into soma_module_orders(user_id,module_slug,amount,terms_version,terms_accepted_at,plan_code,modules,iris,whatsapp)
 values(p_user,mods[1],p_amount,'saas-2026-10-24-v2',now(),p_config->>'plan_code',mods,(p_config->>'iris')::boolean,(p_config->>'whatsapp')::boolean)
 returning id into o.id;
 return o.id;
end $function$
;
CREATE OR REPLACE FUNCTION public.soma_saas_recovery_checkout(p_user uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare f soma_saas_recovery_offers%rowtype; o soma_module_orders%rowtype; result uuid; discount numeric;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Backend only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into f from soma_saas_recovery_offers where user_id=p_user for update;
 if not found then raise exception 'Offer unavailable'; end if;
 if f.accepted_at is not null then
  select * into o from soma_module_orders where id=f.order_id;
  if o.status not in ('PENDING','AUTHORIZED') then raise exception 'Offer already used'; end if;
  return f.order_id;
 end if;
 if f.expires_at<=now() then raise exception 'Offer expired'; end if;
 if exists(select 1 from soma_module_payment_events e join soma_module_orders x on x.id=e.order_id where x.user_id=p_user and e.status in ('approved','refunded','charged_back')) then raise exception 'Already paid'; end if;
 select * into o from soma_module_orders where id=f.source_order_id;
 discount:=case o.plan_code when 'avulso' then 5.00 when 'essencial' then 7.00 when 'pro' then 14.00 end;
 if exists(select 1 from soma_module_orders where user_id=p_user and plan_code is not null and status not in ('CANCELED','EXPIRED')) then raise exception 'Existing subscription'; end if;
 result:=soma_saas_create_order(p_user,jsonb_build_object('plan_code',o.plan_code,'modules',o.modules,'iris',o.iris,'whatsapp',o.whatsapp),o.amount);
 -- An existing full-price checkout must never be silently repriced.
 if exists(select 1 from soma_module_orders where id=result and (provider_subscription_id is not null or checkout_started_at is not null)) then raise exception 'Checkout already started'; end if;
 update soma_module_orders set intro_amount=o.amount-discount,terms_version='saas-recovery-2026-10-24-v2',terms_accepted_at=now() where id=result;
 update soma_saas_recovery_offers set accepted_at=now(),order_id=result where user_id=p_user;
 return result;
end $function$;


CREATE OR REPLACE FUNCTION public.solicitar_pausa_mentoria(p_dias integer, p_confirmou boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 v_user uuid:=auth.uid();
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_profile public.profiles%ROWTYPE;
 v_term public.termos_versoes%ROWTYPE;
 v_ciclo public.mentoria_pausa_ciclos%ROWTYPE;
 v_pausa public.mentoria_pausas%ROWTYPE;
BEGIN
 IF v_user IS NULL OR p_confirmou IS NOT TRUE
   THEN RAISE EXCEPTION 'Confirme a solicitação de pausa no seu plano'; END IF;
 IF p_dias IS NULL OR p_dias NOT BETWEEN 1 AND 60
   THEN RAISE EXCEPTION 'A pausa deve ter de 1 a 60 dias'; END IF;
 SELECT * INTO v_profile FROM public.profiles WHERE id=v_user FOR UPDATE;
 IF NOT FOUND OR v_profile.is_admin OR v_profile.status_assinatura<>'ativo'
    OR v_profile.plano_id IS NULL
    THEN RAISE EXCEPTION 'A pausa é disponível apenas para planos pagos ativos'; END IF;
 IF v_profile.data_fim_acesso IS NULL THEN
   RAISE EXCEPTION 'O vencimento do seu plano precisa ser confirmado pela equipe antes da pausa'; END IF;
 IF v_profile.data_fim_acesso < v_today
   THEN RAISE EXCEPTION 'Seu plano já venceu; entre em contato com a equipe'; END IF;
 SELECT * INTO v_term FROM public.termos_versoes
   WHERE (public.soma_has_career_contract() AND versao='carreira-2026-10-24') OR (NOT public.soma_has_career_contract() AND ativo=true) ORDER BY publicado_em DESC LIMIT 1;
 IF NOT public.soma_has_career_contract() AND (NOT FOUND OR v_term.versao NOT IN ('2.1')
   OR NOT EXISTS(SELECT 1 FROM public.termos_aceites
     WHERE user_id=v_user AND termo_id=v_term.id))
   THEN RAISE EXCEPTION 'Você precisa aceitar a versão atualizada do termo de mentoria'; END IF;
 IF EXISTS(SELECT 1 FROM public.mentoria_pausas WHERE user_id=v_user AND status='ativa')
   THEN RAISE EXCEPTION 'Já existe uma pausa ativa neste plano'; END IF;

 SELECT * INTO v_ciclo FROM public.mentoria_pausa_ciclos
  WHERE user_id=v_user AND plano_id=v_profile.plano_id
  ORDER BY criado_em DESC LIMIT 1 FOR UPDATE;
 IF NOT FOUND OR v_ciclo.vencimento_atual<>v_profile.data_fim_acesso THEN
   INSERT INTO public.mentoria_pausa_ciclos(user_id,plano_id,vencimento_base,vencimento_atual)
   VALUES(v_user,v_profile.plano_id,v_profile.data_fim_acesso,v_profile.data_fim_acesso)
   RETURNING * INTO v_ciclo;
 END IF;
 IF v_ciclo.dias_utilizados+p_dias>60 THEN
   RAISE EXCEPTION 'Restam % dias de pausa neste ciclo',greatest(0,60-v_ciclo.dias_utilizados);
 END IF;
 INSERT INTO public.mentoria_pausas (
    user_id,ciclo_id,termo_id,inicio_em,fim_previsto_em,dias_solicitados,vencimento_antes)
 VALUES (v_user,v_ciclo.id,v_term.id,v_today,v_today+p_dias,p_dias,v_profile.data_fim_acesso)
 RETURNING * INTO v_pausa;
 RETURN jsonb_build_object('id',v_pausa.id,'status','ativa','inicio',v_today,
    'fim_previsto',v_pausa.fim_previsto_em,'dias',p_dias,
    'vencimento_original',v_profile.data_fim_acesso,
    'dias_disponiveis',60-v_ciclo.dias_utilizados-p_dias);
END;
$function$;


-- Publish immutable version identifiers for new purchases.
insert into public.product_contract_versions(version,product,title,content_markdown) values ('carreira-2026-10-24','carreira','Contrato de contratação SOMA Carreira','## SOMA Carreira

### Produto e vigência
O plano contratado é um programa de acompanhamento humano de carreira. A modalidade, o prazo, o valor total, a forma de pagamento e a quantidade de parcelas são os apresentados no checkout e registrados no pedido. Parcelamento do preço de um programa não é assinatura mensal do software. O pagamento depende de confirmação pelo Mercado Pago.

### O que está incluído
Nos planos atuais SOMA Carreira estão incluídos portal, ferramentas de carreira, encontros coletivos, um encontro individual por mês, Copiloto e acompanhamento no WhatsApp, conforme a modalidade contratada e os agendamentos disponíveis. Esses itens não devem ser cobrados novamente como adicionais do SaaS. Direitos de contratos anteriores permanecem conforme o documento originalmente aceito.

### Adicionais opcionais
O kit de onboarding e os encontros individuais além de um por mês são opcionais e exigem contratação específica. Nos pacotes atuais de seis meses, dois encontros individuais por mês acrescentam R$ 179,90 ao pacote e três encontros por mês acrescentam R$ 227,99. Nos pacotes de doze meses, os acréscimos totais são R$ 359,80 e R$ 455,98. Esses acréscimos são totais do pacote, não preços mensais. Quatro ou mais encontros por mês dependem de proposta expressamente aceita. O kit opcional custa R$ 189,90, em compra única. Valores adicionais somente integram o contrato quando discriminados na proposta e no pedido.

### Encontros, cancelamento e pausa
Os encontros exigem agendamento. Reagendamentos, faltas e pedidos de cancelamento serão tratados pelos canais oficiais e pelas condições efetivamente contratadas, respeitados os direitos do consumidor. A pausa voluntária é disponível para planos pagos ativos com vencimento registrado, de um a sessenta dias corridos, com limite acumulado de sessenta dias por ciclo contratado. O teste gratuito não permite pausa. A contagem segue Brasília. A participação e os lembretes usuais ficam suspensos, com histórico e conquistas preservados. Os dias efetivamente pausados prorrogam o vencimento, e a pessoa pode retomar antes do previsto. O retorno programado ocorre automaticamente na data registrada. A pausa exige confirmação na solicitação. Ela não interrompe automaticamente as parcelas no provedor. Nenhuma mudança contratual apaga atividades ou respostas já registradas.

### Uso, confidencialidade e dados
O acesso é pessoal. Não é permitido divulgar dados privados de outros participantes, compartilhar credenciais ou redistribuir materiais proprietários sem autorização. Os dados são usados para prestar o serviço, manter os registros da contratação e cumprir obrigações legais. O uso de imagem, voz e depoimentos para publicidade depende de autorização específica e opcional, sem ser condição para contratar. Resultados de carreira e recolocação não são garantidos. Respostas de IA devem ser revisadas antes de uso profissional.

### Direitos e atendimento
O teste gratuito, quando oferecido, é diferente do direito legal de arrependimento. Nas contratações à distância, aplicam-se os direitos do artigo 49 do Código de Defesa do Consumidor, inclusive o prazo legal de sete dias e a devolução dos valores nas hipóteses previstas em lei. Pedidos de cancelamento, arrependimento, correção ou acesso aos dados podem ser encaminhados pelos canais oficiais publicados em somamentoria.com. Nenhuma cláusula limita direitos legais do consumidor.

### Registro do aceite
Ao confirmar a contratação, a pessoa aceita esta versão e as condições comerciais selecionadas. A conta, o pedido, a versão e a data do aceite ficam registrados. Esse aceite não substitui, altera ou elimina documentos e direitos anteriormente constituídos.');
insert into public.product_contract_versions(version,product,title,content_markdown) values ('saas-2026-10-24-v2','plataforma','Contrato de assinatura SOMA Plataforma','## SOMA Plataforma

### Produto contratado
A assinatura dá acesso aos módulos de software selecionados no checkout: módulo avulso, Essencial ou Pro. Ela não inclui encontros humanos, mentoria, comunidade exclusiva da mentoria nem kit de onboarding. Os módulos e os agentes escolhidos ficam registrados no pedido. A assinatura de um módulo não libera outros produtos.

### Teste gratuito
O teste dura sete dias, vale uma vez por conta e não exige cartão. Ele libera somente os módulos e agentes escolhidos. Não gera cobrança automática nem reinicia ao cancelar ou contratar outro plano. Ao autorizar uma assinatura durante o teste, a recorrência começa após o término dele.

### Preço e agentes
O valor mensal é o total selecionado e apresentado antes da confirmação. Íris e agente de WhatsApp são adicionais opcionais, a R$ 150,00 mensais cada ou R$ 250,00 mensais em conjunto. Não estão incluídos nos planos base. Os agentes estão sujeitos aos limites de uso informados na plataforma e não representam consumo ilimitado de IA. Contato proativo no WhatsApp depende de autorização do titular.

### Cobrança e cancelamento
A cobrança é mensal pelo Mercado Pago e continua até o cancelamento. O acesso pago depende da confirmação do pagamento. A assinatura pode ser cancelada em Minhas assinaturas, na SOMA Plataforma. No funcionamento atual, cancelar interrompe a recorrência e encerra o acesso pago. Pagamentos recusados, estornos e contestações podem suspender o acesso correspondente. Cancelar não apaga automaticamente respostas, documentos ou conversas. A guarda e os pedidos de eliminação seguem a legislação de proteção de dados.

### Privacidade e uso responsável
Cada conta acessa seus próprios dados. O serviço trata informações necessárias à execução do contrato e à operação das ferramentas. O salvamento de conversas da Íris depende da preferência específica da conta. Não compartilhe dados sigilosos de terceiros sem autorização. A IA pode produzir erros e deve apoiar, e não substituir, a revisão humana. Não há garantia de emprego, renda ou aprovação em processos seletivos. Publicidade com imagem ou depoimento exige autorização opcional separada.

### Direitos e atendimento
Os sete dias de teste não substituem nem reduzem o direito legal de arrependimento das contratações à distância. Aplicam-se o artigo 49 do Código de Defesa do Consumidor e os demais direitos previstos em lei. Solicitações de arrependimento, estorno e privacidade podem ser feitas pelos canais oficiais publicados em somamentoria.com.

### Registro da contratação
O aceite registra a conta, a versão, a data e os produtos escolhidos. O preço, a composição e os pagamentos permanecem vinculados ao pedido. Este documento vale para a nova contratação e não altera contratos anteriores.');
insert into public.product_contract_versions(version,product,title,content_markdown) values ('adicionais-2026-10-24','adicionais','Condições de compras adicionais','## Compras adicionais

Uma compra adicional é identificada separadamente no pedido, com quantidade, valor, produto e data de aceite. Não cria assinatura de mentoria nem libera todos os módulos da plataforma.

Uma sessão individual avulsa, quando oferecida no checkout próprio, é uma compra única e depende de agendamento. Ela é diferente dos pacotes de encontros mensais contratados com a SOMA Carreira. Um crédito de simulação de currículo permite uma simulação extra e não é uma sessão humana.

O kit opcional de onboarding pertence à contratação da SOMA Carreira e custa R$ 189,90, em compra única. Os pacotes de encontros além do encontro mensal incluído seguem a quantidade, a duração e o acréscimo total expressamente selecionados na proposta. Eles não devem ser confundidos com uma cobrança mensal de SaaS.

O preço exibido no checkout específico é o aplicável ao item comprado. Não há renovação automática de compras únicas. Liberação de créditos e confirmação de sessões dependem do pagamento aprovado. Reagendamentos são tratados pelos canais oficiais. Aplicam-se os direitos legais de arrependimento, reembolso e proteção de dados, sem renúncia pelo uso de um período de teste. O histórico existente permanece guardado e separado da compra.

O aceite de uma nova compra não altera contratos antigos. Atendimento pelos canais oficiais publicados em somamentoria.com.');
insert into public.product_contract_versions(version,product,title,content_markdown) values ('saas-recovery-2026-10-24-v2','plataforma','Contrato SOMA Plataforma com oferta de recuperação','## SOMA Plataforma

### Produto contratado
A assinatura dá acesso aos módulos de software selecionados no checkout: módulo avulso, Essencial ou Pro. Ela não inclui encontros humanos, mentoria, comunidade exclusiva da mentoria nem kit de onboarding. Os módulos e os agentes escolhidos ficam registrados no pedido. A assinatura de um módulo não libera outros produtos.

### Teste gratuito
O teste dura sete dias, vale uma vez por conta e não exige cartão. Ele libera somente os módulos e agentes escolhidos. Não gera cobrança automática nem reinicia ao cancelar ou contratar outro plano. Ao autorizar uma assinatura durante o teste, a recorrência começa após o término dele.

### Preço e agentes
O valor mensal é o total selecionado e apresentado antes da confirmação. Íris e agente de WhatsApp são adicionais opcionais, a R$ 150,00 mensais cada ou R$ 250,00 mensais em conjunto. Não estão incluídos nos planos base. Os agentes estão sujeitos aos limites de uso informados na plataforma e não representam consumo ilimitado de IA. Contato proativo no WhatsApp depende de autorização do titular.

### Cobrança e cancelamento
A cobrança é mensal pelo Mercado Pago e continua até o cancelamento. O acesso pago depende da confirmação do pagamento. A assinatura pode ser cancelada em Minhas assinaturas, na SOMA Plataforma. No funcionamento atual, cancelar interrompe a recorrência e encerra o acesso pago. Pagamentos recusados, estornos e contestações podem suspender o acesso correspondente. Cancelar não apaga automaticamente respostas, documentos ou conversas. A guarda e os pedidos de eliminação seguem a legislação de proteção de dados.

### Privacidade e uso responsável
Cada conta acessa seus próprios dados. O serviço trata informações necessárias à execução do contrato e à operação das ferramentas. O salvamento de conversas da Íris depende da preferência específica da conta. Não compartilhe dados sigilosos de terceiros sem autorização. A IA pode produzir erros e deve apoiar, e não substituir, a revisão humana. Não há garantia de emprego, renda ou aprovação em processos seletivos. Publicidade com imagem ou depoimento exige autorização opcional separada.

### Direitos e atendimento
Os sete dias de teste não substituem nem reduzem o direito legal de arrependimento das contratações à distância. Aplicam-se o artigo 49 do Código de Defesa do Consumidor e os demais direitos previstos em lei. Solicitações de arrependimento, estorno e privacidade podem ser feitas pelos canais oficiais publicados em somamentoria.com.

### Registro da contratação
O aceite registra a conta, a versão, a data e os produtos escolhidos. O preço, a composição e os pagamentos permanecem vinculados ao pedido. Este documento vale para a nova contratação e não altera contratos anteriores.

### Oferta de recuperação aceita
Esta oferta pode ser confirmada uma única vez por conta, após o término do teste gratuito, dentro do prazo real de quinze minutos. O prazo para confirmar não reinicia ao atualizar a página. Após a confirmação no prazo, é possível concluir a autorização no Mercado Pago.

Somente a primeira mensalidade do software tem preço reduzido: módulo avulso R$ 19,90, Essencial R$ 27,90 ou Pro R$ 55,90. As seguintes custam R$ 24,90, R$ 34,90 ou R$ 69,90, respectivamente. Os agentes opcionais mantêm seu preço integral desde a primeira cobrança. O total inicial e o total recorrente são exibidos antes do aceite. Não há novo período gratuito. Mentoria, kit e encontros extras não participam desta oferta.');
insert into public.termos_versoes(versao,titulo,conteudo_markdown,ativo) values ('carreira-2026-10-24','Contrato de contratação SOMA Carreira','## SOMA Carreira

### Produto e vigência
O plano contratado é um programa de acompanhamento humano de carreira. A modalidade, o prazo, o valor total, a forma de pagamento e a quantidade de parcelas são os apresentados no checkout e registrados no pedido. Parcelamento do preço de um programa não é assinatura mensal do software. O pagamento depende de confirmação pelo Mercado Pago.

### O que está incluído
Nos planos atuais SOMA Carreira estão incluídos portal, ferramentas de carreira, encontros coletivos, um encontro individual por mês, Copiloto e acompanhamento no WhatsApp, conforme a modalidade contratada e os agendamentos disponíveis. Esses itens não devem ser cobrados novamente como adicionais do SaaS. Direitos de contratos anteriores permanecem conforme o documento originalmente aceito.

### Adicionais opcionais
O kit de onboarding e os encontros individuais além de um por mês são opcionais e exigem contratação específica. Nos pacotes atuais de seis meses, dois encontros individuais por mês acrescentam R$ 179,90 ao pacote e três encontros por mês acrescentam R$ 227,99. Nos pacotes de doze meses, os acréscimos totais são R$ 359,80 e R$ 455,98. Esses acréscimos são totais do pacote, não preços mensais. Quatro ou mais encontros por mês dependem de proposta expressamente aceita. O kit opcional custa R$ 189,90, em compra única. Valores adicionais somente integram o contrato quando discriminados na proposta e no pedido.

### Encontros, cancelamento e pausa
Os encontros exigem agendamento. Reagendamentos, faltas e pedidos de cancelamento serão tratados pelos canais oficiais e pelas condições efetivamente contratadas, respeitados os direitos do consumidor. A pausa voluntária é disponível para planos pagos ativos com vencimento registrado, de um a sessenta dias corridos, com limite acumulado de sessenta dias por ciclo contratado. O teste gratuito não permite pausa. A contagem segue Brasília. A participação e os lembretes usuais ficam suspensos, com histórico e conquistas preservados. Os dias efetivamente pausados prorrogam o vencimento, e a pessoa pode retomar antes do previsto. O retorno programado ocorre automaticamente na data registrada. A pausa exige confirmação na solicitação. Ela não interrompe automaticamente as parcelas no provedor. Nenhuma mudança contratual apaga atividades ou respostas já registradas.

### Uso, confidencialidade e dados
O acesso é pessoal. Não é permitido divulgar dados privados de outros participantes, compartilhar credenciais ou redistribuir materiais proprietários sem autorização. Os dados são usados para prestar o serviço, manter os registros da contratação e cumprir obrigações legais. O uso de imagem, voz e depoimentos para publicidade depende de autorização específica e opcional, sem ser condição para contratar. Resultados de carreira e recolocação não são garantidos. Respostas de IA devem ser revisadas antes de uso profissional.

### Direitos e atendimento
O teste gratuito, quando oferecido, é diferente do direito legal de arrependimento. Nas contratações à distância, aplicam-se os direitos do artigo 49 do Código de Defesa do Consumidor, inclusive o prazo legal de sete dias e a devolução dos valores nas hipóteses previstas em lei. Pedidos de cancelamento, arrependimento, correção ou acesso aos dados podem ser encaminhados pelos canais oficiais publicados em somamentoria.com. Nenhuma cláusula limita direitos legais do consumidor.

### Registro do aceite
Ao confirmar a contratação, a pessoa aceita esta versão e as condições comerciais selecionadas. A conta, o pedido, a versão e a data do aceite ficam registrados. Esse aceite não substitui, altera ou elimina documentos e direitos anteriormente constituídos.',false);
