-- SOMA Modular (2026-10): catálogo e direitos financeiros INDEPENDENTES.
-- Não altera profiles, planos_mentoria, mp_pedidos ou processar_mp_pagamento.
-- A ativação da cobrança e o bloqueio por módulo são opt-in, configurados pela administração.

CREATE TABLE IF NOT EXISTS public.soma_modules (
 slug text PRIMARY KEY CHECK(slug ~ '^[a-z][a-z0-9-]{2,63}$'),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 120),
 description text,
 route_path text NOT NULL CHECK(left(route_path,1)='/'),
 monthly_price numeric(10,2) CHECK(monthly_price IS NULL OR (monthly_price>=5 AND monthly_price<=10000)),
 currency char(3) NOT NULL DEFAULT 'BRL' CHECK(currency='BRL'),
 enabled boolean NOT NULL DEFAULT true,
 purchasable boolean NOT NULL DEFAULT false,
 enforce_access boolean NOT NULL DEFAULT false,
 display_order int NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT priced_before_sale CHECK(NOT purchasable OR (monthly_price IS NOT NULL AND enforce_access AND enabled))
);

CREATE TABLE IF NOT EXISTS public.soma_module_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
 module_slug text NOT NULL REFERENCES public.soma_modules(slug) ON DELETE RESTRICT,
 amount numeric(10,2) NOT NULL CHECK(amount>=5 AND amount<=10000),
 currency char(3) NOT NULL DEFAULT 'BRL' CHECK(currency='BRL'),
 provider text NOT NULL DEFAULT 'mercadopago' CHECK(provider='mercadopago'),
 provider_subscription_id text UNIQUE,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','AUTHORIZED','ACTIVE','PAST_DUE','CANCELED','EXPIRED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.soma_module_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL UNIQUE REFERENCES public.soma_module_orders(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
 module_slug text NOT NULL REFERENCES public.soma_modules(slug) ON DELETE RESTRICT,
 provider text NOT NULL DEFAULT 'mercadopago' CHECK(provider='mercadopago'),
 provider_subscription_id text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACTIVE','PAST_DUE','CANCELED','EXPIRED')),
 started_at timestamptz NOT NULL DEFAULT now(),
 paid_through timestamptz,
 last_paid_at timestamptz,
 last_paid_payment_id text,
 canceled_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status<>'ACTIVE' OR paid_through IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS soma_module_subs_user_module ON public.soma_module_subscriptions(user_id,module_slug,status,paid_through DESC);
CREATE INDEX IF NOT EXISTS soma_module_subs_order ON public.soma_module_subscriptions(order_id);

-- Histórico de cada pagamento. Reentregas do webhook não criam direitos adicionais.
CREATE TABLE IF NOT EXISTS public.soma_module_payment_events (
 payment_id text PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES public.soma_module_orders(id) ON DELETE RESTRICT,
 status text NOT NULL,
 amount numeric(10,2) NOT NULL,
 currency text NOT NULL DEFAULT 'BRL',
 approved_at timestamptz,
 processed_at timestamptz NOT NULL DEFAULT now()
);

-- Acesso manual/cortesia por módulo, SEM modificar a assinatura financeira.
CREATE TABLE IF NOT EXISTS public.soma_user_module_access (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 module_slug text NOT NULL REFERENCES public.soma_modules(slug) ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','CANCELED','EXPIRED')),
 starts_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at IS NULL OR expires_at>starts_at)
);
CREATE INDEX IF NOT EXISTS soma_module_grants_user ON public.soma_user_module_access(user_id,module_slug,status,expires_at);

-- Somente direitos próprios são legíveis. Nenhum usuário comum escreve em preços,
-- assinaturas, pagamentos, concessões ou eventos.
ALTER TABLE public.soma_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soma_module_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soma_module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soma_module_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soma_user_module_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.soma_modules,public.soma_module_orders,public.soma_module_subscriptions,
 public.soma_module_payment_events,public.soma_user_module_access FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.soma_modules TO authenticated,anon;
GRANT SELECT ON public.soma_module_orders,public.soma_module_subscriptions,
 public.soma_user_module_access TO authenticated;
