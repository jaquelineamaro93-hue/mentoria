-- Conteúdos do acompanhamento humano continuam exclusivos da Mentoria,
-- sem afetar o acesso ao conteúdo individual dos módulos vendidos.
CREATE POLICY soma_journal_mentorship_only ON public.journal_notes
 AS RESTRICTIVE FOR ALL TO authenticated
 USING(public.soma_has_mentorship_entitlement())
 WITH CHECK(public.soma_has_mentorship_entitlement());
CREATE POLICY soma_feedback_mentorship_only ON public.feedback_sessoes
 AS RESTRICTIVE FOR ALL TO authenticated
 USING(public.soma_has_mentorship_entitlement())
 WITH CHECK(public.soma_has_mentorship_entitlement());
