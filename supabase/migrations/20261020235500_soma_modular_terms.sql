-- Aceite separado da contratação da Mentoria. Nunca considerar
-- uma ação genérica no portal como consentimento de cobrança recorrente.
ALTER TABLE public.soma_module_orders
 ADD COLUMN IF NOT EXISTS terms_version text,
 ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.soma_module_orders
 ADD CONSTRAINT soma_module_orders_explicit_consent CHECK(
   terms_version='modular-1.0' AND terms_accepted_at IS NOT NULL
 );