GRANT ALL ON public.soma_modules,public.soma_module_orders,public.soma_module_subscriptions,
 public.soma_module_payment_events,public.soma_user_module_access TO service_role;

CREATE POLICY soma_modules_visible ON public.soma_modules
 FOR SELECT TO authenticated,anon USING(enabled);
CREATE POLICY soma_orders_own ON public.soma_module_orders
 FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY soma_subscriptions_own ON public.soma_module_subscriptions
 FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY soma_access_own ON public.soma_user_module_access
 FOR SELECT TO authenticated USING(user_id=auth.uid());

INSERT INTO public.soma_modules(slug,title,description,route_path,display_order) VALUES
('autoconhecimento','Mapa Quem Sou Eu','Autoconhecimento e síntese de carreira.','/quem-sou-eu',10),
('diagnostico','Diagnóstico & Perfil','Análise de perfil, forças e autoconhecimento.','/exercicios',20),
('percepcao-360','Percepção 360','Avaliação de percepções e oportunidades de desenvolvimento.','/percepcao-360',30),
('curriculo-ats','Currículo & ATS','Currículo, triagem ATS e ferramentas de análise.','/carreira?etapa=cv',40),
('linkedin','LinkedIn estratégico','Posicionamento profissional e conteúdo.','/linkedin',50),
('entrevistas','Entrevistas & simulações','Preparação e simulações de entrevistas.','/carreira?etapa=entrevista',60),
('desenvolvimento','PDI & crescimento','Plano de desenvolvimento e evolução profissional.','/meu-pdi',70),
('networking','Rede & oportunidades','Networking e desenvolvimento de conexões profissionais.','/network',80),
('vagas','Vagas & candidaturas','Gestão de candidaturas e oportunidades.','/carreira?etapa=vagas',90)
ON CONFLICT(slug) DO NOTHING;

