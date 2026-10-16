# Integração Íris SOMA: conversas e histórico

Manus/Cue e WhatsApp são canais distintos. A conexão Manus apenas identifica a Íris. Agora a SOMA suporta dois transportes opcionais: **TopSend via gatilho de automação Webhook** (fluxo do parceiro, com número já em coexistência) e Meta WhatsApp Cloud API (legado). O canal escolhido precisa ser configurado e testado antes de qualquer disparo.

Para detalhes e payloads da TopSend, veja [SOMA + TopSend: webhook de automações](./soma-topsend-webhook-integracao.md).

## Segredos privados na Vercel
MANUS_API_KEY, MANUS_AGENT_ID, IRIS_AUTOMATION_ENABLED, TOPSEND_AUTOMATION_WEBHOOK_URL, TOPSEND_AUTOMATION_ENABLED, TOPSEND_INBOUND_SECRET (apenas se a TopSend oferecer retorno HTTP). O canal Meta legado usa WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN. Opcional: WHATSAPP_TEMPLATE_NAME, previamente aprovado na Meta e com um parâmetro de corpo para o primeiro nome.

Webhook HTTPS da Meta (somente se usar o canal Meta): https://somamentoria.com/api/webhooks/whatsapp. Configurar evento messages. Assinatura HMAC-SHA256 obrigatória. Acesso ao número depende de onboarding/coexistência oficial, não apenas do WhatsApp Business no celular.

## Histórico, consentimento e limites
- Consentimento de IA separado no perfil: profiles.iris_ia_consentimento_em, inicialmente nulo para todas as pessoas; além da autorização WhatsApp. Pode cancelar no perfil, com PARAR ou pela administração.
- Mensagens recebidas: whatsapp_respostas_mentoria (Meta) ou topsend_eventos_recebidos (TopSend). Turnos e estados: iris_turnos e iris_estado. Saídas efetivas: iris_mensagens_enviadas. Evolução e próximos passos: iris_proximos_passos.
- O atendimento só considera a resposta da Íris quando o marcador do turno coincide. Um único turno por vez é enviado à tarefa Manus compartilhada. Dados minimizados e sem e-mail, telefone nem CPF; não encaminhar Mapa Quem Sou Eu completo ou relatos íntimos.
- O agente não pode enviar respostas se faltar consentimento, elegibilidade, canal configurado (TopSend ou Meta) ou janela de atendimento. Resposta textual usa janela conservadora de 23 horas da última mensagem do usuário. Fora dela, somente template aprovado.
- Para convites semanais é necessário template Meta aprovado e intervalo de pelo menos sete dias. O cron diário é recuperação; novos webhooks processam em segundo plano.
- Se o status externo for incerto, não reenviar automaticamente: marcar revisão e evitar duplicidade. Um HTTP 2xx da TopSend apenas aciona a automação, não confirma entrega no WhatsApp.
- Nenhum dos serviços envia mensagens só por receber a chave Manus. Validar com número de teste Meta antes de ativar para outras pessoas.

API Manus: https://open.manus.ai/docs/v2/agents-overview
API WhatsApp: https://developers.facebook.com/docs/whatsapp/cloud-api/
