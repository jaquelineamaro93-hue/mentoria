-- Trial growth: atomic dispatch claims + self-service marketing opt-out.
CREATE TABLE IF NOT EXISTS public.trial_growth_opt_out (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 opted_out_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.trial_growth_dispatches (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 stage text NOT NULL CHECK (stage IN ('d3','d1','d0','p2')),
 status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','sent')),
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 PRIMARY KEY (user_id,stage)
);
ALTER TABLE public.trial_growth_opt_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_growth_dispatches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trial_growth_opt_out FROM anon,authenticated;
REVOKE ALL ON public.trial_growth_dispatches FROM anon,authenticated;
-- Server-only service role access; no public-facing write policies.