-- Autoriza somente o usuário da sessão atual, com exceção de service_role do
-- servidor. Não interpreta status_assinatura='ativo' sem plano como Mentoria.
CREATE OR REPLACE FUNCTION public.soma_can_access_module_for(p_user uuid,p_slug text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_profile public.profiles%rowtype;
 v_mod public.soma_modules%rowtype;
 v_hoje date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF p_user IS NULL OR p_slug IS NULL THEN RETURN false; END IF;
 IF coalesce(auth.role(),'')<>'service_role' AND auth.uid() IS DISTINCT FROM p_user
   THEN RAISE EXCEPTION 'Não autorizado para consultar acesso de terceiros' USING errcode='42501'; END IF;
 SELECT * INTO v_mod FROM public.soma_modules WHERE slug=p_slug AND enabled;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO v_profile FROM public.profiles WHERE id=p_user;
 IF NOT FOUND THEN RETURN false; END IF;
 IF v_profile.is_admin THEN RETURN true; END IF;
 IF v_profile.plano_id IS NOT NULL AND v_profile.status_assinatura='ativo'
  AND (v_profile.data_fim_acesso IS NULL OR v_profile.data_fim_acesso>=v_hoje)
  AND NOT EXISTS (SELECT 1 FROM public.mentoria_pausas p
     WHERE p.user_id=p_user AND p.status='ativa')
  THEN RETURN true; END IF;
 -- Compatibilidade: trial de 7 dias continua com experiência completa.
 IF v_profile.trial_status='active' AND v_profile.trial_ends_at>now()
  THEN RETURN true; END IF;
 -- Migração gradual: módulos antigos permanecem disponíveis até ativação do gate.
 IF NOT v_mod.enforce_access THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.soma_user_module_access a
   WHERE a.user_id=p_user AND a.module_slug=p_slug AND a.status='ACTIVE'
    AND a.starts_at<=now() AND (a.expires_at IS NULL OR a.expires_at>now()))
  THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.soma_module_subscriptions s
   WHERE s.user_id=p_user AND s.module_slug=p_slug AND s.status='ACTIVE'
    AND s.paid_through>now())
  THEN RETURN true; END IF;
 RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.soma_can_access_module_for(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.soma_can_access_module_for(uuid,text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.soma_has_module(p_slug text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.soma_can_access_module_for(auth.uid(),p_slug);
$$;
REVOKE ALL ON FUNCTION public.soma_has_module(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.soma_has_module(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.soma_has_paid_module()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(
  SELECT 1 FROM public.soma_module_subscriptions s
  JOIN public.soma_modules m ON m.slug=s.module_slug
  WHERE s.user_id=auth.uid() AND m.enabled AND s.status='ACTIVE' AND s.paid_through>now()
 ) OR EXISTS(
  SELECT 1 FROM public.soma_user_module_access a
  JOIN public.soma_modules m ON m.slug=a.module_slug
  WHERE a.user_id=auth.uid() AND m.enabled AND a.status='ACTIVE'
    AND a.starts_at<=now() AND (a.expires_at IS NULL OR a.expires_at>now())
 );
$$;
REVOKE ALL ON FUNCTION public.soma_has_paid_module() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.soma_has_paid_module() TO authenticated;

-- Chamado somente pelo servidor após validação HMAC + GET da API oficial MP.
-- Unifica entrega de assinatura, renovação, pagamento recusado, estorno e
-- reprocessamento fora de ordem. Não aceita dados de preços do navegador.
CREATE OR REPLACE FUNCTION public.soma_process_module_payment(
 p_order uuid,p_preapproval_id text,p_payment_id text,p_status text,
 p_amount numeric,p_currency text,p_paid_at timestamptz DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_order public.soma_module_orders%rowtype;
 v_sub public.soma_module_subscriptions%rowtype;
 v_prev public.soma_module_payment_events%rowtype;
 v_approved timestamptz;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN
   RAISE EXCEPTION 'Somente backend' USING errcode='42501';
 END IF;
 SELECT * INTO v_order FROM public.soma_module_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RETURN 'unknown_order'; END IF;
 IF p_preapproval_id IS DISTINCT FROM v_order.provider_subscription_id THEN
   RAISE EXCEPTION 'Assinatura do pedido divergente';
 END IF;
 IF p_amount IS DISTINCT FROM v_order.amount OR p_currency IS DISTINCT FROM 'BRL' THEN
   RAISE EXCEPTION 'Valor ou moeda divergente';
 END IF;
 IF length(coalesce(p_payment_id,''))<1 OR p_status IS NULL THEN RAISE EXCEPTION 'Pagamento inválido'; END IF;
 SELECT * INTO v_prev FROM public.soma_module_payment_events WHERE payment_id=p_payment_id FOR UPDATE;
 IF FOUND AND v_prev.order_id<>p_order THEN RAISE EXCEPTION 'Pagamento de outro pedido'; END IF;
 IF FOUND AND v_prev.status=p_status THEN RETURN 'duplicated'; END IF;
 -- Estados terminais de um pagamento não retornam a APPROVED após estorno.
 IF FOUND AND v_prev.status IN ('refunded','charged_back') THEN RETURN 'stale_payment'; END IF;
 INSERT INTO public.soma_module_payment_events(payment_id,order_id,status,amount,currency,approved_at)
 VALUES(p_payment_id,p_order,p_status,p_amount,p_currency,p_paid_at)
 ON CONFLICT(payment_id) DO UPDATE SET status=excluded.status,
  approved_at=coalesce(excluded.approved_at,public.soma_module_payment_events.approved_at),
  processed_at=now();
 SELECT * INTO v_sub FROM public.soma_module_subscriptions
 WHERE order_id=p_order FOR UPDATE;
 IF NOT FOUND THEN
   INSERT INTO public.soma_module_subscriptions
   (order_id,user_id,module_slug,provider_subscription_id)
   VALUES(p_order,v_order.user_id,v_order.module_slug,p_preapproval_id)
   RETURNING * INTO v_sub;
 END IF;
 IF v_sub.status IN ('CANCELED','EXPIRED') THEN RETURN 'subscription_closed'; END IF;
 IF p_status='approved' THEN
  v_approved:=coalesce(p_paid_at,now());
  IF v_approved>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Data futura'; END IF;
  -- Não estende recorrência por repetição do mesmo evento ou notificações
  -- antigas e atrasadas. Cada pagamento cobre até sua data + 1 mês.
  IF v_sub.last_paid_at IS NULL OR v_approved>=v_sub.last_paid_at THEN
    UPDATE public.soma_module_subscriptions SET status='ACTIVE',
      paid_through=greatest(coalesce(paid_through,'epoch'::timestamptz),v_approved+interval '1 month'),
      last_paid_at=v_approved,last_paid_payment_id=p_payment_id,updated_at=now()
    WHERE id=v_sub.id;
    UPDATE public.soma_module_orders SET status='ACTIVE',updated_at=now() WHERE id=p_order;
  END IF;
 ELSIF p_status IN ('refunded','charged_back') THEN
  IF v_sub.last_paid_payment_id=p_payment_id THEN
    UPDATE public.soma_module_subscriptions SET status='PAST_DUE',paid_through=now(),updated_at=now() WHERE id=v_sub.id;
    UPDATE public.soma_module_orders SET status='PAST_DUE',updated_at=now() WHERE id=p_order;
  END IF;
 ELSIF p_status IN ('rejected','cancelled') THEN
  IF v_sub.last_paid_at IS NULL OR coalesce(p_paid_at,now())>=v_sub.last_paid_at THEN
    UPDATE public.soma_module_subscriptions SET status='PAST_DUE',updated_at=now() WHERE id=v_sub.id;
    UPDATE public.soma_module_orders SET status='PAST_DUE',updated_at=now() WHERE id=p_order;
  END IF;
 END IF;
 RETURN 'processed';
END;
$$;
REVOKE ALL ON FUNCTION public.soma_process_module_payment(uuid,text,text,text,numeric,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.soma_process_module_payment(uuid,text,text,text,numeric,text,timestamptz) TO service_role;

-- Preapproval pendente/authorized NUNCA concede acesso. Uma assinatura
-- cancelada ou pausada perde o direito, sem afetar outros módulos ou mentoria.
CREATE OR REPLACE FUNCTION public.soma_sync_module_preapproval(
 p_order uuid,p_preapproval_id text,p_mp_status text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_order public.soma_module_orders%rowtype;
 v_status text;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Somente backend' USING errcode='42501'; END IF;
 SELECT * INTO v_order FROM public.soma_module_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR v_order.provider_subscription_id IS DISTINCT FROM p_preapproval_id THEN
   RAISE EXCEPTION 'Assinatura não corresponde ao pedido';
 END IF;
 IF p_mp_status IN ('cancelled','canceled') THEN v_status:='CANCELED';
 ELSIF p_mp_status='paused' THEN v_status:='PAST_DUE';
 ELSIF p_mp_status IN ('pending','authorized') THEN v_status:='AUTHORIZED';
 ELSE RETURN 'ignored_status'; END IF;
 IF v_status='CANCELED' THEN
  UPDATE public.soma_module_subscriptions SET status='CANCELED',canceled_at=now(),updated_at=now()
   WHERE order_id=p_order AND status NOT IN ('CANCELED','EXPIRED');
  UPDATE public.soma_module_orders SET status='CANCELED',updated_at=now() WHERE id=p_order;
 ELSIF v_status='PAST_DUE' THEN
  UPDATE public.soma_module_subscriptions SET status='PAST_DUE',updated_at=now()
   WHERE order_id=p_order AND status IN ('PENDING','ACTIVE','PAST_DUE');
  UPDATE public.soma_module_orders SET status='PAST_DUE',updated_at=now()
   WHERE id=p_order AND status NOT IN ('CANCELED','EXPIRED');
 ELSE
  -- Estado de autorização não significa pagamento. Não reativa cobrança falha.
  UPDATE public.soma_module_orders SET status='AUTHORIZED',updated_at=now()
    WHERE id=p_order AND status='PENDING';
 END IF;
 RETURN 'processed';
END;
$$;
REVOKE ALL ON FUNCTION public.soma_sync_module_preapproval(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.soma_sync_module_preapproval(uuid,text,text) TO service_role;
