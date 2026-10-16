-- Permite importar transcrições da Íris hospedada na TopSend
-- sem representar as mensagens como eventos autenticados da API da TopSend.
-- As 10 mensagens antigas (WhatsApp Business) continuam inalteradas.
ALTER TABLE public.iris_mensagens_importadas
 DROP CONSTRAINT IF EXISTS iris_mensagens_importadas_canal_check;
ALTER TABLE public.iris_mensagens_importadas
 ADD CONSTRAINT iris_mensagens_importadas_canal_check
 CHECK (canal IN ('whatsapp_business','topsend'));
ALTER TABLE public.iris_mensagens_importadas
 DROP CONSTRAINT IF EXISTS iris_mensagens_importadas_registrado_por_check;
ALTER TABLE public.iris_mensagens_importadas
 ADD CONSTRAINT iris_mensagens_importadas_registrado_por_check
 CHECK (registrado_por IN ('transcricao_administradora','importacao_manual_topsend'));
CREATE INDEX IF NOT EXISTS iris_importadas_topsend_historico_idx
 ON public.iris_mensagens_importadas(user_id,ocorrido_em DESC)
 WHERE canal='topsend';
